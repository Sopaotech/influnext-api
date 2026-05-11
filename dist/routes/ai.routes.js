"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_service_1 = require("../services/ai.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Gerar nova análise semanal
router.post('/generate', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const profile = await prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });
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
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const profile = await prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });
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
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const profile = await prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });
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
