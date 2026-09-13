import express from 'express';

const mockRedisConnect = jest.fn();
const mockRedisQuit = jest.fn();
const mockRedisDisconnect = jest.fn();
const mockRegisterSchedules = jest.fn();
const mockCloseScheduleQueues = jest.fn();
const mockWorkerImport = jest.fn();
const mockProviderCall = jest.fn();

jest.mock('../../src/lib/redis', () => ({
  redisConnection: {
    status: 'wait',
    connect: mockRedisConnect,
    quit: mockRedisQuit,
    disconnect: mockRedisDisconnect,
  },
}));

jest.mock('../../src/queues/scheduler', () => ({
  registerApplicationSchedules: mockRegisterSchedules,
  closeApplicationScheduleQueues: mockCloseScheduleQueues,
}));

jest.mock('../../src/workers/notification.worker', () => {
  mockWorkerImport();
  return {};
});

jest.mock('../../src/workers/cleanup.worker', () => {
  mockWorkerImport();
  return {};
});

jest.mock('../../src/services/push-notification.service', () => ({
  sendPushNotification: mockProviderCall,
}));

import { redisConnection } from '../../src/lib/redis';
import { startSchedulerProcess } from '../../src/scheduler';

const mockedRedisConnection = redisConnection as unknown as {
  status: string;
  connect: jest.Mock;
  quit: jest.Mock;
  disconnect: jest.Mock;
};

describe('scheduler process entrypoint integration', () => {
  const originalRedisUrl = process.env.REDIS_URL;
  let listenSpy: jest.SpyInstance;

  beforeAll(() => {
    listenSpy = jest.spyOn(express.application, 'listen');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REDIS_URL = 'redis://127.0.0.1:6380';
    mockedRedisConnection.status = 'wait';
    mockRedisConnect.mockImplementation(async () => {
      mockedRedisConnection.status = 'ready';
    });
  });

  afterAll(() => {
    listenSpy.mockRestore();
    process.env.REDIS_URL = originalRedisUrl;
  });

  it('imports without opening HTTP, workers, schedules, or provider calls', () => {
    expect(listenSpy).not.toHaveBeenCalled();
    expect(mockWorkerImport).not.toHaveBeenCalled();
    expect(mockRegisterSchedules).not.toHaveBeenCalled();
    expect(mockProviderCall).not.toHaveBeenCalled();
  });

  it('connects local Redis, registers schedules explicitly, and closes resources without HTTP or workers', async () => {
    const redisUrl = new URL(process.env.REDIS_URL!);
    expect(redisUrl.hostname).toBe('127.0.0.1');
    expect(redisUrl.port).toBe('6380');

    const runtime = await startSchedulerProcess();

    expect(mockRedisConnect).toHaveBeenCalledTimes(1);
    expect(mockRegisterSchedules).toHaveBeenCalledTimes(1);
    expect(listenSpy).not.toHaveBeenCalled();
    expect(mockWorkerImport).not.toHaveBeenCalled();
    expect(mockProviderCall).not.toHaveBeenCalled();

    await runtime.shutdown();

    expect(mockCloseScheduleQueues).toHaveBeenCalledTimes(1);
    expect(mockRedisQuit).toHaveBeenCalledTimes(1);
    expect(mockRedisDisconnect).not.toHaveBeenCalled();
  });
});
