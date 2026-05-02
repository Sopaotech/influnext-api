import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { addNotificationJob } from '../queues/notification.queue';

const prisma = new PrismaClient();

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const postAnalyzerWorker = new Worker(
  'post-analyzer',
  async (job) => {
    const { taskId, proofUrl } = job.data;
    console.log(`[POST ANALYZER] Analisando task ${taskId} com URL ${proofUrl}`);

    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { influencer: { include: { metricsHistory: { take: 1, orderBy: { capturedAt: 'desc' } } } } }
      });

      if (!task || !task.influencer) return;

      const latestMetrics = task.influencer.metricsHistory[0];
      const avgViews = latestMetrics?.avgViews || 1000; // Fallback

      // Simulação de Scraping / API
      // Em um cenário real, usaríamos axios + cheerio ou uma API oficial
      const simulatedViews = avgViews * (Math.random() * (2.0 - 0.5) + 0.5); // Entre 0.5x e 2.0x
      const multiplier = simulatedViews / avgViews;

      // Salvar resultado na task
      await prisma.task.update({
        where: { id: taskId },
        data: { performanceMultiplier: multiplier }
      });

      // Notificar o influencer se explodiu (ROI Positivo)
      if (multiplier >= 1.2) {
        const influencer = await prisma.influencerProfile.findUnique({
           where: { id: task.influencerId },
           select: { userId: true }
        });
        
        if (influencer) {
          await addNotificationJob(
            influencer.userId,
            `🚀 Campeão, aquele post de trend que te sugeri explodiu! Já bateu ${multiplier.toFixed(1)}x sua média. Continua assim!`,
            "ROI_SUCCESS"
          );
        }
      }

      console.log(`[POST ANALYZER] Task ${taskId} finalizada com multiplier ${multiplier.toFixed(2)}x`);
    } catch (error) {
      console.error('[POST ANALYZER] Erro no worker:', error);
    }
  },
  { connection: redisConnection }
);
