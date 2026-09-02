const mockRequestUse = jest.fn();
const mockCookieGet = jest.fn();
jest.mock(require.resolve('axios', { paths: [__dirname + '/../web'] }), () => ({ __esModule: true, default: {
  create: () => ({ interceptors: { request: { use: mockRequestUse }, response: { use: jest.fn() } } }),
} }));
jest.mock(require.resolve('js-cookie', { paths: [__dirname + '/../web'] }), () => ({ __esModule: true, default: { get: mockCookieGet, remove: jest.fn() } }));
import '../web/src/lib/api';

// Capture the actual registered callback before Jest clears mock call histories.
const interceptor = mockRequestUse.mock.calls[0][0];

describe('STEP 1F-C — browser OAuth cookie transport', () => {
  it.each([
    '/auth/social/public-urls', '/auth/social/urls', '/auth/social/callback/instagram',
    '/auth/social/callback/tiktok', '/auth/social/callback/google', '/auth/social/callback/youtube',
    '/integrations/urls?from=onboarding', '/integrations/instagram/auth-url',
    '/integrations/instagram/callback', '/integrations/tiktok/callback',
  ])('includes the API-host attempt cookie for %s', url => {
    const result = interceptor({ url, headers: {} });
    expect(result.withCredentials).toBe(true);
  });
  it.each(['/auth/login', '/auth/2fa/verify', '/contracts', '/payments', '/webhooks/stripe'])('does not change cookie transport for unrelated route %s', url => {
    const result = interceptor({ url, headers: {} });
    expect(result.withCredentials).toBeUndefined();
  });
  it('preserves the existing bearer-token transport without changing storage', () => {
    mockCookieGet.mockReturnValue('existing-session');
    expect(interceptor({ url: '/auth/social/urls', headers: {} }).headers.Authorization).toBe('Bearer existing-session');
    expect(mockCookieGet).toHaveBeenCalledWith('influnext_token');
  });
});
