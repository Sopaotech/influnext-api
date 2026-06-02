import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { UserRole } from '../types/roles';
import { ScoringService } from '../services/scoring.service';
import axios from 'axios';

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://influnext.com.br';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

/**
 * Especialista: Implementação Robusta do Instagram Graph API (Business Login)
 * Suporte a Long-Lived Tokens e descoberta de conta via Página.
 */

export const getAuthUrls = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const from = req.query.from as string;
    const state = from === 'onboarding' ? `${userId}_onboarding` : userId;
    
    const scopes = [
      'instagram_basic',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
      'public_profile'
    ].join(',');

    const instagramUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${getFrontendUrl()}/auth/callback/instagram&scope=${scopes}&response_type=code&state=${state}`;
    
    const tiktokUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list,video.stats&response_type=code&redirect_uri=${getFrontendUrl()}/auth/callback/tiktok&state=${state}`;

    res.json({
      instagram: instagramUrl,
      tiktok: tiktokUrl,
      youtube: '#'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar URLs de conexão' });
  }
};

export const handleInstagramCallback = async (req: Request, res: Response): Promise<void> => {
  let stateStr = '';
  try {
    const { code, state } = req.query;
    stateStr = state as string;

    if (!code || !stateStr) {
      res.redirect(`${getFrontendUrl()}/dashboard/settings?status=error&error=invalid_params`);
      return;
    }

    const isFromOnboarding = stateStr.endsWith('_onboarding');
    const userId = isFromOnboarding ? stateStr.replace('_onboarding', '') : stateStr;

    // 1. Short-Lived Access Token
    const tokenResponse = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
      params: {
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/integrations/instagram/callback`,
        code: code as string
      }
    });

    const shortLivedToken = tokenResponse.data.access_token;

    // 2. Long-Lived Access Token (60 dias)
    const longLivedResponse = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        fb_exchange_token: shortLivedToken
      }
    });

    const longLivedToken = longLivedResponse.data.access_token;

    // 3. Buscar Páginas e IDs do Instagram Business
    const pagesResponse = await axios.get('https://graph.facebook.com/v20.0/me/accounts', {
      params: { access_token: longLivedToken }
    });

    const pages = pagesResponse.data.data;
    let instagramBusinessId = null;
    let instagramUsername = null;

    if (pages && pages.length > 0) {
      for (const page of pages) {
        const igResponse = await axios.get(`https://graph.facebook.com/v20.0/${page.id}`, {
          params: {
            fields: 'instagram_business_account{id,username}',
            access_token: longLivedToken
          }
        });

        if (igResponse.data.instagram_business_account) {
          instagramBusinessId = igResponse.data.instagram_business_account.id;
          instagramUsername = igResponse.data.instagram_business_account.username;
          break;
        }
      }
    }

    if (!instagramBusinessId) {
      const redirectUrl = isFromOnboarding
        ? `${getFrontendUrl()}/onboarding?status=error&error=no_business_account`
        : `${getFrontendUrl()}/dashboard/settings?status=error&error=no_business_account`;
      res.redirect(redirectUrl);
      return;
    }

    let instagramFollowers = 0;
    let instagramProfilePicture = null;

    if (instagramBusinessId) {
      try {
        const detailsResponse = await axios.get(`https://graph.facebook.com/v20.0/${instagramBusinessId}`, {
          params: {
            fields: 'followers_count,profile_picture_url,username',
            access_token: longLivedToken
          }
        });
        instagramFollowers = detailsResponse.data.followers_count || 0;
        instagramProfilePicture = detailsResponse.data.profile_picture_url || null;
      } catch (err) {
        console.warn('[INSTAGRAM] Falha ao buscar detalhes adicionais do perfil', err);
      }
    }

    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });

    if (influencer) {
      await prisma.socialPlatform.upsert({
        where: {
          influencerId_platformName: {
            influencerId: influencer.id,
            platformName: 'INSTAGRAM'
          }
        },
        create: {
          influencerId: influencer.id,
          platformName: 'INSTAGRAM',
          platformId: instagramBusinessId,
          username: instagramUsername,
          profilePicture: instagramProfilePicture,
          followersCount: instagramFollowers,
          accessToken: longLivedToken,
          isActive: true
        },
        update: {
          platformId: instagramBusinessId,
          username: instagramUsername,
          profilePicture: instagramProfilePicture,
          followersCount: instagramFollowers,
          accessToken: longLivedToken,
          isActive: true
        }
      });
      
      await prisma.influencerProfile.update({
        where: { id: influencer.id },
        data: { verifiedMetrics: true }
      });
      
      await ScoringService.calculateAndPersist(influencer.id);
    }
    
    const redirectUrl = isFromOnboarding
      ? `${getFrontendUrl()}/onboarding?status=success&platform=instagram`
      : `${getFrontendUrl()}/dashboard/settings?status=success&platform=instagram`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[INSTAGRAM] Erro no callback:', error.response?.data || error.message);
    const isFromOnboarding = stateStr.endsWith('_onboarding');
    const redirectUrl = isFromOnboarding
      ? `${getFrontendUrl()}/onboarding?status=error`
      : `${getFrontendUrl()}/dashboard/settings?status=error`;
    res.redirect(redirectUrl);
  }
};

