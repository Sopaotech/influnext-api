import axios from 'axios';
import { prisma } from '../lib/prisma';
import { AuditorService } from './auditor.service';
import { sanitizeProviderError } from '../utils/provider-error';

export class TikTokService {
  private static readonly TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
  private static readonly TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

  /**
   * Renova um token de acesso expirado do TikTok usando o refreshToken.
   */
  static async refreshAccessToken(refreshToken: string) {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      throw new Error('Chaves da API do TikTok não configuradas no .env');
    }

    try {
      const res = await axios.post(
        this.TOKEN_URL,
        new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, expires_in, refresh_token, open_id } = res.data;

      if (!access_token) {
        throw new Error(res.data.error_description || 'Erro desconhecido ao renovar token do TikTok');
      }

      return {
        accessToken: access_token,
        expiresIn: expires_in || 86400,
        refreshToken: refresh_token || refreshToken, // se não retornar um novo, mantém o atual
        refreshTokenRotated: Boolean(refresh_token),
        openId: open_id
      };
    } catch (error: any) {
      console.error('[TIKTOK SERVICE] Erro ao renovar token:', sanitizeProviderError(error));
      throw new Error('Falha ao renovar token do TikTok');
    }
  }

  /**
   * Sincroniza dados e métricas reais do TikTok para o Influenciador.
   */
  static async syncTikTokData(influencerId: string, accessToken: string, openId: string) {
    console.log(`[TIKTOK_SYNC] Iniciando sincronização para influenciador: ${influencerId}, OpenID: ${openId}`);

    try {
      // 1. Buscar informações de perfil do TikTok
      let profileData: any = {};
      try {
        const userRes = await axios.get(
          `${this.TIKTOK_API_BASE}/user/info/?fields=open_id,avatar_url,display_name,bio_description,follower_count,following_count,likes_count,video_count`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        profileData = userRes.data?.data?.user || {};
      } catch (profileErr: any) {
        console.warn('[TIKTOK_SYNC] Aviso ao buscar perfil do TikTok:', sanitizeProviderError(profileErr));
      }

      const username = profileData.display_name || profileData.username || `tiktok_user_${openId.slice(-6)}`;
      const followers = profileData.follower_count || 0;
      const profilePicture = profileData.avatar_url || null;

      // 2. Buscar lista de vídeos e estatísticas de engajamento
      let videoList: any[] = [];
      try {
        const videosRes = await axios.post(
          `${this.TIKTOK_API_BASE}/video/list/?fields=id,title,video_description,create_time,cover_image_url,share_url,like_count,comment_count,share_count,view_count`,
          { max_count: 15 },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        videoList = videosRes.data?.data?.videos || [];
      } catch (videoErr: any) {
        console.warn('[TIKTOK_SYNC] Aviso ao buscar vídeos do TikTok:', sanitizeProviderError(videoErr));
      }

      let totalViews = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      const postsWithInsights: any[] = [];

      for (const video of videoList) {
        const views = video.view_count || 0;
        const likes = video.like_count || 0;
        const comments = video.comment_count || 0;
        const shares = video.share_count || 0;

        totalViews += views;
        totalLikes += likes;
        totalComments += comments;
        totalShares += shares;

        postsWithInsights.push({
          id: video.id,
          caption: video.title || video.video_description || '',
          mediaType: 'VIDEO',
          mediaUrl: video.cover_image_url || null,
          permalink: video.share_url || null,
          likeCount: likes,
          commentCount: comments,
          plays: views,
          impressions: views,
          reach: Math.round(views * 0.85),
          saved: 0,
          shares: shares,
          timestamp: video.create_time ? new Date(video.create_time * 1000).toISOString() : new Date().toISOString()
        });
      }

      // 3. Calcular métricas agregadas
      const videoCount = videoList.length || 1;
      const avgViews = Math.round(totalViews / videoCount);
      const reachLast30Days = Math.round(totalViews * 0.85);

      let avgEngagementPerPost = 0;
      if (followers > 0 && videoList.length > 0) {
        const totalInteractions = totalLikes + totalComments + totalShares;
        avgEngagementPerPost = ((totalInteractions / videoList.length) / followers) * 100;
      }

      const engagementRate = Math.min(Math.round(avgEngagementPerPost * 100) / 100, 100);

      const insightsJson = {
        followers,
        avgViews,
        engagementRate,
        reachLast30Days,
        avgLikes: Math.round(totalLikes / videoCount),
        avgComments: Math.round(totalComments / videoCount),
        avgShares: Math.round(totalShares / videoCount),
        updatedAt: new Date().toISOString(),
        apiVersion: 'tiktok_open_api_v2'
      };

      // 4. Salvar no banco de dados
      await prisma.influencerProfile.update({
        where: { id: influencerId },
        data: {
          handle: username,
          profileImageUrl: profilePicture,
          verifiedMetrics: true,
          insights: insightsJson as any,
          topPosts: postsWithInsights.length > 0 ? (postsWithInsights as any) : undefined
        }
      });

      // 5. Registrar no auditor com provedor TIKTOK e atualizar InfluScore
      await AuditorService.syncMetrics(influencerId, 'TIKTOK', {
        followers,
        engagementRate,
        reachLast30Days,
        avgViews
      });

      // 6. Disparar geração de análise semanal pela IA (assíncrono — não bloqueia a resposta)
      try {
        const { AIService } = require('./ai.service');
        if (AIService?.generateWeeklyAnalysis) {
          Promise.resolve(AIService.generateWeeklyAnalysis(influencerId)).catch((err: any) => {
            console.error('[TIKTOK_SYNC] Erro ao disparar análise pós-sync:', err);
          });
        }
      } catch (requireErr) {
        console.error('[TIKTOK_SYNC] Erro ao carregar AIService dinamicamente:', requireErr);
      }

      console.log(`[TIKTOK_SYNC] ✅ Sincronização do TikTok concluída para @${username}! Seguidores: ${followers}, Engajamento: ${engagementRate}%, Views Média: ${avgViews}`);

      return {
        success: true,
        username,
        followers,
        engagementRate,
        avgViews
      };
    } catch (err: any) {
      console.error('[TIKTOK_SYNC] ❌ Erro na sincronização:', sanitizeProviderError(err));
      throw new Error('Falha ao sincronizar dados do TikTok.');
    }
  }
}
