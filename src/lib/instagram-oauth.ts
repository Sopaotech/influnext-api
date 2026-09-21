/**
 * Minimal permission set for InfluNext's Instagram Login metrics V1.
 * It intentionally excludes publishing, messaging, and comments capabilities.
 */
export const INSTAGRAM_METRICS_OAUTH_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_insights',
] as const;

export const INSTAGRAM_METRICS_OAUTH_SCOPE = INSTAGRAM_METRICS_OAUTH_SCOPES.join(',');
