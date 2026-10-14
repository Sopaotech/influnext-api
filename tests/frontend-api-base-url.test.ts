import {
  isolatedTestApiRewrites,
  resolveBrowserApiBaseUrl,
  resolveServerApiBaseUrl,
} from '../web/src/lib/api-base-url';
import fs from 'fs';
import path from 'path';

describe('frontend API base URL safety', () => {
  it('keeps local development defaults local', () => {
    expect(resolveBrowserApiBaseUrl(undefined, 'localhost')).toBe('http://localhost:4000/v1');
    expect(resolveBrowserApiBaseUrl(undefined, '10.0.2.2')).toBe('http://10.0.2.2:4000/v1');
  });

  it('preserves the official production-domain default outside isolated test mode', () => {
    expect(resolveBrowserApiBaseUrl(undefined, 'influnext.com.br')).toBe('https://api.influnext.com.br/v1');
  });

  it('fails closed for an unknown HTTPS hostname with no configured API', () => {
    expect(() => resolveBrowserApiBaseUrl(undefined, 'temporary-test-host.test')).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it('uses the frontend /v1 entrypoint in isolated browser mode', () => {
    expect(() => resolveBrowserApiBaseUrl(undefined, 'temporary-test-host.test', true)).toThrow(/required/);
    expect(() => resolveBrowserApiBaseUrl('https://api.influnext.com.br/v1', 'temporary-test-host.test', true)).toThrow(/production/);
    expect(() => resolveBrowserApiBaseUrl('https://other-host.test/v1', 'temporary-test-host.test', true)).toThrow(/frontend test hostname/);
    expect(() => resolveBrowserApiBaseUrl('https://temporary-test-host.test:8443/v1', 'temporary-test-host.test', true, 'https://temporary-test-host.test')).toThrow(/frontend test origin/);
    expect(resolveBrowserApiBaseUrl(
      'https://temporary-test-host.test/v1',
      'temporary-test-host.test',
      true,
      'https://temporary-test-host.test',
    )).toBe('/v1');
  });

  it('keeps server-side isolated requests on the configured absolute upstream', () => {
    expect(resolveServerApiBaseUrl(
      'https://temporary-test-host.test/v1',
      true,
      'https://api-temporary-test-host.test',
    )).toBe('https://api-temporary-test-host.test/v1');
  });

  it('rejects an explicit production API on an unrecognized frontend hostname', () => {
    expect(() => resolveBrowserApiBaseUrl('https://api.influnext.com.br/v1', 'temporary-test-host.test')).toThrow(/non-production frontend/);
  });

  it('rewrites /v1 only to a configurable isolated upstream', () => {
    expect(isolatedTestApiRewrites(false, undefined)).toEqual([]);
    expect(isolatedTestApiRewrites(true, 'http://127.0.0.1:4000')).toEqual([
      { source: '/v1/:path*', destination: 'http://127.0.0.1:4000/v1/:path*' },
    ]);
    expect(isolatedTestApiRewrites(true, 'https://api-temporary-test-host.test')).toEqual([
      { source: '/v1/:path*', destination: 'https://api-temporary-test-host.test/v1/:path*' },
    ]);
    expect(() => isolatedTestApiRewrites(true, 'https://api.influnext.com.br')).toThrow(/non-production HTTPS test API origin/);
    expect(() => isolatedTestApiRewrites(true, 'https://api-temporary-test-host.test/v1')).toThrow(/without a path/);
  });

  it('wires the configured upstream into the Next rewrite', () => {
    const nextConfig = fs.readFileSync(path.resolve(__dirname, '../web/next.config.ts'), 'utf8');
    expect(nextConfig).toContain('isolatedTestApiRewrites(');
    expect(nextConfig).toContain('process.env.INFLUNEXT_TEST_API_ORIGIN');
  });
});
