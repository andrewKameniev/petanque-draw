import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMULATOR_AUTH_HOST, EMULATOR_DATABASE_HOST, EMULATOR_PROJECT_ID } from '../e2e/emulator-environment.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const firebaseCli = fileURLToPath(new URL('../node_modules/firebase-tools/lib/bin/firebase.js', import.meta.url));
const childRunner = fileURLToPath(new URL('./run-playwright-emulator-suite.mjs', import.meta.url));
const suite = process.argv[2] ?? 'all';
const supportedSuites = new Set(['all', 'task11', 'headed', 'ui']);
if (!supportedSuites.has(suite)) throw new Error(`Unknown emulator E2E suite: ${suite}`);

const runId = randomUUID().replaceAll('-', '');
const runtimePassword = randomBytes(32).toString('base64url');
const cliConfigDirectory = path.join(os.tmpdir(), `petanque-firebase-cli-${runId}`);
mkdirSync(cliConfigDirectory, { recursive: true });

async function findLoopbackPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close((error) => {
        if (error) reject(error);
        else resolve(String(address.port));
      });
    });
  });
}

const environment = {
  ...process.env,
  E2E_FIREBASE_MODE: 'emulator',
  E2E_FIREBASE_PROJECT_ID: EMULATOR_PROJECT_ID,
  E2E_RUN_ID: runId,
  E2E_TEST_EMAIL: `e2e-main-${runId}@example.test`,
  E2E_TEST_PASSWORD: runtimePassword,
  E2E_OWNER_EMAIL: `e2e-owner-${runId}@example.test`,
  E2E_OWNER_PASSWORD: randomBytes(32).toString('base64url'),
  E2E_PORT: process.env.E2E_PORT ?? (await findLoopbackPort()),
  FIREBASE_AUTH_EMULATOR_HOST: EMULATOR_AUTH_HOST,
  FIREBASE_DATABASE_EMULATOR_HOST: EMULATOR_DATABASE_HOST,
  GCLOUD_PROJECT: EMULATOR_PROJECT_ID,
  VITE_FIREBASE_MODE: 'emulator',
  VITE_FIREBASE_PROJECT_ID: EMULATOR_PROJECT_ID,
  VITE_FIREBASE_AUTH_EMULATOR_HOST: EMULATOR_AUTH_HOST,
  VITE_FIREBASE_DATABASE_EMULATOR_HOST: EMULATOR_DATABASE_HOST,
  XDG_CONFIG_HOME: cliConfigDirectory,
  FIREBASE_EMULATORS_PATH:
    process.env.FIREBASE_EMULATORS_PATH ?? path.join(repositoryRoot, '.firebase-emulators-cache'),
};

function shellQuote(value) {
  if (process.platform === 'win32') return `"${value.replaceAll('"', '\\"')}"`;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

const testCommand = [process.execPath, childRunner, suite].map(shellQuote).join(' ');
const child = spawn(
  process.execPath,
  [firebaseCli, 'emulators:exec', '--only', 'auth,database', '--project', EMULATOR_PROJECT_ID, testCommand],
  { cwd: repositoryRoot, env: environment, stdio: 'inherit' },
);

child.on('error', (error) => {
  console.error(error.message);
  rmSync(cliConfigDirectory, { recursive: true, force: true });
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  if (signal) console.error(`Firebase emulator runner stopped by ${signal}.`);
  rmSync(cliConfigDirectory, { recursive: true, force: true });
  process.exitCode = code ?? 1;
});
