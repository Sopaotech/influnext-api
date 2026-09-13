import { cleanupQueue, addDailyCleanupJob } from './cleanup.queue';
import { tokenRenewalQueue, addDailyTokenRenewalJob } from './token-renewal.queue';

/** Registers only recurring job metadata; it never starts workers or jobs directly. */
export async function registerApplicationSchedules(): Promise<void> {
  await Promise.all([
    cleanupQueue.waitUntilReady(),
    tokenRenewalQueue.waitUntilReady(),
  ]);

  await Promise.all([
    addDailyCleanupJob(),
    addDailyTokenRenewalJob(),
  ]);
}

export async function closeApplicationScheduleQueues(): Promise<void> {
  await Promise.allSettled([
    cleanupQueue.close(),
    tokenRenewalQueue.close(),
  ]);
}
