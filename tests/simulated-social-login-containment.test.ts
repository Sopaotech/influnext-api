import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  influencerProfile: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  companyProfile: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  socialPlatform: { findFirst: jest.fn(), create: jest.fn(), upsert: jest.fn() },
  metricSnapshot: { create: jest.fn(), update: jest.fn() },
  pageView: { count: jest.fn(), create: jest.fn() },
};
const mockVerifyToken = jest.fn();
const mockGenerateSetup = jest.fn();
const mockExchangeCode = jest.fn();
const mockFetchProfile = jest.fn();
const mockInstagramSync = jest.fn();
const mockTikTokSync = jest.fn();
const mockAxiosPost = jest.fn();
const mockAxiosGet = jest.fn();
const mockScore = jest.fn();
const mockAnalysis = jest.fn();

jest.mock('../src/lib/prisma', () => ({ prisma: mockPrisma }));
// Keep these tests independent of TOTP/QR generation and external providers.
jest.mock('../src/services/twoFactor.service', () => ({
  TwoFactorService: { verifyToken: mockVerifyToken, generateSetup: mockGenerateSetup },
}));
jest.mock('../src/services/instagram.service', () => ({
  InstagramService: {
    exchangeCodeForToken: mockExchangeCode,
    fetchProfileData: mockFetchProfile,
    syncInstagramData: mockInstagramSync,
  },
}));
jest.mock('../src/services/tiktok.service', () => ({
  TikTokService: { syncTikTokData: mockTikTokSync },
}));
jest.mock('../src/services/scoring.service', () => ({ ScoringService: { calculateAndPersist: mockScore } }));
jest.mock('../src/services/ai.service', () => ({ AIService: { generateWeeklyAnalysis: mockAnalysis } }));
jest.mock('axios', () => ({ __esModule: true, default: { post: mockAxiosPost, get: mockAxiosGet } }));

import authRoutes from '../src/routes/auth.routes';
import socialAuthRoutes from '../src/routes/auth.social.routes';

const app = express();
app.use(express.json());
app.use('/v1/auth/social', socialAuthRoutes);
app.use('/v1/auth', authRoutes);

