import request from 'supertest';

const mockStripeCheckoutCreate = jest.fn();
const mockMercadoPagoCreatePix = jest.fn();

jest.mock('../../src/lib/stripe', () => ({
  stripe: { checkout: { sessions: { create: mockStripeCheckoutCreate } } },
}));

jest.mock('../../src/services/mercadopago.service', () => ({
  MercadoPagoService: { createContractPix: mockMercadoPagoCreatePix },
}));

jest.mock('../../src/queues/notification.queue', () => ({
  addNotificationJob: jest.fn(),
}));

jest.mock('../../src/queues/post-analyzer.queue', () => ({
  addPostAnalysisJob: jest.fn(),
}));

jest.mock('../../src/services/calendar.service', () => ({
  CalendarService: { syncTaskToCalendar: jest.fn() },
}));

jest.mock('../../src/services/twoFactor.service', () => ({
  TwoFactorService: { verifyToken: jest.fn(), generateSecret: jest.fn() },
}));

import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { redisConnection } from '../../src/lib/redis';
import {
  clearIntegrationDatabase,
  disconnectIntegrationPrisma,
  integrationPrisma,
} from '../helpers/postgres-integration';

beforeEach(async () => {
  await clearIntegrationDatabase();
});

afterAll(async () => {
  await clearIntegrationDatabase();
  await Promise.all([
    prisma.$disconnect(),
    redisConnection.quit(),
    disconnectIntegrationPrisma(),
  ]);
});

describe('PostgreSQL and Redis readiness integration', () => {
  it('keeps /health and /api/health as dependency-free liveness responses', async () => {
    const databaseQuerySpy = jest.spyOn(prisma, '$queryRaw');
    const redisPingSpy = jest.spyOn(redisConnection, 'ping');
    const pageViewCreateSpy = jest.spyOn(prisma.pageView, 'create');

    try {
      await request(app)
        .get('/health')
        .expect(200)
        .expect({ status: 'ok', service: 'influnext-api' });

      await request(app)
        .get('/api/health')
        .expect(200)
        .expect({ status: 'ok', service: 'influnext-api' });

      expect(databaseQuerySpy).not.toHaveBeenCalled();
      expect(redisPingSpy).not.toHaveBeenCalled();
      expect(pageViewCreateSpy).not.toHaveBeenCalled();
      await expect(integrationPrisma.pageView.count()).resolves.toBe(0);
    } finally {
      databaseQuerySpy.mockRestore();
      redisPingSpy.mockRestore();
      pageViewCreateSpy.mockRestore();
    }
  });

  it('reports ready only after real local PostgreSQL and Redis probes succeed', async () => {
    const response = await request(app).get('/ready').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      checks: { config: 'ok', database: 'ok', redis: 'ok' },
    });
    await expect(integrationPrisma.pageView.count()).resolves.toBe(0);
  });

  it('keeps /v1/health compatible without writing a PageView record', async () => {
    const pageViewCreateSpy = jest.spyOn(prisma.pageView, 'create');
    await expect(integrationPrisma.pageView.count()).resolves.toBe(0);

    try {
      await request(app)
        .get('/v1/health')
        .expect(200)
        .expect({ status: 'OK' });

      expect(pageViewCreateSpy).not.toHaveBeenCalled();
      await expect(integrationPrisma.pageView.count()).resolves.toBe(0);
    } finally {
      pageViewCreateSpy.mockRestore();
    }
  });
});
