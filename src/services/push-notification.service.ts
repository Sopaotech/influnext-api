import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';

// Inicializa o Firebase Admin SDK defensivamente
let firebaseApp: App | null = null;

try {
  // Verifica se há credenciais no ambiente
  const hasServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || false;
  
  if (hasServiceAccount) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);
    firebaseApp = initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK inicializado com sucesso.');
  } else {
    console.log('⚠️ Firebase Admin SDK não configurado. As notificações serão simuladas nos logs.');
  }
} catch (error) {
  console.error('❌ Falha ao inicializar Firebase Admin SDK:', error);
}

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  if (firebaseApp) {
    try {
      const message: Message = {
        token,
        notification: {
          title,
          body,
        },
        data,
      };
      const response = await getMessaging(firebaseApp).send(message);
      console.log(`[PUSH] Push enviado com sucesso. Response: ${response}`);
      return response;
    } catch (error) {
      console.error('[PUSH] Erro ao enviar mensagem via Firebase:', error);
      throw error;
    }
  } else {
    // Modo de Simulação/Fallback
    console.log(`[PUSH SIMULATION] [FCM Token: ${token}] Title: "${title}" | Body: "${body}" | Data: ${JSON.stringify(data)}`);
    return 'simulated-message-id';
  }
};
