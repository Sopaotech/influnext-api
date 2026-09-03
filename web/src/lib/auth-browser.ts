import Cookies from 'js-cookie';

type SessionMetadata = {
  role: 'INFLUENCER' | 'COMPANY' | 'ADMIN';
  onboardingCompleted: boolean;
};

const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;
const metadataCookieOptions: Cookies.CookieAttributes = {
  expires: 7,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  domain: cookieDomain,
};

export function clearLegacyBrowserSessionToken(): void {
  Cookies.remove('influnext_token', { path: '/' });
  if (cookieDomain) Cookies.remove('influnext_token', { path: '/', domain: cookieDomain });
}

export function storeSessionMetadata(user: SessionMetadata): void {
  clearLegacyBrowserSessionToken();
  Cookies.set('influnext_role', user.role, metadataCookieOptions);
  Cookies.set('influnext_onboarding', user.onboardingCompleted ? 'true' : 'false', metadataCookieOptions);
}

export function clearBrowserAuthState(): void {
  clearLegacyBrowserSessionToken();
  Cookies.remove('influnext_role', { path: '/' });
  Cookies.remove('influnext_onboarding', { path: '/' });
  if (cookieDomain) {
    Cookies.remove('influnext_role', { path: '/', domain: cookieDomain });
    Cookies.remove('influnext_onboarding', { path: '/', domain: cookieDomain });
  }
}
