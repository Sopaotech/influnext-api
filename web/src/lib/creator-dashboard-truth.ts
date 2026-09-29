export const NO_DATA_LABEL = 'Ainda sem dados';

export function getPublicProfileTitleSegment(handle: string, scoreClass: string | null): string {
  return scoreClass ? `${handle} [${scoreClass}]` : handle;
}

export function firstAvailableMetric(...values: Array<number | null | undefined>): number | null {
  return values.find((value): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0,
  ) ?? null;
}

export function formatAvailableCount(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value.toLocaleString('pt-BR')
    : NO_DATA_LABEL;
}

export function hasPersistedScore(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function getVerifiedScoreClass(
  score: number | null | undefined,
  scoreClass: string | null | undefined,
  hasVerifiedMetrics: boolean,
): string | null {
  const validClasses = new Set(['BRONZE', 'SILVER', 'GOLD', 'ELITE']);
  return hasVerifiedMetrics && hasPersistedScore(score) && scoreClass && validClasses.has(scoreClass)
    ? scoreClass
    : null;
}

export function getMeasuredAvgViews(
  snapshots: Array<{ avgViews?: number | null }> | null | undefined,
): number | null {
  const value = snapshots?.[0]?.avgViews;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export function getPerformancePercentage(
  averageMultiplier: number | null | undefined,
  sampleCount: number | null | undefined,
): number | null {
  if (typeof averageMultiplier !== 'number' || !Number.isFinite(averageMultiplier)) return null;
  if (typeof sampleCount !== 'number' || !Number.isInteger(sampleCount) || sampleCount < 1) return null;
  return Math.round((averageMultiplier - 1) * 100);
}

export function getInstagramNoDataMessage(
  connectionStatus: string | null | undefined,
  syncStatus: string | null | undefined,
): string | null {
  if (connectionStatus !== 'connected') return null;
  if (syncStatus === 'no_recent_media') {
    return 'Instagram conectado. Nenhuma publicação recente disponível para calcular estas métricas.';
  }
  if (syncStatus === 'connected_without_snapshot' || syncStatus === 'never_synced') {
    return 'Instagram conectado. Aguardando sincronização para disponibilizar estas métricas.';
  }
  return null;
}
