import { ConnectionOptions, Job, Worker, WorkerOptions } from 'bullmq';
import { SocialSyncStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { redisConnection } from '../lib/redis';
import { InstagramSyncJobData, INSTAGRAM_SYNC_QUEUE_NAME } from '../queues/instagram-sync.queue';
import { InstagramService } from '../services/instagram.service';
import { classifyInstagramSyncFailure, InstagramSyncOperationalError } from '../utils/instagram-sync-error';
import { decryptSocialToken } from '../utils/social-token-crypto';

const SYNC_LEASE_MS = 10 * 60 * 1000;
const INITIAL_RETRY_DELAY_MS = 5 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

function retryAt(now: Date, failureCount: number): Date {
  const delay = Math.min(INITIAL_RETRY_DELAY_MS * (2 ** Math.max(failureCount - 1, 0)), MAX_RETRY_DELAY_MS);
  return new Date(now.getTime() + delay);
}

function isPartialCollection(result: any): boolean {
  return Boolean(result?.collection?.isPartial);
}

export async function processInstagramSync(job: Job<InstagramSyncJobData>): Promise<{
  status: 'synced' | 'partial' | 'no_recent_media' | 'skipped';
}> {
  if (job.name !== 'sync-instagram') return { status: 'skipped' };

  const platform = await prisma.socialPlatform.findUnique({
    where: { id: job.data.socialPlatformId },
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
    || platform.influencerId !== job.data.influencerId
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
        nextSyncRetryAt: failure.reconnectRequired ? null : retryAt(failedAt, failureCount),
        syncLeaseExpiresAt: null,
      },
    });

    // Preserve a failed BullMQ job without emitting a provider error, token, or stack trace.
    console.error('[INSTAGRAM_SYNC] Falha controlada no job de sincronização.', { code: failure.code });
    throw new Error('Instagram sync job failed.');
  }
}

export type ControlledInstagramSyncWorkerOptions = Pick<WorkerOptions, 'prefix'> & {
  connection?: ConnectionOptions;
};

/** Creates the consumer only; importing it never starts Redis work. */
export function createInstagramSyncWorker(
  options: ControlledInstagramSyncWorkerOptions = {},
): Worker<InstagramSyncJobData> {
  return new Worker(INSTAGRAM_SYNC_QUEUE_NAME, processInstagramSync, {
    connection: options.connection || redisConnection,
    prefix: options.prefix,
  });
}

export let instagramSyncWorker: Worker<InstagramSyncJobData> | undefined;

export function startInstagramSyncWorker(): Worker<InstagramSyncJobData> {
  instagramSyncWorker ||= createInstagramSyncWorker();
  return instagramSyncWorker;
}
