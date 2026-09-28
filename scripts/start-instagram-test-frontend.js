const path = require('node:path');
const { spawn } = require('node:child_process');
const { readInstagramTestEnv, validateInstagramTestEnv } = require('./validate-instagram-test-env');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, '.env.instagram-test');
const frontendCommands = {
  build: ['run', 'build:web'],
  start: ['run', 'start:web'],
};

function buildFrontendEnvironment(values, inherited = process.env) {
  const childEnv = {};
  for (const name of ['PATH', 'PATHEXT', 'SystemRoot', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOME', 'TMPDIR']) {
    if (inherited[name]) childEnv[name] = inherited[name];
  }
  childEnv.NEXT_PUBLIC_API_URL = values.NEXT_PUBLIC_API_URL;
  childEnv.NEXT_PUBLIC_ISOLATED_TEST = 'true';
  childEnv.NEXT_PUBLIC_SITE_URL = values.FRONTEND_URL;
  childEnv.NEXT_PUBLIC_APP_URL = values.FRONTEND_URL;
  childEnv.NEXT_PUBLIC_COOKIE_DOMAIN = '';
  childEnv.INFLUNEXT_TEST_API_ORIGIN = values.INFLUNEXT_TEST_API_ORIGIN;
  childEnv.NODE_ENV = 'production';
  return childEnv;
}

function spawnFrontendCommand(args, childEnv) {
  return spawn('npm', args, {
    cwd: root,
    env: childEnv,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
}

function runFrontendCommand(args, childEnv) {
  return new Promise(resolve => {
    const child = spawnFrontendCommand(args, childEnv);
    child.on('error', () => resolve(1));
    child.on('exit', code => resolve(code || 0));
  });
}

async function startFrontend() {
  try {
    const values = readInstagramTestEnv(configPath);
    const errors = validateInstagramTestEnv(values);
    if (errors.length) {
      process.stderr.write(`Instagram test frontend was not started:\n${errors.map(error => `- ${error}`).join('\n')}\nValues were not printed.\n`);
      process.exitCode = 1;
      return;
    }

    const childEnv = buildFrontendEnvironment(values);
    const buildExitCode = await runFrontendCommand(frontendCommands.build, childEnv);
    if (buildExitCode !== 0) {
      process.stderr.write('Could not build the isolated frontend. No configuration values were printed.\n');
      process.exitCode = buildExitCode;
      return;
    }

    const child = spawnFrontendCommand(frontendCommands.start, childEnv);
    child.on('error', () => {
      process.stderr.write('Could not start the isolated frontend command. No configuration values were printed.\n');
      process.exitCode = 1;
    });
    child.on('exit', (code, signal) => {
      if (signal) process.kill(process.pid, signal);
      else process.exitCode = code || 0;
    });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) startFrontend();
module.exports = { buildFrontendEnvironment, frontendCommands };
