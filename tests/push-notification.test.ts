// Mock dos módulos do Firebase Admin antes de qualquer importação
const mockSend = jest.fn();
const mockGetMessaging = jest.fn().mockReturnValue({
  send: mockSend
});

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn().mockReturnValue({}),
  cert: jest.fn()
}));

jest.mock('firebase-admin/messaging', () => ({
  getMessaging: mockGetMessaging
}));

import { sendPushNotification } from '../src/services/push-notification.service';

describe('Serviço de Envio de Push (push-notification.service.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve simular o envio de push quando o Firebase não está configurado', async () => {
    // Para este teste, fingimos que firebaseApp é nulo (comportamento padrão sem credenciais no .env)
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const result = await sendPushNotification('mock-token', 'Título Teste', 'Corpo Teste', { type: 'TEST' });
    
    expect(result).toBe('simulated-message-id');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[PUSH SIMULATION]')
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('mock-token')
    );
    
    logSpy.mockRestore();
  });
});
