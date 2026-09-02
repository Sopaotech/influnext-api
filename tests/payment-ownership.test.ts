const mockContractFindFirst = jest.fn();
const mockContractFindUnique = jest.fn();
const mockContractUpdate = jest.fn();
const mockTxContractUpdate = jest.fn();
const mockTxContractUpdateMany = jest.fn();
const mockTxContractFindUnique = jest.fn();
const mockNotificationCreate = jest.fn();
const mockTransaction = jest.fn();
const mockAddNotificationJob = jest.fn().mockResolvedValue(undefined);

const mockCheckoutCreate = jest.fn();
const mockCheckoutRetrieve = jest.fn();
const mockPaymentIntentCreate = jest.fn();
const mockPaymentIntentRetrieve = jest.fn();
const mockRefundCreate = jest.fn();

const mockCreateContractPix = jest.fn();
const mockCreateContractPreference = jest.fn();
const mockGetPaymentStatus = jest.fn();
const mockHandlePaymentApproved = jest.fn();
const mockTransferToConnectedAccount = jest.fn();

const transactionClient = {
  contract: {
    update: mockTxContractUpdate,
    updateMany: mockTxContractUpdateMany,
    findUnique: mockTxContractFindUnique,
  },
  notification: { create: mockNotificationCreate },
};

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    contract: {
      findFirst: mockContractFindFirst,
      findUnique: mockContractFindUnique,
      update: mockContractUpdate,
    },
    $transaction: mockTransaction,
  },
}));

jest.mock('../src/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: mockCheckoutCreate,
        retrieve: mockCheckoutRetrieve,
      },
    },
    paymentIntents: {
      create: mockPaymentIntentCreate,
      retrieve: mockPaymentIntentRetrieve,
    },
    refunds: { create: mockRefundCreate },
  },
}));

jest.mock('../src/services/mercadopago.service', () => ({
  MercadoPagoService: {
    createContractPix: mockCreateContractPix,
    createContractPreference: mockCreateContractPreference,
    getPaymentStatus: mockGetPaymentStatus,
    handlePaymentApproved: mockHandlePaymentApproved,
  },
}));

jest.mock('../src/services/stripe-connect.service', () => ({
  StripeConnectService: {
    transferToConnectedAccount: mockTransferToConnectedAccount,
  },
}));

jest.mock('../src/services/quick-alert.service', () => ({
  QuickAlertService: {
    notifyEscrowConfirmed: jest.fn(),
  },
}));

jest.mock('../src/queues/notification.queue', () => ({
  addNotificationJob: mockAddNotificationJob,
}));

jest.mock('../src/services/briefing.service', () => ({
  BriefingService: { generateSmartScript: jest.fn() },
}));

import { PaymentController } from '../src/controllers/payment.controller';
import {
  cancelAndRefundContract,
  confirmPayment,
  releasePayment,
} from '../src/controllers/contract.controller';
import { authenticate } from '../src/middlewares/auth.middleware';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function createRequest(
  role: 'COMPANY' | 'INFLUENCER' | 'ADMIN',
  userId: string,
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
  headers: Record<string, string> = {},
) {
  return {
    user: { id: userId, email: `${userId}@example.com`, role },
    body,
    params,
    headers,
    socket: { remoteAddress: '127.0.0.1' },
    ip: '127.0.0.1',
  } as any;
}

const ownedContract = {
  id: 'contract-a',
  companyId: 'company-a',
  influencerId: 'influencer-a',
  title: 'Campanha A',
  budget: 1000,
  successFeeRate: 0.15,
  netAmount: 850,
  influencerSigned: true,
  escrowStatus: 'DRAFT',
  externalTxId: null,
  releaseTxId: null,
  idempotencyKey: null,
  company: {
    id: 'company-a',
    userId: 'user-company-a',
    user: { id: 'user-company-a', email: 'company-a@example.com' },
  },
  influencer: {
    id: 'influencer-a',
    userId: 'user-influencer-a',
    user: { id: 'user-influencer-a', stripeConnectAccountId: null },
  },
};