export const simulateInstagramConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const influencer = await prisma.influencerProfile.findUnique({
      where: { userId }
    });

    if (!influencer) {
      res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
      return;
    }

    // 1. Criar ou atualizar a SocialPlatform para o Instagram
    const platformId = `simulated_ig_${Math.floor(100000 + Math.random() * 900000)}`;
    const username = influencer.handle || `influencer_${influencer.id.substring(0, 5)}`;
    const followersCount = 15430;
    const profilePicture = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80';

    await prisma.socialPlatform.upsert({
      where: {
        influencerId_platformName: {
          influencerId: influencer.id,
          platformName: 'INSTAGRAM'
        }
      },
      create: {
        influencerId: influencer.id,
        platformName: 'INSTAGRAM',
        platformId,
        username,
        profilePicture,
        followersCount,
        accessToken: 'simulated_access_token_token',
        isActive: true
      },
      update: {
        platformId,
        username,
        profilePicture,
        followersCount,
        accessToken: 'simulated_access_token_token',
        isActive: true
      }
    });

    // 2. Criar MetricSnapshot realista
    await prisma.metricSnapshot.create({
      data: {
        influencerId: influencer.id,
        provider: 'INSTAGRAM',
        followers: followersCount,
        engagementRate: 4.75,
        reachLast30Days: 48900,
        avgViews: 9230,
        integrityHash: `simulated_hash_${Math.random().toString(36).substring(7)}`
      }
    });

    // 3. Atualizar verifiedMetrics e completar onboarding
    await prisma.influencerProfile.update({
      where: { id: influencer.id },
      data: { verifiedMetrics: true }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true }
    });

    // 4. Recalcular e persistir score
    await ScoringService.calculateAndPersist(influencer.id);

    res.json({
      success: true,
      onboardingCompleted: true,
      platform: 'INSTAGRAM'
    });
  } catch (error) {
    console.error('[SIMULATE] Erro ao simular conexão:', error);
    res.status(500).json({ error: 'Erro ao simular conexão com o Instagram.' });
  }
};

