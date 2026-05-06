import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';

export const notificationQueue = new Queue('notifications', { 
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000
  }
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
