import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';

jest.mock('../../src/lib/stripe', () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));
jest.mock('../../src/services/mercadopago.service', () => ({
  MercadoPagoService: { createContractPix: jest.fn() },
}));
jest.mock('../../src/queues/notification.queue', () => ({ addNotificationJob: jest.fn() }));
jest.mock('../../src/queues/post-analyzer.queue', () => ({ addPostAnalysisJob: jest.fn() }));
jest.mock('../../src/services/calendar.service', () => ({ CalendarService: { syncTaskToCalendar: jest.fn() } }));
jest.mock('../../src/services/twoFactor.service', () => ({ TwoFactorService: { verifyToken: jest.fn(), generateSecret: jest.fn() } }));

import { app } from '../../src/app';
import { getJwtSecret } from '../../src/lib/jwt-secret';
import { prisma } from '../../src/lib/prisma';
import { redisConnection } from '../../src/lib/redis';
import { encryptSocialToken } from '../../src/utils/social-token-crypto';
import {
  clearIntegrationDatabase,
  disconnectIntegrationPrisma,
  integrationPrisma,
} from '../helpers/postgres-integration';

type CreatorFixture = {
  user: { id: string; email: string; role: 'INFLUENCER' };
  profile: { id: string; handle: string };
};

function sessionHeader(user: CreatorFixture['user']): { Authorization: string } {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, purpose: 'session' },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '1h' },
  );
  return { Authorization: `Bearer ${token}` };
}

async function createCreator(): Promise<CreatorFixture> {
  const user = await integrationPrisma.user.create({
    data: {
      email: `sync-state-${randomUUID()}@example.test`,
      passwordHash: await bcrypt.hash('IntegrationPass123!', 4),
      role: 'INFLUENCER',
    },
    select: { id: true, email: true, role: true },
  });
  const profile = await integrationPrisma.influencerProfile.create({
    data: { userId: user.id, handle: `sync_state_${randomUUID().replace(/-/g, '')}` },
    select: { id: true, handle: true },
  });
  return { user: user as CreatorFixture['user'], profile };
}

async function createInstagramPlatform(
  creator: CreatorFixture,
  data: Partial<{
    isActive: boolean;
    lastSyncStatus: 'NEVER_SYNCED' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'PARTIAL' | 'FAILED_RETRYABLE' | 'FAILED_RECONNECT_REQUIRED' | 'DISABLED';
    lastSyncAttemptAt: Date;
    lastSyncSuccessAt: Date;
    lastSyncFailureAt: Date;
    syncFailureCount: number;
    nextSyncRetryAt: Date;
    syncLeaseExpiresAt: Date;
  }> = {},
) {
  return integrationPrisma.socialPlatform.create({
    data: {
      influencerId: creator.profile.id,
      platformName: 'INSTAGRAM',
      platformId: `instagram-state-${randomUUID()}`,
      username: 'sync_state_creator',
      accessToken: encryptSocialToken('fake-instagram-token', {
        influencerId: creator.profile.id,
        platformName: 'INSTAGRAM',
        field: 'accessToken',
      }),
      ...data,
    },
  });
}

beforeEach(async () => {
  await clearIntegrationDatabase();
});

afterAll(async () => {
  await clearIntegrationDatabase();
  redisConnection.disconnect();
  await Promise.all([prisma.$disconnect(), disconnectIntegrationPrisma()]);
});

