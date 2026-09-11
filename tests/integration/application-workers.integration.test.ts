import { Job } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  createRedisBullMqIntegrationHarness,
  RedisBullMqIntegrationHarness,
} from '../helpers/redis-bullmq-integration';
import {
  clearIntegrationDatabase,
  disconnectIntegrationPrisma,
  integrationPrisma,
} from '../helpers/postgres-integration';

const mockSendPushNotification = jest.fn();

jest.mock('../../src/services/push-notification.service', () => ({
  sendPushNotification: mockSendPushNotification,
}));

import {
  createNotificationWorker,
  notificationWorker,
  processNotification,
} from '../../src/workers/notification.worker';
import {
  cleanupWorker,
  createCleanupWorker,
  processCleanup,
} from '../../src/workers/cleanup.worker';
import { prisma } from '../../src/lib/prisma';

let harness: RedisBullMqIntegrationHarness | undefined;

function fakeEmail(): string {
  return `worker-${randomUUID()}@example.test`;
}

function fakeHandle(): string {
  return `worker_${randomUUID().replace(/-/g, '')}`;
}

async function closeHarness(): Promise<void> {
  if (!harness) return;
  const currentHarness = harness;
  harness = undefined;
  await currentHarness.close();
}

beforeEach(async () => {
  await closeHarness();
  await clearIntegrationDatabase();
  jest.clearAllMocks();
});

afterEach(async () => {
  await closeHarness();
});

afterAll(async () => {
  await clearIntegrationDatabase();
  await prisma.$disconnect();
  await disconnectIntegrationPrisma();
});

describe('controlled application worker integration', () => {
  it('does not auto-start notification or cleanup workers in test mode', () => {
    expect(notificationWorker).toBeUndefined();
    expect(cleanupWorker).toBeUndefined();
  });

  it('processes a notification job with the real worker against local PostgreSQL and mocked push delivery', async () => {
    const user = await integrationPrisma.user.create({
      data: {
        email: fakeEmail(),
        passwordHash: 'worker-integration-hash',
        role: 'INFLUENCER',
        fcmToken: 'fake-fcm-token',
      },
    });

    harness = await createRedisBullMqIntegrationHarness(processNotification, {
      queueName: 'notifications',
      workerFactory: createNotificationWorker,
    });

    const job = await harness.queue.add('send-notification', {
      userId: user.id,
      message: 'Controlled worker notification',
      type: 'TEST_NOTIFICATION',
    });

    await expect(job.waitUntilFinished(harness.events, 5_000)).resolves.toEqual({ success: true });
    expect(mockSendPushNotification).toHaveBeenCalledWith(
      'fake-fcm-token',
      'InfluNext',
      'Controlled worker notification',
      { type: 'TEST_NOTIFICATION' },
    );
  });

  it('runs the cleanup worker only against expired local test data and preserves active data', async () => {
    const user = await integrationPrisma.user.create({
      data: { email: fakeEmail(), passwordHash: 'worker-integration-hash', role: 'INFLUENCER' },
    });
    const influencer = await integrationPrisma.influencerProfile.create({
      data: { userId: user.id, handle: fakeHandle() },
    });
    const now = Date.now();
    const [expiredReference, activeReference] = await Promise.all([
      integrationPrisma.trendReference.create({
        data: {
          influencerId: influencer.id,
          title: 'Expired controlled fixture',
          videoUrl: 'https://example.test/expired',
          niche: 'test',
          expiresAt: new Date(now - 1_000),
        },
      }),
      integrationPrisma.trendReference.create({
        data: {
          influencerId: influencer.id,
          title: 'Active controlled fixture',
          videoUrl: 'https://example.test/active',
          niche: 'test',
          expiresAt: new Date(now + 60_000),
        },
      }),
    ]);

    harness = await createRedisBullMqIntegrationHarness(processCleanup as (job: Job) => Promise<void>, {
      queueName: 'cleanup-tasks',
      workerFactory: createCleanupWorker,
    });

    const job = await harness.queue.add('daily-cleanup', {});
    await job.waitUntilFinished(harness.events, 5_000);

    await expect(integrationPrisma.trendReference.findUnique({ where: { id: expiredReference.id } }))
      .resolves.toBeNull();
    await expect(integrationPrisma.trendReference.findUnique({ where: { id: activeReference.id } }))
      .resolves.toMatchObject({ id: activeReference.id });
  });
});
