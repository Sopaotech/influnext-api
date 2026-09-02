import crypto from 'crypto';
import Stripe from 'stripe';
import { WebhookSignatureValidator } from 'mercadopago';

const mockContractUpdate = jest.fn();
const mockContractFindUnique = jest.fn();
const mockSubscriptionCreate = jest.fn();
const mockSubscriptionFindUnique = jest.fn();
const mockSubscriptionUpdate = jest.fn();
const mockUserUpdate = jest.fn();
const mockNotifyEscrowConfirmed = jest.fn();
const mockHandlePaymentApproved = jest.fn();
const mockStripeConstructEvent = jest.fn();

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    contract: {
      update: mockContractUpdate,
      findUnique: mockContractFindUnique,
    },
    subscription: {
      create: mockSubscriptionCreate,
      findUnique: mockSubscriptionFindUnique,
      update: mockSubscriptionUpdate,
    },
    user: { update: mockUserUpdate },
  },
}));

jest.mock('../src/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: mockStripeConstructEvent },
  },
}));

jest.mock('../src/services/quick-alert.service', () => ({
  QuickAlertService: { notifyEscrowConfirmed: mockNotifyEscrowConfirmed },
}));

jest.mock('../src/services/mercadopago.service', () => ({
  MercadoPagoService: { handlePaymentApproved: mockHandlePaymentApproved },
}));

import { PaymentController } from '../src/controllers/payment.controller';
import {
  handleMercadoPagoWebhook,
  handlePagarmeWebhook,
} from '../src/controllers/webhook.controller';

const stripeVerifier = new Stripe('sk_test_webhook_fixture_key');
const STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook_secret';
const MERCADO_PAGO_WEBHOOK_SECRET = 'mp_test_webhook_secret';
const MERCADO_PAGO_REQUEST_ID = 'request-test-123';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function stripeEventPayload(type: string, object: Record<string, unknown>) {
  return JSON.stringify({
    id: `evt_${type.replace(/\W/g, '_')}`,
    object: 'event',
    type,
    data: { object },
  });
}

function stripeSignature(payload: string, secret = STRIPE_WEBHOOK_SECRET) {
  return stripeVerifier.webhooks.generateTestHeaderString({ payload, secret });
}

function stripeRequest(payload: string, signature: string) {
  return {
    headers: { 'stripe-signature': signature },
    body: Buffer.from(payload),
  } as any;
}

