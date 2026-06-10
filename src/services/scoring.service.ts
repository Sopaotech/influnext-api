import { prisma } from '../lib/prisma';
import { addNotificationJob } from '../queues/notification.queue';

export class ScoringService {
  /**
   * Cálculo matemático dinâmico do InfluScore
   * Pesos: Seguidores (30%), Engajamento (40%), Consistência (20%), Rating (10%)
   */
  /**
   * Cálculo matemático dinâmico e auditado do InfluScore.
   * Pesos: Nível de Seguidores Normalizado (25%), Engajamento por Nicho/Tamanho (45%),
   * Consistência/Missões (15%), Reputação/Ratings & Campanhas Concluídas (15%).
   * Contém fator redutor de autenticidade (penalização de seguidores falsos).
   */
  static calculate(followers: number, engagement: number, consistency: number, rating: number, completedContracts: number = 0): number {
    // 1. FScore: Normalização por Tier (evita penalizar micro-influenciadores de alto engajamento)
    let fScore = 0;
    if (followers <= 10000) {
      // Nano Tier (0 - 10k): peso máximo de 120
      fScore = Math.min(120, (followers / 10000) * 120);
    } else if (followers <= 100000) {
      // Micro Tier (10k - 100k): peso máximo de 180
      fScore = 120 + ((followers - 10000) / 90000) * 60;
    } else if (followers <= 1000000) {
      // Macro Tier (100k - 1M): peso máximo de 220
      fScore = 180 + ((followers - 100000) / 900000) * 40;
    } else {
      // Mega Tier (Acima de 1M): peso máximo de 250
      fScore = 220 + Math.min(30, (followers / 10000000) * 30);
    }

    // 2. EScore: Engajamento por Nicho/Tamanho (Meta ideal ajustada por Tier)
    let targetEngagement = 5.0; // Padrão Geral (5%)
    if (followers < 10000) targetEngagement = 8.0;      // Nano precisa de engajamento maior
    else if (followers < 100000) targetEngagement = 5.0; // Micro
    else if (followers < 1000000) targetEngagement = 3.0;// Macro
    else targetEngagement = 1.5;                         // Mega

    let baseEScore = Math.min(450, (engagement / targetEngagement) * 450);

    // Fator de Autenticidade (Anti-Followers Comprados)
    // Se a proporção de engajamento em relação aos seguidores for excessivamente baixa, penaliza
    // Exemplo: 100k seguidores com 0.1% de engajamento indica bots/seguidores comprados
    const ratio = (engagement * 10000) / (followers + 1);
    const authenticityFactor = Math.max(0.3, Math.min(1.0, ratio));
    const eScore = baseEScore * authenticityFactor;

    // 3. CScore: Consistência (base 0-1) - peso máximo de 150
    const cScore = consistency * 150;

    // 4. RScore: Reputação e Sucesso Comercial (Ratings & Contratos Concluídos) - peso máximo de 150
    const baseRatingScore = (rating / 5) * 100; // Máximo 100 pontos para nota
    const campaignBonus = Math.min(50, completedContracts * 10); // +10 pontos por contrato concluído (máx 50)
    const rScore = baseRatingScore + campaignBonus;

    // O score final é limitado a 1000 (sem contar o bônus semanal de trends)
    return Math.min(1000, Math.round(fScore + eScore + cScore + rScore));
  }

  static getTier(score: number): "BRONZE" | "SILVER" | "GOLD" | "ELITE" {
    if (score <= 300) return "BRONZE";
    if (score <= 600) return "SILVER";
    if (score <= 850) return "GOLD";
    return "ELITE";
  }

  /**
   * Recalcula o score baseado nos dados atuais do banco e persiste
   */
  static async calculateAndPersist(influencerId: string): Promise<void> {
    const [latestMetric, completedContracts, profile] = await Promise.all([
      prisma.metricSnapshot.findFirst({
        where:   { influencerId },
        orderBy: { capturedAt: 'desc' },
      }),
      prisma.contract.count({
        where: { influencerId, escrowStatus: 'COMPLETED' },
      }),
      prisma.influencerProfile.findUnique({
        where:  { id: influencerId },
        select: { influScore: true, scoreClass: true, userId: true },
      }),
    ]);

    if (!profile) return;

    // Se não houver métricas reais registradas ainda, usamos baseline mínimo
    const followers = latestMetric?.followers || 1000;
    const engagement = latestMetric?.engagementRate || 2.5;

    // Baseline para novas contas até que dados históricos de contratos sejam acumulados
    const consistency = 1.0; // Baseline: 100% (Novos usuários começam com reputação limpa)
    const rating      = 5.0; // Baseline: 5.0 estrelas

    let score = this.calculate(
      followers,
      engagement,
      consistency,
      rating,
      completedContracts
    );

    // Bônus Trend Seeker (+50 se fizer posts de trends)
    const trendBonus = await this.calculateTrendSeekerBonus(influencerId);
    score += trendBonus;

    const scoreClass = this.getTier(score);
    const prevClass  = profile.scoreClass;

    await prisma.influencerProfile.update({
      where: { id: influencerId },
      data:  { influScore: score, scoreClass },
    });

    // Notifica se houve upgrade de nível
    if (scoreClass !== prevClass) {
      await addNotificationJob(
        profile.userId,
        `🏆 Evolução de Carreira! Você atingiu o nível ${scoreClass} com ${score} pontos.`,
        'SCORE_UPGRADE'
      );
    }
  }

  /**
   * Bônus Trend Seeker: +50 pontos se postou 3 trends sugeridos na semana
   */
  static async calculateTrendSeekerBonus(influencerId: string): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const aiTasksCompletedThisWeek = await prisma.task.count({
      where: {
        influencerId,
        fromAI: true,
        isDone: true,
        scheduledDate: { gte: oneWeekAgo }
      }
    });

    return aiTasksCompletedThisWeek >= 3 ? 50 : 0;
  }
}
