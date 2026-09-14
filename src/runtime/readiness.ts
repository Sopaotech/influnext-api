export type RuntimeCheckStatus = 'ok' | 'failed';

export interface RuntimeReadiness {
  status: RuntimeCheckStatus;
  checks: {
    config: RuntimeCheckStatus;
    database: RuntimeCheckStatus;
    redis: RuntimeCheckStatus;
  };
}

export interface RuntimeReadinessOptions {
  environment?: NodeJS.ProcessEnv;
  databaseProbe?: () => Promise<void>;
  redisProbe?: () => Promise<void>;
}

const livenessPayload = {
  status: 'ok',
  service: 'influnext-api',
} as const;

function isConfigured(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function getLivenessPayload(): typeof livenessPayload {
  return livenessPayload;
}

export function hasCriticalRuntimeConfiguration(environment: NodeJS.ProcessEnv = process.env): boolean {
  return isConfigured(environment.DATABASE_URL) &&
    isConfigured(environment.JWT_SECRET) &&
    isConfigured(environment.REDIS_URL) &&
    (isConfigured(environment.ALLOWED_ORIGINS) || isConfigured(environment.FRONTEND_URL));
}

async function probeDatabase(): Promise<void> {
  const { prisma } = await import('../lib/prisma');
  await prisma.$queryRaw`SELECT 1`;
}

async function probeRedis(): Promise<void> {
  const { redisConnection } = await import('../lib/redis');

  if (redisConnection.status === 'wait') {
    await redisConnection.connect();
  }

  if (redisConnection.status !== 'ready') {
    throw new Error('Redis is not ready.');
  }

  const response = await redisConnection.ping();
  if (response !== 'PONG') {
    throw new Error('Redis ping failed.');
  }
}

async function runProbe(probe: () => Promise<void>): Promise<RuntimeCheckStatus> {
  try {
    await probe();
    return 'ok';
  } catch {
    return 'failed';
  }
}

/**
 * Checks only process-critical configuration and infrastructure. Results are
 * deliberately sanitized so health responses never disclose credentials,
 * connection strings, or raw provider errors.
 */
export async function getRuntimeReadiness(options: RuntimeReadinessOptions = {}): Promise<RuntimeReadiness> {
  const environment = options.environment || process.env;
  const config = hasCriticalRuntimeConfiguration(environment) ? 'ok' : 'failed';

  const database = isConfigured(environment.DATABASE_URL)
    ? await runProbe(options.databaseProbe || probeDatabase)
    : 'failed';
  const redis = isConfigured(environment.REDIS_URL)
    ? await runProbe(options.redisProbe || probeRedis)
    : 'failed';

  return {
    status: config === 'ok' && database === 'ok' && redis === 'ok' ? 'ok' : 'failed',
    checks: { config, database, redis },
  };
}
