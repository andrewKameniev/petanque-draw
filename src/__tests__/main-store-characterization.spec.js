import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mockSet = vi.fn(() => Promise.resolve());
const mockRemove = vi.fn(() => Promise.resolve());
const mockUpdate = vi.fn(() => Promise.resolve());
const mockGet = vi.fn(() => Promise.resolve({ exists: () => false, val: () => null }));
const mockOnValue = vi.fn(() => vi.fn());
const mockRef = vi.fn((_database, path) => path);

vi.mock('firebase/database', () => ({
  getDatabase: () => 'database',
  ref: (...args) => mockRef(...args),
  set: (...args) => mockSet(...args),
  remove: (...args) => mockRemove(...args),
  update: (...args) => mockUpdate(...args),
  get: (...args) => mockGet(...args),
  onValue: (...args) => mockOnValue(...args),
}));

vi.mock('@/firebase', () => ({ database: 'database' }));
vi.mock('@/i18n', () => ({ default: { global: { t: (key) => key } } }));
vi.mock('@/helpers', () => ({ tournamentNames: ['A', 'B', 'C'] }));
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

const { useMainStore } = await import('@/stores/main');
const { collaboratorService, userMapService } = await import('@/services/db');

const STATE_FIELDS = [
  '_activeBracketMatchPath',
  '_activeCadrageIndex',
  '_activeGameMatchPath',
  '_activePlayoffMatchPath',
  '_activeTeamPlayoffMatchPath',
  'archiveIndex',
  'currentTournamentIndex',
  'isAdmin',
  'message',
  'savedTournamentIds',
  'savedTournaments',
  'tournaments',
  'user',
  'userTournamentMap',
];

const GETTERS = [
  'activeTournament',
  'allScoresFilled',
  'currentRole',
  'currentTournament',
  'isNewFormat',
  'isOwnerOrAdmin',
  'isSuperAdmin',
];

const ACTIONS = `
  _doSync _getTarget _getTournamentOwnerUid _handleAccessRevoked _mergeBracketPlayoff _mergeCadrage
  _mergeGames _mergeTeamPlayoff _mergeTirPlayoff _syncMatchDebounced _syncPath _watchCollaboratorAccess
  addCollaborator addRoundToGames addTeamToStore addToSaved addTournament addTournamentBTeams
  changeDrawType changeTournamentName clearRoundTimer clearTeams completeTournamentBElimination endRound
  endRoundTimer fetchArchiveIndex fetchSavedTournaments finishTournament getTournaments hideMessage initTournamentB leaveSharedTournament
  loadSharedTournament loginUser pauseRoundTimer removeCollaborator removeSavedTournament removeTeam removeTournament
  removeTournamentB renameSavedTournament restartRoundTimer restoreRound resumeRoundTimer revertFinishTournament
  saveCadrageScores saveLanesToTeams savePreferences saveTournamentData setActiveBracketMatchPath setActiveCadrageIndex
  setActiveGameMatchPath setActiveGroup setActivePlayoffMatchPath setActiveTeamPlayoffMatchPath setActiveTournament
  setBarrage setBarrageGames setCadrage setPlayOff setPlayOffBracket setPlayOffStage setSavedTournaments
  setTournamentBEliminationRound setTournamentIdFromPortal setTournamentInfoFromPortal setTournaments showMessage
  shuffleLanesStore startRound startRoundTimer subscribeTournament swapLanesStore syncBracketMatch syncCadrageFull
  syncCadrageMatch syncDrawStart syncEliminationGames syncGameMatch syncGames syncGamesAndTeams syncPathNull
  syncPoulesRound syncRedraw syncStreamPresets syncTeamPlayoff syncTeamPlayoffMatch syncTeams syncTirParticipants
  syncTirPlayoff syncTirPlayoffMatch syncTirStart syncTirState syncTournamentMessage syncTournamentStarted
  toggleWithdrawn unarchiveTournament unsubscribeTournament updateGameScore
`
  .trim()
  .split(/\s+/)
  .sort();

