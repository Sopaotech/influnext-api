import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';

export const cleanupQueue = new Queue('cleanup-tasks', {
  connection: redisConnection,
});

cleanupQueue.on('error', () => {
  // Ignora erro de conexão do Redis
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
