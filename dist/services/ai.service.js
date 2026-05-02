"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const prisma_1 = require("../lib/prisma");
class AIService {
    /**
     * Simula a análise de inteligência baseada nas métricas do influenciador.
     */
    static analyzeMetrics(metrics, influencerHandle) {
        const { followers, engagementRate, avgViews } = metrics;
        let insight = "";
        const actionPlan = [];
        if (engagementRate > 4) {
            insight = `🚀 @${influencerHandle}, seu engajamento de ${engagementRate}% está explodindo! O algoritmo está favorecendo seu conteúdo.`;
            actionPlan.push("Postar um carrossel educativo hoje para reter a nova audiência.");
            actionPlan.push("Abrir uma caixa de perguntas nos Stories para converter seguidores em fãs.");
        }
        else {
            insight = `💡 @${influencerHandle}, observamos uma leve queda no alcance. Sugerimos focar em Reels curtos com áudios em alta.`;
            actionPlan.push("Publicar 3 Reels com menos de 15 segundos nos próximos 2 dias.");
            actionPlan.push("Interagir com os comentários dos últimos 5 posts.");
        }
        if (avgViews > followers * 0.2) {
            actionPlan.push("Ótimo momento para fechar parcerias de conversão (ROI alto).");
        }
        else {
            actionPlan.push("Focar em SEO de legenda para aumentar a descoberta via busca.");
        }
        return {
            dailyInsight: insight,
            actionPlan: actionPlan.slice(0, 3)
        };
    }
    /**
     * Gera uma recomendação semanal baseada na evolução do InfluScore
     */
    static getWeeklyStrategy(currentScore) {
        if (currentScore > 800) {
            return "Sua autoridade no nicho é de elite. Recomendamos aumentar seu 'Rate Card' em 15% para novos contratos.";
        }
        return "Foque em consistência de postagem. Influenciadores que postam 5x por semana sobem de nível 3x mais rápido.";
    }
    /**
     * Gera e salva uma nova análise semanal no banco de dados.
     */
    static async generateWeeklyAnalysis(influencerId) {
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({
            where: { id: influencerId },
            include: { metricsHistory: { take: 1, orderBy: { capturedAt: 'desc' } } }
        });
        if (!influencer)
            throw new Error("Influenciador não encontrado.");
        const latestMetrics = influencer.metricsHistory[0];
        const strategy = this.getWeeklyStrategy(influencer.influScore);
        const insight = latestMetrics ? this.analyzeMetrics(latestMetrics, influencer.handle).dailyInsight : "Comece a postar para gerar dados.";
        const analysis = await prisma_1.prisma.aIAnalysis.create({
            data: {
                influencerId,
                analysisText: `${insight}\n\nEstratégia: ${strategy}`,
                recommendations: JSON.stringify(["Otimizar biografia", "Consistência nos Stories", "Analisar retenção"])
            }
        });
        return analysis;
    }
    /**
     * Busca a análise mais recente do banco de dados.
     */
    static async getLatestAnalysis(influencerId) {
        const analysis = await prisma_1.prisma.aIAnalysis.findFirst({
            where: { influencerId },
            orderBy: { generatedAt: 'desc' }
        });
        if (analysis && analysis.recommendations) {
            try {
                return {
                    ...analysis,
                    recommendations: JSON.parse(analysis.recommendations)
                };
            }
            catch {
                return {
                    ...analysis,
                    recommendations: []
                };
            }
        }
        return analysis;
    }
}
exports.AIService = AIService;
