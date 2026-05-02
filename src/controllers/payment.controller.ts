import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

const PAGARME_WEBHOOK_SECRET = process.env.PAGARME_WEBHOOK_SECRET || 'sandbox_secret_dev';

/**
 * Valida a assinatura do Webhook do Pagar.me
 * Pagar.me envia: X-Hub-Signature header com HMAC-SHA256
 */
function validateWebhookSignature(payload: string, signature: string | undefined): boolean {
  if (!signature) return false;
  
  // Em modo Sandbox/Dev, bypass da assinatura se secret não configurado
  if (PAGARME_WEBHOOK_SECRET === 'sandbox_secret_dev') {
    console.warn('[WEBHOOK] ⚠️  Modo Sandbox: validação de assinatura desativada.');
    return true;
  }

  const expected = crypto
    .createHmac('sha256', PAGARME_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // Comparação segura (constant-time) para evitar timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expected}`),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export class PaymentController {
  /**
   * POST /v1/payments/create-order
   * Cria um pedido de pagamento PIX com split 90/10 (Sandbox)
   */
  static async createOrder(req: Request, res: Response) {
    try {
      const { contractId, method = 'pix' } = req.body;

      if (!contractId) {
        return res.status(400).json({ error: 'contractId é obrigatório' });
      }

      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          company: true,
          influencer: { include: { user: { select: { email: true } } } }
        }
      });

      if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });
      if (contract.escrowStatus !== 'DRAFT' && contract.escrowStatus !== 'PENDING_PAYMENT') {
        return res.status(400).json({ error: 'Contrato já foi pago ou está em processamento.' });
      }

      const amount = Number(contract.budget);
      const platformFee = Math.round(amount * 0.10 * 100) / 100; // 10%
      const influencerAmount = Math.round(amount * 0.90 * 100) / 100; // 90%

      // Sandbox: retorna mock estruturado igual à API real do Pagar.me v5
      const orderId = `or_${Date.now().toString(36)}`;
      const sandboxResponse = {
        id: orderId,
        status: 'pending',
        sandbox: true,
        amount_in_cents: Math.round(amount * 100),
        payment_method: method,
        pix: {
          qr_code: `00020126580014br.gov.bcb.pix0136${orderId}5204000053039865406${Math.round(amount * 100)}5802BR5915INFLUNEXT SA6009SAO PAULO62070503***6304ABCD`,
          qr_code_url: `https://api.pagar.me/sandbox/qr/${orderId}`,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        },
        split: [
          {
            recipient_id: 're_influnext_platform',
            amount: Math.round(platformFee * 100),
            type: 'flat',
            description: 'Taxa da plataforma (10%)'
          },
          {
            recipient_id: 're_mock_influencer_123',
            amount: Math.round(influencerAmount * 100),
            type: 'flat',
            description: 'Repasse ao influenciador (90%)'
          }
        ],
        metadata: { contractId }
      };

      // Atualizar contrato para PENDING_PAYMENT com o txId externo
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          escrowStatus: 'PENDING_PAYMENT',
          externalTxId: orderId,
          platformFee,
          netAmount: influencerAmount,
        }
      });

      return res.json(sandboxResponse);
    } catch (error) {
      console.error('[PAYMENT] Erro ao criar order:', error);
      return res.status(500).json({ error: 'Erro ao gerar pagamento' });
    }
  }

  /**
   * POST /v1/payments/webhook
   * Recebe notificações do Pagar.me com validação de assinatura HMAC-SHA256
   */
  static async webhook(req: Request, res: Response) {
    // Validação de assinatura — blindagem contra requisições falsas
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-hub-signature'] as string | undefined;

    if (!validateWebhookSignature(rawBody, signature)) {
      console.error('[WEBHOOK] ❌ Assinatura inválida — requisição rejeitada.');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    try {
      const event = req.body;
      console.log(`[WEBHOOK] Evento recebido: ${event.type}`);

      if (event.type === 'order.paid') {
        const contractId = event.data?.metadata?.contractId;

        if (!contractId) {
          console.warn('[WEBHOOK] order.paid sem contractId no metadata.');
          return res.status(200).send('OK'); // Responde 200 para não retentar
        }

        // Idempotência: verifica se já processou este evento
        const contract = await prisma.contract.findUnique({ where: { id: contractId } });
        if (!contract) {
          console.warn(`[WEBHOOK] Contrato ${contractId} não encontrado.`);
          return res.status(200).send('OK');
        }
        if (contract.escrowStatus === 'IN_PROGRESS' || contract.escrowStatus === 'COMPLETED') {
          console.log(`[WEBHOOK] Contrato ${contractId} já processado. Idempotência aplicada.`);
          return res.status(200).send('OK');
        }

        // Atualizar para IN_PROGRESS (dinheiro em Escrow)
        await prisma.contract.update({
          where: { id: contractId },
          data: { escrowStatus: 'IN_PROGRESS' }
        });

        console.log(`[WEBHOOK] ✅ Contrato ${contractId} → IN_PROGRESS. Escrow ativado. Split 90/10 garantido.`);

        // TODO: Notificação Plim para o influenciador via Notification model
        // await prisma.notification.create({ data: { ... } })
      }

      if (event.type === 'order.payment_failed') {
        const contractId = event.data?.metadata?.contractId;
        if (contractId) {
          await prisma.contract.update({
            where: { id: contractId },
            data: { escrowStatus: 'DRAFT' } // Volta ao rascunho para nova tentativa
          });
          console.log(`[WEBHOOK] ⚠️ Pagamento falhou. Contrato ${contractId} voltou para DRAFT.`);
        }
      }

      return res.status(200).send('OK');
    } catch (error) {
      console.error('[WEBHOOK] Erro interno:', error);
      return res.status(500).send('Internal Error');
    }
  }
}
