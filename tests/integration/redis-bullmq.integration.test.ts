import { Job } from 'bullmq';
import {
  assertSafeRedisTestUrl,
  createRedisBullMqIntegrationHarness,
  RedisBullMqIntegrationHarness,
} from '../helpers/redis-bullmq-integration';

let harness: RedisBullMqIntegrationHarness;

beforeEach(async () => {
  harness = await createRedisBullMqIntegrationHarness(async (job: Job<{ value?: number }>) => {
    if (job.name === 'controlled-failure') {
      throw new Error('controlled BullMQ integration failure');
    }

    return { value: (job.data.value || 0) + 1 };
  });
});

afterEach(async () => {
  await harness.close();
});

describe('local Redis and BullMQ integration', () => {
  it('connects to the local Redis test instance and responds to PING', async () => {
    await expect(harness.ping()).resolves.toBe('PONG');
  });

  it('enqueues and completes a BullMQ job with its processor result', async () => {
    const job = await harness.queue.add('increment', { value: 41 });

    await expect(job.waitUntilFinished(harness.events, 5_000)).resolves.toEqual({ value: 42 });
    await expect(job.getState()).resolves.toBe('completed');
  });

  it('records a controlled processor failure as a failed job', async () => {
    const job = await harness.queue.add('controlled-failure', {});

    await expect(job.waitUntilFinished(harness.events, 5_000))
      .rejects.toThrow('controlled BullMQ integration failure');
    await expect(job.getState()).resolves.toBe('failed');
  });

  it('removes all jobs and Redis keys under its isolated prefix during cleanup', async () => {
    await harness.queue.add('cleanup-check', { value: 1 });

    await harness.cleanup();

    await expect(harness.testKeys()).resolves.toEqual([]);
  });

  it('rejects an external Redis URL before opening a connection', () => {
    expect(() => assertSafeRedisTestUrl('redis://redis.example.test:6380'))
      .toThrow('Redis/BullMQ integration tests require local Redis on port 6380.');
  });
});
