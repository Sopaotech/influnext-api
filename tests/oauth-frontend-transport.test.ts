const mockRequestUse = jest.fn();
let mockCreateOptions: unknown;
const mockAxiosCreate = jest.fn((options: unknown) => {
  mockCreateOptions = options;
  return { options, interceptors: { request: { use: mockRequestUse }, response: { use: jest.fn() } } };
});
jest.mock(require.resolve('axios', { paths: [__dirname + '/../web'] }), () => ({ __esModule: true, default: {
  create: mockAxiosCreate,
} }));
// This suite verifies Axios transport only; browser cookie persistence belongs to auth-browser.
// Mock that boundary so the root backend test command does not require web/node_modules.
jest.mock('../web/src/lib/auth-browser', () => ({ clearBrowserAuthState: jest.fn() }));

const originalWindow = Object.getOwnPropertyDescriptor(global, 'window');
const originalIsolatedTest = process.env.NEXT_PUBLIC_ISOLATED_TEST;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
process.env.NEXT_PUBLIC_ISOLATED_TEST = 'true';
process.env.NEXT_PUBLIC_API_URL = 'https://ig-test-host-123.test/v1';
Object.defineProperty(global, 'window', {
  configurable: true,
  value: { location: { hostname: 'ig-test-host-123.test', origin: 'https://ig-test-host-123.test' } },
});
require('../web/src/lib/api');

// Capture the actual registered callback before Jest clears mock call histories.
const interceptor = mockRequestUse.mock.calls[0][0];

afterAll(() => {
  if (originalWindow) Object.defineProperty(global, 'window', originalWindow);
  else delete (global as { window?: unknown }).window;
  if (originalIsolatedTest === undefined) delete process.env.NEXT_PUBLIC_ISOLATED_TEST;
  else process.env.NEXT_PUBLIC_ISOLATED_TEST = originalIsolatedTest;
  if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
});

describe('STEP 1F-C browser OAuth cookie transport', () => {
  it('uses the same-origin /v1 entrypoint in isolated browser mode', () => {
    expect(mockCreateOptions).toEqual(expect.objectContaining({ baseURL: '/v1', withCredentials: true }));
  });

  it.each([
    '/auth/social/public-urls', '/auth/social/urls', '/auth/social/callback/instagram',
    '/auth/social/callback/tiktok', '/auth/social/callback/google', '/auth/social/callback/youtube',
    '/integrations/urls?from=onboarding', '/integrations/instagram/auth-url',
    '/integrations/instagram/callback', '/integrations/tiktok/callback',
  ])('includes cookies through the Axios default for %s', url => {
    expect(mockCreateOptions).toEqual(expect.objectContaining({ withCredentials: true }));
    expect(interceptor({ url, headers: {} }).headers.Authorization).toBeUndefined();
  });

  it.each(['/auth/login', '/auth/2fa/verify', '/auth/me', '/auth/logout', '/contracts', '/payments', '/webhooks/stripe'])('includes the HttpOnly session cookie transport for %s', url => {
    const result = interceptor({ url, headers: {} });
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('does not read or attach a JavaScript-visible bearer token', () => {
    expect(interceptor({ url: '/auth/social/urls', headers: {} }).headers.Authorization).toBeUndefined();
  });
});
