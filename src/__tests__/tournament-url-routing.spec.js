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

function createMockRouter(query = {}) {
  const currentRoute = { value: { path: '/', query } };
  return {
    currentRoute,
    replace: vi.fn((to) => {
      if (typeof to === 'object') {
        currentRoute.value.path = to.path || '/';
        currentRoute.value.query = to.query || {};
      }
    }),
  };
}

describe('Tournament URL routing (?t= query param)', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    store = useMainStore();
    store.user = { uid: 'test-uid', email: 'test@test.com' };
  });

  describe('setActiveTournament updates URL', () => {
    it('pushes ?t= to router when on / route', () => {
      const router = createMockRouter();
      store.setRouter(router);
      store.addTournament();
      const id = store.currentTournamentIndex;

      expect(router.replace).toHaveBeenCalledWith({ path: '/', query: { t: id } });
    });

    it('does not push when not on / route', () => {
      const router = createMockRouter();
      router.currentRoute.value.path = '/stats';
      store.setRouter(router);
      store.addTournament();

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('does not push duplicate when ID matches current query', () => {
      const router = createMockRouter({ t: '123' });
      store.setRouter(router);
      store.tournaments = { 123: { id: '123', main: { teams: [], games: [], system: 'swiss', preferences: {} } } };
      store.setActiveTournament('123');

      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('setTournaments reads ?t= from URL first', () => {
    it('activates tournament from route query over localStorage', () => {
      const router = createMockRouter({ t: 'url-tournament' });
      store.setRouter(router);
      localStorage.setItem('petanqueDrawPinned', 'local-tournament');

      store.tournaments = {};
      const tournaments = {
        'url-tournament': { id: 'url-tournament', name: 'URL', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
        'local-tournament': { id: 'local-tournament', name: 'Local', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
      };
      store.setTournaments(tournaments);

      expect(store.currentTournamentIndex).toBe('url-tournament');
    });

    it('falls back to localStorage when no ?t= in route', () => {
      const router = createMockRouter({});
      store.setRouter(router);
      localStorage.setItem('petanqueDrawPinned', 'pinned-id');

      const tournaments = {
        'pinned-id': { id: 'pinned-id', name: 'Pinned', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
        other: { id: 'other', name: 'Other', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
      };
      store.setTournaments(tournaments);

      expect(store.currentTournamentIndex).toBe('pinned-id');
    });

    it('falls back to last tournament when neither URL nor localStorage match', () => {
      const router = createMockRouter({});
      store.setRouter(router);

      const tournaments = {
        first: { id: 'first', name: 'First', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
        last: { id: 'last', name: 'Last', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
      };
      store.setTournaments(tournaments);

      expect(store.currentTournamentIndex).toBe('last');
    });

    it('loads shared tournament when ?t= matches userTournamentMap', () => {
      const router = createMockRouter({ t: 'shared-123' });
      store.setRouter(router);
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
      store.setTournaments(tournaments);

      expect(store.currentTournamentIndex).not.toBe('mine');
    });
  });

  describe('tab isolation', () => {
    it('two stores with different routers activate different tournaments', () => {
      const pinia1 = createPinia();
      const pinia2 = createPinia();

      setActivePinia(pinia1);
      const store1 = useMainStore();
      store1.user = { uid: 'test-uid', email: 'test@test.com' };
      const router1 = createMockRouter({ t: 'tournament-A' });
      store1.setRouter(router1);

      setActivePinia(pinia2);
      const store2 = useMainStore();
      store2.user = { uid: 'test-uid', email: 'test@test.com' };
      const router2 = createMockRouter({ t: 'tournament-B' });
      store2.setRouter(router2);

      const tournamentsData = {
        'tournament-A': { id: 'tournament-A', name: 'Women', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
        'tournament-B': { id: 'tournament-B', name: 'Men', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
      };

      store1.setTournaments({ ...tournamentsData });
      store2.setTournaments({ ...tournamentsData });

      expect(store1.currentTournamentIndex).toBe('tournament-A');
      expect(store2.currentTournamentIndex).toBe('tournament-B');
    });

    it('localStorage pinned does not affect tab with ?t= in URL', () => {
      localStorage.setItem('petanqueDrawPinned', 'wrong-tournament');

      const router = createMockRouter({ t: 'correct-tournament' });
      store.setRouter(router);

      const tournaments = {
        'wrong-tournament': { id: 'wrong-tournament', name: 'Wrong', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
        'correct-tournament': { id: 'correct-tournament', name: 'Correct', main: { teams: [], games: [], system: 'swiss', preferences: {} } },
      };
      store.setTournaments(tournaments);

      expect(store.currentTournamentIndex).toBe('correct-tournament');
    });
  });

  describe('_getRouteQueryT', () => {
    it('returns null when no router set', () => {
      expect(store._getRouteQueryT()).toBeNull();
    });

    it('returns null when no ?t= param', () => {
      store.setRouter(createMockRouter({}));
      expect(store._getRouteQueryT()).toBeNull();
    });

    it('returns tournament id from ?t= param', () => {
      store.setRouter(createMockRouter({ t: '12345' }));
      expect(store._getRouteQueryT()).toBe('12345');
    });
  });

  describe('_updateRouteQuery', () => {
    it('calls router.replace with tournament id', () => {
      const router = createMockRouter({});
      store.setRouter(router);
      store._updateRouteQuery('99999');

      expect(router.replace).toHaveBeenCalledWith({ path: '/', query: { t: '99999' } });
    });

    it('skips replace when already the same', () => {
      const router = createMockRouter({ t: '99999' });
      store.setRouter(router);
      store._updateRouteQuery('99999');

      expect(router.replace).not.toHaveBeenCalled();
    });

    it('skips replace when not on / path', () => {
      const router = createMockRouter({});
      router.currentRoute.value.path = '/training';
      store.setRouter(router);
      store._updateRouteQuery('99999');

      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});
