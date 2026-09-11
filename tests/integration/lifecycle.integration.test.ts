import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import request from 'supertest';
import {
  clearIntegrationDatabase,
  disconnectIntegrationPrisma,
} from '../helpers/postgres-integration';

const mockListen = jest.fn();
const mockRedisConnect = jest.fn();
const mockStripeCheckoutCreate = jest.fn();
const mockMercadoPagoCreatePix = jest.fn();
const mockCalendarSyncTask = jest.fn();
const mockAddNotificationJob = jest.fn();
const mockAddPostAnalysisJob = jest.fn();
const mockAddDailyCleanupJob = jest.fn();
const mockAddDailyTokenRenewalJob = jest.fn();
const mockNotificationWorkerImport = jest.fn();
const mockCleanupWorkerImport = jest.fn();
const mockTokenRenewalWorkerImport = jest.fn();
const mockPostAnalyzerWorkerImport = jest.fn();

jest.mock('../../src/lib/redis', () => ({
  redisConnection: {
    status: 'wait',
    connect: mockRedisConnect,
    set: jest.fn(),
    eval: jest.fn(),
  },
}));

jest.mock('../../src/lib/stripe', () => ({
  stripe: { checkout: { sessions: { create: mockStripeCheckoutCreate } } },
}));

jest.mock('../../src/services/mercadopago.service', () => ({
  MercadoPagoService: { createContractPix: mockMercadoPagoCreatePix },
}));

jest.mock('../../src/services/calendar.service', () => ({
  CalendarService: { syncTaskToCalendar: mockCalendarSyncTask },
}));

jest.mock('../../src/services/twoFactor.service', () => ({
  TwoFactorService: { verifyToken: jest.fn(), generateSecret: jest.fn() },
}));

jest.mock('../../src/queues/notification.queue', () => ({
  addNotificationJob: mockAddNotificationJob,
}));

jest.mock('../../src/queues/post-analyzer.queue', () => ({
  addPostAnalysisJob: mockAddPostAnalysisJob,
}));

jest.mock('../../src/queues/cleanup.queue', () => ({
  addDailyCleanupJob: mockAddDailyCleanupJob,
}));

jest.mock('../../src/queues/token-renewal.queue', () => ({
  addDailyTokenRenewalJob: mockAddDailyTokenRenewalJob,
}));

jest.mock('../../src/workers/notification.worker', () => {
  mockNotificationWorkerImport();
  return {};
});

jest.mock('../../src/workers/cleanup.worker', () => {
  mockCleanupWorkerImport();
  return {};
});

jest.mock('../../src/workers/token-renewal.worker', () => {
  mockTokenRenewalWorkerImport();
  return {};
});

jest.mock('../../src/workers/post-analyzer.worker', () => {
  mockPostAnalyzerWorkerImport();
  return {};
});

const debugLogPath = path.resolve(process.cwd(), '404-debug.log');

let app: Express;
let appPrisma: { $disconnect: () => Promise<void> };
let listenSpy: jest.SpyInstance;
let importSafetySnapshot: Record<string, number>;

beforeAll(() => {
  expect(fs.existsSync(debugLogPath)).toBe(false);

  jest.isolateModules(() => {
    const express = require('express');
    listenSpy = jest.spyOn(express.application, 'listen').mockImplementation(mockListen);
    ({ app } = require('../../src/server'));
    ({ prisma: appPrisma } = require('../../src/lib/prisma'));
  });

  importSafetySnapshot = {
    listen: listenSpy.mock.calls.length,
    notificationWorker: mockNotificationWorkerImport.mock.calls.length,
    cleanupWorker: mockCleanupWorkerImport.mock.calls.length,
    tokenRenewalWorker: mockTokenRenewalWorkerImport.mock.calls.length,
    postAnalyzerWorker: mockPostAnalyzerWorkerImport.mock.calls.length,
    dailyCleanup: mockAddDailyCleanupJob.mock.calls.length,
    dailyTokenRenewal: mockAddDailyTokenRenewalJob.mock.calls.length,
    redisConnect: mockRedisConnect.mock.calls.length,
  };
});

beforeEach(async () => {
  await clearIntegrationDatabase();
});

afterAll(async () => {
  await clearIntegrationDatabase();
  await appPrisma.$disconnect();
  await disconnectIntegrationPrisma();
  listenSpy.mockRestore();
});

describe('PostgreSQL lifecycle integration', () => {
  it('imports the app in test mode without listening or starting workers', () => {
    expect(app).toBeDefined();
    expect(importSafetySnapshot).toEqual({
      listen: 0,
      notificationWorker: 0,
      cleanupWorker: 0,
      tokenRenewalWorker: 0,
      postAnalyzerWorker: 0,
      dailyCleanup: 0,
      dailyTokenRenewal: 0,
      redisConnect: 0,
    });
  });

  it('runs a PostgreSQL-backed protected route without external effects or debug log writes', async () => {
    await request(app).get('/v1/auth/me').expect(401);
    await request(app).get('/v1/lifecycle-test-missing-route').expect(404);

    expect(fs.existsSync(debugLogPath)).toBe(false);
    expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
    expect(mockMercadoPagoCreatePix).not.toHaveBeenCalled();
    expect(mockCalendarSyncTask).not.toHaveBeenCalled();
    expect(mockAddNotificationJob).not.toHaveBeenCalled();
    expect(mockAddPostAnalysisJob).not.toHaveBeenCalled();
    expect(mockRedisConnect).not.toHaveBeenCalled();
  });
});
