import { randomUUID } from 'node:crypto';
import IORedis from 'ioredis';
import { Processor, Queue, QueueEvents, Worker } from 'bullmq';

const LOCAL_REDIS_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const TEST_REDIS_PORT = '6380';

export function assertSafeRedisTestUrl(value = process.env.REDIS_TEST_URL): string {
  if (!value) {
    throw new Error('REDIS_TEST_URL is required for Redis/BullMQ integration tests.');
  }

  const url = new URL(value);
  const isRedis = url.protocol === 'redis:';
  const isLocalHost = LOCAL_REDIS_HOSTS.has(url.hostname);
  const isTestPort = (url.port || '6379') === TEST_REDIS_PORT;

  if (!isRedis || !isLocalHost || !isTestPort) {
    throw new Error('Redis/BullMQ integration tests require local Redis on port 6380.');
  }

  return url.toString();
}

export interface RedisBullMqIntegrationHarness {
  prefix: string;
  queue: Queue;
  events: QueueEvents;
  ping(): Promise<string>;
  testKeys(): Promise<string[]>;
  cleanup(): Promise<void>;
  close(): Promise<void>;
}

export async function createRedisBullMqIntegrationHarness(
  processor: Processor,
): Promise<RedisBullMqIntegrationHarness> {
  const url = assertSafeRedisTestUrl();
  const prefix = `influnext-test-${randomUUID().replace(/-/g, '')}`;
  const queueName = 'bullmq-integration';
  const options = {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };

  const commandConnection = new IORedis(url, options);
  const workerConnection = new IORedis(url, options);
  const eventsConnection = new IORedis(url, options);

  await Promise.all([
    commandConnection.connect(),
    workerConnection.connect(),
    eventsConnection.connect(),
  ]);

  const queue = new Queue(queueName, { connection: commandConnection, prefix });
  const worker = new Worker(queueName, processor, { connection: workerConnection, prefix });
  const events = new QueueEvents(queueName, { connection: eventsConnection, prefix });

  await Promise.all([queue.waitUntilReady(), worker.waitUntilReady(), events.waitUntilReady()]);

  let cleaned = false;
  let closed = false;

  const testKeys = async (): Promise<string[]> => commandConnection.keys(`${prefix}:*`);

  const cleanup = async (): Promise<void> => {
    if (cleaned) return;
    cleaned = true;

    await worker.close();
    await events.close();
    await queue.obliterate({ force: true });

    const keys = await testKeys();
    if (keys.length > 0) {
      await commandConnection.del(...keys);
    }
  };

  return {
    prefix,
    queue,
    events,
    ping: () => commandConnection.ping(),
    testKeys,
    cleanup,
    close: async () => {
      if (closed) return;
      closed = true;
      await cleanup();
      await queue.close();
      await Promise.all([
        commandConnection.quit(),
        workerConnection.quit(),
        eventsConnection.quit(),
      ]);
    },
  };
}
