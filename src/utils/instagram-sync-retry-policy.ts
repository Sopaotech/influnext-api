export const MAX_AUTOMATIC_INSTAGRAM_SYNC_FAILURES = 3;

const INITIAL_RETRY_DELAY_MS = 5 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

/**
 * A retry is eligible only while the persisted consecutive failure count is
 * below the V1 cap. Reconnection remains a separate provider-evidenced state.
 */
export function canAutomaticallyRetryInstagramSync(failureCount: number): boolean {
  return failureCount < MAX_AUTOMATIC_INSTAGRAM_SYNC_FAILURES;
}

export function instagramSyncRetryAt(now: Date, failureCount: number): Date | null {
  if (!canAutomaticallyRetryInstagramSync(failureCount)) {
    return null;
  }

  const delay = Math.min(
    INITIAL_RETRY_DELAY_MS * (2 ** Math.max(failureCount - 1, 0)),
    MAX_RETRY_DELAY_MS,
  );
  return new Date(now.getTime() + delay);
}
