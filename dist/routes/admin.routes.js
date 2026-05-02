"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const sandbox_controller_1 = require("../controllers/sandbox.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../types/roles");
const router = (0, express_1.Router)();
// Endpoint ultra-protegido: Apenas quem tiver o Role ADMIN pode acessar
router.get('/stats', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([roles_1.UserRole.ADMIN]), admin_controller_1.getGlobalStats);
router.post('/sandbox/simulate', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([roles_1.UserRole.ADMIN]), sandbox_controller_1.simulateFullCycle);
exports.default = router;
