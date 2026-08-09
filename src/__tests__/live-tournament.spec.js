import { describe, expect, it, vi } from 'vitest';
import {
  LIVE_TOURNAMENT_PROFILES,
  PUBLIC_FIELDS,
  TV_FIELDS,
  WRAPPER_FIELDS,
  applyTournamentSnapshot,
  buildTournamentSubscriptionPlan,
  createLiveTournamentSource as createSource,
} from '@/services/live-tournament';
import { normalizeTournamentRecord } from '@/services/tournament-record';

vi.mock('@/firebase', () => ({ database: {} }));

function createLiveTournamentSource(options = {}) {
  return createSource({ profile: 'tv', ...options });
}

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
  const bootstrapCallbacks = [];
  const bootstrapErrorCallbacks = [];
  const parentUnsubscribers = [];
  const pathUnsubscribers = [];
  const events = [];
  const service = {
    getOne: vi.fn(),
    subscribe: vi.fn((_ownerUid, _tournamentId, callback, errorCallback) => {
      const index = bootstrapCallbacks.length;
      bootstrapCallbacks.push(callback);
      bootstrapErrorCallbacks.push(errorCallback);
      events.push({ type: 'parent-subscribe', index });
      const unsubscribe = vi.fn(() => events.push({ type: 'parent-unsubscribe', index }));
      parentUnsubscribers.push(unsubscribe);
      return unsubscribe;
    }),
    subscribePath: vi.fn((_ownerUid, _tournamentId, path, callback, errorCallback) => {
      callbacks.set(path, callback);
      errorCallbacks.set(path, errorCallback);
      events.push({ type: 'path-subscribe', path });
      const unsubscribe = vi.fn(() => events.push({ type: 'path-unsubscribe', path }));
      pathUnsubscribers.push(unsubscribe);
      return unsubscribe;
    }),
  };
  return {
    service,
    callbacks,
    errorCallbacks,
    parentUnsubscribers,
    pathUnsubscribers,
    events,
    emitBootstrap(value = record, exists = true, index = bootstrapCallbacks.length - 1) {
      bootstrapCallbacks[index](snapshot(value, exists));
    },
    failBootstrap(error, index = bootstrapErrorCallbacks.length - 1) {
      bootstrapErrorCallbacks[index](error);
    },
  };
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
        'useRating',
        'streamPresets',
      ]),
    );
    expect(TV_FIELDS).toEqual(expect.arrayContaining(['games', 'roundTimer', 'teams', 'groups', 'groupSchedule']));
    expect(WRAPPER_FIELDS).toEqual(expect.arrayContaining(['name', 'activeGroup', 'tournamentMessage']));
  });

  it('builds wrapper TV paths for its exact static profile', () => {
    const tvPaths = buildTournamentSubscriptionPlan(normalizeTournamentRecord(wrapperRecord), 'tv').map(
      ({ path }) => path,
    );

    expect(tvPaths).toEqual(expect.arrayContaining(['name', 'tournamentMessage', 'main/games', 'main/groupSchedule']));
    expect(tvPaths).not.toContain('activeGroup');
    expect(tvPaths).not.toContain('tournamentB');
    expect(LIVE_TOURNAMENT_PROFILES.public.phaseAware).toBe(true);
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
  ['wrapper', wrapperRecord, 'main/games'],
  ['legacy', legacyRecord, 'games'],
])('createLiveTournamentSource TV profile with a %s record', (_label, record, gamesPath) => {
  it('bootstraps from a temporary parent listener, then subscribes and applies live values', async () => {
    const { service, callbacks, emitBootstrap, events, parentUnsubscribers } = createService(record);
    const states = [];
    const source = createLiveTournamentSource({
      service,
      profile: 'tv',
      onState: (state) => states.push(state),
      documentTarget: null,
      windowTarget: null,
    });

    const started = source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    expect(service.subscribe).toHaveBeenCalledTimes(1);
    expect(service.getOne).not.toHaveBeenCalled();
    expect(service.subscribePath).not.toHaveBeenCalled();

    emitBootstrap();
    await started;
    callbacks.get(gamesPath)(snapshot([[{ team_1: 'One', team_2: 'Two' }]]));

    expect(states.map(({ status }) => status).slice(0, 2)).toEqual(['loading', 'ready']);
    expect(source.getState().record._ownerUid).toBe('owner');
    expect(source.getState().record.main?.games || source.getState().record.games).toEqual([
      [{ team_1: 'One', team_2: 'Two' }],
    ]);

    const lastPathSubscription = events.findLastIndex(({ type }) => type === 'path-subscribe');
    const parentUnsubscribe = events.findIndex(({ type }) => type === 'parent-unsubscribe');
    expect(lastPathSubscription).toBeGreaterThan(-1);
    expect(parentUnsubscribe).toBeGreaterThan(lastPathSubscription);
    expect(parentUnsubscribers[0]).toHaveBeenCalledTimes(1);
  });
});

