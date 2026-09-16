import axios from 'axios';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

jest.mock('axios');
jest.mock('../../src/services/scoring.service', () => ({
  ScoringService: { calculateAndPersist: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../src/services/ai.service', () => ({
  AIService: { generateWeeklyAnalysis: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../src/queues/notification.queue', () => ({ addNotificationJob: jest.fn() }));

import {
  createRedisBullMqIntegrationHarness,
  RedisBullMqIntegrationHarness,
} from '../helpers/redis-bullmq-integration';
import {
  clearIntegrationDatabase,
  disconnectIntegrationPrisma,
  integrationPrisma,
} from '../helpers/postgres-integration';
import { enqueueInstagramSync } from '../../src/services/instagram-sync-queue.service';
import { enqueueEligibleInstagramSyncRetries } from '../../src/services/instagram-sync-retry.service';
import {
  InstagramSyncJobData,
  INSTAGRAM_SYNC_RETRY_JOB_NAME,
  instagramSyncJobId,
} from '../../src/queues/instagram-sync.queue';
import { encryptSocialToken } from '../../src/utils/social-token-crypto';
import {
  createInstagramSyncWorker,
  instagramSyncWorker,
  processInstagramSync,
  processInstagramSyncWithDependencies,
} from '../../src/workers/instagram-sync.worker';
import { AIService } from '../../src/services/ai.service';
import { prisma } from '../../src/lib/prisma';

const mockedAxios = axios as jest.Mocked<typeof axios>;
let harness: RedisBullMqIntegrationHarness | undefined;

type CreatorFixture = {
  user: { id: string };
  profile: { id: string; handle: string };
  platform: { id: string; platformId: string };
};

async function closeHarness(): Promise<void> {
  if (!harness) return;
  const current = harness;
  harness = undefined;
  await current.close();
}

async function createConnectedCreator(): Promise<CreatorFixture> {
  const user = await integrationPrisma.user.create({
    data: {
      email: `instagram-queue-${randomUUID()}@example.test`,
      passwordHash: await bcrypt.hash('IntegrationPass123!', 4),
      role: 'INFLUENCER',
    },
    select: { id: true },
  });
  const profile = await integrationPrisma.influencerProfile.create({
    data: { userId: user.id, handle: `queue_${randomUUID().replace(/-/g, '')}` },
    select: { id: true, handle: true },
  });
  const platformId = `instagram-${randomUUID()}`;
  const platform = await integrationPrisma.socialPlatform.create({
    data: {
      influencerId: profile.id,
      platformName: 'INSTAGRAM',
      platformId,
      username: 'queue_creator',
      followersCount: 10,
      accessToken: encryptSocialToken('fake-instagram-token-not-in-job', {
        influencerId: profile.id,
        platformName: 'INSTAGRAM',
        field: 'accessToken',
      }),
      isActive: true,
    },
    select: { id: true, platformId: true },
  });
  return { user, profile, platform };
}

function profileResponse(platformId: string) {
  return {
    data: {
      id: platformId,
      username: 'queue_creator',
      followers_count: 1200,
      profile_picture_url: 'https://images.example.test/queue.jpg',
    },
  };
}

function recentImage(id: string) {
  return {
    id,
    caption: 'Controlled queue test media',
    media_type: 'IMAGE',
    media_url: `https://images.example.test/${id}.jpg`,
    permalink: `https://instagram.example.test/p/${id}`,
    like_count: 100,
    comments_count: 10,
    timestamp: new Date(Date.now() - 60_000).toISOString(),
  };
}

async function startHarness(): Promise<RedisBullMqIntegrationHarness> {
  harness = await createRedisBullMqIntegrationHarness(processInstagramSync, {
    queueName: 'instagram-sync',
    workerFactory: createInstagramSyncWorker,
  });
  return harness;
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
  await Promise.all([prisma.$disconnect(), disconnectIntegrationPrisma()]);
});

describe('Instagram sync queue with local PostgreSQL and Redis', () => {
  it('does not start the Instagram consumer merely by importing its factory module', () => {
    expect(instagramSyncWorker).toBeUndefined();
  });

  it('runs the scheduled retry job as a token-free sweep without calling the provider', async () => {
    const retrySweep = jest.fn().mockResolvedValue({ eligible: 2, enqueued: 1, skipped: 1 });
    harness = await createRedisBullMqIntegrationHarness(
      job => processInstagramSyncWithDependencies(job, { retrySweep }),
      { queueName: 'instagram-sync' },
    );
    const job = await harness.queue.add(INSTAGRAM_SYNC_RETRY_JOB_NAME, {});

    await expect(job.waitUntilFinished(harness.events, 5_000)).resolves.toEqual({
      status: 'retry_scan_completed',
      enqueued: 1,
    });
    expect(job.data).toEqual({});
    expect(retrySweep).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('processes a token-free job into an Instagram snapshot and SYNCED operational state', async () => {
    const creator = await createConnectedCreator();
    mockedAxios.get
      .mockResolvedValueOnce(profileResponse(creator.platform.platformId))
      .mockResolvedValueOnce({ data: { data: [recentImage('queue-success')] } })
      .mockResolvedValueOnce({
        data: {
          data: [
            { name: 'impressions', values: [{ value: 900 }] },
            { name: 'reach', values: [{ value: 700 }] },
            { name: 'saved', values: [{ value: 30 }] },
          ],
        },
      });
    const redis = await startHarness();
    const job = await redis.queue.add('sync-instagram', {
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'post_oauth',
      requestedByUserId: creator.user.id,
    });

    await expect(job.waitUntilFinished(redis.events, 5_000)).resolves.toEqual({ status: 'synced' });

    const [platform, snapshot] = await Promise.all([
      integrationPrisma.socialPlatform.findUniqueOrThrow({ where: { id: creator.platform.id } }),
      integrationPrisma.metricSnapshot.findFirstOrThrow({
        where: { influencerId: creator.profile.id, provider: 'INSTAGRAM' },
      }),
    ]);
    expect(platform).toMatchObject({
      lastSyncStatus: 'SYNCED',
      syncFailureCount: 0,
      lastSyncErrorCode: null,
      nextSyncRetryAt: null,
      syncLeaseExpiresAt: null,
    });
    expect(platform.lastSyncSuccessAt).toBeInstanceOf(Date);
    expect(snapshot).toMatchObject({ followers: 1200, reachLast30Days: 700 });
    expect(JSON.stringify(job.data)).not.toContain('fake-instagram-token-not-in-job');
    expect(AIService.generateWeeklyAnalysis).toHaveBeenCalledWith(creator.profile.id);
  });

  it('creates a scheduled snapshot without triggering AI', async () => {
    const creator = await createConnectedCreator();
    mockedAxios.get
      .mockResolvedValueOnce(profileResponse(creator.platform.platformId))
      .mockResolvedValueOnce({ data: { data: [recentImage('scheduled-no-ai')] } })
      .mockResolvedValueOnce({
        data: {
          data: [
            { name: 'impressions', values: [{ value: 900 }] },
            { name: 'reach', values: [{ value: 700 }] },
            { name: 'saved', values: [{ value: 30 }] },
          ],
        },
      });
    const redis = await startHarness();
    const job = await redis.queue.add('sync-instagram', {
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'scheduled',
    });

    await expect(job.waitUntilFinished(redis.events, 5_000)).resolves.toEqual({ status: 'synced' });
    await expect(integrationPrisma.metricSnapshot.count({ where: { influencerId: creator.profile.id } }))
      .resolves.toBe(1);
    expect(AIService.generateWeeklyAnalysis).not.toHaveBeenCalled();
  });

  it('keeps post-snapshot AI explicit for a successful manual sync', async () => {
    const creator = await createConnectedCreator();
    mockedAxios.get
      .mockResolvedValueOnce(profileResponse(creator.platform.platformId))
      .mockResolvedValueOnce({ data: { data: [recentImage('manual-ai')] } })
      .mockResolvedValueOnce({
        data: {
          data: [
            { name: 'impressions', values: [{ value: 900 }] },
            { name: 'reach', values: [{ value: 700 }] },
            { name: 'saved', values: [{ value: 30 }] },
          ],
        },
      });
    const redis = await startHarness();
    const job = await redis.queue.add('sync-instagram', {
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'manual_retry',
      requestedByUserId: creator.user.id,
    });

    await expect(job.waitUntilFinished(redis.events, 5_000)).resolves.toEqual({ status: 'synced' });
    expect(AIService.generateWeeklyAnalysis).toHaveBeenCalledWith(creator.profile.id);
  });

  it('does not let an opted-in AI failure revert a post-OAuth snapshot', async () => {
    const creator = await createConnectedCreator();
    (AIService.generateWeeklyAnalysis as jest.Mock).mockRejectedValueOnce(new Error('mock-ai-failure'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedAxios.get
      .mockResolvedValueOnce(profileResponse(creator.platform.platformId))
      .mockResolvedValueOnce({ data: { data: [recentImage('post-oauth-ai-failure')] } })
      .mockResolvedValueOnce({
        data: {
          data: [
            { name: 'impressions', values: [{ value: 900 }] },
            { name: 'reach', values: [{ value: 700 }] },
            { name: 'saved', values: [{ value: 30 }] },
          ],
        },
      });
    const redis = await startHarness();
    const job = await redis.queue.add('sync-instagram', {
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'post_oauth',
    });

    try {
      await expect(job.waitUntilFinished(redis.events, 5_000)).resolves.toEqual({ status: 'synced' });
      await expect(integrationPrisma.metricSnapshot.count({ where: { influencerId: creator.profile.id } }))
        .resolves.toBe(1);
      await expect(integrationPrisma.socialPlatform.findUniqueOrThrow({ where: { id: creator.platform.id } }))
        .resolves.toMatchObject({ lastSyncStatus: 'SYNCED', syncFailureCount: 0 });
      expect(AIService.generateWeeklyAnalysis).toHaveBeenCalledWith(creator.profile.id);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('records NO_RECENT_MEDIA without manufacturing a snapshot', async () => {
    const creator = await createConnectedCreator();
    mockedAxios.get
      .mockResolvedValueOnce(profileResponse(creator.platform.platformId))
      .mockResolvedValueOnce({ data: { data: [] } });
    const redis = await startHarness();
    const job = await redis.queue.add('sync-instagram', {
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'manual_retry',
    });

    await expect(job.waitUntilFinished(redis.events, 5_000)).resolves.toEqual({ status: 'no_recent_media' });
    await expect(integrationPrisma.metricSnapshot.count({ where: { influencerId: creator.profile.id } })).resolves.toBe(0);
    await expect(integrationPrisma.socialPlatform.findUniqueOrThrow({ where: { id: creator.platform.id } }))
      .resolves.toMatchObject({
        lastSyncStatus: 'NO_RECENT_MEDIA',
        syncFailureCount: 0,
        syncLeaseExpiresAt: null,
      });
  });

  it('persists a retryable provider failure with a sanitized code and backoff', async () => {
    const creator = await createConnectedCreator();
    const error = Object.assign(new Error('provider access token must not leak'), {
      response: { status: 503, data: { error: { message: 'access_token=fake-instagram-token-not-in-job' } } },
    });
    mockedAxios.get.mockRejectedValueOnce(error);
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = await startHarness();
    const job = await redis.queue.add('sync-instagram', {
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'manual_retry',
    });

    try {
      await expect(job.waitUntilFinished(redis.events, 5_000)).rejects.toThrow('Instagram sync job failed.');
      const platform = await integrationPrisma.socialPlatform.findUniqueOrThrow({ where: { id: creator.platform.id } });
      expect(platform).toMatchObject({
        lastSyncStatus: 'FAILED_RETRYABLE',
        lastSyncErrorCode: 'PROVIDER_UNAVAILABLE',
        syncFailureCount: 1,
        syncLeaseExpiresAt: null,
      });
      expect(platform.nextSyncRetryAt?.getTime()).toBeGreaterThan(Date.now());
      expect(JSON.stringify(log.mock.calls)).not.toContain('fake-instagram-token-not-in-job');
    } finally {
      log.mockRestore();
    }
  });

  it('records a token-invalid provider failure as reconnect-required without scheduling a retry', async () => {
    const creator = await createConnectedCreator();
    mockedAxios.get.mockRejectedValueOnce(Object.assign(new Error('unauthorized'), {
      response: { status: 401, data: { error: { code: 'invalid_token' } } },
    }));
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = await startHarness();
    const job = await redis.queue.add('sync-instagram', {
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'manual_retry',
    });

    try {
      await expect(job.waitUntilFinished(redis.events, 5_000)).rejects.toThrow('Instagram sync job failed.');
      await expect(integrationPrisma.socialPlatform.findUniqueOrThrow({ where: { id: creator.platform.id } }))
        .resolves.toMatchObject({
          lastSyncStatus: 'FAILED_RECONNECT_REQUIRED',
          lastSyncErrorCode: 'TOKEN_INVALID',
          nextSyncRetryAt: null,
          syncLeaseExpiresAt: null,
        });
    } finally {
      log.mockRestore();
    }
  });

  it('does not enqueue a second manual job while a valid sync lease exists', async () => {
    const creator = await createConnectedCreator();
    await integrationPrisma.socialPlatform.update({
      where: { id: creator.platform.id },
      data: {
        lastSyncStatus: 'SYNCING',
        syncLeaseExpiresAt: new Date(Date.now() + 60_000),
      },
    });

    await expect(enqueueInstagramSync({
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'manual_retry',
      requestedByUserId: creator.user.id,
    })).resolves.toEqual({ accepted: false, status: 'syncing' });
  });

  it('enqueues an expired retryable sync once, keeps its job token-free, and marks it pending', async () => {
    const creator = await createConnectedCreator();
    await integrationPrisma.socialPlatform.update({
      where: { id: creator.platform.id },
      data: {
        lastSyncStatus: 'FAILED_RETRYABLE',
        syncFailureCount: 1,
        nextSyncRetryAt: new Date(Date.now() - 1_000),
      },
    });
    const redis = await startHarness();
    await redis.queue.pause();

    try {
      const result = await enqueueEligibleInstagramSyncRetries({
        enqueue: request => enqueueInstagramSync(request, {
          enqueueJob: data => redis.queue.add('sync-instagram', data, {
            jobId: instagramSyncJobId(data.socialPlatformId),
            removeOnComplete: true,
            removeOnFail: true,
          }),
        }),
      });

      expect(result).toEqual({ eligible: 1, enqueued: 1, skipped: 0 });
      const jobs = await redis.queue.getWaiting();
      expect(jobs).toHaveLength(1);
      expect(jobs[0].data).toMatchObject({
        socialPlatformId: creator.platform.id,
        influencerId: creator.profile.id,
        reason: 'scheduled',
      });
      expect(JSON.stringify(jobs[0].data)).not.toContain('fake-instagram-token-not-in-job');
      await expect(integrationPrisma.socialPlatform.findUniqueOrThrow({ where: { id: creator.platform.id } }))
        .resolves.toMatchObject({
          lastSyncStatus: 'SYNC_PENDING',
          syncFailureCount: 1,
          nextSyncRetryAt: null,
        });
    } finally {
      await redis.queue.resume();
    }
  });

  it('excludes reconnect-required connections from automatic retry', async () => {
    const creator = await createConnectedCreator();
    await integrationPrisma.socialPlatform.update({
      where: { id: creator.platform.id },
      data: {
        lastSyncStatus: 'FAILED_RECONNECT_REQUIRED',
        syncFailureCount: 1,
        nextSyncRetryAt: new Date(Date.now() - 1_000),
      },
    });
    const enqueue = jest.fn();

    await expect(enqueueEligibleInstagramSyncRetries({ enqueue })).resolves.toEqual({
      eligible: 0,
      enqueued: 0,
      skipped: 0,
    });
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('excludes active leases and retry counts at the automatic cap', async () => {
    const leased = await createConnectedCreator();
    const capped = await createConnectedCreator();
    await Promise.all([
      integrationPrisma.socialPlatform.update({
        where: { id: leased.platform.id },
        data: {
          lastSyncStatus: 'SYNCING',
          syncFailureCount: 1,
          nextSyncRetryAt: new Date(Date.now() - 1_000),
          syncLeaseExpiresAt: new Date(Date.now() + 60_000),
        },
      }),
      integrationPrisma.socialPlatform.update({
        where: { id: capped.platform.id },
        data: {
          lastSyncStatus: 'FAILED_RETRYABLE',
          syncFailureCount: 3,
          nextSyncRetryAt: new Date(Date.now() - 1_000),
        },
      }),
    ]);
    const enqueue = jest.fn();

    await expect(enqueueEligibleInstagramSyncRetries({ enqueue })).resolves.toEqual({
      eligible: 0,
      enqueued: 0,
      skipped: 0,
    });
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent enqueue attempts for one Instagram platform', async () => {
    const creator = await createConnectedCreator();
    const redis = await startHarness();
    await redis.queue.pause();

    try {
      const enqueueJob = (data: InstagramSyncJobData) => redis.queue.add('sync-instagram', data, {
        jobId: instagramSyncJobId(data.socialPlatformId),
        removeOnComplete: true,
        removeOnFail: true,
      });
      await Promise.all([
        enqueueInstagramSync({
          socialPlatformId: creator.platform.id,
          influencerId: creator.profile.id,
          reason: 'manual_retry',
        }, { enqueueJob }),
        enqueueInstagramSync({
          socialPlatformId: creator.platform.id,
          influencerId: creator.profile.id,
          reason: 'scheduled',
        }, { enqueueJob }),
      ]);

      await expect(redis.queue.getWaiting()).resolves.toHaveLength(1);
    } finally {
      await redis.queue.resume();
    }
  });

  it('stops scheduling automatic retries after the third recoverable failure', async () => {
    const creator = await createConnectedCreator();
    await integrationPrisma.socialPlatform.update({
      where: { id: creator.platform.id },
      data: { syncFailureCount: 2 },
    });
    mockedAxios.get.mockRejectedValueOnce(Object.assign(new Error('provider unavailable'), {
      response: { status: 503 },
    }));
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = await startHarness();
    const job = await redis.queue.add('sync-instagram', {
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'scheduled',
    });

    try {
      await expect(job.waitUntilFinished(redis.events, 5_000)).rejects.toThrow('Instagram sync job failed.');
      await expect(integrationPrisma.socialPlatform.findUniqueOrThrow({ where: { id: creator.platform.id } }))
        .resolves.toMatchObject({
          lastSyncStatus: 'FAILED_RETRYABLE',
          syncFailureCount: 3,
          nextSyncRetryAt: null,
        });
    } finally {
      log.mockRestore();
    }
  });

  it('processes an automatic retry into a verified snapshot without triggering AI', async () => {
    const creator = await createConnectedCreator();
    await integrationPrisma.socialPlatform.update({
      where: { id: creator.platform.id },
      data: {
        lastSyncStatus: 'FAILED_RETRYABLE',
        syncFailureCount: 2,
        nextSyncRetryAt: new Date(Date.now() - 1_000),
      },
    });
    mockedAxios.get
      .mockResolvedValueOnce(profileResponse(creator.platform.platformId))
      .mockResolvedValueOnce({ data: { data: [recentImage('scheduled-retry-success')] } })
      .mockResolvedValueOnce({
        data: {
          data: [{ name: 'reach', values: [{ value: 500 }] }],
        },
      });
    const redis = await startHarness();
    const job = await redis.queue.add('sync-instagram', {
      socialPlatformId: creator.platform.id,
      influencerId: creator.profile.id,
      reason: 'scheduled',
    });

    await expect(job.waitUntilFinished(redis.events, 5_000)).resolves.toEqual({ status: 'synced' });
    await expect(integrationPrisma.socialPlatform.findUniqueOrThrow({ where: { id: creator.platform.id } }))
      .resolves.toMatchObject({
        lastSyncStatus: 'SYNCED',
        syncFailureCount: 0,
        nextSyncRetryAt: null,
      });
    expect(AIService.generateWeeklyAnalysis).not.toHaveBeenCalled();
  });
});
