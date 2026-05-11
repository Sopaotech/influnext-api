"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integration_controller_1 = require("../controllers/integration.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Listar plataformas conectadas
router.get('/connected', auth_middleware_1.authenticate, integration_controller_1.getConnectedPlatforms);
// Obter URLs de autorização
router.get('/urls', auth_middleware_1.authenticate, integration_controller_1.getAuthUrls);
// Callbacks (públicos, chamados pelas redes sociais)
router.get('/instagram/callback', integration_controller_1.handleInstagramCallback);
router.get('/tiktok/callback', integration_controller_1.handleTikTokCallback);
exports.default = router;
