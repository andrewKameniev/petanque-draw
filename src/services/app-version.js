import { onValue, ref } from 'firebase/database';

export const APP_VERSION_PATH = 'appMeta/version';
export const APP_VERSION_STORAGE_KEY = 'petanqueDrawAppVersion';
const RELOAD_ATTEMPT_KEY = 'petanqueDrawReloadedVersion';

export function parseAppVersion(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) {
    return null;
  }
  return value.split('.').map(Number);
}

export function compareAppVersions(left, right) {
  const first = parseAppVersion(left);
  const second = parseAppVersion(right);
  if (!first || !second) return null;

  for (let index = 0; index < first.length; index += 1) {
    if (first[index] > second[index]) return 1;
    if (first[index] < second[index]) return -1;
  }
  return 0;
}

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function browserStorage(name) {
  try {
    return window[name];
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // Version checks still work in browsers that block storage.
  }
}

export function startAppVersionMonitor({
  database,
  currentVersion,
  storage = browserStorage('localStorage'),
  sessionStorage = browserStorage('sessionStorage'),
  alreadyRequestedVersion = null,
  reload,
  subscribe = (path, receive, error) => onValue(ref(database, path), (snapshot) => receive(snapshot.val()), error),
  onError = () => {},
}) {
  if (!parseAppVersion(currentVersion)) throw new Error('Invalid bundled app version');

  const firstVisit = safeGet(storage, APP_VERSION_STORAGE_KEY) === null;
  safeSet(storage, APP_VERSION_STORAGE_KEY, currentVersion);
  let firstSnapshot = true;
  let stopped = false;

  const unsubscribe = subscribe(
    APP_VERSION_PATH,
    (remoteVersion) => {
      if (stopped) return;
      if (firstSnapshot) {
        firstSnapshot = false;
        if (firstVisit) return;
      }
      if (compareAppVersions(remoteVersion, currentVersion) !== 1) return;
      if (alreadyRequestedVersion === remoteVersion || safeGet(sessionStorage, RELOAD_ATTEMPT_KEY) === remoteVersion) {
        return;
      }

      safeSet(sessionStorage, RELOAD_ATTEMPT_KEY, remoteVersion);
      reload(remoteVersion);
    },
    onError,
  );

  return () => {
    if (stopped) return;
    stopped = true;
    unsubscribe();
  };
}
