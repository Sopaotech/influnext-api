import { QuickAlertService } from '../src/services/quick-alert.service';
import { prisma } from '../src/lib/prisma';
import { addNotificationJob } from '../src/queues/notification.queue';
import axios from 'axios';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    notification: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'notif-1', ...args.data }))
    }
  }
}));

jest.mock('../src/queues/notification.queue', () => ({
  addNotificationJob: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('QuickAlertService (Notificações Rápidas Multicanal)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('deve disparar alerta de nova proposta (In-App e Push Queue)', async () => {
    const result = await QuickAlertService.notifyNewOffer({
      recipientUserId: 'user-inf-1',
      campaignTitle: 'Campanha Black Friday',
      brandName: 'Nike Brasil',
      budget: 3500,
      contractId: 'contract-123'
    });

    expect(result).toBe(true);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-inf-1',
        message: expect.stringContaining('Nike Brasil'),
        type: 'CONTRACT_OFFER'
      }
    });
    expect(addNotificationJob).toHaveBeenCalledWith(
      'user-inf-1',
      expect.stringContaining('Campanha Black Friday'),
      'CONTRACT_OFFER'
    );
  });

  it('deve disparar alerta de confirmação de Escrow (In-App e Push Queue)', async () => {
    const result = await QuickAlertService.notifyEscrowConfirmed({
      recipientUserId: 'user-inf-1',
      contractTitle: 'Reels Lançamento',
      netAmount: 1860,
      contractId: 'contract-456'
    });

    expect(result).toBe(true);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-inf-1',
        message: expect.stringContaining('retido com segurança no Escrow'),
        type: 'ESCROW_CONFIRMED'
      }
    });
    expect(addNotificationJob).toHaveBeenCalledWith(
      'user-inf-1',
      expect.stringContaining('1860.00'),
      'ESCROW_CONFIRMED'
    );
  });

  it('deve disparar alerta de entrega submetida para a empresa', async () => {
    const result = await QuickAlertService.notifyDeliverableSubmitted({
      recipientUserId: 'user-company-1',
      contractTitle: 'Story Exclusivo',
      creatorHandle: 'creator_pro',
      contractId: 'contract-789'
    });

    expect(result).toBe(true);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-company-1',
        message: expect.stringContaining('@creator_pro'),
        type: 'DELIVERABLE_SUBMITTED'
      }
    });
  });

  it('deve disparar alerta de liberação de pagamento do Escrow', async () => {
    const result = await QuickAlertService.notifyPaymentReleased({
      recipientUserId: 'user-inf-1',
      contractTitle: 'TikTok Viral',
      netAmount: 2500,
      contractId: 'contract-999'
    });

    expect(result).toBe(true);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-inf-1',
        message: expect.stringContaining('2500.00 referente ao contrato "TikTok Viral" foi liberado'),
        type: 'PAYMENT_RELEASED'
      }
    });
  });

  it('deve despachar webhook externo quando WHATSAPP_WEBHOOK_URL estiver configurado', async () => {
    process.env.WHATSAPP_WEBHOOK_URL = 'https://api.whatsapp-gateway.mock/send';
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    const result = await QuickAlertService.notifyEscrowConfirmed({
      recipientUserId: 'user-inf-1',
      contractTitle: 'Campanha Webhook',
      netAmount: 1000,
      contractId: 'contract-hook'
    });

    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.whatsapp-gateway.mock/send',
      expect.objectContaining({
        userId: 'user-inf-1',
        type: 'ESCROW_CONFIRMED',
        contractId: 'contract-hook'
      }),
      expect.any(Object)
    );
  });
});
