import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { UserRole } from '../types/roles';
import { ScoringService } from '../services/scoring.service';
import axios from 'axios';

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
    
    const scopes = [
      'instagram_basic',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
      'public_profile'
    ].join(',');

    const instagramUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_API_URL}/integrations/instagram/callback&scope=${scopes}&response_type=code&state=${userId}`;
    
    const tiktokUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list,video.stats&response_type=code&redirect_uri=${process.env.NEXT_PUBLIC_API_URL}/integrations/tiktok/callback&state=${userId}`;

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
  try {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code || !userId) {
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error&error=invalid_params`);
      return;
    }

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
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error&error=no_business_account`);
      return;
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
          accessToken: longLivedToken,
          isActive: true
        },
        update: {
          platformId: instagramBusinessId,
          username: instagramUsername,
          accessToken: longLivedToken,
          isActive: true
        }
      });
    }
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=success&platform=instagram`);
  } catch (error: any) {
    console.error('[INSTAGRAM] Erro no callback:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error`);
  }
};

export const handleTikTokCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code || !userId) {
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error&error=invalid_params`);
      return;
    }

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
          username: `${influencer.handle}_tt`,
          accessToken: access_token,
          isActive: true
        },
        update: {
          platformId: open_id,
          accessToken: access_token,
          isActive: true
        }
      });

      await ScoringService.calculateAndPersist(influencer.id);
    }
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=success&platform=tiktok`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error`);
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