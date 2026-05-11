"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contract_controller_1 = require("../controllers/contract.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const roles_1 = require("../types/roles");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, contract_controller_1.createContract);
router.get('/', auth_middleware_1.authenticate, contract_controller_1.getMyContracts);
// Confirmação manual de pagamento: ADMIN ou COMPANY
router.post('/:id/pay', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.COMPANY]), contract_controller_1.confirmPayment);
exports.default = router;
