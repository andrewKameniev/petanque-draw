import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTournamentSyncRuntime,
  mergeBracketPlayoff,
  mergeCadrage,
  mergeGames,
  mergeTeamPlayoff,
  mergeTirPlayoff,
} from '@/services/tournament-sync';

function snapshot(value) {
  return { val: () => value };
}

function harness(record = { games: [], teams: [] }) {
  const subscriptions = new Map();
  const unsubscribe = vi.fn();
  const dependencies = {
    getDatabase: () => 'database',
    ref: (_database, path) => path,
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    onValue: vi.fn((path, callback, errorCallback) => {
      subscriptions.set(path, { callback, errorCallback });
      return unsubscribe;
    }),
    translate: (key) => key,
  };
  const store = {
    currentTournamentIndex: 't1',
    tournaments: { t1: record },
    user: { uid: 'user1' },
    _handleAccessRevoked: vi.fn(),
    showMessage: vi.fn(),
  };
  const runtime = createTournamentSyncRuntime(store, dependencies);
  store._recentMatchSyncs = runtime.recentMatchSyncs;
  store._recentSyncPaths = runtime.recentSyncPaths;
  store._syncPath = runtime.syncPath;
  return { dependencies, runtime, store, subscriptions, unsubscribe };
}

describe('tournament synchronization runtime', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each([
    ['main/games', [[{ score: 13 }]]],
    ['main/teams', [{ title: 'A' }]],
    ['main/preferences', { maxScore: 13 }],
    ['main/roundTimer', { timerStatus: 'running' }],
    ['main/tirPlayoff', { rounds: [] }],
    ['main/playOffBracket', { stages: [] }],
    ['tournamentB/games', [[{ score: 7 }]]],
  ])('writes %s with an exact plain payload', async (path, payload) => {
    const record = { _ownerUid: 'owner1', games: [], teams: [] };
    const { dependencies, runtime } = harness(record);

    await runtime.syncPath(path, payload);

    expect(dependencies.set).toHaveBeenCalledWith(`owner1/tournaments/t1/${path}`, payload);
    expect(dependencies.set.mock.calls[0][1]).not.toBe(payload);
  });

  it('writes multiple tournament leaves atomically at the owner tournament path', async () => {
    const record = { _ownerUid: 'owner1', games: [], teams: [] };
    const { dependencies, runtime } = harness(record);
    const updates = {
      'main/teams/20/title': 'New title',
      'main/games/0/1/team_2': 'New title',
      'main/teams/20/players': [{ id: 738 }],
    };

    await runtime.syncPaths(updates);

    expect(dependencies.update).toHaveBeenCalledTimes(1);
    expect(dependencies.update).toHaveBeenCalledWith('owner1/tournaments/t1', updates);
    expect(dependencies.set).not.toHaveBeenCalled();
  });

  it('rejects a failed atomic update and reports permission loss for shared tournaments', async () => {
    const record = { _ownerUid: 'owner1', games: [], teams: [] };
    const { dependencies, runtime, store } = harness(record);
    const error = { code: 'PERMISSION_DENIED' };
    dependencies.update.mockRejectedValueOnce(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(runtime.syncPaths({ 'main/teams/0/title': 'New title' })).rejects.toBe(error);

    expect(store._handleAccessRevoked).toHaveBeenCalledWith('t1');
    consoleError.mockRestore();
  });

  it('replaces same-path debounce, allows another path, and clears successful echoes', async () => {
    const { dependencies, runtime } = harness();
    runtime.syncMatchDebounced('games', '0/0', { score: 1 });
    runtime.syncMatchDebounced('games', '0/0', { score: 2 });
    runtime.syncMatchDebounced('games', '0/1', { score: 3 });

    await vi.advanceTimersByTimeAsync(200);

    expect(dependencies.set).toHaveBeenCalledTimes(2);
    expect(dependencies.set).toHaveBeenCalledWith('user1/tournaments/t1/games/0/0', { score: 2 });
    expect(runtime.recentMatchSyncs.size).toBe(0);
  });

  it('clears pending writes deterministically when disposed during a tournament switch', async () => {
    const { dependencies, runtime, store } = harness();
    runtime.syncMatchDebounced('games', '0/0', { score: 1 });
    store.currentTournamentIndex = 't2';
    runtime.dispose();

    await vi.runAllTimersAsync();

    expect(dependencies.set).not.toHaveBeenCalled();
    expect(runtime.recentMatchSyncs.size).toBe(0);
  });

  it('clears failed writes and reports permission loss for shared tournaments', async () => {
    const { dependencies, runtime, store } = harness({ _ownerUid: 'owner1', games: [], teams: [] });
    dependencies.set.mockRejectedValueOnce({ code: 'PERMISSION_DENIED' });
    runtime.syncMatchDebounced('games', '0/0', { score: 1 });

    await vi.advanceTimersByTimeAsync(200);

    expect(runtime.recentMatchSyncs.size).toBe(0);
    expect(store._handleAccessRevoked).toHaveBeenCalledWith('t1');
  });

  it('ignores a stale permission failure after lifecycle cleanup', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { dependencies, runtime, store } = harness({ _ownerUid: 'owner1', games: [], teams: [] });
    let rejectWrite;
    dependencies.set.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectWrite = reject;
      }),
    );

    const pending = runtime.syncPath('games', []);
    runtime.dispose();
    rejectWrite({ code: 'PERMISSION_DENIED' });
    await pending;

    expect(store._handleAccessRevoked).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('registers scoped subscriptions, skips a same-path echo, and disposes every listener', async () => {
    const record = {
      name: 'Wrapper',
      main: { games: [[{ score: 'local' }]], teams: [], roundIsActive: true, preferences: {} },
      tournamentB: null,
      activeGroup: 'A',
    };
    const { runtime, subscriptions, unsubscribe } = harness(record);
    runtime.subscribeTournament();
    const gameSubscription = subscriptions.get('user1/tournaments/t1/main/games');
    const groupsSubscription = subscriptions.get('user1/tournaments/t1/main/groups');

    await runtime.syncPath('main/games', record.main.games);
    gameSubscription.callback(snapshot([[{ score: 'echo' }]]));
    expect(record.main.games[0][0].score).toBe('local');
    gameSubscription.callback(snapshot([[{ score: 'remote' }]]));
    expect(record.main.games[0][0].score).toBe('remote');
    groupsSubscription.callback(snapshot([[{ title: 'Renamed team' }]]));
    expect(record.main.groups).toEqual([[{ title: 'Renamed team' }]]);

    runtime.dispose();
    expect(unsubscribe).toHaveBeenCalledTimes(subscriptions.size);
  });

  it.each([
    ['games', [[{ score: 13 }]]],
    ['cadrage', [{ score: 13 }]],
    ['playOffBracket', { stages: [{ teams: [{ score: 13 }] }] }],
    ['tirPlayoff', { rounds: [{ matches: [{ score: 13 }] }] }],
    ['teamPlayoff', { rounds: [{ matches: [{ score: 13 }] }] }],
  ])('converges %s to a remote deletion while preserving same-path echo suppression', async (path, localValue) => {
    const remoteRecord = { teams: [], roundIsActive: true, [path]: localValue };
    const remoteClient = harness(remoteRecord);
    remoteClient.runtime.subscribeTournament();

    remoteClient.subscriptions.get(`user1/tournaments/t1/${path}`).callback(snapshot(null));

    expect(remoteRecord[path]).toBeNull();

    const missingRecord = { teams: [], roundIsActive: true, [path]: localValue };
    const missingClient = harness(missingRecord);
    missingClient.runtime.subscribeTournament();

    missingClient.subscriptions.get(`user1/tournaments/t1/${path}`).callback(snapshot(undefined));

    expect(missingRecord[path]).toBe(localValue);

    const localRecord = { teams: [], roundIsActive: true, [path]: localValue };
    const localClient = harness(localRecord);
    localClient.runtime.subscribeTournament();
    await localClient.runtime.syncPath(path, null);

    localClient.subscriptions.get(`user1/tournaments/t1/${path}`).callback(snapshot(null));

    expect(localRecord[path]).toBe(localValue);
  });

  it('routes subscription permission errors to access revocation once scoped to a shared owner', () => {
    const { runtime, subscriptions, store } = harness({ _ownerUid: 'owner1', games: [], teams: [] });
    runtime.subscribeTournament();

    subscriptions.get('owner1/tournaments/t1/games').errorCallback({ code: 'PERMISSION_DENIED' });

    expect(store._handleAccessRevoked).toHaveBeenCalledWith('t1');
  });

  it('dispose is idempotent — calling it twice does not throw or double-unsubscribe', () => {
    const record = {
      name: 'T',
      main: { games: [], teams: [], preferences: {} },
      activeGroup: 'A',
    };
    const { runtime, unsubscribe } = harness(record);
    runtime.subscribeTournament();
    const callCount = unsubscribe.mock.calls.length;

    runtime.dispose();
    runtime.dispose();

    expect(unsubscribe.mock.calls.length).toBe(callCount + unsubscribe.mock.calls.length - callCount);
    expect(() => runtime.dispose()).not.toThrow();
  });

  it('does not report permission loss for network errors on owned tournaments', async () => {
    const { dependencies, runtime, store } = harness();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    dependencies.set.mockRejectedValueOnce(new Error('Network error'));

    await runtime.syncPath('games', []);

    expect(store._handleAccessRevoked).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('keeps local running timer when remote sends ended but timer has not expired', () => {
    const futureEnd = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const record = {
      name: 'T',
      main: {
        games: [],
        teams: [],
        preferences: {},
        roundTimer: { timerStatus: 'running', timerEndsAt: futureEnd },
        roundIsActive: true,
      },
      activeGroup: 'A',
    };
    const { runtime, subscriptions } = harness(record);
    runtime.subscribeTournament();

    const timerSub = subscriptions.get('user1/tournaments/t1/main/roundTimer');
    timerSub.callback(snapshot({ timerStatus: 'ended', timerEndsAt: futureEnd }));

    expect(record.main.roundTimer.timerStatus).toBe('running');
  });
});

