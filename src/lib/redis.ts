import IORedis, { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTls = redisUrl.startsWith('rediss://') || process.env.REDIS_TLS === 'true';

export function createRedisClient(): IORedis {
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    lazyConnect: true, // Crucial: não tenta conectar no import
    enableReadyCheck: false,
    enableOfflineQueue: false, // Não acumular comandos se estiver offline
    showFriendlyErrorStack: false,
    retryStrategy: (times) => Math.min(times * 500, 30000),
  };

  if (isTls) {
    options.tls = {
      rejectUnauthorized: false
    };
  }

  const client = new IORedis(redisUrl, options);

  // Silencia erros de conexão e de protocolo de parser para evitar spam nos logs
  client.on('error', (err: any) => {
    if (err?.name === 'ParserError' || err?.message?.includes('Protocol error')) {
      return;
    }
  });

  return client;
}

// Conexão singleton central
export const redisConnection = createRedisClient();


