const { spawnSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function assertSafeRedisTestUrl() {
  const value = process.env.REDIS_TEST_URL;
  if (!value) {
    throw new Error('REDIS_TEST_URL is required for scheduler integration tests.');
  }

  const url = new URL(value);
  const isLocalHost = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
  const isRedis = url.protocol === 'redis:';
  const isExpectedPort = (url.port || '6379') === '6380';

  if (!isRedis || !isLocalHost || !isExpectedPort) {
    throw new Error('Scheduler integration tests require local Redis on port 6380.');
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
  const redisUrl = assertSafeRedisTestUrl();

  run(process.execPath, [
    path.join('node_modules', 'jest', 'bin', 'jest.js'),
    '--runInBand',
    '--runTestsByPath',
    path.join('tests', 'integration', 'scheduler-entrypoint.integration.test.ts'),
    path.join('tests', 'integration', 'scheduler-entrypoint.runtime.integration.test.ts'),
    path.join('tests', 'integration', 'scheduler.integration.test.ts'),
  ], {
    ...process.env,
    NODE_ENV: 'test',
    REDIS_URL: redisUrl.toString(),
  });
} catch (error) {
  console.error('[scheduler-integration-test-harness] blocked:', error instanceof Error ? error.message : 'unknown error');
  process.exit(1);
}
