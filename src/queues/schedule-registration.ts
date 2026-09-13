import { Queue } from 'bullmq';

export const DAILY_CLEANUP_PATTERN = '0 3 * * *';
export const DAILY_TOKEN_RENEWAL_PATTERN = '0 4 * * *';

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
