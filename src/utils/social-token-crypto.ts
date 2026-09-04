import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENVELOPE_PREFIX = 'st';
const ENVELOPE_VERSION = 'v1';
const PURPOSE = 'influnext-social-token';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_ID_PATTERN = /^[A-Za-z0-9]{1,32}$/;
const PAYLOAD_PATTERN = /^[A-Za-z0-9_-]+$/;

export type SocialTokenField = 'accessToken' | 'refreshToken';

export interface SocialTokenContext {
  influencerId: string;
  platformName: string;
  field: SocialTokenField;
}

export interface DecryptedSocialToken {
  value: string;
  source: 'encrypted' | 'legacy';
  keyId?: string;
}

function assertKeyId(keyId: string): void {
  if (!KEY_ID_PATTERN.test(keyId)) {
    throw new Error('Social token key ID is invalid.');
  }
}

function keyEnvironmentName(keyId: string): string {
  assertKeyId(keyId);
  return `SOCIAL_TOKEN_KEY_${keyId.toUpperCase()}`;
}

function getKey(keyId: string): Buffer {
  const configuredKey = process.env[keyEnvironmentName(keyId)];
  if (!configuredKey || !/^[a-fA-F0-9]{64}$/.test(configuredKey) || /^0{64}$/.test(configuredKey)) {
    throw new Error('Social token encryption key is missing or invalid.');
  }
  return Buffer.from(configuredKey, 'hex');
}

function getActiveKeyId(): string {
  const keyId = process.env.SOCIAL_TOKEN_ACTIVE_KEY_ID;
  if (!keyId) {
    throw new Error('Social token active key ID is not configured.');
  }
  assertKeyId(keyId);
  return keyId;
}

function getAdditionalAuthenticatedData(context: SocialTokenContext): Buffer {
  if (!context.influencerId || !context.platformName ||
      (context.field !== 'accessToken' && context.field !== 'refreshToken')) {
    throw new Error('Social token encryption context is invalid.');
  }

  return Buffer.from(JSON.stringify({
    purpose: PURPOSE,
    version: ENVELOPE_VERSION,
    influencerId: context.influencerId,
    platformName: context.platformName,
    field: context.field,
  }), 'utf8');
}

export function isEncryptedSocialToken(value: string): boolean {
  return value.startsWith(`${ENVELOPE_PREFIX}:`);
}

export function assertSocialTokenEncryptionConfigured(): void {
  getKey(getActiveKeyId());
}

export function encryptSocialToken(value: string, context: SocialTokenContext): string {
  if (!value) {
    throw new Error('Social token cannot be empty.');
  }

  const keyId = getActiveKeyId();
  const key = getKey(keyId);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(getAdditionalAuthenticatedData(context));

  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const payload = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
  return `${ENVELOPE_PREFIX}:${ENVELOPE_VERSION}:${keyId}:${payload}`;
}

export function decryptSocialToken(value: string, context: SocialTokenContext): DecryptedSocialToken {
  if (!isEncryptedSocialToken(value)) {
    return { value, source: 'legacy' };
  }

  const parts = value.split(':');
  if (parts.length !== 4 || parts[0] !== ENVELOPE_PREFIX || parts[1] !== ENVELOPE_VERSION) {
    throw new Error('Encrypted social token envelope is invalid.');
  }

  const keyId = parts[2];
  const encodedPayload = parts[3];
  assertKeyId(keyId);
  if (!PAYLOAD_PATTERN.test(encodedPayload)) {
    throw new Error('Encrypted social token envelope is invalid.');
  }

  const payload = Buffer.from(encodedPayload, 'base64url');
  if (payload.length <= IV_LENGTH + TAG_LENGTH) {
    throw new Error('Encrypted social token envelope is invalid.');
  }

  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = payload.subarray(IV_LENGTH + TAG_LENGTH);

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(keyId), iv);
    decipher.setAAD(getAdditionalAuthenticatedData(context));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    return { value: plaintext, source: 'encrypted', keyId };
  } catch {
    throw new Error('Encrypted social token could not be decrypted.');
  }
}
