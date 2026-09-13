import { Worker } from 'bullmq';
import { prisma } from './lib/prisma';
import { redisConnection } from './lib/redis';
import { startCleanupWorker } from './workers/cleanup.worker';
import { startNotificationWorker } from './workers/notification.worker';

export interface WorkerProcessRuntime {
  workers: Worker[];
  shutdown(): Promise<void>;
}

function assertWorkerRuntimeConfiguration(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to start application workers.');
  }

  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required to start application workers.');
  }
}

async function closeWorkerResources(workers: Worker[]): Promise<void> {
  await Promise.allSettled(workers.map(worker => worker.close()));

  if (redisConnection.status !== 'end') {
    await redisConnection.quit();
  }

  await prisma.$disconnect();
}

/**
 * Starts only the explicitly supported application workers. It deliberately
 * does not import the HTTP app, scheduler queues, token renewal, or analyzer.
 */
export async function startWorkerProcess(): Promise<WorkerProcessRuntime> {
  assertWorkerRuntimeConfiguration();

  const workers: Worker[] = [];

  try {
    await prisma.$connect();

    if (redisConnection.status === 'wait') {
      await redisConnection.connect();
    }

    if (redisConnection.status !== 'ready') {
      throw new Error('Redis is not ready for application workers.');
    }

    workers.push(startNotificationWorker(), startCleanupWorker());
    await Promise.all(workers.map(worker => worker.waitUntilReady()));

    let stopped = false;
    return {
      workers,
      shutdown: async () => {
        if (stopped) return;
        stopped = true;
        await closeWorkerResources(workers);
      },
    };
  } catch (error) {
    await closeWorkerResources(workers);
    throw error;
  }
}

/** Registers signal handling only when the worker command is run directly. */
export async function runWorkerProcess(): Promise<WorkerProcessRuntime> {
  const runtime = await startWorkerProcess();
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);

    try {
      console.log(`[WORKER] Recebido ${signal}; encerrando workers...`);
      await runtime.shutdown();
      console.log('[WORKER] Workers encerrados.');
    } catch (error) {
      console.error('[WORKER] Falha durante shutdown controlado.', error);
      process.exitCode = 1;
    }
  };

  const onSigint = () => void shutdown('SIGINT');
  const onSigterm = () => void shutdown('SIGTERM');
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);

  return runtime;
}

if (require.main === module) {
  void runWorkerProcess().catch((error: unknown) => {
    console.error('[WORKER] Falha ao iniciar processo de workers.', error);
    process.exitCode = 1;
  });
}
