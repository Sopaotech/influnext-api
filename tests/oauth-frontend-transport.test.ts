const mockRequestUse = jest.fn();
let mockCreateOptions: unknown;
const mockAxiosCreate = jest.fn((options: unknown) => {
  mockCreateOptions = options;
  return { options, interceptors: { request: { use: mockRequestUse }, response: { use: jest.fn() } } };
});
jest.mock(require.resolve('axios', { paths: [__dirname + '/../web'] }), () => ({ __esModule: true, default: {
  create: mockAxiosCreate,
} }));
jest.mock(require.resolve('js-cookie', { paths: [__dirname + '/../web'] }), () => ({ __esModule: true, default: { remove: jest.fn() } }));
import '../web/src/lib/api';

// Capture the actual registered callback before Jest clears mock call histories.
const interceptor = mockRequestUse.mock.calls[0][0];

describe('STEP 1F-C — browser OAuth cookie transport', () => {
  it.each([
    '/auth/social/public-urls', '/auth/social/urls', '/auth/social/callback/instagram',
    '/auth/social/callback/tiktok', '/auth/social/callback/google', '/auth/social/callback/youtube',
    '/integrations/urls?from=onboarding', '/integrations/instagram/auth-url',
    '/integrations/instagram/callback', '/integrations/tiktok/callback',
  ])('includes cookies through the Axios default for %s', url => {
    expect(mockCreateOptions).toEqual(expect.objectContaining({ withCredentials: true }));
    expect(interceptor({ url, headers: {} }).headers.Authorization).toBeUndefined();
  });
  it.each(['/auth/login', '/auth/2fa/verify', '/contracts', '/payments', '/webhooks/stripe'])('includes the HttpOnly session cookie transport for %s', url => {
    const result = interceptor({ url, headers: {} });
    expect(result.headers.Authorization).toBeUndefined();
  });
  it('does not read or attach a JavaScript-visible bearer token', () => {
    expect(interceptor({ url: '/auth/social/urls', headers: {} }).headers.Authorization).toBeUndefined();
  });
});
