import { Request, Response } from 'express';
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from 'mercadopago';

const singleString = (value: unknown): string => {
  if (Array.isArray(value)) return String(value[0] || '');
  return typeof value === 'string' ? value : '';
};

/**
 * Rota legada preservada, mas fail-closed até que versão, credenciais e
 * mecanismo oficial de assinatura da integração Pagar.me sejam comprovados.
 */
export const handlePagarmeWebhook = async (req: Request, res: Response): Promise<void> => {
  res.status(503).json({
    error: 'Webhook Pagar.me desabilitado: integração ativa e mecanismo de assinatura não comprovados.'
  });
};

/**
 * Endpoint para processar webhooks do Mercado Pago (PIX, Cartão, Assinaturas).
 */
export const handleMercadoPagoWebhook = async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    res.status(503).json({ error: 'Webhook Mercado Pago não configurado.' });
    return;
  }

  const dataId = req.query['data.id'] as string | string[] | undefined;

  try {
    WebhookSignatureValidator.validate({
      xSignature: req.headers['x-signature'],
      xRequestId: req.headers['x-request-id'],
      dataId,
      secret: webhookSecret,
      toleranceSeconds: 300
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      res.status(401).json({ error: 'Assinatura Mercado Pago inválida.' });
      return;
    }

    console.error('[MERCADO PAGO WEBHOOK] Falha ao validar assinatura.');
    res.status(500).json({ error: 'Erro ao validar webhook Mercado Pago.' });
    return;
  }

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Buffer.isBuffer(body)) {
    res.status(400).json({ error: 'Payload Mercado Pago inválido.' });
    return;
  }

  const eventType = singleString(req.query.type)
    || singleString(req.query.topic)
    || singleString(body.type)
    || singleString(body.action);

  if (!eventType) {
    res.status(400).json({ error: 'Tipo de evento Mercado Pago ausente.' });
    return;
  }

  const paymentEvents = new Set(['payment', 'payment.created', 'payment.updated']);
  if (!paymentEvents.has(eventType)) {
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  const paymentId = singleString(dataId);
  if (!paymentId) {
    res.status(400).json({ error: 'Identificador autenticado do pagamento ausente.' });
    return;
  }

  const bodyPaymentId = body.data?.id ?? body.id;
  if (bodyPaymentId !== undefined && String(bodyPaymentId) !== paymentId) {
    res.status(400).json({ error: 'Payload Mercado Pago inconsistente.' });
    return;
  }

  try {
    const { MercadoPagoService } = await import('../services/mercadopago.service');
    await MercadoPagoService.handlePaymentApproved(paymentId);

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[MERCADO PAGO WEBHOOK] ❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook Mercado Pago.' });
  }
};
