import axios from 'axios';
import { InstagramService } from '../src/services/instagram.service';
import { TikTokService } from '../src/services/tiktok.service';
import { AuditorService } from '../src/services/auditor.service';
import { prisma } from '../src/lib/prisma';
import { ScoringService } from '../src/services/scoring.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    influencerProfile: {
      update: jest.fn().mockResolvedValue({ id: 'inf-123', handle: 'test_creator' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'inf-123', handle: 'test_creator' })
    },
    metricSnapshot: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'snap-1', ...args.data }))
    },
    socialPlatform: {
      update: jest.fn().mockResolvedValue({ id: 'sp-1' }),
      upsert: jest.fn().mockResolvedValue({ id: 'sp-1' }),
      findMany: jest.fn().mockResolvedValue([])
    }
  }
}));

jest.mock('../src/services/scoring.service', () => ({
  ScoringService: {
    calculateAndPersist: jest.fn().mockResolvedValue({ influScore: 85, scoreClass: 'A' })
  }
}));

jest.mock('../src/services/ai.service', () => ({
  AIService: {
    generateWeeklyAnalysis: jest.fn().mockResolvedValue({ analysisText: 'Análise mock', recommendations: '[]' })
  }
}));

describe('Integrações de Redes Sociais Reais (Instagram & TikTok API)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.metricSnapshot.create as jest.Mock).mockImplementation((args) => 
      Promise.resolve({ id: 'snap-1', ...args.data })
    );
    (prisma.influencerProfile.update as jest.Mock).mockResolvedValue({ id: 'inf-123', handle: 'test_creator' });
    (prisma.influencerProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'inf-123', handle: 'test_creator' });
    (ScoringService.calculateAndPersist as jest.Mock).mockResolvedValue({ influScore: 85, scoreClass: 'A' });

    process.env = {
      ...originalEnv,
      INSTAGRAM_CLIENT_ID: 'mock_ig_client_id',
      INSTAGRAM_CLIENT_SECRET: 'mock_ig_client_secret',
      TIKTOK_CLIENT_KEY: 'mock_tt_client_key',
      TIKTOK_CLIENT_SECRET: 'mock_tt_client_secret'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('InstagramService', () => {
    it('deve gerar a URL de autorização correta para Instagram Login', () => {
      const redirectUri = 'https://influnext.com.br/auth/callback/instagram';
      const url = InstagramService.buildAuthorizationUrl(redirectUri);

      expect(url).toContain('https://www.instagram.com/oauth/authorize');
      expect(url).toContain('client_id=mock_ig_client_id');
      expect(url).toContain('scope=instagram_business_basic');
      expect(url).toContain(encodeURIComponent(redirectUri));
    });

    it('deve trocar o código por token de curta duração e em seguida por token de longa duração (60 dias)', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'short_lived_token', user_id: '123456789' }
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: 'long_lived_token_60_days', expires_in: 5184000 }
      });

      const tokenResult = await InstagramService.exchangeCodeForToken('auth_code_123', 'https://influnext.com.br/callback');

      expect(tokenResult.accessToken).toBe('long_lived_token_60_days');
      expect(tokenResult.platformId).toBe('123456789');
      expect(tokenResult.expiresIn).toBe(5184000);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.instagram.com/oauth/access_token',
        expect.stringContaining('grant_type=authorization_code'),
        expect.any(Object)
      );
    });

    it('deve renovar token de longa duração via refresh_access_token', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: 'refreshed_long_token', expires_in: 5184000 }
      });

      const refreshResult = await InstagramService.refreshLongLivedToken('current_long_token');
      expect(refreshResult.accessToken).toBe('refreshed_long_token');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://graph.instagram.com/refresh_access_token',
        expect.objectContaining({
          params: expect.objectContaining({ grant_type: 'ig_refresh_token' })
        })
      );
    });

    it('deve buscar os dados do perfil Instagram (/me)', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: '123456789',
          username: 'creator_star',
          name: 'Creator Star',
          followers_count: 45000,
          media_count: 120,
          profile_picture_url: 'https://cdn.instagram.com/pfp.jpg'
        }
      });

      const profile = await InstagramService.fetchProfileData('valid_token');
      expect(profile.username).toBe('creator_star');
      expect(profile.followers_count).toBe(45000);
    });

    it('deve sincronizar dados, métricas, top posts e gerar snapshot auditado', async () => {
      // 1. Profile
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 'ig-user-1',
          username: 'creator_pro',
          followers_count: 50000,
          profile_picture_url: 'https://cdn.instagram.com/pfp.jpg'
        }
      });

      // 2. Media List
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'media-1',
              caption: 'Amazing Reel video!',
              media_type: 'VIDEO',
              permalink: 'https://instagram.com/p/1',
              like_count: 2500,
              comments_count: 150,
              timestamp: '2026-08-01T10:00:00Z'
            }
          ]
        }
      });

      // 3. Media Insights
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            { name: 'plays', values: [{ value: 35000 }] },
            { name: 'reach', values: [{ value: 28000 }] },
            { name: 'saved', values: [{ value: 400 }] },
            { name: 'shares', values: [{ value: 250 }] }
          ]
        }
      });

      const syncResult = await InstagramService.syncInstagramData('inf-123', 'access_token_123', 'ig-user-1');

      expect(syncResult.success).toBe(true);
      expect(syncResult.username).toBe('creator_pro');
      expect(syncResult.followers).toBe(50000);
      expect(syncResult.avgViews).toBe(35000);
      expect(prisma.influencerProfile.update).toHaveBeenCalled();
      expect(prisma.metricSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            influencerId: 'inf-123',
            provider: 'INSTAGRAM',
            followers: 50000,
            avgViews: 35000,
            integrityHash: expect.any(String)
          })
        })
      );
    });
  });

  describe('TikTokService', () => {
    it('deve renovar o token de acesso expirado do TikTok usando refresh_token', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'new_tt_access_token',
          expires_in: 86400,
          refresh_token: 'new_tt_refresh_token',
          open_id: 'tt_open_id_123'
        }
      });

      const result = await TikTokService.refreshAccessToken('current_tt_refresh_token');

      expect(result.accessToken).toBe('new_tt_access_token');
      expect(result.refreshToken).toBe('new_tt_refresh_token');
      expect(result.refreshTokenRotated).toBe(true);
      expect(result.openId).toBe('tt_open_id_123');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/oauth/token/',
        expect.stringContaining('grant_type=refresh_token'),
        expect.any(Object)
      );
    });

    it('informa quando o TikTok omite um refresh token novo', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'new_tt_access_token',
          expires_in: 86400,
          open_id: 'tt_open_id_123'
        }
      });

      const result = await TikTokService.refreshAccessToken('current_tt_refresh_token');

      expect(result.refreshToken).toBe('current_tt_refresh_token');
      expect(result.refreshTokenRotated).toBe(false);
    });

    it('deve sincronizar métricas reais do TikTok, salvar perfil e snapshot auditado', async () => {
      // 1. User info
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            user: {
              open_id: 'tt-user-999',
              display_name: 'TikTokCreatorBR',
              avatar_url: 'https://cdn.tiktok.com/avatar.jpg',
              follower_count: 80000,
              likes_count: 500000,
              video_count: 45
            }
          }
        }
      });

      // 2. Video list
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            videos: [
              {
                id: 'video-tt-1',
                title: 'Viral TikTok dance video',
                create_time: 1785000000,
                view_count: 65000,
                like_count: 8000,
                comment_count: 500,
                share_count: 900
              }
            ]
          }
        }
      });

      const syncResult = await TikTokService.syncTikTokData('inf-123', 'tt_token_abc', 'tt-user-999');

      expect(syncResult.success).toBe(true);
      expect(syncResult.username).toBe('TikTokCreatorBR');
      expect(syncResult.followers).toBe(80000);
      expect(syncResult.avgViews).toBe(65000);
      expect(prisma.influencerProfile.update).toHaveBeenCalled();
      expect(prisma.metricSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            influencerId: 'inf-123',
            provider: 'TIKTOK',
            followers: 80000,
            avgViews: 65000,
            integrityHash: expect.any(String)
          })
        })
      );
    });
  });

  describe('AuditorService (SHA-256 e Multiprovedor)', () => {
    it('deve persistir snapshot com hash SHA-256 para INSTAGRAM e recalcular InfluScore', async () => {
      const snapshot = await AuditorService.syncMetrics('inf-123', 'INSTAGRAM', {
        followers: 25000,
        engagementRate: 4.5,
        reachLast30Days: 45000,
        avgViews: 12000
      });

      expect(snapshot.provider).toBe('INSTAGRAM');
      expect(snapshot.integrityHash).toBeDefined();
      expect(snapshot.integrityHash.length).toBe(64); // SHA-256 hex string length
      expect(ScoringService.calculateAndPersist).toHaveBeenCalledWith('inf-123');
    });

    it('deve persistir snapshot com hash SHA-256 para TIKTOK e recalcular InfluScore', async () => {
      const snapshot = await AuditorService.syncMetrics('inf-123', 'TIKTOK', {
        followers: 120000,
        engagementRate: 6.8,
        reachLast30Days: 180000,
        avgViews: 45000
      });

      expect(snapshot.provider).toBe('TIKTOK');
      expect(snapshot.integrityHash).toBeDefined();
      expect(snapshot.integrityHash.length).toBe(64);
      expect(ScoringService.calculateAndPersist).toHaveBeenCalledWith('inf-123');
    });
  });
});
