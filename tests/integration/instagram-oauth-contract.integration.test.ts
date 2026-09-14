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
import { decryptSocialToken, isEncryptedSocialToken } from '../../src/utils/social-token-crypto';
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

beforeEach(async () => {
  await clearIntegrationDatabase();
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

    expect(callback.body).toEqual({ success: true, platform: 'instagram', username: 'verified_creator', from: '' });
    expect(JSON.stringify(callback.body)).not.toContain('mock-long-lived-instagram-token');
    expect(mockExchangeCodeForToken).toHaveBeenCalledWith(
      'mock-authorization-code',
      'https://frontend.example.test/auth/callback/instagram',
    );
    expect(mockFetchProfileData).toHaveBeenCalledWith('mock-long-lived-instagram-token');
    expect(mockSyncInstagramData).toHaveBeenCalledWith(
      creator.profile.id,
      'mock-long-lived-instagram-token',
      'instagram-provider-id',
    );

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

    await request(app)
      .get('/v1/auth/social/callback/instagram')
      .set('Cookie', attempt.cookie)
      .query({ code: 'mock-authorization-code', state: attempt.state })
      .expect(400);
    await expect(integrationPrisma.socialPlatform.count()).resolves.toBe(1);
  });

  it('keeps the callback successful when its asynchronous sync fails without leaking the token', async () => {
    const creator = await createCreator();
    const attempt = await startInstagramLink(creator);
    const providerToken = 'mock-long-lived-instagram-token';
    mockSyncInstagramData.mockRejectedValueOnce(new Error(`sync rejected for ${providerToken}`));
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const callback = await request(app)
        .get('/v1/auth/social/callback/instagram')
        .set('Cookie', attempt.cookie)
        .query({ code: 'mock-authorization-code', state: attempt.state })
        .expect(200);

      await new Promise(resolve => setImmediate(resolve));
      expect(callback.body).toEqual(expect.objectContaining({ success: true, platform: 'instagram' }));
      expect(JSON.stringify(callback.body)).not.toContain(providerToken);
      expect(await integrationPrisma.socialPlatform.count()).toBe(1);
      expect(await integrationPrisma.metricSnapshot.count()).toBe(0);
      expect(log.mock.calls.flat().join(' ')).not.toContain(providerToken);
    } finally {
      log.mockRestore();
    }
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
