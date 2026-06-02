"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNotificationJob = exports.notificationQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../lib/redis");
// Criamos a fila apenas se necessário, mas com tratamento de erro
exports.notificationQueue = new bullmq_1.Queue('notifications', {
    connection: redis_1.redisConnection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 1000
    }
});
exports.notificationQueue.on('error', () => {
    // Ignora erro de conexão do Redis para não derrubar o host
});
// Silenciar erros de conexão da fila
exports.notificationQueue.on('error', () => {
    // console.log('⚠️ [Queue] Redis indisponível, notificações em background pausadas.');
});
const addNotificationJob = async (userId, message, type) => {
    try {
        if (redis_1.redisConnection.status === 'ready') {
            await exports.notificationQueue.add('send-notification', { userId, message, type }, {
                attempts: 1,
                backoff: { type: 'exponential', delay: 5000 }
            });
        }
    }
    catch (error) {
        // Silencioso em dev
    }
};
exports.addNotificationJob = addNotificationJob;
