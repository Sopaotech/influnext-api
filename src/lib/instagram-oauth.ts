/**
 * Minimal permission set for InfluNext's Instagram Login metrics V1.
 * It intentionally excludes publishing, messaging, and comments capabilities.
 */
export const INSTAGRAM_METRICS_OAUTH_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_insights',
] as const;

export const INSTAGRAM_METRICS_OAUTH_SCOPE = INSTAGRAM_METRICS_OAUTH_SCOPES.join(',');

export function buildInstagramAuthorizationUrl(redirectUri: string, state: string): string {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  if (!clientId || clientId === 'seu_instagram_app_client_id') throw new Error('Instagram OAuth não configurado.');
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', INSTAGRAM_METRICS_OAUTH_SCOPE);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  return url.toString();
}
