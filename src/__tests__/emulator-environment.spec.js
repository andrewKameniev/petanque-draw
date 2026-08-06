import { describe, expect, it } from 'vitest';
import {
  assertEmulatorEnvironment,
  EMULATOR_AUTH_HOST,
  EMULATOR_DATABASE_HOST,
  EMULATOR_PROJECT_ID,
  requireRuntimeFixtureCredentials,
} from '../../e2e/emulator-environment.js';

function validEnvironment() {
  return {
    E2E_FIREBASE_MODE: 'emulator',
    E2E_FIREBASE_PROJECT_ID: EMULATOR_PROJECT_ID,
    FIREBASE_AUTH_EMULATOR_HOST: EMULATOR_AUTH_HOST,
    FIREBASE_DATABASE_EMULATOR_HOST: EMULATOR_DATABASE_HOST,
    GCLOUD_PROJECT: EMULATOR_PROJECT_ID,
    VITE_FIREBASE_MODE: 'emulator',
    VITE_FIREBASE_PROJECT_ID: EMULATOR_PROJECT_ID,
    VITE_FIREBASE_AUTH_EMULATOR_HOST: EMULATOR_AUTH_HOST,
    VITE_FIREBASE_DATABASE_EMULATOR_HOST: EMULATOR_DATABASE_HOST,
  };
}

describe('Firebase emulator environment guard', () => {
  it('accepts the complete demo-project loopback contract', () => {
    expect(assertEmulatorEnvironment(validEnvironment())).toEqual({
      projectId: EMULATOR_PROJECT_ID,
      auth: { host: '127.0.0.1', port: 9099 },
      database: { host: '127.0.0.1', port: 9000 },
    });
  });

  it.each([
    ['missing explicit mode', { E2E_FIREBASE_MODE: undefined }],
    ['real project', { E2E_FIREBASE_PROJECT_ID: 'petanque-draw' }],
    ['missing database host', { FIREBASE_DATABASE_EMULATOR_HOST: undefined }],
    ['protocol-bearing host', { FIREBASE_AUTH_EMULATOR_HOST: 'http://127.0.0.1:9099' }],
    ['browser mismatch', { VITE_FIREBASE_PROJECT_ID: 'petanque-draw' }],
  ])('rejects %s without a fallback', (_name, override) => {
    expect(() => assertEmulatorEnvironment({ ...validEnvironment(), ...override })).toThrow();
  });

  it('requires runtime-only disposable fixture values', () => {
    expect(() => requireRuntimeFixtureCredentials({})).toThrow(/Missing disposable emulator fixture value/);
    expect(
      requireRuntimeFixtureCredentials({
        E2E_RUN_ID: 'run',
        E2E_TEST_EMAIL: 'main@example.test',
        E2E_TEST_PASSWORD: 'runtime-main',
        E2E_OWNER_EMAIL: 'owner@example.test',
        E2E_OWNER_PASSWORD: 'runtime-owner',
      }),
    ).toEqual({
      runId: 'run',
      email: 'main@example.test',
      password: 'runtime-main',
      ownerEmail: 'owner@example.test',
      ownerPassword: 'runtime-owner',
    });
  });
});
