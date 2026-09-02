import crypto from 'crypto';
import { encrypt, decrypt } from '../src/utils/crypto';

describe('STEP 1F-C — ENCRYPTION_KEY boundary', () => {
  const previous = process.env.ENCRYPTION_KEY;
  afterEach(() => {
    if (previous === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = previous;
  });
  it.each([undefined, '', 'abc', 'not-hex'.repeat(10), '0'.repeat(64)])('fails closed for missing/invalid/legacy key #%#', key => {
    if (key === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = key;
    expect(() => encrypt('test-secret')).toThrow('ENCRYPTION_KEY');
    expect(() => decrypt('{}')).toThrow('ENCRYPTION_KEY');
  });
  it('preserves AES-256-GCM roundtrip with a configured key and rejects tampering', () => {
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    const encrypted = encrypt('test-secret');
    expect(encrypted).not.toContain('test-secret');
    expect(decrypt(encrypted)).toBe('test-secret');
    const modified = JSON.parse(encrypted);
    modified.data = (modified.data.startsWith('00') ? '01' : '00') + modified.data.slice(2);
    expect(() => decrypt(JSON.stringify(modified))).toThrow();
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    expect(() => decrypt(encrypted)).toThrow();
  });
  it('does not silently decrypt data written with the historical zero-key fallback', () => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.alloc(32), iv);
    const data = Buffer.concat([cipher.update('legacy-test-secret', 'utf8'), cipher.final()]);
    const legacy = JSON.stringify({ iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data: data.toString('hex') });
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    expect(() => decrypt(legacy)).toThrow();
  });
});
