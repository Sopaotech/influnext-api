import { getInstagramFreshness } from '../src/utils/instagram-freshness';
import { getInstagramMetricCollection } from '../src/utils/instagram-metric-collection';
import { getInstagramSyncStatus } from '../src/utils/instagram-sync-status';

const now = new Date('2026-09-17T15:00:00.000Z');

function connectedSync(
  status: Parameters<typeof getInstagramSyncStatus>[0][number]['lastSyncStatus'],
  snapshotAt: Date | null,
  extra: Record<string, unknown> = {},
) {
  return getInstagramSyncStatus([
    {
      platformName: 'INSTAGRAM',
      isActive: true,
      lastSyncStatus: status,
      ...extra,
    },
  ], snapshotAt ? { capturedAt: snapshotAt } : null);
}

const completeCollection = getInstagramMetricCollection({
  instagramMetricCollection: {
    schemaVersion: 'instagram_recent_media_snapshot_v1',
    scope: 'recent_media_sample_30d',
    sampledMediaCount: 12,
    unavailableInsightCount: 0,
    isPartial: false,
    reachDefinition: 'controlled-test',
  },
}, true);

describe('Instagram freshness contract', () => {
  it('reports a current verified snapshot as fresh with its collection provenance', () => {
    const sync = connectedSync('SYNCED', new Date('2026-09-17T14:00:00.000Z'));

    expect(getInstagramFreshness(sync, completeCollection, { now })).toMatchObject({
      status: 'fresh',
      isVerifiedSnapshot: true,
      isStale: false,
      staleAfterHours: 24,
      collectionWindowDays: 30,
      sampleSize: 12,
      metricsSource: 'instagram_api_snapshot',
      syncAction: 'none',
      syncMessageKey: 'instagram.snapshot_fresh',
    });
  });

  it('reports an older verified snapshot as stale without changing its verification source', () => {
    const sync = connectedSync('SYNCED', new Date('2026-09-16T14:59:59.999Z'));

    expect(getInstagramFreshness(sync, completeCollection, { now })).toMatchObject({
      status: 'stale',
      isVerifiedSnapshot: true,
      isStale: true,
      metricsSource: 'instagram_api_snapshot',
      syncAction: 'none',
      syncMessageKey: 'instagram.snapshot_stale',
    });
  });

  it('prioritizes pending and active sync state over the age of a previous snapshot', () => {
    const snapshotAt = new Date('2026-09-16T10:00:00.000Z');

    expect(getInstagramFreshness(
      connectedSync('SYNC_PENDING', snapshotAt),
      completeCollection,
      { now },
    )).toMatchObject({ status: 'pending', isStale: true, syncAction: 'wait' });
    expect(getInstagramFreshness(
      connectedSync('SYNCING', snapshotAt),
      completeCollection,
      { now },
    )).toMatchObject({ status: 'syncing', isStale: true, syncAction: 'wait' });
  });

  it('maps retry and reconnect state to sanitized actions without exposing an error payload', () => {
    const unavailableCollection = getInstagramMetricCollection({}, false);

    expect(getInstagramFreshness(
      connectedSync('FAILED_RETRYABLE', null, { nextSyncRetryAt: new Date('2026-09-17T16:00:00.000Z') }),
      unavailableCollection,
      { now },
    )).toMatchObject({
      status: 'retry_scheduled',
      syncAction: 'retry_later',
      syncMessageKey: 'instagram.retry_scheduled',
      nextSyncRetryAt: new Date('2026-09-17T16:00:00.000Z'),
    });
    expect(getInstagramFreshness(
      connectedSync('FAILED_RECONNECT_REQUIRED', null),
      unavailableCollection,
      { now },
    )).toMatchObject({
      status: 'reconnect_required',
      syncAction: 'reconnect',
      syncMessageKey: 'instagram.reconnect_required',
    });
  });

  it('keeps a missing connection or snapshot unavailable and actionable without a false verified state', () => {
    const unavailableCollection = getInstagramMetricCollection({}, false);
    const disconnected = getInstagramSyncStatus([], null);
    const neverSynced = connectedSync('NEVER_SYNCED', null);

    expect(getInstagramFreshness(disconnected, unavailableCollection, { now })).toMatchObject({
      status: 'unavailable',
      isVerifiedSnapshot: false,
      metricsSource: 'unavailable',
      syncAction: 'connect',
      syncMessageKey: 'instagram.not_connected',
    });
    expect(getInstagramFreshness(neverSynced, unavailableCollection, { now })).toMatchObject({
      status: 'unavailable',
      isVerifiedSnapshot: false,
      metricsSource: 'unavailable',
      syncAction: 'none',
      syncMessageKey: 'instagram.snapshot_unavailable',
    });
  });
});
