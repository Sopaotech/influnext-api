"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_service_1 = require("../services/ai.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Gerar nova análise semanal
router.post('/generate', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!profile) {
            res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
            return;
        }
        const result = await ai_service_1.AIService.generateWeeklyAnalysis(profile.id);
        res.status(201).json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao gerar análise.';
        res.status(500).json({ error: message });
    }
});
// Buscar análise mais recente
router.get('/latest', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!profile) {
            res.status(404).json({ error: 'Perfil não encontrado.' });
            return;
        }
        const analysis = await ai_service_1.AIService.getLatestAnalysis(profile.id);
        res.json(analysis ?? { analysisText: null, recommendations: [] });
    }
    catch {
        res.status(500).json({ error: 'Erro ao buscar análise.' });
    }
});
// Interagir com o Mentor IA
router.post('/chat', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { message } = req.body;
        if (!message) {
            res.status(400).json({ error: 'Mensagem é obrigatória.' });
            return;
        }
        const profile = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!profile) {
            res.status(404).json({ error: 'Apenas influenciadores têm acesso ao mentor.' });
            return;
        }
        const reply = await ai_service_1.AIService.chatWithMentor(profile.id, message);
        res.json({ reply });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro no chat com Mentor.';
        res.status(500).json({ error: errorMsg });
    }
});
// Gerar Briefing de Campanha (para Empresas)
router.post('/generate-briefing', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { influencerHandle, campaignTitle } = req.body;
        if (!influencerHandle || !campaignTitle) {
            res.status(400).json({ error: 'Handle do influenciador e título da campanha são obrigatórios.' });
            return;
        }
        const briefing = await ai_service_1.AIService.generateCampaignBriefing(influencerHandle, campaignTitle);
        res.json({ briefing });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao gerar briefing.';
        res.status(500).json({ error: errorMsg });
    }
});
exports.default = router;
