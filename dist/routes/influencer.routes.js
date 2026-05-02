"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const influencer_controller_1 = require("../controllers/influencer.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../types/roles");
const router = (0, express_1.Router)();
// Endpoint de busca leve para a tela de novos contratos
router.get('/search', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([roles_1.UserRole.COMPANY, roles_1.UserRole.ADMIN]), influencer_controller_1.searchInfluencers);
exports.default = router;
