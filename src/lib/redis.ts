import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Criamos uma conexão resiliente que não quebra o servidor se o Redis estiver offline
export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true, // Crucial: não tenta conectar no import
  enableReadyCheck: false,
  enableOfflineQueue: false, // Não acumular comandos se estiver offline
  showFriendlyErrorStack: false, 
  retryStrategy: (times) => {
    // Tenta reconectar a cada 30 segundos, mas sem alarde
    return Math.min(times * 50, 30000);
  },
});

// Silencia erros de conexão de forma absoluta para evitar o crash do node
redisConnection.on('error', (err) => {
  // Apenas loga que o Redis está offline sem estourar o servidor
  // console.warn('⚠️ [Redis] Offline - Filas de background desativadas localmente.');
});
