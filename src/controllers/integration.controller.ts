import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { UserRole } from '../types/roles';
import { ScoringService } from '../services/scoring.service';
import { InstagramService } from '../services/instagram.service';
import { AIService } from '../services/ai.service';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { seedDemo } from '../scripts/seed-demo';

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
 * GET /v1/integrations/urls
 * Retorna URLs de autorizacão OAuth para Instagram (Creator API) e TikTok.
 *
 * ATUALIZADO (julho/2026): Usa Instagram API with Instagram Login.
 * Não requer mais Página do Facebook. Funciona com contas Creator e Business diretas.
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

    // State JWT assinado (1h) — previne ataques CSRF
    const stateInstagram = jwt.sign({ userId, from: from || '' }, jwtSecret, { expiresIn: '1h' });
    const stateTiktok = jwt.sign({ userId, from: from || '' }, jwtSecret, { expiresIn: '1h' });

    // Instagram API with Instagram Login
    // Escopo: instagram_business_basic (leitura de perfil + mídia)
    const instagramRedirectUri = `${getFrontendUrl(req)}/auth/callback/instagram`;
    const instagramUrl = `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(instagramRedirectUri)}&scope=instagram_business_basic&response_type=code&state=${stateInstagram}`;

    const tiktokUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list,video.stats&response_type=code&redirect_uri=${getFrontendUrl(req)}/auth/callback/tiktok&state=${stateTiktok}`;

    res.json({
      instagram: instagramUrl,
      // authUrl: alias para o modal de onboarding do frontend
      authUrl: instagramUrl,
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
    let decodedState: { userId: string; from?: string };
    try {
      decodedState = jwt.verify(stateStr, jwtSecret) as { userId: string; from?: string };
    } catch (jwtErr) {
      console.error('[INSTAGRAM] Erro ao validar JWT do state:', jwtErr);
      res.redirect(`${getFrontendUrl(req)}/dashboard/settings?status=error&error=invalid_state`);
      return;
    }

    const userId = decodedState.userId;
    isFromOnboarding = decodedState.from === 'onboarding';

    let accessToken = '';
    let instagramBusinessId = null;
    let instagramUsername = null;
    let instagramFollowers = 0;
    let instagramProfilePicture = null;
    let expiresAt: Date | null = null;

    // Instagram API with Instagram Login — fluxo unificado (Creator/Business)
    // Não usa mais isBusiness — todas as contas profissionais usam o mesmo fluxo
    const tokenResponse = await InstagramService.exchangeCodeForToken(
      code as string,
      `${getFrontendUrl(req)}/auth/callback/instagram`
    );

    accessToken = tokenResponse.accessToken;
    const expiresIn = tokenResponse.expiresIn || 5184000;
    expiresAt = new Date(Date.now() + expiresIn * 1000);
    instagramBusinessId = tokenResponse.platformId; // ID do usuário Instagram (Creator)

    // Buscar dados do perfil diretamente via Instagram Creator API
    try {
      const profileData = await InstagramService.fetchProfileData(accessToken);
      instagramUsername = profileData.username;
      instagramFollowers = profileData.followers_count || 0;
      instagramProfilePicture = profileData.profile_picture_url || null;
    } catch (profileErr) {
      console.warn('[INSTAGRAM] Falha ao buscar detalhes do perfil:', profileErr);
      instagramUsername = null;
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

      // Sempre dispara a sincronização de métricas para contas Creator e Business
      InstagramService.syncInstagramData(influencer.id, accessToken, instagramBusinessId).catch(err => {
        console.error('[INSTAGRAM] Falha na sincronização de dados pós-callback:', err);
      });
    }
    
    const redirectUrl = isFromOnboarding
      ? `${getFrontendUrl(req)}/onboarding?status=success&platform=instagram`
      : `${getFrontendUrl(req)}/dashboard/settings?status=success&platform=instagram`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[INSTAGRAM] Erro no callback:', error.response?.data || error.message);
    
    let errorType = 'error';
    if (error.message && (error.message.includes('Creator') || error.message.includes('Business') || error.message.includes('profissional'))) {
      errorType = 'no_creator_account';
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
    const range = req.body.followersRange || '10k-50k';

    let followersCount = 15430;
    let engagementRate = 4.75;
    let avgViews = 9230;
    let reachLast30Days = 48900;
    let profilePicture = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop';

    if (platform === 'INSTAGRAM') {
      if (range === '50k-100k') {
        followersCount = 72500;
        engagementRate = 3.8;
        avgViews = 38400;
        reachLast30Days = 210000;
      } else if (range === '100k-500k') {
        followersCount = 284000;
        engagementRate = 2.9;
        avgViews = 124000;
        reachLast30Days = 850000;
      } else if (range === '500k+') {
        followersCount = 1250000;
        engagementRate = 2.1;
        avgViews = 450000;
        reachLast30Days = 3400000;
      }
    }

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

    // Gerar posts e insights simulados de acordo com o nicho do influenciador
    const sumLikes = Math.round(followersCount * (engagementRate / 100) * 0.85);
    const sumComments = Math.round(followersCount * (engagementRate / 100) * 0.15);
    const totalSaved = Math.round(followersCount * 0.02);
    const totalShares = Math.round(followersCount * 0.03);
    const postCount = 6;

    const mockCaptions = [
      `🚀 Novo projeto no ar! Focado em escala, design e inovação. O que acharam? #niche #branding`,
      `☕ Bastidores de um dia produtivo. Planejamento estratégico e foco total no objetivo da semana.`,
      `✨ Sempre buscando a excelência. Nova parceria incrível chegando, fiquem ligados! 💥`,
      `💡 Dica de ouro para o seu dia: mantenha a consistência, os resultados virão a longo prazo.`,
      `🔥 Conexão com o público é o ativo mais valioso de qualquer marca. Concordam?`,
      `🎯 Novo setup montado! Pronto para levar a produção de conteúdo para o próximo nível.`
    ];

    const postsWithInsights = mockCaptions.map((caption, index) => {
      const isVideo = index % 2 === 0;
      const likes = Math.round((sumLikes / postCount) * (0.8 + Math.random() * 0.4));
      const comments = Math.round((sumComments / postCount) * (0.8 + Math.random() * 0.4));
      const reach = Math.round(followersCount * (0.3 + Math.random() * 0.4));
      const saved = Math.round(likes * 0.15);
      const shares = Math.round(likes * 0.1);

      return {
        id: `sim_media_${platform.toLowerCase()}_${index}_${Math.floor(Math.random() * 100000)}`,
        caption,
        mediaType: isVideo ? 'VIDEO' : 'IMAGE',
        mediaUrl: isVideo 
          ? 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=500&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop',
        permalink: 'https://instagram.com',
        likeCount: likes,
        commentCount: comments,
        plays: isVideo ? Math.round(reach * 1.2) : 0,
        impressions: !isVideo ? Math.round(reach * 1.1) : 0,
        reach,
        saved,
        shares,
        timestamp: new Date(Date.now() - index * 24 * 3600 * 1000).toISOString()
      };
    });

    const insightsJson = {
      followers: followersCount,
      avgViews,
      engagementRate,
      reachLast30Days,
      avgLikes: Math.round(sumLikes / postCount),
      avgComments: Math.round(sumComments / postCount),
      avgShares: Math.round(totalShares / postCount),
      avgSaves: Math.round(totalSaved / postCount),
      updatedAt: new Date().toISOString()
    };

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

    // 3. Atualizar verifiedMetrics, insights, topPosts, handle e completar onboarding
    await prisma.influencerProfile.update({
      where: { id: influencer.id },
      data: { 
        verifiedMetrics: true,
        insights: JSON.stringify(insightsJson),
        topPosts: JSON.stringify(postsWithInsights),
        profileImageUrl: profilePicture,
        handle: username
      }
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

    console.log('[DEBUG] Resetando banco de dados com seed do demo...');
    await seedDemo();

    res.json({ success: true, message: 'Simulação reiniciada e dados semeados com sucesso!' });
  } catch (error: any) {
    console.error('[DEBUG] Erro na renovação e reset:', error);
    res.status(500).json({ error: 'Erro ao executar o processo de reinicialização da simulação.', details: error.message });
  }
};