function mercadoPagoSignature(
  dataId: string | undefined,
  requestId = MERCADO_PAGO_REQUEST_ID,
  secret = MERCADO_PAGO_WEBHOOK_SECRET,
  timestamp = String(Math.floor(Date.now() / 1000)),
) {
  const manifestParts: string[] = [];
  if (dataId) manifestParts.push(`id:${dataId}`);
  if (requestId) manifestParts.push(`request-id:${requestId}`);
  manifestParts.push(`ts:${timestamp}`);
  const manifest = `${manifestParts.join(';')};`;
  const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${timestamp},v1=${hash}`;
}

function mercadoPagoRequest(options: {
  dataId?: string;
  eventType?: string;
  body?: unknown;
  signatureSecret?: string;
  timestamp?: string;
}) {
  const dataId = options.dataId;
  const eventType = options.eventType ?? 'payment';
  return {
    headers: {
      'x-signature': mercadoPagoSignature(
        dataId,
        MERCADO_PAGO_REQUEST_ID,
        options.signatureSecret,
        options.timestamp,
      ),
      'x-request-id': MERCADO_PAGO_REQUEST_ID,
    },
    query: {
      ...(dataId ? { 'data.id': dataId } : {}),
      type: eventType,
    },
    body: options.body ?? {
      type: eventType,
      action: eventType === 'payment' ? 'payment.updated' : eventType,
      data: dataId ? { id: dataId } : {},
    },
  } as any;
}

describe('STEP 1D-B — Webhook authenticity and processing safety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET;
    process.env.MERCADOPAGO_WEBHOOK_SECRET = MERCADO_PAGO_WEBHOOK_SECRET;
    mockStripeConstructEvent.mockImplementation((payload, signature, secret) => (
      stripeVerifier.webhooks.constructEvent(payload, signature, secret)
    ));
    mockContractUpdate.mockResolvedValue({ id: 'contract-a', escrowStatus: 'IN_PROGRESS' });
    mockContractFindUnique.mockResolvedValue({
      id: 'contract-a',
      title: 'Campanha A',
      budget: 1000,
      netAmount: 850,
      influencer: { userId: 'user-influencer-a' },
    });
    mockNotifyEscrowConfirmed.mockResolvedValue(undefined);
    mockHandlePaymentApproved.mockResolvedValue({ approved: true, processed: true });
  });

  afterAll(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
  });

  it('processa webhook Stripe válido somente após constructEvent validar a assinatura', async () => {
    const payload = stripeEventPayload('payment_intent.succeeded', {
      id: 'pi-contract-a',
      metadata: { contractId: 'contract-a' },
    });
    const res = createResponse();

    await PaymentController.webhook(stripeRequest(payload, stripeSignature(payload)), res);

    expect(mockStripeConstructEvent).toHaveBeenCalledWith(
      Buffer.from(payload),
      expect.any(String),
      STRIPE_WEBHOOK_SECRET,
    );
    expect(mockContractUpdate).toHaveBeenCalledWith({
      where: { id: 'contract-a' },
      data: { escrowStatus: 'IN_PROGRESS' },
    });
    expect(mockStripeConstructEvent.mock.invocationCallOrder[0])
      .toBeLessThan(mockContractUpdate.mock.invocationCallOrder[0]);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('rejeita assinatura Stripe inválida sem mutação', async () => {
    const payload = stripeEventPayload('payment_intent.succeeded', {
      metadata: { contractId: 'contract-a' },
    });
    const res = createResponse();

    await PaymentController.webhook(
      stripeRequest(payload, stripeSignature(payload, 'wrong-secret')),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockContractUpdate).not.toHaveBeenCalled();
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockNotifyEscrowConfirmed).not.toHaveBeenCalled();
  });

  it('falha fechado quando STRIPE_WEBHOOK_SECRET está ausente', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const payload = stripeEventPayload('payment_intent.succeeded', {
      metadata: { contractId: 'contract-a' },
    });
    const res = createResponse();

    await PaymentController.webhook(stripeRequest(payload, stripeSignature(payload)), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(mockStripeConstructEvent).not.toHaveBeenCalled();
    expect(mockContractUpdate).not.toHaveBeenCalled();
  });

  it('rejeita payload Stripe malformado mesmo com assinatura correspondente', async () => {
    const payload = '{payload-invalido';
    const res = createResponse();

    await PaymentController.webhook(stripeRequest(payload, stripeSignature(payload)), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockContractUpdate).not.toHaveBeenCalled();
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
  });

  it('aceita evento Stripe autenticado desconhecido sem mutação', async () => {
    const payload = stripeEventPayload('charge.refunded', { id: 'ch-unknown' });
    const res = createResponse();

    await PaymentController.webhook(stripeRequest(payload, stripeSignature(payload)), res);

    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(mockContractUpdate).not.toHaveBeenCalled();
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('processa webhook Mercado Pago válido após o validador oficial', async () => {
    const validateSpy = jest.spyOn(WebhookSignatureValidator, 'validate');
    const req = mercadoPagoRequest({ dataId: '99887766' });
    const res = createResponse();

    await handleMercadoPagoWebhook(req, res);

    expect(validateSpy).toHaveBeenCalledWith({
      xSignature: req.headers['x-signature'],
      xRequestId: MERCADO_PAGO_REQUEST_ID,
      dataId: '99887766',
      secret: MERCADO_PAGO_WEBHOOK_SECRET,
      toleranceSeconds: 300,
    });
    expect(mockHandlePaymentApproved).toHaveBeenCalledWith('99887766');
    expect(validateSpy.mock.invocationCallOrder[0])
      .toBeLessThan(mockHandlePaymentApproved.mock.invocationCallOrder[0]);
    expect(res.status).toHaveBeenCalledWith(200);
    validateSpy.mockRestore();
  });

  it('rejeita assinatura Mercado Pago inválida sem chamada sensível', async () => {
    const req = mercadoPagoRequest({ dataId: '99887766', signatureSecret: 'wrong-secret' });
    const res = createResponse();

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
  });

  it('rejeita replay Mercado Pago fora da janela oficial de tolerância', async () => {
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600);
    const req = mercadoPagoRequest({ dataId: '99887766', timestamp: staleTimestamp });
    const res = createResponse();

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
  });

  it('falha fechado quando MERCADOPAGO_WEBHOOK_SECRET está ausente', async () => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const req = mercadoPagoRequest({ dataId: '99887766' });
    const res = createResponse();

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
  });

  it('rejeita payload Mercado Pago malformado após autenticação e sem mutação', async () => {
    const req = mercadoPagoRequest({ dataId: '99887766', body: 'payload-invalido' });
    const res = createResponse();

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
  });

  it('ignora evento Mercado Pago autenticado mas desconhecido', async () => {
    const req = mercadoPagoRequest({ dataId: 'resource-1', eventType: 'merchant_order' });
    const res = createResponse();

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true, ignored: true });
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
  });

  it('rejeita evento de pagamento sem data.id autenticado', async () => {
    const req = mercadoPagoRequest({ dataId: undefined, eventType: 'payment' });
    const res = createResponse();

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
  });

  it('rejeita divergência entre data.id autenticado e payload Mercado Pago', async () => {
    const req = mercadoPagoRequest({
      dataId: '99887766',
      body: { type: 'payment', data: { id: 'payment-from-another-contract' } },
    });
    const res = createResponse();

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
  });

  it('mantém webhook Pagar.me legado fail-closed sem mutação', async () => {
    const req = {
      headers: { 'x-hub-signature': 'sha1=forged' },
      body: { type: 'transaction.paid', customer: { email: 'victim@example.com' } },
    } as any;
    const res = createResponse();

    await handlePagarmeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();
  });
});
