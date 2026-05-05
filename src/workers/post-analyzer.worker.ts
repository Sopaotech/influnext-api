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

export const postAnalyzerWorker = new Worker(
  'post-analyzer',
  async (job) => {
    const { taskId, proofUrl } = job.data;
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { influencer: { include: { metricsHistory: { take: 1, orderBy: { capturedAt: 'desc' } } } } }
      });

      if (!task || !task.influencer) return;

      const latestMetrics = task.influencer.metricsHistory[0];
      const avgViews = latestMetrics?.avgViews || 1000;
      // Performance neutra até integração com Graph API para fetch de insights reais
      const multiplier = 1.0;

      await prisma.task.update({
        where: { id: taskId },
        data: { performanceMultiplier: multiplier }
      });

      console.log(`[ANALYZER] Task ${taskId} Performance: ${multiplier.toFixed(2)}x`);
    } catch (error) {
      // Erro logado apenas internamente
    }
  },
  { connection: redisConnection }
);
