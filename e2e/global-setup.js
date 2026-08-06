import { assertEmulatorEnvironment, requireRuntimeFixtureCredentials } from './emulator-environment.js';
import { ensureEmulatorUsers } from './firebase-fixtures.js';

export default async function globalSetup() {
  assertEmulatorEnvironment();
  requireRuntimeFixtureCredentials();
  await ensureEmulatorUsers();
}
