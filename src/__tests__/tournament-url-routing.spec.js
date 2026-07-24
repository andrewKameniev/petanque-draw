import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

globalThis.localStorage = {
  _store: {},
  getItem(key) {
    return this._store[key] ?? null;
  },
  setItem(key, val) {
    this._store[key] = String(val);
  },
  removeItem(key) {
    delete this._store[key];
  },
  clear() {
    this._store = {};
  },
};

vi.mock('@/firebase', () => ({ database: {} }));
vi.mock('@/services/db', () => ({
  userMapService: { set: vi.fn(), update: vi.fn(), remove: vi.fn(), getAll: vi.fn() },
  collaboratorService: { add: vi.fn(), remove: vi.fn(), findUserByEmail: vi.fn() },
}));

const mockGet = vi.fn(() => Promise.resolve({ exists: () => false }));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(),
  ref: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
  get: mockGet,
  remove: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  onValue: vi.fn(),
}));

const { useMainStore } = await import('../stores/main');

describe('Tournament URL routing (?t= query param)', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    store = useMainStore();
    store.user = { uid: 'test-uid', email: 'test@test.com' };
  });

  describe('setTournaments uses routeQueryT over localStorage', () => {
    it('activates tournament from routeQueryT over localStorage', () => {
      localStorage.setItem('petanqueDrawPinned', 'local-tournament');

      const tournaments = {
        'url-tournament': {
          id: 'url-tournament',
          name: 'URL',
          main: { teams: [], games: [], system: 'swiss', preferences: {} },
        },
        'local-tournament': {
          id: 'local-tournament',
          name: 'Local',
          main: { teams: [], games: [], system: 'swiss', preferences: {} },
        },
      };
      store.setTournaments(tournaments, { routeQueryT: 'url-tournament' });

      expect(store.currentTournamentIndex).toBe('url-tournament');
    });

    it('falls back to localStorage when no routeQueryT', () => {
      localStorage.setItem('petanqueDrawPinned', 'pinned-id');

      const tournaments = {
        'pinned-id': {
          id: 'pinned-id',
          name: 'Pinned',
          main: { teams: [], games: [], system: 'swiss', preferences: {} },
        },
        other: { id: 'other', name: 'Other', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
      };
      store.setTournaments(tournaments);

      expect(store.currentTournamentIndex).toBe('pinned-id');
    });

    it('falls back to last tournament when neither routeQueryT nor localStorage match', () => {
      const tournaments = {
        first: { id: 'first', name: 'First', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
        last: { id: 'last', name: 'Last', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
      };
      store.setTournaments(tournaments);

      expect(store.currentTournamentIndex).toBe('last');
    });

    it('loads shared tournament when routeQueryT matches userTournamentMap', () => {
      store.userTournamentMap = {
        'shared-123': { role: 'scorer', ownerUid: 'owner-abc', status: 'active', name: 'Shared' },
      };

      mockGet.mockResolvedValueOnce({
        exists: () => true,
        val: () => ({ name: 'Shared', main: { teams: [], games: [], system: 'swiss', preferences: {} } }),
      });

      const tournaments = {
        mine: { id: 'mine', name: 'Mine', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
      };
      store.setTournaments(tournaments, { routeQueryT: 'shared-123' });

      expect(store.currentTournamentIndex).not.toBe('mine');
    });

    it('ignores routeQueryT when it does not match any tournament or map entry', () => {
      const tournaments = {
        real: { id: 'real', name: 'Real', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
      };
      store.setTournaments(tournaments, { routeQueryT: 'nonexistent' });

      expect(store.currentTournamentIndex).toBe('real');
    });
  });

  describe('tab isolation', () => {
    it('two stores with different routeQueryT activate different tournaments', () => {
      const pinia1 = createPinia();
      const pinia2 = createPinia();

      setActivePinia(pinia1);
      const store1 = useMainStore();
      store1.user = { uid: 'test-uid', email: 'test@test.com' };

      setActivePinia(pinia2);
      const store2 = useMainStore();
      store2.user = { uid: 'test-uid', email: 'test@test.com' };

      const tournamentsData = {
        'tournament-A': {
          id: 'tournament-A',
          name: 'Women',
          main: { teams: [], games: [], system: 'swiss', preferences: {} },
        },
        'tournament-B': {
          id: 'tournament-B',
          name: 'Men',
          main: { teams: [], games: [], system: 'swiss', preferences: {} },
        },
      };

      store1.setTournaments({ ...tournamentsData }, { routeQueryT: 'tournament-A' });
      store2.setTournaments({ ...tournamentsData }, { routeQueryT: 'tournament-B' });

      expect(store1.currentTournamentIndex).toBe('tournament-A');
      expect(store2.currentTournamentIndex).toBe('tournament-B');
    });

    it('localStorage pinned does not affect store when routeQueryT is provided', () => {
      localStorage.setItem('petanqueDrawPinned', 'wrong-tournament');

      const tournaments = {
        'wrong-tournament': {
          id: 'wrong-tournament',
          name: 'Wrong',
          main: { teams: [], games: [], system: 'swiss', preferences: {} },
        },
        'correct-tournament': {
          id: 'correct-tournament',
          name: 'Correct',
          main: { teams: [], games: [], system: 'swiss', preferences: {} },
        },
      };
      store.setTournaments(tournaments, { routeQueryT: 'correct-tournament' });

      expect(store.currentTournamentIndex).toBe('correct-tournament');
    });
  });

  describe('setActiveTournament', () => {
    it('sets currentTournamentIndex', () => {
      store.tournaments = { 123: { id: '123', main: { teams: [], games: [], system: 'swiss', preferences: {} } } };
      store.setActiveTournament('123');
      expect(store.currentTournamentIndex).toBe('123');
    });
  });

  describe('getTournaments passes routeQueryT through', () => {
    it('accepts routeQueryT option', async () => {
      const { get } = await import('firebase/database');
      const { userMapService } = await import('@/services/db');

      userMapService.getAll.mockResolvedValueOnce({
        exists: () => true,
        val: () => ({
          t1: { status: 'active', role: 'owner', name: 'T1' },
          t2: { status: 'active', role: 'owner', name: 'T2' },
        }),
      });
      get.mockResolvedValueOnce({
        exists: () => true,
        val: () => ({
          t1: { id: 't1', name: 'T1', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
          t2: { id: 't2', name: 'T2', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
        }),
      });

      await store.getTournaments({ routeQueryT: 't1' });

      expect(store.currentTournamentIndex).toBe('t1');
    });
  });
});
