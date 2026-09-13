import { randomUUID } from 'node:crypto';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import {
  DAILY_CLEANUP_PATTERN,
  DAILY_TOKEN_RENEWAL_PATTERN,
  registerDailyCleanupSchedule,
  registerDailyTokenRenewalSchedule,
} from '../../src/queues/schedule-registration';
import { assertSafeRedisTestUrl } from '../helpers/redis-bullmq-integration';

let commandConnection: IORedis;
let cleanupQueue: Queue;
let tokenRenewalQueue: Queue;
let prefix: string;
let resourcesClosed = false;

async function closeSchedulerTestResources(): Promise<string[]> {
  if (resourcesClosed) return [];
  resourcesClosed = true;

  const [cleanupSchedules, tokenRenewalSchedules] = await Promise.all([
    cleanupQueue.getRepeatableJobs(),
    tokenRenewalQueue.getRepeatableJobs(),
  ]);
  await Promise.all([
    ...cleanupSchedules.map(schedule => cleanupQueue.removeRepeatableByKey(schedule.key)),
    ...tokenRenewalSchedules.map(schedule => tokenRenewalQueue.removeRepeatableByKey(schedule.key)),
  ]);
  await Promise.all([
    cleanupQueue.obliterate({ force: true }),
    tokenRenewalQueue.obliterate({ force: true }),
  ]);
  await Promise.all([cleanupQueue.close(), tokenRenewalQueue.close()]);

  const keys = await commandConnection.keys(`${prefix}:*`);
  if (keys.length > 0) {
    await commandConnection.del(...keys);
  }
  const remainingKeys = await commandConnection.keys(`${prefix}:*`);
  await commandConnection.quit();
  return remainingKeys;
}

beforeEach(async () => {
  const url = assertSafeRedisTestUrl();
  prefix = `influnext-scheduler-test-${randomUUID().replace(/-/g, '')}`;
  resourcesClosed = false;
  commandConnection = new IORedis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  await commandConnection.connect();

  cleanupQueue = new Queue('cleanup-tasks', { connection: commandConnection, prefix });
  tokenRenewalQueue = new Queue('token-renewal-tasks', { connection: commandConnection, prefix });
  await Promise.all([cleanupQueue.waitUntilReady(), tokenRenewalQueue.waitUntilReady()]);
});

afterEach(async () => {
  await closeSchedulerTestResources();
});

describe('local BullMQ scheduler registration', () => {
  it('registers deterministic daily cleanup and token renewal repeatable jobs', async () => {
    await Promise.all([
      registerDailyCleanupSchedule(cleanupQueue),
      registerDailyTokenRenewalSchedule(tokenRenewalQueue),
    ]);

    await expect(cleanupQueue.getRepeatableJobs()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'daily-cleanup',
        pattern: DAILY_CLEANUP_PATTERN,
      }),
    ]));
    await expect(tokenRenewalQueue.getRepeatableJobs()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'daily-token-renewal',
        pattern: DAILY_TOKEN_RENEWAL_PATTERN,
      }),
    ]));
  });

  it('uses stable repeat keys without adding duplicate schedules after a second registration', async () => {
    await registerDailyCleanupSchedule(cleanupQueue);
    await registerDailyTokenRenewalSchedule(tokenRenewalQueue);
    const [firstCleanupSchedule] = await cleanupQueue.getRepeatableJobs();
    const [firstTokenRenewalSchedule] = await tokenRenewalQueue.getRepeatableJobs();

    await registerDailyCleanupSchedule(cleanupQueue);
    await registerDailyTokenRenewalSchedule(tokenRenewalQueue);

    const [cleanupSchedules, tokenRenewalSchedules] = await Promise.all([
      cleanupQueue.getRepeatableJobs(),
      tokenRenewalQueue.getRepeatableJobs(),
    ]);
    expect(cleanupSchedules).toHaveLength(1);
    expect(tokenRenewalSchedules).toHaveLength(1);
    expect(cleanupSchedules[0].key).toBe(firstCleanupSchedule.key);
    expect(tokenRenewalSchedules[0].key).toBe(firstTokenRenewalSchedule.key);
  });

  it('removes repeatable metadata and all test-prefix keys during cleanup', async () => {
    await registerDailyCleanupSchedule(cleanupQueue);
    await registerDailyTokenRenewalSchedule(tokenRenewalQueue);

    const closedKeys = await closeSchedulerTestResources();

    expect(closedKeys).toEqual([]);
  });
});