describe('STEP 1D-A — Payment authorization and ownership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckoutCreate.mockResolvedValue({ id: 'cs-contract-a', url: 'https://checkout.example/contract-a' });
    mockContractUpdate.mockResolvedValue({ ...ownedContract, escrowStatus: 'PENDING_PAYMENT' });
    mockTxContractUpdate.mockResolvedValue({ ...ownedContract, escrowStatus: 'IN_PROGRESS' });
    mockTxContractUpdateMany.mockResolvedValue({ count: 1 });
    mockTxContractFindUnique.mockResolvedValue({ ...ownedContract, escrowStatus: 'COMPLETED' });
    mockNotificationCreate.mockResolvedValue({ id: 'notification-a' });
    mockTransaction.mockImplementation(async (callback: any) => callback(transactionClient));
    mockCreateContractPix.mockResolvedValue({ paymentId: 'mp-payment-a', qrCode: 'qr-a' });
    mockCreateContractPreference.mockResolvedValue({ preferenceId: 'mp-preference-a', initPoint: 'https://mp.example/a' });
    mockGetPaymentStatus.mockResolvedValue({
      id: 'mp-payment-a',
      status: 'pending',
      isApproved: false,
      metadata: { contract_id: 'contract-a' },
    });
  });

  it('permite que a Company proprietária crie checkout do contrato', async () => {
    mockContractFindFirst.mockResolvedValue(ownedContract);
    const res = createResponse();

    await PaymentController.createContractCheckoutSession(
      createRequest('COMPANY', 'user-company-a', { contractId: 'contract-a' }),
      res,
    );

    expect(mockContractFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'contract-a', company: { userId: 'user-company-a' } },
    }));
    expect(mockCheckoutCreate).toHaveBeenCalledTimes(1);
    expect(mockContractUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'contract-a' },
    }));
    expect(res.json).toHaveBeenCalledWith({ url: 'https://checkout.example/contract-a' });
  });

  it('não permite que outra Company crie checkout de contrato alheio', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await PaymentController.createContractCheckoutSession(
      createRequest('COMPANY', 'user-company-b', { contractId: 'contract-a' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
    expect(mockContractUpdate).not.toHaveBeenCalled();
  });

  it('não permite que o Influencer participante crie checkout da Company', async () => {
    const res = createResponse();

    await PaymentController.createContractCheckoutSession(
      createRequest('INFLUENCER', 'user-influencer-a', { contractId: 'contract-a' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockContractFindFirst).not.toHaveBeenCalled();
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('protege também o handler de PaymentIntent ainda não registrado em rota', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await PaymentController.createPaymentIntent(
      createRequest('COMPANY', 'user-company-b', { contractId: 'contract-a' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockPaymentIntentCreate).not.toHaveBeenCalled();
    expect(mockContractUpdate).not.toHaveBeenCalled();
  });

  it('não permite que Company terceira crie PIX de contrato alheio', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await PaymentController.createMercadoPagoPix(
      createRequest('COMPANY', 'user-company-b', { contractId: 'contract-a' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockCreateContractPix).not.toHaveBeenCalled();
  });

  it('permite que a Company proprietária crie PIX', async () => {
    mockContractFindFirst.mockResolvedValue({ id: 'contract-a' });
    const res = createResponse();

    await PaymentController.createMercadoPagoPix(
      createRequest('COMPANY', 'user-company-a', { contractId: 'contract-a' }),
      res,
    );

    expect(mockContractFindFirst).toHaveBeenCalledWith({
      where: { id: 'contract-a', company: { userId: 'user-company-a' } },
      select: { id: true },
    });
    expect(mockCreateContractPix).toHaveBeenCalledWith('contract-a', 'user-company-a@example.com');
    expect(res.json).toHaveBeenCalledWith({ paymentId: 'mp-payment-a', qrCode: 'qr-a' });
  });

  it('não permite que outra Company crie preference de contrato alheio', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await PaymentController.createMercadoPagoPreference(
      createRequest('COMPANY', 'user-company-b', { contractId: 'contract-a' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockCreateContractPreference).not.toHaveBeenCalled();
  });

  it('rejeita consulta de status sem ownership do paymentId', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await PaymentController.checkMercadoPagoStatus(
      createRequest('COMPANY', 'user-company-b', {}, { paymentId: 'mp-payment-a' }),
      res,
    );

    expect(mockContractFindFirst).toHaveBeenCalledWith({
      where: { mpPaymentId: 'mp-payment-a', company: { userId: 'user-company-b' } },
      select: { id: true },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockGetPaymentStatus).not.toHaveBeenCalled();
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
  });

  it('permite que a Company proprietária consulte o status do próprio PIX', async () => {
    mockContractFindFirst.mockResolvedValue({ id: 'contract-a' });
    const res = createResponse();

    await PaymentController.checkMercadoPagoStatus(
      createRequest('COMPANY', 'user-company-a', {}, { paymentId: 'mp-payment-a' }),
      res,
    );

    expect(mockGetPaymentStatus).toHaveBeenCalledWith('mp-payment-a');
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'mp-payment-a', status: 'pending' }));
  });

  it('não processa pagamento cujo metadata aponta para outro contrato', async () => {
    mockContractFindFirst.mockResolvedValue({ id: 'contract-a' });
    mockGetPaymentStatus.mockResolvedValue({
      id: 'mp-payment-a',
      status: 'approved',
      isApproved: true,
      metadata: { contract_id: 'contract-b' },
    });
    const res = createResponse();

    await PaymentController.checkMercadoPagoStatus(
      createRequest('COMPANY', 'user-company-a', {}, { paymentId: 'mp-payment-a' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockHandlePaymentApproved).not.toHaveBeenCalled();
  });

  it('permite que a Company proprietária confirme pagamento no estado permitido', async () => {
    mockContractFindFirst.mockResolvedValue(ownedContract);
    const res = createResponse();

    await confirmPayment(
      createRequest('COMPANY', 'user-company-a', {}, { id: 'contract-a' }),
      res,
    );

    expect(mockContractFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'contract-a', company: { userId: 'user-company-a' } },
    }));
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.any(String),
    }));
  });

  it('não permite que terceiro confirme pagamento', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await confirmPayment(
      createRequest('COMPANY', 'user-company-b', {}, { id: 'contract-a' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockAddNotificationJob).not.toHaveBeenCalled();
  });

  it('não permite que terceiro libere pagamento', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await releasePayment(
      createRequest('COMPANY', 'user-company-b', {}, { id: 'contract-a' }, { 'idempotency-key': 'release-a' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockTransferToConnectedAccount).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('não permite que terceiro cancele ou gere refund', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await cancelAndRefundContract(
      createRequest('COMPANY', 'user-company-b', {}, { id: 'contract-a' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockCheckoutRetrieve).not.toHaveBeenCalled();
    expect(mockPaymentIntentRetrieve).not.toHaveBeenCalled();
    expect(mockRefundCreate).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('retorna 404 seguro para recurso inexistente sem chamar gateway', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await PaymentController.createContractCheckoutSession(
      createRequest('COMPANY', 'user-company-a', { contractId: 'missing-contract' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('preserva o override financeiro explícito de Admin nas rotas de Contract', async () => {
    mockContractFindUnique.mockResolvedValue(ownedContract);
    const res = createResponse();

    await confirmPayment(
      createRequest('ADMIN', 'admin-a', {}, { id: 'contract-a' }),
      res,
    );

    expect(mockContractFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'contract-a' } }));
    expect(mockContractFindFirst).not.toHaveBeenCalled();
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejeita usuário não autenticado antes de qualquer operação financeira', () => {
    const req: any = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(mockContractFindFirst).not.toHaveBeenCalled();
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });
});
