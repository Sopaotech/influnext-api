import IORedis, { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const isTls = redisUrl.startsWith('rediss://') || process.env.REDIS_TLS === 'true';

const options: RedisOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true, // Crucial: não tenta conectar no import
  enableReadyCheck: false,
  enableOfflineQueue: false, // Não acumular comandos se estiver offline
  showFriendlyErrorStack: false,
  retryStrategy: (times) => {
    // Tenta reconectar a cada 30 segundos, mas sem travar o processo
    return Math.min(times * 50, 30000);
  },
};

if (isTls) {
  options.tls = {
    rejectUnauthorized: false
  };
}

// Criamos uma conexão resiliente que não quebra o servidor se o Redis estiver offline ou incompatível
export const redisConnection = new IORedis(redisUrl, options);

// Silencia erros de conexão e de protocolo de parser de forma absoluta para evitar spam nos logs
redisConnection.on('error', (err: any) => {
  // Ignora ParserErrors de protocolo HTTP quando o endpoint de Redis no Railway não está ativo
  if (err?.name === 'ParserError' || err?.message?.includes('Protocol error')) {
    return;
  }
  // console.warn('⚠️ [Redis] Conexão indisponível — filas em segundo plano pausadas.');
});

