import express from 'express';
import request from 'supertest';

const mockContractFindFirst = jest.fn();
const mockContractFindUnique = jest.fn();
const mockContractCreate = jest.fn();
const mockContractUpdate = jest.fn();
const mockInfluencerFindUnique = jest.fn();
const mockCompanyFindUnique = jest.fn();
const mockCompanyCreate = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserCreate = jest.fn();
const mockDeliverableFindFirst = jest.fn();
const mockDeliverableUpdate = jest.fn();
const mockNotificationCreate = jest.fn();
const mockTransaction = jest.fn();
const mockStripeCheckoutCreate = jest.fn();
const mockStripeTransferCreate = jest.fn();
const mockStripeConnectTransfer = jest.fn();
const mockNotifyNewOffer = jest.fn();
const mockAddNotificationJob = jest.fn();
const mockAuthenticate = jest.fn();

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    contract: {
      findFirst: mockContractFindFirst,
      findUnique: mockContractFindUnique,
      create: mockContractCreate,
      update: mockContractUpdate,
    },
    influencerProfile: { findUnique: mockInfluencerFindUnique },
    companyProfile: {
      findUnique: mockCompanyFindUnique,
      create: mockCompanyCreate,
    },
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
    deliverable: {
      findFirst: mockDeliverableFindFirst,
      update: mockDeliverableUpdate,
    },
    notification: { create: mockNotificationCreate },
    $transaction: mockTransaction,
  },
}));

jest.mock('../src/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: mockStripeCheckoutCreate } },
    transfers: { create: mockStripeTransferCreate },
  },
}));

jest.mock('../src/services/stripe-connect.service', () => ({
  StripeConnectService: { transferToConnectedAccount: mockStripeConnectTransfer },
}));

jest.mock('../src/services/quick-alert.service', () => ({
  QuickAlertService: { notifyNewOffer: mockNotifyNewOffer },
}));

jest.mock('../src/queues/notification.queue', () => ({
  addNotificationJob: mockAddNotificationJob,
}));

jest.mock('../src/middlewares/auth.middleware', () => ({
  authenticate: mockAuthenticate,
}));

jest.mock('../src/services/briefing.service', () => ({
  BriefingService: { generateSmartScript: jest.fn() },
}));

jest.mock('../src/services/mission.service', () => ({
  MissionService: {},
}));

jest.mock('../src/services/career.service', () => ({
  CareerService: {},
}));

jest.mock('../src/services/ai.service', () => ({
  AIService: {},
}));

import contractRoutes from '../src/routes/contract.routes';
import deliverableRoutes from '../src/routes/deliverable.routes';
import influencerRoutes from '../src/routes/influencer.routes';
import publicRoutes from '../src/routes/public.routes';
import { developmentOrTestOnly } from '../src/middlewares/environment.middleware';

function appWithRouter(mountPath: string, router: express.Router): express.Express {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  return app;
}

function deliverableForApproval(otherDeliverableStatus: 'APPROVED' | 'UNDER_REVIEW') {
  return {
    id: 'deliverable-a',
    status: 'UNDER_REVIEW',
    contractId: 'contract-a',
    contract: {
      title: 'Campanha de teste',
      influencer: { userId: 'influencer-user' },
      deliverables: [
        { id: 'deliverable-a', status: 'UNDER_REVIEW' },
        { id: 'deliverable-b', status: otherDeliverableStatus },
      ],
    },
  };
}

