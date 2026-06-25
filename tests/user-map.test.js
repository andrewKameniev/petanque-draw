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
const mockOnValue = vi.fn();

vi.mock('firebase/database', () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
  remove: (...args) => mockRemove(...args),
  update: (...args) => mockUpdate(...args),
  ref: (...args) => mockRef(...args),
  onValue: (...args) => mockOnValue(...args),
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
import { userMapService, collaboratorService } from '@/services/db';

function makeSnapshot(val) {
  return { exists: () => val !== null, val: () => val };
}

describe('User Tournament Map', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    store.user = { uid: 'user1', email: 'test@example.com' };
    vi.clearAllMocks();
  });

  describe('getTournaments - migration', () => {
    it('creates map from existing tournaments when no map exists', async () => {
      userMapService.getAll.mockResolvedValue(makeSnapshot(null));
      mockGet.mockImplementation((path) => {
        if (path.includes('/tournaments/')) {
          return Promise.resolve(
            makeSnapshot({
              't1': { name: 'Active', tournamentIsFinished: false },
              't2': { name: 'Finished', tournamentIsFinished: true },
            }),
          );
        }
        if (path.includes('/saved/')) {
          return Promise.resolve(makeSnapshot(null));
        }
        return Promise.resolve(makeSnapshot(null));
      });

      await store.getTournaments();

      expect(store.userTournamentMap).toEqual({
        t1: { status: 'active', role: 'owner', name: 'Active' },
        t2: { status: 'archived', role: 'owner', name: 'Finished' },
      });
      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ t1: expect.any(Object), t2: expect.any(Object) }),
      );
    });

    it('includes /saved/ data in migration', async () => {
      userMapService.getAll.mockResolvedValue(makeSnapshot(null));
      mockGet.mockImplementation((path) => {
        if (path.includes('/saved/')) {
          return Promise.resolve(makeSnapshot({ s1: { name: 'Old Archive' } }));
        }
        if (path.includes('/tournaments/')) {
          return Promise.resolve(makeSnapshot(null));
        }
        return Promise.resolve(makeSnapshot(null));
      });

      await store.getTournaments();

      expect(store.userTournamentMap.s1).toEqual({
        status: 'archived',
        role: 'owner',
        name: 'Old Archive',
      });
    });

    it('uses existing map without re-migrating', async () => {
      const existingMap = {
        t1: { status: 'active', role: 'owner', name: 'My Tournament' },
      };
      userMapService.getAll.mockResolvedValue(makeSnapshot(existingMap));
      mockGet.mockResolvedValue(
        makeSnapshot({ t1: { name: 'My Tournament', tournamentIsFinished: false, teams: [], games: [] } }),
      );

      await store.getTournaments();

      expect(store.userTournamentMap).toEqual(existingMap);
      expect(mockSet).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ t1: expect.any(Object) }));
    });

    it('filters only active own tournaments for loading', async () => {
      const map = {
        t1: { status: 'active', role: 'owner', name: 'Active' },
        t2: { status: 'archived', role: 'owner', name: 'Archived' },
        t3: { status: 'active', role: 'scorer', ownerUid: 'other', name: 'Shared' },
      };
      userMapService.getAll.mockResolvedValue(makeSnapshot(map));
      mockGet.mockResolvedValue(
        makeSnapshot({
          t1: { name: 'Active', teams: [], games: [] },
          t2: { name: 'Archived', teams: [], games: [] },
        }),
      );

      await store.getTournaments();

      expect(Object.keys(store.tournaments)).toEqual(['t1']);
      expect(store.savedTournamentIds).toEqual(['t2']);
    });
  });

  describe('addToSaved (archive)', () => {
    beforeEach(() => {
      store.userTournamentMap = { 123: { status: 'active', role: 'owner', name: 'Test' } };
      store.tournaments = { 123: { id: 123, name: 'Test', teams: [], games: [] } };
      store.currentTournamentIndex = 123;
      userMapService.update.mockResolvedValue();
    });

    it('changes status to archived in map', async () => {
      await store.addToSaved({ id: 123 });
      await new Promise((r) => setTimeout(r, 0));

      expect(userMapService.update).toHaveBeenCalledWith('user1', '123', { status: 'archived' });
    });

    it('removes tournament from active list', async () => {
      store.tournaments[456] = { id: 456, name: 'Other', teams: [], games: [] };
      store.userTournamentMap[456] = { status: 'active', role: 'owner', name: 'Other' };

      await store.addToSaved({ id: 123 });
      await new Promise((r) => setTimeout(r, 0));

      expect(store.tournaments[123]).toBeUndefined();
      expect(store.savedTournamentIds).toContain('123');
    });
  });

  describe('addCollaborator', () => {
    beforeEach(() => {
      store.tournaments = { t1: { id: 't1', name: 'Test', teams: [], games: [] } };
      store.currentTournamentIndex = 't1';
    });

    it('rejects if user not found', async () => {
      collaboratorService.findUserByEmail.mockResolvedValue(makeSnapshot(null));

      const result = await store.addCollaborator('nope@test.com', 'scorer');

      expect(result).toBe(false);
      expect(collaboratorService.add).not.toHaveBeenCalled();
    });

    it('rejects adding self', async () => {
      collaboratorService.findUserByEmail.mockResolvedValue(makeSnapshot('user1'));

      const result = await store.addCollaborator('test@example.com', 'scorer');

      expect(result).toBe(false);
      expect(collaboratorService.add).not.toHaveBeenCalled();
    });

    it('adds collaborator and updates maps', async () => {
      collaboratorService.findUserByEmail.mockResolvedValue(makeSnapshot('user2'));

      const result = await store.addCollaborator('friend@test.com', 'scorer');

      expect(result).toBe(true);
      expect(collaboratorService.add).toHaveBeenCalledWith('user1', 't1', 'user2', 'scorer');
      expect(userMapService.set).toHaveBeenCalledWith('user2', 't1', {
        status: 'active',
        role: 'scorer',
        ownerUid: 'user1',
        name: 'Test',
      });
      expect(store.currentTournament.collaborators).toEqual({ user2: 'scorer' });
    });
  });

  describe('_getTournamentOwnerUid', () => {
    it('returns user uid for own tournaments', () => {
      store.tournaments = { t1: { id: 't1', name: 'Mine' } };
      store.currentTournamentIndex = 't1';

      expect(store._getTournamentOwnerUid()).toBe('user1');
    });

    it('returns _ownerUid for shared tournaments', () => {
      store.tournaments = { t1: { id: 't1', name: 'Shared', _ownerUid: 'other123' } };
      store.currentTournamentIndex = 't1';

      expect(store._getTournamentOwnerUid()).toBe('other123');
    });
  });
});
