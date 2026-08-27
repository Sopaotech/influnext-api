import { mpPayment, mpPreference, mpPreApproval } from '../lib/mercadopago';
import { prisma } from '../lib/prisma';
import { QuickAlertService } from './quick-alert.service';

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
  return url.replace(/\/v1\/?$/, '');
};

export interface CreatePixResult {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
  totalAmount: number;
  feeAmount: number;
  feePercent: number;
  expiresAt?: string;
}

export class MercadoPagoService {
  /**
   * Gera cobrança PIX instantânea para depósito de garantia SafePay (Escrow).
   */
  static async createContractPix(contractId: string, payerEmail: string): Promise<CreatePixResult> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        company: { include: { user: true } },
        influencer: { include: { user: true } }
      }
    });

    if (!contract) {
      throw new Error('Contrato não encontrado.');
    }

    if (!contract.influencerSigned) {
      throw new Error('O contrato precisa ser aceito e assinado pelo influenciador antes do pagamento.');
    }

    // Calcula a taxa de intermediação SafePay (FREE = 15%, PRO/MASTER = 7%)
    const feeRate = contract.successFeeRate ?? 0.15;
    const feeAmount = Number((contract.budget * feeRate).toFixed(2));
    const totalAmount = Number((contract.budget + feeAmount).toFixed(2));
    const feePercent = Math.round(feeRate * 100);

    const email = payerEmail || contract.company?.user?.email || 'financeiro@influnext.com.br';

    try {
      const response = await mpPayment.create({
        body: {
          transaction_amount: totalAmount,
          description: `InfluNext SafePay: ${contract.title.slice(0, 50)} (Cachê R$ ${contract.budget.toFixed(2)} + ${feePercent}% taxa)`,
          payment_method_id: 'pix',
          payer: {
            email: email,
            first_name: contract.company?.companyName || 'Empresa',
          },
          notification_url: `${getBackendUrl()}/v1/webhooks/mercadopago`,
          metadata: {
            contract_id: contract.id,
            type: 'contract_escrow'
          }
        }
      });

      const paymentData = response as any;
      const pointOfInteraction = paymentData.point_of_interaction?.transaction_data;

      const qrCode = pointOfInteraction?.qr_code || '';
      const qrCodeBase64 = pointOfInteraction?.qr_code_base64 || '';
      const ticketUrl = pointOfInteraction?.ticket_url || '';
      const paymentId = String(paymentData.id);

      // Salva no banco de dados para conciliação
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          mpPaymentId: paymentId,
          mpPixQrCode: qrCode,
          mpPixQrCodeBase64: qrCodeBase64,
          escrowStatus: 'PENDING_PAYMENT'
        }
      });

      console.log(`[MERCADO PAGO] ✅ PIX SafePay gerado para o contrato ${contractId} (Payment ID: ${paymentId})`);

      return {
        paymentId,
        qrCode,
        qrCodeBase64,
        ticketUrl,
        totalAmount,
        feeAmount,
        feePercent,
        expiresAt: paymentData.date_of_expiration
      };
    } catch (error: any) {
      console.error('[MERCADO PAGO] ❌ Erro ao gerar PIX:', error?.message || error);
      throw new Error(`Falha ao gerar PIX no Mercado Pago: ${error?.message || 'Erro de comunicação.'}`);
    }
  }

  /**
   * Gera preferência de pagamento (Cartão de Crédito / Checkout Pro).
   */
  static async createContractPreference(contractId: string, payerEmail: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        company: { include: { user: true } },
        influencer: { include: { user: true } }
      }
    });

    if (!contract) {
      throw new Error('Contrato não encontrado.');
    }

    if (!contract.influencerSigned) {
      throw new Error('O contrato precisa ser assinado pelo influenciador antes do pagamento.');
    }

    const feeRate = contract.successFeeRate ?? 0.15;
    const feeAmount = Number((contract.budget * feeRate).toFixed(2));
    const totalAmount = Number((contract.budget + feeAmount).toFixed(2));
    const feePercent = Math.round(feeRate * 100);

    const email = payerEmail || contract.company?.user?.email || 'financeiro@influnext.com.br';

    try {
      const response = await mpPreference.create({
        body: {
          items: [
            {
              id: contract.id,
              title: `InfluNext SafePay: ${contract.title}`,
              description: `Custódia segura SafePay (Cachê R$ ${contract.budget.toFixed(2)} + ${feePercent}% taxa)`,
              quantity: 1,
              unit_price: totalAmount,
              currency_id: 'BRL',
            }
          ],
          payer: {
            email: email,
          },
          back_urls: {
            success: `${getFrontendUrl()}/dashboard/contracts/${contractId}?payment=success`,
            failure: `${getFrontendUrl()}/dashboard/contracts/${contractId}/pay?error=payment_failed`,
            pending: `${getFrontendUrl()}/dashboard/contracts/${contractId}?payment=pending`,
          },
          auto_return: 'approved',
          notification_url: `${getBackendUrl()}/v1/webhooks/mercadopago`,
          metadata: {
            contract_id: contract.id,
            type: 'contract_escrow'
          }
        }
      });

      const preference = response as any;

      await prisma.contract.update({
        where: { id: contractId },
        data: {
          mpPreferenceId: preference.id,
          escrowStatus: 'PENDING_PAYMENT'
        }
      });

      console.log(`[MERCADO PAGO] ✅ Preferência de checkout gerada para o contrato ${contractId} (Pref ID: ${preference.id})`);

      return {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        totalAmount,
        feeAmount,
        feePercent
      };
    } catch (error: any) {
      console.error('[MERCADO PAGO] ❌ Erro ao criar preferência de pagamento:', error?.message || error);
      throw new Error(`Falha ao criar checkout de cartão no Mercado Pago: ${error?.message || 'Erro de comunicação.'}`);
    }
  }

  /**
   * Consulta o status síncrono de um pagamento pelo ID no Mercado Pago.
   */
  static async getPaymentStatus(paymentId: string) {
    try {
      const response = await mpPayment.get({ id: paymentId });
      const payment = response as any;

      return {
        id: String(payment.id),
        status: payment.status, // "approved" | "pending" | "in_process" | "rejected"
        statusDetail: payment.status_detail,
        isApproved: payment.status === 'approved',
        transactionAmount: payment.transaction_amount,
        paymentMethod: payment.payment_method_id,
        metadata: payment.metadata
      };
    } catch (error: any) {
      console.error(`[MERCADO PAGO] ❌ Erro ao consultar pagamento ${paymentId}:`, error?.message || error);
      throw new Error(`Erro ao consultar status no Mercado Pago: ${error?.message || 'Falha de comunicação'}`);
    }
  }

  /**
   * Cria uma assinatura recorrente de plano SaaS (Creator Premium R$ 59,90 ou Company Premium R$ 120,00)
   */
  static async createSubscription(userId: string, planId: string, userEmail: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new Error('Plano não encontrado.');
    }

    try {
      const response = await mpPreApproval.create({
        body: {
          reason: `InfluNext - Assinatura ${plan.name}`,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: plan.price,
            currency_id: 'BRL',
          },
          payer_email: userEmail,
          back_url: `${getFrontendUrl()}/dashboard/subscription?status=success`,
          status: 'authorized',
        }
      });

      const preapproval = response as any;

      return {
        preapprovalId: preapproval.id,
        initPoint: preapproval.init_point,
      };
    } catch (error: any) {
      console.error('[MERCADO PAGO] ❌ Erro ao criar assinatura recorrente:', error?.message || error);
      throw new Error(`Falha ao criar assinatura no Mercado Pago: ${error?.message || 'Erro de comunicação.'}`);
    }
  }

  /**
   * Processa a notificação de pagamento aprovado recebida pelo Webhook ou consulta síncrona.
   */
  static async handlePaymentApproved(paymentId: string) {
    const statusData = await this.getPaymentStatus(paymentId);

    if (!statusData.isApproved) {
      console.log(`[MERCADO PAGO] Pagamento ${paymentId} ainda está com status '${statusData.status}'. Nenhuma ação tomada.`);
      return { approved: false, status: statusData.status };
    }

    const metadata = statusData.metadata || {};
    const contractId = metadata.contract_id || metadata.contractId;

    if (contractId) {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { influencer: { include: { user: true } }, company: { include: { user: true } } }
      });

      if (!contract) {
        console.warn(`[MERCADO PAGO] Contrato ${contractId} associado ao pagamento ${paymentId} não foi encontrado.`);
        return { approved: true, processed: false };
      }

      if (contract.escrowStatus !== 'IN_PROGRESS') {
        await prisma.contract.update({
          where: { id: contractId },
          data: {
            escrowStatus: 'IN_PROGRESS',
            externalTxId: paymentId
          }
        });

        // Dispara notificação multicanal (Push FCM, WhatsApp, In-App)
        await QuickAlertService.notifyEscrowConfirmed({
          recipientUserId: contract.influencer.userId,
          contractTitle: contract.title,
          netAmount: Number(contract.netAmount || contract.budget),
          contractId: contract.id
        });

        console.log(`[MERCADO PAGO] 🎉 Contrato ${contractId} ativado com sucesso! Escrow IN_PROGRESS.`);
      }

      return { approved: true, processed: true, contractId };
    }

    return { approved: true, processed: false };
  }
}
