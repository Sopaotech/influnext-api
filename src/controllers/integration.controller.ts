import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { UserRole } from '../types/roles';
import { ScoringService } from '../services/scoring.service';
import { InstagramService } from '../services/instagram.service';
import { AIService } from '../services/ai.service';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const getFrontendUrl = (req?: Request) => {
  const origin = req?.headers.origin as string;
  if (origin) return origin.endsWith('/') ? origin.slice(0, -1) : origin;
  
  const referer = req?.headers.referer as string;
  if (referer) {
    try {
      const parsed = new URL(referer);
      return parsed.origin;
    } catch (_) {}
  }
  
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
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_me';
    
    // Gerar states assinados e temporários (JWT de 1 hora de validade) para prevenir CSRF e manipulação de ID
    const stateBasic = jwt.sign({ userId, from: from || '', isBusiness: false }, jwtSecret, { expiresIn: '1h' });
    const stateBusiness = jwt.sign({ userId, from: from || '', isBusiness: true }, jwtSecret, { expiresIn: '1h' });
    const stateTiktok = jwt.sign({ userId, from: from || '' }, jwtSecret, { expiresIn: '1h' });
    
    const scopes = [
      'instagram_basic',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
      'public_profile'
    ].join(',');

    const instagramUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_BASIC_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${getFrontendUrl(req)}/auth/callback/instagram&scope=user_profile,user_media&response_type=code&state=${stateBasic}`;
    
    const instagramBusinessUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${getFrontendUrl(req)}/auth/callback/instagram&scope=${scopes}&response_type=code&state=${stateBusiness}`;

    const tiktokUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list,video.stats&response_type=code&redirect_uri=${getFrontendUrl(req)}/auth/callback/tiktok&state=${stateTiktok}`;

    res.json({
      instagram: instagramUrl,
      instagram_business: instagramBusinessUrl,
      tiktok: tiktokUrl,
      youtube: '#'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar URLs de conexão' });
  }
};

export const handleInstagramCallback = async (req: Request, res: Response): Promise<void> => {
  let stateStr = '';
  let isFromOnboarding = false;
  try {
    const { code, state } = req.query;
    stateStr = state as string;

    if (!code || !stateStr) {
      res.redirect(`${getFrontendUrl(req)}/dashboard/settings?status=error&error=invalid_params`);
      return;
    }

    // Validar o state JWT para evitar ataques CSRF ou de manipulação de ID
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_me';
    let decodedState: { userId: string; from?: string; isBusiness?: boolean };
    try {
      decodedState = jwt.verify(stateStr, jwtSecret) as { userId: string; from?: string; isBusiness?: boolean };
    } catch (jwtErr) {
      console.error('[INSTAGRAM] Erro ao validar JWT do state:', jwtErr);
      res.redirect(`${getFrontendUrl(req)}/dashboard/settings?status=error&error=invalid_state`);
      return;
    }

    const userId = decodedState.userId;
    const isBusiness = !!decodedState.isBusiness;
    isFromOnboarding = decodedState.from === 'onboarding';

    let accessToken = '';
    let instagramBusinessId = null;
    let instagramUsername = null;
    let instagramFollowers = 0;
    let instagramProfilePicture = null;
    let expiresAt: Date | null = null;

    if (isBusiness) {
      // 1. Short-Lived Access Token
      const tokenResponse = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
        params: {
          client_id: process.env.INSTAGRAM_CLIENT_ID,
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          redirect_uri: `${getFrontendUrl(req)}/auth/callback/instagram`,
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

      accessToken = longLivedResponse.data.access_token;
      const expiresIn = longLivedResponse.data.expires_in || 5184000;
      expiresAt = new Date(Date.now() + expiresIn * 1000);

      // 3. Buscar Páginas e IDs do Instagram Business
      const pagesResponse = await axios.get('https://graph.facebook.com/v20.0/me/accounts', {
        params: { access_token: accessToken }
      });

      const pages = pagesResponse.data.data;

      if (pages && pages.length > 0) {
        for (const page of pages) {
          const igResponse = await axios.get(`https://graph.facebook.com/v20.0/${page.id}`, {
            params: {
              fields: 'instagram_business_account{id,username}',
              access_token: accessToken
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
        throw new Error('Nenhuma conta comercial do Instagram vinculada à página do Facebook foi encontrada.');
      }

      // Buscar dados reais do perfil Instagram
      try {
        const detailsResponse = await axios.get(`https://graph.facebook.com/v20.0/${instagramBusinessId}`, {
          params: {
            fields: 'followers_count,profile_picture_url',
            access_token: accessToken
          }
        });
        instagramFollowers = detailsResponse.data.followers_count || 0;
        instagramProfilePicture = detailsResponse.data.profile_picture_url || null;
      } catch (err) {
        console.warn('[INSTAGRAM] Falha ao buscar detalhes adicionais do perfil', err);
      }
    } else {
      // Instagram Basic Display API Flow
      const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
        client_id: process.env.INSTAGRAM_BASIC_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_BASIC_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: `${getFrontendUrl(req)}/auth/callback/instagram`,
        code: code as string
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const shortLivedToken = tokenResponse.data.access_token;

      try {
        const longLivedResponse = await axios.get('https://graph.instagram.com/access_token', {
          params: {
            grant_type: 'ig_exchange_token',
            client_secret: process.env.INSTAGRAM_BASIC_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET!,
            access_token: shortLivedToken
          }
        });
        accessToken = longLivedResponse.data.access_token || shortLivedToken;
        const expiresIn = longLivedResponse.data.expires_in || 5184000;
        expiresAt = new Date(Date.now() + expiresIn * 1000);
      } catch (longLivedErr) {
        console.warn('[INSTAGRAM BASIC] Erro ao obter long-lived token, usando token curto.', longLivedErr);
        accessToken = shortLivedToken;
        expiresAt = new Date(Date.now() + 2 * 3600 * 1000); // fallback de 2 horas para token curto
      }

      const profileResponse = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username,account_type',
          access_token: accessToken
        }
      });

      instagramBusinessId = profileResponse.data.id;
      instagramUsername = profileResponse.data.username;
      instagramFollowers = 0; // Preenchido no onboarding/simulação
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
          accessToken: accessToken,
          expiresAt: expiresAt,
          isActive: true
        },
        update: {
          platformId: instagramBusinessId,
          username: instagramUsername,
          profilePicture: instagramProfilePicture,
          followersCount: instagramFollowers,
          accessToken: accessToken,
          expiresAt: expiresAt,
          isActive: true
        }
      });
      
      await prisma.influencerProfile.update({
        where: { id: influencer.id },
        data: { verifiedMetrics: true }
      });
      
      if (isBusiness) {
        InstagramService.syncInstagramData(influencer.id, accessToken, instagramBusinessId).catch(err => {
          console.error('[INSTAGRAM] Falha na sincronização de dados reais pós-callback:', err);
        });
      }
    }
    
    const redirectUrl = isFromOnboarding
      ? `${getFrontendUrl(req)}/onboarding?status=success&platform=instagram`
      : `${getFrontendUrl(req)}/dashboard/settings?status=success&platform=instagram`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[INSTAGRAM] Erro no callback:', error.response?.data || error.message);
    
    let errorType = 'error';
    if (error.message && (error.message.includes('Facebook') || error.message.includes('Página') || error.message.includes('comercial'))) {
      errorType = 'no_business_account';
    }
    
    const redirectUrl = isFromOnboarding
      ? `${getFrontendUrl(req)}/onboarding?status=error&error=${errorType}`
      : `${getFrontendUrl(req)}/dashboard/settings?status=error&error=${errorType}`;
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

    const platform = (req.body.platform || 'INSTAGRAM').toUpperCase();
    const inputUsername = req.body.username || influencer.handle || `influencer_${influencer.id.substring(0, 5)}`;
    const username = inputUsername.startsWith('@') ? inputUsername.slice(1) : inputUsername;

    let followersCount = 15430;
    let engagementRate = 4.75;
    let avgViews = 9230;
    let reachLast30Days = 48900;
    let profilePicture = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80';

    if (platform === 'TIKTOK') {
      followersCount = 32800;
      engagementRate = 8.2;
      avgViews = 18400;
      reachLast30Days = 110200;
      profilePicture = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80';
    } else if (platform === 'YOUTUBE') {
      followersCount = 8500;
      engagementRate = 6.1;
      avgViews = 4500;
      reachLast30Days = 24000;
      profilePicture = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&q=80';
    }

    const platformId = `simulated_${platform.toLowerCase()}_${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Criar ou atualizar a SocialPlatform
    await prisma.socialPlatform.upsert({
      where: {
        influencerId_platformName: {
          influencerId: influencer.id,
          platformName: platform
        }
      },
      create: {
        influencerId: influencer.id,
        platformName: platform,
        platformId,
        username,
        profilePicture,
        followersCount,
        accessToken: `simulated_access_token_${platform.toLowerCase()}`,
        isActive: true
      },
      update: {
        platformId,
        username,
        profilePicture,
        followersCount,
        accessToken: `simulated_access_token_${platform.toLowerCase()}`,
        isActive: true
      }
    });

    // 2. Criar MetricSnapshot realista
    await prisma.metricSnapshot.create({
      data: {
        influencerId: influencer.id,
        provider: platform,
        followers: followersCount,
        engagementRate,
        reachLast30Days,
        avgViews,
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

    // 5. Gerar análise proativa e de onboarding da IA de forma assíncrona
    AIService.generateWeeklyAnalysis(influencer.id).catch((err) => {
      console.error('[SIMULATE] Erro ao disparar análise pós-conexão simulada:', err);
    });

    res.json({
      success: true,
      onboardingCompleted: true,
      platform,
      username,
      followersCount
    });
  } catch (error) {
    console.error('[SIMULATE] Erro ao simular conexão:', error);
    res.status(500).json({ error: 'Erro ao simular conexão com a plataforma social.' });
  }
};

export const handleTikTokCallback = async (req: Request, res: Response): Promise<void> => {
  let stateStr = '';
  let isFromOnboarding = false;
  try {
    const { code, state } = req.query;
    stateStr = state as string;

    if (!code || !stateStr) {
      res.redirect(`${getFrontendUrl(req)}/dashboard/settings?status=error&error=invalid_params`);
      return;
    }

    // Validar o state JWT para evitar ataques CSRF ou de manipulação de ID
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_me';
    let decodedState: { userId: string; from?: string };
    try {
      decodedState = jwt.verify(stateStr, jwtSecret) as { userId: string; from?: string };
    } catch (jwtErr) {
      console.error('[TIKTOK] Erro ao validar JWT do state:', jwtErr);
      res.redirect(`${getFrontendUrl(req)}/dashboard/settings?status=error&error=invalid_state`);
      return;
    }

    const userId = decodedState.userId;
    isFromOnboarding = decodedState.from === 'onboarding';

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

      const { access_token, expires_in, refresh_token, open_id } = tokenResponse.data;

      // Calcular expiração do token (default de 24 horas)
      const ttExpiresIn = expires_in || 86400;
      const ttExpiresAt = new Date(Date.now() + ttExpiresIn * 1000);

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
          refreshToken: refresh_token || null,
          expiresAt: ttExpiresAt,
          isActive: true
        },
        update: {
          platformId: open_id,
          username: tiktokUsername,
          profilePicture: tiktokAvatar,
          followersCount: tiktokFollowers,
          accessToken: access_token,
          refreshToken: refresh_token || null,
          expiresAt: ttExpiresAt,
          isActive: true
        }
      });

      await ScoringService.calculateAndPersist(influencer.id);
    }
    
    const redirectUrl = isFromOnboarding
      ? `${getFrontendUrl(req)}/onboarding?status=success&platform=tiktok`
      : `${getFrontendUrl(req)}/dashboard/settings?status=success&platform=tiktok`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('[TIKTOK] Erro no callback:', error);
    const redirectUrl = isFromOnboarding
      ? `${getFrontendUrl(req)}/onboarding?status=error`
      : `${getFrontendUrl(req)}/dashboard/settings?status=error`;
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
          await InstagramService.syncInstagramData(influencer.id, platform.accessToken, platform.platformId);
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
      // Retorna array vazio em vez de 404 para contas que não são influenciadores (como Admin ou Company)
      res.json({ platforms: [] });
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

export const triggerTokenRenewalDebug = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[DEBUG] Executando renovação de tokens manual via admin...');
    const { runTokenRenewalLogic } = await import('../workers/token-renewal.worker');
    await runTokenRenewalLogic();
    res.json({ success: true, message: 'Processo de renovação executado com sucesso. Verifique os logs do console para mais detalhes.' });
  } catch (error: any) {
    console.error('[DEBUG] Erro na renovação de tokens:', error);
    res.status(500).json({ error: 'Erro ao executar o processo de renovação de tokens.', details: error.message });
  }
};