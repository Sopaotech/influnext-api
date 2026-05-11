"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectedPlatforms = exports.handleTikTokCallback = exports.handleInstagramCallback = exports.getAuthUrls = void 0;
const prisma_1 = require("../lib/prisma");
const scoring_service_1 = require("../services/scoring.service");
// O scoring service é usado para calcular a autoridade do influenciador após a conexão
const getAuthUrls = async (req, res) => {
    const instagramUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_API_URL}/integrations/instagram/callback&scope=user_profile,user_media&response_type=code`;
    const tiktokUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${process.env.NEXT_PUBLIC_API_URL}/integrations/tiktok/callback`;
    res.json({
        instagram: instagramUrl,
        tiktok: tiktokUrl
    });
};
exports.getAuthUrls = getAuthUrls;
const handleInstagramCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            res.status(400).json({ error: "Código de autorização ausente." });
            return;
        }
        // Mock do processo de troca de token (em produção faria um fetch para a API do Meta)
        console.log(`[INTEGRATION] Recebido código Instagram: ${code}`);
        // Buscar perfil do influenciador (em produção usaria req.user.id)
        const userId = req.user?.id;
        if (!userId) {
            res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error&error=auth`);
            return;
        }
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({
            where: { userId }
        });
        if (influencer) {
            // Salva a conexão (Mockando dados do perfil vindo da API)
            await prisma_1.prisma.socialPlatform.upsert({
                where: {
                    influencerId_platformName: {
                        influencerId: influencer.id,
                        platformName: 'INSTAGRAM'
                    }
                },
                create: {
                    influencerId: influencer.id,
                    platformName: 'INSTAGRAM',
                    platformId: `ig_${Math.random().toString(36).substr(2, 9)}`,
                    username: `${influencer.handle}_ig`,
                    accessToken: `mock_at_${Math.random().toString(36).substr(2, 20)}`,
                    isActive: true
                },
                update: {
                    isActive: true,
                    accessToken: `mock_at_${Math.random().toString(36).substr(2, 20)}`
                }
            });
            // Gatilho imediato de InfluScore
            await scoring_service_1.ScoringService.calculateAndPersist(influencer.id);
            console.log(`[INTEGRATION] InfluScore recalculado para ${influencer.id}`);
        }
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=success&platform=instagram`);
    }
    catch (error) {
        console.error('[INSTAGRAM] Erro no callback:', error);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error`);
    }
};
exports.handleInstagramCallback = handleInstagramCallback;
const handleTikTokCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            res.status(400).json({ error: "Código de autorização ausente." });
            return;
        }
        console.log(`[INTEGRATION] Recebido código TikTok: ${code}`);
        const userId = req.user?.id;
        if (!userId) {
            res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error&error=auth`);
            return;
        }
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({
            where: { userId }
        });
        if (influencer) {
            await prisma_1.prisma.socialPlatform.upsert({
                where: {
                    influencerId_platformName: {
                        influencerId: influencer.id,
                        platformName: 'TIKTOK'
                    }
                },
                create: {
                    influencerId: influencer.id,
                    platformName: 'TIKTOK',
                    platformId: `tt_${Math.random().toString(36).substr(2, 9)}`,
                    username: `${influencer.handle}_tt`,
                    accessToken: `mock_at_${Math.random().toString(36).substr(2, 20)}`,
                    isActive: true
                },
                update: {
                    isActive: true,
                    accessToken: `mock_at_${Math.random().toString(36).substr(2, 20)}`
                }
            });
            await scoring_service_1.ScoringService.calculateAndPersist(influencer.id);
            console.log(`[INTEGRATION] InfluScore recalculado para ${influencer.id}`);
        }
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=success&platform=tiktok`);
    }
    catch (error) {
        console.error('[TIKTOK] Erro no callback:', error);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error`);
    }
};
exports.handleTikTokCallback = handleTikTokCallback;
const getConnectedPlatforms = async (req, res) => {
    try {
        const userId = req.user.id;
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({
            where: { userId },
            include: { platforms: true }
        });
        if (!influencer) {
            res.status(404).json({ error: "Perfil não encontrado." });
            return;
        }
        res.json(influencer.platforms);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar plataformas." });
    }
};
exports.getConnectedPlatforms = getConnectedPlatforms;
