const { spawnSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function assertSafeRedisTestUrl() {
  const value = process.env.REDIS_TEST_URL;
  if (!value) {
    throw new Error('REDIS_TEST_URL is required for Redis/BullMQ integration tests.');
  }

  const url = new URL(value);
  const isRedis = url.protocol === 'redis:';
  const isLocalHost = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
  const isTestPort = (url.port || '6379') === '6380';

  if (!isRedis || !isLocalHost || !isTestPort) {
    throw new Error('Redis/BullMQ integration tests require local Redis on port 6380.');
  }
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
  assertSafeRedisTestUrl();
  run(process.execPath, [
    path.join('node_modules', 'jest', 'bin', 'jest.js'),
    '--runInBand',
    '--runTestsByPath',
    path.join('tests', 'integration', 'redis-bullmq.integration.test.ts'),
  ], {
    ...process.env,
    NODE_ENV: 'test',
  });
} catch (error) {
  console.error('[redis-bullmq-integration-test-harness] blocked:', error instanceof Error ? error.message : 'unknown error');
  process.exit(1);
}
