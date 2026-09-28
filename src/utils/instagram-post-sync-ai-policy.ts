import { InstagramSyncReason } from '../queues/instagram-sync.queue';

export function shouldTriggerInstagramPostSyncAI(
  reason: InstagramSyncReason,
  enabledSetting = process.env.INSTAGRAM_POST_SYNC_AI_ENABLED,
): boolean {
  if (enabledSetting?.trim().toLowerCase() === 'false') return false;
  return reason === 'post_oauth' || reason === 'manual_retry';
}
