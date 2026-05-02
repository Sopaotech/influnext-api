"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integration_controller_1 = require("../controllers/integration.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Só entra aqui quem tem o Token (o crachá que você pegou no Login)
router.post('/instagram', auth_middleware_1.authenticate, integration_controller_1.connectInstagram);
exports.default = router;
