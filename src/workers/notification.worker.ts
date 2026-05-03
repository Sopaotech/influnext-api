import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    // Se falhar mais de 3 vezes, para de tentar por um tempo para não inundar o log
    if (times > 3) return null; 
    return Math.min(times * 100, 3000);
  }
});

connection.on('error', (err) => {
  console.warn('[WORKER] Redis não disponível. Notificações em background desativadas.');
});

connection.on('ready', () => {
  console.log('[WORKER] Redis Connected com sucesso!');
});

export const notificationWorker = new Worker('notifications', async (job) => {
  const { userId, message, type } = job.data;
  
  // Aqui no futuro integraremos com SendGrid, Mailtrap ou Firebase
  console.log(`[JOB - ${type}] Enviando notificação para User ${userId}: ${message}`);
  
  // Simula latência de rede de e-mail
  await new Promise(res => setTimeout(res, 500));
  
  return { success: true };
}, { connection });
