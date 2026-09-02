import { api } from './api';

export type SocialAuthProvider = 'instagram' | 'tiktok' | 'google';

const providerOrigins: Record<SocialAuthProvider, string> = {
  instagram: 'https://www.instagram.com',
  tiktok: 'https://www.tiktok.com',
  google: 'https://accounts.google.com',
};

type PublicAuthUrls = Partial<Record<SocialAuthProvider, string>> & {
  configured?: Partial<Record<SocialAuthProvider, boolean>>;
};

// This only starts provider authorization. It never authenticates a username.
export async function getSocialAuthUrl(provider: SocialAuthProvider): Promise<string> {
  const unavailable = 'Login com este provedor indisponível no momento. Use e-mail e senha.';
  try {
    const { data } = await api.get<PublicAuthUrls>('/auth/social/public-urls');
    const url = data[provider];
    if (data.configured?.[provider] !== true || !url) {
      throw new Error(unavailable);
    }
    if (new URL(url).origin !== providerOrigins[provider]) {
      throw new Error(unavailable);
    }
    return url;
  } catch {
    throw new Error(unavailable);
  }
}
