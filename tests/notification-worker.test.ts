// Mock dos módulos antes de importar o worker para isolar o ambiente de teste
jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn()
  }))
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn()
  }));
});

const mockFindUnique = jest.fn();
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique
    }
  }
}));

const mockSendPush = jest.fn();
jest.mock('../src/services/push-notification.service', () => ({
  sendPushNotification: mockSendPush
}));

// Importamos a função direta do processador do worker
import { processNotification } from '../src/workers/notification.worker';

describe('Processador da Fila de Notificação (notification.worker.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve enviar notificação push se o usuário tiver fcmToken cadastrado', async () => {
    mockFindUnique.mockResolvedValue({ fcmToken: 'user-fcm-token-123' });

    const mockJob = {
      data: {
        userId: 'usr_abc123',
        message: 'Você recebeu um pagamento de R$ 150,00',
        type: 'ESCROW_CONFIRMED'
      }
    };

    const result = await processNotification(mockJob);

    expect(result).toEqual({ success: true });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'usr_abc123' },
      select: { fcmToken: true }
    });
    expect(mockSendPush).toHaveBeenCalledWith(
      'user-fcm-token-123',
      'InfluNext',
      'Você recebeu um pagamento de R$ 150,00',
      { type: 'ESCROW_CONFIRMED' }
    );
  });

  it('não deve enviar push se o usuário não possuir fcmToken', async () => {
    mockFindUnique.mockResolvedValue({ fcmToken: null });

    const mockJob = {
      data: {
        userId: 'usr_xyz789',
        message: 'Nova campanha aberta',
        type: 'NEW_CAMPAIGN'
      }
    };

    const result = await processNotification(mockJob);

    expect(result).toEqual({ success: true });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'usr_xyz789' },
      select: { fcmToken: true }
    });
    expect(mockSendPush).not.toHaveBeenCalled();
  });

  it('deve tratar erros de forma resiliente sem quebrar a execução do worker', async () => {
    mockFindUnique.mockRejectedValue(new Error('Erro de conexão ao banco'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const mockJob = {
      data: {
        userId: 'usr_error',
        message: 'Mensagem de teste de erro',
        type: 'ERROR_TEST'
      }
    };

    const result = await processNotification(mockJob);

    // O worker deve retornar sucesso mesmo se falhar o envio do push, para o job não travar infinitamente
    expect(result).toEqual({ success: true });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[PUSH ERROR]'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
