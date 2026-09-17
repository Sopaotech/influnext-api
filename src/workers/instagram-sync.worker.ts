import { ConnectionOptions, Job, Worker, WorkerOptions } from 'bullmq';
import { SocialSyncStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';
import {
  InstagramSyncJobData,
  InstagramSyncQueueJobData,
  INSTAGRAM_SCHEDULED_SYNC_DISPATCH_JOB_NAME,
  INSTAGRAM_SYNC_QUEUE_NAME,
  INSTAGRAM_SYNC_RETRY_JOB_NAME,
} from '../queues/instagram-sync.queue';
import { InstagramService } from '../services/instagram.service';
import { enqueueEligibleInstagramSyncRetries } from '../services/instagram-sync-retry.service';
import { dispatchEligibleScheduledInstagramSyncs } from '../services/instagram-scheduled-sync.service';
import { classifyInstagramSyncFailure, InstagramSyncOperationalError } from '../utils/instagram-sync-error';
import { instagramSyncRetryAt } from '../utils/instagram-sync-retry-policy';
import { decryptSocialToken } from '../utils/social-token-crypto';

const SYNC_LEASE_MS = 10 * 60 * 1000;

type InstagramSyncWorkerDependencies = {
  retrySweep?: typeof enqueueEligibleInstagramSyncRetries;
  scheduledSyncDispatch?: typeof dispatchEligibleScheduledInstagramSyncs;
};

function isPartialCollection(result: any): boolean {
  return Boolean(result?.collection?.isPartial);
}

/**
 * Only direct user-initiated connection and manual refreshes may opt in to the
 * legacy post-snapshot AI analysis. Retry and scheduled jobs collect metrics
 * only, so a periodic dispatcher cannot create an uncontrolled AI fan-out.
 */
function shouldTriggerPostSnapshotAI(reason: InstagramSyncJobData['reason']): boolean {
  return reason === 'post_oauth' || reason === 'manual_retry';
}

export async function processInstagramSyncWithDependencies(
  job: Job<InstagramSyncQueueJobData>,
  dependencies: InstagramSyncWorkerDependencies,
): Promise<{
  status: 'synced' | 'partial' | 'no_recent_media' | 'retry_scan_completed' | 'scheduled_sync_dispatch_completed' | 'skipped';
  enqueued?: number;
}> {
  if (job.name === INSTAGRAM_SYNC_RETRY_JOB_NAME) {
    const result = await (dependencies.retrySweep || enqueueEligibleInstagramSyncRetries)();
    return { status: 'retry_scan_completed', enqueued: result.enqueued };
  }

  if (job.name === INSTAGRAM_SCHEDULED_SYNC_DISPATCH_JOB_NAME) {
    const result = await (dependencies.scheduledSyncDispatch || dispatchEligibleScheduledInstagramSyncs)();
    return { status: 'scheduled_sync_dispatch_completed', enqueued: result.enqueued };
  }

  if (job.name !== 'sync-instagram') return { status: 'skipped' };

  const data = job.data as InstagramSyncJobData;

  const platform = await prisma.socialPlatform.findUnique({
    where: { id: data.socialPlatformId },
    select: {
      id: true,
      influencerId: true,
      platformName: true,
      platformId: true,
      accessToken: true,
      isActive: true,
      lastSyncStatus: true,
      syncLeaseExpiresAt: true,
      syncFailureCount: true,
    },
  });

  if (!platform
    || platform.influencerId !== data.influencerId
    || platform.platformName !== 'INSTAGRAM'
    || !platform.isActive) {
    return { status: 'skipped' };
  }

  const startedAt = new Date();
  if (platform.lastSyncStatus === SocialSyncStatus.SYNCING
    && platform.syncLeaseExpiresAt
    && platform.syncLeaseExpiresAt > startedAt) {
    return { status: 'skipped' };
  }

  await prisma.socialPlatform.update({
    where: { id: platform.id },
    data: {
      lastSyncStatus: SocialSyncStatus.SYNCING,
      lastSyncAttemptAt: startedAt,
      syncLeaseExpiresAt: new Date(startedAt.getTime() + SYNC_LEASE_MS),
      nextSyncRetryAt: null,
    },
  });

  try {
    const accessToken = decryptSocialToken(platform.accessToken, {
      influencerId: platform.influencerId,
      platformName: 'INSTAGRAM',
      field: 'accessToken',
    }).value;
    const result = await InstagramService.syncInstagramData(
      platform.influencerId,
      accessToken,
      platform.platformId,
      { triggerAIAnalysis: shouldTriggerPostSnapshotAI(data.reason) },
    );
    const finishedAt = new Date();

    if (!result.snapshotCreated) {
      await prisma.socialPlatform.update({
        where: { id: platform.id },
        data: {
          lastSyncStatus: SocialSyncStatus.NO_RECENT_MEDIA,
          lastSyncSuccessAt: finishedAt,
          lastSyncFailureAt: null,
          lastSyncErrorCode: null,
          syncFailureCount: 0,
          nextSyncRetryAt: null,
          syncLeaseExpiresAt: null,
        },
      });
      return { status: 'no_recent_media' };
    }

    const partial = isPartialCollection(result);
    await prisma.socialPlatform.update({
      where: { id: platform.id },
      data: {
        lastSyncStatus: partial ? SocialSyncStatus.PARTIAL : SocialSyncStatus.SYNCED,
        lastSyncSuccessAt: finishedAt,
        lastSyncFailureAt: null,
        lastSyncErrorCode: null,
        syncFailureCount: 0,
        nextSyncRetryAt: null,
        syncLeaseExpiresAt: null,
      },
    });
    return { status: partial ? 'partial' : 'synced' };
  } catch (error) {
    const failure = error instanceof InstagramSyncOperationalError
      ? { code: error.code, reconnectRequired: error.reconnectRequired }
      : classifyInstagramSyncFailure(error);
    const failedAt = new Date();
    const failureCount = platform.syncFailureCount + 1;

    await prisma.socialPlatform.update({
      where: { id: platform.id },
      data: {
        lastSyncStatus: failure.reconnectRequired
          ? SocialSyncStatus.FAILED_RECONNECT_REQUIRED
          : SocialSyncStatus.FAILED_RETRYABLE,
        lastSyncFailureAt: failedAt,
        lastSyncErrorCode: failure.code,
        syncFailureCount: failureCount,
        nextSyncRetryAt: failure.reconnectRequired ? null : instagramSyncRetryAt(failedAt, failureCount),
        syncLeaseExpiresAt: null,
      },
    });

    // Preserve a failed BullMQ job without emitting a provider error, token, or stack trace.
    console.error('[INSTAGRAM_SYNC] Falha controlada no job de sincronização.', { code: failure.code });
    throw new Error('Instagram sync job failed.');
  }
}

export async function processInstagramSync(
  job: Job<InstagramSyncQueueJobData>,
): Promise<{
  status: 'synced' | 'partial' | 'no_recent_media' | 'retry_scan_completed' | 'scheduled_sync_dispatch_completed' | 'skipped';
  enqueued?: number;
}> {
  return processInstagramSyncWithDependencies(job, {});
}

export type ControlledInstagramSyncWorkerOptions = Pick<WorkerOptions, 'prefix'> & {
  connection?: ConnectionOptions;
};

/** Creates the consumer only; importing it never starts Redis work. */
export function createInstagramSyncWorker(
  options: ControlledInstagramSyncWorkerOptions = {},
): Worker<InstagramSyncQueueJobData> {
  return new Worker(INSTAGRAM_SYNC_QUEUE_NAME, processInstagramSync, {
    connection: options.connection || redisConnection,
    prefix: options.prefix,
  });
}

export let instagramSyncWorker: Worker<InstagramSyncQueueJobData> | undefined;

export function startInstagramSyncWorker(): Worker<InstagramSyncQueueJobData> {
  instagramSyncWorker ||= createInstagramSyncWorker();
  return instagramSyncWorker;
}