describe('live tournament source states and lifecycle', () => {
  it('reports missing, initial errors, and invalid sources explicitly', async () => {
    const missingSetup = createService();
    const missing = createLiveTournamentSource({
      service: missingSetup.service,
      documentTarget: null,
      windowTarget: null,
    });
    const missingStart = missing.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    missingSetup.emitBootstrap(null, false);
    await missingStart;
    expect(missing.getState()).toMatchObject({ status: 'missing', record: null });

    const error = new Error('read denied');
    const errorSetup = createService();
    const failed = createLiveTournamentSource({
      service: errorSetup.service,
      documentTarget: null,
      windowTarget: null,
    });
    const failedStart = failed.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    errorSetup.failBootstrap(error);
    await failedStart;
    expect(failed.getState()).toMatchObject({ status: 'error', error });

    const invalid = createLiveTournamentSource({
      service: errorSetup.service,
      documentTarget: null,
      windowTarget: null,
    });
    await invalid.start({ type: 'invalid', reason: 'missing-source' });
    expect(invalid.getState()).toMatchObject({ status: 'invalid', record: null });
    expect(errorSetup.service.subscribe).toHaveBeenCalledTimes(1);
    expect(errorSetup.service.getOne).not.toHaveBeenCalled();
  });

  it('applies live root metadata and competition-field removal', async () => {
    const { service, callbacks, emitBootstrap } = createService();
    const source = createLiveTournamentSource({ service, documentTarget: null, windowTarget: null });
    const started = source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    emitBootstrap();
    await started;

    callbacks.get('tournamentMessage')(snapshot('Live message'));
    expect(source.getState().record.tournamentMessage).toBe('Live message');

    callbacks.get('name')(snapshot('Renamed Cup'));
    expect(source.getState().record.name).toBe('Renamed Cup');

    callbacks.get('main/games')(snapshot(null));
    expect(source.getState().record.main.games).toBeNull();
  });

  it('keeps same-source starts idempotent while loading and after ready', async () => {
    const { service, emitBootstrap, pathUnsubscribers } = createService();
    const source = createLiveTournamentSource({ service, documentTarget: null, windowTarget: null });
    const tournamentSource = { type: 'firebase', ownerUid: 'owner', tournamentId: '123' };

    const firstStart = source.start(tournamentSource);
    const loadingStart = source.start({ ...tournamentSource });
    expect(service.subscribe).toHaveBeenCalledTimes(1);
    expect(service.subscribePath).not.toHaveBeenCalled();

    emitBootstrap();
    await Promise.all([firstStart, loadingStart]);
    const listenersAfterBootstrap = pathUnsubscribers.length;

    await source.start({ ...tournamentSource });
    expect(service.subscribe).toHaveBeenCalledTimes(1);
    expect(pathUnsubscribers).toHaveLength(listenersAfterBootstrap);
    expect(pathUnsubscribers.every((unsubscribe) => unsubscribe.mock.calls.length === 0)).toBe(true);
  });

  it('settles without subscribing when a loading state handler stops synchronously', async () => {
    const service = {
      subscribe: vi.fn(),
      subscribePath: vi.fn(),
    };
    const states = [];
    let source;
    source = createLiveTournamentSource({
      service,
      documentTarget: null,
      windowTarget: null,
      onState: (nextState) => {
        states.push(nextState);
        if (nextState.status === 'loading') source.stop();
      },
    });

    const settledState = await source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });

    expect(service.subscribe).not.toHaveBeenCalled();
    expect(service.subscribePath).not.toHaveBeenCalled();
    expect(states.map(({ status }) => status)).toEqual(['loading', 'idle']);
    expect(settledState).toMatchObject({ status: 'idle', record: null });
    expect(source.getState()).toMatchObject({ status: 'idle', record: null });
  });

  it('lets a loading state handler switch targets before only the new target subscribes', async () => {
    const setup = createService();
    const states = [];
    let source;
    let secondStart;
    let switched = false;
    source = createLiveTournamentSource({
      service: setup.service,
      documentTarget: null,
      windowTarget: null,
      onState: (nextState) => {
        states.push(nextState);
        if (nextState.status === 'loading' && nextState.source?.ownerUid === 'owner-a' && !switched) {
          switched = true;
          secondStart = source.start({ type: 'firebase', ownerUid: 'owner-b', tournamentId: '222' });
        }
      },
    });

    const firstStart = source.start({ type: 'firebase', ownerUid: 'owner-a', tournamentId: '111' });

    await firstStart;
    expect(setup.service.subscribe).toHaveBeenCalledTimes(1);
    expect(setup.service.subscribe).toHaveBeenCalledWith('owner-b', '222', expect.any(Function), expect.any(Function));
    expect(setup.service.subscribePath).not.toHaveBeenCalled();

    setup.emitBootstrap({ ...wrapperRecord, name: 'Target B' }, true, 0);
    await secondStart;

    expect(
      setup.service.subscribePath.mock.calls.every(
        ([ownerUid, tournamentId]) => ownerUid === 'owner-b' && tournamentId === '222',
      ),
    ).toBe(true);
    expect(states.filter(({ status }) => status === 'ready')).toHaveLength(1);
    expect(source.getState().record).toMatchObject({ name: 'Target B', _ownerUid: 'owner-b' });
  });

  it('disposes old children before a ready state handler switches targets', async () => {
    const setup = createService();
    let source;
    let secondStart;
    let switched = false;
    source = createLiveTournamentSource({
      service: setup.service,
      documentTarget: null,
      windowTarget: null,
      onState: (nextState) => {
        if (nextState.status === 'ready' && nextState.record?._ownerUid === 'owner-a' && !switched) {
          switched = true;
          secondStart = source.start({ type: 'firebase', ownerUid: 'owner-b', tournamentId: '222' });
        }
      },
    });

    const firstStart = source.start({ type: 'firebase', ownerUid: 'owner-a', tournamentId: '111' });
    setup.emitBootstrap(wrapperRecord, true, 0);
    await firstStart;

    const oldPlanSize = setup.pathUnsubscribers.length;
    const oldChildren = [...setup.pathUnsubscribers];
    expect(oldPlanSize).toBeGreaterThan(0);
    expect(setup.service.subscribe).toHaveBeenCalledTimes(2);
    expect(setup.service.subscribePath.mock.calls).toHaveLength(oldPlanSize);
    expect(
      setup.service.subscribePath.mock.calls.every(
        ([ownerUid, tournamentId]) => ownerUid === 'owner-a' && tournamentId === '111',
      ),
    ).toBe(true);
    expect(oldChildren.every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(true);

    setup.emitBootstrap(legacyRecord, true, 1);
    await secondStart;

    const newTargetCalls = setup.service.subscribePath.mock.calls.slice(oldPlanSize);
    expect(newTargetCalls.length).toBeGreaterThan(0);
    expect(newTargetCalls.every(([ownerUid, tournamentId]) => ownerUid === 'owner-b' && tournamentId === '222')).toBe(
      true,
    );
    expect(newTargetCalls.map(([, , path]) => path)).toContain('games');
    expect(newTargetCalls.map(([, , path]) => path)).not.toContain('main/games');
    expect(source.getState().record).toMatchObject({ name: 'Legacy Cup', _ownerUid: 'owner-b' });
  });

  it('disposes old children before a ready state handler reloads', async () => {
    const setup = createService();
    let source;
    let reloadPromise;
    let reloaded = false;
    source = createLiveTournamentSource({
      service: setup.service,
      documentTarget: null,
      windowTarget: null,
      onState: (nextState) => {
        if (nextState.status === 'ready' && !reloaded) {
          reloaded = true;
          reloadPromise = source.reload();
        }
      },
    });

    const firstStart = source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    setup.emitBootstrap(wrapperRecord, true, 0);
    await firstStart;

    const oldPlanSize = setup.pathUnsubscribers.length;
    const oldChildren = [...setup.pathUnsubscribers];
    expect(oldPlanSize).toBeGreaterThan(0);
    expect(setup.service.subscribe).toHaveBeenCalledTimes(2);
    expect(setup.service.subscribePath).toHaveBeenCalledTimes(oldPlanSize);
    expect(oldChildren.every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(true);

    setup.emitBootstrap(legacyRecord, true, 1);
    await reloadPromise;

    const reloadedCalls = setup.service.subscribePath.mock.calls.slice(oldPlanSize);
    expect(reloadedCalls.length).toBeGreaterThan(0);
    expect(reloadedCalls.every(([ownerUid, tournamentId]) => ownerUid === 'owner' && tournamentId === '123')).toBe(
      true,
    );
    expect(reloadedCalls.map(([, , path]) => path)).toContain('games');
    expect(reloadedCalls.map(([, , path]) => path)).not.toContain('main/games');
    expect(source.getState().record.name).toBe('Legacy Cup');
  });

  it('hands off safely when parent and child cache callbacks run synchronously', async () => {
    const childCallbacks = new Map();
    const childUnsubscribers = [];
    const parentUnsubscribe = vi.fn();
    const events = [];
    const service = {
      subscribe: vi.fn((_ownerUid, _tournamentId, callback) => {
        callback(snapshot(wrapperRecord));
        return vi.fn(() => {
          events.push('parent-unsubscribe');
          parentUnsubscribe();
        });
      }),
      subscribePath: vi.fn((_ownerUid, _tournamentId, path, callback) => {
        events.push(`child-subscribe:${path}`);
        childCallbacks.set(path, callback);
        callback(snapshot(`cached:${path}`));
        const unsubscribe = vi.fn();
        childUnsubscribers.push(unsubscribe);
        return unsubscribe;
      }),
    };
    const states = [];
    const source = createLiveTournamentSource({
      service,
      documentTarget: null,
      windowTarget: null,
      onState: (nextState) => states.push(nextState),
    });

    await source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });

    expect(states.filter(({ status }) => status === 'ready')).toHaveLength(1);
    expect(source.getState().record.name).toBe('Wrapper Cup');
    expect(parentUnsubscribe).toHaveBeenCalledTimes(1);
    expect(events.at(-1)).toBe('parent-unsubscribe');

    childCallbacks.get('main/games')(snapshot([[{ team_1: 'Later One', team_2: 'Later Two' }]]));

    expect(states.filter(({ status }) => status === 'ready')).toHaveLength(2);
    expect(source.getState().record.main.games).toEqual([[{ team_1: 'Later One', team_2: 'Later Two' }]]);

    source.stop();
    expect(parentUnsubscribe).toHaveBeenCalledTimes(1);
    expect(childUnsubscribers.every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(true);
  });

  it('keeps a missing parent live for hydration and disposes it once when stopped while missing', async () => {
    const hydrationSetup = createService();
    const hydrationSource = createLiveTournamentSource({
      service: hydrationSetup.service,
      documentTarget: null,
      windowTarget: null,
    });

    const missingStart = hydrationSource.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    hydrationSetup.emitBootstrap(null, false, 0);
    await missingStart;

    expect(hydrationSource.getState()).toMatchObject({ status: 'missing', record: null });
    expect(hydrationSetup.parentUnsubscribers[0]).not.toHaveBeenCalled();
    expect(hydrationSetup.service.subscribePath).not.toHaveBeenCalled();

    hydrationSetup.emitBootstrap(wrapperRecord, true, 0);

    expect(hydrationSource.getState()).toMatchObject({ status: 'ready' });
    expect(hydrationSource.getState().record.name).toBe('Wrapper Cup');
    expect(hydrationSetup.service.subscribePath).toHaveBeenCalled();
    expect(hydrationSetup.parentUnsubscribers[0]).toHaveBeenCalledTimes(1);

    const stopSetup = createService();
    const stoppedSource = createLiveTournamentSource({
      service: stopSetup.service,
      documentTarget: null,
      windowTarget: null,
    });
    const stoppedStart = stoppedSource.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '456' });
    stopSetup.emitBootstrap(null, false, 0);
    await stoppedStart;

    stoppedSource.stop();
    stoppedSource.stop();

    expect(stopSetup.parentUnsubscribers[0]).toHaveBeenCalledTimes(1);
    expect(stoppedSource.getState()).toMatchObject({ status: 'idle', record: null });

    stopSetup.emitBootstrap(wrapperRecord, true, 0);
    expect(stopSetup.service.subscribePath).not.toHaveBeenCalled();
    expect(stopSetup.parentUnsubscribers[0]).toHaveBeenCalledTimes(1);
  });

  it('settles a pending start and ignores its late snapshot when switching targets', async () => {
    const setup = createService();
    const states = [];
    const source = createLiveTournamentSource({
      service: setup.service,
      documentTarget: null,
      windowTarget: null,
      onState: (nextState) => states.push(nextState),
    });

    const firstStart = source.start({ type: 'firebase', ownerUid: 'owner-a', tournamentId: '111' });
    const secondStart = source.start({ type: 'firebase', ownerUid: 'owner-b', tournamentId: '222' });

    await firstStart;
    expect(setup.parentUnsubscribers[0]).toHaveBeenCalledTimes(1);
    expect(setup.service.subscribe).toHaveBeenCalledTimes(2);

    setup.emitBootstrap({ ...wrapperRecord, name: 'Stale Cup' }, true, 0);
    expect(states.filter(({ status }) => status === 'ready')).toHaveLength(0);
    expect(setup.service.subscribePath).not.toHaveBeenCalled();

    setup.emitBootstrap({ ...wrapperRecord, name: 'Current Cup' }, true, 1);
    await secondStart;

    expect(states.filter(({ status }) => status === 'ready')).toHaveLength(1);
    expect(source.getState().record).toMatchObject({ name: 'Current Cup', _ownerUid: 'owner-b' });
    expect(setup.parentUnsubscribers[0]).toHaveBeenCalledTimes(1);
    expect(setup.parentUnsubscribers[1]).toHaveBeenCalledTimes(1);
  });

  it('cleans the parent and installed children when a child subscription throws synchronously', async () => {
    const error = new Error('child subscribe failed');
    const parentUnsubscribe = vi.fn();
    const firstChildUnsubscribe = vi.fn();
    let childSubscriptionCount = 0;
    const service = {
      subscribe: vi.fn((_ownerUid, _tournamentId, callback) => {
        callback(snapshot(wrapperRecord));
        return parentUnsubscribe;
      }),
      subscribePath: vi.fn(() => {
        childSubscriptionCount++;
        if (childSubscriptionCount === 1) return firstChildUnsubscribe;
        throw error;
      }),
    };
    const states = [];
    const source = createLiveTournamentSource({
      service,
      documentTarget: null,
      windowTarget: null,
      onState: (nextState) => states.push(nextState),
    });

    await source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });

    expect(source.getState()).toMatchObject({ status: 'error', error });
    expect(service.subscribePath).toHaveBeenCalledTimes(2);
    expect(firstChildUnsubscribe).toHaveBeenCalledTimes(1);
    expect(parentUnsubscribe).toHaveBeenCalledTimes(1);

    source.stop();
    expect(parentUnsubscribe).toHaveBeenCalledTimes(1);
    expect(firstChildUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('ignores browser resume events, reloads explicitly, and cleans up idempotently', async () => {
    const setup = createService();
    const { service, emitBootstrap, parentUnsubscribers, pathUnsubscribers } = setup;
    const documentTarget = createEventTarget('hidden');
    const windowTarget = createEventTarget();
    const source = createLiveTournamentSource({ service, documentTarget, windowTarget });
    const started = source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    emitBootstrap();
    await started;
    const listenersPerLoad = pathUnsubscribers.length;

    documentTarget.dispatch('visibilitychange');
    windowTarget.dispatch('online');
    documentTarget.visibilityState = 'visible';
    documentTarget.dispatch('visibilitychange');

    expect(service.subscribe).toHaveBeenCalledTimes(1);
    expect(service.getOne).not.toHaveBeenCalled();
    expect(pathUnsubscribers).toHaveLength(listenersPerLoad);
    expect(pathUnsubscribers.every((unsubscribe) => unsubscribe.mock.calls.length === 0)).toBe(true);

    const reloaded = source.reload();
    expect(service.subscribe).toHaveBeenCalledTimes(2);
    expect(
      pathUnsubscribers.slice(0, listenersPerLoad).every((unsubscribe) => unsubscribe.mock.calls.length === 1),
    ).toBe(true);
    emitBootstrap(wrapperRecord, true, 1);
    await reloaded;
    expect(pathUnsubscribers).toHaveLength(listenersPerLoad * 2);

    source.stop();
    source.stop();
    expect(parentUnsubscribers.every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(true);
    expect(pathUnsubscribers.every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(true);
    expect(source.getState()).toMatchObject({ status: 'idle', record: null });
  });

  it('reports subscription errors and ignores late snapshots after stop', async () => {
    const { service, callbacks, errorCallbacks, emitBootstrap } = createService();
    const source = createLiveTournamentSource({ service, documentTarget: null, windowTarget: null });
    const started = source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    emitBootstrap();
    await started;

    const error = new Error('listener denied');
    errorCallbacks.get('main/games')(error);
    expect(source.getState()).toMatchObject({ status: 'error', error });

    const lateGames = callbacks.get('main/games');
    source.stop();
    lateGames(snapshot([[{ team_1_score: 13 }]]));
    expect(source.getState()).toMatchObject({ status: 'idle', record: null });
  });

  it('keeps a child cancellation error terminal until an explicit reload recovers', async () => {
    const setup = createService();
    const states = [];
    const source = createLiveTournamentSource({
      service: setup.service,
      documentTarget: null,
      windowTarget: null,
      onState: (nextState) => states.push(nextState),
    });
    const started = source.start({ type: 'firebase', ownerUid: 'owner', tournamentId: '123' });
    setup.emitBootstrap(wrapperRecord, true, 0);
    await started;

    const lateHealthySnapshot = setup.callbacks.get('main/games');
    const failedRunChildren = [...setup.pathUnsubscribers];
    const error = new Error('child listener cancelled');
    setup.errorCallbacks.get('main/games')(error);

    expect(source.getState()).toMatchObject({ status: 'error', error });
    expect(failedRunChildren.every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(true);
    const readyCountAfterError = states.filter(({ status }) => status === 'ready').length;

    lateHealthySnapshot(snapshot([[{ team_1_score: 13 }]]));

    expect(source.getState()).toMatchObject({ status: 'error', error });
    expect(states.filter(({ status }) => status === 'ready')).toHaveLength(readyCountAfterError);
    expect(failedRunChildren.every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(true);

    const reloaded = source.reload();
    expect(source.getState()).toMatchObject({ status: 'loading', error: null });
    setup.emitBootstrap({ ...wrapperRecord, name: 'Recovered Cup' }, true, 1);
    await reloaded;

    expect(source.getState()).toMatchObject({ status: 'ready', error: null });
    expect(source.getState().record.name).toBe('Recovered Cup');
    expect(failedRunChildren.every((unsubscribe) => unsubscribe.mock.calls.length === 1)).toBe(true);
  });
});
