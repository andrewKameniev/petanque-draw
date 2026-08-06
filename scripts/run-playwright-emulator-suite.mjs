import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { assertEmulatorEnvironment, requireRuntimeFixtureCredentials } from '../e2e/emulator-environment.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
const suite = process.argv[2] ?? 'all';

async function canConnect({ host, port }) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(750, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

async function requireListener(target, name) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await canConnect(target)) return;
    await delay(250);
  }
  throw new Error(`${name} emulator is not accepting loopback connections.`);
}

const emulator = assertEmulatorEnvironment();
requireRuntimeFixtureCredentials();
await Promise.all([
  requireListener(emulator.auth, 'Authentication'),
  requireListener(emulator.database, 'Realtime Database'),
]);

const args = [playwrightCli, 'test', '--config', 'playwright.config.js'];
if (suite === 'task11') {
  args.push('e2e/ui-primitives.spec.js', 'e2e/archived-layout.spec.js', 'e2e/tir.spec.js', '--grep', '@task11');
} else if (suite === 'headed') {
  args.push('--headed');
} else if (suite === 'ui') {
  args.push('--ui');
} else if (suite !== 'all') {
  throw new Error(`Unknown Playwright emulator suite: ${suite}`);
}

const child = spawn(process.execPath, args, { cwd: repositoryRoot, env: process.env, stdio: 'inherit' });
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  if (signal) console.error(`Playwright stopped by ${signal}.`);
  process.exitCode = code ?? 1;
});
