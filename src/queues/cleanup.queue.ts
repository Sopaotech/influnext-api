import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { registerDailyCleanupSchedule } from './schedule-registration';

export const cleanupQueue = new Queue('cleanup-tasks', {
  connection: redisConnection,
});

cleanupQueue.on('error', () => {
  // Ignora erro de conexão do Redis
});

export const addDailyCleanupJob = async () => {
  await registerDailyCleanupSchedule(cleanupQueue);
};
