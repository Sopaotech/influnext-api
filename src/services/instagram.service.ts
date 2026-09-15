import axios from 'axios';
import { prisma } from '../lib/prisma';
import { AuditorService } from './auditor.service';
import { sanitizeProviderError } from '../utils/provider-error';
import { classifyInstagramSyncFailure, InstagramSyncOperationalError } from '../utils/instagram-sync-error';

/**
 * InstagramService — Integração com Instagram API with Instagram Login
 *
 * IMPORTANTE (atualizado em julho/2026):
 * Este serviço usa o caminho "Instagram API with Instagram Login" (Business Login for Instagram),
 * que permite autenticação direta via conta Instagram Profissional (Creator ou Business).
 *
 * ❌ NÃO usamos mais: Meta Graph API com /me/accounts (Páginas do Facebook vinculadas)
 * ✅ USAMOS AGORA: API direta com escopos instagram_business_basic
 *
 * Pré-requisito para o usuário: conta Instagram do tipo Creator ou Business.
 * O onboarding inclui um tutorial em 3 passos para a conversão (via InstagramOnboardingModal.tsx).
 *
 * Documentação oficial Meta:
 * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */
export class InstagramService {
  // Endpoint base do Instagram API with Instagram Login (não usa graph.facebook.com)
  private static readonly IG_API_BASE = 'https://graph.instagram.com';
  // Endpoint de troca de código → token (fluxo OAuth direto do Instagram)
  private static readonly TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
  // Endpoint de renovação de token de longa duração
  private static readonly LONG_LIVED_TOKEN_URL = 'https://graph.instagram.com/access_token';

  /**
   * PASSO 1 do fluxo OAuth:
   * Gera a URL de autorização para redirecionar o criador ao Instagram.
   * O usuário autoriza, o Instagram retorna um "code" para a redirectUri.
   */
  static buildAuthorizationUrl(redirectUri: string): string {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    if (!clientId) {
      throw new Error('INSTAGRAM_CLIENT_ID não configurado no .env');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'instagram_business_basic,instagram_business_manage_messages',
      response_type: 'code',
    });

    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * PASSO 2 do fluxo OAuth:
   * Troca o código de autorização (curta duração) por um token de acesso.
   * Em seguida, troca o token curto por um Long-Lived Token (60 dias de validade).
   */
  static async exchangeCodeForToken(code: string, redirectUri: string) {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('INSTAGRAM_CLIENT_ID ou INSTAGRAM_CLIENT_SECRET não configurados no .env');
    }

