import { describe, expect, it, vi } from 'vitest';
import {
  APP_VERSION_PATH,
  APP_VERSION_STORAGE_KEY,
  compareAppVersions,
  startAppVersionMonitor,
} from '../src/services/app-version';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
  };
}

function monitor(options = {}) {
  let receive;
  let onError;
  const unsubscribe = vi.fn();
  const subscribe = vi.fn((path, callback, error) => {
    receive = callback;
    onError = error;
    return unsubscribe;
  });
  const reload = vi.fn();
  const storage = memoryStorage(options.storedVersion ? { [APP_VERSION_STORAGE_KEY]: options.storedVersion } : {});
  const sessionStorage = memoryStorage();
  const stop = startAppVersionMonitor({
    database: {},
    currentVersion: '1.36.1',
    storage,
    sessionStorage,
    reload,
    subscribe,
    onError: options.onError,
    alreadyRequestedVersion: options.alreadyRequestedVersion,
  });
  return { receive, onError, unsubscribe, subscribe, reload, storage, sessionStorage, stop };
}

describe('app version monitor', () => {
  it('compares numeric version segments and ignores malformed versions', () => {
    expect(compareAppVersions('1.36.10', '1.36.9')).toBe(1);
    expect(compareAppVersions('1.37.0', '1.36.99')).toBe(1);
    expect(compareAppVersions('1.36.1', '1.36.1')).toBe(0);
    expect(compareAppVersions('1.36.0', '1.36.1')).toBe(-1);
    expect(compareAppVersions('invalid', '1.36.1')).toBeNull();
  });

  it('records a first visit without reloading for the initial Firebase snapshot', () => {
    const state = monitor();
    expect(state.subscribe).toHaveBeenCalledWith(APP_VERSION_PATH, expect.any(Function), expect.any(Function));
    expect(state.storage.setItem).toHaveBeenCalledWith(APP_VERSION_STORAGE_KEY, '1.36.1');

    state.receive('1.37.0');
    expect(state.reload).not.toHaveBeenCalled();
    state.receive('1.37.1');
    expect(state.reload).toHaveBeenCalledOnce();
    expect(state.reload).toHaveBeenCalledWith('1.37.1');
  });

  it('reloads a returning visitor once when Firebase publishes a newer version', () => {
    const state = monitor({ storedVersion: '1.36.0' });
    state.receive('1.36.1');
    state.receive('1.37.0');
    state.receive('1.37.0');
    state.receive('1.36.0');
    state.receive('bad-version');

    expect(state.reload).toHaveBeenCalledOnce();
    expect(state.reload).toHaveBeenCalledWith('1.37.0');
  });

  it('does not loop when the old bundle is served again after a reload', () => {
    const state = monitor({ storedVersion: '1.36.0', alreadyRequestedVersion: '1.37.0' });
    state.receive('1.37.0');
    expect(state.reload).not.toHaveBeenCalled();
  });

  it('disposes the Firebase listener once and ignores late snapshots', () => {
    const onError = vi.fn();
    const state = monitor({ storedVersion: '1.36.0', onError });
    state.onError(new Error('permission denied'));
    expect(onError).toHaveBeenCalledOnce();
    state.stop();
    state.stop();
    state.receive('1.37.0');
    expect(state.unsubscribe).toHaveBeenCalledOnce();
    expect(state.reload).not.toHaveBeenCalled();
  });

  it('works when browser storage is blocked', () => {
    let receive;
    const reload = vi.fn();
    const blockedStorage = {
      getItem() {
        throw new Error('storage blocked');
      },
      setItem() {
        throw new Error('storage blocked');
      },
    };
    startAppVersionMonitor({
      database: {},
      currentVersion: '1.36.1',
      storage: blockedStorage,
      sessionStorage: blockedStorage,
      reload,
      subscribe: (_path, callback) => {
        receive = callback;
        return vi.fn();
      },
    });
    receive('1.37.0');
    receive('1.37.1');
    expect(reload).toHaveBeenCalledOnce();
  });
});
