import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { registerDailyTokenRenewalSchedule } from './schedule-registration';

export const tokenRenewalQueue = new Queue('token-renewal-tasks', {
  connection: redisConnection,
});

tokenRenewalQueue.on('error', () => {
  // Ignora erro de conexão do Redis para evitar crashes
});

export const addDailyTokenRenewalJob = async () => {
  await registerDailyTokenRenewalSchedule(tokenRenewalQueue);
  console.log('✅ [Queue] Job diário de renovação de tokens agendado (0 4 * * *).');
};
