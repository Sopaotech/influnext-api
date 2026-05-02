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
                handle: true,
                verifiedMetrics: true,
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
                }
            }
        });
        if (!profile) {
            res.status(404).json({ error: "Influenciador não encontrado ou perfil privado." });
            return;
        }
        res.status(200).json(profile);
    }
    catch (error) {
        console.error('[PUBLIC] Erro ao carregar Media Kit:', error);
        res.status(500).json({ error: "Erro ao carregar Media Kit." });
    }
};
exports.getPublicProfile = getPublicProfile;