function createStore(record = {}) {
  setActivePinia(createPinia());
  const store = useMainStore();
  store.user = { uid: 'user-1', email: 'user@example.com' };
  store.currentTournamentIndex = 'tournament-1';
  store.tournaments = {
    'tournament-1': {
      id: 'tournament-1',
      name: 'Test',
      games: [],
      teams: [],
      preferences: {},
      ...record,
    },
  };
  return store;
}

describe('main-store façade baseline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('preserves the complete public state, getter, and action contract', () => {
    const store = createStore();
    expect(Object.keys(store.$state).sort()).toEqual(STATE_FIELDS);
    expect(GETTERS.every((getter) => getter in store)).toBe(true);
    const actions = Object.keys(store).filter(
      (key) => !key.startsWith('$') && key !== '_hotUpdate' && typeof store[key] === 'function',
    );
    expect(actions.sort()).toEqual(ACTIONS);
  });

  it('writes a plain payload to the exact owner path', async () => {
    const store = createStore({ _ownerUid: 'owner-1' });
    const payload = { nested: { value: 2 } };

    await store._syncPath('preferences', payload);

    expect(mockSet).toHaveBeenCalledWith('owner-1/tournaments/tournament-1/preferences', payload);
    expect(mockSet.mock.calls[0][1]).not.toBe(payload);
  });

  it('replaces a same-match debounce while retaining different paths', async () => {
    vi.useFakeTimers();
    const store = createStore();

    store._syncMatchDebounced('games', '0/0', { score: 1 });
    store._syncMatchDebounced('games', '0/0', { score: 2 });
    store._syncMatchDebounced('games', '0/1', { score: 3 });
    await vi.advanceTimersByTimeAsync(200);

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith('user-1/tournaments/tournament-1/games/0/0', { score: 2 });
    expect(mockSet).toHaveBeenCalledWith('user-1/tournaments/tournament-1/games/0/1', { score: 3 });
    expect(store._recentMatchSyncs.size).toBe(0);
  });

  it('protects a locally edited game while merging another remote game', () => {
    const store = createStore({
      roundIsActive: true,
      games: [[{ score: 'local' }, { score: 'old' }]],
    });
    store._recentMatchSyncs = new Set(['games:0/0']);

    store._mergeGames(store.currentTournament, { games: [[{ score: 'remote' }, { score: 'new' }]] });

    expect(store.currentTournament.games[0]).toEqual([{ score: 'local' }, { score: 'new' }]);
  });

  it.each([
    ['cadrage', '_mergeCadrage', 'cadrage', [{ score: 'local' }], [{ score: 'remote' }], 'cadrage:0'],
    [
      'single/double bracket',
      '_mergeBracketPlayoff',
      'playOffBracket',
      { stages: [{ teams: [{ score: 'local' }] }], format: 'double' },
      { stages: [{ teams: [{ score: 'remote' }] }], format: 'double', champion: 'A' },
      'playOffBracket:stages/0/teams/0',
    ],
    [
      'team playoff',
      '_mergeTeamPlayoff',
      'teamPlayoff',
      { rounds: [{ matches: [{ score: 'local' }] }] },
      { rounds: [{ matches: [{ score: 'remote' }] }], size: 8 },
      'teamPlayoff:rounds/0/matches/0',
    ],
    [
      'tir playoff',
      '_mergeTirPlayoff',
      'tirPlayoff',
      { rounds: [{ matches: [{ score: 'local' }] }] },
      { rounds: [{ matches: [{ score: 'remote' }] }], size: 8 },
      'tirPlayoff:rounds/0/matches/0',
    ],
  ])('retains local edits while merging %s metadata', (_label, action, field, local, remote, syncKey) => {
    const store = createStore({ [field]: local });
    store._recentMatchSyncs = new Set([syncKey]);

    store[action](store.currentTournament, { [field]: remote });

    const match = Array.isArray(local)
      ? store.currentTournament[field][0]
      : store.currentTournament[field].stages?.[0]?.teams?.[0] || store.currentTournament[field].rounds[0].matches[0];
    expect(match.score).toBe('local');
    if (field === 'playOffBracket') expect(store.currentTournament[field].champion).toBe('A');
    if (field.endsWith('Playoff')) expect(store.currentTournament[field].size).toBe(8);
  });

  it('covers timer start, pause, resume, end, and clear through the façade', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T10:00:00.000Z'));
    const store = createStore({ preferences: { timeLimitEnabled: true, timeLimit: 45 } });

    store.startRoundTimer();
    expect(store.currentTournament.roundTimer).toMatchObject({
      timerStatus: 'running',
      timerEndsAt: '2026-08-05T10:45:00.000Z',
    });
    vi.advanceTimersByTime(5 * 60 * 1000);
    store.pauseRoundTimer();
    expect(store.currentTournament.roundTimer).toMatchObject({ timerStatus: 'paused', remainingMs: 40 * 60 * 1000 });
    store.resumeRoundTimer();
    expect(store.currentTournament.roundTimer).toMatchObject({ timerStatus: 'running' });
    store.endRoundTimer();
    expect(store.currentTournament.roundTimer.timerStatus).toBe('ended');
    store.clearRoundTimer();
    expect(store.currentTournament.roundTimer).toBeNull();
  });

  it('removes collaborator access from both indexes and leaves shared data without deleting owner data', async () => {
    const store = createStore({ collaborators: { collaborator: { role: 'admin' } } });
    await store.removeCollaborator('collaborator');
    expect(userMapService.remove).toHaveBeenCalledWith('collaborator', 'tournament-1');
    expect(collaboratorService.remove).toHaveBeenCalledWith('user-1', 'tournament-1', 'collaborator');

    store.tournaments['shared-1'] = { id: 'shared-1', _ownerUid: 'owner-1' };
    store.userTournamentMap['shared-1'] = { role: 'scorer', ownerUid: 'owner-1' };
    store.currentTournamentIndex = 'shared-1';
    await store.leaveSharedTournament('shared-1');

    expect(userMapService.remove).toHaveBeenCalledWith('user-1', 'shared-1');
    expect(mockRemove).not.toHaveBeenCalled();
    expect(store.tournaments['shared-1']).toBeUndefined();
  });

  it('leaves the selection empty after archiving the final active tournament', async () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null) });
    const store = createStore();
    store.userTournamentMap['tournament-1'] = { role: 'owner', status: 'active', name: 'Test' };

    await store.addToSaved(store.currentTournament);

    expect(store.tournaments).toEqual({});
    expect(store.currentTournamentIndex).toBeNull();
    vi.unstubAllGlobals();
  });

  it('cancels a pending match write before changing the active tournament', async () => {
    vi.useFakeTimers();
    const store = createStore();
    store.tournaments['tournament-2'] = { id: 'tournament-2', games: [], teams: [] };
    store._activeGameMatchPath = 'games/0/0';
    store._roundActivatedAt = Date.now();

    store._syncMatchDebounced('games', '0/0', { score: 13 });
    store.setActiveTournament('tournament-2');
    await vi.runAllTimersAsync();

    expect(mockSet).not.toHaveBeenCalled();
    expect(store.currentTournamentIndex).toBe('tournament-2');
    expect(store._activeGameMatchPath).toBeNull();
    expect(store._roundActivatedAt).toBeNull();
  });

  it('releases subscriptions and private tournament state on logout', () => {
    const store = createStore();
    store.userTournamentMap = { 'tournament-1': { role: 'owner' } };
    store.savedTournaments = { archived: { id: 'archived' } };
    store.savedTournamentIds = ['archived'];
    const unsubscribe = vi.spyOn(store, 'unsubscribeTournament');

    store.loginUser(false);

    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(store.user).toBe(false);
    expect(store.tournaments).toEqual({});
    expect(store.userTournamentMap).toEqual({});
    expect(store.savedTournaments).toEqual({});
    expect(store.currentTournamentIndex).toBeNull();
  });
});
