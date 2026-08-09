import { describe, expect, it, vi } from 'vitest';

import { buildPublicTournamentSubscriptionPlan, createLiveTournamentSource } from '@/services/live-tournament';
import { normalizeTournamentRecord } from '@/services/tournament-record';

vi.mock('@/firebase', () => ({ database: {} }));

const VALUE = 'value';
const LAST_CHILD = 'last-child';
const FIRST_CHILD = 'first-child';

function normalizedGroupTournament(overrides = {}) {
  return normalizeTournamentRecord({
    name: 'Groups Cup',
    main: {
      system: 'groups',
      teams: [
        { title: 'Alpha', players: [{ club: 'North' }] },
        { title: 'Bravo', players: [{ club: 'South' }] },
        { title: 'Bye', players: [{ club: 'West' }] },
      ],
      games: [[{ team_1: 'Alpha', team_2: 'Bravo', group: 0 }]],
      preferences: { groupTotalRounds: 3 },
      roundIsActive: false,
      roundRobinCircle: 2,
      tournamentIsFinished: false,
      tournamentIsStarted: true,
      ...overrides,
    },
    tournamentB: null,
  });
}

function planKeys(plan) {
  return new Set(plan.map(({ path, selector = VALUE }) => `${path}|${selector}`));
}

function planPaths(plan) {
  return new Set(plan.map(({ path }) => path));
}

function snapshot(value, exists = value != null) {
  return {
    exists: () => exists,
    val: () => value,
  };
}

function sourceKey(source) {
  return `${source.ownerUid}/${source.tournamentId}`;
}

function readPath(record, path) {
  return path.split('/').reduce((current, segment) => current?.[segment], record) ?? null;
}

function lastChildValue(value) {
  if (value == null) return null;
  const entries = Object.entries(value).filter(([, child]) => child != null);
  if (!entries.length) return null;
  const [key, child] = entries.sort(([left], [right]) => Number(left) - Number(right)).at(-1);
  return { [key]: child };
}

function firstChildValue(value) {
  if (value == null) return null;
  const entries = Object.entries(value).filter(([, child]) => child != null);
  if (!entries.length) return null;
  const [key, child] = entries.sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))[0];
  return { [key]: child };
}

function createProjectionHarness() {
  let callback;
  let errorCallback;
  const unsubscribe = vi.fn();
  const service = {
    subscribe: vi.fn((_ownerUid, _tournamentId, next, onError) => {
      callback = next;
      errorCallback = onError;
      return unsubscribe;
    }),
  };

  return {
    service,
    unsubscribe,
    emitMissing() {
      callback(snapshot(null, false));
    },
    fail(error) {
      errorCallback(error);
    },
  };
}

