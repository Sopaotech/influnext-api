export interface InstagramMetricCollectionContract {
  scope: 'recent_media_sample_30d' | 'unknown' | 'unavailable';
  isPartial: boolean | null;
  sampledMediaCount: number | null;
  unavailableInsightCount: number | null;
  reachDefinition: string | null;
  warning: string | null;
}

type StoredCollection = {
  schemaVersion?: unknown;
  scope?: unknown;
  sampledMediaCount?: unknown;
  unavailableInsightCount?: unknown;
  isPartial?: unknown;
  reachDefinition?: unknown;
};

function isStoredCollection(value: unknown): value is StoredCollection {
  return typeof value === 'object' && value !== null;
}

/**
 * Exposes only collection provenance that is safe for a client response.
 * The MetricSnapshot schema has no quality columns, so this reads the metadata
 * written alongside the snapshot in InfluencerProfile.insights.
 */
export function getInstagramMetricCollection(
  insights: unknown,
  hasVerifiedSnapshot: boolean,
): InstagramMetricCollectionContract {
  if (!hasVerifiedSnapshot) {
    return {
      scope: 'unavailable',
      isPartial: null,
      sampledMediaCount: null,
      unavailableInsightCount: null,
      reachDefinition: null,
      warning: 'Não há snapshot Instagram verificável para esta conta.',
    };
  }

  const stored = isStoredCollection(insights)
    ? (insights as { instagramMetricCollection?: unknown }).instagramMetricCollection
    : undefined;

  if (
    !isStoredCollection(stored)
    || stored.schemaVersion !== 'instagram_recent_media_snapshot_v1'
    || stored.scope !== 'recent_media_sample_30d'
  ) {
    return {
      scope: 'unknown',
      isPartial: null,
      sampledMediaCount: null,
      unavailableInsightCount: null,
      reachDefinition: null,
      warning: 'A abrangência deste snapshot Instagram não foi registrada.',
    };
  }

  const isPartial = stored.isPartial === true;
  const sampledMediaCount = typeof stored.sampledMediaCount === 'number'
    ? stored.sampledMediaCount
    : null;
  const unavailableInsightCount = typeof stored.unavailableInsightCount === 'number'
    ? stored.unavailableInsightCount
    : null;
  const reachDefinition = typeof stored.reachDefinition === 'string'
    ? stored.reachDefinition
    : null;

  return {
    scope: 'recent_media_sample_30d',
    isPartial,
    sampledMediaCount,
    unavailableInsightCount,
    reachDefinition,
    warning: isPartial
      ? 'Snapshot Instagram parcial: algumas mídias não retornaram insights.'
      : 'O alcance representa uma amostra de até 15 mídias disponíveis nos últimos 30 dias, não o alcance total da conta.',
  };
}
