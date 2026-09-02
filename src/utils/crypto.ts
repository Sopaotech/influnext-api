import crypto from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || !/^[a-fA-F0-9]{64}$/.test(key) || /^0{64}$/.test(key)) {
    throw new Error('ENCRYPTION_KEY must be configured as 32 bytes of hex; the legacy zero key is not permitted.');
  }
  return Buffer.from(key, 'hex');
}

interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

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
  const key = getEncryptionKey();
  const { iv, tag, data } = JSON.parse(ciphertext) as EncryptedPayload;

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  return Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}
