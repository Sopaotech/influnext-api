const NOTICE_BLOCKED_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/onboarding',
];

export function shouldShowAppStandbyNotice(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  return !NOTICE_BLOCKED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
}
