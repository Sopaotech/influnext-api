import { SocialSyncStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  enqueueInstagramSync,
  InstagramSyncEnqueueRequest,
  InstagramSyncEnqueueResult,
} from './instagram-sync-queue.service';

/** The initial V1 cadence permits at most one scheduled collection per account each day. */
export const INSTAGRAM_SCHEDULED_SYNC_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const INSTAGRAM_SCHEDULED_SYNC_BATCH_SIZE = 25;

export interface InstagramScheduledSyncDispatchResult {
  scanned: number;
  eligible: number;
  enqueued: number;
  skipped: number;
  failed: number;
}

export interface InstagramScheduledSyncDispatchOptions {
  now?: Date;
  enqueue?: (request: InstagramSyncEnqueueRequest) => Promise<InstagramSyncEnqueueResult>;
}

/**
 * Finds only healthy Instagram connections whose newest successful collection
 * evidence is at least 24 hours old. It never decrypts tokens or calls a
 * provider: it only hands token-free work to the existing queue boundary.
 */
export async function dispatchEligibleScheduledInstagramSyncs(
  options: InstagramScheduledSyncDispatchOptions = {},
): Promise<InstagramScheduledSyncDispatchResult> {
  const now = options.now || new Date();
  const freshnessCutoff = new Date(now.getTime() - INSTAGRAM_SCHEDULED_SYNC_MIN_INTERVAL_MS);
  const enqueue = options.enqueue || enqueueInstagramSync;

  const platforms = await prisma.socialPlatform.findMany({
    where: {
      platformName: 'INSTAGRAM',
      isActive: true,
      accessToken: { not: '' },
      lastSyncStatus: { in: [SocialSyncStatus.SYNCED, SocialSyncStatus.PARTIAL] },
      nextSyncRetryAt: null,
      OR: [
        { syncLeaseExpiresAt: null },
        { syncLeaseExpiresAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { lastSyncSuccessAt: { lte: freshnessCutoff } },
            {
              lastSyncSuccessAt: null,
              influencer: {
                metricsHistory: {
                  some: { provider: 'INSTAGRAM', capturedAt: { lte: freshnessCutoff } },
                },
              },
            },
          ],
        },
        {
          NOT: {
            influencer: {
              metricsHistory: {
                some: { provider: 'INSTAGRAM', capturedAt: { gt: freshnessCutoff } },
              },
            },
          },
        },
      ],
    },
    orderBy: { lastSyncSuccessAt: 'asc' },
    take: INSTAGRAM_SCHEDULED_SYNC_BATCH_SIZE,
    select: { id: true, influencerId: true },
  });

  let enqueued = 0;
  let skipped = 0;
  let failed = 0;

  for (const platform of platforms) {
    try {
      const result = await enqueue({
        socialPlatformId: platform.id,
        influencerId: platform.influencerId,
        reason: 'scheduled',
      });

      if (result.accepted) {
        enqueued += 1;
      } else if (result.status === 'failed_retryable') {
        failed += 1;
      } else {
        skipped += 1;
      }
    } catch {
      // A single malformed or concurrently changed connection must not stop the batch.
      failed += 1;
    }
  }

  return {
    scanned: platforms.length,
    eligible: platforms.length,
    enqueued,
    skipped,
    failed,
  };
}
