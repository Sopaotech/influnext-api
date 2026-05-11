"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationWorker = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 5000, 60000)
});
// Silenciar logs de erro de conexão
connection.on('error', () => { });
exports.notificationWorker = new bullmq_1.Worker('notifications', async (job) => {
    const { userId, message, type } = job.data;
    console.log(`[NOTIFICAÇÃO] User ${userId}: ${message}`);
    return { success: true };
}, { connection });
