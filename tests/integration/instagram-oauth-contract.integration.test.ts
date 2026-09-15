import bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const mockExchangeCodeForToken = jest.fn();
const mockFetchProfileData = jest.fn();
const mockSyncInstagramData = jest.fn();

jest.mock('../../src/services/instagram.service', () => ({
  InstagramService: {
    exchangeCodeForToken: mockExchangeCodeForToken,
    fetchProfileData: mockFetchProfileData,
    syncInstagramData: mockSyncInstagramData,
  },
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
import { instagramSyncJobId, instagramSyncQueue } from '../../src/queues/instagram-sync.queue';
import { decryptSocialToken, encryptSocialToken, isEncryptedSocialToken } from '../../src/utils/social-token-crypto';
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
  const email = `instagram-contract-${randomUUID()}@example.test`;
  const user = await integrationPrisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('IntegrationPass123!', 4),
      role: 'INFLUENCER',
    },
    select: { id: true, email: true, role: true },
  });
  const profile = await integrationPrisma.influencerProfile.create({
    data: { userId: user.id, handle: `ig_contract_${randomUUID().replace(/-/g, '')}` },
    select: { id: true, handle: true },
  });
  return { user: user as CreatorFixture['user'], profile };
}

function cookieValue(response: request.Response): string {
  const cookies = response.headers['set-cookie'];
  const values = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
  const cookie = values.find(value => value.includes('influnext_oauth_'));
  if (!cookie) throw new Error('OAuth nonce cookie was not returned.');
  return cookie.split(';')[0];
}

async function startInstagramLink(creator: CreatorFixture) {
  const response = await request(app)
    .get('/v1/integrations/instagram/auth-url')
    .set(sessionHeader(creator.user))
    .expect(200);
  const url = new URL(response.body.instagram);
  const state = url.searchParams.get('state');
  if (!state) throw new Error('OAuth state was not returned.');
  return { response, url, state, cookie: cookieValue(response) };
}

async function clearInstagramSyncQueue(): Promise<void> {
  await instagramSyncQueue.obliterate({ force: true });
  const prefix = process.env.INSTAGRAM_SYNC_QUEUE_PREFIX || 'bull';
  const keys = await redisConnection.keys(`${prefix}:instagram-sync:*`);
  if (keys.length > 0) {
    await redisConnection.del(...keys);
  }
}

beforeEach(async () => {
  await clearIntegrationDatabase();
  await clearInstagramSyncQueue();
  jest.clearAllMocks();
  mockExchangeCodeForToken.mockResolvedValue({
    accessToken: 'mock-long-lived-instagram-token',
    expiresIn: 3600,
    platformId: 'instagram-provider-id',
  });
  mockFetchProfileData.mockResolvedValue({
    id: 'instagram-provider-id',
    username: 'verified_creator',
    profile_picture_url: 'https://images.example.test/creator.jpg',
    followers_count: 12345,
  });
  mockSyncInstagramData.mockResolvedValue({ success: true });
});

afterAll(async () => {
  await clearIntegrationDatabase();
  await clearInstagramSyncQueue();
  await instagramSyncQueue.close();
  await Promise.all([
    prisma.$disconnect(),
    redisConnection.quit(),
    disconnectIntegrationPrisma(),
  ]);
});

