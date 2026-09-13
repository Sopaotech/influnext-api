import { ConnectionOptions, Worker, WorkerOptions } from 'bullmq';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../services/push-notification.service';
import { redisConnection } from '../lib/redis';



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

export type ControlledWorkerOptions = Pick<WorkerOptions, 'prefix'> & {
  connection?: ConnectionOptions;
};

export function createNotificationWorker(options: ControlledWorkerOptions = {}): Worker {
  const worker = new Worker('notifications', processNotification, {
    connection: options.connection || redisConnection,
    prefix: options.prefix,
  });

  worker.on('error', () => {
    // Ignora erro de conexão do Redis para não derrubar o host
  });

  return worker;
}

// Runtime entrypoints opt in explicitly so importing this module remains safe.
// The legacy HTTP runtime calls startNotificationWorker() to preserve its current behavior.
export let notificationWorker: Worker | undefined;

export function startNotificationWorker(): Worker {
  notificationWorker ||= createNotificationWorker();
  return notificationWorker;
}
