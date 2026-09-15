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
import { encryptSocialToken } from '../../src/utils/social-token-crypto';
import {
  createInstagramSyncWorker,
  instagramSyncWorker,
  processInstagramSync,
} from '../../src/workers/instagram-sync.worker';
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
});
