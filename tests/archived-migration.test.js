import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

globalThis.localStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const mockGet = vi.fn();
const mockSet = vi.fn(() => Promise.resolve());
const mockRemove = vi.fn(() => Promise.resolve());
const mockUpdate = vi.fn(() => Promise.resolve());
const mockRef = vi.fn((db, path) => path);

vi.mock('firebase/database', () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
  remove: (...args) => mockRemove(...args),
  update: (...args) => mockUpdate(...args),
  ref: (...args) => mockRef(...args),
  onValue: vi.fn(),
  getDatabase: () => 'mockDb',
}));

vi.mock('@/firebase', () => ({
  database: 'mockDatabase',
}));

vi.mock('@/services/db', () => ({
  userMapService: {
    getAll: vi.fn(),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
  },
  collaboratorService: {
    findUserByEmail: vi.fn(),
    add: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/i18n', () => ({
  default: { global: { t: (key) => key } },
}));

vi.mock('@/helpers', () => ({
  tournamentNames: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
}));

import { useMainStore } from '@/stores/main';
import { userMapService } from '@/services/db';

function makeSnapshot(val) {
  return { exists: () => val !== null, val: () => val };
}

describe('fetchSavedTournaments - saved/ to tournaments/ migration', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    store.user = { uid: 'user1', email: 'test@example.com' };
    store.userTournamentMap = {
      t1: { status: 'archived', role: 'owner', name: 'Tournament 1' },
      t2: { status: 'archived', role: 'owner', name: 'Tournament 2' },
    };
    vi.clearAllMocks();
  });

  it('loads tournaments from tournaments/ path when data is valid', async () => {
    const tournamentData = { name: 'Tournament 1', teams: [{ title: 'A' }], games: [] };
    mockGet.mockImplementation((path) => {
      if (path === 'user1/tournaments/t1') return Promise.resolve(makeSnapshot(tournamentData));
      if (path === 'user1/tournaments/t2') return Promise.resolve(makeSnapshot(tournamentData));
      return Promise.resolve(makeSnapshot(null));
    });

    await store.fetchSavedTournaments();

    expect(store.savedTournaments.t1).toMatchObject(tournamentData);
    expect(store.savedTournaments.t1).toMatchObject({ id: 't1', activeGroup: 'A', preferences: { maxScore: 13 } });
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('loads archived admin tournaments from the owner path', async () => {
    const sharedTournament = { name: 'Shared Tournament', teams: [{ title: 'A' }], games: [] };
    store.userTournamentMap = {
      shared1: {
        status: 'archived',
        role: 'admin',
        ownerUid: 'owner1',
        name: 'Shared Tournament',
      },
    };
    mockGet.mockImplementation((path) => {
      if (path === 'owner1/tournaments/shared1') return Promise.resolve(makeSnapshot(sharedTournament));
      return Promise.resolve(makeSnapshot(null));
    });

    await store.fetchSavedTournaments();

    expect(mockGet).toHaveBeenCalledWith('owner1/tournaments/shared1');
    expect(store.savedTournaments.shared1).toMatchObject(sharedTournament);
    expect(store.savedTournaments.shared1).toMatchObject({
      id: 'shared1',
      _ownerUid: 'owner1',
      preferences: { maxScore: 13 },
    });
    expect(store.savedTournamentIds).toEqual(['shared1']);
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('migrates a legacy active admin tournament to the archive when it is finished', async () => {
    const sharedTournament = {
      name: 'Finished Shared Tournament',
      tournamentIsFinished: true,
      teams: [{ title: 'A' }],
      games: [],
    };
    store.userTournamentMap = {
      shared1: {
        status: 'active',
        role: 'admin',
        ownerUid: 'owner1',
        name: 'Finished Shared Tournament',
      },
    };
    mockGet.mockImplementation((path) => {
      if (path === 'owner1/tournaments/shared1') return Promise.resolve(makeSnapshot(sharedTournament));
      return Promise.resolve(makeSnapshot(null));
    });

    await store.fetchSavedTournaments();

    expect(userMapService.update).toHaveBeenCalledWith('user1', 'shared1', {
      status: 'archived',
      archiveStatusVersion: 1,
    });
    expect(store.userTournamentMap.shared1.status).toBe('archived');
    expect(store.savedTournaments.shared1).toMatchObject(sharedTournament);
  });

  it('does not archive an unfinished legacy admin tournament', async () => {
    const sharedTournament = {
      name: 'Active Shared Tournament',
      tournamentIsFinished: false,
      teams: [{ title: 'A' }],
      games: [],
    };
    store.userTournamentMap = {
      shared1: {
        status: 'active',
        role: 'admin',
        ownerUid: 'owner1',
        name: 'Active Shared Tournament',
      },
    };
    mockGet.mockImplementation((path) => {
      if (path === 'owner1/tournaments/shared1') return Promise.resolve(makeSnapshot(sharedTournament));
      return Promise.resolve(makeSnapshot(null));
    });

    await store.fetchSavedTournaments();

    expect(userMapService.update).not.toHaveBeenCalled();
    expect(store.userTournamentMap.shared1.status).toBe('active');
    expect(store.savedTournaments).toEqual({});
  });

  it('does not include archived scorer tournaments', async () => {
    store.userTournamentMap = {
      shared1: {
        status: 'archived',
        role: 'scorer',
        ownerUid: 'owner1',
        name: 'Shared Tournament',
      },
    };

    await store.fetchSavedTournaments();

    expect(store.savedTournaments).toEqual({});
    expect(store.savedTournamentIds).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('migrates from saved/ when tournaments/ has no teams', async () => {
    const realData = { name: 'Real Tournament', teams: [{ title: 'A' }], games: [] };
    const phantomData = { portalIdTournament: '725' };

    mockGet.mockImplementation((path) => {
      if (path === 'user1/tournaments/t1') return Promise.resolve(makeSnapshot(phantomData));
      if (path === 'user1/saved/t1') return Promise.resolve(makeSnapshot(realData));
      if (path === 'user1/tournaments/t2') return Promise.resolve(makeSnapshot(realData));
      return Promise.resolve(makeSnapshot(null));
    });

    await store.fetchSavedTournaments();

    expect(mockUpdate).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        'user1/tournaments/t1': realData,
        'publicTournaments/user1/t1/complete': true,
        'publicTournaments/user1/t1/record': expect.any(Object),
      }),
    );
    expect(mockRemove).toHaveBeenCalledWith('user1/saved/t1');
    expect(store.savedTournaments.t1).toMatchObject(realData);
  });

  it('migrates from saved/ when tournaments/ does not exist', async () => {
    const savedData = { name: 'Old Tournament', teams: [{ title: 'B' }], games: [] };

    mockGet.mockImplementation((path) => {
      if (path === 'user1/tournaments/t1') return Promise.resolve(makeSnapshot(null));
      if (path === 'user1/saved/t1') return Promise.resolve(makeSnapshot(savedData));
      if (path === 'user1/tournaments/t2') return Promise.resolve(makeSnapshot(null));
      if (path === 'user1/saved/t2') return Promise.resolve(makeSnapshot(null));
      return Promise.resolve(makeSnapshot(null));
    });

    await store.fetchSavedTournaments();

    expect(mockUpdate).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        'user1/tournaments/t1': savedData,
        'publicTournaments/user1/t1/complete': true,
        'publicTournaments/user1/t1/record': expect.any(Object),
      }),
    );
    expect(mockRemove).toHaveBeenCalledWith('user1/saved/t1');
    expect(store.savedTournaments.t1).toMatchObject(savedData);
  });

  it('uses migrated data directly without re-reading', async () => {
    const savedData = { name: 'Migrated', teams: [{ title: 'C' }], system: 'swiss' };

    mockGet.mockImplementation((path) => {
      if (path === 'user1/tournaments/t1') return Promise.resolve(makeSnapshot(null));
      if (path === 'user1/saved/t1') return Promise.resolve(makeSnapshot(savedData));
      if (path === 'user1/tournaments/t2') return Promise.resolve(makeSnapshot(null));
      if (path === 'user1/saved/t2') return Promise.resolve(makeSnapshot(null));
      return Promise.resolve(makeSnapshot(null));
    });

    await store.fetchSavedTournaments();

    const getCallsForT1Tournaments = mockGet.mock.calls.filter((c) => c[0] === 'user1/tournaments/t1');
    expect(getCallsForT1Tournaments).toHaveLength(1);
  });

  it('does not migrate when both paths are empty', async () => {
    mockGet.mockResolvedValue(makeSnapshot(null));

    await store.fetchSavedTournaments();

    expect(mockSet).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
    expect(store.savedTournaments).toEqual({});
  });

  it('handles tournament with main wrapper (multi-stage)', async () => {
    const mainData = { main: { name: 'Multi Stage', teams: [{ title: 'D' }] } };

    mockGet.mockImplementation((path) => {
      if (path === 'user1/tournaments/t1') return Promise.resolve(makeSnapshot(null));
      if (path === 'user1/saved/t1') return Promise.resolve(makeSnapshot(mainData));
      if (path === 'user1/tournaments/t2') return Promise.resolve(makeSnapshot(null));
      if (path === 'user1/saved/t2') return Promise.resolve(makeSnapshot(null));
      return Promise.resolve(makeSnapshot(null));
    });

    await store.fetchSavedTournaments();

    expect(mockUpdate).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        'user1/tournaments/t1': mainData,
        'publicTournaments/user1/t1/complete': true,
        'publicTournaments/user1/t1/record': expect.any(Object),
      }),
    );
    expect(store.savedTournaments.t1).toMatchObject(mainData);
    expect(store.savedTournaments.t1.main).toMatchObject({ teams: [{ title: 'D' }], games: [], preferences: {} });
  });

  it('sets empty savedTournaments when no archived ids exist', async () => {
    store.userTournamentMap = {
      t1: { status: 'active', role: 'owner', name: 'Active' },
    };

    await store.fetchSavedTournaments();

    expect(store.savedTournaments).toEqual({});
    expect(store.savedTournamentIds).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
