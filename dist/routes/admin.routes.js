"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../types/roles");
const router = (0, express_1.Router)();
// Endpoint ultra-protegido: Apenas quem tiver o Role ADMIN pode acessar
router.get('/stats', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([roles_1.UserRole.ADMIN]), admin_controller_1.getAdminStats);
router.get('/growth-strategy', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([roles_1.UserRole.ADMIN]), admin_controller_1.getGrowthStrategy);
router.get('/users', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([roles_1.UserRole.ADMIN]), admin_controller_1.listAllUsers);
router.post('/users/grant-pro', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([roles_1.UserRole.ADMIN]), admin_controller_1.grantProAccess);
exports.default = router;
