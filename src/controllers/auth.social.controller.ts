import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import axios from 'axios';
import { ScoringService } from '../services/scoring.service';
import { InstagramService } from '../services/instagram.service';
import { TikTokService } from '../services/tiktok.service';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createOAuthState, consumeOAuthState, getOAuthFrontendUrl, isOAuthPlatform, oauthBoundaryFailure, assertOAuthIdentity } from '../lib/oauth-state';
import { createTwoFactorChallenge } from '../lib/two-factor-challenge';
import { establishSession } from '../lib/session-cookie';
import { sanitizeProviderError, sanitizeProviderMessage } from '../utils/provider-error';
import { assertSocialTokenEncryptionConfigured, encryptSocialToken } from '../utils/social-token-crypto';

export class SocialAuthController {
  static async getAuthUrls(req: Request, res: Response) {
    try {
    const frontendUrl = getOAuthFrontendUrl(req);
    const stateIg = await createOAuthState(req, res, 'instagram', 'link');
    const stateTiktok = await createOAuthState(req, res, 'tiktok', 'link');
    const stateYoutube = await createOAuthState(req, res, 'youtube', 'link');
    const instagramRedirectUri = `${frontendUrl}/auth/callback/instagram`;

    const isInstagramConfigured = Boolean(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_ID !== 'seu_instagram_app_client_id');
    const isTikTokConfigured = Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_KEY !== 'seu_tiktok_client_key');
    const isGoogleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'seu_google_client_id');

    const urls = {
      instagram: `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(instagramRedirectUri)}&scope=instagram_business_basic&response_type=code&state=${stateIg}`,
      authUrl: `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(instagramRedirectUri)}&scope=instagram_business_basic&response_type=code&state=${stateIg}`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${frontendUrl}/auth/callback/tiktok&state=${stateTiktok}`,
      youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/youtube&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=${stateYoutube}&access_type=offline&prompt=consent`,
      configured: {
        instagram: isInstagramConfigured,
        tiktok: isTikTokConfigured,
        google: isGoogleConfigured
      }
    };

