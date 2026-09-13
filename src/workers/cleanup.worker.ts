import { ConnectionOptions, Job, Worker, WorkerOptions } from 'bullmq';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';

export async function processCleanup(job: Job): Promise<void> {
  if (job.name !== 'daily-cleanup') return;

  const deleted = await prisma.trendReference.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`[CLEANUP] ${deleted.count} referências removidas.`);
}

export type ControlledWorkerOptions = Pick<WorkerOptions, 'prefix'> & {
  connection?: ConnectionOptions;
};

export function createCleanupWorker(options: ControlledWorkerOptions = {}): Worker {
  return new Worker('cleanup-tasks', processCleanup, {
    connection: options.connection || redisConnection,
    prefix: options.prefix,
  });
}

// Runtime entrypoints opt in explicitly so importing this module remains safe.
// The legacy HTTP runtime calls startCleanupWorker() to preserve its current behavior.
export let cleanupWorker: Worker | undefined;

export function startCleanupWorker(): Worker {
  cleanupWorker ||= createCleanupWorker();
  return cleanupWorker;
}
