import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 5000, 60000)
});

redisConnection.on('error', () => {});

export const cleanupWorker = new Worker(
  'cleanup-tasks',
  async (job) => {
    if (job.name === 'daily-cleanup') {
      const deleted = await prisma.trendReference.deleteMany({
        where: { expiresAt: { lt: new Date() } }
      });
      console.log(`[CLEANUP] ${deleted.count} referências removidas.`);
    }
  },
  { connection: redisConnection }
);
