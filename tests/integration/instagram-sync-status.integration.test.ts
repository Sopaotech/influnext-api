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
      email: `sync-status-${randomUUID()}@example.test`,
      passwordHash: await bcrypt.hash('IntegrationPass123!', 4),
      role: 'INFLUENCER',
    },
    select: { id: true, email: true, role: true },
  });
  const profile = await integrationPrisma.influencerProfile.create({
    data: { userId: user.id, handle: `sync_status_${randomUUID().replace(/-/g, '')}` },
    select: { id: true, handle: true },
  });
  return { user: user as CreatorFixture['user'], profile };
}

async function connectInstagram(creator: CreatorFixture): Promise<void> {
  await integrationPrisma.socialPlatform.create({
    data: {
      influencerId: creator.profile.id,
      platformName: 'INSTAGRAM',
      platformId: `instagram-${randomUUID()}`,
      username: 'sync_status_creator',
      profilePicture: 'https://images.example.test/sync-status.jpg',
      followersCount: 1234,
      accessToken: encryptSocialToken('fake-instagram-token', {
        influencerId: creator.profile.id,
        platformName: 'INSTAGRAM',
        field: 'accessToken',
      }),
      isActive: true,
    },
  });
}

beforeEach(async () => {
  await clearIntegrationDatabase();
});

afterAll(async () => {
  await clearIntegrationDatabase();
  // This contract suite does not issue Redis commands. `disconnect()` is safe
  // whether the lazy client was connected by an imported route or never opened.
  redisConnection.disconnect();
  await Promise.all([prisma.$disconnect(), disconnectIntegrationPrisma()]);
});

describe('Instagram sync status boundary with local PostgreSQL', () => {
  it('reports not_connected for a creator without an active Instagram connection', async () => {
    const creator = await createCreator();

    const response = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);

    expect(response.body.instagramSync).toEqual({
      instagramConnectionStatus: 'not_connected',
      instagramSyncStatus: 'not_connected',
      hasVerifiedSnapshot: false,
      lastSnapshotAt: null,
      metricsSource: 'unavailable',
      syncWarning: 'Instagram não conectado.',
    });
    expect(response.body.profile.verifiedMetrics).toBe(false);
  });

  it('reports a connected account without an Instagram snapshot as unavailable in dashboard and public profile', async () => {
    const creator = await createCreator();
    await connectInstagram(creator);
    await integrationPrisma.influencerProfile.update({
      where: { id: creator.profile.id },
      data: { verifiedMetrics: true },
    });

    const dashboard = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);
    expect(dashboard.body.instagramSync).toMatchObject({
      instagramConnectionStatus: 'connected',
      instagramSyncStatus: 'connected_without_snapshot',
      hasVerifiedSnapshot: false,
      lastSnapshotAt: null,
      metricsSource: 'unavailable',
    });
    expect(dashboard.body.profile.verifiedMetrics).toBe(false);

    const publicProfile = await request(app).get(`/v1/p/${creator.profile.handle}`).expect(200);
    expect(publicProfile.body.verifiedMetrics).toBe(false);
    expect(publicProfile.body.instagramSync).toMatchObject({
      instagramSyncStatus: 'connected_without_snapshot',
      hasVerifiedSnapshot: false,
      metricsSource: 'unavailable',
    });
    expect(publicProfile.body.metricsHistory).toEqual([]);
    expect(JSON.stringify(publicProfile.body)).not.toContain('fake-instagram-token');
  });

  it('marks metrics as verified only when an Instagram snapshot exists and returns that snapshot', async () => {
    const creator = await createCreator();
    await connectInstagram(creator);
    const capturedAt = new Date('2026-09-14T12:00:00.000Z');
    await integrationPrisma.metricSnapshot.create({
      data: {
        influencerId: creator.profile.id,
        provider: 'INSTAGRAM',
        followers: 9876,
        engagementRate: 4.2,
        reachLast30Days: 54321,
        avgViews: 3210,
        capturedAt,
        integrityHash: 'instagram-sync-status-test-hash',
      },
    });

    const dashboard = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);
    expect(dashboard.body.instagramSync).toMatchObject({
      instagramSyncStatus: 'connected_with_snapshot',
      hasVerifiedSnapshot: true,
      metricsSource: 'snapshot',
      syncWarning: null,
    });
    expect(new Date(dashboard.body.instagramSync.lastSnapshotAt).toISOString()).toBe(capturedAt.toISOString());
    expect(dashboard.body.profile.verifiedMetrics).toBe(true);
    expect(dashboard.body.kpis).toMatchObject({ latestFollowers: 9876, latestEngagement: 4.2 });

    const publicProfile = await request(app).get(`/v1/p/${creator.profile.handle}`).expect(200);
    expect(publicProfile.body.verifiedMetrics).toBe(true);
    expect(publicProfile.body.instagramSync).toMatchObject({
      instagramSyncStatus: 'connected_with_snapshot',
      hasVerifiedSnapshot: true,
      metricsSource: 'snapshot',
    });
    expect(publicProfile.body.metricsHistory).toHaveLength(1);
    expect(publicProfile.body.metricsHistory[0]).toMatchObject({ followers: 9876, integrityHash: 'instagram-sync-status-test-hash' });
    expect(JSON.stringify(publicProfile.body)).not.toMatch(/accessToken|refreshToken|fake-instagram-token/);
  });
});
