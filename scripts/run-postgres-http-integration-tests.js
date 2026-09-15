const { spawnSync } = require('child_process');
const { randomBytes } = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function assertSafeTestDatabaseUrl(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for PostgreSQL HTTP integration tests.`);
  }

  const url = new URL(value);
  const databaseName = url.pathname.replace(/^\//, '');
  const isLocalHost = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
  const isPostgres = url.protocol === 'postgresql:';
  const isExpectedPort = (url.port || '5432') === '5433';
  const isTestDatabase = /test/i.test(databaseName);

  if (!isPostgres || !isLocalHost || !isExpectedPort || !isTestDatabase) {
    throw new Error(`${name} must target a local PostgreSQL database on port 5433 whose name contains "test".`);
  }

  return url;
}

function assertSafeRedisTestUrl() {
  const value = process.env.REDIS_TEST_URL;
  if (!value) {
    throw new Error('REDIS_TEST_URL is required for PostgreSQL HTTP integration tests.');
  }

  const url = new URL(value);
  const isRedis = url.protocol === 'redis:';
  const isLocalHost = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
  const isTestPort = (url.port || '6379') === '6380';

  if (!isRedis || !isLocalHost || !isTestPort) {
    throw new Error('PostgreSQL HTTP integration tests require local Redis on port 6380.');
  }

  return url;
}

function run(command, args, environment) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: environment,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

try {
  const databaseUrl = assertSafeTestDatabaseUrl('TEST_DATABASE_URL');
  const directUrl = assertSafeTestDatabaseUrl('TEST_DIRECT_URL');
  const redisUrl = assertSafeRedisTestUrl();

  if (databaseUrl.pathname !== directUrl.pathname) {
    throw new Error('TEST_DATABASE_URL and TEST_DIRECT_URL must target the same database.');
  }

  const testEnvironment = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl.toString(),
    DIRECT_URL: directUrl.toString(),
    INTEGRATION_DATABASE_URL: databaseUrl.toString(),
    INTEGRATION_DIRECT_URL: directUrl.toString(),
    REDIS_TEST_URL: redisUrl.toString(),
    REDIS_URL: redisUrl.toString(),
    JWT_SECRET: randomBytes(32).toString('hex'),
    ALLOWED_ORIGINS: '',
    FRONTEND_URL: 'https://frontend.example.test',
    INSTAGRAM_CLIENT_ID: 'test-instagram-client',
    INSTAGRAM_CLIENT_SECRET: 'test-instagram-client-secret',
    SOCIAL_TOKEN_ACTIVE_KEY_ID: 'test',
    SOCIAL_TOKEN_KEY_TEST: randomBytes(32).toString('hex'),
  };

  run(process.execPath, [
    path.join('node_modules', 'prisma', 'build', 'index.js'),
    'migrate',
    'deploy',
  ], testEnvironment);

  run(process.execPath, [
    path.join('node_modules', 'jest', 'bin', 'jest.js'),
    '--runInBand',
    '--runTestsByPath',
    path.join('tests', 'integration', 'http.integration.test.ts'),
    path.join('tests', 'integration', 'http-runtime.integration.test.ts'),
    path.join('tests', 'integration', 'lifecycle.integration.test.ts'),
    path.join('tests', 'integration', 'readiness.integration.test.ts'),
    path.join('tests', 'integration', 'instagram-oauth-contract.integration.test.ts'),
    path.join('tests', 'integration', 'instagram-sync-status.integration.test.ts'),
    path.join('tests', 'integration', 'instagram-snapshot-collection.integration.test.ts'),
  ], testEnvironment);
} catch (error) {
  console.error('[http-integration-test-harness] blocked:', error instanceof Error ? error.message : 'unknown error');
  process.exit(1);
}