function createPathHarness(fixtures) {
  const records = new Map(fixtures.map(({ source, record }) => [sourceKey(source), record]));
  const active = new Map();
  const activeParents = new Map();
  const registrations = [];
  const events = [];

  const registrationKey = (source, path, selector) => `${sourceKey(source)}:${path}|${selector}`;

  const service = {
    getOne: vi.fn(),
    subscribe: vi.fn((ownerUid, tournamentId, callback, errorCallback) => {
      const source = { ownerUid, tournamentId };
      const key = sourceKey(source);
      if (activeParents.has(key)) throw new Error(`Duplicate active parent registration: ${key}`);

      const registration = {
        source,
        callback,
        errorCallback,
        active: true,
        unsubscribe: null,
      };
      registration.unsubscribe = vi.fn(() => {
        if (!registration.active) return;
        registration.active = false;
        if (activeParents.get(key) === registration) activeParents.delete(key);
        events.push({ type: 'unsubscribe-parent', source: key });
      });
      activeParents.set(key, registration);
      events.push({ type: 'subscribe-parent', source: key });
      callback(snapshot(records.get(key)));
      return registration.unsubscribe;
    }),
    subscribePath: vi.fn((ownerUid, tournamentId, path, callback, errorCallback, options) => {
      const source = { ownerUid, tournamentId };
      const selector = options?.limitToLast === 1 ? LAST_CHILD : options?.limitToFirst === 1 ? FIRST_CHILD : VALUE;
      const key = registrationKey(source, path, selector);
      if (active.has(key)) throw new Error(`Duplicate active path registration: ${key}`);

      const registration = {
        source,
        path,
        selector,
        options,
        callback,
        errorCallback,
        active: true,
        unsubscribe: null,
      };
      registration.unsubscribe = vi.fn(() => {
        if (!registration.active) return;
        registration.active = false;
        if (active.get(key) === registration) active.delete(key);
        events.push({ type: 'unsubscribe', source: sourceKey(source), path, selector });
      });
      registrations.push(registration);
      active.set(key, registration);
      events.push({ type: 'subscribe', source: sourceKey(source), path, selector });

      const rawValue = readPath(records.get(sourceKey(source)), path);
      const selectedValue =
        selector === LAST_CHILD
          ? lastChildValue(rawValue)
          : selector === FIRST_CHILD
            ? firstChildValue(rawValue)
            : rawValue;
      callback(snapshot(selectedValue));
      return registration.unsubscribe;
    }),
  };

  function activeRegistration(source, path, selector = VALUE) {
    return active.get(registrationKey(source, path, selector));
  }

  return {
    service,
    events,
    recordFor: (source) => records.get(sourceKey(source)),
    activeRegistration,
    activeKeys: (source) =>
      new Set(
        [...active.values()]
          .filter((registration) => sourceKey(registration.source) === sourceKey(source))
          .map(({ path, selector }) => `${path}|${selector}`),
      ),
    registrationsFor: (source) =>
      registrations.filter((registration) => sourceKey(registration.source) === sourceKey(source)),
    emit(source, path, selector = VALUE) {
      const registration = activeRegistration(source, path, selector);
      if (!registration) throw new Error(`No active registration for ${path}|${selector}`);
      const rawValue = readPath(records.get(sourceKey(source)), path);
      const selectedValue =
        selector === LAST_CHILD
          ? lastChildValue(rawValue)
          : selector === FIRST_CHILD
            ? firstChildValue(rawValue)
            : rawValue;
      registration.callback(snapshot(selectedValue));
    },
    deliver(registration, value) {
      registration.callback(snapshot(value));
    },
  };
}

async function startCanonicalPublicSource(setup, target) {
  const projection = createProjectionHarness();
  const source = createLiveTournamentSource({
    service: setup.service,
    projectionService: projection.service,
    profile: 'public',
  });
  const started = source.start(target);
  projection.emitMissing();
  await started;
  return { source, projection };
}

function competitionData(record) {
  return record.main || record;
}

function transitionEvents(events, start) {
  const relevant = events.slice(start).filter(({ type }) => type === 'subscribe' || type === 'unsubscribe');
  return {
    subscribed: new Set(
      relevant.filter(({ type }) => type === 'subscribe').map(({ path, selector }) => `${path}|${selector}`),
    ),
    unsubscribed: new Set(
      relevant.filter(({ type }) => type === 'unsubscribe').map(({ path, selector }) => `${path}|${selector}`),
    ),
  };
}

