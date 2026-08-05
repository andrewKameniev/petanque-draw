import { describe, expect, it, vi } from 'vitest';
import {
  LIVE_TOURNAMENT_PROFILES,
  PUBLIC_FIELDS,
  TV_FIELDS,
  WRAPPER_FIELDS,
  applyTournamentSnapshot,
  buildTournamentSubscriptionPlan,
  createLiveTournamentSource,
} from '@/services/live-tournament';
import { normalizeTournamentRecord } from '@/services/tournament-record';

vi.mock('@/firebase', () => ({ database: {} }));

const wrapperRecord = {
  name: 'Wrapper Cup',
  tournamentMessage: 'Welcome',
  activeGroup: 'A',
  main: { system: 'swiss', games: [], teams: [], preferences: {} },
};

const legacyRecord = {
  id: '123',
  name: 'Legacy Cup',
  tournamentMessage: 'Welcome',
  system: 'swiss',
  games: [],
  teams: [],
  preferences: {},
};

function snapshot(value, exists = true) {
  return { exists: () => exists, val: () => value };
}

function createService(record = wrapperRecord) {
  const callbacks = new Map();
  const errorCallbacks = new Map();
  const unsubscribers = [];
  const service = {
    getOne: vi.fn().mockResolvedValue(snapshot(record)),
    subscribePath: vi.fn((_ownerUid, _tournamentId, path, callback, errorCallback) => {
      callbacks.set(path, callback);
      errorCallbacks.set(path, errorCallback);
      const unsubscribe = vi.fn();
      unsubscribers.push(unsubscribe);
      return unsubscribe;
    }),
  };
  return { service, callbacks, errorCallbacks, unsubscribers };
}

function createEventTarget(visibilityState = 'visible') {
  const listeners = new Map();
  return {
    visibilityState,
    addEventListener: vi.fn((event, callback) => listeners.set(event, callback)),
    removeEventListener: vi.fn((event, callback) => {
      if (listeners.get(event) === callback) listeners.delete(event);
    }),
    dispatch(event) {
      listeners.get(event)?.();
    },
  };
}

