import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 5000, 60000)
});

// Silenciar logs de erro de conexão
connection.on('error', () => {});

export const notificationWorker = new Worker('notifications', async (job) => {
  const { userId, message, type } = job.data;
  console.log(`[NOTIFICAÇÃO] User ${userId}: ${message}`);
  return { success: true };
}, { connection });

notificationWorker.on('error', () => {
  // Ignora erro de conexão do Redis para não derrubar o host
});
