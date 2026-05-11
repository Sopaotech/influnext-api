"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringService = void 0;
const prisma_1 = require("../lib/prisma");
const notification_queue_1 = require("../queues/notification.queue");
class ScoringService {
    /**
     * Cálculo matemático dinâmico do InfluScore
     * Pesos: Seguidores (30%), Engajamento (40%), Consistência (20%), Rating (10%)
     */
    static calculate(followers, engagement, consistency, rating) {
        // fScore: Logarítmico (valoriza crescimento orgânico em diferentes escalas)
        const fScore = Math.min(300, (Math.log10(followers + 1) / 6) * 300); // 30% do total (1000)
        // eScore: Linear baseado em 5% como meta ideal
        const eScore = Math.min(400, (engagement / 5) * 400); // 40% do total
        // cScore: Consistência (base 0-1)
        const cScore = consistency * 200; // 20% do total
        // rScore: Rating (base 0-5)
        const rScore = (rating / 5) * 100; // 10% do total
        return Math.round(fScore + eScore + cScore + rScore);
    }
    static getTier(score) {
        if (score <= 300)
            return "BRONZE";
        if (score <= 600)
            return "SILVER";
        if (score <= 850)
            return "GOLD";
        return "ELITE";
    }
    /**
     * Recalcula o score baseado nos dados atuais do banco e persiste
     */
    static async calculateAndPersist(influencerId) {
        const [latestMetric, completedContracts, profile] = await Promise.all([
            prisma_1.prisma.metricSnapshot.findFirst({
                where: { influencerId },
                orderBy: { capturedAt: 'desc' },
            }),
            prisma_1.prisma.contract.count({
                where: { influencerId, escrowStatus: 'COMPLETED' },
            }),
            prisma_1.prisma.influencerProfile.findUnique({
                where: { id: influencerId },
                select: { influScore: true, scoreClass: true, userId: true },
            }),
        ]);
        if (!latestMetric || !profile)
            return;
        // Baseline para novas contas até que dados históricos de contratos sejam acumulados
        const consistency = 1.0; // Baseline: 100% (Novos usuários começam com reputação limpa)
        const rating = 5.0; // Baseline: 5.0 estrelas
        let score = this.calculate(latestMetric.followers, latestMetric.engagementRate, consistency, rating);
        // Bônus Trend Seeker
        const trendBonus = await this.calculateTrendSeekerBonus(influencerId);
        score += trendBonus;
        const scoreClass = this.getTier(score);
        const prevClass = profile.scoreClass;
        await prisma_1.prisma.influencerProfile.update({
            where: { id: influencerId },
            data: { influScore: score, scoreClass },
        });
        // Notifica se houve upgrade de nível
        if (scoreClass !== prevClass) {
            await (0, notification_queue_1.addNotificationJob)(profile.userId, `🏆 Evolução de Carreira! Você atingiu o nível ${scoreClass} com ${score} pontos.`, 'SCORE_UPGRADE');
        }
    }
    /**
     * Bônus Trend Seeker: +50 pontos se postou 3 trends sugeridos na semana
     */
    static async calculateTrendSeekerBonus(influencerId) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const aiTasksCompletedThisWeek = await prisma_1.prisma.task.count({
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
exports.ScoringService = ScoringService;