describe('public phase-aware listener decisions', () => {
  it.each([
    ['round', { roundIsActive: true }, { hasGames: true }],
    ['cadrage', { cadrage: [{ team_1: 'Alpha', team_2: 'Bravo' }] }, { hasCadrage: true }],
    ['playoff', { playOff: [{ team_1: 'Alpha', team_2: 'Bravo' }] }, { hasPlayOff: true }],
    ['team playoff', { teamPlayoff: { size: 2, rounds: [] } }, { hasTeamPlayoff: true }],
    [
      'finished double elimination',
      { tournamentIsFinished: true, playOffBracket: { format: 'double', stages: [] } },
      { hasPlayOffBracket: true, playOffFormat: 'double' },
    ],
  ])('keeps exact team metadata and group-circle presentation data during %s', (_label, overrides, phaseSignals) => {
    const plan = buildPublicTournamentSubscriptionPlan(normalizedGroupTournament(overrides), {
      tab: 'round',
      group: 'A',
      phaseSignals,
    });
    const paths = planPaths(plan);

    expect(paths).toContain('main/teams');
    expect(paths).toContain('main/roundRobinCircle');
  });

  it('loads only the active round data owned by each public tab', () => {
    const record = normalizeTournamentRecord({
      name: 'Swiss Cup',
      main: {
        system: 'swiss',
        teams: [{ title: 'Alpha' }, { title: 'Bravo' }],
        games: [[{ team_1: 'Alpha', team_2: 'Bravo' }]],
        preferences: {},
        roundIsActive: true,
        streamPresets: { 0: ['https://example.test/stream'] },
      },
      tournamentB: null,
    });
    const build = (tab) =>
      planKeys(
        buildPublicTournamentSubscriptionPlan(record, {
          tab,
          group: 'A',
          phaseSignals: { hasGames: true },
        }),
      );

    const round = build('round');
    expect(round).toContain('main/games|last-child');
    expect(round).not.toContain('main/games|value');
    expect(round).toContain('main/roundTimer|value');
    expect(round).toContain('main/streamPresets|value');

    const ranking = build('ranking');
    expect(ranking).toContain('main/games|value');
    expect(ranking).toContain('main/useRating|value');
    expect(ranking).not.toContain('main/games|last-child');
    expect(ranking).not.toContain('main/roundTimer|value');
    expect(ranking).not.toContain('main/streamPresets|value');

    const results = build('results');
    expect(results).toContain('main/games|value');
    expect(results).toContain('main/streamPresets|value');
    expect(results).not.toContain('main/games|last-child');
    expect(results).not.toContain('main/roundTimer|value');
    expect(results).not.toContain('main/useRating|value');

    const teams = build('teams');
    expect(teams).toContain('main/games|value');
    expect(teams).toContain('main/useRating|value');
    expect(teams).not.toContain('main/games|last-child');
    expect(teams).not.toContain('main/roundTimer|value');
    expect(teams).not.toContain('main/streamPresets|value');
  });

  it('drops current-playoff listeners when only the bracket tab renders', () => {
    const record = normalizeTournamentRecord({
      name: 'Bracket Cup',
      main: {
        system: 'playoff',
        teams: [{ title: 'Alpha' }, { title: 'Bravo' }],
        games: [[{ team_1: 'Alpha', team_2: 'Bravo' }]],
        preferences: {},
        playOff: [{ team_1: 'Alpha', team_2: 'Bravo' }],
        playOffBracket: { format: 'double', stages: [] },
        playOffStage: 'upper-1',
      },
      tournamentB: null,
    });
    const keys = planKeys(
      buildPublicTournamentSubscriptionPlan(record, {
        tab: 'bracket',
        group: 'A',
        phaseSignals: { hasPlayOff: true, hasPlayOffBracket: true, playOffFormat: 'double' },
      }),
    );

    expect(keys).toContain('main/playOffBracket|value');
    expect(keys).toContain('main/teams|value');
    expect(keys).not.toContain('main/games|last-child');
    expect(keys).not.toContain('main/playOff|value');
    expect(keys).not.toContain('main/playOffStage|value');
    expect(keys).not.toContain('main/roundTimer|value');
    expect(keys).not.toContain('main/streamPresets|value');
  });

  it('keeps TIR fallback isolated from standard history and elimination payloads', () => {
    const record = normalizeTournamentRecord({
      name: 'TIR Cup',
      main: {
        system: 'tir',
        teams: [{ title: 'Shooter' }],
        preferences: {},
        tirConfig: { rounds: 2 },
        tirParticipants: [{ id: 1, name: 'Shooter' }],
        tirRound: 1,
        tirStarted: true,
      },
      tournamentB: null,
    });
    const keys = planKeys(
      buildPublicTournamentSubscriptionPlan(record, {
        tab: 'ranking',
        group: 'A',
        phaseSignals: { hasTirPlayoff: false },
      }),
    );

    expect(keys).toContain('main/tirParticipants|value');
    expect(keys).toContain('main/tirPlayoff|first-child');
    expect(keys).not.toContain('main/games|value');
    expect(keys).not.toContain('main/groups|value');
    expect(keys).not.toContain('main/playOff|value');
    expect(keys).not.toContain('main/playOffBracket|value');
    expect(keys).not.toContain('main/streamPresets|value');
  });

  it('loads playoff history without retaining round-only stage, timer, or stream listeners', () => {
    const record = normalizeTournamentRecord({
      name: 'History Cup',
      main: {
        system: 'swiss',
        teams: [{ title: 'Alpha' }, { title: 'Bravo' }],
        games: [[{ team_1: 'Alpha', team_2: 'Bravo' }]],
        preferences: {},
        playOff: [{ team_1: 'Alpha', team_2: 'Bravo' }],
        playOffStage: 2,
      },
      tournamentB: null,
    });
    const keys = planKeys(
      buildPublicTournamentSubscriptionPlan(record, {
        tab: 'ranking',
        group: 'A',
        phaseSignals: { hasPlayOff: true },
      }),
    );

    expect(keys).toContain('main/games|value');
    expect(keys).toContain('main/playOff|value');
    expect(keys).not.toContain('main/playOffStage|value');
    expect(keys).not.toContain('main/roundTimer|value');
    expect(keys).not.toContain('main/streamPresets|value');
  });
});