    res.json(urls);
    } catch (error) { oauthBoundaryFailure(res, error); }
  }

  static async getPublicAuthUrls(req: Request, res: Response) {
    try {
    const frontendUrl = getOAuthFrontendUrl(req);
    const instagramRedirectUri = `${frontendUrl}/auth/callback/instagram`;
    const stateInstagram = await createOAuthState(req, res, 'instagram', 'login');
    const stateTiktok = await createOAuthState(req, res, 'tiktok', 'login');
    const stateGoogle = await createOAuthState(req, res, 'google', 'login');
    const stateYoutube = await createOAuthState(req, res, 'youtube', 'login');

    const isInstagramConfigured = Boolean(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_ID !== 'seu_instagram_app_client_id');
    const isTikTokConfigured = Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_KEY !== 'seu_tiktok_client_key');
    const isGoogleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'seu_google_client_id');

    const urls = {
      instagram: `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(instagramRedirectUri)}&scope=instagram_business_basic&response_type=code&state=${stateInstagram}`,
      authUrl: `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(instagramRedirectUri)}&scope=instagram_business_basic&response_type=code&state=${stateInstagram}`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${frontendUrl}/auth/callback/tiktok&state=${stateTiktok}`,
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/google&response_type=code&scope=openid%20email%20profile&state=${stateGoogle}`,
      youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/youtube&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=${stateYoutube}&access_type=offline&prompt=consent`,
      configured: {
        instagram: isInstagramConfigured,
        tiktok: isTikTokConfigured,
        google: isGoogleConfigured
      }
    };

    res.json(urls);
    } catch (error) { oauthBoundaryFailure(res, error); }
  }

  static async handleCallback(req: Request, res: Response) {
    const { platform } = req.params;
    if (!isOAuthPlatform(platform)) {
      res.status(400).json({ error: 'Plataforma OAuth não suportada.' });
      return;
    }

    let oauthState;
    try { oauthState = await consumeOAuthState(req, res, platform); }
    catch (error) { oauthBoundaryFailure(res, error); return; }
    const isRegister = oauthState.mode === 'login';
    let userId = oauthState.userId || '';

    try {
      assertSocialTokenEncryptionConfigured();
      let accessToken = '';
      let username = '';
      let platformId = '';
      let instagramFollowers = 0;
      let instagramProfilePicture: string | null = null;
      let tiktokFollowers = 0;
      let tiktokAvatar: string | null = null;

      const frontendUrl = oauthState.frontendUrl;

      let refreshToken: string | null = null;
      let expiresAt: Date | null = null;

      if (platform === 'instagram') {
        // Instagram API with Instagram Login — fluxo unificado Creator/Business
        // Não usa mais Facebook Dialog OAuth nem /me/accounts
        const tokenResult = await InstagramService.exchangeCodeForToken(
          req.query.code as string,
          `${frontendUrl}/auth/callback/instagram`
        );

        accessToken = tokenResult.accessToken;
        platformId = tokenResult.platformId;
        const expiresIn = tokenResult.expiresIn || 5184000;
        expiresAt = new Date(Date.now() + expiresIn * 1000);

        try {
          const profileData = await InstagramService.fetchProfileData(accessToken);
          username = profileData.username || `ig_user_${platformId}`;
          instagramFollowers = profileData.followers_count || 0;
          instagramProfilePicture = profileData.profile_picture_url || null;
        } catch (profileErr) {
          console.warn('[INSTAGRAM] Falha ao buscar perfil no callback social:', sanitizeProviderError(profileErr));
          username = `ig_user_${platformId}`;
        }
      } else if (platform === 'tiktok') {
        const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code: req.query.code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${frontendUrl}/auth/callback/tiktok`,
        }).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        accessToken = tokenResponse.data.access_token;
        refreshToken = tokenResponse.data.refresh_token || null;
        const expiresIn = tokenResponse.data.expires_in || 86400;
        expiresAt = new Date(Date.now() + expiresIn * 1000);
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
          console.warn('[TIKTOK] Falha ao buscar detalhes do usuário do TikTok', sanitizeProviderError(err));
          username = `tiktok_user_${platformId?.slice(-6) || ''}`;
        }
      } else if (platform === 'google' || platform === 'youtube') {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: req.query.code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${frontendUrl}/auth/callback/${platform}`,
        }).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        accessToken = tokenResponse.data.access_token;
        refreshToken = tokenResponse.data.refresh_token || null;
        const expiresIn = tokenResponse.data.expires_in || 3600;
        expiresAt = new Date(Date.now() + expiresIn * 1000);

        const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        const channel = channelResponse.data.items[0];
        username = channel.snippet.title;
        platformId = channel.id;
      }

      assertOAuthIdentity(accessToken, platformId);
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

      let oauthUser: User | null = null;
      if (isRegister) {
        // 1. Procurar se já existe essa plataforma social conectada
        const existingPlatform = await prisma.socialPlatform.findFirst({
          where: {
            platformId: platformId,
            platformName: platformName
          },
          select: {
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
          oauthUser = existingPlatform.influencer.user;
        } else {
          // 2. Criar novo usuário e perfil
          const tempEmail = `${username.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(1000 + Math.random() * 9000)}@influnext.temp`;
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
          oauthUser = newUser;
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

      if (isRegister && !oauthUser) {
        res.status(401).json({ error: 'Conta OAuth não encontrada.' });
        return;
      }
      if (isRegister && oauthUser?.twoFactorEnabled) {
        res.json({
          success: true, status: 'PENDING_2FA',
          tempToken: createTwoFactorChallenge(oauthUser.id),
          message: 'Código de autenticação necessário.',
        });
        return;
      }

      // Atualizar handle do perfil se for a primeira conexão
      if (!profile.handle || profile.handle.startsWith('user_')) {
        await prisma.influencerProfile.update({
          where: { id: profile.id },
          data: { handle: username, verifiedMetrics: true }
        });
      } else {
        await prisma.influencerProfile.update({
          where: { id: profile.id },
          data: { verifiedMetrics: true }
        });
      }

      const encryptedAccessToken = encryptSocialToken(accessToken, {
        influencerId: profile.id,
        platformName,
        field: 'accessToken',
      });
      const encryptedRefreshToken = refreshToken
        ? encryptSocialToken(refreshToken, {
            influencerId: profile.id,
            platformName,
            field: 'refreshToken',
          })
        : null;

      await prisma.socialPlatform.upsert({
        where: {
          influencerId_platformName: {
            influencerId: profile.id,
            platformName: platformName
          }
        },
        update: {
          accessToken: encryptedAccessToken,
          ...(encryptedRefreshToken ? { refreshToken: encryptedRefreshToken } : {}),
          expiresAt,
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
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          isActive: true
        }
      });

      if (platformName === 'INSTAGRAM') {
        // Executar sincronização real em background
        InstagramService.syncInstagramData(profile.id, accessToken, platformId).catch(err => {
          console.error('[INSTAGRAM] Falha na sincronização de dados reais:', sanitizeProviderError(err));
        });
      } else if (platformName === 'TIKTOK') {
        // Executar sincronização real do TikTok em background
        TikTokService.syncTikTokData(profile.id, accessToken, platformId).catch(err => {
          console.error('[TIKTOK] Falha na sincronização de dados reais:', sanitizeProviderError(err));
        });
      }

      if (isRegister) {
        const user = oauthUser!;
        establishSession(res, user);
        res.json({
          success: true,
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

      res.json({ success: true, platform, username, from: oauthState.from });
    } catch (error: any) {
      const sanitizedError = sanitizeProviderError(error, 'Falha no callback do provedor social.');
      console.error(`[SOCIAL_AUTH] Erro no callback ${platform}:`, sanitizedError);
      
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
          clientMessage = `Erro do Instagram: ${sanitizeProviderMessage(error.response.data.error_message, 'Falha na autenticação com Instagram.')}`;
        }
      }
      
      res.status(400).json({ error: clientMessage, errorType });
    }
  }
}
