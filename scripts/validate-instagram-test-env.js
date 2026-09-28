const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const REQUIRED_NAMES = [
  'NODE_ENV', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB',
  'DATABASE_URL', 'DIRECT_URL', 'REDIS_URL', 'JWT_SECRET',
  'FRONTEND_URL', 'ALLOWED_ORIGINS', 'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_ISOLATED_TEST', 'INFLUNEXT_TEST_API_ORIGIN',
  'INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET',
  'INSTAGRAM_POST_SYNC_AI_ENABLED',
  'SOCIAL_TOKEN_ACTIVE_KEY_ID', 'SOCIAL_TOKEN_KEY_V1', 'ENCRYPTION_KEY',
];
const PRODUCTION_HOSTS = new Set([
  'influnext.com.br', 'www.influnext.com.br', 'influnext.com', 'www.influnext.com',
  'api.influnext.com.br', 'influnext-api-production.up.railway.app',
]);
const PLACEHOLDER_PATTERN = /replace[_-]?with|placeholder|change[_-]?me/i;

function parseUrl(values, name, errors) {
  try {
    return new URL(values[name]);
  } catch {
    errors.push(`${name} must be a valid absolute URL`);
    return null;
  }
}

function validateInstagramTestEnv(values) {
  const errors = [];
  for (const name of REQUIRED_NAMES) {
    if (typeof values[name] !== 'string' || !values[name].trim()) errors.push(`${name} is required`);
  }
  if (Object.prototype.hasOwnProperty.call(values, 'GEMINI_API_KEY')) {
    errors.push('GEMINI_API_KEY must be absent from the isolated test file');
  }
  for (const name of ['SESSION_COOKIE_DOMAIN', 'NEXT_PUBLIC_COOKIE_DOMAIN']) {
    if (values[name]?.trim()) errors.push(`${name} must be unset so cookies remain host-only`);
  }

  if (errors.length) return errors;

  for (const name of REQUIRED_NAMES) {
    if (PLACEHOLDER_PATTERN.test(values[name])) errors.push(`${name} still contains a placeholder`);
  }
  if (values.NODE_ENV !== 'production') errors.push('NODE_ENV must be production for Secure cookies');
  if (values.NEXT_PUBLIC_ISOLATED_TEST !== 'true') errors.push('NEXT_PUBLIC_ISOLATED_TEST must equal true');
  if (values.INSTAGRAM_POST_SYNC_AI_ENABLED !== 'false') errors.push('INSTAGRAM_POST_SYNC_AI_ENABLED must equal false');
  if (!/^[A-Za-z0-9_]+$/.test(values.POSTGRES_USER)) errors.push('POSTGRES_USER is invalid');
  if (!/^[a-z][a-z0-9_]*$/.test(values.POSTGRES_DB) || values.POSTGRES_DB !== 'influnext_instagram_test') {
    errors.push('POSTGRES_DB must equal the isolated database name influnext_instagram_test');
  }
  if (values.JWT_SECRET.length < 32) errors.push('JWT_SECRET must contain at least 32 characters');

  const databaseUrl = parseUrl(values, 'DATABASE_URL', errors);
  const directUrl = parseUrl(values, 'DIRECT_URL', errors);
  for (const [name, url] of [['DATABASE_URL', databaseUrl], ['DIRECT_URL', directUrl]]) {
    if (!url) continue;
    if (url.protocol !== 'postgresql:' || url.hostname !== 'postgres' || (url.port && url.port !== '5432')) {
      errors.push(`${name} must target the Compose PostgreSQL service on port 5432`);
    }
    try {
      if (decodeURIComponent(url.pathname.slice(1)) !== values.POSTGRES_DB) errors.push(`${name} must target POSTGRES_DB`);
      if (decodeURIComponent(url.username) !== values.POSTGRES_USER) errors.push(`${name} username must match POSTGRES_USER`);
      if (decodeURIComponent(url.password) !== values.POSTGRES_PASSWORD) errors.push(`${name} password must match POSTGRES_PASSWORD`);
    } catch {
      errors.push(`${name} contains invalid URL encoding`);
    }
  }

  const redisUrl = parseUrl(values, 'REDIS_URL', errors);
  if (redisUrl && (redisUrl.protocol !== 'redis:' || redisUrl.hostname !== 'redis' || (redisUrl.port && redisUrl.port !== '6379') || redisUrl.username || redisUrl.password || redisUrl.search || redisUrl.hash)) {
    errors.push('REDIS_URL must target the Compose Redis service on port 6379');
  }

  const frontendUrl = parseUrl(values, 'FRONTEND_URL', errors);
  const apiUrl = parseUrl(values, 'NEXT_PUBLIC_API_URL', errors);
  if (frontendUrl) {
    if (frontendUrl.protocol !== 'https:' || frontendUrl.origin !== values.FRONTEND_URL.replace(/\/$/, '')) {
      errors.push('FRONTEND_URL must be an HTTPS origin without a path');
    }
    if (PRODUCTION_HOSTS.has(frontendUrl.hostname.toLowerCase()) || frontendUrl.hostname.endsWith('.invalid') || ['localhost', '127.0.0.1'].includes(frontendUrl.hostname)) {
      errors.push('FRONTEND_URL must be a manually approved non-production test hostname');
    }
  }
  if (apiUrl) {
    if (apiUrl.protocol !== 'https:' || apiUrl.pathname !== '/v1' || apiUrl.search || apiUrl.hash || apiUrl.username || apiUrl.password) {
      errors.push('NEXT_PUBLIC_API_URL must be the HTTPS test origin ending in /v1');
    }
    if (frontendUrl && apiUrl.origin !== frontendUrl.origin) {
      errors.push('NEXT_PUBLIC_API_URL must use the same origin as FRONTEND_URL');
    }
    if (PRODUCTION_HOSTS.has(apiUrl.hostname.toLowerCase())) {
      errors.push('NEXT_PUBLIC_API_URL must not target a production host');
    }
  }
  const origins = values.ALLOWED_ORIGINS.split(',').map(value => value.trim()).filter(Boolean);
  if (!frontendUrl || origins.length !== 1 || origins[0] !== frontendUrl.origin) {
    errors.push('ALLOWED_ORIGINS must contain only the FRONTEND_URL origin');
  }

  let localApiOrigin;
  try { localApiOrigin = new URL(values.INFLUNEXT_TEST_API_ORIGIN); } catch {
    errors.push('INFLUNEXT_TEST_API_ORIGIN must be a valid local HTTP origin');
  }
  if (localApiOrigin && (localApiOrigin.protocol !== 'http:'
    || !['127.0.0.1', 'localhost'].includes(localApiOrigin.hostname)
    || localApiOrigin.port !== '4000' || localApiOrigin.pathname !== '/'
    || localApiOrigin.username || localApiOrigin.password || localApiOrigin.search || localApiOrigin.hash)) {
    errors.push('INFLUNEXT_TEST_API_ORIGIN must target local API port 4000');
  }

  if (!values.INSTAGRAM_CLIENT_ID.trim()) errors.push('INSTAGRAM_CLIENT_ID is required');
  if (!values.INSTAGRAM_CLIENT_SECRET.trim()) errors.push('INSTAGRAM_CLIENT_SECRET is required');
  if (values.SOCIAL_TOKEN_ACTIVE_KEY_ID !== 'V1') errors.push('SOCIAL_TOKEN_ACTIVE_KEY_ID must be V1 for this test profile');
  if (!/^[a-fA-F0-9]{64}$/.test(values.SOCIAL_TOKEN_KEY_V1) || /^0{64}$/i.test(values.SOCIAL_TOKEN_KEY_V1)) {
    errors.push('SOCIAL_TOKEN_KEY_V1 must be a non-zero 32-byte hexadecimal test key');
  }
  if (!/^[a-fA-F0-9]{64}$/.test(values.ENCRYPTION_KEY) || /^0{64}$/i.test(values.ENCRYPTION_KEY)) {
    errors.push('ENCRYPTION_KEY must be a non-zero 32-byte hexadecimal test key');
  }

  return errors;
}

function readInstagramTestEnv(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('Missing .env.instagram-test; copy the example and fill test-only values.');
  return dotenv.parse(fs.readFileSync(filePath));
}

if (require.main === module) {
  const envPath = path.resolve(process.argv[2] || path.join(__dirname, '..', '.env.instagram-test'));
  try {
    const errors = validateInstagramTestEnv(readInstagramTestEnv(envPath));
    if (errors.length) {
      process.stderr.write(`Instagram test environment preflight failed:\n${errors.map(error => `- ${error}`).join('\n')}\nValues were not printed.\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write('Instagram test environment preflight passed. Configuration values were not printed.\n');
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validateInstagramTestEnv, readInstagramTestEnv };
