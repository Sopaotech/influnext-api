import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { redisConnection, resetOAuthRedis } from './helpers/oauth-redis';

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  influencerProfile: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  socialPlatform: { findFirst: jest.fn(), upsert: jest.fn(), create: jest.fn() },
  metricSnapshot: { create: jest.fn() },
  pageView: { create: jest.fn() },
};
const mockExchange = jest.fn();
const mockProfile = jest.fn();
const mockPost = jest.fn();
const mockGet = jest.fn();
const mockSync = jest.fn();
const mockScore = jest.fn();
const mockVerifyTOTP = jest.fn();
jest.mock('../src/lib/redis', () => require('./helpers/oauth-redis'));
jest.mock('../src/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('axios', () => ({ __esModule: true, default: { post: mockPost, get: mockGet } }));
jest.mock('../src/services/instagram.service', () => ({ InstagramService: {
  exchangeCodeForToken: mockExchange, fetchProfileData: mockProfile, syncInstagramData: mockSync,
} }));
jest.mock('../src/services/tiktok.service', () => ({ TikTokService: { syncTikTokData: mockSync } }));
jest.mock('../src/services/scoring.service', () => ({ ScoringService: { calculateAndPersist: mockScore } }));
jest.mock('../src/services/ai.service', () => ({ AIService: {} }));
jest.mock('../src/services/trend-scanner.service', () => ({ TrendScannerService: {} }));
jest.mock('../src/services/twoFactor.service', () => ({ TwoFactorService: { verifyToken: mockVerifyTOTP } }));

import authRoutes from '../src/routes/auth.routes';
import socialRoutes from '../src/routes/auth.social.routes';
import integrationRoutes from '../src/routes/integration.routes';
import { createTwoFactorChallenge } from '../src/lib/two-factor-challenge';
import { trackPageView } from '../src/middlewares/analytics.middleware';

const app = express();
app.use(express.json());
app.use('/v1/auth/social', socialRoutes);
app.use('/v1/auth', authRoutes);
app.use('/v1/integrations', integrationRoutes);
const secret = 'oauth-security-test-only-secret';
const user = { id: 'user-1', email: 'oauth@example.com', role: 'INFLUENCER', twoFactorEnabled: false, onboardingCompleted: true };
const profile = { id: 'profile-1', userId: user.id, handle: 'real_user', influScore: 70, lastLoginAt: new Date(), user };
const platforms = ['instagram', 'tiktok', 'google', 'youtube'] as const;

function sessionFrom(response: request.Response): { cookie: string; token: string; serialized: string } {
  const values = (response.headers['set-cookie'] || []) as unknown as string[];
  const serialized = values.find(cookie => cookie.startsWith('influnext_token='));
  expect(serialized).toBeDefined();
  const cookie = serialized!.split(';')[0];
  return { cookie, serialized: serialized!, token: decodeURIComponent(cookie.slice('influnext_token='.length)) };
}

describe('STEP 1F-C — OAuth security boundary', () => {
  const originalEnv = process.env;
  let signSpy: jest.SpyInstance;
  beforeEach(() => {
    process.env = {
      ...originalEnv, NODE_ENV: 'production', JWT_SECRET: secret, FRONTEND_URL: 'https://frontend.example',
      INSTAGRAM_CLIENT_ID: 'test-ig', TIKTOK_CLIENT_KEY: 'test-tt', GOOGLE_CLIENT_ID: 'test-google',
    };
    resetOAuthRedis();
    signSpy = jest.spyOn(jwt, 'sign');
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockPrisma.influencerProfile.findUnique.mockResolvedValue(profile);
    mockPrisma.influencerProfile.update.mockResolvedValue(profile);
    mockPrisma.socialPlatform.findFirst.mockResolvedValue({ influencer: profile });
    mockPrisma.socialPlatform.upsert.mockResolvedValue({});
    mockExchange.mockResolvedValue({ accessToken: 'provider-token', platformId: 'provider-id', expiresIn: 3600 });
    mockProfile.mockResolvedValue({ username: 'real_user', followers_count: 42 });
    mockPost.mockResolvedValue({ data: { access_token: 'provider-token', open_id: 'provider-id', expires_in: 3600 } });
    mockGet.mockResolvedValue({ data: {
      data: { user: { username: 'real_user', display_name: 'real_user', follower_count: 42 } },
      items: [{ id: 'provider-id', snippet: { title: 'real_user' } }],
    } });
    mockSync.mockResolvedValue(undefined);
    mockScore.mockResolvedValue(undefined);
    mockVerifyTOTP.mockReturnValue(true);
    mockPrisma.pageView.create.mockResolvedValue({});
  });
  afterEach(() => { process.env = originalEnv; });

  function session() { return jwt.sign({ id: user.id, role: user.role, email: user.email }, secret); }
  async function start(platform: string, route = '/v1/auth/social/public-urls') {
    let call = request(app).get(route);
    if (!route.includes('public-urls')) call = call.set('Authorization', `Bearer ${session()}`);
    const response = await call;
    expect(response.status).toBe(200);
    const state = new URL(response.body[platform]).searchParams.get('state')!;
    const cookies = (response.headers['set-cookie'] as unknown as string[]).map(value => value.split(';')[0]);
    signSpy.mockClear();
    return { state, cookies, response };
  }
  function callback(platform: string, attempt: { state: string; cookies: string[] }, route?: string) {
    return request(app).get(route || `/v1/auth/social/callback/${platform}`)
      .set('Cookie', attempt.cookies).query({ state: attempt.state, code: 'provider-code' });
  }
  function noMutation() {
    for (const model of Object.values(mockPrisma)) {
      for (const [name, method] of Object.entries(model)) {
        if (!name.startsWith('find')) expect(method).not.toHaveBeenCalled();
      }
    }
    expect(mockSync).not.toHaveBeenCalled();
    expect(mockScore).not.toHaveBeenCalled();
  }
  function noEffects() {
    noMutation();
    expect(mockExchange).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
    expect(signSpy).not.toHaveBeenCalled();
  }

  it.each(platforms)('accepts a browser-bound state and completes %s login without 2FA', async platform => {
    const attempt = await start(platform);
    expect(jwt.verify(attempt.state, secret)).toMatchObject({
      purpose: 'oauth_state', aud: 'oauth-state', iss: 'influnext', platform, mode: 'login',
    });
    expect(attempt.response.headers['cache-control']).toBe('no-store');
    for (const cookie of attempt.response.headers['set-cookie'] as unknown as string[]) {
      expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('Secure'); expect(cookie).toContain('SameSite=None');
    }
    const response = await callback(platform, attempt);
    expect(response.status).toBe(200);
    expect(response.body.token).toBeUndefined();
    const session = sessionFrom(response);
    expect(jwt.verify(session.token, secret)).toMatchObject({ id: user.id, role: user.role, purpose: 'session' });
    expect(session.serialized).toContain('HttpOnly');
    expect(session.serialized).toContain('Secure');
    expect(session.serialized).toContain('SameSite=Lax');
    expect(mockPrisma.socialPlatform.upsert).toHaveBeenCalledTimes(1);
    const exchange = platform === 'instagram' ? mockExchange : mockPost;
    expect(redisConnection.eval.mock.invocationCallOrder[0]).toBeLessThan(exchange.mock.invocationCallOrder[0]);
  });

  describe.each(platforms)('%s rejects invalid boundaries before effects', platform => {
    it.each(['missing', 'static', 'invalid', 'tampered', 'expired', 'wrong-purpose', 'wrong-audience', 'wrong-platform', 'wrong-algorithm', 'no-cookie', 'other-browser', 'missing-code'])('%s', async variant => {
      const attempt = await start(platform);
      let state: string | undefined = attempt.state;
      let cookies = attempt.cookies;
      let code: string | undefined = 'provider-code';
      if (variant === 'missing') state = undefined;
      if (variant === 'static') state = `register_${platform}`;
      if (variant === 'invalid') state = 'not-a-jwt';
      if (variant === 'missing-code') code = undefined;
      if (variant === 'tampered') {
        const [head, payload, signature] = attempt.state.split('.');
        const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
        state = `${head}.${Buffer.from(JSON.stringify({ ...claims, userId: 'victim' })).toString('base64url')}.${signature}`;
      }
      if (['expired', 'wrong-purpose', 'wrong-audience', 'wrong-platform', 'wrong-algorithm'].includes(variant)) {
        const claims = jwt.decode(attempt.state) as jwt.JwtPayload;
        if (variant === 'expired') claims.exp = Math.floor(Date.now() / 1000) - 1;
        if (variant === 'wrong-purpose') claims.purpose = 'session';
        if (variant === 'wrong-audience') claims.aud = '2fa-challenge';
        if (variant === 'wrong-platform') claims.platform = 'unsupported';
        state = jwt.sign(claims, secret, { algorithm: variant === 'wrong-algorithm' ? 'HS512' : 'HS256' });
      }
      if (variant === 'no-cookie') cookies = [];
      if (variant === 'other-browser') cookies = (await start(platform)).cookies;
      signSpy.mockClear();
      const response = await request(app).get(`/v1/auth/social/callback/${platform}`).set('Cookie', cookies).query({ state, code });
      expect(response.status).toBe(400);
      expect(response.body.token).toBeUndefined();
      expect(redisConnection.eval).not.toHaveBeenCalled();
      noEffects();
    });
  });

  it.each(['unknown', 'INSTAGRAM', '__proto__'])('rejects unsupported platform %s before provider calls or storage', async platform => {
    const attempt = await start('instagram');
    expect((await callback(platform, attempt)).status).toBe(400);
    expect(redisConnection.eval).not.toHaveBeenCalled();
    noEffects();
  });

  it.each(platforms)('%s respects 2FA without refreshing social tokens or issuing a full session', async platform => {
    const twoFactorUser = { ...user, twoFactorEnabled: true, twoFactorSecret: 'encrypted-test-secret' };
    mockPrisma.socialPlatform.findFirst.mockResolvedValue({ influencer: { ...profile, user: twoFactorUser } });
    mockPrisma.user.findUnique.mockResolvedValue(twoFactorUser);
    const response = await callback(platform, await start(platform));
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('PENDING_2FA');
    expect(response.body.token).toBeUndefined();
    expect(jwt.verify(response.body.tempToken, secret)).toMatchObject({ scope: '2fa_pending', aud: '2fa-challenge' });
    noMutation();
    const pending = response.body.tempToken;
    expect((await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${pending}`)).status).toBe(401);
    mockVerifyTOTP.mockReturnValue(false);
    const rejected = await request(app).post('/v1/auth/2fa/verify').send({ tempToken: pending, code: '000000' });
    expect(rejected.status).toBe(401); expect(rejected.body.token).toBeUndefined();
    mockVerifyTOTP.mockReturnValue(true);
    const accepted = await request(app).post('/v1/auth/2fa/verify').send({ tempToken: pending, code: '123456' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.token).toBeUndefined();
    expect(jwt.verify(sessionFrom(accepted).token, secret)).toMatchObject({ id: user.id, role: user.role, purpose: 'session' });
  });

  it.each(platforms)('preserves new-account registration after authenticated %s provider identity', async platform => {
    const attempt = await start(platform);
    mockPrisma.socialPlatform.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ ...user, onboardingCompleted: false });
    mockPrisma.influencerProfile.create.mockResolvedValue(profile);
    const response = await callback(platform, attempt);
    expect(response.status).toBe(200);
    expect(response.body.user.onboardingCompleted).toBe(false);
    expect(response.body.token).toBeUndefined();
    expect(jwt.verify(sessionFrom(response).token, secret)).toMatchObject({ id: user.id, purpose: 'session' });
    expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.socialPlatform.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ platformId: 'provider-id', accessToken: 'provider-token' }),
    }));
  });

  it.each(['/v1/auth/me', '/v1/auth/social/urls', '/v1/integrations/urls', '/v1/integrations/instagram/auth-url'])('denies pending 2FA session on %s', async route => {
    const token = createTwoFactorChallenge(user.id);
    signSpy.mockClear();
    expect((await request(app).get(route).set('Authorization', `Bearer ${token}`)).status).toBe(401);
    expect(redisConnection.set).not.toHaveBeenCalled();
    noEffects();
  });

  it('OAuth state and legacy 2FA tokens cannot masquerade as sessions or complete 2FA', async () => {
    const attempt = await start('instagram');
    const legacy = jwt.sign({ id: user.id, scope: '2fa_pending' }, secret);
    for (const token of [attempt.state, legacy, session()]) {
      const response = await request(app).post('/v1/auth/2fa/verify').send({ tempToken: token, code: '123456' });
      expect(response.status).toBe(401);
    }
    for (const token of [attempt.state, legacy]) {
      expect((await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
    }
    expect(mockVerifyTOTP).not.toHaveBeenCalled();
  });

  it('password login + 2FA still produces a usable session only after TOTP', async () => {
    const passwordHash = await bcrypt.hash('valid-test-password', 4);
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, passwordHash, twoFactorEnabled: true, twoFactorSecret: 'encrypted-test-secret' });
    const login = await request(app).post('/v1/auth/login').send({ email: user.email, password: 'valid-test-password' });
    expect(login.body.status).toBe('PENDING_2FA'); expect(login.body.token).toBeUndefined();
    const verified = await request(app).post('/v1/auth/2fa/verify').send({ tempToken: login.body.tempToken, code: '123456' });
    expect(verified.status).toBe(200);
    expect(verified.body.token).toBeUndefined();
    expect((await request(app).get('/v1/auth/me').set('Cookie', sessionFrom(verified).cookie)).status).toBe(200);
  });

  it.each(['instagram', 'tiktok'])('integration %s accepts bound link state but rejects login state and replay', async platform => {
    const route = `/v1/integrations/${platform}/callback`;
    const login = await start(platform);
    expect((await callback(platform, login, route)).status).toBe(400);
    noEffects();
    const linked = await start(platform, '/v1/integrations/urls?from=onboarding');
    const response = await callback(platform, linked, route);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`https://frontend.example/onboarding?status=success&platform=${platform}`);
    expect(mockPrisma.socialPlatform.upsert).toHaveBeenCalledTimes(1);
    expect(signSpy).not.toHaveBeenCalled();
    expect((await callback(platform, linked, route)).status).toBe(400);
    expect(mockPrisma.socialPlatform.upsert).toHaveBeenCalledTimes(1);
  });

  it.each(['instagram', 'tiktok'])('integration %s state remains compatible with frontend forwarding to social callback', async platform => {
    const attempt = await start(platform, '/v1/integrations/urls');
    const response = await callback(platform, attempt);
    expect(response.status).toBe(200); expect(response.body.token).toBeUndefined();
    expect(mockPrisma.socialPlatform.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ influencerId: profile.id }),
    }));
  });

  describe.each(['instagram', 'tiktok'])('integration callback %s', platform => {
    it.each(['missing', 'static', 'tampered', 'expired', 'other-platform', 'other-browser'])('rejects %s state before any effects', async variant => {
      const attempt = await start(platform, '/v1/integrations/urls');
      let state: string | undefined = attempt.state;
      let cookies = attempt.cookies;
      if (variant === 'missing') state = undefined;
      if (variant === 'static') state = `register_${platform}`;
      if (variant === 'tampered') {
        const parts = attempt.state.split('.');
        parts[1] = Buffer.from(JSON.stringify({ ...(jwt.decode(state!) as object), userId: 'victim' })).toString('base64url');
        state = parts.join('.');
      }
      if (variant === 'expired') state = jwt.sign({ ...(jwt.decode(state!) as object), exp: Math.floor(Date.now() / 1000) - 1 }, secret);
      if (variant === 'other-platform') {
        const different = await start(platform === 'instagram' ? 'tiktok' : 'instagram', '/v1/integrations/urls');
        state = different.state; cookies = different.cookies;
      }
      if (variant === 'other-browser') cookies = (await start(platform, '/v1/integrations/urls')).cookies;
      signSpy.mockClear();
      const response = await request(app).get(`/v1/integrations/${platform}/callback`).set('Cookie', cookies).query({ code: 'provider-code', state });
      expect(response.status).toBe(400);
      expect(mockPrisma.influencerProfile.findUnique).not.toHaveBeenCalled();
      noEffects();
    });
  });

  it.each(['instagram', 'tiktok', 'youtube'])('authenticated social URL %s binds the session owner, ignoring client userId', async platform => {
    const attempt = await start(platform, '/v1/auth/social/urls?userId=someone-else');
    expect(jwt.verify(attempt.state, secret)).toMatchObject({ mode: 'link', userId: user.id });
    expect((await callback(platform, attempt)).status).toBe(200);
    expect(mockPrisma.influencerProfile.findUnique).toHaveBeenCalledWith({ where: { userId: user.id } });
    expect(signSpy).not.toHaveBeenCalled();
  });

  it('consumes a state atomically even for concurrent requests with the same cookie', async () => {
    const attempt = await start('instagram');
    const responses = await Promise.all([callback('instagram', attempt), callback('instagram', attempt)]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 400]);
    expect(mockExchange).toHaveBeenCalledTimes(1);
    expect(mockPrisma.socialPlatform.upsert).toHaveBeenCalledTimes(1);
  });

  it.each(['offline', 'lost-attempt'])('fails closed when Redis is %s', async variant => {
    const attempt = await start('instagram');
    if (variant === 'offline') redisConnection.status = 'reconnecting';
    else resetOAuthRedis();
    expect((await callback('instagram', attempt)).status).toBe(variant === 'offline' ? 503 : 400);
    noEffects();
  });

  it('cannot start OAuth if storage or JWT configuration is unavailable', async () => {
    redisConnection.set.mockRejectedValue(new Error('redis unavailable'));
    const offline = await request(app).get('/v1/auth/social/public-urls');
    expect(offline.status).toBe(503); expect(offline.headers['set-cookie']).toBeUndefined();
    delete process.env.JWT_SECRET;
    expect((await request(app).get('/v1/auth/social/public-urls')).status).toBe(503);
    noMutation();
  });

  it.each(['instagram', 'tiktok', 'google', 'youtube'])('%s rejects incomplete provider identity before mutations', async platform => {
    const attempt = await start(platform);
    mockExchange.mockResolvedValue({ accessToken: '', platformId: 'undefined' });
    mockPost.mockResolvedValue({ data: {} });
    const response = await callback(platform, attempt);
    expect(response.status).toBe(400);
    expect(signSpy).not.toHaveBeenCalled();
    noMutation();
  });

  it('rejects an untrusted origin instead of signing an attacker redirect URL', async () => {
    const response = await request(app).get('/v1/auth/social/public-urls').set('Origin', 'https://attacker.example');
    expect(response.status).toBe(400);
    expect(redisConnection.set).not.toHaveBeenCalled();
    noEffects();
  });

  it.each([
    '/v1/auth/social/callback/instagram', '/v1/auth/social/callback/tiktok',
    '/v1/auth/social/callback/google', '/v1/auth/social/callback/youtube',
    '/v1/auth/social/callback/unknown', '/v1/integrations/instagram/callback', '/v1/integrations/tiktok/callback',
  ])('invalid callback %s does not write PageView through the global middleware', async route => {
    const server = express();
    server.use(trackPageView);
    server.use(app);
    expect((await request(server).get(route).query({ code: 'untrusted', state: 'static' })).status).toBe(400);
    noEffects();
  });

  it('preserves analytics outside OAuth callback paths', async () => {
    const server = express();
    server.use(trackPageView);
    server.get('/v1/health', (_req, res) => res.json({ status: 'OK' }));
    expect((await request(server).get('/v1/health')).status).toBe(200);
    expect(mockPrisma.pageView.create).toHaveBeenCalledTimes(1);
  });

  it('keeps state opaque in frontend and checks PENDING_2FA before session completion (source regression)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../web/src/app/auth/callback/[platform]/page.tsx'), 'utf8');
    expect(source.indexOf("res.data.status === 'PENDING_2FA'")).toBeLessThan(source.indexOf('completeSession(res.data)'));
    expect(source).toContain("'/auth/2fa/verify'");
    expect(source).not.toContain('jwt.decode'); expect(source).not.toContain("state.endsWith");
    expect(source).toContain('startedAttempt.current === attempt');
    const client = fs.readFileSync(path.resolve(__dirname, '../web/src/lib/api.ts'), 'utf8');
    expect(client).toContain('withCredentials: true');
    expect(client).not.toContain("Cookies.get('influnext_token')");
    expect(client).not.toContain('headers.Authorization');
    for (const file of ['auth.social.controller.ts', 'integration.controller.ts']) {
      expect(fs.readFileSync(path.resolve(__dirname, '../src/controllers', file), 'utf8')).not.toMatch(/state=register_|jwt\.decode/);
    }
  });
});
