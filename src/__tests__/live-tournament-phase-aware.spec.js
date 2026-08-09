import { describe, expect, it, vi } from 'vitest';

import {
  LIVE_TOURNAMENT_SELECTOR,
  PUBLIC_DISCOVERY_PLAN,
  applyTournamentSnapshot,
  buildPublicTournamentSubscriptionPlan,
  createLiveTournamentSource,
} from '@/services/live-tournament';
import { normalizeTournamentRecord } from '@/services/tournament-record';

vi.mock('@/firebase', () => ({ database: {} }));

const VALUE = 'value';
const LAST_CHILD = 'last-child';

// Keep the expected manifests centralized: the individual cases below should
// describe product behavior, not repeat long path lists.
const EXPECTED_DISCOVERY_PLAN = [
  { path: 'main/system', selector: VALUE },
  { path: 'name', selector: VALUE },
  { path: 'system', selector: VALUE },
  { path: 'tournamentMessage', selector: VALUE },
];

const STANDARD_SHELL_FIELDS = [
  'playoff',
  'preferences',
  'roundIsActive',
  'system',
  'tournamentIsFinished',
  'tournamentIsStarted',
];

// These scalar paths detect phase changes without transferring an inactive
// cadrage or playoff subtree.
const STANDARD_PHASE_PROBES = [
  'barrage/startIndex',
  'cadrage/0/stage',
  'playOff/0/stage',
  'playOffBracket/format',
  'playOffBracket/stages/0/stageLabel',
  'teamPlayoff/size',
];

const ROUND_FIELDS = [{ field: 'games', selector: LAST_CHILD }, 'roundTimer', 'streamPresets'];

const GROUP_B_PROBE_FIELDS = ['isTournamentB', 'system', 'teams/0/title'];

const PHASE_SIGNALS = Object.freeze({
  rounds: Object.freeze({ hasGames: true }),
  cadrage: Object.freeze({ hasCadrage: true }),
  singlePlayoff: Object.freeze({ hasPlayOff: true }),
  doublePlayoff: Object.freeze({ hasPlayOffBracket: true, playOffFormat: 'double' }),
  teamPlayoff: Object.freeze({ hasTeamPlayoff: true }),
  tir: Object.freeze({ tirStarted: true }),
  tirPlayoff: Object.freeze({ tirStarted: true, hasTirPlayoff: true }),
});

function envelopeCompetition(system = 'swiss', overrides = {}) {
  return normalizeTournamentRecord({
    name: 'Envelope Cup',
    tournamentMessage: 'Envelope message',
    activeGroup: 'A',
    main: {
      system,
      teams: [],
      games: [],
      preferences: {},
      ...overrides,
    },
    tournamentB: null,
  });
}

function legacyCompetition(system = 'swiss', overrides = {}) {
  return normalizeTournamentRecord({
    name: 'Legacy Cup',
    tournamentMessage: 'Legacy message',
    activeGroup: 'A',
    system,
    teams: [],
    games: [],
    preferences: {},
    ...overrides,
  });
}

function compactPlan(plan) {
  return plan
    .map(({ path, selector = VALUE }) => ({ path, selector }))
    .sort((left, right) => `${left.path}:${left.selector}`.localeCompare(`${right.path}:${right.selector}`));
}

function valuePath(path) {
  return { path, selector: VALUE };
}

function competitionEntries(prefix, fields) {
  return fields.map((definition) => {
    const { field, selector = VALUE } = typeof definition === 'string' ? { field: definition } : definition;
    return { path: `${prefix}${field}`, selector };
  });
}

function groupBProbeEntries(node) {
  return GROUP_B_PROBE_FIELDS.map((field) => valuePath(`${node}/${field}`));
}

function standardPlan(prefix, groupBNode, fields = []) {
  return [
    ...competitionEntries(prefix, [...STANDARD_SHELL_FIELDS, ...STANDARD_PHASE_PROBES, ...fields]),
    ...groupBProbeEntries(groupBNode),
  ];
}

function buildPlan(record, options = {}) {
  return buildPublicTournamentSubscriptionPlan(record, {
    tab: 'round',
    group: 'A',
    phaseSignals: PHASE_SIGNALS.rounds,
    ...options,
  });
}

function expectExactPlan(actual, expected) {
  expect(compactPlan(actual)).toEqual(compactPlan(expected));
}

function mergePlans(...plans) {
  const merged = new Map();
  for (const entry of plans.flat()) {
    merged.set(`${entry.path}|${entry.selector || VALUE}`, entry);
  }
  return [...merged.values()];
}

function pathSnapshot(value) {
  return {
    exists: () => value != null,
    val: () => value,
  };
}

