"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const influencer_controller_1 = require("../controllers/influencer.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Busca pública (usada pelo Marketplace — autenticados via token)
router.get('/search', auth_middleware_1.authenticate, influencer_controller_1.searchInfluencers);
// Rotas protegidas de Perfil e Missão (Legado)
router.patch('/profile', auth_middleware_1.authenticate, influencer_controller_1.updateProfile);
router.get('/mission', auth_middleware_1.authenticate, influencer_controller_1.getMyMission);
router.post('/mission/complete', auth_middleware_1.authenticate, influencer_controller_1.completeMission);
// Novas Rotas de Carreira & IA Empresária
router.get('/tasks', auth_middleware_1.authenticate, influencer_controller_1.getTasks);
router.post('/tasks/voice', auth_middleware_1.authenticate, influencer_controller_1.createVoiceTask);
router.patch('/tasks/:id', auth_middleware_1.authenticate, influencer_controller_1.updateTask);
router.get('/daily-insight', auth_middleware_1.authenticate, influencer_controller_1.getDailyInsight);
// Tabela de Preços (Rate Card)
router.get('/rate-card', auth_middleware_1.authenticate, influencer_controller_1.getRateCard);
router.post('/rate-card', auth_middleware_1.authenticate, influencer_controller_1.updateRateCard);
// Carteira & Saque PIX
router.get('/balance', auth_middleware_1.authenticate, influencer_controller_1.getBalance);
router.post('/withdraw', auth_middleware_1.authenticate, influencer_controller_1.requestWithdraw);
router.post('/seed-balance', auth_middleware_1.authenticate, influencer_controller_1.seedDemoBalance);
exports.default = router;
