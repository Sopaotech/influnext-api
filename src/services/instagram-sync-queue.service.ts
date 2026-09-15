import { SocialSyncStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  addInstagramSyncJob,
  InstagramSyncJobData,
  InstagramSyncReason,
} from '../queues/instagram-sync.queue';
import { instagramSyncRetryAt } from '../utils/instagram-sync-retry-policy';

export interface InstagramSyncEnqueueRequest {
  socialPlatformId: string;
  influencerId: string;
  reason: InstagramSyncReason;
  requestedByUserId?: string;
}

export interface InstagramSyncEnqueueResult {
  accepted: boolean;
  status: 'sync_pending' | 'syncing' | 'failed_retryable';
}

export interface InstagramSyncEnqueueDependencies {
  enqueueJob?: typeof addInstagramSyncJob;
}

/**
 * Persists a truthful pending state before handing the work to BullMQ. This is
 * intentionally the only queue boundary used by HTTP callbacks and manual
 * retry requests, so credentials never cross the queue payload.
 */
export async function enqueueInstagramSync(
  request: InstagramSyncEnqueueRequest,
  dependencies: InstagramSyncEnqueueDependencies = {},
): Promise<InstagramSyncEnqueueResult> {
  const platform = await prisma.socialPlatform.findUnique({
    where: { id: request.socialPlatformId },
    select: {
      id: true,
      influencerId: true,
      platformName: true,
      isActive: true,
      lastSyncStatus: true,
      syncLeaseExpiresAt: true,
      syncFailureCount: true,
    },
  });

  if (!platform
    || platform.influencerId !== request.influencerId
    || platform.platformName !== 'INSTAGRAM'
    || !platform.isActive) {
    throw new Error('Instagram connection is not available for synchronization.');
  }

  const now = new Date();
  if (platform.lastSyncStatus === SocialSyncStatus.SYNCING
    && platform.syncLeaseExpiresAt
    && platform.syncLeaseExpiresAt > now) {
    return { accepted: false, status: 'syncing' };
  }

  await prisma.socialPlatform.update({
    where: { id: platform.id },
    data: {
      lastSyncStatus: SocialSyncStatus.SYNC_PENDING,
      lastSyncAttemptAt: now,
      lastSyncErrorCode: null,
      nextSyncRetryAt: null,
      syncLeaseExpiresAt: null,
    },
  });

  const payload: InstagramSyncJobData = {
    socialPlatformId: platform.id,
    influencerId: platform.influencerId,
    reason: request.reason,
    ...(request.requestedByUserId ? { requestedByUserId: request.requestedByUserId } : {}),
  };

  try {
    await (dependencies.enqueueJob || addInstagramSyncJob)(payload);
    return { accepted: true, status: 'sync_pending' };
  } catch {
    const failedAt = new Date();
    await prisma.socialPlatform.update({
      where: { id: platform.id },
      data: {
        lastSyncStatus: SocialSyncStatus.FAILED_RETRYABLE,
        lastSyncFailureAt: failedAt,
        lastSyncErrorCode: 'QUEUE_UNAVAILABLE',
        syncFailureCount: { increment: 1 },
        nextSyncRetryAt: instagramSyncRetryAt(failedAt, platform.syncFailureCount + 1),
        syncLeaseExpiresAt: null,
      },
    });
    return { accepted: false, status: 'failed_retryable' };
  }
}
