import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';

// Criamos a fila apenas se necessário, mas com tratamento de erro
export const notificationQueue = new Queue('notifications', { 
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000
  }
});

notificationQueue.on('error', () => {
  // Ignora erro de conexão do Redis para não derrubar o host
});

// Silenciar erros de conexão da fila
notificationQueue.on('error', () => {
  // console.log('⚠️ [Queue] Redis indisponível, notificações em background pausadas.');
});

export const addNotificationJob = async (userId: string, message: string, type: string) => {
  try {
    if (redisConnection.status === 'ready') {
      await notificationQueue.add('send-notification', { userId, message, type }, {
        attempts: 1,
        backoff: { type: 'exponential', delay: 5000 }
      });
    }
  } catch (error) {
    // Silencioso em dev
  }
};
