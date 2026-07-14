import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';

export const postAnalyzerQueue = new Queue('post-analyzer', {
  connection: redisConnection,
});

postAnalyzerQueue.on('error', () => {
  // Ignora erro de conexão do Redis
});

export const addPostAnalysisJob = async (taskId: string, proofUrl: string) => {
  // Agenda para 24h depois (86400000 ms)
  await postAnalyzerQueue.add(
    'analyze-post',
    { taskId, proofUrl },
    { delay: 86400000 }
  );
};
