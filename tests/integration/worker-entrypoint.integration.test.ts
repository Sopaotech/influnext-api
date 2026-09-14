import express from 'express';

const mockPrismaConnect = jest.fn();
const mockPrismaDisconnect = jest.fn();
const mockRedisConnect = jest.fn();
const mockRedisQuit = jest.fn();
const mockNotificationClose = jest.fn();
const mockCleanupClose = jest.fn();
const mockTokenRenewalClose = jest.fn();
const mockPostAnalyzerClose = jest.fn();
const mockNotificationReady = jest.fn();
const mockCleanupReady = jest.fn();
const mockTokenRenewalReady = jest.fn();
const mockPostAnalyzerReady = jest.fn();
const mockStartNotificationWorker = jest.fn(() => ({
  close: mockNotificationClose,
  waitUntilReady: mockNotificationReady,
}));
const mockStartCleanupWorker = jest.fn(() => ({
  close: mockCleanupClose,
  waitUntilReady: mockCleanupReady,
}));
const mockStartTokenRenewalWorker = jest.fn(() => ({
  close: mockTokenRenewalClose,
  waitUntilReady: mockTokenRenewalReady,
}));
const mockStartPostAnalyzerWorker = jest.fn(() => ({
  close: mockPostAnalyzerClose,
  waitUntilReady: mockPostAnalyzerReady,
}));
const mockSchedulerImport = jest.fn();
const mockPushDelivery = jest.fn();

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    $connect: mockPrismaConnect,
    $disconnect: mockPrismaDisconnect,
  },
}));

jest.mock('../../src/lib/redis', () => ({
  redisConnection: {
    status: 'wait',
    connect: mockRedisConnect,
    quit: mockRedisQuit,
  },
}));

jest.mock('../../src/workers/notification.worker', () => ({
  startNotificationWorker: mockStartNotificationWorker,
}));

jest.mock('../../src/workers/cleanup.worker', () => ({
  startCleanupWorker: mockStartCleanupWorker,
}));

jest.mock('../../src/queues/cleanup.queue', () => {
  mockSchedulerImport();
  return {};
});

jest.mock('../../src/queues/token-renewal.queue', () => {
  mockSchedulerImport();
  return {};
});

jest.mock('../../src/workers/token-renewal.worker', () => {
  return { startTokenRenewalWorker: mockStartTokenRenewalWorker };
});

jest.mock('../../src/workers/post-analyzer.worker', () => {
  return { startPostAnalyzerWorker: mockStartPostAnalyzerWorker };
});

jest.mock('../../src/services/push-notification.service', () => ({
  sendPushNotification: mockPushDelivery,
}));

import { redisConnection } from '../../src/lib/redis';
import { startWorkerProcess } from '../../src/worker';

const mockedRedisConnection = redisConnection as unknown as {
  status: string;
  connect: jest.Mock;
  quit: jest.Mock;
};

describe('worker process entrypoint integration', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalRedisUrl = process.env.REDIS_URL;
  let listenSpy: jest.SpyInstance;

  beforeAll(() => {
    listenSpy = jest.spyOn(express.application, 'listen');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5433/influnext_test?schema=public';
    process.env.REDIS_URL = 'redis://127.0.0.1:6380';
    mockedRedisConnection.status = 'wait';
    mockStartNotificationWorker.mockReturnValue({
      close: mockNotificationClose,
      waitUntilReady: mockNotificationReady,
    });
    mockStartCleanupWorker.mockReturnValue({
      close: mockCleanupClose,
      waitUntilReady: mockCleanupReady,
    });
    mockStartTokenRenewalWorker.mockReturnValue({
      close: mockTokenRenewalClose,
      waitUntilReady: mockTokenRenewalReady,
    });
    mockStartPostAnalyzerWorker.mockReturnValue({
      close: mockPostAnalyzerClose,
      waitUntilReady: mockPostAnalyzerReady,
    });
    mockRedisConnect.mockImplementation(async () => {
      mockedRedisConnection.status = 'ready';
    });
  });

  afterAll(() => {
    listenSpy.mockRestore();
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.REDIS_URL = originalRedisUrl;
  });

  it('imports without opening HTTP, starting workers, schedulers, or provider calls', () => {
    expect(listenSpy).not.toHaveBeenCalled();
    expect(mockStartNotificationWorker).not.toHaveBeenCalled();
    expect(mockStartCleanupWorker).not.toHaveBeenCalled();
    expect(mockSchedulerImport).not.toHaveBeenCalled();
    expect(mockStartTokenRenewalWorker).not.toHaveBeenCalled();
    expect(mockStartPostAnalyzerWorker).not.toHaveBeenCalled();
    expect(mockPushDelivery).not.toHaveBeenCalled();
  });

  it('starts only controlled workers with local test configuration and shuts down resources', async () => {
    const databaseUrl = new URL(process.env.DATABASE_URL!);
    const redisUrl = new URL(process.env.REDIS_URL!);
    expect(databaseUrl.hostname).toBe('127.0.0.1');
    expect(databaseUrl.port).toBe('5433');
    expect(databaseUrl.pathname).toContain('test');
    expect(redisUrl.hostname).toBe('127.0.0.1');
    expect(redisUrl.port).toBe('6380');

    const runtime = await startWorkerProcess();

    expect(mockPrismaConnect).toHaveBeenCalledTimes(1);
    expect(mockRedisConnect).toHaveBeenCalledTimes(1);
    expect(mockStartNotificationWorker).toHaveBeenCalledTimes(1);
    expect(mockStartCleanupWorker).toHaveBeenCalledTimes(1);
    expect(mockStartTokenRenewalWorker).toHaveBeenCalledTimes(1);
    expect(mockStartPostAnalyzerWorker).toHaveBeenCalledTimes(1);
    expect(mockNotificationReady).toHaveBeenCalledTimes(1);
    expect(mockCleanupReady).toHaveBeenCalledTimes(1);
    expect(mockTokenRenewalReady).toHaveBeenCalledTimes(1);
    expect(mockPostAnalyzerReady).toHaveBeenCalledTimes(1);
    expect(listenSpy).not.toHaveBeenCalled();
    expect(mockSchedulerImport).not.toHaveBeenCalled();
    expect(mockPushDelivery).not.toHaveBeenCalled();

    await runtime.shutdown();

    expect(mockNotificationClose).toHaveBeenCalledTimes(1);
    expect(mockCleanupClose).toHaveBeenCalledTimes(1);
    expect(mockTokenRenewalClose).toHaveBeenCalledTimes(1);
    expect(mockPostAnalyzerClose).toHaveBeenCalledTimes(1);
    expect(mockRedisQuit).toHaveBeenCalledTimes(1);
    expect(mockPrismaDisconnect).toHaveBeenCalledTimes(1);
  });
});
