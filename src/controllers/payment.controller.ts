import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { stripe } from '../lib/stripe';
import { QuickAlertService } from '../services/quick-alert.service';
import Stripe from 'stripe';
import { UserRole } from '../types/roles';

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://influnext.com.br';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

const getCompanyOwnedContractWhere = (contractId: string, userId: string) => ({
  id: contractId,
  company: { userId }
});

export class PaymentController {
  /**
   * POST /v1/payments/create-checkout-session
   * Cria uma sessão de checkout para assinatura do plano PRO
   */
  static async createCheckoutSession(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { planId } = req.body;

      if (!planId) return res.status(400).json({ error: 'planId é obrigatório' });

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan || !plan.externalId) {
        return res.status(404).json({ error: 'Plano não encontrado ou sem ID da Stripe' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

      // Garante que o usuário tem um Customer ID na Stripe
      if (!stripe) {
        return res.status(500).json({ error: 'Serviço de pagamentos não configurado.' });
      }

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id }
        });
        stripeCustomerId = customer.id;
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId }
        });
      }

      // Cria a sessão de checkout
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.externalId, // O externalId deve ser o Price ID da Stripe
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${getFrontendUrl()}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getFrontendUrl()}/dashboard/subscription`,
        metadata: {
          userId: user.id,
          planId: plan.id
        }
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error('[STRIPE] Erro ao criar checkout session:', error);
      return res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
  }

  /**
   * POST /v1/payments/create-contract-checkout
   * Cria uma sessão de checkout para pagamento de contrato (Escrow)
   */
  static async createContractCheckoutSession(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { contractId } = req.body;

      if (!contractId) return res.status(400).json({ error: 'contractId é obrigatório' });

      if (userRole !== UserRole.COMPANY) {
        return res.status(403).json({ error: 'Apenas a empresa responsável pelo contrato pode iniciar o pagamento.' });
      }

      const contract = await prisma.contract.findFirst({
        where: getCompanyOwnedContractWhere(contractId, userId),
        include: { company: { include: { user: true } } }
      });

      if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });

      if (!contract.influencerSigned) {
        return res.status(400).json({ error: 'O contrato precisa ser aceito e assinado eletronicamente pelo influenciador antes de efetuar o pagamento.' });
      }

      // Usa a taxa já calculada e salva no contrato (via fees.ts em createContract)
      // FREE creators = 15%, Premium creators = 7%
      const feeRate = contract.successFeeRate ?? 0.15;
      const totalAmount = contract.budget + (contract.budget * feeRate);
      const amountInCents = Math.round(totalAmount * 100);
      const feePercent = Math.round(feeRate * 100);

      if (!stripe) {
        return res.status(500).json({ error: 'Serviço de pagamentos não configurado.' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'pix'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: `Contrato: ${contract.title}`,
                description: `Pagamento em Escrow (Cachê R$ ${contract.budget.toFixed(2)} + ${feePercent}% taxa de intermediação R$ ${(contract.budget * feeRate).toFixed(2)})`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${getFrontendUrl()}/dashboard/contracts/${contractId}?payment=success`,
        cancel_url: `${getFrontendUrl()}/dashboard/contracts/${contractId}/pay`,
        metadata: {
          contractId: contract.id,
          type: 'contract_escrow'
        }
      });

      // Atualizar contrato com o ID da sessão
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          externalTxId: session.id,
          escrowStatus: 'PENDING_PAYMENT'
        }
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error('[STRIPE] Erro ao criar contract checkout session:', error);
      return res.status(500).json({ error: 'Erro ao gerar pagamento' });
    }
  }

  /**
   * POST /v1/payments/create-payment-intent
   * Cria um PaymentIntent para contratos (Escrow)
   */
  static async createPaymentIntent(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { contractId } = req.body;

      if (!contractId) return res.status(400).json({ error: 'contractId é obrigatório' });

      if (userRole !== UserRole.COMPANY) {
        return res.status(403).json({ error: 'Apenas a empresa responsável pelo contrato pode iniciar o pagamento.' });
      }

      const contract = await prisma.contract.findFirst({
        where: getCompanyOwnedContractWhere(contractId, userId),
        include: { company: { include: { user: true } } }
      });

      if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });

      if (!contract.influencerSigned) {
        return res.status(400).json({ error: 'O contrato precisa ser aceito e assinado eletronicamente pelo influenciador antes de efetuar o pagamento.' });
      }

      // Usa a taxa já calculada e salva no contrato (via fees.ts em createContract)
      const feeRate = contract.successFeeRate ?? 0.15;
      const totalAmount = contract.budget + (contract.budget * feeRate);
      const amountInCents = Math.round(totalAmount * 100);
      const feePercent = Math.round(feeRate * 100);

      if (!stripe) {
        return res.status(500).json({ error: 'Serviço de pagamentos não configurado.' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        payment_method_types: ['card', 'pix'],
        metadata: {
          contractId: contract.id,
          type: 'contract_escrow'
        },
        description: `Pagamento de Escrow: ${contract.title} (Cachê R$ ${contract.budget.toFixed(2)} + ${feePercent}% taxa de intermediação R$ ${(contract.budget * feeRate).toFixed(2)})`
      });

      // Atualizar contrato com o ID da transação externa
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          externalTxId: paymentIntent.id,
          escrowStatus: 'PENDING_PAYMENT'
        }
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
      });
    } catch (error) {
      console.error('[STRIPE] Erro ao criar PaymentIntent:', error);
      return res.status(500).json({ error: 'Erro ao gerar pagamento' });
    }
  }

  /**
   * POST /v1/payments/webhook
   * Handler de eventos da Stripe
   */
  static async webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;

    let event: any;

    try {
      if (!stripe) {
        return res.status(500).json({ error: 'Webhook: Stripe não configurado.' });
      }
      // É necessário o raw body para validar a assinatura
      // No Express, isso geralmente requer um middleware específico (express.raw)
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error(`[STRIPE WEBHOOK] ❌ Erro de assinatura: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      console.log(`[STRIPE WEBHOOK] Evento recebido: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          if (session.mode === 'subscription') {
            const userId = session.metadata?.userId;
            const planId = session.metadata?.planId;
            const externalSubscriptionId = session.subscription as string;

            if (userId && planId) {
              await prisma.subscription.create({
                data: {
                  userId,
                  planId,
                  externalId: externalSubscriptionId,
                  status: 'active',
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Aproximado, o ideal é ler do subscription.updated
                }
              });

              let subscriptionTier = 'FREE';
              // Mapear planId do Stripe para o tier correto
              if (planId === 'plan_pro_influencer_1') {
                subscriptionTier = 'PRO';    // Creator Premium (R$59,90/mês) → taxa 7%
              } else if (planId === 'plan_master_influencer_1') {
                subscriptionTier = 'MASTER'; // Company Premium (R$120,00/mês) → taxa 7%
              } else if (planId === 'plan_brand_enterprise_1') {
                subscriptionTier = 'ENTERPRISE'; // Enterprise → taxa 7%
              }

              await prisma.user.update({
                where: { id: userId },
                data: { 
                  subscriptionStatus: 'ACTIVE',
                  subscriptionTier
                }
              });
              console.log(`[STRIPE] ✅ Assinatura ativada para usuário ${userId} com Tier ${subscriptionTier}`);
            }
          } else if (session.mode === 'payment' && session.metadata?.type === 'contract_escrow') {
            const contractId = session.metadata?.contractId;
            if (contractId) {
              await prisma.contract.update({
                where: { id: contractId },
                data: { escrowStatus: 'IN_PROGRESS' }
              });

              const contract = await prisma.contract.findUnique({
                where: { id: contractId },
                include: { influencer: true }
              });

              if (contract) {
                await QuickAlertService.notifyEscrowConfirmed({
                  recipientUserId: contract.influencer.userId,
                  contractTitle: contract.title,
                  netAmount: Number(contract.netAmount || contract.budget),
                  contractId: contract.id
                });
              }
              console.log(`[STRIPE] ✅ Contrato ${contractId} pago via Checkout Session. Escrow IN_PROGRESS.`);
            }
          }
          break;
        }

        case 'payment_intent.succeeded': {
          const intent = event.data.object as any;
          const contractId = intent.metadata?.contractId;

          if (contractId) {
            await prisma.contract.update({
              where: { id: contractId },
              data: { escrowStatus: 'IN_PROGRESS' }
            });

            const contract = await prisma.contract.findUnique({
              where: { id: contractId },
              include: { influencer: true }
            });

            if (contract) {
              await QuickAlertService.notifyEscrowConfirmed({
                recipientUserId: contract.influencer.userId,
                contractTitle: contract.title,
                netAmount: Number(contract.netAmount || contract.budget),
                contractId: contract.id
              });
            }
            console.log(`[STRIPE] ✅ Contrato ${contractId} pago. Escrow IN_PROGRESS.`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          const dbSub = await prisma.subscription.findUnique({
            where: { externalId: subscription.id }
          });

          if (dbSub) {
            await prisma.user.update({
              where: { id: dbSub.userId },
              data: { 
                subscriptionStatus: 'INACTIVE',
                subscriptionTier: 'FREE'
              }
            });
            await prisma.subscription.update({
              where: { id: dbSub.id },
              data: { status: 'canceled' }
            });
            console.log(`[STRIPE] ⚠️ Assinatura ${subscription.id} cancelada. Usuário ${dbSub.userId} resetado para tier FREE.`);
          }
          break;
        }

        // Adicionar outros casos conforme necessário (past_due, invoice.paid, etc)
      }

      return res.json({ received: true });
    } catch (error) {
      console.error('[STRIPE WEBHOOK] Erro ao processar evento:', error);
      return res.status(500).json({ error: 'Erro interno no webhook' });
    }
  }

  /**
   * POST /v1/payments/connect/onboard
   * Cria/recupera conta Express e gera link de onboarding
   */
  static async onboardConnectAccount(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userEmail = req.user!.email;
      const { redirectUrl } = req.body;

      if (!redirectUrl) {
        return res.status(400).json({ error: 'redirectUrl é obrigatório' });
      }

      const { StripeConnectService } = await import('../services/stripe-connect.service');
      const onboardResult = await StripeConnectService.createExpressAccount(userId, userEmail, redirectUrl);

      return res.json(onboardResult);
    } catch (error: any) {
      console.error('[STRIPE CONNECT] Erro no onboarding:', error);
      return res.status(500).json({ error: error.message || 'Erro ao processar onboarding do Stripe Connect.' });
    }
  }

  /**
   * GET /v1/payments/connect/status
   * Busca o status da conta Stripe Connect vinculada
   */
  static async getConnectAccountStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeConnectAccountId: true }
      });

      if (!user || !user.stripeConnectAccountId) {
        return res.json({ connected: false, message: 'Conta Stripe Connect não vinculada.' });
      }

      const { StripeConnectService } = await import('../services/stripe-connect.service');
      const status = await StripeConnectService.getAccountStatus(user.stripeConnectAccountId);

      return res.json({
        connected: status.detailsSubmitted,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        requirements: status.requirements
      });
    } catch (error: any) {
      console.error('[STRIPE CONNECT] Erro ao buscar status:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar status do Stripe Connect.' });
    }
  }

  /**
   * POST /v1/payments/mercadopago/pix
   * Gera cobrança PIX instantânea no Mercado Pago para garantia SafePay
   */
  static async createMercadoPagoPix(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { contractId, email } = req.body;
      const userEmail = email || req.user?.email || '';

      if (!contractId) {
        return res.status(400).json({ error: 'contractId é obrigatório' });
      }

      if (userRole !== UserRole.COMPANY) {
        return res.status(403).json({ error: 'Apenas a empresa responsável pelo contrato pode gerar a cobrança PIX.' });
      }

      const contract = await prisma.contract.findFirst({
        where: getCompanyOwnedContractWhere(contractId, userId),
        select: { id: true }
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contrato não encontrado' });
      }

      const { MercadoPagoService } = await import('../services/mercadopago.service');
      const pixData = await MercadoPagoService.createContractPix(contractId, userEmail);

      return res.json(pixData);
    } catch (error: any) {
      console.error('[MERCADO PAGO] Erro ao gerar PIX:', error);
      return res.status(500).json({ error: error.message || 'Erro ao gerar cobrança PIX no Mercado Pago' });
    }
  }

  /**
   * POST /v1/payments/mercadopago/preference
   * Gera preferência de pagamento (Cartão de Crédito / Checkout Pro)
   */
  static async createMercadoPagoPreference(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { contractId, email } = req.body;
      const userEmail = email || req.user?.email || '';

      if (!contractId) {
        return res.status(400).json({ error: 'contractId é obrigatório' });
      }

      if (userRole !== UserRole.COMPANY) {
        return res.status(403).json({ error: 'Apenas a empresa responsável pelo contrato pode gerar a preferência de pagamento.' });
      }

      const contract = await prisma.contract.findFirst({
        where: getCompanyOwnedContractWhere(contractId, userId),
        select: { id: true }
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contrato não encontrado' });
      }

      const { MercadoPagoService } = await import('../services/mercadopago.service');
      const preferenceData = await MercadoPagoService.createContractPreference(contractId, userEmail);

      return res.json(preferenceData);
    } catch (error: any) {
      console.error('[MERCADO PAGO] Erro ao gerar preferência de cartão:', error);
      return res.status(500).json({ error: error.message || 'Erro ao gerar checkout no Mercado Pago' });
    }
  }

  /**
   * GET /v1/payments/mercadopago/status/:paymentId
   * Consulta o status de um pagamento Pix/Cartão em tempo real
   */
  static async checkMercadoPagoStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({ error: 'paymentId é obrigatório' });
      }

      if (userRole !== UserRole.COMPANY) {
        return res.status(403).json({ error: 'Apenas a empresa responsável pelo contrato pode consultar este pagamento.' });
      }

      const contract = await prisma.contract.findFirst({
        where: {
          mpPaymentId: paymentId,
          company: { userId }
        },
        select: { id: true }
      });

      if (!contract) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      const { MercadoPagoService } = await import('../services/mercadopago.service');
      const statusData = await MercadoPagoService.getPaymentStatus(paymentId);
      const metadata = statusData.metadata || {};
      const paymentContractId = metadata.contract_id || metadata.contractId;

      if (paymentContractId && paymentContractId !== contract.id) {
        return res.status(409).json({ error: 'Pagamento não corresponde ao contrato autorizado.' });
      }

      // Se foi aprovado, processa a ativação do contrato se ainda não foi
      if (statusData.isApproved) {
        await MercadoPagoService.handlePaymentApproved(paymentId);
      }

      return res.json(statusData);
    } catch (error: any) {
      console.error('[MERCADO PAGO] Erro ao consultar status:', error);
      return res.status(500).json({ error: error.message || 'Erro ao consultar status no Mercado Pago' });
    }
  }

  /**
   * POST /v1/payments/mercadopago/subscription
   * Cria assinatura mensal recorrente via Mercado Pago
   */
  static async createMercadoPagoSubscription(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const userEmail = req.user!.email;
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ error: 'planId é obrigatório' });
      }

      const { MercadoPagoService } = await import('../services/mercadopago.service');
      const subscriptionData = await MercadoPagoService.createSubscription(userId, planId, userEmail);

      return res.json(subscriptionData);
    } catch (error: any) {
      console.error('[MERCADO PAGO] Erro ao gerar assinatura:', error);
      return res.status(500).json({ error: error.message || 'Erro ao criar assinatura no Mercado Pago' });
    }
  }

  /**
   * PATCH /v1/payments/pix-key
   * Salva/atualiza a chave Pix do influenciador para recebimento de payouts
   */
  static async updatePixKey(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { pixKey, pixKeyType } = req.body;

      if (!pixKey || !pixKeyType) {
        return res.status(400).json({ error: 'pixKey e pixKeyType são obrigatórios.' });
      }

      const validTypes = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'];
      if (!validTypes.includes(pixKeyType)) {
        return res.status(400).json({ error: 'Tipo de chave Pix inválido. Use CPF, CNPJ, EMAIL, PHONE ou RANDOM.' });
      }

      const profile = await prisma.influencerProfile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
      }

      const updated = await prisma.influencerProfile.update({
        where: { userId },
        data: {
          pixKey,
          pixKeyType
        }
      });

      return res.json({
        message: 'Chave Pix atualizada com sucesso!',
        pixKey: updated.pixKey,
        pixKeyType: updated.pixKeyType
      });
    } catch (error: any) {
      console.error('[PAYMENTS] Erro ao atualizar chave Pix:', error);
      return res.status(500).json({ error: error.message || 'Erro ao atualizar chave Pix' });
    }
  }
}
