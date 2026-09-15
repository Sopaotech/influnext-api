import axios from 'axios';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';

jest.mock('axios');
jest.mock('../../src/services/scoring.service', () => ({
  ScoringService: { calculateAndPersist: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../src/services/ai.service', () => ({
  AIService: { generateWeeklyAnalysis: jest.fn().mockResolvedValue(undefined) },
}));
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
import { InstagramService } from '../../src/services/instagram.service';
import { encryptSocialToken } from '../../src/utils/social-token-crypto';
import {
  clearIntegrationDatabase,
  disconnectIntegrationPrisma,
  integrationPrisma,
} from '../helpers/postgres-integration';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const instagramAccountId = 'instagram-account-1';

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

async function createConnectedCreator(): Promise<CreatorFixture> {
  const user = await integrationPrisma.user.create({
    data: {
      email: `instagram-snapshot-${randomUUID()}@example.test`,
      passwordHash: await bcrypt.hash('IntegrationPass123!', 4),
      role: 'INFLUENCER',
    },
    select: { id: true, email: true, role: true },
  });
  const profile = await integrationPrisma.influencerProfile.create({
    data: {
      userId: user.id,
      handle: `creator_handle_${randomUUID().replace(/-/g, '')}`,
    },
    select: { id: true, handle: true },
  });
  await integrationPrisma.socialPlatform.create({
    data: {
      influencerId: profile.id,
      platformName: 'INSTAGRAM',
      platformId: instagramAccountId,
      username: 'old_instagram_username',
      profilePicture: 'https://images.example.test/old.jpg',
      followersCount: 10,
      accessToken: encryptSocialToken('fake-instagram-access-token', {
        influencerId: profile.id,
        platformName: 'INSTAGRAM',
        field: 'accessToken',
      }),
      isActive: true,
    },
  });
  return { user: user as CreatorFixture['user'], profile };
}

function recentMedia(id: string, mediaType: 'IMAGE' | 'VIDEO' = 'IMAGE') {
  return {
    id,
    caption: `Post ${id}`,
    media_type: mediaType,
    media_url: `https://images.example.test/${id}.jpg`,
    permalink: `https://instagram.example.test/p/${id}`,
    like_count: 100,
    comments_count: 10,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  };
}

function profileResponse() {
  return {
    data: {
      id: instagramAccountId,
      username: 'instagram_creator',
      followers_count: 1200,
      profile_picture_url: 'https://images.example.test/new.jpg',
    },
  };
}

beforeEach(async () => {
  await clearIntegrationDatabase();
  jest.clearAllMocks();
});

afterAll(async () => {
  await clearIntegrationDatabase();
  redisConnection.disconnect();
  await Promise.all([prisma.$disconnect(), disconnectIntegrationPrisma()]);
});

describe('Instagram snapshot collection contract with local PostgreSQL', () => {
  it('creates a traceable recent-media snapshot, updates follower data, and preserves the creator handle', async () => {
    const creator = await createConnectedCreator();
    mockedAxios.get
      .mockResolvedValueOnce(profileResponse())
      .mockResolvedValueOnce({ data: { data: [recentMedia('media-success')] } })
      .mockResolvedValueOnce({
        data: {
          data: [
            { name: 'impressions', values: [{ value: 900 }] },
            { name: 'reach', values: [{ value: 700 }] },
            { name: 'saved', values: [{ value: 30 }] },
          ],
        },
      });

    const result = await InstagramService.syncInstagramData(
      creator.profile.id,
      'fake-instagram-access-token',
      instagramAccountId,
    );

    expect(result).toMatchObject({ success: true, snapshotCreated: true, followers: 1200 });
    const snapshot = await integrationPrisma.metricSnapshot.findFirstOrThrow({
      where: { influencerId: creator.profile.id, provider: 'INSTAGRAM' },
      orderBy: { capturedAt: 'desc' },
    });
    expect(snapshot).toMatchObject({ followers: 1200, reachLast30Days: 700, avgViews: 700 });
    expect(snapshot.integrityHash).toMatch(/^[a-f0-9]{64}$/);

    const storedProfile = await integrationPrisma.influencerProfile.findUniqueOrThrow({
      where: { id: creator.profile.id },
      include: { platforms: true },
    });
    expect(storedProfile.handle).toBe(creator.profile.handle);
    expect(storedProfile.profileImageUrl).toBe('https://images.example.test/new.jpg');
    expect(storedProfile.verifiedMetrics).toBe(true);
    expect(storedProfile.platforms[0]).toMatchObject({
      followersCount: 1200,
      username: 'instagram_creator',
    });
    expect((storedProfile.insights as any).instagramMetricCollection).toMatchObject({
      scope: 'recent_media_sample_30d',
      sampledMediaCount: 1,
      isPartial: false,
      reachDefinition: 'sum_of_available_media_reach_for_sampled_posts_within_30_days',
    });

    const dashboard = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);
    expect(dashboard.body.instagramSync).toMatchObject({
      instagramSyncStatus: 'connected_with_snapshot',
      hasVerifiedSnapshot: true,
    });
    expect(dashboard.body.instagramMetricCollection).toMatchObject({
      scope: 'recent_media_sample_30d',
      isPartial: false,
      sampledMediaCount: 1,
    });
    expect(JSON.stringify(dashboard.body)).not.toContain('fake-instagram-access-token');

    const publicProfile = await request(app).get(`/v1/p/${creator.profile.handle}`).expect(200);
    expect(publicProfile.body.instagramSync.hasVerifiedSnapshot).toBe(true);
    expect(publicProfile.body.instagramMetricCollection.scope).toBe('recent_media_sample_30d');
    expect(JSON.stringify(publicProfile.body)).not.toContain('fake-instagram-access-token');
  });

  it('does not create a snapshot when the connected profile has no recent media', async () => {
    const creator = await createConnectedCreator();
    mockedAxios.get
      .mockResolvedValueOnce(profileResponse())
      .mockResolvedValueOnce({ data: { data: [] } });

    const result = await InstagramService.syncInstagramData(
      creator.profile.id,
      'fake-instagram-access-token',
      instagramAccountId,
    );

    expect(result).toMatchObject({ success: true, snapshotCreated: false, reason: 'no_recent_media' });
    expect(await integrationPrisma.metricSnapshot.count({ where: { influencerId: creator.profile.id } })).toBe(0);

    const dashboard = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);
    expect(dashboard.body.instagramSync).toMatchObject({
      instagramSyncStatus: 'connected_without_snapshot',
      hasVerifiedSnapshot: false,
    });
    expect(dashboard.body.instagramMetricCollection.scope).toBe('unavailable');
  });

  it('marks a snapshot partial when a media insight and its fallback are unavailable', async () => {
    const creator = await createConnectedCreator();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockedAxios.get
      .mockResolvedValueOnce(profileResponse())
      .mockResolvedValueOnce({ data: { data: [recentMedia('media-complete'), recentMedia('media-missing', 'VIDEO')] } })
      .mockResolvedValueOnce({
        data: {
          data: [
            { name: 'impressions', values: [{ value: 400 }] },
            { name: 'reach', values: [{ value: 300 }] },
            { name: 'saved', values: [{ value: 10 }] },
          ],
        },
      })
      .mockRejectedValueOnce(new Error('provider-insight-secret'))
      .mockRejectedValueOnce(new Error('provider-fallback-secret'));

    try {
      const result = await InstagramService.syncInstagramData(
        creator.profile.id,
        'fake-instagram-access-token',
        instagramAccountId,
      );

      expect(result).toMatchObject({ success: true, snapshotCreated: true });
      const storedProfile = await integrationPrisma.influencerProfile.findUniqueOrThrow({
        where: { id: creator.profile.id },
      });
      const collection = (storedProfile.insights as any).instagramMetricCollection;
      expect(collection).toMatchObject({ isPartial: true, unavailableInsightCount: 1, sampledMediaCount: 2 });
      expect(JSON.stringify(collection)).not.toContain('provider-insight-secret');
      expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('provider-insight-secret');

      const dashboard = await request(app)
        .get('/v1/dashboard/influencer')
        .set(sessionHeader(creator.user))
        .expect(200);
      expect(dashboard.body.instagramMetricCollection).toMatchObject({
        scope: 'recent_media_sample_30d',
        isPartial: true,
        unavailableInsightCount: 1,
        warning: 'Snapshot Instagram parcial: algumas mídias não retornaram insights.',
      });
      expect(JSON.stringify(dashboard.body)).not.toContain('provider-insight-secret');
    } finally {
      warnSpy.mockRestore();
    }
  });
});
