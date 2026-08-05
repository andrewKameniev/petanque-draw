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

import { SUPER_ADMIN_EMAIL, useMainStore } from '@/stores/main';
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
              t1: { name: 'Active', tournamentIsFinished: false },
              t2: { name: 'Finished', tournamentIsFinished: true },
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

    it('propagates an owner archive to admin collaborators only', async () => {
      store.tournaments[123].collaborators = {
        admin1: { role: 'admin', email: 'admin@test.com' },
        scorer1: { role: 'scorer', email: 'scorer@test.com' },
      };

      await store.addToSaved({ id: 123, collaborators: store.tournaments[123].collaborators });

      expect(userMapService.update).toHaveBeenCalledWith('admin1', '123', {
        status: 'archived',
        archiveStatusVersion: 1,
      });
      expect(userMapService.update).not.toHaveBeenCalledWith('scorer1', '123', expect.anything());
    });
  });

  describe('loadSharedTournament', () => {
    it('uses the canonical normalizer while retaining owner and root metadata', async () => {
      const snapshotRecord = {
        name: 'Shared wrapper',
        date: '2026-08-05',
        tournamentMessage: 'Owner message',
        main: { system: 'swiss', preferences: { maxScore: 9 } },
      };
      const original = JSON.parse(JSON.stringify(snapshotRecord));
      mockGet.mockResolvedValue(makeSnapshot(snapshotRecord));

      await store.loadSharedTournament('shared1', 'owner1');

      expect(snapshotRecord).toEqual(original);
      expect(store.tournaments.shared1).toMatchObject({
        id: 'shared1',
        _ownerUid: 'owner1',
        name: 'Shared wrapper',
        date: '2026-08-05',
        tournamentMessage: 'Owner message',
        main: { teams: [], games: [], preferences: { maxScore: 9, fieldsStart: 1 } },
      });
    });
  });

  describe('removeSavedTournament', () => {
    it('returns a shared admin tournament to the active list without deleting owner data', async () => {
      store.userTournamentMap = {
        shared1: {
          status: 'archived',
          role: 'admin',
          ownerUid: 'owner1',
          name: 'Shared Tournament',
        },
      };
      store.savedTournaments = { shared1: { name: 'Shared Tournament', teams: [] } };
      store.savedTournamentIds = ['shared1'];

      await store.removeSavedTournament('shared1');

      expect(userMapService.update).toHaveBeenCalledWith('user1', 'shared1', {
        status: 'active',
        archiveStatusVersion: 1,
      });
      expect(mockRemove).not.toHaveBeenCalled();
      expect(store.userTournamentMap.shared1.status).toBe('active');
      expect(store.savedTournaments.shared1).toBeUndefined();
    });
  });

  describe('unarchiveTournament', () => {
    it('makes an owner tournament active and restores it to the active store', async () => {
      store.userTournamentMap = {
        own1: { status: 'archived', role: 'owner', name: 'My Tournament' },
      };
      store.savedTournaments = {
        own1: {
          name: 'My Tournament',
          teams: [{ title: 'A' }],
          games: [],
          collaborators: {
            admin1: { role: 'admin', email: 'admin@test.com' },
            scorer1: { role: 'scorer', email: 'scorer@test.com' },
          },
        },
      };
      store.savedTournamentIds = ['own1'];
      const archivedSource = store.savedTournaments.own1;
      const archivedSnapshot = JSON.parse(JSON.stringify(archivedSource));

      const restored = await store.unarchiveTournament('own1');

      expect(restored).toBe(true);
      expect(userMapService.update).toHaveBeenCalledWith('user1', 'own1', {
        status: 'active',
        archiveStatusVersion: 1,
      });
      expect(userMapService.update).toHaveBeenCalledWith('admin1', 'own1', {
        status: 'active',
        archiveStatusVersion: 1,
      });
      expect(userMapService.update).not.toHaveBeenCalledWith('scorer1', 'own1', expect.anything());
      expect(store.userTournamentMap.own1.status).toBe('active');
      expect(store.tournaments.own1.name).toBe('My Tournament');
      expect(store.tournaments.own1).toMatchObject({
        id: 'own1',
        activeGroup: 'A',
        preferences: { maxScore: 13 },
      });
      expect(archivedSource).toEqual(archivedSnapshot);
      expect(store.savedTournaments.own1).toBeUndefined();
      expect(store.savedTournamentIds).toEqual([]);
    });

    it('makes an admin tournament active without copying owner data into the local owner list', async () => {
      store.userTournamentMap = {
        shared1: {
          status: 'archived',
          role: 'admin',
          ownerUid: 'owner1',
          name: 'Shared Tournament',
        },
      };
      store.savedTournaments = {
        shared1: { name: 'Shared Tournament', teams: [{ title: 'A' }], games: [] },
      };
      store.savedTournamentIds = ['shared1'];

      const restored = await store.unarchiveTournament('shared1');

      expect(restored).toBe(true);
      expect(store.userTournamentMap.shared1).toMatchObject({
        status: 'active',
        archiveStatusVersion: 1,
      });
      expect(store.tournaments.shared1).toBeUndefined();
      expect(store.savedTournaments.shared1).toBeUndefined();
    });
  });

  describe('renameSavedTournament', () => {
    it('updates an archived admin tournament at the owner path', async () => {
      store.userTournamentMap = {
        shared1: {
          status: 'archived',
          role: 'admin',
          ownerUid: 'owner1',
          name: 'Shared Tournament',
        },
      };
      store.savedTournaments = { shared1: { name: 'Shared Tournament', teams: [] } };

      store.renameSavedTournament('shared1', 'Renamed Tournament', 'owner1');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockUpdate).toHaveBeenCalledWith('owner1/tournaments/shared1', { name: 'Renamed Tournament' });
      expect(userMapService.update).toHaveBeenCalledWith('user1', 'shared1', { name: 'Renamed Tournament' });
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
      expect(store.message).toMatchObject({
        type: 'error',
        text: 'messages.userNotFound',
      });
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
      expect(collaboratorService.add).toHaveBeenCalledWith('user1', 't1', 'user2', {
        role: 'scorer',
        email: 'friend@test.com',
      });
      expect(userMapService.set).toHaveBeenCalledWith('user2', 't1', {
        status: 'active',
        role: 'scorer',
        ownerUid: 'user1',
        name: 'Test',
        archiveStatusVersion: 1,
      });
      expect(store.currentTournament.collaborators).toEqual({ user2: { role: 'scorer', email: 'friend@test.com' } });
    });

    it('normalizes email addresses before looking up and saving a collaborator', async () => {
      collaboratorService.findUserByEmail.mockResolvedValue(makeSnapshot('user2'));

      await store.addCollaborator(' Friend@Test.COM ', 'scorer');

      expect(collaboratorService.findUserByEmail).toHaveBeenCalledWith('friend@test.com');
      expect(collaboratorService.add).toHaveBeenCalledWith('user1', 't1', 'user2', {
        role: 'scorer',
        email: 'friend@test.com',
      });
    });

    it('adds the configured super admin with the admin role', async () => {
      collaboratorService.findUserByEmail.mockResolvedValue(makeSnapshot('super-admin-uid'));

      await store.addCollaborator(SUPER_ADMIN_EMAIL, 'admin');

      expect(collaboratorService.findUserByEmail).toHaveBeenCalledWith('nemo15.alex@gmail.com');
      expect(collaboratorService.add).toHaveBeenCalledWith('user1', 't1', 'super-admin-uid', {
        role: 'admin',
        email: 'nemo15.alex@gmail.com',
      });
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
