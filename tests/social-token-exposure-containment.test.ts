import axios from 'axios';

const mockRunTokenRenewalLogic = jest.fn();
const mockCalculateAndPersist = jest.fn();
const mockGenerateWeeklyAnalysis = jest.fn();
const mockCalendarInsert = jest.fn();
const mockSetCredentials = jest.fn();

const mockPrisma = {
  influencerProfile: { findUnique: jest.fn(), update: jest.fn() },
  socialPlatform: { findUnique: jest.fn(), upsert: jest.fn() },
  metricSnapshot: { create: jest.fn() },
  contract: { findMany: jest.fn() },
  user: { update: jest.fn() },
};

jest.mock('../src/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('../src/workers/token-renewal.worker', () => ({ runTokenRenewalLogic: mockRunTokenRenewalLogic }));
jest.mock('../src/services/scoring.service', () => ({
  ScoringService: { calculateAndPersist: mockCalculateAndPersist },
}));
jest.mock('../src/services/ai.service', () => ({
  AIService: { generateWeeklyAnalysis: mockGenerateWeeklyAnalysis },
}));
jest.mock('../src/services/trend-scanner.service', () => ({
  TrendScannerService: { scanRealTimeTrends: jest.fn() },
}));
jest.mock('googleapis', () => ({
  google: {
    auth: { OAuth2: jest.fn(() => ({ setCredentials: mockSetCredentials })) },
    calendar: jest.fn(() => ({ events: { insert: mockCalendarInsert } })),
  },
}));
jest.mock('axios');

import { getInfluencerDashboard } from '../src/controllers/dashboard.controller';
import { getConnectedPlatforms, simulateInstagramConnection, triggerTokenRenewalDebug } from '../src/controllers/integration.controller';
import { getPublicProfile } from '../src/controllers/public.controller';
import { InstagramService } from '../src/services/instagram.service';
import { TikTokService } from '../src/services/tiktok.service';
import { CalendarService } from '../src/services/calendar.service';
import { sanitizeProviderError } from '../src/utils/provider-error';

const mockedAxios = axios as jest.Mocked<typeof axios>;

function responseMock() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.redirect = jest.fn(() => res);
  return res;
}

function serializedCalls(spy: jest.SpyInstance): string {
  return spy.mock.calls.flat().map(value => {
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }).join(' ');
}

function dashboardProfile() {
  return {
    id: 'profile-1', handle: 'creator', niche: 'tech', city: 'Recife', state: 'PE', bio: 'bio',
    profileImageUrl: null, influScore: 80, scoreClass: 'GOLD', dailyMission: null,
    missionCompleted: false, aiInterview: null,
    user: { email: 'creator@example.test', role: 'INFLUENCER' },
    platforms: [{
      id: 'social-1', influencerId: 'profile-1', platformName: 'INSTAGRAM', platformId: 'provider-1',
      username: 'creator', profilePicture: null, followersCount: 10, expiresAt: null, isActive: true,
      accessToken: 'dashboard-access-secret', refreshToken: 'dashboard-refresh-secret',
    }],
    contracts: [], metricsHistory: [], tasks: [], trendVault: [], aiAnalyses: [], rateCards: [],
  };
}

