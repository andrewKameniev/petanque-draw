import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { cert, deleteApp, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { APP_VERSION_PATH, compareAppVersions, parseAppVersion } from '../src/services/app-version.js';

export async function publishAppVersion(reference, version) {
  if (!parseAppVersion(version)) throw new Error('Invalid package version');

  const result = await reference.transaction(
    (current) => {
      if (current === null) return version;
      const comparison = compareAppVersions(current, version);
      if (comparison === null) throw new Error(`Invalid Firebase app version: ${current}`);
      return comparison < 0 ? version : undefined;
    },
    undefined,
    false,
  );

  const published = result.snapshot.val();
  if (!result.committed && compareAppVersions(published, version) === 1) {
    throw new Error(`Firebase already has newer version ${published}; refusing to publish ${version}`);
  }
  return result.committed ? 'published' : 'already-current';
}

export async function runPublishAppVersion() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!serviceAccountJson || !databaseURL) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT and FIREBASE_DATABASE_URL are required');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  if (serviceAccount.project_id !== 'petanque-draw') {
    throw new Error('Firebase service account must belong to petanque-draw');
  }
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const app = initializeApp({ credential: cert(serviceAccount), databaseURL });
  try {
    const result = await publishAppVersion(getDatabase(app).ref(APP_VERSION_PATH), version);
    process.stdout.write(`Firebase app version ${version}: ${result}\n`);
  } finally {
    await deleteApp(app);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runPublishAppVersion().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
