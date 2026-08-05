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
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(),
  ref: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(() => Promise.resolve({ exists: () => false })),
  remove: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  onValue: vi.fn(),
}));

const { useMainStore } = await import('../stores/main');

describe('Tournament B store actions (new format)', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    store.user = { uid: 'test-uid', email: 'test@test.com' };
    store.addTournament();
  });

  describe('new format structure', () => {
    it('addTournament creates wrapper with main', () => {
      const t = store.currentTournament;
      expect(t.main).toBeDefined();
      expect(t.main.teams).toEqual([]);
      expect(t.main.games).toEqual([]);
      expect(t.main.system).toBe('swiss');
      expect(t.activeGroup).toBe('A');
      expect(t.tournamentB).toBeNull();
    });

    it('isNewFormat returns true for new tournaments', () => {
      expect(store.isNewFormat).toBe(true);
    });

    it('activeTournament returns main by default', () => {
      expect(store.activeTournament).toBe(store.currentTournament.main);
    });
  });

  describe('_getTarget (new format)', () => {
    it('returns main with prefix when activeGroup is A', () => {
      const { data, prefix } = store._getTarget();
      expect(data).toBe(store.currentTournament.main);
      expect(prefix).toBe('main/');
    });

    it('returns tournamentB with prefix when activeGroup is B', () => {
      store.initTournamentB([{ title: 'B1' }]);
      store.setActiveGroup('B');
      const { data, prefix } = store._getTarget();
      expect(data).toBe(store.currentTournament.tournamentB);
      expect(prefix).toBe('tournamentB/');
    });
  });

  describe('setActiveGroup', () => {
    it('sets activeGroup on the tournament', () => {
      store.setActiveGroup('B');
      expect(store.currentTournament.activeGroup).toBe('B');
    });

    it('switches back to A', () => {
      store.setActiveGroup('B');
      store.setActiveGroup('A');
      expect(store.currentTournament.activeGroup).toBe('A');
    });
  });

  describe('root metadata sync', () => {
    it('captures the emitted organizer message instead of a later stale snapshot value', () => {
      vi.useFakeTimers();
      const syncPath = vi.spyOn(store, '_syncPath').mockImplementation(() => undefined);

      store.syncTournamentMessage('Updated message');
      store.currentTournament.tournamentMessage = 'Stale subscription value';
      vi.advanceTimersByTime(300);

      expect(syncPath).toHaveBeenCalledWith('tournamentMessage', 'Updated message');
      vi.useRealTimers();
    });
  });

  describe('initTournamentB', () => {
    it('creates tournamentB with given teams and system', () => {
      const teams = [
        { title: 'Team_1', wins: 5, buhgolts: 3 },
        { title: 'Team_2', wins: 3, buhgolts: 2 },
      ];
      store.initTournamentB(teams);
      const tB = store.currentTournament.tournamentB;
      expect(tB).not.toBeNull();
      expect(tB.isTournamentB).toBe(true);
      expect(tB.teams).toHaveLength(2);
      expect(tB.teams[0].title).toBe('Team_1');
      expect(tB.system).toBe('swiss');
      expect(tB.games).toEqual([]);
      expect(tB.preferences).toBeDefined();
    });

    it('creates tournamentB with playoff system', () => {
      store.initTournamentB([{ title: 'T1' }], 'playoff');
      expect(store.currentTournament.tournamentB.system).toBe('playoff');
    });

    it('sets activeGroup to A after init', () => {
      store.initTournamentB([{ title: 'T1' }]);
      expect(store.currentTournament.activeGroup).toBe('A');
    });

    it('clones teams', () => {
      const teams = [{ title: 'T1', wins: 2 }];
      store.initTournamentB(teams);
      teams[0].wins = 99;
      expect(store.currentTournament.tournamentB.teams[0].wins).toBe(2);
    });

    it('activeTournament returns tournamentB when group B active', () => {
      store.initTournamentB([{ title: 'T1' }]);
      store.setActiveGroup('B');
      expect(store.activeTournament).toBe(store.currentTournament.tournamentB);
    });
  });

  describe('addTournamentBTeams', () => {
    beforeEach(() => {
      store.initTournamentB([{ title: 'Existing', wins: 0 }]);
    });

    it('adds new teams to tournamentB', () => {
      store.addTournamentBTeams([{ title: 'NewTeam', wins: 0 }]);
      expect(store.currentTournament.tournamentB.teams).toHaveLength(2);
      expect(store.currentTournament.tournamentB.teams[1].title).toBe('NewTeam');
    });

    it('does not add duplicates', () => {
      store.addTournamentBTeams([{ title: 'Existing', wins: 5 }]);
      expect(store.currentTournament.tournamentB.teams).toHaveLength(1);
    });
  });

  describe('toggleWithdrawn', () => {
    beforeEach(() => {
      store.currentTournament.main.teams = [{ title: 'Team_1', withdrawn: false }, { title: 'Team_2' }];
    });

    it('sets withdrawn to true', () => {
      store.toggleWithdrawn('Team_1');
      expect(store.currentTournament.main.teams[0].withdrawn).toBe(true);
    });

    it('toggles withdrawn back to false', () => {
      store.toggleWithdrawn('Team_1');
      store.toggleWithdrawn('Team_1');
      expect(store.currentTournament.main.teams[0].withdrawn).toBe(false);
    });
  });

  describe('setTournamentBEliminationRound', () => {
    beforeEach(() => {
      store.initTournamentB([{ title: 'T1' }, { title: 'T2' }, { title: 'T3' }, { title: 'T4' }]);
    });

    it('sets elimination round data', () => {
      const elimData = {
        games: [{ team_1: 'T3', team_2: 'T4', team_1_score: null, team_2_score: null }],
        qualifiedFrom: 1,
        bracketSize: 2,
        completed: false,
      };
      store.setTournamentBEliminationRound(elimData);
      expect(store.currentTournament.tournamentB.eliminationRound).toEqual(elimData);
    });
  });

  describe('completeTournamentBElimination', () => {
    beforeEach(() => {
      store.initTournamentB([{ title: 'T1' }, { title: 'T2' }, { title: 'T3' }, { title: 'T4' }]);
      store.setTournamentBEliminationRound({
        games: [{ team_1: 'T3', team_2: 'T4', team_1_score: 13, team_2_score: 5 }],
        qualifiedFrom: 1,
        bracketSize: 2,
        completed: false,
      });
    });

    it('marks elimination as completed', () => {
      store.completeTournamentBElimination();
      expect(store.currentTournament.tournamentB.eliminationRound.completed).toBe(true);
    });

    it('marks loser as eliminated', () => {
      store.completeTournamentBElimination();
      const t4 = store.currentTournament.tournamentB.teams.find((t) => t.title === 'T4');
      expect(t4.eliminated).toBe(true);
    });

    it('does not mark winner as eliminated', () => {
      store.completeTournamentBElimination();
      const t3 = store.currentTournament.tournamentB.teams.find((t) => t.title === 'T3');
      expect(t3.eliminated).toBeUndefined();
    });
  });

  describe('group-aware actions (new format)', () => {
    beforeEach(() => {
      store.initTournamentB([
        { title: 'B1', opponents: [], lanes: [] },
        { title: 'B2', opponents: [], lanes: [] },
      ]);
    });

    it('startRound sets roundIsActive on main by default', () => {
      store.setActiveGroup('A');
      store.startRound();
      expect(store.currentTournament.main.roundIsActive).toBe(true);
      expect(store.currentTournament.tournamentB.roundIsActive).toBe(false);
    });

    it('startRound sets roundIsActive on tournamentB when active', () => {
      store.setActiveGroup('B');
      store.startRound();
      expect(store.currentTournament.main.roundIsActive).toBeFalsy();
      expect(store.currentTournament.tournamentB.roundIsActive).toBe(true);
    });

    it('endRound affects the active group', () => {
      store.setActiveGroup('B');
      store.currentTournament.tournamentB.roundIsActive = true;
      store.endRound();
      expect(store.currentTournament.tournamentB.roundIsActive).toBe(false);
    });

    it('addRoundToGames adds to tournamentB when active', () => {
      store.setActiveGroup('B');
      const round = [{ team_1: 'B1', team_2: 'B2', lane: 1 }];
      store.addRoundToGames(round);
      expect(store.currentTournament.tournamentB.games).toHaveLength(1);
      expect(store.currentTournament.tournamentB.roundIsActive).toBe(true);
      expect(store.currentTournament.main.games).toEqual([]);
    });

    it('restoreRound removes from tournamentB when active', () => {
      store.setActiveGroup('B');
      store.currentTournament.tournamentB.games = [[{ team_1: 'B1', team_2: 'B2' }]];
      store.currentTournament.tournamentB.teams[0].opponents = ['B2'];
      store.currentTournament.tournamentB.teams[1].opponents = ['B1'];
      store.restoreRound();
      expect(store.currentTournament.tournamentB.games).toHaveLength(0);
    });

    it('setPlayOff sets on tournamentB when active', () => {
      store.setActiveGroup('B');
      store.setPlayOff([{ teams: [{ title: 'B1' }, { title: 'B2' }] }]);
      expect(store.currentTournament.tournamentB.playOff).toHaveLength(1);
      expect(store.currentTournament.main.playOff).toBeFalsy();
    });

    it('finishTournament finishes tournamentB when active', () => {
      store.setActiveGroup('B');
      store.finishTournament();
      expect(store.currentTournament.tournamentB.tournamentIsFinished).toBe(true);
      expect(store.currentTournament.main.tournamentIsFinished).toBe(false);
    });
  });
});
