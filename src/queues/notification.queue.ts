import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  // Estratégia de reconexão bem lenta para não poluir o log
  retryStrategy: (times) => {
    return Math.min(times * 2000, 30000); 
  }
});

// Silenciar logs de erro de conexão para não poluir o terminal do usuário
connection.on('error', () => {});

export const notificationQueue = new Queue('notifications', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000
  }
});

export const addNotificationJob = async (userId: string, message: string, type: string) => {
  try {
    if (connection.status === 'ready') {
      await notificationQueue.add('send-notification', { userId, message, type }, {
        attempts: 1,
        backoff: { type: 'exponential', delay: 5000 }
      });
    }
  } catch (error) {
    // Silencioso em dev
  }
};
