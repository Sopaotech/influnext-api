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
const mockTikTokRefresh = jest.fn();
const mockInstagramRefresh = jest.fn();
const mockInstagramSync = jest.fn();
const mockCalculateAndPersist = jest.fn();

jest.mock('../../src/services/push-notification.service', () => ({
  sendPushNotification: mockSendPushNotification,
}));
jest.mock('../../src/services/tiktok.service', () => ({
  TikTokService: { refreshAccessToken: mockTikTokRefresh },
}));
jest.mock('../../src/services/instagram.service', () => ({
  InstagramService: {
    refreshLongLivedToken: mockInstagramRefresh,
    syncInstagramData: mockInstagramSync,
  },
}));
jest.mock('../../src/services/scoring.service', () => ({
  ScoringService: { calculateAndPersist: mockCalculateAndPersist },
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
import {
  createTokenRenewalWorker,
  processTokenRenewal,
  tokenRenewalWorker,
} from '../../src/workers/token-renewal.worker';
import {
  createPostAnalyzerWorker,
  postAnalyzerWorker,
  processPostAnalysis,
} from '../../src/workers/post-analyzer.worker';
import { instagramSyncWorker } from '../../src/workers/instagram-sync.worker';
import { prisma } from '../../src/lib/prisma';
import { decryptSocialToken, encryptSocialToken, isEncryptedSocialToken } from '../../src/utils/social-token-crypto';

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
  it('does not auto-start application workers in test mode', () => {
    expect(notificationWorker).toBeUndefined();
    expect(cleanupWorker).toBeUndefined();
    expect(tokenRenewalWorker).toBeUndefined();
    expect(postAnalyzerWorker).toBeUndefined();
    expect(instagramSyncWorker).toBeUndefined();
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

  it('renews an encrypted TikTok token through a controlled worker with a mocked provider', async () => {
    const user = await integrationPrisma.user.create({
      data: { email: fakeEmail(), passwordHash: 'worker-integration-hash', role: 'INFLUENCER' },
    });
    const influencer = await integrationPrisma.influencerProfile.create({
      data: { userId: user.id, handle: fakeHandle() },
    });
    const oldRefreshToken = 'fake-tiktok-refresh-token';
    const platform = await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: influencer.id,
        platformName: 'TIKTOK',
        platformId: ['tiktok', randomUUID()].join('-'),
        accessToken: encryptSocialToken('fake-old-access-token', {
          influencerId: influencer.id, platformName: 'TIKTOK', field: 'accessToken',
        }),
        refreshToken: encryptSocialToken(oldRefreshToken, {
          influencerId: influencer.id, platformName: 'TIKTOK', field: 'refreshToken',
        }),
        expiresAt: new Date(Date.now() - 1_000),
      },
    });
    mockTikTokRefresh.mockResolvedValue({
      accessToken: 'fake-renewed-access-token',
      refreshToken: 'fake-renewed-refresh-token',
      refreshTokenRotated: true,
      expiresIn: 3_600,
    });

    harness = await createRedisBullMqIntegrationHarness(processTokenRenewal, {
      queueName: 'token-renewal-tasks',
      workerFactory: createTokenRenewalWorker,
    });
    const job = await harness.queue.add('daily-token-renewal', {});
    await expect(job.waitUntilFinished(harness.events, 5_000)).resolves.toBeNull();

    const renewed = await integrationPrisma.socialPlatform.findUniqueOrThrow({ where: { id: platform.id } });
    expect(mockTikTokRefresh).toHaveBeenCalledWith(oldRefreshToken);
    expect(isEncryptedSocialToken(renewed.accessToken)).toBe(true);
    expect(isEncryptedSocialToken(renewed.refreshToken!)).toBe(true);
    expect(decryptSocialToken(renewed.accessToken, {
      influencerId: influencer.id, platformName: 'TIKTOK', field: 'accessToken',
    }).value).toBe('fake-renewed-access-token');
    expect(decryptSocialToken(renewed.refreshToken!, {
      influencerId: influencer.id, platformName: 'TIKTOK', field: 'refreshToken',
    }).value).toBe('fake-renewed-refresh-token');
  });

  it('contains a mocked TikTok provider failure without logging its fake token', async () => {
    const user = await integrationPrisma.user.create({
      data: { email: fakeEmail(), passwordHash: 'worker-integration-hash', role: 'INFLUENCER' },
    });
    const influencer = await integrationPrisma.influencerProfile.create({
      data: { userId: user.id, handle: fakeHandle() },
    });
    const leakedFakeToken = 'fake-refresh-token-must-not-appear';
    await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: influencer.id,
        platformName: 'TIKTOK',
        platformId: ['tiktok', randomUUID()].join('-'),
        accessToken: encryptSocialToken('fake-old-access-token', {
          influencerId: influencer.id, platformName: 'TIKTOK', field: 'accessToken',
        }),
        refreshToken: encryptSocialToken(leakedFakeToken, {
          influencerId: influencer.id, platformName: 'TIKTOK', field: 'refreshToken',
        }),
        expiresAt: new Date(Date.now() - 1_000),
      },
    });
    mockTikTokRefresh.mockRejectedValue(new Error('refresh_token=' + leakedFakeToken));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    harness = await createRedisBullMqIntegrationHarness(processTokenRenewal, {
      queueName: 'token-renewal-tasks',
      workerFactory: createTokenRenewalWorker,
    });
    const job = await harness.queue.add('daily-token-renewal', {});
    await expect(job.waitUntilFinished(harness.events, 5_000)).resolves.toBeNull();

    expect(mockTikTokRefresh).toHaveBeenCalledWith(leakedFakeToken);
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(leakedFakeToken);
    errorSpy.mockRestore();
  });

  it('processes post analysis with the real worker, local PostgreSQL, and mocked scoring', async () => {
    const user = await integrationPrisma.user.create({
      data: { email: fakeEmail(), passwordHash: 'worker-integration-hash', role: 'INFLUENCER' },
    });
    const influencer = await integrationPrisma.influencerProfile.create({
      data: { userId: user.id, handle: fakeHandle() },
    });
    const task = await integrationPrisma.task.create({
      data: { influencerId: influencer.id, title: 'Controlled post analysis task' },
    });

    harness = await createRedisBullMqIntegrationHarness(processPostAnalysis, {
      queueName: 'post-analyzer',
      workerFactory: createPostAnalyzerWorker,
    });
    const job = await harness.queue.add('analyze-post', {
      taskId: task.id,
      proofUrl: 'https://example.test/fake-proof',
    });
    await expect(job.waitUntilFinished(harness.events, 5_000)).resolves.toBeNull();

    await expect(integrationPrisma.task.findUniqueOrThrow({ where: { id: task.id } }))
      .resolves.toMatchObject({ performanceMultiplier: 1 });
    expect(mockCalculateAndPersist).toHaveBeenCalledWith(influencer.id);
  });

  it('records a generic failed post analysis job without exposing its proof URL', async () => {
    const user = await integrationPrisma.user.create({
      data: { email: fakeEmail(), passwordHash: 'worker-integration-hash', role: 'INFLUENCER' },
    });
    const influencer = await integrationPrisma.influencerProfile.create({
      data: { userId: user.id, handle: fakeHandle() },
    });
    const task = await integrationPrisma.task.create({
      data: { influencerId: influencer.id, title: 'Controlled failing post analysis task' },
    });
    const proofUrl = 'https://example.test/private-proof-must-not-appear';
    mockCalculateAndPersist.mockRejectedValue(new Error('provider failure'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    harness = await createRedisBullMqIntegrationHarness(processPostAnalysis, {
      queueName: 'post-analyzer',
      workerFactory: createPostAnalyzerWorker,
    });
    const job = await harness.queue.add('analyze-post', { taskId: task.id, proofUrl });
    await expect(job.waitUntilFinished(harness.events, 5_000)).rejects.toThrow('Post analysis job failed.');

    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain(proofUrl);
    errorSpy.mockRestore();
  });
});
