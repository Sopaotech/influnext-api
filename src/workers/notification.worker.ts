import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../services/push-notification.service';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 5000, 60000)
});

// Silenciar logs de erro de conexão
connection.on('error', () => {});

export const processNotification = async (job: any) => {
  const { userId, message, type } = job.data;
  console.log(`[NOTIFICAÇÃO] User ${userId}: ${message}`);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    if (user?.fcmToken) {
      console.log(`[PUSH] Enviando push para o usuário ${userId}...`);
      await sendPushNotification(user.fcmToken, 'InfluNext', message, { type });
    } else {
      console.log(`[PUSH] Usuário ${userId} não possui token FCM cadastrado.`);
    }
  } catch (err) {
    console.error(`[PUSH ERROR] Erro ao enviar push para usuário ${userId}:`, err);
  }

  return { success: true };
};

export const notificationWorker = new Worker('notifications', processNotification, { connection });

notificationWorker.on('error', () => {
  // Ignora erro de conexão do Redis para não derrubar o host
});
