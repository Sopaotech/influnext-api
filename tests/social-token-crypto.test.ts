import crypto from 'crypto';
import {
  decryptSocialToken,
  encryptSocialToken,
  isEncryptedSocialToken,
  SocialTokenContext,
} from '../src/utils/social-token-crypto';

describe('STEP 1H-B2 — social token cryptography', () => {
  const originalEnv = process.env;
  const context: SocialTokenContext = {
    influencerId: 'influencer-a',
    platformName: 'INSTAGRAM',
    field: 'accessToken',
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SOCIAL_TOKEN_ACTIVE_KEY_ID: 'v1',
      SOCIAL_TOKEN_KEY_V1: '44'.repeat(32),
    };
  });

  afterAll(() => { process.env = originalEnv; });

  it('encrypts and decrypts a token with an encrypted source indication', () => {
    const encrypted = encryptSocialToken('fake-access-token', context);
    expect(isEncryptedSocialToken(encrypted)).toBe(true);
    expect(decryptSocialToken(encrypted, context)).toEqual({
      value: 'fake-access-token', source: 'encrypted', keyId: 'v1',
    });
  });

  it('uses a random nonce for repeated encryption', () => {
    expect(encryptSocialToken('same-token', context)).not.toBe(encryptSocialToken('same-token', context));
  });

  it('reads legacy plaintext without requiring encryption configuration', () => {
    delete process.env.SOCIAL_TOKEN_ACTIVE_KEY_ID;
    delete process.env.SOCIAL_TOKEN_KEY_V1;
    expect(decryptSocialToken('legacy-fake-token', context)).toEqual({ value: 'legacy-fake-token', source: 'legacy' });
  });

  it.each(['st:', 'st:v1', 'st:v2:v1:payload', 'st:v1:bad.key:payload', 'st:v1:v1:not+base64'])('%s envelope fails closed', value => {
    expect(() => decryptSocialToken(value, context)).toThrow();
  });

  it('rejects tampered ciphertext', () => {
    const encrypted = encryptSocialToken('fake-access-token', context);
    const parts = encrypted.split(':');
    const payload = Buffer.from(parts[3], 'base64url');
    payload[payload.length - 1] ^= 1;
    parts[3] = payload.toString('base64url');
    expect(() => decryptSocialToken(parts.join(':'), context)).toThrow('could not be decrypted');
  });

  it('rejects a wrong key', () => {
    const encrypted = encryptSocialToken('fake-access-token', context);
    process.env.SOCIAL_TOKEN_KEY_V1 = '55'.repeat(32);
    expect(() => decryptSocialToken(encrypted, context)).toThrow('could not be decrypted');
  });

  it('rejects an unknown key ID', () => {
    const encrypted = encryptSocialToken('fake-access-token', context).replace('st:v1:v1:', 'st:v1:v9:');
    expect(() => decryptSocialToken(encrypted, context)).toThrow('could not be decrypted');
  });

  it('rejects writes when the active key ID is missing', () => {
    delete process.env.SOCIAL_TOKEN_ACTIVE_KEY_ID;
    expect(() => encryptSocialToken('fake-access-token', context)).toThrow('active key ID');
  });

  it.each([undefined, 'short', '0'.repeat(64)])('rejects a missing or invalid active key', key => {
    if (key === undefined) delete process.env.SOCIAL_TOKEN_KEY_V1;
    else process.env.SOCIAL_TOKEN_KEY_V1 = key;
    expect(() => encryptSocialToken('fake-access-token', context)).toThrow('missing or invalid');
  });

  it('binds ciphertext to the token field', () => {
    const encrypted = encryptSocialToken('fake-access-token', context);
    expect(() => decryptSocialToken(encrypted, { ...context, field: 'refreshToken' })).toThrow();
  });

  it('binds ciphertext to the influencer', () => {
    const encrypted = encryptSocialToken('fake-access-token', context);
    expect(() => decryptSocialToken(encrypted, { ...context, influencerId: 'influencer-b' })).toThrow();
  });

  it('binds ciphertext to the platform', () => {
    const encrypted = encryptSocialToken('fake-access-token', context);
    expect(() => decryptSocialToken(encrypted, { ...context, platformName: 'TIKTOK' })).toThrow();
  });

  it('reads an old key after rotation and writes only with the active key', () => {
    const oldCiphertext = encryptSocialToken('old-fake-token', context);
    process.env.SOCIAL_TOKEN_ACTIVE_KEY_ID = 'v2';
    process.env.SOCIAL_TOKEN_KEY_V2 = crypto.randomBytes(32).toString('hex');

    expect(decryptSocialToken(oldCiphertext, context).value).toBe('old-fake-token');
    expect(encryptSocialToken('new-fake-token', context)).toMatch(/^st:v1:v2:/);
  });
});
