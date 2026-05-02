"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, task_controller_1.createTask);
router.get('/', auth_middleware_1.authenticate, task_controller_1.getMyTasks);
exports.default = router;
