import fs from 'fs';
import path from 'path';
import { shouldShowAppStandbyNotice } from '../web/src/lib/app-standby-notice';

describe('mobile standby notice route guard', () => {
  it.each([
    '/auth/login',
    '/auth/signup',
    '/auth/callback/instagram',
    '/auth/callback/tiktok',
    '/onboarding',
    '/onboarding/company',
  ])('does not allow the notice on critical route %s', pathname => {
    expect(shouldShowAppStandbyNotice(pathname)).toBe(false);
  });

  it.each([null, undefined, ''])('fails closed before the route is known (%s)', pathname => {
    expect(shouldShowAppStandbyNotice(pathname)).toBe(false);
  });

  it('allows the notice on non-critical routes', () => {
    expect(shouldShowAppStandbyNotice('/dashboard/influencer')).toBe(true);
    expect(shouldShowAppStandbyNotice('/')).toBe(true);
  });

  it('wires the route guard into the globally mounted notice and dismisses in memory first', () => {
    const component = fs.readFileSync(path.resolve(__dirname, '../web/src/components/AppStandbyNotice.tsx'), 'utf8');
    expect(component).toContain('usePathname()');
    expect(component).toContain('shouldShowAppStandbyNotice(pathname)');
    expect(component).toContain('if (!isAllowedOnRoute || !showNotice) return null');
    expect(component.indexOf('setShowNotice(false);')).toBeLessThan(component.indexOf("localStorage.setItem('influnext_app_standby_dismissed'"));
  });
});
