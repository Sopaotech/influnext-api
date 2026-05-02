import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const notificationQueue = new Queue('notifications', { connection });

export const addNotificationJob = async (userId: string, message: string, type: string) => {
  try {
    await notificationQueue.add('send-notification', { userId, message, type }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
  } catch (error) {
    console.error('[QUEUE] Falha ao enfileirar job de notificação:', error);
  }
};
