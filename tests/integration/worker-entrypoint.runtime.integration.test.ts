import express from 'express';

const mockSchedulerImport = jest.fn();
const mockTokenRenewalImport = jest.fn();
const mockPostAnalyzerImport = jest.fn();
const mockPushDelivery = jest.fn();

jest.mock('../../src/queues/cleanup.queue', () => {
  mockSchedulerImport();
  return {};
});

jest.mock('../../src/queues/token-renewal.queue', () => {
  mockSchedulerImport();
  return {};
});

jest.mock('../../src/workers/token-renewal.worker', () => {
  mockTokenRenewalImport();
  return {};
});

jest.mock('../../src/workers/post-analyzer.worker', () => {
  mockPostAnalyzerImport();
  return {};
});

jest.mock('../../src/services/push-notification.service', () => ({
  sendPushNotification: mockPushDelivery,
}));

import { startWorkerProcess } from '../../src/worker';

function assertLocalWorkerTestEnvironment(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL!);
  const redisUrl = new URL(process.env.REDIS_URL!);

  expect(databaseUrl.protocol).toBe('postgresql:');
  expect(databaseUrl.hostname).toBe('127.0.0.1');
  expect(databaseUrl.port).toBe('5433');
  expect(databaseUrl.pathname).toMatch(/test/i);
  expect(redisUrl.protocol).toBe('redis:');
  expect(redisUrl.hostname).toBe('127.0.0.1');
  expect(redisUrl.port).toBe('6380');
}

describe('worker process local runtime smoke', () => {
  let listenSpy: jest.SpyInstance;

  beforeAll(() => {
    listenSpy = jest.spyOn(express.application, 'listen');
  });

  afterAll(() => {
    listenSpy.mockRestore();
  });

  it('connects only to local test services, starts controlled workers, and shuts down without HTTP or schedules', async () => {
    assertLocalWorkerTestEnvironment();

    const runtime = await startWorkerProcess();

    expect(runtime.workers).toHaveLength(2);
    expect(listenSpy).not.toHaveBeenCalled();
    expect(mockSchedulerImport).not.toHaveBeenCalled();
    expect(mockTokenRenewalImport).not.toHaveBeenCalled();
    expect(mockPostAnalyzerImport).not.toHaveBeenCalled();
    expect(mockPushDelivery).not.toHaveBeenCalled();

    await runtime.shutdown();
  });
});
