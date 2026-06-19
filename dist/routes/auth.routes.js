"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Build Version: 2.0.1 - Fix Sync
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const security_middleware_1 = require("../middlewares/security.middleware");
const router = (0, express_1.Router)();
router.post('/signup', security_middleware_1.ipSignupLimiter, auth_controller_1.signup);
router.post('/login', auth_controller_1.login);
router.post('/social-login', auth_controller_1.socialLogin);
router.post('/2fa/verify', auth_controller_1.verify2FA);
router.post('/2fa/setup', auth_middleware_1.authenticate, auth_controller_1.setup2FA);
router.post('/2fa/confirm', auth_middleware_1.authenticate, auth_controller_1.confirm2FASetup);
router.post('/complete-profile', auth_middleware_1.authenticate, auth_controller_1.completeProfile);
exports.default = router;
