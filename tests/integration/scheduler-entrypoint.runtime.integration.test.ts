import express from 'express';

const mockRegisterSchedules = jest.fn();
const mockCloseScheduleQueues = jest.fn();
const mockWorkerImport = jest.fn();

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

import { startSchedulerProcess } from '../../src/scheduler';

function assertLocalSchedulerTestEnvironment(): void {
  const redisUrl = new URL(process.env.REDIS_URL!);

  expect(redisUrl.protocol).toBe('redis:');
  expect(redisUrl.hostname).toBe('127.0.0.1');
  expect(redisUrl.port).toBe('6380');
}

describe('scheduler process local runtime smoke', () => {
  let listenSpy: jest.SpyInstance;

  beforeAll(() => {
    listenSpy = jest.spyOn(express.application, 'listen');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRegisterSchedules.mockResolvedValue(undefined);
    mockCloseScheduleQueues.mockResolvedValue(undefined);
  });

  afterAll(() => {
    listenSpy.mockRestore();
  });

  it('connects only to local Redis and shuts down without HTTP, workers, or schedule execution', async () => {
    assertLocalSchedulerTestEnvironment();

    const runtime = await startSchedulerProcess();

    expect(mockRegisterSchedules).toHaveBeenCalledTimes(1);
    expect(listenSpy).not.toHaveBeenCalled();
    expect(mockWorkerImport).not.toHaveBeenCalled();

    await runtime.shutdown();

    expect(mockCloseScheduleQueues).toHaveBeenCalledTimes(1);
  });
});