describe('G1C1 — bloqueios de release em produção', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    mockAuthenticate.mockImplementation((req: any, _res: any, next: any) => {
      req.user = { id: 'company-user', role: 'COMPANY' };
      next();
    });
    mockTransaction.mockImplementation(async (operation: (tx: any) => unknown) => operation({
      deliverable: { update: mockDeliverableUpdate },
      contract: { update: mockContractUpdate },
      notification: { create: mockNotificationCreate },
    }));
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('bloqueia a confirmação mock antes de qualquer leitura ou write financeiro', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(appWithRouter('/contracts', contractRoutes))
      .post('/contracts/contract-a/pay')
      .send({});

    expect(response.status).toBe(404);
    expect(mockContractFindFirst).not.toHaveBeenCalled();
    expect(mockContractFindUnique).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it('bloqueia release antes de provider, reserva ou alteração de estado', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(appWithRouter('/contracts', contractRoutes))
      .patch('/contracts/contract-a/release')
      .set('Idempotency-Key', 'release-test-key')
      .send({});

    expect(response.status).toBe(404);
    expect(mockContractFindFirst).not.toHaveBeenCalled();
    expect(mockContractFindUnique).not.toHaveBeenCalled();
    expect(mockStripeConnectTransfer).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('bloqueia saque antes de provider ou persistência local', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(appWithRouter('/influencers', influencerRoutes))
      .post('/influencers/withdraw')
      .send({ amount: 100 });

    expect(response.status).toBe(404);
    expect(mockInfluencerFindUnique).not.toHaveBeenCalled();
    expect(mockStripeTransferCreate).not.toHaveBeenCalled();
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it('permite aprovação não terminal em produção sem liberar saldo', async () => {
    process.env.NODE_ENV = 'production';
    mockDeliverableFindFirst.mockResolvedValue(deliverableForApproval('UNDER_REVIEW'));

    const response = await request(appWithRouter('/deliverables', deliverableRoutes))
      .patch('/deliverables/deliverable-a/approve')
      .send({});

    expect(response.status).toBe(200);
    expect(mockAuthenticate).toHaveBeenCalledTimes(1);
    expect(mockDeliverableFindFirst).toHaveBeenCalledTimes(1);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockDeliverableUpdate).toHaveBeenCalledWith({
      where: { id: 'deliverable-a' },
      data: { status: 'APPROVED' },
    });
    expect(mockContractUpdate).not.toHaveBeenCalled();
    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'SYSTEM' }),
    });
    expect(mockAddNotificationJob).toHaveBeenCalledWith(
      'influencer-user',
      expect.stringContaining('foi aprovada.'),
      'SYSTEM',
    );
    expect(mockStripeConnectTransfer).not.toHaveBeenCalled();
    expect(mockStripeTransferCreate).not.toHaveBeenCalled();
  });

  it('bloqueia aprovação terminal em produção antes da transação financeira', async () => {
    process.env.NODE_ENV = 'production';
    mockDeliverableFindFirst.mockResolvedValue(deliverableForApproval('APPROVED'));

    const response = await request(appWithRouter('/deliverables', deliverableRoutes))
      .patch('/deliverables/deliverable-a/approve')
      .send({});

    expect(response.status).toBe(404);
    expect(mockAuthenticate).toHaveBeenCalledTimes(1);
    expect(mockDeliverableFindFirst).toHaveBeenCalledTimes(1);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockDeliverableUpdate).not.toHaveBeenCalled();
    expect(mockContractUpdate).not.toHaveBeenCalled();
    expect(mockNotificationCreate).not.toHaveBeenCalled();
    expect(mockAddNotificationJob).not.toHaveBeenCalled();
    expect(mockStripeConnectTransfer).not.toHaveBeenCalled();
    expect(mockStripeTransferCreate).not.toHaveBeenCalled();
  });

  it.each(['test', 'development'])('preserva aprovação terminal para NODE_ENV=%s', async (nodeEnv) => {
    process.env.NODE_ENV = nodeEnv;
    mockDeliverableFindFirst.mockResolvedValue(deliverableForApproval('APPROVED'));

    const response = await request(appWithRouter('/deliverables', deliverableRoutes))
      .patch('/deliverables/deliverable-a/approve')
      .send({});

    expect(response.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockDeliverableUpdate).toHaveBeenCalledWith({
      where: { id: 'deliverable-a' },
      data: { status: 'APPROVED' },
    });
    expect(mockContractUpdate).toHaveBeenCalledWith({
      where: { id: 'contract-a' },
      data: { escrowStatus: 'COMPLETED' },
    });
    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'PAYMENT_RELEASED' }),
    });
    expect(mockAddNotificationJob).toHaveBeenCalledWith(
      'influencer-user',
      expect.stringContaining('Pagamento Liberado.'),
      'PAYMENT_RELEASED',
    );
  });

  it('bloqueia instant checkout antes de representar Company ou criar contrato', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(appWithRouter('/p', publicRoutes))
      .post('/p/instant-checkout')
      .send({
        handle: 'creator-a',
        brandEmail: 'brand@example.test',
        campaignTitle: 'Campanha de teste',
      });

    expect(response.status).toBe(404);
    expect(mockInfluencerFindUnique).not.toHaveBeenCalled();
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockCompanyFindUnique).not.toHaveBeenCalled();
    expect(mockCompanyCreate).not.toHaveBeenCalled();
    expect(mockContractCreate).not.toHaveBeenCalled();
    expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
    expect(mockNotifyNewOffer).not.toHaveBeenCalled();
  });

  it.each(['test', 'development'])('preserva o middleware para NODE_ENV=%s', async (nodeEnv) => {
    process.env.NODE_ENV = nodeEnv;
    const handler = jest.fn((_req, res) => res.status(204).end());
    const app = express();
    app.post('/operation', developmentOrTestOnly, handler);

    const response = await request(app).post('/operation');

    expect(response.status).toBe(204);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
