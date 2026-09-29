import fs from 'node:fs';
import path from 'node:path';
import {
  formatAvailableCount,
  getInstagramNoDataMessage,
  getMeasuredAvgViews,
  getPerformancePercentage,
  getPublicProfileTitleSegment,
  getVerifiedScoreClass,
  hasPersistedScore,
} from '../web/src/lib/creator-dashboard-truth';

describe('creator dashboard truthfulness', () => {
  test('keeps real zero values and does not invent missing metrics', () => {
    expect(formatAvailableCount(0)).toBe('0');
    expect(formatAvailableCount(null)).toBe('Ainda sem dados');
    expect(formatAvailableCount(undefined)).toBe('Ainda sem dados');
  });

  test('does not treat an absent or default score as a persisted score', () => {
    expect(hasPersistedScore(null)).toBe(false);
    expect(hasPersistedScore(0)).toBe(false);
    expect(hasPersistedScore(845)).toBe(true);
  });

  test('public metadata requires a verified persisted score and class', () => {
    expect(getVerifiedScoreClass(0, 'BRONZE', false)).toBeNull();
    expect(getVerifiedScoreClass(80, 'GOLD', false)).toBeNull();
    expect(getVerifiedScoreClass(0, 'BRONZE', true)).toBeNull();
    expect(getVerifiedScoreClass(80, 'GOLD', true)).toBe('GOLD');
    const metadataSource = fs.readFileSync(path.join(process.cwd(), 'web/src/app/p/[handle]/page.tsx'), 'utf8');
    expect(metadataSource).not.toContain("profile.scoreClass || 'BRONZE'");
    expect(metadataSource).toContain('getVerifiedScoreClass(profile.influScore, profile.scoreClass, profile.verifiedMetrics)');
  });

  test('public profile title uses the root brand template exactly once', () => {
    expect(getPublicProfileTitleSegment('influnext.br', null)).toBe('influnext.br');
    expect(`${getPublicProfileTitleSegment('influnext.br', null)} | InfluNext`).toBe('influnext.br | InfluNext');
    expect(getPublicProfileTitleSegment('influnext.br', 'BRONZE')).toBe('influnext.br [BRONZE]');

    const layout = fs.readFileSync(path.join(process.cwd(), 'web/src/app/layout.tsx'), 'utf8');
    const metadataSource = fs.readFileSync(path.join(process.cwd(), 'web/src/app/p/[handle]/page.tsx'), 'utf8');
    expect(layout).toContain('template: "%s | InfluNext"');
    expect(metadataSource).toContain('getPublicProfileTitleSegment(profile.handle, scoreLabel)');
    expect(metadataSource).not.toMatch(/profile\.handle}\s*\|\s*InfluNext.*BRONZE/i);
    expect(metadataSource).not.toContain("profile.scoreClass || 'BRONZE'");
  });

  test('performance stays unavailable without samples and preserves measured zero', () => {
    expect(getPerformancePercentage(1, 0)).toBeNull();
    expect(getPerformancePercentage(1, null)).toBeNull();
    expect(getPerformancePercentage(1, 1)).toBe(0);
    expect(getPerformancePercentage(1.2, 3)).toBe(20);
    const publicView = fs.readFileSync(path.join(process.cwd(), 'web/src/app/p/[handle]/PublicProfileView.tsx'), 'utf8');
    expect(publicView).toContain('getPerformancePercentage(profile.avgROI, profile.performanceSampleCount)');
    expect(publicView).toContain("roiPercentage > 0 ? '+' : ''");
  });

  test('media-kit average views require a real snapshot and preserve measured zero', () => {
    expect(getMeasuredAvgViews(undefined)).toBeNull();
    expect(getMeasuredAvgViews([])).toBeNull();
    expect(getMeasuredAvgViews([{ avgViews: null }])).toBeNull();
    expect(getMeasuredAvgViews([{ avgViews: 0 }])).toBe(0);
    expect(getMeasuredAvgViews([{ avgViews: 47 }])).toBe(47);
    const mediaKit = fs.readFileSync(path.join(process.cwd(), 'web/src/app/dashboard/mediakit/page.tsx'), 'utf8');
    expect(mediaKit).toContain('getMeasuredAvgViews(data?.metricsHistory)');
    expect(mediaKit).toContain('formatAvailableCount(measuredAvgViews)');
  });

  test('explains connected Instagram with no recent media without suggesting a disconnect', () => {
    expect(getInstagramNoDataMessage('connected', 'no_recent_media')).toMatch(/Instagram conectado/);
    expect(getInstagramNoDataMessage('connected', 'no_recent_media')).toMatch(/Nenhuma publicação recente/);
    expect(getInstagramNoDataMessage('connected', 'synced')).toBeNull();
  });

  test('onboarding no longer exposes the removed visual-system step', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'web/src/app/onboarding/page.tsx'), 'utf8');
    expect(source).not.toMatch(/Visual_Sistema|accentColor|setTheme\(/);
  });

  test('media kit views no longer contain known plausible demo metric fallbacks', () => {
    const files = [
      'web/src/app/dashboard/influencer/page.tsx',
      'web/src/app/dashboard/mediakit/page.tsx',
      'web/src/app/p/[handle]/PublicProfileView.tsx',
    ];
    const source = files.map((file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8')).join('\n');
    expect(source).not.toMatch(/370\.000|4\.8%|1\.2M|45\.000|demo\.influencer/);
  });

  test('creator surfaces do not render demo score tiers, financial/chart fallbacks, or audit claims', () => {
    const files = [
      'web/src/app/dashboard/influencer/page.tsx',
      'web/src/app/dashboard/mediakit/page.tsx',
      'web/src/app/p/[handle]/PublicProfileView.tsx',
      'web/src/components/influ-score-card.tsx',
      'web/src/components/SHA256AuditModal.tsx',
    ];
    const source = files.map((file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8')).join('\n');
    expect(source).not.toMatch(/5\.4%|15% conv|38% mais retenção|Rumo a Diamante|Top 1% Elite|fashion & lifestyle/i);
    expect(source).not.toMatch(/métricas auditadas|perfil verificado|oficial auditado|garantia anti-fraude|garantia total|certificado de autenticidade|SHA-256 verified/i);
    expect(source).toContain('Sem dados suficientes para exibir demografia da audiência.');
    expect(source).toContain('instagramOperationalSyncStatus');
    expect(source).toContain('profile.instagramFollowers');
    expect(source).toContain('Sem registro de integridade disponível.');
  });

  test('score and missing metric values have explicit non-numeric empty states', () => {
    expect(hasPersistedScore(null)).toBe(false);
    expect(formatAvailableCount(null)).toBe('Ainda sem dados');
    const publicProfile = fs.readFileSync(path.join(process.cwd(), 'web/src/app/p/[handle]/PublicProfileView.tsx'), 'utf8');
    expect(publicProfile).toMatch(/latestMetrics\?\.engagementRate == null/);
    expect(publicProfile).toMatch(/latestMetrics\?\.reachLast30Days == null/);
    expect(publicProfile).toMatch(/latestMetrics\?\.avgViews == null/);
  });

  test('dashboard chart has no demo metric selectors and financial values use nullable API fields', () => {
    const dashboard = fs.readFileSync(path.join(process.cwd(), 'web/src/app/dashboard/influencer/page.tsx'), 'utf8');
    expect(dashboard).not.toMatch(/chartMode|Faturamento R\$|Cliques em Links/);
    expect(dashboard).toMatch(/escrowBalance = data\?\.kpis\?\.escrowBalance \?\? null/);
    expect(dashboard).toMatch(/escrowBalance == null \? NO_DATA_LABEL/);
    expect(dashboard).toMatch(/Ainda não há histórico suficiente/);
    expect(dashboard).not.toMatch(/growthBadge|38%|32\.4%|9\.500/);
  });
});
