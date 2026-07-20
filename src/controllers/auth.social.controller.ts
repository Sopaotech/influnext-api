import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import axios from 'axios';
import { ScoringService } from '../services/scoring.service';
import { InstagramService } from '../services/instagram.service';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

function signFullToken(user: { id: string; role: string; email: string }) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function getFrontendUrl(req: Request): string {
  const origin = req.headers.origin as string;
  if (origin) return origin.endsWith('/') ? origin.slice(0, -1) : origin;
  
  const referer = req.headers.referer as string;
  if (referer) {
    try {
      const parsed = new URL(referer);
      return parsed.origin;
    } catch (_) {}
  }
  
  const raw = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://influnext.com.br';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export class SocialAuthController {
  static async getAuthUrls(req: Request, res: Response) {
    const userId = req.user!.id;
    const frontendUrl = getFrontendUrl(req);
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_me';
    const stateIg = jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
    const instagramRedirectUri = `${frontendUrl}/auth/callback/instagram`;

    const urls = {
      instagram: `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(instagramRedirectUri)}&scope=instagram_business_basic&response_type=code&state=${stateIg}`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${frontendUrl}/auth/callback/tiktok&state=${userId}`,
      youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/youtube&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=${userId}&access_type=offline&prompt=consent`
    };

    res.json(urls);
  }

  static async getPublicAuthUrls(req: Request, res: Response) {
    const frontendUrl = getFrontendUrl(req);
    const instagramRedirectUri = `${frontendUrl}/auth/callback/instagram`;

    const urls = {
      instagram: `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(instagramRedirectUri)}&scope=instagram_business_basic&response_type=code&state=register_instagram`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${frontendUrl}/auth/callback/tiktok&state=register_tiktok`,
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/google&response_type=code&scope=openid%20email%20profile&state=register_google`,
      youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/youtube&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=register_youtube&access_type=offline&prompt=consent`
    };

    res.json(urls);
  }

  static async handleCallback(req: Request, res: Response) {
    const { platform } = req.params;
    const { code, state } = req.query; // state contém o userId, userId_onboarding, ou register_platform

    if (!code || !state) {
      res.status(400).json({ error: 'Código ou estado ausente.' });
      return;
    }

    const stateStr = state as string;
    const isBusiness = stateStr.includes('_business');
    const cleanStateStr = stateStr.replace('_business', '');
    const isRegister = cleanStateStr.startsWith('register_');
    const isFromOnboarding = !isRegister && cleanStateStr.endsWith('_onboarding');
    let userId = '';
    if (!isRegister) {
      userId = isFromOnboarding ? cleanStateStr.replace('_onboarding', '') : cleanStateStr;
    }

    try {
      let accessToken = '';
      let username = '';
      let platformId = '';
      let instagramFollowers = 0;
      let instagramProfilePicture: string | null = null;
      let tiktokFollowers = 0;
      let tiktokAvatar: string | null = null;

      const frontendUrl = getFrontendUrl(req);

      if (platform === 'instagram') {
        // Instagram API with Instagram Login — fluxo unificado Creator/Business
        // Não usa mais Facebook Dialog OAuth nem /me/accounts
        const tokenResult = await InstagramService.exchangeCodeForToken(
          code as string,
          `${frontendUrl}/auth/callback/instagram`
        );

        accessToken = tokenResult.accessToken;
        platformId = tokenResult.platformId;

        try {
          const profileData = await InstagramService.fetchProfileData(accessToken);
          username = profileData.username || `ig_user_${platformId}`;
          instagramFollowers = profileData.followers_count || 0;
          instagramProfilePicture = profileData.profile_picture_url || null;
        } catch (profileErr) {
          console.warn('[INSTAGRAM] Falha ao buscar perfil no callback social:', profileErr);
          username = `ig_user_${platformId}`;
        }
      } else if (platform === 'tiktok') {
        const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${frontendUrl}/auth/callback/tiktok`,
        }).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        accessToken = tokenResponse.data.access_token;
        platformId = tokenResponse.data.open_id;

        try {
          const userResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url,follower_count', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          const userObj = userResponse.data?.data?.user;
          if (userObj) {
            username = userObj.username || userObj.display_name || username;
            tiktokAvatar = userObj.avatar_url || null;
            tiktokFollowers = userObj.follower_count || 0;
          }
        } catch (err) {
          console.warn('[TIKTOK] Falha ao buscar detalhes do usuário do TikTok', err);
          username = `tiktok_user`;
        }
      } else if (platform === 'google' || platform === 'youtube') {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${frontendUrl}/auth/callback/${platform}`,
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

      let profile;
      let platformName = platform.toUpperCase();
      if (platformName === 'GOOGLE') platformName = 'YOUTUBE';

      let followersCount = 0;
      let profilePicture: string | null = null;

      if (platformName === 'INSTAGRAM') {
        followersCount = instagramFollowers;
        profilePicture = instagramProfilePicture;
      } else if (platformName === 'TIKTOK') {
        followersCount = tiktokFollowers;
        profilePicture = tiktokAvatar;
      }

      if (isRegister) {
        // 1. Procurar se já existe essa plataforma social conectada
        const existingPlatform = await prisma.socialPlatform.findFirst({
          where: {
            platformId: platformId,
            platformName: platformName
          },
          include: {
            influencer: {
              include: {
                user: true
              }
            }
          }
        });

        if (existingPlatform && existingPlatform.influencer) {
          profile = existingPlatform.influencer;
          userId = profile.userId;
        } else {
          // 2. Criar novo usuário e perfil
          const tempEmail = `${username.toLowerCase()}_${Math.floor(1000 + Math.random() * 9000)}@influnext.temp`;
          const tempPassword = crypto.randomUUID();
          const passwordHash = await bcrypt.hash(tempPassword, 12);

          const newUser = await prisma.user.create({
            data: {
              email: tempEmail,
              passwordHash,
              role: 'INFLUENCER',
              onboardingCompleted: false,
              theme: 'dark',
              subscriptionStatus: 'ACTIVE',
              subscriptionTier: 'FREE'
            }
          });

          profile = await prisma.influencerProfile.create({
            data: {
              userId: newUser.id,
              handle: username,
              niche: 'Geral',
              profileImageUrl: profilePicture
            }
          });

          userId = newUser.id;
        }
      } else {
        const foundProfile = await prisma.influencerProfile.findUnique({
          where: { userId }
        });

        if (!foundProfile) {
          res.status(404).json({ error: 'Perfil não encontrado.' });
          return;
        }
        profile = foundProfile;
      }

      // Atualizar handle do perfil se for a primeira conexão
      if (!profile.handle || profile.handle.startsWith('user_')) {
        await prisma.influencerProfile.update({
          where: { id: profile.id },
          data: { handle: username }
        });
      }

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
          followersCount,
          profilePicture,
          isActive: true,
        },
        create: {
          influencerId: profile.id,
          platformName: platformName,
          platformId: platformId,
          username: username,
          followersCount,
          profilePicture,
          accessToken,
          isActive: true
        }
      });

      if (platformName === 'INSTAGRAM') {
        // Executar sincronização real em background
        InstagramService.syncInstagramData(profile.id, accessToken, platformId).catch(err => {
          console.error('[INSTAGRAM] Falha na sincronização de dados reais:', err);
        });
      } else if (platformName === 'TIKTOK') {
        await prisma.influencerProfile.update({
          where: { id: profile.id },
          data: { verifiedMetrics: true }
        });
        await ScoringService.calculateAndPersist(profile.id);
      }

      if (isRegister) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const token = signFullToken(user as any);
        res.json({
          success: true,
          token,
          user: {
            id: user!.id,
            email: user!.email,
            role: user!.role,
            onboardingCompleted: user!.onboardingCompleted
          },
          platform,
          username
        });
        return;
      }

      res.json({ success: true, platform, username });
    } catch (error: any) {
      console.error(`[SOCIAL_AUTH] Erro no callback ${platform}:`, error.response?.data || error.message);
      
      let clientMessage = 'Falha na autenticação social. Por favor, tente novamente.';
      let errorType = 'error';
      if (platform === 'instagram') {
        const errorMsgStr = (error.message || '').toLowerCase();
        const apiMsgStr = (error.response?.data?.error?.message || '').toLowerCase();
        
        if (
          errorMsgStr.includes('creator') || 
          errorMsgStr.includes('business') || 
          errorMsgStr.includes('profissional') ||
          apiMsgStr.includes('business') || 
          apiMsgStr.includes('professional') ||
          apiMsgStr.includes('creator')
        ) {
          errorType = 'no_creator_account';
          clientMessage = 'Sua conta do Instagram é Pessoal. A Meta exige uma conta do tipo Criador de Conteúdo ou Comercial para liberar a conexão com a API.';
        } else if (error.response?.data?.error_message) {
          clientMessage = `Erro do Instagram: ${error.response.data.error_message}`;
        }
      }
      
      res.status(400).json({ error: clientMessage, errorType, details: error.response?.data });
    }
  }
}
