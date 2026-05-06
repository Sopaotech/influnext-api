import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Criamos uma conexão resiliente que não quebra o servidor se o Redis estiver offline
export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableReadyCheck: false,
  enableOfflineQueue: false, // Não acumular comandos se estiver offline
  showFriendlyErrorStack: false, // Reduzir ruído de erro
  retryStrategy: () => 30000, 
});

// Silencia erros de conexão de forma absoluta
redisConnection.on('error', (err) => {
  // Ignora completamente erros de conexão em desenvolvimento
});
