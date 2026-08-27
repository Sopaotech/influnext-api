import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Endpoint silencioso (Webhook) para processar postbacks do Gateway de Pagamento (ex: Pagar.me).
 * Não necessita de autenticação via Token (JWT), mas validação de assinatura (Hash) na vida real.
 */
export const handlePagarmeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = req.body;
    
    // Na vida real: Validar assinatura do header X-Hub-Signature ou Pagarme-Signature
    console.log('[WEBHOOK] Recebido evento do gateway:', event.type);

    // Estrutura mockada: Esperamos que o payload contenha o e-mail ou o ID do usuário como metadata
    const userEmail = event.customer?.email || event.data?.customer?.email;
    const status = event.type || event.status;

    if (!userEmail) {
      res.status(400).json({ error: 'Payload inválido. Email do cliente não encontrado.' });
      return;
    }

    if (status === 'transaction.paid' || status === 'subscription.active' || status === 'paid') {
      console.log(`[WEBHOOK] Pagamento confirmado para ${userEmail}. Atualizando status para ACTIVE.`);
      
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      await prisma.user.update({
        where: { email: userEmail },
        data: { subscriptionStatus: 'ACTIVE' }
      });

      console.log(`[WEBHOOK] Assinatura de ${userEmail} ativada com sucesso!`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno ao processar webhook' });
  }
};

/**
 * Endpoint para processar webhooks do Mercado Pago (PIX, Cartão, Assinaturas).
 */
export const handleMercadoPagoWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, type } = req.query;
    const body = req.body || {};

    const eventType = (type || topic || body.type || body.action || '') as string;
    const paymentId = (req.query.id || req.query['data.id'] || body.data?.id || body.id) as string;

    console.log(`[MERCADO PAGO WEBHOOK] Evento recebido: ${eventType} (ID: ${paymentId})`);

    if (paymentId && (eventType === 'payment' || eventType === 'payment.created' || eventType === 'payment.updated')) {
      const { MercadoPagoService } = await import('../services/mercadopago.service');
      await MercadoPagoService.handlePaymentApproved(paymentId);
    }

    // Retorna 200 pro Mercado Pago confirmar o recebimento
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[MERCADO PAGO WEBHOOK] ❌ Erro ao processar webhook:', error);
    // Respondemos 200 para evitar que o gateway fique re-tentando em caso de erro de parse
    res.status(200).json({ received: true, error: error?.message });
  }
};