export const simulateFlowStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { step, username } = req.body;
    const influencerEmail = 'influencer@demo.influnext.com.br';
    const companyEmail = 'empresa@demo.influnext.com.br';

    // Buscar Usuário Influencer Demo
    const influencerUser = await prisma.user.findUnique({
      where: { email: influencerEmail },
      include: { influencer: true }
    });

    if (!influencerUser || !influencerUser.influencer) {
      res.status(404).json({ error: 'Usuário influenciador demo não encontrado. Execute o seed primeiro.' });
      return;
    }

    const influencer = influencerUser.influencer;

    // Buscar Usuário Empresa Demo
    const companyUser = await prisma.user.findUnique({
      where: { email: companyEmail },
      include: { company: true }
    });

    if (!companyUser || !companyUser.company) {
      res.status(404).json({ error: 'Usuário empresa demo não encontrado. Execute o seed primeiro.' });
      return;
    }

    const company = companyUser.company;

    if (step === 1) {
      // --- PASSO 1: Onboarding & Conexão Instagram ---
      const handle = username || influencer.handle || 'demo.influencer';
      const cleanHandle = handle.replace('@', '');
      const followers = 24800;
      const engagement = 5.24;
      const avgViews = 14200;
      const reachLast30Days = 85600;
      const profilePicture = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop';

      // 1. Criar posts e insights realistas
      const sumLikes = Math.round(followers * (engagement / 100) * 0.85);
      const sumComments = Math.round(followers * (engagement / 100) * 0.15);
      const totalSaved = Math.round(followers * 0.02);
      const totalShares = Math.round(followers * 0.03);
      const postCount = 6;

      const mockCaptions = [
        `🔥 Lançamento do novo setup com foco em performance e criação de conteúdo. O que acharam?`,
        `☕ Café da manhã com foco em metas e organização de projetos para 2026. #growth`,
        `✨ Sempre grata por parcerias autênticas que acreditam na minha verdade.`,
        `💡 Lembrete do dia: a consistência vence o talento quando o talento não tem consistência.`,
        `🚀 Um dia incrível gravando bastidores para o canal. Vem novidade aí!`,
        `🎯 Foco nos entregáveis da semana e parcerias estratégicas no ar.`
      ];

      const postsWithInsights = mockCaptions.map((caption, index) => {
        const isVideo = index % 2 === 0;
        const likes = Math.round((sumLikes / postCount) * (0.8 + Math.random() * 0.4));
        const comments = Math.round((sumComments / postCount) * (0.8 + Math.random() * 0.4));
        const reach = Math.round(followers * (0.3 + Math.random() * 0.4));
        const saved = Math.round(likes * 0.15);
        const shares = Math.round(likes * 0.1);

        return {
          id: `sim_media_instagram_${index}_${Math.floor(Math.random() * 100000)}`,
          caption,
          mediaType: isVideo ? 'VIDEO' : 'IMAGE',
          mediaUrl: isVideo 
            ? 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=500&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop',
          permalink: 'https://instagram.com',
          likeCount: likes,
          commentCount: comments,
          plays: isVideo ? Math.round(reach * 1.2) : 0,
          impressions: !isVideo ? Math.round(reach * 1.1) : 0,
          reach,
          saved,
          shares,
          timestamp: new Date(Date.now() - index * 24 * 3600 * 1000).toISOString()
        };
      });

      const insightsJson = {
        followers,
        avgViews,
        engagementRate: engagement,
        reachLast30Days,
        avgLikes: Math.round(sumLikes / postCount),
        avgComments: Math.round(sumComments / postCount),
        avgShares: Math.round(totalShares / postCount),
        avgSaves: Math.round(totalSaved / postCount),
        updatedAt: new Date().toISOString()
      };

      // 2. Atualizar perfil e conectar plataforma social
      await prisma.$transaction([
        prisma.socialPlatform.upsert({
          where: { influencerId_platformName: { influencerId: influencer.id, platformName: 'INSTAGRAM' } },
          create: {
            influencerId: influencer.id,
            platformName: 'INSTAGRAM',
            platformId: `simulated_instagram_${influencer.id.substring(0, 5)}`,
            username: cleanHandle,
            profilePicture,
            followersCount: followers,
            accessToken: 'simulated_access_token_demo',
            isActive: true
          },
          update: {
            username: cleanHandle,
            profilePicture,
            followersCount: followers,
            isActive: true
          }
        }),
        prisma.metricSnapshot.create({
          data: {
            influencerId: influencer.id,
            provider: 'INSTAGRAM',
            followers,
            engagementRate: engagement,
            reachLast30Days,
            avgViews,
            integrityHash: `simulated_hash_${Math.random().toString(36).substring(7)}`
          }
        }),
        prisma.influencerProfile.update({
          where: { id: influencer.id },
          data: {
            verifiedMetrics: true,
            insights: JSON.stringify(insightsJson),
            topPosts: JSON.stringify(postsWithInsights),
            profileImageUrl: profilePicture,
            handle: cleanHandle,
            niche: 'Fashion & Lifestyle',
            bio: 'Criadora de conteúdo premium — parceira de marcas que buscam engajamento real.'
          }
        }),
        prisma.user.update({
          where: { id: influencerUser.id },
          data: { onboardingCompleted: true }
        })
      ]);

      // 3. Recalcular InfluScore
      await ScoringService.calculateAndPersist(influencer.id);

      const updatedProfile = await prisma.influencerProfile.findUnique({
        where: { id: influencer.id }
      });

      res.json({
        success: true,
        message: 'Instagram vinculado com sucesso!',
        data: {
          followers,
          engagementRate: engagement,
          influScore: updatedProfile?.influScore,
          scoreClass: updatedProfile?.scoreClass,
          username: cleanHandle
        }
      });
      return;
    }

    if (step === 2) {
      // --- PASSO 2: AI Weekly Strategy Content ---
      // Forçar a geração de uma nova análise estratégica da IA
      const analysis = await AIService.generateWeeklyAnalysis(influencer.id);
      res.json({
        success: true,
        message: 'Análise de Inteligência Artificial gerada!',
        data: {
          analysisText: analysis?.analysisText || 'Estratégia não disponível.',
          recommendations: analysis?.recommendations || '[]'
        }
      });
      return;
    }

    if (step === 3) {
      // --- PASSO 3: Criar Proposta de Contrato ---
      // Limpar propostas em aberto anteriores do simulador para evitar lixo
      await prisma.contract.deleteMany({
        where: {
          companyId: company.id,
          influencerId: influencer.id,
          escrowStatus: { in: ['DRAFT', 'PENDING_PAYMENT', 'IN_PROGRESS', 'UNDER_REVIEW', 'CANCELED'] }
        }
      });

      const title = 'Campanha Outono Premium 2026';
      const briefing = 'Criação de 1 Reels demonstrando a qualidade do casaco corta-vento impermeável da nova coleção Outono/Inverno. Seguir a paleta de cores escuras e estética limpa.';
      const budget = 3500.00;
      const successFeeRate = 0.15; // 15% taxa
      const platformFee = budget * successFeeRate;
      const netAmount = budget - platformFee;

      const contract = await prisma.contract.create({
        data: {
          companyId: company.id,
          influencerId: influencer.id,
          title,
          briefing,
          budget,
          platformFee,
          netAmount,
          successFeeRate,
          escrowStatus: 'DRAFT',
          deliverables: {
            create: [
              {
                type: 'REELS',
                deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000),
                status: 'PENDING'
              }
            ]
          }
        },
        include: { deliverables: true }
      });

      res.json({
        success: true,
        message: 'Proposta de contrato criada pela Empresa!',
        data: contract
      });
      return;
    }

    if (step === 4) {
      // --- PASSO 4: Depósito em Escrow ---
      const contract = await prisma.contract.findFirst({
        where: {
          companyId: company.id,
          influencerId: influencer.id,
          escrowStatus: 'DRAFT'
        }
      });

      if (!contract) {
        res.status(404).json({ error: 'Nenhum contrato em DRAFT encontrado. Execute o passo anterior.' });
        return;
      }

      const updated = await prisma.contract.update({
        where: { id: contract.id },
        data: { 
          escrowStatus: 'IN_PROGRESS',
          externalTxId: `sim_tx_escrow_${Math.random().toString(36).substring(7)}`
        },
        include: { deliverables: true }
      });

      // Criar notificação para o influenciador
      await prisma.notification.create({
        data: {
          userId: influencerUser.id,
          message: `💰 O pagamento em Escrow foi confirmado para a campanha "${updated.title}"! Você já pode iniciar a produção.`,
          type: 'ESCROW_CONFIRMED'
        }
      });

      res.json({
        success: true,
        message: 'Depósito em Escrow confirmado! Recursos retidos na plataforma com segurança.',
        data: updated
      });
      return;
    }

    if (step === 5) {
      // --- PASSO 5: Submeter Peça & Auditoria IA ---
      const contract = await prisma.contract.findFirst({
        where: {
          companyId: company.id,
          influencerId: influencer.id,
          escrowStatus: 'IN_PROGRESS'
        },
        include: { deliverables: true }
      });

      if (!contract || contract.deliverables.length === 0) {
        res.status(404).json({ error: 'Nenhum contrato em progresso encontrado.' });
        return;
      }

      const deliverable = contract.deliverables[0];
      const proofUrl = 'https://www.instagram.com/reel/C_outono_premium_jaqueta';

      // Executar a auditoria real do Gemini
      const auditResult = await AIService.auditDeliverableLink(
        proofUrl,
        deliverable.type,
        contract.title,
        contract.briefing || undefined,
        contract.aiScript || undefined
      );

      // Atualiza entregável para UNDER_REVIEW com a prova
      const updatedDeliverable = await prisma.deliverable.update({
        where: { id: deliverable.id },
        data: {
          status: 'UNDER_REVIEW',
          proofUrl
        }
      });

      // Atualiza o contrato para UNDER_REVIEW
      await prisma.contract.update({
        where: { id: contract.id },
        data: { escrowStatus: 'UNDER_REVIEW' }
      });

      // Notificar empresa
      await prisma.notification.create({
        data: {
          userId: companyUser.id,
          message: `✨ Nova entrega submetida pelo influenciador. Auditoria da IA: ${auditResult.approved ? 'Aprovada' : 'Atenção Requerida'} (Nota: ${auditResult.confidenceScore}%).`,
          type: 'SUBMISSION_REVIEW'
        }
      });

      res.json({
        success: true,
        message: 'Entrega submetida com sucesso! A Inteligência Artificial auditou o link em tempo real.',
        data: {
          deliverable: updatedDeliverable,
          aiAudit: auditResult
        }
      });
      return;
    }

    if (step === 6) {
      // --- PASSO 6: Aprovação & Liberação de Saldo (Payout) ---
      const contract = await prisma.contract.findFirst({
        where: {
          companyId: company.id,
          influencerId: influencer.id,
          escrowStatus: 'UNDER_REVIEW'
        },
        include: { deliverables: true }
      });

      if (!contract || contract.deliverables.length === 0) {
        res.status(404).json({ error: 'Nenhum contrato em revisão encontrado.' });
        return;
      }

      const deliverable = contract.deliverables[0];

      // Aprovar via transação e liberar saldo na wallet do influenciador (contrato COMPLETED)
      const updated = await prisma.$transaction(async (tx) => {
        await tx.deliverable.update({
          where: { id: deliverable.id },
          data: { status: 'APPROVED' }
        });

        const updatedContract = await tx.contract.update({
          where: { id: contract.id },
          data: { 
            escrowStatus: 'COMPLETED',
            releaseTxId: `sim_payout_tx_${Math.random().toString(36).substring(7)}`
          },
          include: { deliverables: true }
        });

        // Notificar o influenciador
        await tx.notification.create({
          data: {
            userId: influencerUser.id,
            message: `🎉 Mapeamos que sua entrega do Reels foi aprovada pela marca. O saldo de R$ ${Number(contract.netAmount).toFixed(2)} já está disponível na sua carteira!`,
            type: 'PAYMENT_RELEASED'
          }
        });

        return updatedContract;
      });

      // Recalcular score para incluir bônus de contrato concluído
      await ScoringService.calculateAndPersist(influencer.id);

      res.json({
        success: true,
        message: 'Parabéns! Payout liberado com sucesso! Contrato finalizado.',
        data: updated
      });
      return;
    }

    res.status(400).json({ error: 'Etapa de simulação inválida.' });
  } catch (error: any) {
    console.error('[SIMULATE FLOW STEP] Erro na etapa:', error);
    res.status(500).json({ error: `Erro na execução da etapa: ${error.message}` });
  }
};