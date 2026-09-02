// Test double only. Production uses atomic Redis consumption, never this Map.
const attempts = new Map<string, { value: string; expiresAt: number }>();
export const redisConnection = { status: 'ready', connect: jest.fn(), set: jest.fn(), eval: jest.fn() };

export function resetOAuthRedis() {
  attempts.clear();
  redisConnection.status = 'ready';
  redisConnection.connect.mockImplementation(async () => { redisConnection.status = 'ready'; });
  redisConnection.set.mockImplementation(async (key: string, value: string, ex: string, ttl: number, nx: string) => {
    expect(ex).toBe('EX');
    expect(nx).toBe('NX');
    if (attempts.has(key)) return null;
    attempts.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    return 'OK';
  });
  redisConnection.eval.mockImplementation(async (_script: string, keys: number, key: string, value: string) => {
    expect(keys).toBe(1);
    const stored = attempts.get(key);
    if (!stored || stored.value !== value || stored.expiresAt <= Date.now()) return 0;
    attempts.delete(key);
    return 1;
  });
}
