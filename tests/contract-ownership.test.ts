const mockContractFindUnique = jest.fn();
const mockContractFindFirst = jest.fn();
const mockContractUpdate = jest.fn();
const mockReviewCreate = jest.fn();
const mockReviewUpdate = jest.fn();
const mockNotificationCreate = jest.fn();
const mockTransaction = jest.fn();
const mockAddNotificationJob = jest.fn().mockResolvedValue(undefined);
const mockGenerateROIReport = jest.fn();

const transactionClient = {
  contract: { update: mockContractUpdate },
  notification: { create: mockNotificationCreate },
};

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    contract: {
      findUnique: mockContractFindUnique,
      findFirst: mockContractFindFirst,
      update: mockContractUpdate,
    },
    review: {
      create: mockReviewCreate,
      update: mockReviewUpdate,
    },
    $transaction: mockTransaction,
  },
}));

jest.mock('../src/queues/notification.queue', () => ({
  addNotificationJob: mockAddNotificationJob,
}));

jest.mock('../src/services/briefing.service', () => ({
  BriefingService: { generateSmartScript: jest.fn() },
}));

jest.mock('../src/services/marketing-intelligence.service', () => ({
  MarketingIntelligenceService: {
    generateCampaignROIReport: mockGenerateROIReport,
  },
}));

jest.mock('../src/services/scoring.service', () => ({
  ScoringService: { calculateAndPersist: jest.fn() },
}));

import {
  acceptContract,
  generateROIReport,
  getContractById,
  submitContractReview,
  updateContractScript,
} from '../src/controllers/contract.controller';
import { authenticate } from '../src/middlewares/auth.middleware';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function contractRequest(
  role: 'COMPANY' | 'INFLUENCER' | 'ADMIN',
  userId: string,
  body: Record<string, unknown> = {},
  id = 'contract-a',
) {
  return {
    user: { id: userId, email: `${userId}@example.com`, role },
    params: { id },
    body,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    ip: '127.0.0.1',
  } as any;
}

const contractDetails = {
  id: 'contract-a',
  companyId: 'company-a',
  influencerId: 'influencer-a',
  title: 'Campanha A',
  budget: 1000,
  briefing: 'Briefing da campanha',
  escrowStatus: 'DRAFT',
  influencerSigned: false,
  exclusivityDays: 0,
  usageRightsDays: 30,
  allowPaidMedia: false,
  deliverables: [{ type: 'REELS', deadline: new Date('2026-10-01') }],
  company: { id: 'company-a', userId: 'user-company-a', companyName: 'Marca A', taxId: '123' },
  influencer: { id: 'influencer-a', userId: 'user-influencer-a', handle: 'creator-a' },
  review: null,
};

describe('STEP 1C — Contract ownership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async (callback: any) => callback(transactionClient));
    mockContractUpdate.mockResolvedValue({ ...contractDetails, influencerSigned: true });
    mockNotificationCreate.mockResolvedValue({ id: 'notification-a' });
  });

  it('permite que a Company participante leia o próprio contrato', async () => {
    mockContractFindFirst.mockResolvedValue(contractDetails);
    const res = createResponse();

    await getContractById(contractRequest('COMPANY', 'user-company-a'), res);

    expect(mockContractFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'contract-a', company: { userId: 'user-company-a' } },
    }));
    expect(res.json).toHaveBeenCalledWith(contractDetails);
  });

  it('permite que o Influencer participante leia o próprio contrato', async () => {
    mockContractFindFirst.mockResolvedValue(contractDetails);
    const res = createResponse();

    await getContractById(contractRequest('INFLUENCER', 'user-influencer-a'), res);

    expect(mockContractFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'contract-a', influencer: { userId: 'user-influencer-a' } },
    }));
    expect(res.json).toHaveBeenCalledWith(contractDetails);
  });

  it('não permite que terceiro leia contrato alheio', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await getContractById(contractRequest('COMPANY', 'user-company-b'), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Contrato não encontrado.' });
  });

  it('preserva o override administrativo de leitura já existente', async () => {
    mockContractFindUnique.mockResolvedValue(contractDetails);
    const res = createResponse();

    await getContractById(contractRequest('ADMIN', 'admin-a'), res);

    expect(mockContractFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'contract-a' } }));
    expect(res.json).toHaveBeenCalledWith(contractDetails);
  });

  it('permite que a Company participante altere o script', async () => {
    mockContractFindFirst.mockResolvedValue(contractDetails);
    mockContractUpdate.mockResolvedValue({ ...contractDetails, aiScript: 'Novo roteiro' });
    const res = createResponse();

    await updateContractScript(contractRequest('COMPANY', 'user-company-a', { aiScript: 'Novo roteiro' }), res);

    expect(mockContractUpdate).toHaveBeenCalledWith({
      where: { id: 'contract-a' },
      data: { aiScript: 'Novo roteiro' },
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  it('permite que o Influencer designado aceite o contrato', async () => {
    mockContractFindFirst.mockResolvedValue(contractDetails);
    const res = createResponse();

    await acceptContract(contractRequest('INFLUENCER', 'user-influencer-a'), res);

    expect(mockContractFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'contract-a', influencer: { userId: 'user-influencer-a' } },
    }));
    expect(mockContractUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('não permite que Company execute aceite exclusivo do Influencer', async () => {
    const res = createResponse();

    await acceptContract(contractRequest('COMPANY', 'user-company-a'), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockContractFindFirst).not.toHaveBeenCalled();
    expect(mockContractUpdate).not.toHaveBeenCalled();
  });

  it('não permite que Influencer gere relatório exclusivo da Company', async () => {
    const res = createResponse();

    await generateROIReport(contractRequest('INFLUENCER', 'user-influencer-a'), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockGenerateROIReport).not.toHaveBeenCalled();
  });

  it('não permite que terceiro altere o script do contrato', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await updateContractScript(contractRequest('COMPANY', 'user-company-b', { aiScript: 'Ataque' }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockContractUpdate).not.toHaveBeenCalled();
  });

  it('retorna 404 para contrato inexistente', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await getContractById(contractRequest('INFLUENCER', 'user-influencer-a', {}, 'missing-contract'), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('permite que a Company dona gere relatório de ROI', async () => {
    mockContractFindFirst.mockResolvedValue({ id: 'contract-a' });
    mockGenerateROIReport.mockResolvedValue({ contractId: 'contract-a', roiMultiplier: 2 });
    const res = createResponse();

    await generateROIReport(contractRequest('COMPANY', 'user-company-a'), res);

    expect(mockContractFindFirst).toHaveBeenCalledWith({
      where: { id: 'contract-a', company: { userId: 'user-company-a' } },
      select: { id: true },
    });
    expect(mockGenerateROIReport).toHaveBeenCalledWith('contract-a');
    expect(res.json).toHaveBeenCalledWith({ contractId: 'contract-a', roiMultiplier: 2 });
  });

  it('não permite que outra Company gere ROI de contrato alheio', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await generateROIReport(contractRequest('COMPANY', 'user-company-b'), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockGenerateROIReport).not.toHaveBeenCalled();
  });

  it('não permite que Company alheia envie review', async () => {
    mockContractFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await submitContractReview(contractRequest('COMPANY', 'user-company-b', { rating: 5 }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockReviewCreate).not.toHaveBeenCalled();
    expect(mockReviewUpdate).not.toHaveBeenCalled();
  });

  it('rejeita usuário não autenticado antes de acessar contratos', () => {
    const req: any = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(mockContractFindFirst).not.toHaveBeenCalled();
  });
});