describe('public phase-aware canonical fallback runtime', () => {
  it('keeps the barrage start index needed by round presentation without loading the full barrage', async () => {
    const target = { type: 'firebase', ownerUid: 'owner', tournamentId: 'barrage-round' };
    const record = {
      name: 'Barrage Cup',
      main: {
        system: 'swiss',
        teams: [{ title: 'Alpha' }, { title: 'Bravo' }],
        games: [[{ team_1: 'Alpha', team_2: 'Bravo' }], [{ team_1: 'Alpha', team_2: 'Bravo', group: 0 }]],
        preferences: {},
        roundIsActive: true,
        tournamentIsFinished: false,
        tournamentIsStarted: true,
        barrage: {
          startIndex: 1,
          groups: [[{ title: 'Alpha' }, { title: 'Bravo' }]],
        },
      },
      tournamentB: null,
    };
    const setup = createPathHarness([{ source: target, record }]);
    const { source } = await startCanonicalPublicSource(setup, target);

    expect(competitionData(source.getState().record).barrage).toEqual({ startIndex: 1 });
    expect(setup.activeRegistration(target, 'main/barrage', FIRST_CHILD)).toBeDefined();
    expect(setup.activeRegistration(target, 'main/barrage', VALUE)).toBeUndefined();
  });

  it.each([
    ['cadrage', 'cadrage'],
    ['playoff', 'playOff'],
  ])(
    'discovers a markerless %s from its first child and removes its payload when the phase disappears',
    async (_label, field) => {
      const target = { type: 'firebase', ownerUid: 'owner', tournamentId: `markerless-${field}` };
      const record = {
        name: 'Markerless Cup',
        main: {
          system: 'swiss',
          teams: [{ title: 'Alpha' }, { title: 'Bravo' }],
          games: [[{ team_1: 'Alpha', team_2: 'Bravo' }]],
          preferences: {},
          roundIsActive: true,
          tournamentIsFinished: false,
          tournamentIsStarted: true,
        },
        tournamentB: null,
      };
      const setup = createPathHarness([{ source: target, record }]);
      const { source } = await startCanonicalPublicSource(setup, target);
      const markerPath = `main/${field}`;
      const payloadPath = `main/${field}`;

      expect(source.getState()).toMatchObject({
        status: 'ready',
        dataSource: 'legacy',
        projection: { status: 'fallback', reason: 'missing' },
      });
      expect(setup.activeRegistration(target, markerPath, FIRST_CHILD)?.options).toEqual({ limitToFirst: 1 });
      expect(setup.activeRegistration(target, payloadPath)).toBeUndefined();

      record.main[field] = [{ team_1: 'Alpha', team_2: 'Bravo' }];
      setup.emit(target, markerPath, FIRST_CHILD);

      const phaseRegistration = setup.activeRegistration(target, payloadPath);
      expect(phaseRegistration).toBeDefined();
      expect(competitionData(source.getState().record)[field]).toEqual(record.main[field]);
      expect(setup.activeRegistration(target, 'main/games', LAST_CHILD)?.options).toEqual({ limitToLast: 1 });

      record.main[field] = null;
      setup.emit(target, markerPath, FIRST_CHILD);

      expect(phaseRegistration.unsubscribe).toHaveBeenCalledTimes(1);
      expect(setup.activeRegistration(target, payloadPath)).toBeUndefined();
      expect(competitionData(source.getState().record)[field]).toBeNull();
    },
  );

  it('promotes and demotes tab listeners without churning shared presentation data', async () => {
    const target = { type: 'firebase', ownerUid: 'owner', tournamentId: 'tab-transition' };
    const record = {
      name: 'Tab Cup',
      main: {
        system: 'swiss',
        teams: [
          { title: 'Alpha', players: [{ club: 'North' }] },
          { title: 'Bravo', players: [{ club: 'South' }] },
          { title: 'Bye', players: [{ club: 'West' }] },
        ],
        games: [[{ team_1: 'Alpha', team_2: 'Bye' }], [{ team_1: 'Alpha', team_2: 'Bravo' }]],
        preferences: {},
        roundIsActive: true,
        roundTimer: { timerStatus: 'running' },
        tournamentIsFinished: false,
        tournamentIsStarted: true,
        useRating: true,
        streamPresets: { 0: ['https://example.test/stream'] },
      },
      tournamentB: null,
    };
    const setup = createPathHarness([{ source: target, record }]);
    const { source } = await startCanonicalPublicSource(setup, target);

    expect(setup.service.subscribe).not.toHaveBeenCalled();
    const limitedGames = setup.activeRegistration(target, 'main/games', LAST_CHILD);
    const teams = setup.activeRegistration(target, 'main/teams');
    expect(limitedGames?.options).toEqual({ limitToLast: 1 });
    expect(setup.activeRegistration(target, 'main/games', VALUE)).toBeUndefined();
    expect(competitionData(source.getState().record).games).toHaveLength(2);
    expect(competitionData(source.getState().record).games[0]).toBeUndefined();
    expect(competitionData(source.getState().record).games[1]).toEqual(record.main.games[1]);
    expect(competitionData(source.getState().record).teams).toEqual(record.main.teams);

    const promotionStart = setup.events.length;
    await source.setSelection({ tab: 'ranking', group: 'A' });
    const promotion = transitionEvents(setup.events, promotionStart);

    expect(promotion.unsubscribed).toEqual(
      new Set(['main/games|last-child', 'main/roundTimer|value', 'main/streamPresets|value']),
    );
    expect(promotion.subscribed).toEqual(new Set(['main/games|value', 'main/useRating|value']));
    expect(setup.activeRegistration(target, 'main/games', LAST_CHILD)).toBeUndefined();
    expect(setup.activeRegistration(target, 'main/games', VALUE)).toBeDefined();
    expect(teams.unsubscribe).not.toHaveBeenCalled();
    expect(competitionData(source.getState().record).games).toEqual(record.main.games);

    const unchangedStart = setup.events.length;
    await source.setSelection({ tab: 'ranking', group: 'A' });
    expect(setup.events).toHaveLength(unchangedStart);

    const fullGames = setup.activeRegistration(target, 'main/games', VALUE);
    const demotionStart = setup.events.length;
    await source.setSelection({ tab: 'round', group: 'A' });
    const demotion = transitionEvents(setup.events, demotionStart);

    expect(demotion.unsubscribed).toEqual(new Set(['main/games|value', 'main/useRating|value']));
    expect(demotion.subscribed).toEqual(
      new Set(['main/games|last-child', 'main/roundTimer|value', 'main/streamPresets|value']),
    );
    expect(fullGames.unsubscribe).toHaveBeenCalledTimes(1);
    expect(teams.unsubscribe).not.toHaveBeenCalled();

    const stateAfterDemotion = source.getState();
    setup.deliver(fullGames, { 0: [[{ team_1: 'Stale', team_2: 'History' }]] });
    expect(source.getState()).toBe(stateAfterDemotion);

    source.stop();
    source.stop();
    expect(setup.activeKeys(target)).toEqual(new Set());
    expect(setup.registrationsFor(target).every(({ unsubscribe }) => unsubscribe.mock.calls.length === 1)).toBe(true);
  });

  it.each([
    [
      'envelope',
      'main/',
      'tournamentB',
      {
        name: 'Envelope A/B',
        main: {
          system: 'swiss',
          teams: [{ title: 'A One' }, { title: 'A Two' }],
          games: [[{ team_1: 'A One', team_2: 'A Two' }]],
          preferences: {},
          roundIsActive: true,
          tournamentIsFinished: false,
          tournamentIsStarted: true,
        },
        tournamentB: {
          games: [[{ team_1: 'B One', team_2: 'B Two' }]],
          preferences: {},
        },
      },
    ],
    [
      'legacy',
      '',
      'groupB',
      {
        name: 'Legacy A/B',
        system: 'swiss',
        teams: [{ title: 'A One' }, { title: 'A Two' }],
        games: [[{ team_1: 'A One', team_2: 'A Two' }]],
        preferences: {},
        roundIsActive: true,
        tournamentIsFinished: false,
        tournamentIsStarted: true,
        groupB: {
          games: [[{ team_1: 'B One', team_2: 'B Two' }]],
          preferences: {},
        },
      },
    ],
  ])(
    'detects a games-only partial B for %s records and transfers its full node only while selected',
    async (_label, prefix, node, record) => {
      const target = { type: 'firebase', ownerUid: 'owner', tournamentId: `partial-b-${_label}` };
      const setup = createPathHarness([{ source: target, record }]);
      const { source } = await startCanonicalPublicSource(setup, target);

      expect(competitionData(source.getState().record).teams).toEqual(record.main?.teams || record.teams);
      expect(source.getState().record[node]).not.toBeNull();
      expect(setup.activeRegistration(target, node)).toBeUndefined();

      await source.setSelection({ tab: 'round', group: 'B' });

      const groupB = setup.activeRegistration(target, node);
      expect(groupB).toBeDefined();
      expect(setup.activeRegistration(target, `${prefix}games`, LAST_CHILD)).toBeUndefined();
      expect(source.getState().record[node].games).toEqual(record[node].games);

      record[node] = null;
      setup.emit(target, node);

      expect(groupB.unsubscribe).toHaveBeenCalledTimes(1);
      expect(source.getState().record[node]).toBeNull();
      expect(setup.activeRegistration(target, node)).toBeUndefined();
      expect(setup.activeRegistration(target, `${prefix}games`, LAST_CHILD)).toBeDefined();
      expect(setup.activeRegistration(target, `${prefix}teams`)).toBeDefined();

      await source.setSelection({ tab: 'round', group: 'A' });
      expect(setup.activeRegistration(target, node)).toBeUndefined();
    },
  );
});
