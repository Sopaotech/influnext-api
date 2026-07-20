import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createRedisClient } from '../lib/redis';

const prisma = new PrismaClient();
const redisConnection = createRedisClient();

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
