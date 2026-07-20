import { Worker } from 'bullmq';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../services/push-notification.service';
import { createRedisClient } from '../lib/redis';

const connection = createRedisClient();

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
