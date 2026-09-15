export type InstagramConnectionStatus = 'connected' | 'not_connected';
export type InstagramSyncStatus = 'connected_with_snapshot' | 'connected_without_snapshot' | 'not_connected';
export type InstagramOperationalSyncStatus =
  | 'not_connected'
  | 'never_synced'
  | 'sync_pending'
  | 'syncing'
  | 'synced'
  | 'partial'
  | 'no_recent_media'
  | 'failed_retryable'
  | 'failed_reconnect_required'
  | 'disabled';

export interface InstagramSyncStatusContract {
  instagramConnectionStatus: InstagramConnectionStatus;
  instagramSyncStatus: InstagramSyncStatus;
  instagramOperationalSyncStatus: InstagramOperationalSyncStatus;
  hasVerifiedSnapshot: boolean;
  lastSnapshotAt: Date | null;
  lastSyncAttemptAt: Date | null;
  lastSyncSuccessAt: Date | null;
  lastSyncFailureAt: Date | null;
  syncFailureCount: number;
  nextSyncRetryAt: Date | null;
  metricsSource: 'snapshot' | 'unavailable';
  syncWarning: string | null;
}

type InstagramPlatform = {
  platformName: string;
  isActive: boolean;
  lastSyncStatus?:
    | 'NEVER_SYNCED'
    | 'SYNC_PENDING'
    | 'SYNCING'
    | 'SYNCED'
    | 'PARTIAL'
    | 'NO_RECENT_MEDIA'
    | 'FAILED_RETRYABLE'
    | 'FAILED_RECONNECT_REQUIRED'
    | 'DISABLED';
  lastSyncAttemptAt?: Date | null;
  lastSyncSuccessAt?: Date | null;
  lastSyncFailureAt?: Date | null;
  syncFailureCount?: number;
  nextSyncRetryAt?: Date | null;
};

type InstagramSnapshot = {
  capturedAt: Date;
} | null | undefined;

function getOperationalStatus(platform: InstagramPlatform | undefined): InstagramOperationalSyncStatus {
  if (!platform) return 'not_connected';

  switch (platform.lastSyncStatus || 'NEVER_SYNCED') {
    case 'SYNC_PENDING': return 'sync_pending';
    case 'SYNCING': return 'syncing';
    case 'SYNCED': return 'synced';
    case 'PARTIAL': return 'partial';
    case 'NO_RECENT_MEDIA': return 'no_recent_media';
    case 'FAILED_RETRYABLE': return 'failed_retryable';
    case 'FAILED_RECONNECT_REQUIRED': return 'failed_reconnect_required';
    case 'DISABLED': return 'disabled';
    default: return 'never_synced';
  }
}

function getSyncWarning(
  operationalStatus: InstagramOperationalSyncStatus,
  hasVerifiedSnapshot: boolean,
): string | null {
  if (operationalStatus === 'failed_reconnect_required') {
    return 'A conexão com Instagram precisa ser refeita para atualizar as métricas.';
  }

  if (operationalStatus === 'failed_retryable') {
    return 'A sincronização do Instagram não foi concluída. Tente novamente mais tarde.';
  }

  if (operationalStatus === 'sync_pending' || operationalStatus === 'syncing') {
    return 'A sincronização do Instagram está em andamento.';
  }

  if (operationalStatus === 'no_recent_media') {
    return 'Instagram conectado, mas não há mídia recente para criar um snapshot verificável.';
  }

  if (operationalStatus === 'partial') {
    return 'O snapshot do Instagram possui métricas parciais.';
  }

  if (!hasVerifiedSnapshot) {
    return 'Instagram conectado, mas ainda não há snapshot verificável.';
  }

  return null;
}

/**
 * Keeps snapshot verification derived from MetricSnapshot while surfacing only
 * persisted, sanitized operational state from SocialPlatform.
 */
export function getInstagramSyncStatus(
  platforms: InstagramPlatform[],
  latestInstagramSnapshot: InstagramSnapshot,
): InstagramSyncStatusContract {
  const instagramPlatform = platforms.find(platform => platform.platformName === 'INSTAGRAM');
  const isConnected = Boolean(instagramPlatform?.isActive);

  if (!isConnected) {
    return {
      instagramConnectionStatus: 'not_connected',
      instagramSyncStatus: 'not_connected',
      instagramOperationalSyncStatus: instagramPlatform ? getOperationalStatus(instagramPlatform) : 'not_connected',
      hasVerifiedSnapshot: false,
      lastSnapshotAt: null,
      lastSyncAttemptAt: null,
      lastSyncSuccessAt: null,
      lastSyncFailureAt: null,
      syncFailureCount: 0,
      nextSyncRetryAt: null,
      metricsSource: 'unavailable',
      syncWarning: 'Instagram não conectado.',
    };
  }

  const hasVerifiedSnapshot = Boolean(latestInstagramSnapshot);
  const operationalStatus = getOperationalStatus(instagramPlatform);
  const syncWarning = getSyncWarning(operationalStatus, hasVerifiedSnapshot);

  if (!latestInstagramSnapshot) {
    return {
      instagramConnectionStatus: 'connected',
      instagramSyncStatus: 'connected_without_snapshot',
      instagramOperationalSyncStatus: operationalStatus,
      hasVerifiedSnapshot: false,
      lastSnapshotAt: null,
      lastSyncAttemptAt: instagramPlatform?.lastSyncAttemptAt || null,
      lastSyncSuccessAt: instagramPlatform?.lastSyncSuccessAt || null,
      lastSyncFailureAt: instagramPlatform?.lastSyncFailureAt || null,
      syncFailureCount: instagramPlatform?.syncFailureCount || 0,
      nextSyncRetryAt: instagramPlatform?.nextSyncRetryAt || null,
      metricsSource: 'unavailable',
      syncWarning,
    };
  }

  return {
    instagramConnectionStatus: 'connected',
    instagramSyncStatus: 'connected_with_snapshot',
    instagramOperationalSyncStatus: operationalStatus,
    hasVerifiedSnapshot: true,
    lastSnapshotAt: latestInstagramSnapshot.capturedAt,
    lastSyncAttemptAt: instagramPlatform?.lastSyncAttemptAt || null,
    lastSyncSuccessAt: instagramPlatform?.lastSyncSuccessAt || null,
    lastSyncFailureAt: instagramPlatform?.lastSyncFailureAt || null,
    syncFailureCount: instagramPlatform?.syncFailureCount || 0,
    nextSyncRetryAt: instagramPlatform?.nextSyncRetryAt || null,
    metricsSource: 'snapshot',
    syncWarning,
  };
}
