import { cleanupQueue, addDailyCleanupJob } from './cleanup.queue';
import { tokenRenewalQueue, addDailyTokenRenewalJob } from './token-renewal.queue';
import { instagramSyncQueue } from './instagram-sync.queue';
import {
  registerInstagramScheduledSyncDispatchSchedule,
  registerInstagramSyncRetrySchedule,
} from './schedule-registration';

/** Registers only recurring job metadata; it never starts workers or jobs directly. */
export async function registerApplicationSchedules(): Promise<void> {
  await Promise.all([
    cleanupQueue.waitUntilReady(),
    tokenRenewalQueue.waitUntilReady(),
    instagramSyncQueue.waitUntilReady(),
  ]);

  await Promise.all([
    addDailyCleanupJob(),
    addDailyTokenRenewalJob(),
    registerInstagramSyncRetrySchedule(instagramSyncQueue),
    registerInstagramScheduledSyncDispatchSchedule(instagramSyncQueue),
  ]);
}

export async function closeApplicationScheduleQueues(): Promise<void> {
  await Promise.allSettled([
    cleanupQueue.close(),
    tokenRenewalQueue.close(),
    instagramSyncQueue.close(),
  ]);
}
