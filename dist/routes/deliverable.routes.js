"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deliverable_controller_1 = require("../controllers/deliverable.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Usamos PATCH pois estamos fazendo uma atualização parcial do recurso (submissão da url)
router.patch('/:id/submit', auth_middleware_1.authenticate, deliverable_controller_1.submitWork);
router.patch('/:id/approve', auth_middleware_1.authenticate, deliverable_controller_1.approveWork);
router.patch('/:id/reject', auth_middleware_1.authenticate, deliverable_controller_1.rejectWork);
exports.default = router;