describe('STEP 1H-B1 — Social token exposure containment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      INSTAGRAM_CLIENT_ID: 'test-instagram-client',
      INSTAGRAM_CLIENT_SECRET: 'test-instagram-client-secret',
      TIKTOK_CLIENT_KEY: 'test-tiktok-client',
      TIKTOK_CLIENT_SECRET: 'test-tiktok-client-secret',
    };
    mockPrisma.contract.findMany.mockResolvedValue([]);
    mockCalculateAndPersist.mockResolvedValue({});
    mockGenerateWeeklyAnalysis.mockResolvedValue({});
  });

  afterAll(() => { process.env = originalEnv; });

  it('dashboard never returns accessToken', async () => {
    mockPrisma.influencerProfile.findUnique.mockResolvedValue(dashboardProfile());
    const res = responseMock();

    await getInfluencerDashboard({ user: { id: 'user-1' } } as any, res);

    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('dashboard-access-secret');
    expect(res.json.mock.calls[0][0].platforms[0].accessToken).toBeUndefined();
  });

  it('dashboard never returns refreshToken and queries only safe platform fields', async () => {
    mockPrisma.influencerProfile.findUnique.mockResolvedValue(dashboardProfile());
    const res = responseMock();

    await getInfluencerDashboard({ user: { id: 'user-1' } } as any, res);

    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('dashboard-refresh-secret');
    const query = mockPrisma.influencerProfile.findUnique.mock.calls[0][0];
    expect(query.include.platforms.select.accessToken).toBeUndefined();
    expect(query.include.platforms.select.refreshToken).toBeUndefined();
    expect(query.include.platforms.select).toMatchObject({ platformName: true, username: true, followersCount: true });
  });

  it('connected platforms returns names only and does not load tokens', async () => {
    mockPrisma.influencerProfile.findUnique.mockResolvedValue({ platforms: [{ platformName: 'INSTAGRAM' }] });
    const res = responseMock();

    await getConnectedPlatforms({ user: { id: 'user-1' } } as any, res);

    expect(res.json).toHaveBeenCalledWith({ platforms: ['INSTAGRAM'] });
    expect(mockPrisma.influencerProfile.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      include: { platforms: { where: { isActive: true }, select: { platformName: true } } },
    }));
  });

  it('public media kit keeps its explicit token-free platform projection', async () => {
    mockPrisma.influencerProfile.findUnique.mockResolvedValue({
      id: 'profile-1', handle: 'creator', platforms: [{ platformName: 'INSTAGRAM', platformId: 'provider-1' }], tasks: [],
    });
    const res = responseMock();

    await getPublicProfile({ params: { handle: 'creator' } } as any, res);

    const query = mockPrisma.influencerProfile.findUnique.mock.calls[0][0];
    expect(query.select.platforms.select).toEqual({ platformName: true, platformId: true });
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toMatch(/accessToken|refreshToken/);
  });

  it('simulation endpoint returns no token even though it creates a simulated credential', async () => {
    mockPrisma.influencerProfile.findUnique.mockResolvedValue({ id: 'profile-1', handle: 'creator' });
    mockPrisma.socialPlatform.upsert.mockResolvedValue({});
    mockPrisma.metricSnapshot.create.mockResolvedValue({});
    mockPrisma.influencerProfile.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});
    const res = responseMock();

    await simulateInstagramConnection({
      user: { id: 'user-1' },
      body: { platform: 'INSTAGRAM', username: 'creator', followersCount: 100 },
    } as any, res);

    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true, platform: 'INSTAGRAM', username: 'creator' });
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toMatch(/accessToken|refreshToken|simulated_access_token/);
  });

  it('admin renewal debug response and log do not expose an error token', async () => {
    mockRunTokenRenewalLogic.mockRejectedValue(new Error('refresh_token=debug-refresh-secret'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = responseMock();

    await triggerTokenRenewalDebug({} as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('debug-refresh-secret');
    expect(serializedCalls(log)).not.toContain('debug-refresh-secret');
  });

  it('sanitizer excludes Authorization, provider URLs and token-bearing config', () => {
    const sanitized = sanitizeProviderError({
      message: 'Request failed at https://graph.example/me?access_token=url-secret',
      code: 'ERR_BAD_REQUEST',
      config: { headers: { Authorization: 'Bearer header-secret' }, data: 'refresh_token=config-secret' },
      response: {
        status: 401,
        data: { error: { code: 'invalid_token', message: 'Authorization: Bearer payload-secret' } },
      },
    }, 'Provider request failed.');

    const output = JSON.stringify(sanitized);
    expect(sanitized).toEqual({ message: 'Provider request failed.', status: 401, code: 'invalid_token' });
    expect(output).not.toMatch(/url-secret|header-secret|config-secret|payload-secret/);
  });

  it('Instagram provider errors do not log access tokens or tokenized URLs', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedAxios.post.mockRejectedValueOnce({
      message: 'Request failed https://api.instagram.test/token?access_token=instagram-url-secret',
      response: { status: 400, data: { error: { message: 'access_token=instagram-payload-secret' } } },
      config: { headers: { Authorization: 'Bearer instagram-header-secret' } },
    });

    await expect(InstagramService.exchangeCodeForToken('fake-code', 'https://frontend.test/callback')).rejects.toThrow();

    expect(serializedCalls(log)).not.toMatch(/instagram-(url|payload|header)-secret/);
  });

  it('TikTok provider errors do not log refresh tokens', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error_description: 'refresh_token=tiktok-refresh-secret' } },
      message: 'refresh_token=tiktok-refresh-secret',
    });

    await expect(TikTokService.refreshAccessToken('fake-refresh-token')).rejects.toThrow('Falha ao renovar token do TikTok');

    expect(serializedCalls(log)).not.toContain('tiktok-refresh-secret');
  });

  it('Calendar logs a sanitized Google error instead of the SDK object', async () => {
    mockPrisma.influencerProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
    mockPrisma.socialPlatform.findUnique.mockResolvedValue({
      accessToken: 'calendar-access-secret', refreshToken: 'calendar-refresh-secret',
    });
    mockCalendarInsert.mockRejectedValue({
      message: 'Authorization: Bearer calendar-access-secret',
      config: { headers: { Authorization: 'Bearer calendar-access-secret' }, data: 'refresh_token=calendar-refresh-secret' },
    });
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await CalendarService.syncTaskToCalendar('user-1', {
      title: 'Test', description: null, scheduledDate: new Date('2026-09-04T12:00:00Z'),
    });

    const output = serializedCalls(log);
    expect(output).not.toMatch(/calendar-access-secret|calendar-refresh-secret/);
    expect(mockPrisma.socialPlatform.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      select: { accessToken: true, refreshToken: true },
    }));
  });
});
