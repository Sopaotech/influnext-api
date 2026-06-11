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

export class SocialAuthController {
  static async getAuthUrls(req: Request, res: Response) {
    const userId = req.user!.id;
    
    const rawFrontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://influnext.com.br';
    const frontendUrl = rawFrontendUrl.endsWith('/') ? rawFrontendUrl.slice(0, -1) : rawFrontendUrl;
    
    const urls = {
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_BASIC_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/instagram&scope=user_profile,user_media&response_type=code&state=${userId}`,
      instagram_business: `https://www.facebook.com/v20.0/dialog/oauth?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/instagram&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement&response_type=code&state=${userId}_business`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${frontendUrl}/auth/callback/tiktok&state=${userId}`,
      youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/youtube&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly&state=${userId}&access_type=offline&prompt=consent`
    };

    res.json(urls);
  }

  static async getPublicAuthUrls(req: Request, res: Response) {
    const rawFrontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://influnext.com.br';
    const frontendUrl = rawFrontendUrl.endsWith('/') ? rawFrontendUrl.slice(0, -1) : rawFrontendUrl;
    
    const urls = {
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_BASIC_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/instagram&scope=user_profile,user_media&response_type=code&state=register_instagram`,
      instagram_business: `https://www.facebook.com/v20.0/dialog/oauth?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/callback/instagram&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement&response_type=code&state=register_instagram_business`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${frontendUrl}/auth/callback/tiktok&state=register_tiktok`,
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

      const rawFrontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://influnext.com.br';
      const frontendUrl = rawFrontendUrl.endsWith('/') ? rawFrontendUrl.slice(0, -1) : rawFrontendUrl;

      if (platform === 'instagram') {
        if (isBusiness) {
          // Meta Graph API Flow (Facebook Dialog OAuth)
          const tokenResponse = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
            params: {
              client_id: process.env.INSTAGRAM_CLIENT_ID!,
              client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
              redirect_uri: `${frontendUrl}/auth/callback/instagram`,
              code: code as string
            }
          });

          const shortLivedToken = tokenResponse.data.access_token;
          
          // 2. Long-Lived Access Token (60 dias)
          const longLivedResponse = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
            params: {
              grant_type: 'fb_exchange_token',
              client_id: process.env.INSTAGRAM_CLIENT_ID!,
              client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
              fb_exchange_token: shortLivedToken
            }
          });

          accessToken = longLivedResponse.data.access_token || shortLivedToken;
          
          const pagesResponse = await axios.get('https://graph.facebook.com/v20.0/me/accounts', {
            params: {
              fields: 'instagram_business_account{id,username}',
              access_token: accessToken
            }
          });

          const pageWithIg = pagesResponse.data.data.find((p: any) => p.instagram_business_account);
          
          if (!pageWithIg || !pageWithIg.instagram_business_account) {
            throw new Error('Nenhuma conta do Instagram Profissional/Criador vinculada a uma Página do Facebook foi encontrada.');
          }

          username = pageWithIg.instagram_business_account.username;
          platformId = pageWithIg.instagram_business_account.id;

          // Buscar dados reais do perfil Instagram
          try {
            const detailsResponse = await axios.get(`https://graph.facebook.com/v20.0/${platformId}`, {
              params: {
                fields: 'followers_count,profile_picture_url',
                access_token: accessToken
              }
            });
            instagramFollowers = detailsResponse.data.followers_count || 0;
            instagramProfilePicture = detailsResponse.data.profile_picture_url || null;
          } catch (err) {
            console.warn('[INSTAGRAM] Falha ao buscar detalhes do perfil (followers/avatar). Usando padrões.', err);
          }
        } else {
          // Instagram Basic Display API Flow (Clean Instagram Screen OAuth)
          const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
            client_id: process.env.INSTAGRAM_BASIC_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID!,
            client_secret: process.env.INSTAGRAM_BASIC_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET!,
            grant_type: 'authorization_code',
            redirect_uri: `${frontendUrl}/auth/callback/instagram`,
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
          } catch (longLivedErr) {
            console.warn('[INSTAGRAM BASIC] Erro ao obter long-lived token, usando token curto.', longLivedErr);
            accessToken = shortLivedToken;
          }

          const profileResponse = await axios.get('https://graph.instagram.com/me', {
            params: {
              fields: 'id,username,account_type',
              access_token: accessToken
            }
          });

          username = profileResponse.data.username;
          platformId = profileResponse.data.id;
          instagramFollowers = 0; // Preenchido no onboarding/simulação
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
              subscriptionStatus: 'TRIAL',
              trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
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
      if (platform === 'instagram') {
        const errorMsgStr = error.message || '';
        const apiMsgStr = error.response?.data?.error?.message || '';
        
        if (errorMsgStr.includes('Facebook') || errorMsgStr.includes('Página') || apiMsgStr.includes('Facebook') || apiMsgStr.includes('business')) {
          clientMessage = 'Não encontramos nenhuma conta do Instagram Profissional vinculada à sua Página do Facebook. Use a Conexão Pessoal para logar sem burocracia.';
        } else if (error.response?.data?.error_message) {
          clientMessage = `Erro do Instagram: ${error.response.data.error_message}`;
        }
      }
      
      res.status(400).json({ error: clientMessage, details: error.response?.data });
    }
  }
}
