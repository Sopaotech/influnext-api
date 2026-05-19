import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import axios from 'axios';

export class SocialAuthController {
  static async getAuthUrls(req: Request, res: Response) {
    const userId = req.user!.id;
    
    const urls = {
      instagram: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_API_URL}/integrations/instagram/callback&scope=instagram_basic,pages_show_list,pages_read_engagement&response_type=code&state=${userId}`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${process.env.NEXT_PUBLIC_API_URL}/integrations/tiktok/callback&state=${userId}`,
      youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_API_URL}/integrations/google/callback&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=${userId}&access_type=offline&prompt=consent`
    };

    res.json(urls);
  }

  static async handleCallback(req: Request, res: Response) {
    const { platform } = req.params;
    const { code, state } = req.query; // state contém o userId

    if (!code || !state) {
      res.status(400).json({ error: 'Código ou estado ausente.' });
      return;
    }

    try {
      let accessToken = '';
      let username = '';
      let platformId = '';

      if (platform === 'instagram') {
        const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
          params: {
            client_id: process.env.INSTAGRAM_CLIENT_ID!,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
            redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/integrations/instagram/callback`,
            code: code as string
          }
        });

        accessToken = tokenResponse.data.access_token;
        
        const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
          params: {
            fields: 'instagram_business_account{id,username}',
            access_token: accessToken
          }
        });

        const pageWithIg = pagesResponse.data.data.find((p: any) => p.instagram_business_account);
        
        if (!pageWithIg || !pageWithIg.instagram_business_account) {
          throw new Error('Nenhuma conta do Instagram Profissional vinculada a uma Página do Facebook foi encontrada.');
        }

        username = pageWithIg.instagram_business_account.username;
        platformId = pageWithIg.instagram_business_account.id;
      } else if (platform === 'tiktok') {
        const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.FRONTEND_URL}/auth/callback/tiktok`,
        }).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        accessToken = tokenResponse.data.access_token;
        platformId = tokenResponse.data.open_id;

        const userResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        username = userResponse.data.data.user.username || userResponse.data.data.user.display_name;
      } else if (platform === 'google' || platform === 'youtube') {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.FRONTEND_URL}/auth/callback/${platform}`,
        }).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        accessToken = tokenResponse.data.access_token;

        const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        const channel = channelResponse.data.items[0];
        username = channel.snippet.title;
        platformId = channel.id;
      }

      const profile = await prisma.influencerProfile.findUnique({
        where: { userId: state as string }
      });

      if (!profile) {
        res.status(404).json({ error: 'Perfil não encontrado.' });
        return;
      }

      // Atualizar handle do perfil se for a primeira conexão
      if (!profile.handle || profile.handle.startsWith('user_')) {
        await prisma.influencerProfile.update({
          where: { id: profile.id },
          data: { handle: username }
        });
      }

      let platformName = platform.toUpperCase();
      if (platformName === 'GOOGLE') platformName = 'YOUTUBE';

      await prisma.socialPlatform.upsert({
        where: {
          influencerId_platformName: {
            influencerId: profile.id,
            platformName: platformName
          }
        },
        update: {
          accessToken,
          username: username,
          platformId: platformId,
          isActive: true,
        },
        create: {
          influencerId: profile.id,
          platformName: platformName,
          platformId: platformId,
          username: username,
          accessToken,
          isActive: true
        }
      });

      res.json({ success: true, platform, username });
    } catch (error: any) {
      console.error(`[SOCIAL_AUTH] Erro no callback ${platform}:`, error.response?.data || error.message);
      res.status(500).json({ error: 'Falha na autenticação social.', details: error.response?.data });
    }
  }
}