export const handleTikTokCallback = async (req: Request, res: Response): Promise<void> => {
  let stateStr = '';
  try {
    const { code, state } = req.query;
    stateStr = state as string;

    if (!code || !stateStr) {
      res.redirect(`${getFrontendUrl()}/dashboard/settings?status=error&error=invalid_params`);
      return;
    }

    const isFromOnboarding = stateStr.endsWith('_onboarding');
    const userId = isFromOnboarding ? stateStr.replace('_onboarding', '') : stateStr;

    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });

    if (influencer) {
      const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', 
        new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/integrations/tiktok/callback`,
        }).toString(), 
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const { access_token, open_id } = tokenResponse.data;

      // Buscar dados reais do perfil TikTok
      let tiktokUsername = `${influencer.handle}_tt`;
      let tiktokFollowers = 0;
      let tiktokAvatar: string | null = null;

      try {
        const profileResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
          params: { fields: 'open_id,display_name,avatar_url,follower_count' },
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const profileData = profileResponse.data?.data?.user;
        if (profileData) {
          tiktokUsername = profileData.display_name || tiktokUsername;
          tiktokFollowers = profileData.follower_count || 0;
          tiktokAvatar = profileData.avatar_url || null;
        }
      } catch (err) {
        console.warn('[TIKTOK] Falha ao buscar perfil adicional, usando defaults.', err);
      }

      await prisma.socialPlatform.upsert({
        where: {
          influencerId_platformName: {
            influencerId: influencer.id,
            platformName: 'TIKTOK'
          }
        },
        create: {
          influencerId: influencer.id,
          platformName: 'TIKTOK',
          platformId: open_id,
          username: tiktokUsername,
          profilePicture: tiktokAvatar,
          followersCount: tiktokFollowers,
          accessToken: access_token,
          isActive: true
        },
        update: {
          platformId: open_id,
          username: tiktokUsername,
          profilePicture: tiktokAvatar,
          followersCount: tiktokFollowers,
          accessToken: access_token,
          isActive: true
        }
      });

      await ScoringService.calculateAndPersist(influencer.id);
    }
    
    const redirectUrl = isFromOnboarding
      ? `${getFrontendUrl()}/onboarding?status=success&platform=tiktok`
      : `${getFrontendUrl()}/dashboard/settings?status=success&platform=tiktok`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('[TIKTOK] Erro no callback:', error);
    const isFromOnboarding = stateStr.endsWith('_onboarding');
    const redirectUrl = isFromOnboarding
      ? `${getFrontendUrl()}/onboarding?status=error`
      : `${getFrontendUrl()}/dashboard/settings?status=error`;
    res.redirect(redirectUrl);
  }
};

/**
 * POST /integrations/sync-metrics
 * Re-sincroniza métricas de todas as plataformas conectadas (Instagram + TikTok)
 * Usar periodicamente ou sob demanda antes de uma apresentação.
 */
export const syncPlatformMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const influencer = await prisma.influencerProfile.findUnique({
      where: { userId },
      include: { platforms: { where: { isActive: true } } }
    });

    if (!influencer) {
      res.status(404).json({ error: 'Perfil não encontrado.' });
      return;
    }

    const results: Record<string, string> = {};

    for (const platform of influencer.platforms) {
      try {
        if (platform.platformName === 'INSTAGRAM' && platform.accessToken && platform.platformId) {
          const detailsResponse = await axios.get(`https://graph.facebook.com/v20.0/${platform.platformId}`, {
            params: {
              fields: 'followers_count,media_count,profile_picture_url,username',
              access_token: platform.accessToken
            }
          });

          await prisma.socialPlatform.update({
            where: { id: platform.id },
            data: {
              followersCount: detailsResponse.data.followers_count || platform.followersCount,
              profilePicture: detailsResponse.data.profile_picture_url || platform.profilePicture,
              username: detailsResponse.data.username || platform.username
            }
          });
          results['INSTAGRAM'] = 'synced';
        }

        if (platform.platformName === 'TIKTOK' && platform.accessToken) {
          const profileResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
            params: { fields: 'display_name,avatar_url,follower_count' },
            headers: { Authorization: `Bearer ${platform.accessToken}` }
          });
          const profileData = profileResponse.data?.data?.user;
          if (profileData) {
            await prisma.socialPlatform.update({
              where: { id: platform.id },
              data: {
                followersCount: profileData.follower_count || platform.followersCount,
                profilePicture: profileData.avatar_url || platform.profilePicture,
                username: profileData.display_name || platform.username
              }
            });
          }
          results['TIKTOK'] = 'synced';
        }
      } catch (err) {
        console.warn(`[SYNC] Falha ao sincronizar ${platform.platformName}:`, err);
        results[platform.platformName] = 'error';
      }
    }

    await ScoringService.calculateAndPersist(influencer.id);

    res.json({ synced: true, results });
  } catch (error) {
    console.error('[SYNC] Erro geral ao sincronizar métricas:', error);
    res.status(500).json({ error: 'Erro ao sincronizar métricas.' });
  }
};

export const getConnectedPlatforms = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const influencer = await prisma.influencerProfile.findUnique({
      where: { userId },
      include: { platforms: true }
    });

    if (!influencer) {
      res.status(404).json({ error: "Perfil não encontrado." });
      return;
    }

    const platformNames = influencer.platforms
      .filter(p => p.isActive)
      .map(p => p.platformName);

    res.json({ platforms: platformNames });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar plataformas." });
  }
};