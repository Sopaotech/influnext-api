import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const postAnalyzerQueue = new Queue('post-analyzer', {
  connection: redisConnection,
});

export const addPostAnalysisJob = async (taskId: string, proofUrl: string) => {
  // Agenda para 24h depois (86400000 ms)
  await postAnalyzerQueue.add(
    'analyze-post',
    { taskId, proofUrl },
    { delay: 86400000 }
  );
};
