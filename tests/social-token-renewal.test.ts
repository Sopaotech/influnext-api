const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockNotificationCreate = jest.fn();
const mockTikTokRefresh = jest.fn();
const mockInstagramRefresh = jest.fn();
const mockAddNotificationJob = jest.fn();

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    socialPlatform: { findMany: mockFindMany, update: mockUpdate },
    notification: { create: mockNotificationCreate },
  },
}));
jest.mock('../src/services/tiktok.service', () => ({ TikTokService: { refreshAccessToken: mockTikTokRefresh } }));
jest.mock('../src/services/instagram.service', () => ({ InstagramService: { refreshLongLivedToken: mockInstagramRefresh } }));
jest.mock('../src/queues/notification.queue', () => ({ addNotificationJob: mockAddNotificationJob }));
jest.mock('../src/lib/redis', () => ({ redisConnection: {} }));
jest.mock('bullmq', () => ({ Worker: jest.fn() }));

import { runTokenRenewalLogic } from '../src/workers/token-renewal.worker';
import { decryptSocialToken, encryptSocialToken, isEncryptedSocialToken } from '../src/utils/social-token-crypto';

describe('STEP 1H-B2 — token renewal storage boundary', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SOCIAL_TOKEN_ACTIVE_KEY_ID: 'v1',
      SOCIAL_TOKEN_KEY_V1: '66'.repeat(32),
    };
  });

  afterAll(() => { process.env = originalEnv; });

  it('decrypts TikTok refresh input and encrypts rotated provider tokens', async () => {
    const encryptedRefresh = encryptSocialToken('old-refresh-token', {
      influencerId: 'profile-1', platformName: 'TIKTOK', field: 'refreshToken',
    });
    mockFindMany.mockResolvedValueOnce([{
      id: 'social-1', influencerId: 'profile-1', username: 'creator', refreshToken: encryptedRefresh,
    }]).mockResolvedValueOnce([]);
    mockTikTokRefresh.mockResolvedValue({
      accessToken: 'new-access-token', refreshToken: 'new-refresh-token', refreshTokenRotated: true, expiresIn: 3600,
    });

    await runTokenRenewalLogic();

    expect(mockTikTokRefresh).toHaveBeenCalledWith('old-refresh-token');
    const data = mockUpdate.mock.calls[0][0].data;
    expect(isEncryptedSocialToken(data.accessToken)).toBe(true);
    expect(isEncryptedSocialToken(data.refreshToken)).toBe(true);
    expect(decryptSocialToken(data.accessToken, {
      influencerId: 'profile-1', platformName: 'TIKTOK', field: 'accessToken',
    }).value).toBe('new-access-token');
    expect(decryptSocialToken(data.refreshToken, {
      influencerId: 'profile-1', platformName: 'TIKTOK', field: 'refreshToken',
    }).value).toBe('new-refresh-token');
  });

  it('preserves the exact stored TikTok refresh token when the provider does not rotate it', async () => {
    const encryptedRefresh = encryptSocialToken('old-refresh-token', {
      influencerId: 'profile-1', platformName: 'TIKTOK', field: 'refreshToken',
    });
    mockFindMany.mockResolvedValueOnce([{
      id: 'social-1', influencerId: 'profile-1', username: 'creator', refreshToken: encryptedRefresh,
    }]).mockResolvedValueOnce([]);
    mockTikTokRefresh.mockResolvedValue({
      accessToken: 'new-access-token', refreshToken: 'old-refresh-token', refreshTokenRotated: false, expiresIn: 3600,
    });

    await runTokenRenewalLogic();

    expect(mockUpdate.mock.calls[0][0].data).not.toHaveProperty('refreshToken');
  });

  it('decrypts Instagram access input and encrypts the renewed access token', async () => {
    const encryptedAccess = encryptSocialToken('old-access-token', {
      influencerId: 'profile-2', platformName: 'INSTAGRAM', field: 'accessToken',
    });
    mockFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{
      id: 'social-2', influencerId: 'profile-2', username: 'creator', accessToken: encryptedAccess,
      expiresAt: new Date(Date.now() + 86400000), influencer: { userId: 'user-2' },
    }]);
    mockInstagramRefresh.mockResolvedValue({ accessToken: 'renewed-access-token', expiresIn: 3600 });

    await runTokenRenewalLogic();

    expect(mockInstagramRefresh).toHaveBeenCalledWith('old-access-token');
    const data = mockUpdate.mock.calls[0][0].data;
    expect(decryptSocialToken(data.accessToken, {
      influencerId: 'profile-2', platformName: 'INSTAGRAM', field: 'accessToken',
    }).value).toBe('renewed-access-token');
  });
});
