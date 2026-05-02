import crypto from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const KEY_HEX    = process.env.ENCRYPTION_KEY || '0'.repeat(64); // 32 bytes em hex
const KEY_BUFFER = Buffer.from(KEY_HEX, 'hex');

interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

export function encrypt(plaintext: string): string {
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag       = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv:   iv.toString('hex'),
    tag:  tag.toString('hex'),
    data: encrypted.toString('hex'),
  };

  return JSON.stringify(payload);
}

export function decrypt(ciphertext: string): string {
  const { iv, tag, data } = JSON.parse(ciphertext) as EncryptedPayload;

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  return Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}
