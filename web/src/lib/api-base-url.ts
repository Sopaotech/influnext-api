const LOCAL_BROWSER_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2']);
const OFFICIAL_FRONTEND_HOSTS = new Set([
  'influnext.com.br',
  'www.influnext.com.br',
  'influnext.com',
  'www.influnext.com',
]);
const PRODUCTION_API_HOSTS = new Set([
  'api.influnext.com.br',
  'influnext-api-production.up.railway.app',
]);

function withV1Path(value: string): string {
  const url = new URL(value);
  const path = url.pathname.replace(/\/+$/, '');
  if (!path || path === '/') url.pathname = '/v1';
  else if (!path.endsWith('/v1')) url.pathname = `${path}/v1`;
  return url.toString().replace(/\/$/, '');
}

function parseConfiguredUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL must be a valid absolute URL.');
  }
}

export function resolveApiBaseUrl(
  configuredUrl: string | undefined,
  browserHostname?: string,
  isolatedTestMode = false,
  browserOrigin?: string,
): string {
  const hostname = browserHostname?.toLowerCase();

  if (isolatedTestMode) {
    if (!configuredUrl?.trim()) {
      throw new Error('NEXT_PUBLIC_API_URL is required in isolated Instagram test mode.');
    }

    const parsed = parseConfiguredUrl(configuredUrl.trim());
    if (parsed.protocol !== 'https:') {
      throw new Error('Isolated Instagram test API URL must use HTTPS.');
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error('Isolated Instagram test API URL must not contain credentials or query data.');
    }
    if (PRODUCTION_API_HOSTS.has(parsed.hostname.toLowerCase())) {
      throw new Error('Isolated Instagram test mode cannot use a production API host.');
    }
    if (hostname && parsed.hostname.toLowerCase() !== hostname) {
      throw new Error('Isolated Instagram test API must use the frontend test hostname.');
    }
    if (browserOrigin && parsed.origin.toLowerCase() !== browserOrigin.toLowerCase()) {
      throw new Error('Isolated Instagram test API must use the frontend test origin.');
    }
    return withV1Path(parsed.toString());
  }

  if (configuredUrl?.trim()) {
    const parsed = parseConfiguredUrl(configuredUrl.trim());
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error('NEXT_PUBLIC_API_URL must not contain credentials or query data.');
    }
    if (hostname && !OFFICIAL_FRONTEND_HOSTS.has(hostname)
      && PRODUCTION_API_HOSTS.has(parsed.hostname.toLowerCase())) {
      throw new Error('A non-production frontend hostname cannot use a production API host.');
    }
    return withV1Path(parsed.toString());
  }

  if (!hostname) return 'http://localhost:4000/v1';
  if (LOCAL_BROWSER_HOSTS.has(hostname)) {
    return hostname === '10.0.2.2' ? 'http://10.0.2.2:4000/v1' : 'http://localhost:4000/v1';
  }
  if (OFFICIAL_FRONTEND_HOSTS.has(hostname)) return 'https://api.influnext.com.br/v1';

  throw new Error('NEXT_PUBLIC_API_URL must be configured for this frontend hostname.');
}

export function isolatedTestApiRewrites(
  isolatedTestMode: boolean,
  apiOrigin: string | undefined,
): Array<{ source: string; destination: string }> {
  if (!isolatedTestMode) return [];
  if (!apiOrigin?.trim()) {
    throw new Error('INFLUNEXT_TEST_API_ORIGIN is required in isolated Instagram test mode.');
  }

  let api: URL;
  try {
    api = new URL(apiOrigin.trim());
  } catch {
    throw new Error('INFLUNEXT_TEST_API_ORIGIN must be a local HTTP origin.');
  }

  if (api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname) || api.port !== '4000' || api.pathname !== '/' || api.username || api.password || api.search || api.hash) {
    throw new Error('INFLUNEXT_TEST_API_ORIGIN must target the local API on port 4000.');
  }

  return [{ source: '/v1/:path*', destination: `${api.origin}/v1/:path*` }];
}
