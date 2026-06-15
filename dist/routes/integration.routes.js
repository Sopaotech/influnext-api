"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integration_controller_1 = require("../controllers/integration.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../types/roles");
const router = (0, express_1.Router)();
// Listar plataformas conectadas
router.get('/connected', auth_middleware_1.authenticate, integration_controller_1.getConnectedPlatforms);
// Obter URLs de autorização
router.get('/urls', auth_middleware_1.authenticate, integration_controller_1.getAuthUrls);
// Sincronizar métricas de todas as plataformas (on-demand)
router.post('/sync-metrics', auth_middleware_1.authenticate, integration_controller_1.syncPlatformMetrics);
// Simulação de conexão (ex: Instagram/TikTok)
router.post('/simulate', auth_middleware_1.authenticate, integration_controller_1.simulateInstagramConnection);
// Execução manual da renovação de tokens (Apenas Admin)
router.post('/refresh-tokens-debug', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([roles_1.UserRole.ADMIN]), integration_controller_1.triggerTokenRenewalDebug);
// Callbacks (públicos, chamados pelas redes sociais)
router.get('/instagram/callback', integration_controller_1.handleInstagramCallback);
router.get('/tiktok/callback', integration_controller_1.handleTikTokCallback);
exports.default = router;
