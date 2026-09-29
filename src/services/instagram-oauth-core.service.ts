import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import type { OAuthState } from '../lib/oauth-state';
import { assertOAuthIdentity, OAuthBoundaryError } from '../lib/oauth-state';
import { buildInstagramAuthorizationUrl } from '../lib/instagram-oauth';
import { InstagramService, reconcileInstagramPlatformIdentity } from './instagram.service';
import { InstagramIdentityConflictError } from '../utils/instagram-identity';
import { assertSocialTokenEncryptionConfigured, encryptSocialToken } from '../utils/social-token-crypto';
import { enqueueInstagramSync } from './instagram-sync-queue.service';

export { buildInstagramAuthorizationUrl };

/** One Instagram exchange, identity validation, ownership check, encrypted persistence and sync enqueue path. */
export async function completeInstagramOAuth(input: {
  code: string;
  state: OAuthState;
}) {
  const { state, code } = input;
  assertSocialTokenEncryptionConfigured();
  const token = await InstagramService.exchangeCodeForToken(code, `${state.frontendUrl}/auth/callback/instagram`);
  if (typeof token.accessToken !== 'string' || !token.accessToken.trim()) {
    throw new OAuthBoundaryError(400, 'O Instagram não confirmou uma credencial válida.');
  }
  const providerProfile = await InstagramService.fetchProfileData(token.accessToken);
  const canonicalPlatformId = typeof providerProfile?.id === 'string' || typeof providerProfile?.id === 'number'
    ? String(providerProfile.id).trim()
    : '';
  assertOAuthIdentity(token.accessToken, canonicalPlatformId);
  if (!providerProfile?.username) throw new Error('Perfil profissional do Instagram não foi confirmado.');

  const username = providerProfile.username;
  const expiresAt = new Date(Date.now() + (token.expiresIn || 5184000) * 1000);
  const canonicalOwner = await prisma.socialPlatform.findFirst({
    where: { platformName: 'INSTAGRAM', platformId: canonicalPlatformId },
    select: { influencerId: true, influencer: { include: { user: true } } },
  });
  const tokenUserId = typeof token.tokenUserId === 'string' ? token.tokenUserId.trim() : '';
  const tokenOwner = tokenUserId && tokenUserId !== canonicalPlatformId
    ? await prisma.socialPlatform.findFirst({
      where: { platformName: 'INSTAGRAM', platformId: tokenUserId },
      select: { influencerId: true, influencer: { include: { user: true } } },
    })
    : null;

  const ownerIds = [canonicalOwner?.influencerId, tokenOwner?.influencerId].filter(Boolean);
  if (ownerIds.length > 1 && ownerIds.some(id => id !== ownerIds[0])) {
    throw new OAuthBoundaryError(409, 'Conflito de identidade do Instagram.');
  }
  const owner = canonicalOwner || tokenOwner;

  let profile: any;
  let user: any = null;
  if (state.mode === 'login') {
    if (owner?.influencer) {
      profile = owner.influencer;
      user = owner.influencer.user;
    } else {
      const tempEmail = `${username.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(1000 + Math.random() * 9000)}@influnext.temp`;
      const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
      user = await prisma.user.create({ data: {
        email: tempEmail, passwordHash, role: 'INFLUENCER', onboardingCompleted: false,
        theme: 'dark', subscriptionStatus: 'ACTIVE', subscriptionTier: 'FREE',
      } });
      profile = await prisma.influencerProfile.create({ data: {
        userId: user.id, handle: username, niche: 'Geral', profileImageUrl: providerProfile.profile_picture_url || null,
      } });
    }
  } else {
    if (!state.userId) throw new Error('Vinculação Instagram requer sessão autenticada.');
    profile = await prisma.influencerProfile.findUnique({ where: { userId: state.userId } });
    if (!profile) throw new Error('Perfil não encontrado.');
    if ([canonicalOwner, tokenOwner].some(candidate => candidate?.influencerId && candidate.influencerId !== profile.id)) {
      throw new OAuthBoundaryError(409, 'Conflito de identidade do Instagram.');
    }
  }

  if (!user && state.mode === 'login') throw new Error('Conta Instagram não encontrada.');
  try {
    await reconcileInstagramPlatformIdentity(profile.id, canonicalPlatformId);
  } catch (error) {
    if (error instanceof InstagramIdentityConflictError) {
      throw new OAuthBoundaryError(409, 'Conflito de identidade do Instagram.');
    }
    throw error;
  }
  if (state.mode === 'login' && user?.twoFactorEnabled) return { user, profile, username, sync: null };

  await prisma.influencerProfile.update({
    where: { id: profile.id },
    data: { ...((!profile.handle || profile.handle.startsWith('user_')) ? { handle: username } : {}), verifiedMetrics: false },
  });
  const accessToken = encryptSocialToken(token.accessToken, { influencerId: profile.id, platformName: 'INSTAGRAM', field: 'accessToken' });
  const saved = await prisma.socialPlatform.upsert({
    where: { influencerId_platformName: { influencerId: profile.id, platformName: 'INSTAGRAM' } },
    create: {
      influencerId: profile.id, platformName: 'INSTAGRAM', platformId: canonicalPlatformId, username,
      followersCount: providerProfile.followers_count || 0, profilePicture: providerProfile.profile_picture_url || null,
      accessToken, refreshToken: null, expiresAt, isActive: true,
    },
    update: {
      platformId: canonicalPlatformId, username, followersCount: providerProfile.followers_count || 0,
      profilePicture: providerProfile.profile_picture_url || null, accessToken, expiresAt, isActive: true,
    },
  });
  const sync = await enqueueInstagramSync({
    socialPlatformId: saved.id, influencerId: profile.id, reason: 'post_oauth',
    requestedByUserId: state.mode === 'link' ? state.userId : user?.id,
  });
  return { user, profile, username, sync };
}
