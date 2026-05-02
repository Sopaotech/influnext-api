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
});
connection.on('ready', () => {
    console.log('[WORKER] Redis Connected com sucesso!');
});
exports.notificationWorker = new bullmq_1.Worker('notifications', async (job) => {
    const { userId, message, type } = job.data;
    // Aqui no futuro integraremos com SendGrid, Mailtrap ou Firebase
    console.log(`[JOB - ${type}] Enviando notificação para User ${userId}: ${message}`);
    // Simula latência de rede de e-mail
    await new Promise(res => setTimeout(res, 500));
    return { success: true };
}, { connection });
