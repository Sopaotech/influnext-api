export type InstagramConnectionStatus = 'connected' | 'not_connected';
export type InstagramSyncStatus = 'connected_with_snapshot' | 'connected_without_snapshot' | 'not_connected';

export interface InstagramSyncStatusContract {
  instagramConnectionStatus: InstagramConnectionStatus;
  instagramSyncStatus: InstagramSyncStatus;
  hasVerifiedSnapshot: boolean;
  lastSnapshotAt: Date | null;
  metricsSource: 'snapshot' | 'unavailable';
  syncWarning: string | null;
}

type InstagramPlatform = {
  platformName: string;
  isActive: boolean;
};

type InstagramSnapshot = {
  capturedAt: Date;
} | null | undefined;

/**
 * Derives an honest Instagram sync boundary from persisted facts only.
 * We intentionally do not expose transient states such as "syncing" or
 * provider failure because the current model does not persist them reliably.
 */
export function getInstagramSyncStatus(
  platforms: InstagramPlatform[],
  latestInstagramSnapshot: InstagramSnapshot,
): InstagramSyncStatusContract {
  const isConnected = platforms.some(
    platform => platform.platformName === 'INSTAGRAM' && platform.isActive,
  );

  if (!isConnected) {
    return {
      instagramConnectionStatus: 'not_connected',
      instagramSyncStatus: 'not_connected',
      hasVerifiedSnapshot: false,
      lastSnapshotAt: null,
      metricsSource: 'unavailable',
      syncWarning: 'Instagram não conectado.',
    };
  }

  if (!latestInstagramSnapshot) {
    return {
      instagramConnectionStatus: 'connected',
      instagramSyncStatus: 'connected_without_snapshot',
      hasVerifiedSnapshot: false,
      lastSnapshotAt: null,
      metricsSource: 'unavailable',
      syncWarning: 'Instagram conectado, mas ainda não há snapshot verificável.',
    };
  }

  return {
    instagramConnectionStatus: 'connected',
    instagramSyncStatus: 'connected_with_snapshot',
    hasVerifiedSnapshot: true,
    lastSnapshotAt: latestInstagramSnapshot.capturedAt,
    metricsSource: 'snapshot',
    syncWarning: null,
  };
}
