import request from 'supertest';

const mockPrismaQueryRaw = jest.fn();
const mockPageViewCreate = jest.fn();
const mockRedisConnect = jest.fn();
const mockRedisPing = jest.fn();
const mockStripeCheckoutCreate = jest.fn();
const mockMercadoPagoCreatePix = jest.fn();
const mockRedisConnection = {
  status: 'ready',
  connect: mockRedisConnect,
  ping: mockRedisPing,
  set: jest.fn(),
  eval: jest.fn(),
};

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    $queryRaw: mockPrismaQueryRaw,
    pageView: { create: mockPageViewCreate },
  },
}));

jest.mock('../src/lib/redis', () => ({
  redisConnection: mockRedisConnection,
}));

jest.mock('../src/lib/stripe', () => ({
  stripe: { checkout: { sessions: { create: mockStripeCheckoutCreate } } },
}));

jest.mock('../src/services/mercadopago.service', () => ({
  MercadoPagoService: { createContractPix: mockMercadoPagoCreatePix },
}));

jest.mock('../src/queues/notification.queue', () => ({
  addNotificationJob: jest.fn(),
}));

jest.mock('../src/queues/post-analyzer.queue', () => ({
  addPostAnalysisJob: jest.fn(),
}));

jest.mock('../src/services/calendar.service', () => ({
  CalendarService: { syncTaskToCalendar: jest.fn() },
}));

jest.mock('../src/services/twoFactor.service', () => ({
  TwoFactorService: { verifyToken: jest.fn(), generateSecret: jest.fn() },
}));

import { app } from '../src/app';
import { getRuntimeReadiness, hasCriticalRuntimeConfiguration } from '../src/runtime/readiness';

const fakeDatabaseUrl = 'postgresql://test_user:not-a-real-secret@127.0.0.1:5433/influnext_test?schema=public';
const fakeRedisUrl = 'redis://127.0.0.1:6380';
const fakeJwtSecret = 'test-jwt-secret-not-for-production';
const originalEnvironment = { ...process.env };

function restoreEnvironment(): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnvironment);
}

function configureHealthyEnvironment(): void {
  process.env.DATABASE_URL = fakeDatabaseUrl;
  process.env.REDIS_URL = fakeRedisUrl;
  process.env.JWT_SECRET = fakeJwtSecret;
  process.env.ALLOWED_ORIGINS = 'https://frontend.example.test';
  delete process.env.FRONTEND_URL;
}

describe('runtime health and readiness', () => {
  beforeEach(() => {
    restoreEnvironment();
    configureHealthyEnvironment();
    jest.clearAllMocks();
    mockRedisConnection.status = 'ready';
    mockPrismaQueryRaw.mockResolvedValue([{ value: 1 }]);
    mockRedisPing.mockResolvedValue('PONG');
  });

  afterAll(() => {
    restoreEnvironment();
  });

  it('serves /health and /api/health as dependency-free liveness checks', async () => {
    await request(app)
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'influnext-api' });

    await request(app)
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'influnext-api' });

    expect(mockPrismaQueryRaw).not.toHaveBeenCalled();
    expect(mockRedisConnect).not.toHaveBeenCalled();
    expect(mockRedisPing).not.toHaveBeenCalled();
    expect(mockPageViewCreate).not.toHaveBeenCalled();
  });

  it('keeps /v1/health compatible without creating analytics', async () => {
    await request(app).get('/v1/health').expect(200).expect({ status: 'OK' });
    expect(mockPageViewCreate).not.toHaveBeenCalled();
  });

  it('reports readiness only when configuration, PostgreSQL, and Redis are healthy', async () => {
    const response = await request(app).get('/ready').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      checks: { config: 'ok', database: 'ok', redis: 'ok' },
    });
    expect(mockPrismaQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockRedisPing).toHaveBeenCalledTimes(1);
  });

  it('returns a sanitized 503 when PostgreSQL fails', async () => {
    mockPrismaQueryRaw.mockRejectedValue(new Error(`database failure ${fakeDatabaseUrl} ${fakeJwtSecret}`));

    const response = await request(app).get('/ready').expect(503);

    expect(response.body).toEqual({
      status: 'failed',
      checks: { config: 'ok', database: 'failed', redis: 'ok' },
    });
    expect(JSON.stringify(response.body)).not.toContain(fakeDatabaseUrl);
    expect(JSON.stringify(response.body)).not.toContain(fakeJwtSecret);
  });

  it('returns a sanitized 503 when Redis fails', async () => {
    mockRedisPing.mockRejectedValue(new Error(`redis failure ${fakeRedisUrl} ${fakeJwtSecret}`));

    const response = await request(app).get('/ready').expect(503);

    expect(response.body).toEqual({
      status: 'failed',
      checks: { config: 'ok', database: 'ok', redis: 'failed' },
    });
    expect(JSON.stringify(response.body)).not.toContain(fakeRedisUrl);
    expect(JSON.stringify(response.body)).not.toContain(fakeJwtSecret);
  });

  it('returns a sanitized 503 when critical configuration is missing', async () => {
    delete process.env.JWT_SECRET;

    const response = await request(app).get('/ready').expect(503);

    expect(response.body).toEqual({
      status: 'failed',
      checks: { config: 'failed', database: 'ok', redis: 'ok' },
    });
    expect(JSON.stringify(response.body)).not.toContain('JWT_SECRET');
  });

  it('requires either ALLOWED_ORIGINS or FRONTEND_URL as critical runtime configuration', async () => {
    delete process.env.ALLOWED_ORIGINS;
    process.env.FRONTEND_URL = 'https://frontend.example.test';

    expect(hasCriticalRuntimeConfiguration()).toBe(true);

    delete process.env.FRONTEND_URL;
    expect(hasCriticalRuntimeConfiguration()).toBe(false);
  });

  it('sanitizes probe errors when readiness is evaluated with injected dependencies', async () => {
    const result = await getRuntimeReadiness({
      environment: {
        DATABASE_URL: fakeDatabaseUrl,
        REDIS_URL: fakeRedisUrl,
        JWT_SECRET: fakeJwtSecret,
        ALLOWED_ORIGINS: 'https://frontend.example.test',
      },
      databaseProbe: async () => {
        throw new Error(`raw database error ${fakeDatabaseUrl}`);
      },
      redisProbe: async () => {
        throw new Error(`raw redis error ${fakeRedisUrl}`);
      },
    });

    expect(result).toEqual({
      status: 'failed',
      checks: { config: 'ok', database: 'failed', redis: 'failed' },
    });
    expect(JSON.stringify(result)).not.toContain(fakeDatabaseUrl);
    expect(JSON.stringify(result)).not.toContain(fakeRedisUrl);
    expect(JSON.stringify(result)).not.toContain(fakeJwtSecret);
  });
});