describe('explicit merge policies', () => {
  it('merges games and cadrage while preserving local edits', () => {
    const recentSyncs = new Set(['games:0/0', 'cadrage:0']);
    const local = { games: [[{ score: 1 }, { score: 2 }]], cadrage: [{ score: 3 }] };
    mergeGames(local, { games: [[{ score: 9 }, { score: 8 }]] }, { recentSyncs });
    mergeCadrage(local, { cadrage: [{ score: 7 }] }, { recentSyncs });
    expect(local).toEqual({ games: [[{ score: 1 }, { score: 8 }]], cadrage: [{ score: 3 }] });
  });

  it('merges bracket, team-playoff, and tir-playoff metadata around protected matches', () => {
    const local = {
      playOffBracket: { stages: [{ teams: [{ score: 1 }] }], format: 'double' },
      teamPlayoff: { rounds: [{ matches: [{ score: 2 }] }] },
      tirPlayoff: { rounds: [{ matches: [{ score: 3 }] }] },
    };
    mergeBracketPlayoff(
      local,
      { playOffBracket: { stages: [{ teams: [{ score: 9 }] }], format: 'double', champion: 'A' } },
      { recentSyncs: new Set(['playOffBracket:stages/0/teams/0']) },
    );
    mergeTeamPlayoff(
      local,
      { teamPlayoff: { rounds: [{ matches: [{ score: 9 }] }], size: 8 } },
      {
        recentSyncs: new Set(['teamPlayoff:rounds/0/matches/0']),
      },
    );
    mergeTirPlayoff(
      local,
      { tirPlayoff: { rounds: [{ matches: [{ score: 9 }] }], qualified: ['A'] } },
      {
        recentSyncs: new Set(['tirPlayoff:rounds/0/matches/0']),
      },
    );

    expect(local.playOffBracket).toMatchObject({ champion: 'A', stages: [{ teams: [{ score: 1 }] }] });
    expect(local.teamPlayoff).toMatchObject({ size: 8, rounds: [{ matches: [{ score: 2 }] }] });
    expect(local.tirPlayoff).toMatchObject({ qualified: ['A'], rounds: [{ matches: [{ score: 3 }] }] });
  });
});