describe('Instagram OAuth contract with local PostgreSQL and Redis', () => {
  it('creates a local Redis-backed opaque link attempt without exposing a token', async () => {
    const creator = await createCreator();
    const { response, url, state } = await startInstagramLink(creator);

    expect(url.origin).toBe('https://www.instagram.com');
    expect(url.pathname).toBe('/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('test-instagram-client');
    expect(url.searchParams.get('redirect_uri')).toBe('https://frontend.example.test/auth/callback/instagram');
    expect(url.searchParams.get('scope')).toBe('instagram_business_basic');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(state).not.toContain('mock-long-lived-instagram-token');
    expect(JSON.stringify(response.body)).not.toMatch(/accessToken|refreshToken/i);

    const payload = jwt.decode(state) as jwt.JwtPayload;
    expect(payload).toMatchObject({ purpose: 'oauth_state', platform: 'instagram', mode: 'link', userId: creator.user.id });
    expect(await redisConnection.get(`oauth:attempt:${payload.jti}`)).toBe(
      createHash('sha256').update(state).digest('hex'),
    );
  });

  it('accepts an integration-started attempt at the frontend social callback and persists only encrypted credentials', async () => {
    const creator = await createCreator();
    const attempt = await startInstagramLink(creator);

    const callback = await request(app)
      .get('/v1/auth/social/callback/instagram')
      .set('Cookie', attempt.cookie)
      .query({ code: 'mock-authorization-code', state: attempt.state })
      .expect(200);

    expect(callback.body).toEqual({
      success: true,
      platform: 'instagram',
      username: 'verified_creator',
      from: '',
      instagramSyncStatus: 'sync_pending',
    });
    expect(JSON.stringify(callback.body)).not.toContain('mock-long-lived-instagram-token');
    expect(mockExchangeCodeForToken).toHaveBeenCalledWith(
      'mock-authorization-code',
      'https://frontend.example.test/auth/callback/instagram',
    );
    expect(mockFetchProfileData).toHaveBeenCalledWith('mock-long-lived-instagram-token');
    expect(mockSyncInstagramData).not.toHaveBeenCalled();

    const stored = await integrationPrisma.socialPlatform.findUnique({
      where: { influencerId_platformName: { influencerId: creator.profile.id, platformName: 'INSTAGRAM' } },
    });
    expect(stored).toMatchObject({
      influencerId: creator.profile.id,
      platformName: 'INSTAGRAM',
      platformId: 'instagram-provider-id',
      username: 'verified_creator',
      profilePicture: 'https://images.example.test/creator.jpg',
      followersCount: 12345,
      isActive: true,
    });
    expect(stored?.expiresAt?.getTime()).toBeGreaterThan(Date.now() + 3_500_000);
    expect(isEncryptedSocialToken(stored!.accessToken)).toBe(true);
    expect(decryptSocialToken(stored!.accessToken, {
      influencerId: creator.profile.id,
      platformName: 'INSTAGRAM',
      field: 'accessToken',
    }).value).toBe('mock-long-lived-instagram-token');
    expect(stored).toMatchObject({ lastSyncStatus: 'SYNC_PENDING' });

    const syncJob = await instagramSyncQueue.getJob(instagramSyncJobId(stored!.id));
    expect(syncJob?.data).toEqual({
      socialPlatformId: stored!.id,
      influencerId: creator.profile.id,
      reason: 'post_oauth',
      requestedByUserId: creator.user.id,
    });
    expect(JSON.stringify(syncJob?.data)).not.toContain('mock-long-lived-instagram-token');

    await request(app)
      .get('/v1/auth/social/callback/instagram')
      .set('Cookie', attempt.cookie)
      .query({ code: 'mock-authorization-code', state: attempt.state })
      .expect(400);
    await expect(integrationPrisma.socialPlatform.count()).resolves.toBe(1);
  });

  it('keeps the callback successful and visibly pending while the queued sync has not created a snapshot', async () => {
    const creator = await createCreator();
    const attempt = await startInstagramLink(creator);
    const callback = await request(app)
      .get('/v1/auth/social/callback/instagram')
      .set('Cookie', attempt.cookie)
      .query({ code: 'mock-authorization-code', state: attempt.state })
      .expect(200);

    expect(callback.body).toEqual(expect.objectContaining({
      success: true,
      platform: 'instagram',
      instagramSyncStatus: 'sync_pending',
    }));
    expect(JSON.stringify(callback.body)).not.toContain('mock-long-lived-instagram-token');
    expect(await integrationPrisma.socialPlatform.count()).toBe(1);
    expect(await integrationPrisma.metricSnapshot.count()).toBe(0);
    expect(mockSyncInstagramData).not.toHaveBeenCalled();

    const dashboard = await request(app)
      .get('/v1/dashboard/influencer')
      .set(sessionHeader(creator.user))
      .expect(200);
    expect(dashboard.body.instagramSync).toMatchObject({
      instagramSyncStatus: 'connected_without_snapshot',
      instagramOperationalSyncStatus: 'sync_pending',
      hasVerifiedSnapshot: false,
      lastSnapshotAt: null,
      metricsSource: 'unavailable',
    });
  });

  it('queues a manual Instagram sync with a 202 response and never hands the token to HTTP provider code', async () => {
    const creator = await createCreator();
    const platform = await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: creator.profile.id,
        platformName: 'INSTAGRAM',
        platformId: 'manual-sync-provider-id',
        username: 'manual_sync_creator',
        accessToken: encryptSocialToken('manual-sync-token-not-for-http', {
          influencerId: creator.profile.id,
          platformName: 'INSTAGRAM',
          field: 'accessToken',
        }),
        isActive: true,
      },
    });

    const response = await request(app)
      .post('/v1/integrations/sync-metrics')
      .set(sessionHeader(creator.user))
      .expect(202);

    expect(response.body).toEqual({ accepted: true, results: { INSTAGRAM: 'sync_pending' } });
    expect(mockSyncInstagramData).not.toHaveBeenCalled();
    const job = await instagramSyncQueue.getJob(instagramSyncJobId(platform.id));
    expect(job?.data).toEqual({
      socialPlatformId: platform.id,
      influencerId: creator.profile.id,
      reason: 'manual_retry',
      requestedByUserId: creator.user.id,
    });
    expect(JSON.stringify(job?.data)).not.toContain('manual-sync-token-not-for-http');
  });

  it('returns an honest waiting result without enqueueing while a manual sync lease is still valid', async () => {
    const creator = await createCreator();
    const platform = await integrationPrisma.socialPlatform.create({
      data: {
        influencerId: creator.profile.id,
        platformName: 'INSTAGRAM',
        platformId: 'manual-lease-provider-id',
        username: 'manual_lease_creator',
        accessToken: encryptSocialToken('manual-lease-token', {
          influencerId: creator.profile.id,
          platformName: 'INSTAGRAM',
          field: 'accessToken',
        }),
        lastSyncStatus: 'SYNCING',
        syncLeaseExpiresAt: new Date(Date.now() + 60_000),
        isActive: true,
      },
    });

    const response = await request(app)
      .post('/v1/integrations/sync-metrics')
      .set(sessionHeader(creator.user))
      .expect(202);

    expect(response.body).toEqual({ accepted: true, results: { INSTAGRAM: 'syncing' } });
    await expect(instagramSyncQueue.getJob(instagramSyncJobId(platform.id))).resolves.toBeUndefined();
    expect(mockSyncInstagramData).not.toHaveBeenCalled();
  });

  it('fails a provider exchange without persisting an active social account', async () => {
    const creator = await createCreator();
    const attempt = await startInstagramLink(creator);
    mockExchangeCodeForToken.mockRejectedValueOnce(new Error('provider exchange unavailable'));

    const response = await request(app)
      .get('/v1/auth/social/callback/instagram')
      .set('Cookie', attempt.cookie)
      .query({ code: 'bad-code', state: attempt.state })
      .expect(400);

    expect(response.body).toEqual(expect.objectContaining({ errorType: 'error' }));
    expect(JSON.stringify(response.body)).not.toContain('provider exchange unavailable');
    await expect(integrationPrisma.socialPlatform.count()).resolves.toBe(0);
    expect(mockSyncInstagramData).not.toHaveBeenCalled();
  });

  it('fails a profile lookup instead of recording a misleading active connection', async () => {
    const creator = await createCreator();
    const attempt = await startInstagramLink(creator);
    mockFetchProfileData.mockRejectedValueOnce(new Error('profile lookup unavailable'));

    const response = await request(app)
      .get('/v1/auth/social/callback/instagram')
      .set('Cookie', attempt.cookie)
      .query({ code: 'mock-authorization-code', state: attempt.state })
      .expect(400);

    expect(response.body).toEqual(expect.objectContaining({ errorType: 'error' }));
    expect(JSON.stringify(response.body)).not.toContain('mock-long-lived-instagram-token');
    await expect(integrationPrisma.socialPlatform.count()).resolves.toBe(0);
    expect(mockSyncInstagramData).not.toHaveBeenCalled();
  });
});