describe('STEP 1F-B — simulated social login containment', () => {
  const originalEnv = process.env;
  const jwtSecret = 'test-only-social-containment-secret';
  const password = 'valid-test-password';
  let passwordHash: string;
  let signSpy: jest.SpyInstance;
  const user = {
    id: 'user-1', email: 'person@example.com', role: 'INFLUENCER',
    onboardingCompleted: true, twoFactorEnabled: false, twoFactorSecret: null,
  };

  beforeAll(async () => { passwordHash = await bcrypt.hash(password, 4); });
  beforeEach(() => {
    process.env = {
      ...originalEnv, NODE_ENV: 'production', JWT_SECRET: jwtSecret,
      INSTAGRAM_CLIENT_ID: 'test-instagram-client', TIKTOK_CLIENT_KEY: 'test-tiktok-client',
      GOOGLE_CLIENT_ID: 'test-google-client', FRONTEND_URL: 'https://frontend.example',
    };
    signSpy = jest.spyOn(jwt, 'sign');
    mockPrisma.pageView.count.mockResolvedValue(0);
    mockPrisma.pageView.create.mockResolvedValue({});
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, passwordHash });
    mockPrisma.influencerProfile.findUnique.mockResolvedValue(null);
  });
  afterEach(() => { process.env = originalEnv; });

  function expectNoPrismaOrProviderCalls() {
    for (const model of Object.values(mockPrisma)) {
      for (const method of Object.values(model)) expect(method).not.toHaveBeenCalled();
    }
    for (const method of [mockExchangeCode, mockFetchProfile, mockInstagramSync, mockTikTokSync,
      mockAxiosPost, mockAxiosGet, mockScore, mockAnalysis]) expect(method).not.toHaveBeenCalled();
    expect(signSpy).not.toHaveBeenCalled();
  }

  const environments = ['production', 'development', 'test', 'staging', undefined];
  it.each(environments.flatMap(env => ['INSTAGRAM', 'TIKTOK'].map(platform => [env, platform])))
   ('username is rejected without JWT or any mutation in %s / %s', async (env, platform) => {
      if (env === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = env;
      const response = await request(app).post('/v1/auth/social-login').send({
        platform, username: '@unverified_handle', gender: 'feminino', niche: 'Lifestyle',
      });
      expect(response.status).toBe(404);
      expect(response.body.token).toBeUndefined();
      expect(response.headers['set-cookie']).toBeUndefined();
      expectNoPrismaOrProviderCalls();
    });

  it.each(['INSTAGRAM', 'TIKTOK'])('does not create a new %s simulated account', async platform => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const response = await request(app).post('/v1/auth/social-login').send({ platform, username: 'new_profile' });
    expect(response.status).toBe(404);
    expectNoPrismaOrProviderCalls();
  });

  it('does not authenticate an existing simulated account, even with 2FA enabled', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, email: 'victim@social.influnext.com', twoFactorEnabled: true });
    const response = await request(app).post('/v1/auth/social-login').send({ platform: 'INSTAGRAM', username: 'victim' });
    expect(response.status).toBe(404);
    expectNoPrismaOrProviderCalls();
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it.each(['INFLUENCER', 'COMPANY'])('preserves email/password login for %s', async role => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, role, passwordHash });
    const response = await request(app).post('/v1/auth/login').send({ email: user.email, password });
    expect(response.status).toBe(200);
    expect(jwt.verify(response.body.token, jwtSecret)).toMatchObject({ id: user.id, email: user.email, role });
    expect(response.body.user.onboardingCompleted).toBe(true);
  });

  it('rejects an incorrect password without issuing JWT', async () => {
    const response = await request(app).post('/v1/auth/login').send({ email: user.email, password: 'wrong-password' });
    expect(response.status).toBe(401);
    expect(signSpy).not.toHaveBeenCalled();
  });

  it.each(['INFLUENCER', 'COMPANY'])('preserves legitimate signup for %s without simulated social data', async role => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockImplementation(({ data }) => Promise.resolve({ id: user.id, email: data.email, role: data.role }));
    mockPrisma.influencerProfile.create.mockResolvedValue({ id: 'profile-1' });
    const response = await request(app).post('/v1/auth/signup').send({ email: user.email, password, role });
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe(role);
    expect(await bcrypt.compare(password, mockPrisma.user.create.mock.calls[0][0].data.passwordHash)).toBe(true);
    expect(mockPrisma.influencerProfile.create).toHaveBeenCalledTimes(role === 'INFLUENCER' ? 1 : 0);
    expect(mockPrisma.socialPlatform.create).not.toHaveBeenCalled();
    expect(mockPrisma.metricSnapshot.create).not.toHaveBeenCalled();
    expect(signSpy).not.toHaveBeenCalled();
  });

  it.each([true, false])('preserves the 2FA challenge and respects TOTP validation = %s', async valid => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, passwordHash, twoFactorEnabled: true, twoFactorSecret: 'encrypted-totp-fixture' });
    mockVerifyToken.mockReturnValue(valid);
    const login = await request(app).post('/v1/auth/login').send({ email: user.email, password });
    expect(login.status).toBe(200);
    expect(login.body.status).toBe('PENDING_2FA');
    expect(login.body.token).toBeUndefined();
    expect(jwt.verify(login.body.tempToken, jwtSecret)).toMatchObject({ id: user.id, scope: '2fa_pending' });
    signSpy.mockClear();
    const verified = await request(app).post('/v1/auth/2fa/verify').send({ tempToken: login.body.tempToken, code: '123456' });
    expect(mockVerifyToken).toHaveBeenCalledWith('encrypted-totp-fixture', '123456');
    expect(verified.status).toBe(valid ? 200 : 401);
    if (valid) expect(jwt.verify(verified.body.token, jwtSecret)).toMatchObject({ id: user.id, role: user.role });
    else {
      expect(verified.body.token).toBeUndefined();
      expect(signSpy).not.toHaveBeenCalled();
    }
  });

  it('preserves authenticated profile and 2FA setup/confirmation routes', async () => {
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, jwtSecret);
    mockGenerateSetup.mockResolvedValue({ encrypted: 'encrypted-fixture', secret: 'setup-fixture', qrCodeData: 'qr-fixture' });
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, twoFactorSecret: 'encrypted-fixture' });
    mockPrisma.user.update.mockResolvedValue({});
    mockVerifyToken.mockReturnValue(true);
    expect((await request(app).get('/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect((await request(app).post('/v1/auth/2fa/setup').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    const confirm = await request(app).post('/v1/auth/2fa/confirm').set('Authorization', `Bearer ${token}`).send({ code: '123456' });
    expect(confirm.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  });

  it('keeps public provider authorization URLs accessible without issuing JWT', async () => {
    const response = await request(app).get('/v1/auth/social/public-urls');
    expect(response.status).toBe(200);
    for (const [provider, origin] of [['instagram', 'https://www.instagram.com'], ['tiktok', 'https://www.tiktok.com'], ['google', 'https://accounts.google.com']]) {
      expect(response.body.configured[provider]).toBe(true);
      expect(new URL(response.body[provider]).origin).toBe(origin);
      expect(new URL(response.body[provider]).searchParams.get('response_type')).toBe('code');
    }
    expectNoPrismaOrProviderCalls();
  });

  it.each(['instagram', 'tiktok'])('OAuth %s requires code/state, not just username', async platform => {
    const response = await request(app).get(`/v1/auth/social/callback/${platform}`).query({ username: 'unverified_handle' });
    expect(response.status).toBe(400);
    expectNoPrismaOrProviderCalls();
  });

  it.each(['instagram', 'tiktok'])('OAuth %s has no username fallback when provider exchange fails', async platform => {
    mockExchangeCode.mockRejectedValue(new Error('invalid-provider-code'));
    mockAxiosPost.mockRejectedValue(new Error('invalid-provider-code'));
    const response = await request(app).get(`/v1/auth/social/callback/${platform}`).query({ code: 'invalid', state: `register_${platform}`, username: 'unverified_handle' });
    expect(response.status).toBe(400);
    expect(response.body.token).toBeUndefined();
    expect(signSpy).not.toHaveBeenCalled();
    for (const model of Object.values(mockPrisma)) {
      for (const method of Object.values(model)) expect(method).not.toHaveBeenCalled();
    }
  });

  it.each(['instagram', 'tiktok'])('preserves %s callback after provider exchange (mocked provider)', async platform => {
    mockExchangeCode.mockResolvedValue({ accessToken: 'provider-token', platformId: 'provider-user-1', expiresIn: 3600 });
    mockFetchProfile.mockResolvedValue({ username: 'provider_user', followers_count: 17 });
    mockAxiosPost.mockResolvedValue({ data: { access_token: 'provider-token', open_id: 'provider-user-1', expires_in: 3600 } });
    mockAxiosGet.mockResolvedValue({ data: { data: { user: { username: 'provider_user', follower_count: 17 } } } });
    mockPrisma.socialPlatform.findFirst.mockResolvedValue({ influencer: { id: 'profile-1', userId: user.id, handle: 'provider_user', user } });
    mockPrisma.influencerProfile.update.mockResolvedValue({});
    mockPrisma.socialPlatform.upsert.mockResolvedValue({});
    mockInstagramSync.mockResolvedValue(undefined);
    mockTikTokSync.mockResolvedValue(undefined);
    const response = await request(app).get(`/v1/auth/social/callback/${platform}`).query({ code: 'provider-code', state: `register_${platform}` });
    expect(response.status).toBe(200);
    expect(jwt.verify(response.body.token, jwtSecret)).toMatchObject({ id: user.id });
    const exchange = platform === 'instagram' ? mockExchangeCode : mockAxiosPost;
    expect(exchange.mock.invocationCallOrder[0]).toBeLessThan(mockPrisma.socialPlatform.findFirst.mock.invocationCallOrder[0]);
    expect(mockPrisma.socialPlatform.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ platformId: 'provider-user-1', followersCount: 17, accessToken: 'provider-token' }),
    }));
  });
});
