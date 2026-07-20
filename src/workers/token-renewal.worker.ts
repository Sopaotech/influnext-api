import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { InstagramService } from '../services/instagram.service';
import { TikTokService } from '../services/tiktok.service';
import { addNotificationJob } from '../queues/notification.queue';
import { createRedisClient } from '../lib/redis';

const prisma = new PrismaClient();
const redisConnection = createRedisClient();

export const runTokenRenewalLogic = async () => {
  console.log('[TOKEN_RENEWAL] Iniciando verificação de renovação de tokens...');

  // 1. TikTok: Tokens expiram a cada 24 horas (expiresAt próximo ou nulo/indefinido)
  // Vamos buscar plataformas do TikTok ativas que expiram nas próximas 6 horas, ou que estejam sem data de expiração mas tenham um refreshToken.
  const now = new Date();
  const next6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tiktokPlatforms = await prisma.socialPlatform.findMany({
    where: {
      platformName: 'TIKTOK',
      isActive: true,
      refreshToken: { not: null },
      OR: [
        { expiresAt: { lt: next6Hours } },
        { expiresAt: null }
      ]
    }
  });

  console.log(`[TOKEN_RENEWAL] Encontradas ${tiktokPlatforms.length} contas TikTok qualificadas para renovação.`);

  for (const platform of tiktokPlatforms) {
    try {
      console.log(`[TOKEN_RENEWAL] Renovando token do TikTok para o influenciador ID: ${platform.influencerId} (@${platform.username})`);
      const refreshResult = await TikTokService.refreshAccessToken(platform.refreshToken!);
      
      const ttExpiresIn = refreshResult.expiresIn || 86400;
      const ttExpiresAt = new Date(Date.now() + ttExpiresIn * 1000);

      await prisma.socialPlatform.update({
        where: { id: platform.id },
        data: {
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
          expiresAt: ttExpiresAt
        }
      });
      console.log(`[TOKEN_RENEWAL] ✅ Token do TikTok renovado com sucesso para @${platform.username}.`);
    } catch (err: any) {
      console.error(`[TOKEN_RENEWAL] ❌ Erro ao renovar TikTok para @${platform.username}:`, err.message);
    }
  }

  // 2. Instagram API with Instagram Login: Long-Lived Tokens expiram em 60 dias.
  // Busca tokens ativos do Instagram que expiram em menos de 15 dias para renovação pró-ativa.
  const next15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  
  const instagramPlatforms = await prisma.socialPlatform.findMany({
    where: {
      platformName: 'INSTAGRAM',
      isActive: true,
      expiresAt: { lt: next15Days, gt: now } // ativo, com expiração em menos de 15 dias mas ainda não expirado
    },
    include: {
      influencer: {
        select: {
          userId: true
        }
      }
    }
  });

  console.log(`[TOKEN_RENEWAL] Encontradas ${instagramPlatforms.length} contas Instagram qualificadas para análise/renovação.`);

  for (const platform of instagramPlatforms) {
    try {
      // Se for um token simulado, ignora
      if (platform.accessToken.startsWith('simulated_')) {
        continue;
      }

      console.log(`[TOKEN_RENEWAL] Tentando renovar token do Instagram para o influenciador ID: ${platform.influencerId} (@${platform.username})`);
      
      try {
        const refreshResult = await InstagramService.refreshLongLivedToken(platform.accessToken);
        const expiresAtNew = new Date(Date.now() + refreshResult.expiresIn * 1000);

        await prisma.socialPlatform.update({
          where: { id: platform.id },
          data: {
            accessToken: refreshResult.accessToken,
            expiresAt: expiresAtNew
          }
        });
        console.log(`[TOKEN_RENEWAL] ✅ Token do Instagram (Creator API) renovado com sucesso para @${platform.username}.`);
      } catch (refreshErr: any) {
        // Se falhar (token inválido ou expirado), dispara notificação para o criador reconectar
        console.warn(`[TOKEN_RENEWAL] Falha no refresh do token Instagram para @${platform.username}. Disparando notificação preventiva.`);
        
        const remainingDays = Math.ceil((platform.expiresAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        await prisma.notification.create({
          data: {
            userId: platform.influencer.userId,
            message: `Atenção: A conexão com seu Instagram (@${platform.username}) expira em ${remainingDays} dias. Por favor, acesse as Configurações e reconecte seu perfil para manter suas métricas atualizadas.`,
            type: 'TOKEN_EXPIRING'
          }
        });

        await addNotificationJob(
          platform.influencer.userId,
          `Atenção: A conexão com seu Instagram (@${platform.username}) expira em ${remainingDays} dias. Por favor, reconecte seu perfil no painel.`,
          'TOKEN_EXPIRING'
        );
      }
    } catch (err: any) {
      console.error(`[TOKEN_RENEWAL] ❌ Erro ao processar Instagram para @${platform.username}:`, err.message);
    }
  }
};

export const tokenRenewalWorker = new Worker(
  'token-renewal-tasks',
  async (job) => {
    if (job.name === 'daily-token-renewal') {
      await runTokenRenewalLogic();
    }
  },
  { connection: redisConnection }
);
