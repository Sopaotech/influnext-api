"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const public_controller_1 = require("../controllers/public.controller");
const router = (0, express_1.Router)();
// Endpoint público para consulta de Media Kit Digital
router.get('/:handle', public_controller_1.getPublicProfile);
exports.default = router;
