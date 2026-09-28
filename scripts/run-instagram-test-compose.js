const path = require('node:path');
const { spawn } = require('node:child_process');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const { readInstagramTestEnv, validateInstagramTestEnv } = require('./validate-instagram-test-env');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, '.env.instagram-test');
const projectPattern = /^influnext-instagram-test-\d{8}-\d{6}$/;

function safeProcessEnvironment() {
  const env = {};
  for (const name of ['PATH', 'PATHEXT', 'SystemRoot', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'HOME', 'TMPDIR']) {
    if (process.env[name]) env[name] = process.env[name];
  }
  return env;
}

function preflightMarkerPath(projectName) {
  return path.join(os.tmpdir(), `${projectName}-compose-preflight.json`);
}

function dockerOutput(args, env) {
  return execFileSync('docker', args, { cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function validateComposeAction(args) {
  const [command, ...rest] = args;
  if (command === 'config') {
    if (rest.length !== 1 || rest[0] !== '--quiet') throw new Error('Only quiet Compose config validation is allowed.');
    return;
  }
  if (command === 'ps') return;
  if (command === 'build') {
    if (!rest.length || rest.some(value => !['api', 'worker'].includes(value))) {
      throw new Error('Only the isolated API and worker images may be built.');
    }
    return;
  }
  if (command === 'up') {
    const services = rest.filter(value => !value.startsWith('-'));
    if (!services.length || services.some(value => !['api', 'worker', 'postgres', 'redis'].includes(value))) {
      throw new Error('Compose up must name only api, worker, postgres, or redis; scheduler is prohibited.');
    }
    return;
  }
  if (command === 'run'
    && rest.length === 6
    && rest[0] === '--rm'
    && rest[1] === 'api'
    && rest[2] === 'npx'
    && rest[3] === 'prisma'
    && rest[4] === 'migrate'
    && rest[5] === 'deploy') {
    return;
  }
  throw new Error('Compose command is not allowed by the isolated Instagram test wrapper.');
}

function runCompose() {
  const args = process.argv.slice(2);
  const projectName = args.shift();
  if (!projectName || !projectPattern.test(projectName)) {
    throw new Error('Pass a new project name in the form influnext-instagram-test-YYYYMMDD-HHMMSS.');
  }

  const values = readInstagramTestEnv(configPath);
  const errors = validateInstagramTestEnv(values);
  if (errors.length) throw new Error(`Instagram test environment preflight failed: ${errors.join('; ')}`);

  const requestedCommand = args[0];
  if (requestedCommand === 'preflight' && args.length !== 1) {
    throw new Error('The preflight command takes no additional Compose arguments.');
  }
  if (requestedCommand !== 'preflight') validateComposeAction(args);

  const env = safeProcessEnvironment();
  let contextName;
  let endpoint;
  try {
    contextName = dockerOutput(['context', 'show'], env);
    endpoint = dockerOutput(['context', 'inspect', '--format', '{{(index .Endpoints "docker").Host}}', contextName], env);
  } catch {
    throw new Error('Could not verify the Docker context. No Compose command was run.');
  }
  if (!/^(npipe:|unix:\/\/)/i.test(endpoint)) {
    throw new Error('Docker context is not a local named-pipe or Unix socket. No Compose command was run.');
  }

  const composeArgs = [
    '--context', contextName,
    'compose',
    '--project-directory', root,
    '--env-file', configPath,
    '-f', path.join(root, 'docker-compose.yml'),
    '-f', path.join(root, 'docker-compose.instagram-test.yml'),
    '-p', projectName,
  ];
  if (requestedCommand === 'preflight') {
    const volumeName = `${projectName}_instagram_test_postgres_data`;
    let existingVolumeNames;
    let existingContainers;
    try {
      existingVolumeNames = dockerOutput(['--context', contextName, 'volume', 'ls', '--filter', `name=${volumeName}`, '--format', '{{.Name}}'], env)
        .split(/\r?\n/).filter(Boolean);
      if (existingVolumeNames.includes(volumeName)) {
        throw new Error('The isolated PostgreSQL volume already exists; choose a fresh timestamped project name.');
      }
      existingContainers = dockerOutput([...composeArgs, 'ps', '--all', '--quiet'], env);
      dockerOutput([...composeArgs, 'config', '--quiet'], env);
    } catch (error) {
      if (error.message.includes('volume already exists')) throw error;
      throw new Error('Local Compose preflight could not verify the project. No services were started.');
    }
    if (existingContainers) throw new Error('Compose project already has containers; choose a fresh timestamped project name.');
    fs.writeFileSync(preflightMarkerPath(projectName), JSON.stringify({ projectName, contextName }));
    process.stdout.write('Local isolated Compose preflight passed. No services were started.\n');
    return;
  }

  let marker;
  try {
    marker = JSON.parse(fs.readFileSync(preflightMarkerPath(projectName), 'utf8'));
  } catch {
    throw new Error('Run the isolated Compose preflight with this project name before any Compose command.');
  }
  if (marker.projectName !== projectName || marker.contextName !== contextName) {
    throw new Error('Docker context changed after preflight. Re-run preflight with a new project name.');
  }

  composeArgs.push(...args);
  const child = spawn('docker', composeArgs, { cwd: root, env, stdio: 'inherit' });
  child.on('error', () => {
    process.stderr.write('Could not run the local isolated Compose command. Configuration values were not printed.\n');
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code || 0;
  });
}

if (require.main === module) {
  try {
    runCompose();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { projectPattern, safeProcessEnvironment, preflightMarkerPath, validateComposeAction };
