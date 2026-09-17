import { InstagramMetricCollectionContract } from './instagram-metric-collection';
import { InstagramSyncStatusContract } from './instagram-sync-status';

export const INSTAGRAM_FRESHNESS_STALE_AFTER_HOURS = 24;
const INSTAGRAM_FRESHNESS_STALE_AFTER_MS = INSTAGRAM_FRESHNESS_STALE_AFTER_HOURS * 60 * 60 * 1000;

export type InstagramFreshnessStatus =
  | 'fresh'
  | 'stale'
  | 'unavailable'
  | 'pending'
  | 'syncing'
  | 'retry_scheduled'
  | 'reconnect_required';

export type InstagramSyncAction = 'none' | 'wait' | 'retry_later' | 'reconnect' | 'connect';

/**
 * A client-safe account of the freshness and operational availability of the
 * Instagram data currently shown by a payload. It is derived exclusively from
 * persisted sync state, the latest MetricSnapshot, and saved provenance.
 */
export interface InstagramFreshnessContract {
  status: InstagramFreshnessStatus;
  lastSnapshotAt: Date | null;
  lastSyncSuccessAt: Date | null;
  lastSyncAttemptAt: Date | null;
  nextSyncRetryAt: Date | null;
  isVerifiedSnapshot: boolean;
  isStale: boolean;
  staleAfterHours: number;
  collectionWindowDays: number | null;
  sampleSize: number | null;
  metricsSource: 'instagram_api_snapshot' | 'unavailable';
  syncAction: InstagramSyncAction;
  syncMessageKey: string;
}

function collectionWindowDays(collection: InstagramMetricCollectionContract): number | null {
  return collection.scope === 'recent_media_sample_30d' ? 30 : null;
}

function baseContract(
  sync: InstagramSyncStatusContract,
  collection: InstagramMetricCollectionContract,
  now: Date,
): Omit<InstagramFreshnessContract, 'status' | 'syncAction' | 'syncMessageKey'> {
  const isVerifiedSnapshot = sync.hasVerifiedSnapshot;
  const isStale = Boolean(
    sync.lastSnapshotAt
      && now.getTime() - sync.lastSnapshotAt.getTime() > INSTAGRAM_FRESHNESS_STALE_AFTER_MS,
  );

  return {
    lastSnapshotAt: sync.lastSnapshotAt,
    lastSyncSuccessAt: sync.lastSyncSuccessAt,
    lastSyncAttemptAt: sync.lastSyncAttemptAt,
    nextSyncRetryAt: sync.nextSyncRetryAt,
    isVerifiedSnapshot,
    isStale,
    staleAfterHours: INSTAGRAM_FRESHNESS_STALE_AFTER_HOURS,
    collectionWindowDays: isVerifiedSnapshot ? collectionWindowDays(collection) : null,
    sampleSize: isVerifiedSnapshot ? collection.sampledMediaCount : null,
    metricsSource: isVerifiedSnapshot ? 'instagram_api_snapshot' : 'unavailable',
  };
}

export function getInstagramFreshness(
  sync: InstagramSyncStatusContract,
  collection: InstagramMetricCollectionContract,
  options: { now?: Date } = {},
): InstagramFreshnessContract {
  const now = options.now || new Date();
  const base = baseContract(sync, collection, now);

  if (sync.instagramConnectionStatus === 'not_connected' || sync.instagramOperationalSyncStatus === 'disabled') {
    return { ...base, status: 'unavailable', syncAction: 'connect', syncMessageKey: 'instagram.not_connected' };
  }

  switch (sync.instagramOperationalSyncStatus) {
    case 'sync_pending':
      return { ...base, status: 'pending', syncAction: 'wait', syncMessageKey: 'instagram.sync_pending' };
    case 'syncing':
      return { ...base, status: 'syncing', syncAction: 'wait', syncMessageKey: 'instagram.syncing' };
    case 'failed_retryable':
      return { ...base, status: 'retry_scheduled', syncAction: 'retry_later', syncMessageKey: 'instagram.retry_scheduled' };
    case 'failed_reconnect_required':
      return { ...base, status: 'reconnect_required', syncAction: 'reconnect', syncMessageKey: 'instagram.reconnect_required' };
    case 'no_recent_media':
      return { ...base, status: 'unavailable', syncAction: 'none', syncMessageKey: 'instagram.no_recent_media' };
    default:
      break;
  }

  if (!base.isVerifiedSnapshot) {
    return { ...base, status: 'unavailable', syncAction: 'none', syncMessageKey: 'instagram.snapshot_unavailable' };
  }

  if (base.isStale) {
    return { ...base, status: 'stale', syncAction: 'none', syncMessageKey: 'instagram.snapshot_stale' };
  }

  return { ...base, status: 'fresh', syncAction: 'none', syncMessageKey: 'instagram.snapshot_fresh' };
}
