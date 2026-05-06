import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';

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
