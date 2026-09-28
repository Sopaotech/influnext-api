const fs = require('node:fs');
const path = require('node:path');
const { validateInstagramTestEnv } = require('../scripts/validate-instagram-test-env');
const { projectPattern, safeProcessEnvironment, validateComposeAction } = require('../scripts/run-instagram-test-compose');
const { buildFrontendEnvironment, frontendCommands } = require('../scripts/start-instagram-test-frontend');

function validConfig() {
  const testKey = 'a'.repeat(64);
  return {
    NODE_ENV: 'production',
    POSTGRES_USER: 'influnext_app',
    POSTGRES_PASSWORD: 'local-test-password-only',
    POSTGRES_DB: 'influnext_instagram_test',
    DATABASE_URL: 'postgresql://influnext_app:local-test-password-only@postgres:5432/influnext_instagram_test?schema=public',
    DIRECT_URL: 'postgresql://influnext_app:local-test-password-only@postgres:5432/influnext_instagram_test?schema=public',
    REDIS_URL: 'redis://redis:6379',
    JWT_SECRET: 'local-test-only-jwt-secret-not-for-production-123',
    FRONTEND_URL: 'https://ig-test-host-123.test',
    ALLOWED_ORIGINS: 'https://ig-test-host-123.test',
    NEXT_PUBLIC_API_URL: 'https://ig-test-host-123.test/v1',
    NEXT_PUBLIC_ISOLATED_TEST: 'true',
    INFLUNEXT_TEST_API_ORIGIN: 'http://127.0.0.1:4000',
    INSTAGRAM_CLIENT_ID: 'meta-test-app-id',
    INSTAGRAM_CLIENT_SECRET: 'meta-test-app-secret-only',
    INSTAGRAM_POST_SYNC_AI_ENABLED: 'false',
    SOCIAL_TOKEN_ACTIVE_KEY_ID: 'V1',
    SOCIAL_TOKEN_KEY_V1: testKey,
    ENCRYPTION_KEY: testKey,
  };
}

describe('Instagram isolated test environment validation', () => {
  it('accepts HTTPS test frontend with Compose-only PostgreSQL and Redis hosts', () => {
    expect(validateInstagramTestEnv(validConfig())).toEqual([]);
  });

  it('rejects production database, Redis, and API destinations without echoing values', () => {
    const config = validConfig();
    config.DATABASE_URL = 'postgresql://u:p@prod.example:5432/live';
    config.REDIS_URL = 'redis://production.example:6379';
    config.NEXT_PUBLIC_API_URL = 'https://api.influnext.com.br/v1';
    const errors = validateInstagramTestEnv(config);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('DATABASE_URL'),
      expect.stringContaining('REDIS_URL'),
      expect.stringContaining('NEXT_PUBLIC_API_URL'),
    ]));
    expect(errors.join(' ')).not.toContain('prod.example');
    expect(errors.join(' ')).not.toContain('api.influnext.com.br');
  });

  it('rejects AI credentials and shared cookie domains', () => {
    const config = { ...validConfig(), GEMINI_API_KEY: 'fake-test-value', SESSION_COOKIE_DOMAIN: 'test-host' };
    expect(validateInstagramTestEnv(config).join(' ')).toMatch(/GEMINI_API_KEY/);
    expect(validateInstagramTestEnv(config).join(' ')).toMatch(/SESSION_COOKIE_DOMAIN/);
  });

  it('rejects placeholder credentials and non-test API origins', () => {
    const config = validConfig();
    config.INSTAGRAM_CLIENT_SECRET = 'REPLACE_WITH_SECRET';
    config.INFLUNEXT_TEST_API_ORIGIN = 'https://api.influnext.com.br';
    const errors = validateInstagramTestEnv(config).join(' ');
    expect(errors).toMatch(/INSTAGRAM_CLIENT_SECRET/);
    expect(errors).toMatch(/INFLUNEXT_TEST_API_ORIGIN/);
  });

  it('requires timestamped isolated Compose project names', () => {
    expect(projectPattern.test('influnext-instagram-test-20260926-143000')).toBe(true);
    expect(projectPattern.test('influnext-local')).toBe(false);
  });

  it('does not inherit database, Redis, or Docker endpoint overrides from the shell', () => {
    const env = safeProcessEnvironment();
    for (const name of ['DATABASE_URL', 'REDIS_URL', 'DOCKER_HOST', 'DOCKER_CONTEXT', 'COMPOSE_FILE', 'COMPOSE_PROFILES']) {
      expect(env).not.toHaveProperty(name);
    }
  });

  it('never allows the scheduler or db push through the isolated Compose wrapper', () => {
    expect(() => validateComposeAction(['up', '-d', 'postgres', 'redis', 'api', 'worker'])).not.toThrow();
    expect(() => validateComposeAction(['up', '-d', 'scheduler'])).toThrow(/scheduler is prohibited/);
    expect(() => validateComposeAction(['run', '--rm', 'api', 'npx', 'prisma', 'db', 'push'])).toThrow(/not allowed/);
    expect(() => validateComposeAction(['run', '--rm', 'api', 'npx', 'prisma', 'migrate', 'deploy'])).not.toThrow();
  });

  it('passes only test frontend settings and forces a host-only cookie domain', () => {
    const inherited = {
      PATH: 'test-path',
      DATABASE_URL: 'must-not-pass-through',
      REDIS_URL: 'must-not-pass-through',
      INSTAGRAM_CLIENT_SECRET: 'must-not-pass-through',
      GEMINI_API_KEY: 'must-not-pass-through',
      NEXT_PUBLIC_COOKIE_DOMAIN: '.influnext.com.br',
    };
    const env = buildFrontendEnvironment(validConfig(), inherited);
    expect(env.NEXT_PUBLIC_API_URL).toBe('https://ig-test-host-123.test/v1');
    expect(env.NEXT_PUBLIC_COOKIE_DOMAIN).toBe('');
    expect(env.NODE_ENV).toBe('production');
    for (const name of ['DATABASE_URL', 'REDIS_URL', 'INSTAGRAM_CLIENT_SECRET', 'GEMINI_API_KEY']) {
      expect(env).not.toHaveProperty(name);
    }
  });

  it('uses a stable production build and loopback-only start command for the isolated frontend', () => {
    expect(frontendCommands).toEqual({
      build: ['run', 'build:web'],
      start: ['run', 'start:web'],
    });

    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
    expect(packageJson.scripts['start:web']).toContain('--hostname 127.0.0.1 --port 3000');

    const nextConfig = fs.readFileSync(path.resolve(__dirname, '../web/next.config.ts'), 'utf8');
    expect(nextConfig).toContain("process.env.NODE_ENV !== \"production\" || isolatedInstagramTestMode");
    expect(nextConfig).toContain('register: !isolatedInstagramTestMode');
  });
});