describe('Instagram SocialPlatform sync state with local PostgreSQL', () => {
  it('defaults a new active connection to NEVER_SYNCED with no failure count', async () => {
    const creator = await createCreator();
    const platform = await createInstagramPlatform(creator);

    expect(platform).toMatchObject({
      isActive: true,
      lastSyncStatus: 'NEVER_SYNCED',
      syncFailureCount: 0,
      lastSyncAttemptAt: null,
      lastSyncSuccessAt: null,
      lastSyncFailureAt: null,
      nextSyncRetryAt: null,
      syncLeaseExpiresAt: null,
    });
  });

  it('keeps snapshot verification false when a persisted operational status has no Instagram snapshot', async () => {
    const creator = await createCreator();
    const failedAt = new Date('2026-09-15T12:00:00.000Z');
    const retryAt = new Date(Date.now() + 30 * 60 * 1000);
    await createInstagramPlatform(creator, {
      lastSyncStatus: 'FAILED_RETRYABLE',
      lastSyncAttemptAt: failedAt,
      lastSyncFailureAt: failedAt,
      syncFailureCount: 2,
      nextSyncRetryAt: retryAt,
    });

    const dashboard = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);

    expect(dashboard.body.instagramSync).toMatchObject({
      instagramSyncStatus: 'connected_without_snapshot',
      instagramOperationalSyncStatus: 'failed_retryable',
      hasVerifiedSnapshot: false,
      syncFailureCount: 2,
      syncWarning: 'A sincronização do Instagram não foi concluída. Tente novamente mais tarde.',
    });
    expect(new Date(dashboard.body.instagramSync.lastSyncFailureAt).toISOString()).toBe(failedAt.toISOString());
    expect(new Date(dashboard.body.instagramSync.nextSyncRetryAt).toISOString()).toBe(retryAt.toISOString());
    expect(dashboard.body.instagramFreshness).toMatchObject({
      status: 'retry_scheduled',
      isVerifiedSnapshot: false,
      isStale: false,
      metricsSource: 'unavailable',
      syncAction: 'retry_later',
      syncMessageKey: 'instagram.retry_scheduled',
    });
    expect(new Date(dashboard.body.instagramFreshness.nextSyncRetryAt).toISOString()).toBe(retryAt.toISOString());
    expect(JSON.stringify(dashboard.body)).not.toContain('fake-instagram-token');
  });

  it('preserves a real snapshot as the sole verification source when operational status is PARTIAL', async () => {
    const creator = await createCreator();
    const completedAt = new Date('2026-09-15T13:00:00.000Z');
    await createInstagramPlatform(creator, {
      lastSyncStatus: 'PARTIAL',
      lastSyncAttemptAt: completedAt,
      lastSyncSuccessAt: completedAt,
    });
    await integrationPrisma.metricSnapshot.create({
      data: {
        influencerId: creator.profile.id,
        provider: 'INSTAGRAM',
        followers: 1500,
        engagementRate: 3.4,
        reachLast30Days: 9000,
        avgViews: 800,
        capturedAt: completedAt,
        integrityHash: 'partial-sync-state-snapshot',
      },
    });

    const dashboard = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);

    expect(dashboard.body.instagramSync).toMatchObject({
      instagramSyncStatus: 'connected_with_snapshot',
      instagramOperationalSyncStatus: 'partial',
      hasVerifiedSnapshot: true,
      syncWarning: 'O snapshot do Instagram possui métricas parciais.',
    });
    expect(dashboard.body.instagramFreshness).toMatchObject({
      status: 'stale',
      isVerifiedSnapshot: true,
      isStale: true,
      metricsSource: 'instagram_api_snapshot',
      syncAction: 'none',
      syncMessageKey: 'instagram.snapshot_stale',
    });
  });

  it('keeps an inactive platform disabled and outside the verified connection boundary', async () => {
    const creator = await createCreator();
    const platform = await createInstagramPlatform(creator, {
      isActive: false,
      lastSyncStatus: 'DISABLED',
    });

    expect(platform).toMatchObject({ lastSyncStatus: 'DISABLED', syncFailureCount: 0 });

    const dashboard = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);

    expect(dashboard.body.instagramSync).toMatchObject({
      instagramConnectionStatus: 'not_connected',
      instagramOperationalSyncStatus: 'disabled',
      hasVerifiedSnapshot: false,
    });
    expect(dashboard.body.instagramFreshness).toMatchObject({
      status: 'unavailable',
      isVerifiedSnapshot: false,
      metricsSource: 'unavailable',
      syncAction: 'connect',
      syncMessageKey: 'instagram.not_connected',
    });
  });

  it('reports syncing only while the Instagram worker lease remains valid', async () => {
    const creator = await createCreator();
    await createInstagramPlatform(creator, {
      lastSyncStatus: 'SYNCING',
      syncLeaseExpiresAt: new Date(Date.now() + 60_000),
    });

    const dashboard = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);

    expect(dashboard.body.instagramFreshness).toMatchObject({
      status: 'syncing',
      isVerifiedSnapshot: false,
      syncAction: 'wait',
      syncMessageKey: 'instagram.syncing',
    });
  });
});
