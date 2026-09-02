import fs from 'fs';
import path from 'path';

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../web/src/lib/api', () => ({ api: { get: mockGet, post: mockPost } }));
import { getSocialAuthUrl } from '../web/src/lib/social-auth';

describe('STEP 1F-B — frontend provider-only authentication', () => {
  const providers = [
    ['instagram', 'https://www.instagram.com/oauth/authorize?response_type=code'],
    ['tiktok', 'https://www.tiktok.com/auth/authorize/?response_type=code'],
    ['google', 'https://accounts.google.com/o/oauth2/v2/auth?response_type=code'],
  ] as const;

  it.each(providers)('uses the existing provider URL for %s without posting credentials or handles', async (provider, url) => {
    mockGet.mockResolvedValue({ data: { [provider]: url, configured: { [provider]: true } } });
    await expect(getSocialAuthUrl(provider)).resolves.toBe(url);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/auth/social/public-urls');
    expect(mockPost).not.toHaveBeenCalled();
  });

  describe.each(providers)('%s fails closed without a configured provider', (provider, url) => {
    it.each([false, undefined, 'true'])('requires configured=true, received %s', async configured => {
      mockGet.mockResolvedValue({ data: { [provider]: url, configured: { [provider]: configured } } });
      await expect(getSocialAuthUrl(provider)).rejects.toThrow('Use e-mail e senha');
      expect(mockPost).not.toHaveBeenCalled();
    });
    it.each([undefined, '', '#', '/auth/social-login', 'javascript:alert(1)', 'https://untrusted.example/auth'])('rejects an invalid provider URL: %s', async invalidUrl => {
      mockGet.mockResolvedValue({ data: { [provider]: invalidUrl, configured: { [provider]: true } } });
      await expect(getSocialAuthUrl(provider)).rejects.toThrow('Use e-mail e senha');
      expect(mockPost).not.toHaveBeenCalled();
    });
    it('does not fall back to username authentication after an API failure', async () => {
      mockGet.mockRejectedValue(new Error('network failure'));
      await expect(getSocialAuthUrl(provider)).rejects.toThrow('Use e-mail e senha');
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  it.each(['login/page.tsx', 'signup/SignupClient.tsx'])('wires %s buttons exclusively to provider authorization (source regression)', file => {
    const source = fs.readFileSync(path.resolve(__dirname, '../web/src/app/auth', file), 'utf8');
    expect(source).toContain("from '@/lib/social-auth'");
    expect(source).toContain('window.location.href = await getSocialAuthUrl(platform)');
    for (const [provider] of providers) expect(source).toContain(`onClick={() => handleSocialRedirect('${provider}')}`);
    expect(source).not.toContain('socialHandle');
    expect(source).not.toContain('socialModalOpen');
    expect(source).not.toContain('/auth/social-login');
    expect(source).toContain("'/auth/login'");
  });

  it('has no remaining simulated authentication consumer in frontend source', () => {
    function inspect(directory: string) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) inspect(filename);
        else if (/\.[cm]?[jt]sx?$/.test(filename)) {
          expect({ filename, unsafe: fs.readFileSync(filename, 'utf8').includes('/auth/social-login') }).toEqual({ filename, unsafe: false });
        }
      }
    }
    inspect(path.resolve(__dirname, '../web/src'));
  });
});
