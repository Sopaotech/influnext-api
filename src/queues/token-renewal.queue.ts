import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';

export const tokenRenewalQueue = new Queue('token-renewal-tasks', {
  connection: redisConnection,
});

tokenRenewalQueue.on('error', () => {
  // Ignora erro de conexão do Redis para evitar crashes
});

export const addDailyTokenRenewalJob = async () => {
  try {
    if (redisConnection.status === 'ready') {
      await tokenRenewalQueue.add(
        'daily-token-renewal',
        {},
        {
          repeat: {
            pattern: '0 4 * * *', // Todo dia às 4 da manhã
          },
        }
      );
      console.log('✅ [Queue] Job diário de renovação de tokens agendado (0 4 * * *).');
    }
  } catch (error) {
    // Silencioso em dev
  }
};
