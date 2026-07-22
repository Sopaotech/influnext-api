import { Worker } from 'bullmq';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';


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
