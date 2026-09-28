import { isolatedTestApiRewrites, resolveApiBaseUrl } from '../web/src/lib/api-base-url';

describe('frontend API base URL safety', () => {
  it('keeps local development defaults local', () => {
    expect(resolveApiBaseUrl(undefined, 'localhost')).toBe('http://localhost:4000/v1');
    expect(resolveApiBaseUrl(undefined, '10.0.2.2')).toBe('http://10.0.2.2:4000/v1');
  });

  it('preserves the official production-domain default', () => {
    expect(resolveApiBaseUrl(undefined, 'influnext.com.br')).toBe('https://api.influnext.com.br/v1');
  });

  it('fails closed for an unknown HTTPS hostname with no configured API', () => {
    expect(() => resolveApiBaseUrl(undefined, 'temporary-test-host.test')).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it('requires an explicit same-host HTTPS API in isolated test mode', () => {
    expect(() => resolveApiBaseUrl(undefined, 'temporary-test-host.test', true)).toThrow(/required/);
    expect(() => resolveApiBaseUrl('https://api.influnext.com.br/v1', 'temporary-test-host.test', true)).toThrow(/production/);
    expect(() => resolveApiBaseUrl('https://other-host.test/v1', 'temporary-test-host.test', true)).toThrow(/frontend test hostname/);
    expect(() => resolveApiBaseUrl('https://temporary-test-host.test:8443/v1', 'temporary-test-host.test', true, 'https://temporary-test-host.test')).toThrow(/frontend test origin/);
    expect(resolveApiBaseUrl('https://temporary-test-host.test', 'temporary-test-host.test', true))
      .toBe('https://temporary-test-host.test/v1');
  });

  it('rejects an explicit production API on an unrecognized frontend hostname', () => {
    expect(() => resolveApiBaseUrl('https://api.influnext.com.br/v1', 'temporary-test-host.test')).toThrow(/non-production frontend/);
  });

  it('enables only a localhost API rewrite in isolated test mode', () => {
    expect(isolatedTestApiRewrites(false, undefined)).toEqual([]);
    expect(isolatedTestApiRewrites(true, 'http://127.0.0.1:4000')).toEqual([
      { source: '/v1/:path*', destination: 'http://127.0.0.1:4000/v1/:path*' },
    ]);
    expect(() => isolatedTestApiRewrites(true, 'https://api.influnext.com.br')).toThrow(/local API/);
  });
});
