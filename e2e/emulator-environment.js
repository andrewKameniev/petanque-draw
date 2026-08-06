export const EMULATOR_PROJECT_ID = 'demo-petanque-draw';
export const EMULATOR_AUTH_HOST = '127.0.0.1:9099';
export const EMULATOR_DATABASE_HOST = '127.0.0.1:9000';

function parseLoopbackHost(value, name) {
  if (!value || value.includes('://') || value.includes('/') || value.includes('?') || value.includes('#')) {
    throw new Error(`${name} must be a host:port pair without a protocol or path.`);
  }
  const match = /^(127\.0\.0\.1|localhost):(\d{1,5})$/.exec(value);
  if (!match) throw new Error(`${name} must use an explicit loopback host and port.`);
  const port = Number(match[2]);
  if (port < 1 || port > 65535) throw new Error(`${name} has an invalid port.`);
  return { host: match[1], port };
}

export function assertEmulatorEnvironment(environment = process.env) {
  if (environment.E2E_FIREBASE_MODE !== 'emulator') {
    throw new Error('Write-capable E2E requires E2E_FIREBASE_MODE=emulator. Refusing to start.');
  }
  if (environment.E2E_FIREBASE_PROJECT_ID !== EMULATOR_PROJECT_ID) {
    throw new Error(`Write-capable E2E requires the isolated ${EMULATOR_PROJECT_ID} project.`);
  }
  if (environment.GCLOUD_PROJECT !== EMULATOR_PROJECT_ID) {
    throw new Error(`GCLOUD_PROJECT must equal ${EMULATOR_PROJECT_ID}.`);
  }
  const authHost = environment.FIREBASE_AUTH_EMULATOR_HOST;
  const databaseHost = environment.FIREBASE_DATABASE_EMULATOR_HOST;
  if (authHost !== EMULATOR_AUTH_HOST || databaseHost !== EMULATOR_DATABASE_HOST) {
    throw new Error('Both Firebase emulator hosts must match the repository loopback configuration.');
  }
  if (
    environment.VITE_FIREBASE_MODE !== 'emulator' ||
    environment.VITE_FIREBASE_PROJECT_ID !== EMULATOR_PROJECT_ID ||
    environment.VITE_FIREBASE_AUTH_EMULATOR_HOST !== authHost ||
    environment.VITE_FIREBASE_DATABASE_EMULATOR_HOST !== databaseHost
  ) {
    throw new Error('Browser Firebase emulator configuration is missing or inconsistent.');
  }
  return {
    projectId: EMULATOR_PROJECT_ID,
    auth: parseLoopbackHost(authHost, 'FIREBASE_AUTH_EMULATOR_HOST'),
    database: parseLoopbackHost(databaseHost, 'FIREBASE_DATABASE_EMULATOR_HOST'),
  };
}

export function requireRuntimeFixtureCredentials(environment = process.env) {
  const values = {
    runId: environment.E2E_RUN_ID,
    email: environment.E2E_TEST_EMAIL,
    password: environment.E2E_TEST_PASSWORD,
    ownerEmail: environment.E2E_OWNER_EMAIL,
    ownerPassword: environment.E2E_OWNER_PASSWORD,
  };
  for (const [name, value] of Object.entries(values)) {
    if (!value) throw new Error(`Missing disposable emulator fixture value: ${name}.`);
  }
  return values;
}
