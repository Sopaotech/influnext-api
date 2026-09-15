import { Job, Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';

export const INSTAGRAM_SYNC_QUEUE_NAME = 'instagram-sync';

export type InstagramSyncReason = 'post_oauth' | 'manual_retry' | 'scheduled';

/**
 * Deliberately token-free data for Instagram synchronization jobs. The worker
 * resolves the encrypted credential from SocialPlatform only after it starts.
 */
export interface InstagramSyncJobData {
  socialPlatformId: string;
  influencerId: string;
  reason: InstagramSyncReason;
  requestedByUserId?: string;
}

const instagramSyncQueuePrefix = process.env.INSTAGRAM_SYNC_QUEUE_PREFIX?.trim() || undefined;

export const instagramSyncQueue = new Queue<InstagramSyncJobData>(INSTAGRAM_SYNC_QUEUE_NAME, {
  connection: redisConnection,
  ...(instagramSyncQueuePrefix ? { prefix: instagramSyncQueuePrefix } : {}),
});

instagramSyncQueue.on('error', () => {
  // Runtime readiness owns connection reporting. Queue imports remain lazy.
});

export function instagramSyncJobId(socialPlatformId: string): string {
  // BullMQ reserves ':' as part of its Redis key format.
  return `instagram-sync-${socialPlatformId}`;
}

export async function addInstagramSyncJob(
  data: InstagramSyncJobData,
): Promise<Job<InstagramSyncJobData>> {
  await instagramSyncQueue.waitUntilReady();
  return instagramSyncQueue.add('sync-instagram', data, {
    jobId: instagramSyncJobId(data.socialPlatformId),
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: true,
  });
}
