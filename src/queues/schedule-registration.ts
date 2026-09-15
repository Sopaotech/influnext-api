import { Queue } from 'bullmq';
import { INSTAGRAM_SYNC_RETRY_JOB_NAME } from './instagram-sync.queue';

export const DAILY_CLEANUP_PATTERN = '0 3 * * *';
export const DAILY_TOKEN_RENEWAL_PATTERN = '0 4 * * *';
export const INSTAGRAM_SYNC_RETRY_PATTERN = '*/15 * * * *';
export const INSTAGRAM_SYNC_RETRY_SCHEDULE_JOB_ID = 'instagram-sync-retry-schedule';

/**
 * Keep the legacy repeatable-job representation while its production state is
 * unknown. BullMQ deterministically derives the repeat key from the stable job
 * name and repeat options, so registering the same schedule is idempotent.
 */
export async function registerDailyCleanupSchedule(queue: Queue): Promise<void> {
  await queue.add('daily-cleanup', {}, {
    repeat: { pattern: DAILY_CLEANUP_PATTERN },
  });
}

export async function registerDailyTokenRenewalSchedule(queue: Queue): Promise<void> {
  await queue.add('daily-token-renewal', {}, {
    repeat: { pattern: DAILY_TOKEN_RENEWAL_PATTERN },
  });
}

/** Registers retry discovery only. A worker later enqueues and processes eligible syncs. */
export async function registerInstagramSyncRetrySchedule(queue: Queue): Promise<void> {
  await queue.add(INSTAGRAM_SYNC_RETRY_JOB_NAME, {}, {
    jobId: INSTAGRAM_SYNC_RETRY_SCHEDULE_JOB_ID,
    repeat: { pattern: INSTAGRAM_SYNC_RETRY_PATTERN },
  });
}
