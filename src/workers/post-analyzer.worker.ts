import { ConnectionOptions, Job, Worker, WorkerOptions } from 'bullmq';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';
import { ScoringService } from '../services/scoring.service';

export async function processPostAnalysis(job: Job): Promise<void> {
  const { taskId } = job.data;
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { influencer: { include: { metricsHistory: { take: 1, orderBy: { capturedAt: 'desc' } } } } },
    });

    if (!task || !task.influencer) return;

    // Performance neutra até integração com Graph API para fetch de insights reais.
    const multiplier = 1.0;
    await prisma.task.update({
      where: { id: taskId },
      data: { performanceMultiplier: multiplier },
    });
    await ScoringService.calculateAndPersist(task.influencer.id);
    console.log(`[ANALYZER] Task ${taskId} Performance: ${multiplier.toFixed(2)}x - Score atualizado.`);
  } catch {
    // Never log provider payloads, proof URLs, or stack traces. Rethrow a
    // generic error so BullMQ records a controlled failed job.
    console.error('[ANALYZER] Falha controlada ao processar análise de post.');
    throw new Error('Post analysis job failed.');
  }
}

export type ControlledPostAnalyzerWorkerOptions = Pick<WorkerOptions, 'prefix'> & {
  connection?: ConnectionOptions;
};

/** Creates a worker without causing Redis work on module import. */
export function createPostAnalyzerWorker(options: ControlledPostAnalyzerWorkerOptions = {}): Worker {
  return new Worker('post-analyzer', processPostAnalysis, {
    connection: options.connection || redisConnection,
    prefix: options.prefix,
  });
}

export let postAnalyzerWorker: Worker | undefined;

export function startPostAnalyzerWorker(): Worker {
  postAnalyzerWorker ||= createPostAnalyzerWorker();
  return postAnalyzerWorker;
}
