"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNotificationJob = exports.notificationQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
exports.notificationQueue = new bullmq_1.Queue('notifications', { connection });
const addNotificationJob = async (userId, message, type) => {
    try {
        await exports.notificationQueue.add('send-notification', { userId, message, type }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });
    }
    catch (error) {
        console.error('[QUEUE] Falha ao enfileirar job de notificação:', error);
    }
};
exports.addNotificationJob = addNotificationJob;
