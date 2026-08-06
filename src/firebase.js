// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBxMqWxQwI1OBhLk7wrzv0UhunvMTTgcgU',
  authDomain: 'petanque-draw.firebaseapp.com',
  databaseURL: 'https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'petanque-draw',
  storageBucket: 'petanque-draw.appspot.com',
  messagingSenderId: '774303828599',
  appId: '1:774303828599:web:78c14845b68be7fd4e5472',
};

const expectedEmulatorProject = 'demo-petanque-draw';

function parseEmulatorHost(value, name) {
  if (!value || value.includes('://') || value.includes('/') || value.includes('?') || value.includes('#')) {
    throw new Error(`${name} must be a loopback host:port pair without a protocol or path.`);
  }
  const match = /^(127\.0\.0\.1|localhost):(\d{1,5})$/.exec(value);
  const port = Number(match?.[2]);
  if (!match || port < 1 || port > 65535) throw new Error(`${name} must use an explicit loopback host and valid port.`);
  return { host: match[1], port };
}

function resolveFirebaseRuntime() {
  const mode = import.meta.env.VITE_FIREBASE_MODE;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const authHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
  const databaseHost = import.meta.env.VITE_FIREBASE_DATABASE_EMULATOR_HOST;
  const anyEmulatorValue = [mode, projectId, authHost, databaseHost].some(Boolean);

  if (!anyEmulatorValue) return { config: firebaseConfig, emulator: null };
  if (mode !== 'emulator' || projectId !== expectedEmulatorProject || !authHost || !databaseHost) {
    throw new Error('Partial or non-demo Firebase emulator configuration is forbidden.');
  }

  return {
    config: {
      apiKey: 'demo-api-key',
      authDomain: `${projectId}.firebaseapp.com`,
      databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
      projectId,
      appId: 'demo-app-id',
    },
    emulator: {
      projectId,
      auth: parseEmulatorHost(authHost, 'VITE_FIREBASE_AUTH_EMULATOR_HOST'),
      database: parseEmulatorHost(databaseHost, 'VITE_FIREBASE_DATABASE_EMULATOR_HOST'),
    },
  };
}

const runtime = resolveFirebaseRuntime();
const app = initializeApp(runtime.config);
const auth = getAuth(app);
const database = getDatabase(app);

if (runtime.emulator) {
  connectAuthEmulator(auth, `http://${runtime.emulator.auth.host}:${runtime.emulator.auth.port}`, {
    disableWarnings: true,
  });
  connectDatabaseEmulator(database, runtime.emulator.database.host, runtime.emulator.database.port);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.firebaseEmulatorProject = runtime.emulator.projectId;
  }
}

async function initializeMessaging() {
  if (runtime.emulator) return null;
  if (await isSupported()) {
    return getMessaging(app);
  }
  return null;
}

export { database, initializeMessaging, auth };
