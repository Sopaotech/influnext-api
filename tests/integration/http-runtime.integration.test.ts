const mockListen = jest.fn();
const mockPrismaConnect = jest.fn();
const mockRedisModuleImport = jest.fn();
const mockNotificationWorkerImport = jest.fn();
const mockCleanupWorkerImport = jest.fn();
const mockTokenRenewalWorkerImport = jest.fn();
const mockPostAnalyzerWorkerImport = jest.fn();
const mockSchedulerModuleImport = jest.fn();

jest.mock('../../src/app', () => ({
  app: { listen: mockListen },
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: { $connect: mockPrismaConnect },
}));

jest.mock('../../src/lib/redis', () => {
  mockRedisModuleImport();
  return { redisConnection: { connect: jest.fn() } };
});

jest.mock('../../src/workers/notification.worker', () => {
  mockNotificationWorkerImport();
  return { startNotificationWorker: jest.fn() };
});

jest.mock('../../src/workers/cleanup.worker', () => {
  mockCleanupWorkerImport();
  return { startCleanupWorker: jest.fn() };
});

jest.mock('../../src/workers/token-renewal.worker', () => {
  mockTokenRenewalWorkerImport();
  return {};
});

jest.mock('../../src/workers/post-analyzer.worker', () => {
  mockPostAnalyzerWorkerImport();
  return {};
});

jest.mock('../../src/queues/scheduler', () => {
  mockSchedulerModuleImport();
  return { registerApplicationSchedules: jest.fn() };
});

import { startHttpServer } from '../../src/server';

describe('HTTP runtime cutover integration', () => {
  const originalPort = process.env.PORT;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PORT = '4123';
    mockPrismaConnect.mockResolvedValue(undefined);
  });

  afterAll(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  });

  it('starts HTTP without importing workers, schedules, or Redis', async () => {
    const server = { close: jest.fn() };
    mockListen.mockReturnValue(server);

    await expect(startHttpServer()).resolves.toBe(server);
    await new Promise<void>(resolve => setImmediate(resolve));

    expect(mockPrismaConnect).toHaveBeenCalledTimes(1);
    expect(mockListen).toHaveBeenCalledWith(4123, expect.any(Function));
    expect(mockRedisModuleImport).not.toHaveBeenCalled();
    expect(mockNotificationWorkerImport).not.toHaveBeenCalled();
    expect(mockCleanupWorkerImport).not.toHaveBeenCalled();
    expect(mockTokenRenewalWorkerImport).not.toHaveBeenCalled();
    expect(mockPostAnalyzerWorkerImport).not.toHaveBeenCalled();
    expect(mockSchedulerModuleImport).not.toHaveBeenCalled();
  });

  it('keeps the legacy HTTP availability policy without starting background runtimes', async () => {
    const server = { close: jest.fn() };
    const startupError = new Error('database unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockPrismaConnect.mockRejectedValue(startupError);
    mockListen.mockReturnValue(server);

    try {
      await expect(startHttpServer()).resolves.toBe(server);
      await new Promise<void>(resolve => setImmediate(resolve));

      expect(mockListen).toHaveBeenCalledWith(4123, expect.any(Function));
      expect(mockRedisModuleImport).not.toHaveBeenCalled();
      expect(mockNotificationWorkerImport).not.toHaveBeenCalled();
      expect(mockCleanupWorkerImport).not.toHaveBeenCalled();
      expect(mockTokenRenewalWorkerImport).not.toHaveBeenCalled();
      expect(mockPostAnalyzerWorkerImport).not.toHaveBeenCalled();
      expect(mockSchedulerModuleImport).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});
