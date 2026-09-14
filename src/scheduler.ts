import { redisConnection } from './lib/redis';
import {
  closeApplicationScheduleQueues,
  registerApplicationSchedules,
} from './queues/scheduler';

export interface SchedulerProcessRuntime {
  shutdown(): Promise<void>;
}

function assertSchedulerRuntimeConfiguration(): void {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required to start the scheduler process.');
  }
}

async function waitForSchedulerRedisReady(): Promise<void> {
  if (redisConnection.status === 'wait') {
    await redisConnection.connect();
  }

  if (redisConnection.status === 'ready') {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      redisConnection.removeListener('ready', onReady);
      redisConnection.removeListener('error', onError);
    };

    redisConnection.once('ready', onReady);
    redisConnection.once('error', onError);

    if (redisConnection.status === 'ready') {
      onReady();
    }
  });
}

async function closeSchedulerResources(): Promise<void> {
  await closeApplicationScheduleQueues();

  if (redisConnection.status === 'ready') {
    await redisConnection.quit();
  } else if (redisConnection.status !== 'end') {
    redisConnection.disconnect();
  }
}

/**
 * Connects Redis and registers only recurring job schedulers. It deliberately
 * does not import the HTTP app or application workers.
 */
export async function startSchedulerProcess(): Promise<SchedulerProcessRuntime> {
  assertSchedulerRuntimeConfiguration();

  try {
    await waitForSchedulerRedisReady();

    await registerApplicationSchedules();

    let stopped = false;
    return {
      shutdown: async () => {
        if (stopped) return;
        stopped = true;
        await closeSchedulerResources();
      },
    };
  } catch (error) {
    await closeSchedulerResources();
    throw error;
  }
}

/** Registers signal handling only when the scheduler command is run directly. */
export async function runSchedulerProcess(): Promise<SchedulerProcessRuntime> {
  const runtime = await startSchedulerProcess();
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);

    try {
      console.log(`[SCHEDULER] Recebido ${signal}; encerrando scheduler...`);
      await runtime.shutdown();
      console.log('[SCHEDULER] Scheduler encerrado.');
    } catch (error) {
      console.error('[SCHEDULER] Falha durante shutdown controlado.', error);
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
  void runSchedulerProcess().catch((error: unknown) => {
    console.error('[SCHEDULER] Falha ao iniciar scheduler.', error);
    process.exitCode = 1;
  });
}
