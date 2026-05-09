import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import axios from 'axios';

export class SocialAuthController {
  static async getAuthUrls(req: Request, res: Response) {
    const userId = req.user!.id;
    
    const urls = {
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.FRONTEND_URL}/auth/callback/instagram&scope=user_profile,user_media&response_type=code&state=${userId}`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${process.env.FRONTEND_URL}/auth/callback/tiktok&state=${userId}`,
      youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.FRONTEND_URL}/auth/callback/youtube&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=${userId}&access_type=offline&prompt=consent`
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
        const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
          client_id: process.env.INSTAGRAM_CLIENT_ID!,
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.FRONTEND_URL}/auth/callback/instagram`,
          code: code as string
        }).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        accessToken = tokenResponse.data.access_token;
        platformId = tokenResponse.data.user_id.toString();

        const userResponse = await axios.get(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
        username = userResponse.data.username;
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
