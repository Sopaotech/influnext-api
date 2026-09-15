import { SocialSyncStatus } from '@prisma/client';
import {
  enqueueInstagramSync,
  InstagramSyncEnqueueRequest,
  InstagramSyncEnqueueResult,
} from './instagram-sync-queue.service';
import { prisma } from '../lib/prisma';
import { MAX_AUTOMATIC_INSTAGRAM_SYNC_FAILURES } from '../utils/instagram-sync-retry-policy';

export interface InstagramSyncRetrySweepResult {
  eligible: number;
  enqueued: number;
  skipped: number;
}

export interface InstagramSyncRetrySweepOptions {
  now?: Date;
  enqueue?: (request: InstagramSyncEnqueueRequest) => Promise<InstagramSyncEnqueueResult>;
}

/**
 * Finds only expired, recoverable Instagram retries. The scheduler calls this
 * through a BullMQ job; it never reads tokens or calls an external provider.
 */
export async function enqueueEligibleInstagramSyncRetries(
  options: InstagramSyncRetrySweepOptions = {},
): Promise<InstagramSyncRetrySweepResult> {
  const now = options.now || new Date();
  const enqueue = options.enqueue || enqueueInstagramSync;
  const platforms = await prisma.socialPlatform.findMany({
    where: {
      platformName: 'INSTAGRAM',
      isActive: true,
      accessToken: { not: '' },
      lastSyncStatus: SocialSyncStatus.FAILED_RETRYABLE,
      nextSyncRetryAt: { lte: now },
      syncFailureCount: { lt: MAX_AUTOMATIC_INSTAGRAM_SYNC_FAILURES },
      OR: [
        { syncLeaseExpiresAt: null },
        { syncLeaseExpiresAt: { lte: now } },
      ],
    },
    select: { id: true, influencerId: true },
  });

  let enqueued = 0;
  let skipped = 0;

  for (const platform of platforms) {
    const result = await enqueue({
      socialPlatformId: platform.id,
      influencerId: platform.influencerId,
      reason: 'scheduled',
    });

    if (result.accepted) {
      enqueued += 1;
    } else {
      skipped += 1;
    }
  }

  return { eligible: platforms.length, enqueued, skipped };
}