function sourceKey(source) {
  return `${source.ownerUid}/${source.tournamentId}`;
}

function readPath(record, path) {
  const value = path.split('/').reduce((current, segment) => current?.[segment], record);
  return value ?? null;
}

function lastChildValue(value) {
  if (value == null) return null;
  const entries = Object.entries(value).filter(([, child]) => child != null);
  if (!entries.length) return null;
  const [key, child] = entries.sort(([left], [right]) => Number(left) - Number(right)).at(-1);
  return { [key]: child };
}

function createSynchronousPathService(fixtures, { allowParent = false, deferredPaths = [] } = {}) {
  const records = new Map(fixtures.map(({ source, record }) => [sourceKey(source), record]));
  const deferredPathSet = new Set(deferredPaths);
  const active = new Map();
  const activeParents = new Map();
  const registrations = [];
  const events = [];

  const registrationKey = (source, path, selector) => `${sourceKey(source)}:${path}|${selector}`;

  const service = {
    getOne: vi.fn(),
    subscribe: vi.fn((ownerUid, tournamentId, callback, errorCallback) => {
      if (!allowParent) {
        throw new Error('The phase-aware path harness does not permit a full parent subscription');
      }
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
      callback(pathSnapshot(records.get(key)));
      return registration.unsubscribe;
    }),
    subscribePath: vi.fn((ownerUid, tournamentId, path, callback, errorCallback, options) => {
      const source = { ownerUid, tournamentId };
      const selector = options?.limitToLast === 1 ? LAST_CHILD : VALUE;
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
      if (!deferredPathSet.has(path)) {
        callback(pathSnapshot(selector === LAST_CHILD ? lastChildValue(rawValue) : rawValue));
      }
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
    setRecord: (source, record) => records.set(sourceKey(source), record),
    activePlan: (source) =>
      [...active.values()]
        .filter((registration) => sourceKey(registration.source) === sourceKey(source))
        .map(({ path, selector }) => ({ path, selector })),
    registrationsFor: (source) =>
      registrations.filter((registration) => sourceKey(registration.source) === sourceKey(source)),
    activeRegistration,
    parentRegistration: (source) => activeParents.get(sourceKey(source)),
    emitParent(source) {
      const registration = activeParents.get(sourceKey(source));
      if (!registration) throw new Error(`No active parent registration for ${sourceKey(source)}`);
      registration.callback(pathSnapshot(records.get(sourceKey(source))));
    },
    emit(source, path, selector = VALUE) {
      const registration = activeRegistration(source, path, selector);
      if (!registration) throw new Error(`No active registration for ${path}|${selector}`);
      const rawValue = readPath(records.get(sourceKey(source)), path);
      registration.callback(pathSnapshot(selector === LAST_CHILD ? lastChildValue(rawValue) : rawValue));
    },
    deliver(registration, value) {
      registration.callback(pathSnapshot(value));
    },
    fail(registration, error) {
      registration.errorCallback(error);
    },
  };
}

function liveEnvelopeRecord(name = 'Live Envelope', overrides = {}) {
  return {
    name,
    tournamentMessage: 'Live message',
    activeGroup: 'A',
    main: {
      system: 'swiss',
      preferences: {},
      roundIsActive: true,
      roundTimer: { startedAt: 10 },
      tournamentIsFinished: false,
      tournamentIsStarted: true,
      games: [[{ team_1: 'A', team_2: 'B', team_1_score: 13, team_2_score: 8 }], [{ team_1: 'C', team_2: 'D' }]],
      teams: [{ title: 'A' }, { title: 'B' }, { title: 'C' }, { title: 'D' }],
      ...overrides,
    },
    tournamentB: null,
  };
}

function liveLegacyRecord(name = 'Live Legacy', overrides = {}) {
  return {
    name,
    tournamentMessage: 'Legacy message',
    activeGroup: 'A',
    system: 'swiss',
    preferences: {},
    roundIsActive: true,
    roundTimer: { startedAt: 20 },
    tournamentIsFinished: false,
    tournamentIsStarted: true,
    games: [[{ team_1: 'One', team_2: 'Two' }]],
    teams: [{ title: 'One' }, { title: 'Two' }],
    groupB: null,
    ...overrides,
  };
}

describe('public discovery manifest', () => {
  it('uses the two stable selector values', () => {
    expect(new Set(Object.values(LIVE_TOURNAMENT_SELECTOR))).toEqual(new Set([VALUE, LAST_CHILD]));
  });

  it('discovers metadata and persisted format through exact scalar paths', () => {
    expectExactPlan(PUBLIC_DISCOVERY_PLAN, EXPECTED_DISCOVERY_PLAN);
  });
});

describe('phase-aware public subscription plans', () => {
  it.each([
    ['envelope', envelopeCompetition(), 'main/', 'tournamentB'],
    ['legacy', legacyCompetition(), '', 'groupB'],
  ])('builds the exact %s Swiss current-round plan', (_label, record, prefix, groupBNode) => {
    const plan = buildPlan(record);

    expectExactPlan(plan, standardPlan(prefix, groupBNode, ROUND_FIELDS));
    expect(compactPlan(plan)).not.toEqual(
      expect.arrayContaining([
        valuePath(`${prefix}playOff`),
        valuePath(`${prefix}playOffBracket`),
        valuePath(`${prefix}teamPlayoff`),
        valuePath(`${prefix}tirParticipants`),
        valuePath(`${prefix}tirPlayoff`),
      ]),
    );
  });

  it.each([
    ['groups', ['roundRobinCircle']],
    ['poules', []],
    ['supermele', []],
  ])('adds only the %s current-round system fields', (system, systemFields) => {
    const record = envelopeCompetition(system, {
      groups: systemFields.includes('groups') ? [[{ title: 'One' }, { title: 'Two' }]] : undefined,
    });

    expectExactPlan(buildPlan(record), standardPlan('main/', 'tournamentB', [...ROUND_FIELDS, ...systemFields]));
  });

  it('loads active cadrage plus only the latest standard round context', () => {
    const record = envelopeCompetition('swiss', {
      games: [[{ team_1: 'A', team_2: 'B' }]],
      cadrage: [{ stage: 'cadrage', team_1: 'C', team_2: 'D' }],
    });

    expectExactPlan(
      buildPlan(record, { phaseSignals: PHASE_SIGNALS.cadrage }),
      standardPlan('main/', 'tournamentB', [
        { field: 'games', selector: LAST_CHILD },
        'cadrage',
        'roundTimer',
        'streamPresets',
      ]),
    );
  });

  it('loads the active single-elimination payload without standard history', () => {
    const record = envelopeCompetition('swiss', {
      games: [[{ team_1: 'A', team_2: 'B' }]],
      cadrage: [{ stage: 'cadrage', team_1: 'I', team_2: 'J' }],
      playOff: [{ stage: 4, team_1: 'A', team_2: 'H' }],
      playOffBracket: { format: 'single', stages: [] },
      playOffStage: 4,
    });
    const expectedFields = [
      { field: 'games', selector: LAST_CHILD },
      'cadrage',
      'playOff',
      'playOffBracket',
      'playOffStage',
      'roundTimer',
      'streamPresets',
    ];

    expectExactPlan(
      buildPlan(record, { phaseSignals: { ...PHASE_SIGNALS.singlePlayoff, hasCadrage: true } }),
      standardPlan('main/', 'tournamentB', expectedFields),
    );
    expect(
      compactPlan(buildPlan(record, { phaseSignals: { ...PHASE_SIGNALS.singlePlayoff, hasCadrage: true } })),
    ).not.toContainEqual({ path: 'main/games', selector: VALUE });
  });

  it('loads the active double-elimination bracket without standard history', () => {
    const record = legacyCompetition('playoff', {
      playOff: [{ stage: 'upper-1', team_1: 'A', team_2: 'H' }],
      playOffBracket: { format: 'double', participantCount: 8, stages: [] },
      playOffStage: 'upper-1',
    });
    const expectedFields = [
      { field: 'games', selector: LAST_CHILD },
      'playOff',
      'playOffBracket',
      'playOffStage',
      'roundTimer',
      'streamPresets',
    ];

    expectExactPlan(
      buildPlan(record, { phaseSignals: PHASE_SIGNALS.doublePlayoff }),
      standardPlan('', 'groupB', expectedFields),
    );
  });

  it('keeps latest-round and cadrage context for a finished double-elimination round view', () => {
    const record = envelopeCompetition('swiss', {
      games: [[{ team_1: 'A', team_2: 'B' }]],
      cadrage: [{ stage: 'cadrage', team_1: 'C', team_2: 'D' }],
      playOffBracket: { format: 'double', participantCount: 8, stages: [] },
      tournamentIsFinished: true,
    });

    expectExactPlan(
      buildPlan(record, {
        phaseSignals: { hasCadrage: true, hasPlayOffBracket: true, playOffFormat: 'double' },
      }),
      standardPlan('main/', 'tournamentB', [
        { field: 'games', selector: LAST_CHILD },
        'cadrage',
        'playOffBracket',
        'streamPresets',
        'teams',
      ]),
    );
  });

  it('loads team playoff instead of standard or TIR playoff payloads', () => {
    const record = envelopeCompetition('groups', {
      teamPlayoff: { size: 8, rounds: [{ matches: [] }] },
    });

    expectExactPlan(
      buildPlan(record, { phaseSignals: PHASE_SIGNALS.teamPlayoff }),
      standardPlan('main/', 'tournamentB', [{ field: 'games', selector: LAST_CHILD }, 'teamPlayoff']),
    );
  });

  it.each([
    ['TIR scoring', PHASE_SIGNALS.tir, false],
    ['TIR playoff', PHASE_SIGNALS.tirPlayoff, true],
  ])('builds an exact %s plan and excludes standard history/group payloads', (_label, phaseSignals, hasPlayoff) => {
    const record = envelopeCompetition('tir', {
      tirStarted: true,
      tirConfig: { junior: false, rounds: 2 },
      tirRound: 2,
      tirParticipants: [{ id: 'one', name: 'One', scores: {} }],
      tirR2Participants: ['one'],
      tirTiebreakerCount: 1,
      tirPlayoff: hasPlayoff ? { size: 2, rounds: [] } : null,
    });
    const tirFields = [
      'preferences',
      'system',
      'teams',
      'tirConfig',
      'tirParticipants',
      'tirR2Participants',
      'tirRound',
      'tirStarted',
      'tirTiebreakerCount',
      'tournamentIsFinished',
      'tournamentIsStarted',
      ...(hasPlayoff ? ['tirPlayoff'] : ['tirPlayoff/size']),
    ];

    expectExactPlan(buildPlan(record, { phaseSignals }), [
      ...competitionEntries('main/', tirFields),
      ...groupBProbeEntries('tournamentB'),
    ]);

    const paths = compactPlan(buildPlan(record, { phaseSignals })).map(({ path }) => path);
    for (const excluded of [
      'main/games',
      'main/groups',
      'main/groupSchedule',
      'main/cadrage',
      'main/barrage',
      'main/playOff',
      'main/playOffBracket',
      'main/teamPlayoff',
      'main/roundTimer',
      'main/streamPresets',
    ]) {
      expect(paths).not.toContain(excluded);
    }
  });
});

describe('tab-driven promotion', () => {
  const record = envelopeCompetition('swiss', {
    games: [[{ team_1: 'A', team_2: 'B' }]],
    teams: [{ title: 'A' }, { title: 'B' }],
    useRating: true,
  });

  it('promotes Ranking to full games history and detailed teams', () => {
    expectExactPlan(
      buildPlan(record, { tab: 'ranking' }),
      standardPlan('main/', 'tournamentB', [
        { field: 'games', selector: VALUE },
        'roundTimer',
        'streamPresets',
        'teams',
        'useRating',
      ]),
    );
  });

  it('promotes Results to full games history, stream presets, and team labels', () => {
    expectExactPlan(
      buildPlan(record, { tab: 'results' }),
      standardPlan('main/', 'tournamentB', [
        { field: 'games', selector: VALUE },
        'roundTimer',
        'streamPresets',
        'teams',
      ]),
    );
  });

  it('promotes Teams to full history and detailed teams', () => {
    expectExactPlan(
      buildPlan(record, { tab: 'teams' }),
      standardPlan('main/', 'tournamentB', [
        { field: 'games', selector: VALUE },
        'roundTimer',
        'streamPresets',
        'teams',
        'useRating',
      ]),
    );
  });

  it('adds group ranking history without changing games back to a latest-child selector', () => {
    const groups = envelopeCompetition('groups', {
      groups: [[{ title: 'A' }, { title: 'B' }]],
      groupSchedule: [[{ team_1: 'A', team_2: 'B', group: 0 }]],
      roundRobinCircle: 2,
    });

    expectExactPlan(
      buildPlan(groups, { tab: 'ranking' }),
      standardPlan('main/', 'tournamentB', [
        { field: 'games', selector: VALUE },
        'roundTimer',
        'streamPresets',
        'teams',
        'useRating',
        'groups',
        'groupSchedule',
        'roundRobinCircle',
      ]),
    );
  });
});

describe('lazy Group B plans', () => {
  it.each([
    [
      'envelope',
      normalizeTournamentRecord({
        name: 'Envelope A/B',
        main: { system: 'swiss', teams: [], games: [], preferences: {} },
        tournamentB: { isTournamentB: true, system: 'swiss', teams: [{ title: 'B1' }], games: [] },
      }),
      'tournamentB',
    ],
    [
      'legacy',
      normalizeTournamentRecord({
        name: 'Legacy A/B',
        system: 'swiss',
        teams: [],
        games: [],
        preferences: {},
        groupB: { teams: [{ title: 'B1' }] },
      }),
      'groupB',
    ],
  ])('subscribes the full %s B node only after B is selected', (_label, record, node) => {
    const unselected = compactPlan(buildPlan(record));
    expect(unselected.filter(({ path }) => path === node || path.startsWith(`${node}/`))).toEqual(
      compactPlan(groupBProbeEntries(node)),
    );
    expect(unselected).not.toContainEqual(valuePath(node));

    expectExactPlan(buildPlan(record, { group: 'B' }), [valuePath(node)]);
  });
});

describe('latest-round snapshot application', () => {
  const latestGamesSubscription = {
    path: 'main/games',
    kind: 'group-field',
    group: 'A',
    field: 'games',
    selector: LAST_CHILD,
  };

  it('reconstructs a sparse latest round as array-compatible games without mutating the record', () => {
    const record = envelopeCompetition('swiss');
    const game = { team_1: 'One', team_2: 'Two', team_1_score: 3, team_2_score: 2 };

    const next = applyTournamentSnapshot(record, latestGamesSubscription, { 4: [game] }, 'phase-aware');

    expect(next).not.toBe(record);
    expect(record.main.games).toEqual([]);
    expect(Array.isArray(next.main.games)).toBe(true);
    expect(next.main.games).toHaveLength(5);
    expect(next.main.games[4]).toEqual([game]);
  });

  it('normalizes a null latest-round snapshot to an empty games array', () => {
    const record = envelopeCompetition('swiss', { games: [[{ team_1: 'Old', team_2: 'Round' }]] });

    const next = applyTournamentSnapshot(record, latestGamesSubscription, null, 'phase-aware');

    expect(next.main.games).toEqual([]);
    expect(record.main.games).toHaveLength(1);
  });

  it.each([
    ['missing', null, {}],
    ['partial', { timeLimit: 30 }, { timeLimit: 30 }],
  ])('reapplies normalized defaults for a %s preferences snapshot', (_label, value, expected) => {
    const record = envelopeCompetition('swiss');
    const subscription = {
      path: 'main/preferences',
      kind: 'group-field',
      group: 'A',
      field: 'preferences',
      selector: VALUE,
    };

    const next = applyTournamentSnapshot(record, subscription, value, 'phase-aware');

    expect(next.main.preferences).toMatchObject({ maxScore: 13, fieldsStart: 1, playOffTeams: 8, ...expected });
  });
});

describe('createLiveTournamentSource phase-aware runtime', () => {
  it('discovers a normal envelope through exact path listeners and limits the active round to one child', async () => {
    const target = { type: 'firebase', ownerUid: 'owner', tournamentId: 'envelope' };
    const setup = createSynchronousPathService([{ source: target, record: liveEnvelopeRecord() }]);
    const source = createLiveTournamentSource({ service: setup.service, profile: 'public' });

    await source.start(target);

    expect(setup.service.subscribe).not.toHaveBeenCalled();
    expect(setup.service.getOne).not.toHaveBeenCalled();
    expectExactPlan(
      setup.activePlan(target),
      mergePlans(EXPECTED_DISCOVERY_PLAN, standardPlan('main/', 'tournamentB', ROUND_FIELDS)),
    );

    const games = setup.activeRegistration(target, 'main/games', LAST_CHILD);
    expect(games).toMatchObject({ options: { limitToLast: 1 } });
    expect(setup.activeRegistration(target, 'main/games', VALUE)).toBeUndefined();
    expect(setup.service.subscribePath).toHaveBeenCalledWith(
      'owner',
      'envelope',
      'main/games',
      expect.any(Function),
      expect.any(Function),
      { limitToLast: 1 },
    );
    expect(source.getState()).toMatchObject({ status: 'ready' });
    expect(source.getState().record.main.games).toHaveLength(2);
    expect(source.getState().record.main.games[1]).toEqual([{ team_1: 'C', team_2: 'D' }]);
  });

  it('retains the parent fallback for a missing record, then hands live creation back to exact path listeners', async () => {
    const target = { type: 'firebase', ownerUid: 'owner', tournamentId: 'created-later' };
    const setup = createSynchronousPathService([{ source: target, record: null }], { allowParent: true });
    const source = createLiveTournamentSource({ service: setup.service, profile: 'public' });

    await source.start(target);

    expect(source.getState()).toMatchObject({ status: 'missing', record: null });
    expect(setup.parentRegistration(target)).toBeDefined();
    expectExactPlan(setup.activePlan(target), EXPECTED_DISCOVERY_PLAN);

    setup.setRecord(target, liveEnvelopeRecord('Created Live'));
    setup.emitParent(target);

    expect(source.getState()).toMatchObject({ status: 'ready' });
    expect(source.getState().record.name).toBe('Created Live');
    const parent = setup.parentRegistration(target);
    expect(parent).toBeDefined();

    for (const entry of PUBLIC_DISCOVERY_PLAN) setup.emit(target, entry.path);

    expect(parent.unsubscribe).toHaveBeenCalledTimes(1);
    expect(setup.parentRegistration(target)).toBeUndefined();
    expectExactPlan(
      setup.activePlan(target),
      mergePlans(EXPECTED_DISCOVERY_PLAN, standardPlan('main/', 'tournamentB', ROUND_FIELDS)),
    );
  });

  it.each(['ranking', 'teams'])(
    'swaps limited and full games around the %s tab without listener churn',
    async (tab) => {
      const target = { type: 'firebase', ownerUid: 'owner', tournamentId: `selection-${tab}` };
      const setup = createSynchronousPathService([{ source: target, record: liveEnvelopeRecord() }]);
      const source = createLiveTournamentSource({ service: setup.service, profile: 'public' });
      await source.start(target);

      const limitedGames = setup.activeRegistration(target, 'main/games', LAST_CHILD);
      const promotionStart = setup.events.length;

      await source.setSelection({ tab, group: 'A' });

      expect(
        setup.events
          .slice(promotionStart)
          .filter(({ path }) => path === 'main/games')
          .map(({ type, selector }) => ({ type, selector })),
      ).toEqual([
        { type: 'unsubscribe', selector: LAST_CHILD },
        { type: 'subscribe', selector: VALUE },
      ]);
      expect(limitedGames.unsubscribe).toHaveBeenCalledTimes(1);
      expect(setup.activeRegistration(target, 'main/games', LAST_CHILD)).toBeUndefined();
      expect(setup.activeRegistration(target, 'main/games', VALUE)?.options).toBeUndefined();
      expectExactPlan(
        setup.activePlan(target),
        mergePlans(
          EXPECTED_DISCOVERY_PLAN,
          standardPlan('main/', 'tournamentB', [
            { field: 'games', selector: VALUE },
            'roundTimer',
            'streamPresets',
            'teams',
            'useRating',
          ]),
        ),
      );

      const sameSelectionEventCount = setup.events.length;
      const sameSelectionState = await source.setSelection({ tab, group: 'A' });
      expect(sameSelectionState).toBe(source.getState());
      expect(setup.events).toHaveLength(sameSelectionEventCount);

      const fullGames = setup.activeRegistration(target, 'main/games', VALUE);
      const demotionStart = setup.events.length;
      await source.setSelection({ tab: 'round', group: 'A' });

      expect(
        setup.events
          .slice(demotionStart)
          .filter(({ path }) => path === 'main/games')
          .map(({ type, selector }) => ({ type, selector })),
      ).toEqual([
        { type: 'unsubscribe', selector: VALUE },
        { type: 'subscribe', selector: LAST_CHILD },
      ]);
      expect(fullGames.unsubscribe).toHaveBeenCalledTimes(1);
      expectExactPlan(
        setup.activePlan(target),
        mergePlans(EXPECTED_DISCOVERY_PLAN, standardPlan('main/', 'tournamentB', ROUND_FIELDS)),
      );
    },
  );

  it('stays loading until an asynchronous tab promotion has initialized every required listener', async () => {
    const target = { type: 'firebase', ownerUid: 'owner', tournamentId: 'async-ranking' };
    const setup = createSynchronousPathService([{ source: target, record: liveEnvelopeRecord() }], {
      deferredPaths: ['main/teams'],
    });
    const states = [];
    const source = createLiveTournamentSource({
      service: setup.service,
      profile: 'public',
      onState: (state) => states.push(state),
    });
    await source.start(target);

    let settled = false;
    const promotion = source.setSelection({ tab: 'ranking', group: 'A' }).then((state) => {
      settled = true;
      return state;
    });
    await Promise.resolve();

    expect(source.getState()).toMatchObject({ status: 'loading' });
    expect(states.at(-1).status).toBe('loading');
    expect(settled).toBe(false);
    expect(setup.activeRegistration(target, 'main/teams')).toBeDefined();

    setup.emit(target, 'main/teams');
    await promotion;

    expect(source.getState()).toMatchObject({ status: 'ready' });
    expect(source.getState().record.main.teams).toHaveLength(4);
    expect(settled).toBe(true);
  });

  it('tracks Group B through scalar probes and loads its full envelope node only while selected', async () => {
    const target = { type: 'firebase', ownerUid: 'owner', tournamentId: 'groups' };
    const setup = createSynchronousPathService([{ source: target, record: liveEnvelopeRecord('A/B Cup') }]);
    const source = createLiveTournamentSource({ service: setup.service, profile: 'public' });
    await source.start(target);

    expect(setup.registrationsFor(target).some(({ path }) => path === 'tournamentB')).toBe(false);
    expect(
      setup
        .activePlan(target)
        .filter(({ path }) => path.startsWith('tournamentB/'))
        .map(({ path }) => path)
        .sort(),
    ).toEqual(GROUP_B_PROBE_FIELDS.map((field) => `tournamentB/${field}`).sort());

    const raw = setup.recordFor(target);
    raw.tournamentB = {
      isTournamentB: true,
      system: 'swiss',
      teams: [{ title: 'B One' }, { title: 'B Two' }],
      games: [[{ team_1: 'B One', team_2: 'B Two' }]],
      preferences: {},
    };
    for (const field of GROUP_B_PROBE_FIELDS) setup.emit(target, `tournamentB/${field}`);

    expect(source.getState().record.tournamentB).not.toBeNull();
    expect(setup.registrationsFor(target).some(({ path }) => path === 'tournamentB')).toBe(false);

    raw.tournamentB = null;
    for (const field of GROUP_B_PROBE_FIELDS) setup.emit(target, `tournamentB/${field}`);
    expect(source.getState().record.tournamentB).toBeNull();

    raw.tournamentB = {
      isTournamentB: true,
      system: 'swiss',
      teams: [{ title: 'B One' }, { title: 'B Two' }],
      games: [[{ team_1: 'B One', team_2: 'B Two' }]],
      preferences: {},
    };
    for (const field of GROUP_B_PROBE_FIELDS) setup.emit(target, `tournamentB/${field}`);
    await source.setSelection({ group: 'B', tab: 'round' });

    expectExactPlan(setup.activePlan(target), [...EXPECTED_DISCOVERY_PLAN, valuePath('tournamentB')]);
    expect(source.getState().record.tournamentB.teams).toHaveLength(2);

    raw.tournamentB = null;
    setup.emit(target, 'tournamentB');

    expect(source.getState().record.tournamentB).toBeNull();
    expect(setup.activeRegistration(target, 'tournamentB', VALUE)).toBeUndefined();
    expectExactPlan(
      setup.activePlan(target),
      mergePlans(EXPECTED_DISCOVERY_PLAN, standardPlan('main/', 'tournamentB', ROUND_FIELDS)),
    );
  });

  it('uses legacy prefixes and detects a partial Group B through its scalar title probe', async () => {
    const target = { type: 'firebase', ownerUid: 'legacy-owner', tournamentId: 'legacy-partial-b' };
    const record = liveLegacyRecord('Partial B Cup', {
      groupB: { teams: [{ title: 'Legacy B' }] },
    });
    const setup = createSynchronousPathService([{ source: target, record }]);
    const source = createLiveTournamentSource({ service: setup.service, profile: 'public' });

    await source.start(target);

    expect(setup.service.subscribe).not.toHaveBeenCalled();
    expectExactPlan(
      setup.activePlan(target),
      mergePlans(EXPECTED_DISCOVERY_PLAN, standardPlan('', 'groupB', ROUND_FIELDS)),
    );
    expect(setup.activeRegistration(target, 'games', LAST_CHILD)?.options).toEqual({ limitToLast: 1 });
    expect(setup.activeRegistration(target, 'main/games', LAST_CHILD)).toBeUndefined();
    expect(source.getState().record.groupB).not.toBeNull();
    expect(setup.registrationsFor(target).some(({ path }) => path === 'groupB')).toBe(false);

    await source.setSelection({ group: 'B', tab: 'round' });

    expectExactPlan(setup.activePlan(target), [...EXPECTED_DISCOVERY_PLAN, valuePath('groupB')]);
    expect(source.getState().record.groupB.teams[0].title).toBe('Legacy B');
  });

  it('disposes the old source before subscribing the new one and ignores stale callbacks', async () => {
    const firstTarget = { type: 'firebase', ownerUid: 'owner-a', tournamentId: 'first' };
    const secondTarget = { type: 'firebase', ownerUid: 'owner-b', tournamentId: 'second' };
    const setup = createSynchronousPathService([
      { source: firstTarget, record: liveEnvelopeRecord('First Cup') },
      { source: secondTarget, record: liveEnvelopeRecord('Second Cup') },
    ]);
    const source = createLiveTournamentSource({ service: setup.service, profile: 'public' });
    await source.start(firstTarget);

    const staleGames = setup.activeRegistration(firstTarget, 'main/games', LAST_CHILD);
    const firstRegistrations = setup.registrationsFor(firstTarget);
    await source.start(secondTarget);

    const lastOldUnsubscribe = setup.events.findLastIndex(
      ({ type, source: eventSource }) => type === 'unsubscribe' && eventSource === sourceKey(firstTarget),
    );
    const firstNewSubscribe = setup.events.findIndex(
      ({ type, source: eventSource }) => type === 'subscribe' && eventSource === sourceKey(secondTarget),
    );
    expect(lastOldUnsubscribe).toBeGreaterThan(-1);
    expect(lastOldUnsubscribe).toBeLessThan(firstNewSubscribe);
    expect(firstRegistrations.every(({ unsubscribe }) => unsubscribe.mock.calls.length === 1)).toBe(true);
    expect(setup.activePlan(firstTarget)).toEqual([]);
    expect(source.getState().record).toMatchObject({ name: 'Second Cup', _ownerUid: 'owner-b' });

    const currentState = source.getState();
    setup.deliver(staleGames, { 9: [[{ team_1: 'Stale', team_2: 'Game' }]] });
    expect(source.getState()).toBe(currentState);
    expect(source.getState().record.name).toBe('Second Cup');
  });

  it('keeps a listener error terminal until reload creates a clean run', async () => {
    const target = { type: 'firebase', ownerUid: 'owner', tournamentId: 'recoverable' };
    const setup = createSynchronousPathService([{ source: target, record: liveEnvelopeRecord('Before Error') }]);
    const states = [];
    const source = createLiveTournamentSource({
      service: setup.service,
      profile: 'public',
      onState: (state) => states.push(state),
    });
    await source.start(target);

    const failedGames = setup.activeRegistration(target, 'main/games', LAST_CHILD);
    const failedRunRegistrations = setup.registrationsFor(target);
    const error = new Error('listener denied');
    setup.fail(failedGames, error);

    expect(source.getState()).toMatchObject({ status: 'error', error });
    expect(setup.activePlan(target)).toEqual([]);
    expect(failedRunRegistrations.every(({ unsubscribe }) => unsubscribe.mock.calls.length === 1)).toBe(true);
    const readyCount = states.filter(({ status }) => status === 'ready').length;

    setup.deliver(failedGames, { 4: [[{ team_1: 'Late', team_2: 'Snapshot' }]] });
    expect(source.getState()).toMatchObject({ status: 'error', error });
    expect(states.filter(({ status }) => status === 'ready')).toHaveLength(readyCount);

    const registrationsBeforeSameStart = setup.registrationsFor(target).length;
    await source.start({ ...target });
    expect(source.getState()).toMatchObject({ status: 'error', error });
    expect(setup.registrationsFor(target)).toHaveLength(registrationsBeforeSameStart);

    setup.recordFor(target).name = 'Recovered Cup';
    await source.reload();

    expect(source.getState()).toMatchObject({ status: 'ready', error: null });
    expect(source.getState().record.name).toBe('Recovered Cup');
    expect(setup.activeRegistration(target, 'main/games', LAST_CHILD)).toBeDefined();
    expect(setup.service.subscribe).not.toHaveBeenCalled();
  });

  it('stops every active path once and ignores callbacks after repeated stops', async () => {
    const target = { type: 'firebase', ownerUid: 'owner', tournamentId: 'stoppable' };
    const setup = createSynchronousPathService([{ source: target, record: liveEnvelopeRecord() }]);
    const states = [];
    const source = createLiveTournamentSource({
      service: setup.service,
      profile: 'public',
      onState: (state) => states.push(state),
    });
    await source.start(target);

    const games = setup.activeRegistration(target, 'main/games', LAST_CHILD);
    const activeBeforeStop = setup.registrationsFor(target).filter(({ active }) => active);
    source.stop();
    source.stop();

    expect(activeBeforeStop.every(({ unsubscribe }) => unsubscribe.mock.calls.length === 1)).toBe(true);
    expect(setup.activePlan(target)).toEqual([]);
    expect(source.getState()).toMatchObject({ status: 'idle', record: null, source: null });
    expect(states.filter(({ status }) => status === 'idle')).toHaveLength(1);

    setup.deliver(games, { 3: [[{ team_1: 'Late', team_2: 'Game' }]] });
    setup.fail(games, new Error('late cancellation'));
    expect(source.getState()).toMatchObject({ status: 'idle', record: null, source: null });
  });
});
