import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const cleanupQueue = new Queue('cleanup-tasks', {
  connection: redisConnection,
});

export const addDailyCleanupJob = async () => {
  await cleanupQueue.add(
    'daily-cleanup',
    {},
    {
      repeat: {
        pattern: '0 3 * * *', // Todo dia às 3 da manhã
      },
    }
  );
};