describe('live tournament profiles and paths', () => {
  it('keeps field sets unique and includes critical Public/TV fields', () => {
    expect(new Set(PUBLIC_FIELDS).size).toBe(PUBLIC_FIELDS.length);
    expect(new Set(TV_FIELDS).size).toBe(TV_FIELDS.length);
    expect(new Set(WRAPPER_FIELDS).size).toBe(WRAPPER_FIELDS.length);

    expect(PUBLIC_FIELDS).toEqual(
      expect.arrayContaining([
        'games',
        'roundTimer',
        'playOffBracket',
        'teamPlayoff',
        'roundRobinCircle',
        'tirParticipants',
        'tirPlayoff',
        'tirRound',
        'tirStarted',
        'streamPresets',
      ]),
    );
    expect(TV_FIELDS).toEqual(expect.arrayContaining(['games', 'roundTimer', 'teams', 'groups', 'groupSchedule']));
    expect(WRAPPER_FIELDS).toEqual(expect.arrayContaining(['activeGroup', 'tournamentMessage']));
  });

  it('builds wrapper Public paths without duplicate Group B child subscriptions', () => {
    const plan = buildTournamentSubscriptionPlan(normalizeTournamentRecord(wrapperRecord), 'public');
    const paths = plan.map(({ path }) => path);

    expect(paths).toEqual(expect.arrayContaining(['activeGroup', 'tournamentMessage', 'main/games', 'tournamentB']));
    expect(paths.some((path) => path.startsWith('tournamentB/'))).toBe(false);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('builds legacy Public and wrapper TV paths for their exact profiles', () => {
    const legacyPaths = buildTournamentSubscriptionPlan(normalizeTournamentRecord(legacyRecord), 'public').map(
      ({ path }) => path,
    );
    const tvPaths = buildTournamentSubscriptionPlan(normalizeTournamentRecord(wrapperRecord), 'tv').map(
      ({ path }) => path,
    );

    expect(legacyPaths).toEqual(expect.arrayContaining(['games', 'tournamentMessage', 'groupB']));
    expect(tvPaths).toEqual(expect.arrayContaining(['tournamentMessage', 'main/games', 'main/groupSchedule']));
    expect(tvPaths).not.toContain('activeGroup');
    expect(tvPaths).not.toContain('tournamentB');
    expect(LIVE_TOURNAMENT_PROFILES.public.includeGroupB).toBe(true);
    expect(LIVE_TOURNAMENT_PROFILES.tv.includeGroupB).toBe(false);
  });

  it('applies root, main, and null snapshots immutably', () => {
    const record = normalizeTournamentRecord(wrapperRecord);
    const nextMessage = applyTournamentSnapshot(
      record,
      { kind: 'root-field', field: 'tournamentMessage' },
      null,
      '123',
    );
    const nextGames = applyTournamentSnapshot(
      nextMessage,
      { kind: 'group-field', group: 'A', field: 'games' },
      null,
      '123',
    );
    const nextGroupB = applyTournamentSnapshot(
      nextGames,
      { kind: 'group-node', group: 'B' },
      { teams: [{ title: 'B Team' }], preferences: {} },
      '123',
    );

    expect(record.tournamentMessage).toBe('Welcome');
    expect(record.main.games).toEqual([]);
    expect(nextMessage.tournamentMessage).toBeNull();
    expect(nextGames.main.games).toBeNull();
    expect(nextGroupB.tournamentB.teams[0].title).toBe('B Team');
  });
});

describe.each([
  ['public', wrapperRecord, 'main/games'],
  ['tv', legacyRecord, 'games'],
])('createLiveTournamentSource %s profile', (profile, record, gamesPath) => {
  it('loads, adapts, subscribes, and applies live values', async () => {
    const { service, callbacks } = createService(record);
    const states = [];
    const source = createLiveTournamentSource({
      service,
      profile,
      onState: (state) => states.push(state),
      documentTarget: null,
      windowTarget: null,
    });

    await source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    callbacks.get(gamesPath)(snapshot([[{ team_1: 'One', team_2: 'Two' }]]));

    expect(states.map(({ status }) => status).slice(0, 2)).toEqual(['loading', 'ready']);
    expect(source.getState().record._ownerUid).toBe('owner');
    expect(source.getState().record.main?.games || source.getState().record.games).toEqual([
      [{ team_1: 'One', team_2: 'Two' }],
    ]);
  });
});

describe('live tournament source states and lifecycle', () => {
  it('reports missing, initial errors, and invalid sources explicitly', async () => {
    const missingService = createService().service;
    missingService.getOne.mockResolvedValue(snapshot(null, false));
    const missing = createLiveTournamentSource({ service: missingService, documentTarget: null, windowTarget: null });
    await missing.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    expect(missing.getState()).toMatchObject({ status: 'missing', record: null });

    const error = new Error('read denied');
    const errorService = createService().service;
    errorService.getOne.mockRejectedValue(error);
    const failed = createLiveTournamentSource({ service: errorService, documentTarget: null, windowTarget: null });
    await failed.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    expect(failed.getState()).toMatchObject({ status: 'error', error });

    const invalid = createLiveTournamentSource({ service: errorService, documentTarget: null, windowTarget: null });
    await invalid.start({ type: 'invalid', reason: 'missing-source' });
    expect(invalid.getState()).toMatchObject({ status: 'invalid', record: null });
    expect(errorService.getOne).toHaveBeenCalledTimes(1);
  });

  it('applies live root message and Group B creation/removal', async () => {
    const { service, callbacks } = createService();
    const source = createLiveTournamentSource({ service, documentTarget: null, windowTarget: null });
    await source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });

    callbacks.get('tournamentMessage')(snapshot('Live message'));
    expect(source.getState().record.tournamentMessage).toBe('Live message');

    callbacks.get('tournamentB')(snapshot({ teams: [{ title: 'B Team' }], preferences: {} }));
    expect(source.getState().record.tournamentB.teams[0].title).toBe('B Team');

    callbacks.get('tournamentB')(snapshot(null));
    expect(source.getState().record.tournamentB).toBeNull();
  });

  it('closes old listeners before online/visibility reload and cleans up idempotently', async () => {
    const { service, unsubscribers } = createService();
    const documentTarget = createEventTarget('hidden');
    const windowTarget = createEventTarget();
    const source = createLiveTournamentSource({ service, documentTarget, windowTarget });
    await source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    const listenersPerLoad = unsubscribers.length;

    documentTarget.dispatch('visibilitychange');
    expect(service.getOne).toHaveBeenCalledTimes(1);

    windowTarget.dispatch('online');
    await vi.waitFor(() => expect(service.getOne).toHaveBeenCalledTimes(2));
    expect(unsubscribers.slice(0, listenersPerLoad).every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(
      true,
    );

    documentTarget.visibilityState = 'visible';
    documentTarget.dispatch('visibilitychange');
    await vi.waitFor(() => expect(service.getOne).toHaveBeenCalledTimes(3));
    expect(unsubscribers).toHaveLength(listenersPerLoad * 3);

    source.stop();
    source.stop();
    expect(unsubscribers.every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(true);
    expect(documentTarget.removeEventListener).toHaveBeenCalledTimes(1);
    expect(windowTarget.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('reports subscription errors and ignores late snapshots after stop', async () => {
    const { service, callbacks, errorCallbacks } = createService();
    const source = createLiveTournamentSource({ service, documentTarget: null, windowTarget: null });
    await source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });

    const error = new Error('listener denied');
    errorCallbacks.get('main/games')(error);
    expect(source.getState()).toMatchObject({ status: 'error', error });

    const lateGames = callbacks.get('main/games');
    source.stop();
    lateGames(snapshot([[{ team_1_score: 13 }]]));
    expect(source.getState()).toMatchObject({ status: 'idle', record: null });
  });
});
