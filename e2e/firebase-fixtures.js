import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { get, getDatabase, ref, remove, set } from 'firebase/database';
import { TEST_EMAIL, TEST_PASSWORD } from './helpers.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBxMqWxQwI1OBhLk7wrzv0UhunvMTTgcgU',
  authDomain: 'petanque-draw.firebaseapp.com',
  databaseURL: 'https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'petanque-draw',
  storageBucket: 'petanque-draw.appspot.com',
  messagingSenderId: '774303828599',
  appId: '1:774303828599:web:78c14845b68be7fd4e5472',
};

const SHARED_OWNER_EMAIL = 'e2e-owner-petanque@mailinator.com';
const SHARED_OWNER_PASSWORD = 'TestPass123!';
const TASK03_OWNED_FIXTURE_NAMES = new Set([
  'Adapter Wrapper Cup',
  'Adapter Legacy Cup',
  'Archived Wrapper Adapter',
  'Archived Legacy Adapter',
  'Archived Layout Fixture',
]);

const clients = new Map();

async function getClient(name, email, password, { create = false } = {}) {
  if (clients.has(name)) return clients.get(name);
  const app = getApps().some((candidate) => candidate.name === name)
    ? getApp(name)
    : initializeApp(firebaseConfig, name);
  const auth = getAuth(app);
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (!create) throw error;
    credential = await createUserWithEmailAndPassword(auth, email, password);
  }
  const client = { auth, db: getDatabase(app), uid: credential.user.uid };
  clients.set(name, client);
  return client;
}

export function createFixtureId(offset = 0) {
  return String(Date.now() + offset);
}

export function encodePublicRef(uid, tournamentId) {
  return `${uid}.${Number(tournamentId).toString(36)}`;
}

export async function seedOwnedTournament(tournamentId, record, { status = 'active' } = {}) {
  const client = await getClient('task03-e2e-main', TEST_EMAIL, TEST_PASSWORD);
  await set(ref(client.db, `${client.uid}/tournaments/${tournamentId}`), record);
  await set(ref(client.db, `users/${client.uid}/tournaments/${tournamentId}`), {
    status,
    role: 'owner',
    name: record.name || record.main?.name || tournamentId,
    ...(status === 'archived' ? { archiveStatusVersion: 1 } : {}),
  });
  return { uid: client.uid, tournamentId, ref: encodePublicRef(client.uid, tournamentId) };
}

export async function seedSharedTournament(tournamentId, record) {
  const viewer = await getClient('task03-e2e-main', TEST_EMAIL, TEST_PASSWORD);
  const owner = await getClient('task03-e2e-owner', SHARED_OWNER_EMAIL, SHARED_OWNER_PASSWORD, { create: true });
  const sharedRecord = {
    ...record,
    collaborators: {
      ...(record.collaborators || {}),
      [viewer.uid]: { role: 'admin', email: TEST_EMAIL },
    },
  };
  await set(ref(owner.db, `${owner.uid}/tournaments/${tournamentId}`), sharedRecord);
  await set(ref(viewer.db, `users/${viewer.uid}/tournaments/${tournamentId}`), {
    status: 'active',
    role: 'admin',
    ownerUid: owner.uid,
    name: record.name,
    archiveStatusVersion: 1,
  });
  return { uid: viewer.uid, ownerUid: owner.uid, tournamentId, ref: encodePublicRef(owner.uid, tournamentId) };
}

export async function readOwnedTournament(tournamentId) {
  const client = await getClient('task03-e2e-main', TEST_EMAIL, TEST_PASSWORD);
  return (await get(ref(client.db, `${client.uid}/tournaments/${tournamentId}`))).val();
}

export async function readSharedTournament(ownerUid, tournamentId) {
  const owner = await getClient('task03-e2e-owner', SHARED_OWNER_EMAIL, SHARED_OWNER_PASSWORD, { create: true });
  if (owner.uid !== ownerUid) throw new Error('Unexpected shared fixture owner');
  return (await get(ref(owner.db, `${ownerUid}/tournaments/${tournamentId}`))).val();
}

export async function readUserMapEntry(tournamentId) {
  const client = await getClient('task03-e2e-main', TEST_EMAIL, TEST_PASSWORD);
  return (await get(ref(client.db, `users/${client.uid}/tournaments/${tournamentId}`))).val();
}

export async function cleanupOwnedTournament(tournamentId) {
  const client = await getClient('task03-e2e-main', TEST_EMAIL, TEST_PASSWORD);
  await Promise.all([
    remove(ref(client.db, `${client.uid}/tournaments/${tournamentId}`)),
    remove(ref(client.db, `${client.uid}/saved/${tournamentId}`)),
    remove(ref(client.db, `users/${client.uid}/tournaments/${tournamentId}`)),
    remove(ref(client.db, `tokens/${client.uid}/${tournamentId}`)),
  ]);
}

export async function cleanupSharedTournament(ownerUid, tournamentId) {
  const viewer = await getClient('task03-e2e-main', TEST_EMAIL, TEST_PASSWORD);
  const owner = await getClient('task03-e2e-owner', SHARED_OWNER_EMAIL, SHARED_OWNER_PASSWORD, { create: true });
  if (owner.uid !== ownerUid) throw new Error('Unexpected shared fixture owner');
  await Promise.all([
    remove(ref(owner.db, `${ownerUid}/tournaments/${tournamentId}`)),
    remove(ref(viewer.db, `users/${viewer.uid}/tournaments/${tournamentId}`)),
    remove(ref(owner.db, `tokens/${ownerUid}/${tournamentId}`)),
  ]);
}

export async function cleanupTask03Fixtures() {
  const viewer = await getClient('task03-e2e-main', TEST_EMAIL, TEST_PASSWORD);
  const ownedSnapshot = await get(ref(viewer.db, `${viewer.uid}/tournaments`));
  const ownedIds = Object.entries(ownedSnapshot.val() || {})
    .filter(([, record]) => TASK03_OWNED_FIXTURE_NAMES.has(record.name))
    .map(([id]) => id);
  await Promise.all(ownedIds.map((id) => cleanupOwnedTournament(id)));

  const owner = await getClient('task03-e2e-owner', SHARED_OWNER_EMAIL, SHARED_OWNER_PASSWORD, { create: true });
  const sharedSnapshot = await get(ref(owner.db, `${owner.uid}/tournaments`));
  const sharedIds = Object.entries(sharedSnapshot.val() || {})
    .filter(([, record]) => record.name === 'Shared Adapter Cup')
    .map(([id]) => id);
  await Promise.all(sharedIds.map((id) => cleanupSharedTournament(owner.uid, id)));
}
