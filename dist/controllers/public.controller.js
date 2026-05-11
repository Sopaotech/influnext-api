"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getPublicProfile = async (req, res) => {
    try {
        const { handle } = req.params;
        // A restrição `select` age como barreira contra Sensitive Data Exposure
        const profile = await prisma.influencerProfile.findUnique({
            where: { handle },
            select: {
                id: true,
                handle: true,
                profileImageUrl: true,
                influScore: true,
                scoreClass: true,
                verifiedMetrics: true,
                niche: true,
                // Hiper-Localismo: exibido no perfil público
                city: true,
                state: true,
                bio: true,
                // Buscamos apenas o último snapshot de métricas auditadas
                metricsHistory: {
                    take: 1,
                    orderBy: { capturedAt: 'desc' },
                    select: {
                        followers: true,
                        engagementRate: true,
                        reachLast30Days: true,
                        avgViews: true,
                        capturedAt: true
                    }
                },
                // Buscamos as redes conectadas para mostrar os ícones, sem vazar AccessTokens
                platforms: {
                    select: { platformName: true, platformId: true }
                },
                // Buscamos as provas de ROI (Tasks da IA concluídas com performance medida)
                tasks: {
                    where: {
                        fromAI: true,
                        isDone: true,
                        performanceMultiplier: { not: null }
                    },
                    orderBy: { scheduledDate: 'desc' },
                    take: 5,
                    select: {
                        title: true,
                        proofUrl: true,
                        performanceMultiplier: true
                    }
                }
            }
        });
        if (!profile) {
            res.status(404).json({ error: "Influenciador não encontrado ou perfil privado." });
            return;
        }
        // Calcula a média de ROI
        const avgROI = profile.tasks.length > 0
            ? profile.tasks.reduce((acc, t) => acc + (t.performanceMultiplier || 1), 0) / profile.tasks.length
            : 1.0;
        res.status(200).json({
            ...profile,
            avgROI: Number(avgROI.toFixed(2))
        });
    }
    catch (error) {
        console.error('[PUBLIC] Erro ao carregar Media Kit:', error);
        res.status(500).json({ error: "Erro ao carregar Media Kit." });
    }
};
exports.getPublicProfile = getPublicProfile;
