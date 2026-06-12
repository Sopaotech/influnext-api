import axios from 'axios';
import { prisma } from '../lib/prisma';
import { AuditorService } from './auditor.service';

export class InstagramService {
  private static readonly API_URL = 'https://graph.facebook.com/v20.0';

  /**
   * Obtém um token de acesso de longa duração trocando um código de curta duração.
   */
  static async exchangeCodeForToken(code: string, redirectUri: string) {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Chaves da API do Instagram não configuradas no .env');
    }

    try {
      // Passo 1: Trocar código pelo Token curto (Facebook Oauth Endpoint)
      const tokenResponse = await axios.get(`${this.API_URL}/oauth/access_token`, {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code: code
        }
      });

      const shortToken = tokenResponse.data.access_token;

      // Passo 2: Trocar Token Curto por Token Longo (60 dias)
      const longRes = await axios.get(`${this.API_URL}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: shortToken
        }
      });

      return {
        accessToken: longRes.data.access_token || shortToken,
        expiresIn: longRes.data.expires_in || 5184000,
        platformId: '' // Será preenchido ao obter a conta comercial vinculada
      };
    } catch (error: any) {
      console.error('[INSTAGRAM SERVICE] Erro ao trocar token:', error.response?.data || error.message);
      throw new Error('Falha na autenticação com Instagram');
    }
  }

  /**
   * Renova um token de acesso de longa duração do Instagram (Basic Display API).
   */
  static async refreshLongLivedToken(accessToken: string) {
    try {
      const res = await axios.get('https://graph.instagram.com/refresh_access_token', {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken
        }
      });
      return {
        accessToken: res.data.access_token,
        expiresIn: res.data.expires_in || 5184000
      };
    } catch (error: any) {
      console.error('[INSTAGRAM SERVICE] Erro ao renovar token:', error.response?.data || error.message);
      throw new Error('Falha ao renovar token do Instagram');
    }
  }

  /**
   * Puxa informações básicas e insights de um perfil usando um Token Longo.
   */
  static async fetchProfileData(accessToken: string) {
    try {
      const res = await axios.get(`${this.API_URL}/me/accounts`, {
        params: {
          fields: 'instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}',
          access_token: accessToken
        }
      });
      return res.data;
    } catch (error: any) {
      console.error('[INSTAGRAM SERVICE] Erro ao buscar perfil:', error.response?.data || error.message);
      throw new Error('Falha ao obter dados do perfil do Instagram');
    }
  }

  /**
   * Sincroniza dados e métricas reais do Instagram Graph API para o Influenciador.
   */
  static async syncInstagramData(influencerId: string, accessToken: string, igBusinessId: string) {
    console.log(`[INSTAGRAM_SYNC] Iniciando sincronização para o influenciador: ${influencerId}, conta comercial: ${igBusinessId}`);

    try {
      // 1. Obter informações básicas da conta comercial do Instagram
      const profileRes = await axios.get(`${this.API_URL}/${igBusinessId}`, {
        params: {
          fields: 'followers_count,media_count,profile_picture_url,username,name',
          access_token: accessToken
        }
      });

      const profileData = profileRes.data;
      const followers = profileData.followers_count || 0;
      const profilePicture = profileData.profile_picture_url || null;
      const username = profileData.username || 'instagram_user';

      // 2. Buscar as últimas 15 mídias do usuário
      const mediaRes = await axios.get(`${this.API_URL}/${igBusinessId}/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp',
          limit: 15,
          access_token: accessToken
        }
      });

      const mediaList = mediaRes.data.data || [];
      const postsWithInsights = [];

      let totalPlays = 0;
      let totalImpressions = 0;
      let totalReach = 0;
      let totalSaved = 0;
      let totalShares = 0;
      let videoCount = 0;
      let imageCount = 0;

      let sumLikes = 0;
      let sumComments = 0;

      // 3. Iterar e obter insights de engajamento para cada mídia
      for (const media of mediaList) {
        sumLikes += media.like_count || 0;
        sumComments += media.comments_count || 0;

        let plays = 0;
        let impressions = 0;
        let reach = 0;
        let saved = 0;
        let shares = 0;

        try {
          // Determina a query de insights baseada no tipo de mídia
          let metricsQuery = '';
          if (media.media_type === 'VIDEO') {
            // Reels/Vídeos costumam usar plays, reach, saved, shares
            metricsQuery = 'plays,reach,saved,shares';
          } else {
            // Imagens e Carrosséis usam impressions, reach, saved
            metricsQuery = 'impressions,reach,saved';
          }

          const insightsRes = await axios.get(`${this.API_URL}/${media.id}/insights`, {
            params: {
              metric: metricsQuery,
              access_token: accessToken
            }
          });

          const insightsData = insightsRes.data.data || [];
          
          insightsData.forEach((item: any) => {
            const val = item.values?.[0]?.value || 0;
            if (item.name === 'plays') plays = val;
            if (item.name === 'impressions') impressions = val;
            if (item.name === 'reach') reach = val;
            if (item.name === 'saved') saved = val;
            if (item.name === 'shares') shares = val;
          });

        } catch (insightErr: any) {
          // Fallback silencioso se o post não tiver insights ou for recente
          console.warn(`[INSTAGRAM_SYNC] Falha ao obter insights do post ${media.id}:`, insightErr.response?.data || insightErr.message);
          
          // Caso seja um vídeo e falhe na busca de plays, tentamos buscar impressions/reach/saved genéricos
          if (media.media_type === 'VIDEO') {
            try {
              const fallbackRes = await axios.get(`${this.API_URL}/${media.id}/insights`, {
                params: {
                  metric: 'reach,saved',
                  access_token: accessToken
                }
              });
              fallbackRes.data.data?.forEach((item: any) => {
                const val = item.values?.[0]?.value || 0;
                if (item.name === 'reach') reach = val;
                if (item.name === 'saved') saved = val;
              });
            } catch (_) {}
          }
        }

        if (media.media_type === 'VIDEO') {
          totalPlays += plays || reach; // Se plays for 0, usa reach como estimativa de visualizações
          videoCount++;
        } else {
          totalImpressions += impressions;
          imageCount++;
        }

        totalReach += reach;
        totalSaved += saved;
        // Se as shares forem suportadas/retornadas, soma
        totalShares += shares;

        postsWithInsights.push({
          id: media.id,
          caption: media.caption || '',
          mediaType: media.media_type,
          mediaUrl: media.media_url || null,
          permalink: media.permalink,
          likeCount: media.like_count || 0,
          commentCount: media.comments_count || 0,
          plays: media.media_type === 'VIDEO' ? (plays || reach) : 0,
          impressions: media.media_type !== 'VIDEO' ? impressions : 0,
          reach,
          saved,
          shares,
          timestamp: media.timestamp
        });
      }

      // 4. Calcular métricas consolidadas
      const postCount = mediaList.length || 1;
      const avgViews = videoCount > 0 ? Math.round(totalPlays / videoCount) : (postCount > 0 ? Math.round(totalReach / postCount) : 0);
      const reachLast30Days = totalReach;

      // Calcular taxa de engajamento média por post: ((likes + comments + saves + shares) / followers) * 100
      let avgEngagementPerPost = 0;
      if (followers > 0 && mediaList.length > 0) {
        const totalInteractions = sumLikes + sumComments + totalSaved + totalShares;
        avgEngagementPerPost = ((totalInteractions / mediaList.length) / followers) * 100;
      }

      // Limitar a taxa de engajamento a 2 casas decimais
      const engagementRate = Math.min(Math.round(avgEngagementPerPost * 100) / 100, 100);

      const insightsJson = {
        followers,
        avgViews,
        engagementRate,
        reachLast30Days,
        avgLikes: Math.round(sumLikes / postCount),
        avgComments: Math.round(sumComments / postCount),
        avgShares: Math.round(totalShares / postCount),
        avgSaves: Math.round(totalSaved / postCount),
        updatedAt: new Date().toISOString()
      };

      // 5. Salvar no Banco de Dados
      await prisma.influencerProfile.update({
        where: { id: influencerId },
        data: {
          profileImageUrl: profilePicture,
          verifiedMetrics: true,
          insights: JSON.stringify(insightsJson),
          topPosts: JSON.stringify(postsWithInsights)
        }
      });

      // Registrar o instantâneo de auditoria e disparar cálculo do InfluScore
      await AuditorService.syncInstagramMetrics(influencerId, {
        followers,
        engagementRate,
        reachLast30Days,
        avgViews
      });

      // Disparar geração da estratégia IA pós-sincronização de dados reais de forma assíncrona
      try {
        const { AIService } = require('./ai.service');
        AIService.generateWeeklyAnalysis(influencerId).catch((err: any) => {
          console.error('[INSTAGRAM_SYNC] Erro ao disparar análise pós-sync:', err);
        });
      } catch (requireErr) {
        console.error('[INSTAGRAM_SYNC] Erro ao carregar AIService dinamicamente:', requireErr);
      }

      console.log(`[INSTAGRAM_SYNC] Sincronização de ${username} finalizada com sucesso! Seguidores: ${followers}, Engajamento: ${engagementRate}%, Views: ${avgViews}`);

      return {
        success: true,
        username,
        followers,
        engagementRate,
        avgViews
      };
    } catch (err: any) {
      console.error('[INSTAGRAM_SYNC] Erro na sincronização real de dados:', err.response?.data || err.message);
      throw new Error(`Falha ao sincronizar métricas reais: ${err.message}`);
    }
  }
}