    try {
      // Passo 2a: Trocar código pelo Token de curta duração via Instagram OAuth
      const formData = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      });

      const shortTokenRes = await axios.post(this.TOKEN_URL, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const shortToken: string = shortTokenRes.data.access_token;
      const igUserId: string = String(shortTokenRes.data.user_id);

      // Passo 2b: Trocar token curto por Long-Lived Token (60 dias)
      const longTokenRes = await axios.get(this.LONG_LIVED_TOKEN_URL, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: clientSecret,
          access_token: shortToken,
        },
      });

      return {
        accessToken: longTokenRes.data.access_token || shortToken,
        expiresIn: longTokenRes.data.expires_in || 5184000, // 60 dias em segundos
        platformId: igUserId, // ID único do usuário no Instagram
      };
    } catch (error: any) {
      console.error('[INSTAGRAM SERVICE] Erro ao trocar código por token:', sanitizeProviderError(error));
      throw new Error('Falha na autenticação com Instagram. Verifique se a conta é do tipo Creator ou Business.');
    }
  }

  /**
   * Renova um Long-Lived Token antes da expiração (60 dias).
   * Deve ser chamado proativamente (ex: a cada 45 dias via cron job).
   */
  static async refreshLongLivedToken(accessToken: string) {
    try {
      const res = await axios.get(`${this.IG_API_BASE}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken,
        },
      });
      return {
        accessToken: res.data.access_token,
        expiresIn: res.data.expires_in || 5184000,
      };
    } catch (error: any) {
      console.error('[INSTAGRAM SERVICE] Erro ao renovar token:', sanitizeProviderError(error));
      throw new Error('Falha ao renovar token do Instagram. O usuário precisa reconectar a conta.');
    }
  }

  /**
   * Busca dados básicos do perfil usando o token de acesso.
   * Utiliza o escopo instagram_business_basic (sem necessidade de Página do Facebook).
   * Retorna: ID, username, nome, foto de perfil, contagem de seguidores e publicações.
   */
  static async fetchProfileData(accessToken: string) {
    try {
      const res = await axios.get(`${this.IG_API_BASE}/me`, {
        params: {
          fields: 'id,username,name,profile_picture_url,followers_count,media_count,biography,website',
          access_token: accessToken,
        },
      });
      return res.data;
    } catch (error: any) {
      console.error('[INSTAGRAM SERVICE] Erro ao buscar perfil:', sanitizeProviderError(error));
      throw new Error('Falha ao obter dados do perfil. Verifique se a conta Instagram é do tipo Creator ou Business.');
    }
  }

  /**
   * Sincroniza dados e métricas reais do Instagram para o Influenciador.
   * Usa o ID do usuário Instagram diretamente (não mais o igBusinessId vinculado ao Facebook).
   *
   * @param influencerId — ID do influenciador no banco de dados (InfluencerProfile.id)
   * @param accessToken  — Long-Lived Token do Instagram do criador
   * @param igUserId     — ID do usuário no Instagram (retornado no exchangeCodeForToken)
   */
  static async syncInstagramData(influencerId: string, accessToken: string, igUserId: string) {
    console.log(`[INSTAGRAM_SYNC] Iniciando sincronização para influenciador: ${influencerId}, IG User ID: ${igUserId}`);

    try {
      const connectedPlatform = await prisma.socialPlatform.findUnique({
        where: {
          influencerId_platformName: { influencerId, platformName: 'INSTAGRAM' },
        },
        select: { isActive: true },
      });

      if (!connectedPlatform?.isActive) {
        throw new Error('A conta Instagram não está conectada ou ativa.');
      }

      // 1. Buscar informações básicas do perfil do criador via Instagram API
      const profileRes = await axios.get(`${this.IG_API_BASE}/${igUserId}`, {
        params: {
          fields: 'id,username,name,profile_picture_url,followers_count,media_count,biography',
          access_token: accessToken,
        },
      });

      const profileData = profileRes.data;
      if (!profileData?.id || String(profileData.id) !== String(igUserId)) {
        throw new Error('O perfil retornado pelo Instagram não corresponde à conta conectada.');
      }

      const username = typeof profileData.username === 'string' ? profileData.username.trim() : '';
      if (!username) {
        throw new Error('O Instagram não retornou um username válido para a conta conectada.');
      }

      if (!Number.isFinite(profileData.followers_count) || profileData.followers_count < 0) {
        throw new Error('O Instagram não retornou uma contagem de seguidores válida.');
      }

      const followers = Math.trunc(profileData.followers_count);
      const profilePicture = profileData.profile_picture_url || null;

      // 2. Buscar as últimas 15 mídias do usuário
      const mediaRes = await axios.get(`${this.IG_API_BASE}/${igUserId}/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp',
          limit: 15,
          access_token: accessToken,
        },
      });

      const retrievedMedia = Array.isArray(mediaRes.data?.data) ? mediaRes.data.data : [];
      const collectedAt = new Date();
      const thirtyDaysAgo = new Date(collectedAt.getTime() - 30 * 24 * 60 * 60 * 1000);
      const mediaList = retrievedMedia.filter((media: any) => {
        const timestamp = new Date(media.timestamp);
        return Number.isFinite(timestamp.getTime()) && timestamp >= thirtyDaysAgo && timestamp <= collectedAt;
      });

      await prisma.socialPlatform.update({
        where: {
          influencerId_platformName: { influencerId, platformName: 'INSTAGRAM' },
        },
        data: {
          username,
          profilePicture,
          followersCount: followers,
        },
      });

      if (mediaList.length === 0) {
        await prisma.influencerProfile.update({
          where: { id: influencerId },
          data: {
            profileImageUrl: profilePicture,
            verifiedMetrics: false,
          },
        });

        return {
          success: true,
          snapshotCreated: false,
          reason: 'no_recent_media',
          username,
          followers,
        };
      }

      const postsWithInsights = [];

      let totalPlays = 0;
      let totalImpressions = 0;
      let totalReach = 0;
      let totalSaved = 0;
      let totalShares = 0;
      let videoCount = 0;

      let sumLikes = 0;
      let sumComments = 0;
      let primaryInsightCount = 0;
      let fallbackInsightCount = 0;
      let unavailableInsightCount = 0;

      // 3. Iterar e obter insights de engajamento por publicação
      for (const media of mediaList) {
        sumLikes += media.like_count || 0;
        sumComments += media.comments_count || 0;

        let plays = 0;
        let impressions = 0;
        let reach = 0;
        let saved = 0;
        let shares = 0;
        let insightStatus: 'complete' | 'fallback' | 'unavailable' = 'complete';

        try {
          let metricsQuery = '';
          if (media.media_type === 'VIDEO' || media.media_type === 'REELS') {
            metricsQuery = 'plays,reach,saved,shares';
          } else {
            metricsQuery = 'impressions,reach,saved';
          }

          const insightsRes = await axios.get(`${this.IG_API_BASE}/${media.id}/insights`, {
            params: {
              metric: metricsQuery,
              access_token: accessToken,
            },
          });

          const insightsData = insightsRes.data.data || [];

          if (insightsData.length === 0) {
            throw new Error('O Instagram não retornou insights para a mídia.');
          }

          insightsData.forEach((item: any) => {
            const val = item.values?.[0]?.value || item.value || 0;
            if (item.name === 'plays') plays = val;
            if (item.name === 'impressions') impressions = val;
            if (item.name === 'reach') reach = val;
            if (item.name === 'saved') saved = val;
            if (item.name === 'shares') shares = val;
          });
          primaryInsightCount++;

        } catch {
          console.warn('[INSTAGRAM_SYNC] Insights indisponíveis para uma mídia; o snapshot será marcado como parcial.');
          insightStatus = 'fallback';

          if (media.media_type === 'VIDEO' || media.media_type === 'REELS') {
            try {
              const fallbackRes = await axios.get(`${this.IG_API_BASE}/${media.id}/insights`, {
                params: {
                  metric: 'reach,saved',
                  access_token: accessToken,
                },
              });
              const fallbackInsights = fallbackRes.data.data || [];
              if (fallbackInsights.length === 0) {
                throw new Error('O fallback de insights não retornou dados.');
              }
              fallbackInsights.forEach((item: any) => {
                const val = item.values?.[0]?.value || item.value || 0;
                if (item.name === 'reach') reach = val;
                if (item.name === 'saved') saved = val;
              });
              fallbackInsightCount++;
            } catch (_) {
              insightStatus = 'unavailable';
              unavailableInsightCount++;
            }
          } else {
            insightStatus = 'unavailable';
            unavailableInsightCount++;
          }
        }

        if (media.media_type === 'VIDEO' || media.media_type === 'REELS') {
          totalPlays += plays || reach;
          videoCount++;
        } else {
          totalImpressions += impressions;
        }

        totalReach += reach;
        totalSaved += saved;
        totalShares += shares;

        postsWithInsights.push({
          id: media.id,
          caption: media.caption || '',
          mediaType: media.media_type,
          mediaUrl: media.media_url || null,
          permalink: media.permalink,
          likeCount: media.like_count || 0,
          commentCount: media.comments_count || 0,
          plays: (media.media_type === 'VIDEO' || media.media_type === 'REELS') ? (plays || reach) : 0,
          impressions: (media.media_type === 'IMAGE' || media.media_type === 'CAROUSEL_ALBUM') ? impressions : 0,
          reach,
          saved,
          shares,
          insightStatus,
          timestamp: media.timestamp,
        });
      }

      // 4. Calcular métricas consolidadas
      const postCount = mediaList.length || 1;
      const avgViews = videoCount > 0
        ? Math.round(totalPlays / videoCount)
        : Math.round(totalReach / postCount);
      const reachLast30Days = totalReach;

      let avgEngagementPerPost = 0;
      if (followers > 0 && mediaList.length > 0) {
        const totalInteractions = sumLikes + sumComments + totalSaved + totalShares;
        avgEngagementPerPost = ((totalInteractions / mediaList.length) / followers) * 100;
      }

      const engagementRate = Math.min(Math.round(avgEngagementPerPost * 100) / 100, 100);
      const isPartial = fallbackInsightCount > 0 || unavailableInsightCount > 0;
      const collection = {
        schemaVersion: 'instagram_recent_media_snapshot_v1',
        scope: 'recent_media_sample_30d',
        mediaLimit: 15,
        mediaRetrieved: retrievedMedia.length,
        sampledMediaCount: mediaList.length,
        skippedOutsideWindowCount: retrievedMedia.length - mediaList.length,
        primaryInsightCount,
        fallbackInsightCount,
        unavailableInsightCount,
        isPartial,
        reachDefinition: 'sum_of_available_media_reach_for_sampled_posts_within_30_days',
        collectedAt: collectedAt.toISOString(),
      };

      const insightsJson = {
        followers,
        avgViews,
        engagementRate,
        reachLast30Days,
        avgLikes: Math.round(sumLikes / postCount),
        avgComments: Math.round(sumComments / postCount),
        avgShares: Math.round(totalShares / postCount),
        avgSaves: Math.round(totalSaved / postCount),
        updatedAt: collectedAt.toISOString(),
        // Registra a versão da API usada para auditoria futura
        apiVersion: 'instagram_api_with_instagram_login_v1',
        instagramMetricCollection: collection,
      };

      // 5. Persistir no banco de dados
      await prisma.influencerProfile.update({
        where: { id: influencerId },
        data: {
          profileImageUrl: profilePicture,
          verifiedMetrics: false,
          insights: insightsJson as any,
          topPosts: postsWithInsights as any,
        },
      });

      // 6. Registrar snapshot de auditoria e recalcular InfluScore
      const snapshot = await AuditorService.syncMetrics(influencerId, 'INSTAGRAM', {
        followers,
        engagementRate,
        reachLast30Days,
        avgViews,
      });

      await prisma.influencerProfile.update({
        where: { id: influencerId },
        data: { verifiedMetrics: true },
      });

      // 7. Disparar geração de análise semanal pela IA (assíncrono — não bloqueia a resposta)
      try {
        const { AIService } = require('./ai.service');
        if (AIService?.generateWeeklyAnalysis) {
          Promise.resolve(AIService.generateWeeklyAnalysis(influencerId)).catch((err: any) => {
            console.error('[INSTAGRAM_SYNC] Erro ao disparar análise pós-sync:', err);
          });
        }
      } catch (requireErr) {
        console.error('[INSTAGRAM_SYNC] Erro ao carregar AIService dinamicamente:', requireErr);
      }

      console.log(`[INSTAGRAM_SYNC] ✅ Sincronização de @${username} finalizada! Seguidores: ${followers}, Engajamento: ${engagementRate}%, Views médias: ${avgViews}`);

      return {
        success: true,
        snapshotCreated: true,
        username,
        followers,
        engagementRate,
        avgViews,
        collection,
        snapshotId: snapshot.id,
      };
    } catch (err: any) {
      console.error('[INSTAGRAM_SYNC] ❌ Erro na sincronização:', sanitizeProviderError(err));
      throw new InstagramSyncOperationalError(classifyInstagramSyncFailure(err));
    }
  }
}
