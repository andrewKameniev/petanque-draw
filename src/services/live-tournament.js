import { tournamentService } from '@/services/db';
import {
  getTournamentStorageTarget,
  hasTournamentGroup,
  isTournamentEnvelope,
  normalizeTournamentRecord,
  replaceTournamentGroup,
  updateTournamentGroup,
} from '@/services/tournament-record';

const SHARED_COMPETITION_FIELDS = [
  'games',
  'roundIsActive',
  'roundTimer',
  'playOff',
  'playOffBracket',
  'playOffStage',
  'cadrage',
  'barrage',
  'tournamentIsFinished',
  'tournamentIsStarted',
  'teams',
  'preferences',
  'groups',
  'system',
];

export const PUBLIC_FIELDS = Object.freeze([
  ...SHARED_COMPETITION_FIELDS,
  'playoff',
  'useRating',
  'teamPlayoff',
  'roundRobinCircle',
  'groupSchedule',
  'tirParticipants',
  'tirPlayoff',
  'tirRound',
  'tirR2Participants',
  'tirTiebreakerCount',
  'tirConfig',
  'tirStarted',
  'streamPresets',
]);

export const TV_FIELDS = Object.freeze([...SHARED_COMPETITION_FIELDS, 'groupSchedule']);
export const WRAPPER_FIELDS = Object.freeze(['name', 'activeGroup', 'tournamentMessage']);

export const LIVE_TOURNAMENT_SELECTOR = Object.freeze({
  value: 'value',
  lastChild: 'last-child',
});

const VALUE_SELECTOR = LIVE_TOURNAMENT_SELECTOR.value;
const LAST_CHILD_SELECTOR = LIVE_TOURNAMENT_SELECTOR.lastChild;

function freezePlan(entries) {
  return Object.freeze(entries.map((entry) => Object.freeze({ selector: VALUE_SELECTOR, ...entry })));
}

export const PUBLIC_DISCOVERY_PLAN = freezePlan([
  { path: 'name', kind: 'root-field', field: 'name', discovery: true },
  { path: 'tournamentMessage', kind: 'root-field', field: 'tournamentMessage', discovery: true },
  { path: 'main/system', kind: 'format-probe', format: 'envelope', field: 'system', discovery: true },
  { path: 'system', kind: 'format-probe', format: 'legacy', field: 'system', discovery: true },
]);

const PUBLIC_STANDARD_CORE_FIELDS = Object.freeze([
  'system',
  'preferences',
  'roundIsActive',
  'tournamentIsFinished',
  'tournamentIsStarted',
  'playoff',
]);

const PUBLIC_PHASE_PROBES = Object.freeze([
  Object.freeze({ path: 'cadrage/0/stage', signal: 'cadrageStage' }),
  Object.freeze({ path: 'playOff/0/stage', signal: 'playOffStage' }),
  Object.freeze({ path: 'playOffBracket/format', signal: 'playOffFormat' }),
  Object.freeze({ path: 'playOffBracket/stages/0/stageLabel', signal: 'playOffBracketStage' }),
  Object.freeze({ path: 'teamPlayoff/size', signal: 'teamPlayoffSize' }),
  Object.freeze({ path: 'barrage/startIndex', signal: 'barrageStartIndex' }),
]);

const PUBLIC_GROUP_B_PROBE_FIELDS = Object.freeze(['isTournamentB', 'system', 'teams/0/title']);
const PUBLIC_GROUP_SYSTEMS = new Set(['groups', 'poules']);

export const LIVE_TOURNAMENT_PROFILES = Object.freeze({
  public: Object.freeze({
    name: 'public',
    fields: PUBLIC_FIELDS,
    rootFields: Object.freeze(['name', 'tournamentMessage']),
    phaseAware: true,
  }),
  tv: Object.freeze({
    name: 'tv',
    fields: TV_FIELDS,
    rootFields: Object.freeze(['name', 'tournamentMessage']),
    includeGroupB: false,
    phaseAware: false,
  }),
});

const LIVE_RUN_PHASE = Object.freeze({
  loading: 'loading',
  missing: 'missing',
  handoff: 'handoff',
  ready: 'ready',
  error: 'error',
});

function getProfile(profile) {
  if (typeof profile === 'string') return LIVE_TOURNAMENT_PROFILES[profile];
  return profile;
}

function addPlanEntry(plan, entry) {
  plan.set(entry.path, { selector: VALUE_SELECTOR, ...entry });
}

function addGroupField(plan, prefix, field, options = {}) {
  addPlanEntry(plan, {
    path: `${prefix}${field}`,
    kind: 'group-field',
    group: options.group || 'A',
    field,
    selector: options.selector || VALUE_SELECTOR,
  });
}

function getPublicSignals(data, phaseSignals = {}) {
  const hasSignal = (key) => Object.prototype.hasOwnProperty.call(phaseSignals, key);
  const hasPlayOff =
    phaseSignals.hasPlayOff ?? (hasSignal('playOffStage') ? phaseSignals.playOffStage != null : !!data?.playOff);
  const hasPlayOffBracket =
    phaseSignals.hasPlayOffBracket ??
    (hasSignal('playOffFormat') || hasSignal('playOffBracketStage')
      ? phaseSignals.playOffFormat != null || phaseSignals.playOffBracketStage != null
      : !!data?.playOffBracket);
  return {
    hasGames: phaseSignals.hasGames ?? !!data?.roundIsActive,
    hasCadrage:
      phaseSignals.hasCadrage ?? (hasSignal('cadrageStage') ? phaseSignals.cadrageStage != null : !!data?.cadrage),
    hasPlayOff,
    hasPlayOffBracket,
    playOffFormat: phaseSignals.playOffFormat ?? data?.playOffBracket?.format ?? null,
    hasTeamPlayoff:
      phaseSignals.hasTeamPlayoff ??
      (hasSignal('teamPlayoffSize') ? phaseSignals.teamPlayoffSize != null : !!data?.teamPlayoff),
    hasBarrage:
      phaseSignals.hasBarrage ??
      (hasSignal('barrageStartIndex') ? phaseSignals.barrageStartIndex != null : !!data?.barrage),
    hasTirPlayoff:
      phaseSignals.hasTirPlayoff ??
      (hasSignal('tirPlayoffSize') ? phaseSignals.tirPlayoffSize != null : !!data?.tirPlayoff),
  };
}

function getPublicPhase(data, signals) {
  if (data?.tournamentIsFinished) return 'finished';
  if (data?.system === 'tir') return signals.hasTirPlayoff ? 'tir-playoff' : 'tir';
  if (signals.hasTeamPlayoff) return 'team-playoff';
  if (signals.hasPlayOff || signals.hasPlayOffBracket) return 'playoff';
  if (signals.hasCadrage) return 'cadrage';
  if (signals.hasGames) return 'round';
  return 'idle';
}

function addGroupBProbePlan(plan, record) {
  const groupBPrefix = getTournamentStorageTarget(record, 'B', { allowFallback: false }).prefix;
  for (const field of PUBLIC_GROUP_B_PROBE_FIELDS) {
    addPlanEntry(plan, {
      path: `${groupBPrefix}${field}`,
      kind: 'group-b-probe',
      field,
    });
  }
}

function addPhaseHistory(plan, prefix, signals) {
  if (signals.hasCadrage) addGroupField(plan, prefix, 'cadrage');
  if (signals.hasPlayOff) {
    addGroupField(plan, prefix, 'playOff');
    addGroupField(plan, prefix, 'playOffStage');
  }
  if (signals.hasPlayOffBracket) addGroupField(plan, prefix, 'playOffBracket');
  if (signals.hasTeamPlayoff) addGroupField(plan, prefix, 'teamPlayoff');
  if (signals.hasBarrage) addGroupField(plan, prefix, 'barrage');
}

function addGroupSystemFields(plan, prefix, system, { history = false } = {}) {
  if (!PUBLIC_GROUP_SYSTEMS.has(system)) return;
  addGroupField(plan, prefix, 'groups');
  if (system === 'groups') {
    addGroupField(plan, prefix, 'roundRobinCircle');
    if (history) addGroupField(plan, prefix, 'groupSchedule');
  }
}

/**
 * Build the exact active Public listener plan after the record format is known.
 * Root discovery is intentionally separate in PUBLIC_DISCOVERY_PLAN.
 */
export function buildPublicTournamentSubscriptionPlan(record, options = {}) {
  if (!record) return [];
  const requestedGroup = options.group === 'B' ? 'B' : 'A';
  const groupBExists = options.groupBExists ?? hasTournamentGroup(record, 'B');
  const plan = new Map();

  if (requestedGroup === 'B' && groupBExists) {
    const groupBPrefix = getTournamentStorageTarget(record, 'B', { allowFallback: false }).prefix;
    addPlanEntry(plan, {
      path: groupBPrefix.slice(0, -1),
      kind: 'group-node',
      group: 'B',
    });
    return [...plan.values()];
  }

  const target = getTournamentStorageTarget(record, 'A', { allowFallback: false });
  const data = target.data;
  const prefix = target.prefix;
  const system = data?.system || 'swiss';
  const signals = getPublicSignals(data, options.phaseSignals);
  const phase = getPublicPhase(data, signals);

  addGroupBProbePlan(plan, record);

  if (system === 'tir') {
    for (const field of [
      'system',
      'preferences',
      'teams',
      'tirConfig',
      'tirParticipants',
      'tirR2Participants',
      'tirRound',
      'tirStarted',
      'tirTiebreakerCount',
      'tournamentIsFinished',
      'tournamentIsStarted',
    ]) {
      addGroupField(plan, prefix, field);
    }
    if (signals.hasTirPlayoff) {
      addGroupField(plan, prefix, 'tirPlayoff');
    } else {
      addPlanEntry(plan, {
        path: `${prefix}tirPlayoff/size`,
        kind: 'phase-probe',
        signal: 'tirPlayoffSize',
      });
    }
    return [...plan.values()];
  }

  for (const field of PUBLIC_STANDARD_CORE_FIELDS) addGroupField(plan, prefix, field);
  for (const probe of PUBLIC_PHASE_PROBES) {
    addPlanEntry(plan, {
      path: `${prefix}${probe.path}`,
      kind: 'phase-probe',
      signal: probe.signal,
    });
  }

  if (options.phaseReady === false) return [...plan.values()];

  if (phase === 'round') {
    if (system === 'groups') addGroupField(plan, prefix, 'roundRobinCircle');
    addGroupField(plan, prefix, 'games', { selector: LAST_CHILD_SELECTOR });
    addGroupField(plan, prefix, 'roundTimer');
    addGroupField(plan, prefix, 'streamPresets');
  } else if (phase === 'cadrage') {
    addGroupField(plan, prefix, 'games', { selector: LAST_CHILD_SELECTOR });
    addGroupField(plan, prefix, 'cadrage');
    addGroupField(plan, prefix, 'roundTimer');
    addGroupField(plan, prefix, 'streamPresets');
  } else if (phase === 'playoff') {
    addGroupField(plan, prefix, 'games', { selector: LAST_CHILD_SELECTOR });
    if (signals.hasCadrage) addGroupField(plan, prefix, 'cadrage');
    addGroupField(plan, prefix, 'playOff');
    addGroupField(plan, prefix, 'playOffBracket');
    addGroupField(plan, prefix, 'playOffStage');
    addGroupField(plan, prefix, 'roundTimer');
    addGroupField(plan, prefix, 'streamPresets');
  } else if (phase === 'team-playoff') {
    addGroupField(plan, prefix, 'games', { selector: LAST_CHILD_SELECTOR });
    addGroupField(plan, prefix, 'teamPlayoff');
  } else if (phase === 'finished' && signals.playOffFormat === 'double') {
    addGroupField(plan, prefix, 'games', { selector: LAST_CHILD_SELECTOR });
    if (signals.hasCadrage) addGroupField(plan, prefix, 'cadrage');
    addGroupField(plan, prefix, 'playOffBracket');
    addGroupField(plan, prefix, 'streamPresets');
    addGroupField(plan, prefix, 'teams');
  }

  const tab = options.tab === undefined ? (['idle', 'finished'].includes(phase) ? 'ranking' : null) : options.tab;
  if (['ranking', 'results', 'teams'].includes(tab)) {
    addGroupField(plan, prefix, 'games');
    addGroupField(plan, prefix, 'teams');
    addGroupSystemFields(plan, prefix, system, { history: true });
    addPhaseHistory(plan, prefix, signals);
    if (tab !== 'results') addGroupField(plan, prefix, 'useRating');
    if (tab === 'results') addGroupField(plan, prefix, 'streamPresets');
  } else if (tab === 'bracket') {
    addGroupField(plan, prefix, 'playOffBracket');
    if (data?.tournamentIsFinished) addGroupField(plan, prefix, 'teams');
  }

  return [...plan.values()];
}

export function buildTournamentSubscriptionPlan(record, profile, options = {}) {
  const selectedProfile = getProfile(profile);
  if (!selectedProfile) throw new Error(`Unknown live tournament profile: ${profile}`);
  if (selectedProfile.phaseAware) return buildPublicTournamentSubscriptionPlan(record, options);

  const plan = [];
  for (const field of selectedProfile.rootFields || []) {
    plan.push({ path: field, kind: 'root-field', field, selector: VALUE_SELECTOR });
  }

  const mainPrefix = getTournamentStorageTarget(record, 'A').prefix;
  for (const field of selectedProfile.fields || []) {
    plan.push({ path: `${mainPrefix}${field}`, kind: 'group-field', group: 'A', field, selector: VALUE_SELECTOR });
  }

  if (selectedProfile.includeGroupB) {
    const groupBPrefix = getTournamentStorageTarget(record, 'B', { allowFallback: false }).prefix;
    plan.push({
      path: groupBPrefix.slice(0, -1),
      kind: 'group-node',
      group: 'B',
      selector: VALUE_SELECTOR,
    });
  }

  return [...new Map(plan.map((entry) => [entry.path, entry])).values()];
}

function toLatestRoundArray(value) {
  if (value == null) return [];
  const entries = Object.entries(value).filter(([, round]) => round != null);
  if (!entries.length) return [];
  const [key, round] = entries.sort(([left], [right]) => Number(left) - Number(right)).at(-1);
  const index = Number(key);
  if (!Number.isInteger(index) || index < 0) return [];
  const games = [];
  games.length = index + 1;
  games[index] = round;
  return games;
}

export function applyTournamentSnapshot(record, subscription, value, tournamentId) {
  if (!record) return record;
  if (subscription.kind === 'root-field') {
    return { ...record, [subscription.field]: value };
  }
  if (subscription.kind === 'group-field') {
    const nextValue =
      subscription.field === 'games' && subscription.selector === LAST_CHILD_SELECTOR
        ? toLatestRoundArray(value)
        : value;
    const nextRecord = updateTournamentGroup(record, subscription.group, { [subscription.field]: nextValue });
    if (subscription.field === 'preferences') {
      return normalizeTournamentRecord(nextRecord, { id: tournamentId });
    }
    return nextRecord;
  }
  if (subscription.kind === 'group-node') {
    return normalizeTournamentRecord(replaceTournamentGroup(record, subscription.group, value), {
      id: tournamentId,
    });
  }
  return record;
}

export function createLiveTournamentSource(options = {}) {
  const service = options.service || tournamentService;
  const profile = getProfile(options.profile || 'public');
  const onState = options.onState || (() => {});

  if (!profile) throw new Error(`Unknown live tournament profile: ${options.profile}`);

  let active = false;
  let source = null;
  let currentRun = null;
  let selection = { tab: null, group: 'A' };
  let state = { status: 'idle', record: null, error: null, source: null };

  function emit(status, changes = {}) {
    state = { ...state, ...changes, status, source };
    onState(state);
    return state;
  }

  function isCurrentRun(run) {
    return active && currentRun === run && !run.disposed && run.phase !== LIVE_RUN_PHASE.error;
  }

  function settleRun(run) {
    if (run.settled) return;
    run.settled = true;
    run.resolve();
  }

  function resolveSelectionWaiters(run) {
    const waiters = [...run.selectionWaiters];
    run.selectionWaiters.clear();
    waiters.forEach((resolve) => resolve(state));
  }

  function detachParent(run) {
    run.parentDetachRequested = true;
    if (run.parentDetached || typeof run.parentUnsubscribe !== 'function') return;
    run.parentDetached = true;
    const unsubscribe = run.parentUnsubscribe;
    run.parentUnsubscribe = null;
    unsubscribe();
  }

  function detachPublicRegistration(run, key) {
    const registration = run.publicListeners.get(key);
    if (!registration) return;
    run.publicListeners.delete(key);
    registration.active = false;
    if (typeof registration.unsubscribe === 'function') {
      const unsubscribe = registration.unsubscribe;
      registration.unsubscribe = null;
      unsubscribe();
    }
  }

  function clearRunSubscriptions(run) {
    detachParent(run);
    const current = [...run.childUnsubscribers];
    run.childUnsubscribers.clear();
    current.forEach((unsubscribe) => unsubscribe());
    for (const key of [...run.publicListeners.keys()]) detachPublicRegistration(run, key);
  }

  function disposeRun(run) {
    if (!run || run.disposed) return;
    run.disposed = true;
    clearRunSubscriptions(run);
    settleRun(run);
    resolveSelectionWaiters(run);
    if (currentRun === run) currentRun = null;
  }

  function failRun(run, error) {
    if (!isCurrentRun(run) || run.phase === LIVE_RUN_PHASE.error) return;
    run.phase = LIVE_RUN_PHASE.error;
    clearRunSubscriptions(run);
    settleRun(run);
    emit('error', { error });
    resolveSelectionWaiters(run);
  }

  function subscribeToStaticRecord(run, record) {
    const plan = buildTournamentSubscriptionPlan(record, profile);
    let installingChildren = true;
    try {
      for (const subscription of plan) {
        if (!isCurrentRun(run) || run.phase !== LIVE_RUN_PHASE.handoff) return false;
        const unsubscribe = service.subscribePath(
          run.source.ownerUid,
          run.source.tournamentId,
          subscription.path,
          (snapshot) => {
            if (installingChildren || !isCurrentRun(run) || run.phase !== LIVE_RUN_PHASE.ready || !state.record) return;
            const nextRecord = applyTournamentSnapshot(
              state.record,
              subscription,
              snapshot.val(),
              run.source.tournamentId,
            );
            emit('ready', { record: nextRecord, error: null });
          },
          (error) => failRun(run, error),
        );
        if (!isCurrentRun(run) || run.phase !== LIVE_RUN_PHASE.handoff) {
          if (typeof unsubscribe === 'function') unsubscribe();
          return false;
        }
        if (typeof unsubscribe === 'function') run.childUnsubscribers.add(unsubscribe);
      }
      return true;
    } catch (error) {
      failRun(run, error);
      return false;
    } finally {
      installingChildren = false;
    }
  }

  function startStaticBootstrap(run) {
    try {
      run.parentUnsubscribe = service.subscribe(
        run.source.ownerUid,
        run.source.tournamentId,
        (snapshot) => {
          if (!isCurrentRun(run) || ![LIVE_RUN_PHASE.loading, LIVE_RUN_PHASE.missing].includes(run.phase)) return;

          if (!snapshot.exists()) {
            const shouldEmit = run.phase !== LIVE_RUN_PHASE.missing;
            run.phase = LIVE_RUN_PHASE.missing;
            settleRun(run);
            if (shouldEmit && isCurrentRun(run)) emit('missing', { record: null, error: null });
            return;
          }

          const record = normalizeTournamentRecord(snapshot.val(), {
            id: run.source.tournamentId,
            ownerUid: run.source.ownerUid,
          });
          if (!record) {
            const shouldEmit = run.phase !== LIVE_RUN_PHASE.missing;
            run.phase = LIVE_RUN_PHASE.missing;
            settleRun(run);
            if (shouldEmit && isCurrentRun(run)) emit('missing', { record: null, error: null });
            return;
          }

          run.phase = LIVE_RUN_PHASE.handoff;
          if (!subscribeToStaticRecord(run, record)) {
            detachParent(run);
            return;
          }

          detachParent(run);
          if (!isCurrentRun(run)) return;
          run.phase = LIVE_RUN_PHASE.ready;
          settleRun(run);
          emit('ready', { record, error: null });
        },
        (error) => {
          if (run.phase !== LIVE_RUN_PHASE.ready) failRun(run, error);
        },
      );
      if (run.parentDetachRequested || run.disposed) detachParent(run);
    } catch (error) {
      if (run.phase !== LIVE_RUN_PHASE.ready) failRun(run, error);
    }
  }

  function publicRegistrationKey(entry) {
    return `${entry.path}|${entry.selector || VALUE_SELECTOR}`;
  }

  function derivePublicPhaseSignals(run) {
    const values = run.phaseProbeValues;
    run.phaseSignals = {
      hasCadrage: values.cadrageStage != null,
      hasPlayOff: values.playOffStage != null,
      hasPlayOffBracket: values.playOffFormat != null || values.playOffBracketStage != null,
      playOffFormat: values.playOffFormat ?? null,
      hasTeamPlayoff: values.teamPlayoffSize != null,
      hasBarrage: values.barrageStartIndex != null,
      hasTirPlayoff: values.tirPlayoffSize != null,
    };
  }

  function applyDiscoveryValue(run, entry, value) {
    run.discoveryValues.set(entry.path, value);
    if (!run.record) return;
    if (entry.kind === 'root-field') {
      run.record = applyTournamentSnapshot(run.record, entry, value, run.source.tournamentId);
      return;
    }
    if (
      entry.kind === 'format-probe' &&
      ((run.format === 'envelope' && entry.format === 'envelope') ||
        (run.format === 'legacy' && entry.format === 'legacy'))
    ) {
      run.record = updateTournamentGroup(run.record, 'A', { system: value });
    }
  }

  function getPublicFormat(run) {
    if (run.discoveryValues.get('main/system') != null) return 'envelope';
    if (run.discoveryValues.get('system') != null) return 'legacy';
    if (run.fallbackRecord) return isTournamentEnvelope(run.fallbackRecord) ? 'envelope' : 'legacy';
    return null;
  }

  function ensurePublicRecord(run, format) {
    if (run.record && run.format === format) return;
    if (run.fallbackRecord) {
      run.record = normalizeTournamentRecord(run.fallbackRecord, {
        id: run.source.tournamentId,
        ownerUid: run.source.ownerUid,
      });
    } else {
      const raw = {
        name: run.discoveryValues.get('name'),
        tournamentMessage: run.discoveryValues.get('tournamentMessage'),
      };
      if (format === 'envelope') {
        raw.main = { system: run.discoveryValues.get('main/system') };
        raw.tournamentB = null;
      } else {
        raw.system = run.discoveryValues.get('system');
        raw.groupB = null;
      }
      run.record = normalizeTournamentRecord(raw, {
        id: run.source.tournamentId,
        ownerUid: run.source.ownerUid,
      });
    }
    run.format = format;
    if (!run.fallbackRecord) {
      for (const entry of PUBLIC_DISCOVERY_PLAN) {
        if (entry.kind === 'root-field') {
          applyDiscoveryValue(run, entry, run.discoveryValues.get(entry.path));
        }
      }
    }
  }

  function refreshGroupBPresence(run) {
    if (!run.record) return;
    const markerFields = PUBLIC_GROUP_B_PROBE_FIELDS;
    if (!markerFields.every((field) => run.groupBProbeValues.has(field))) return;
    const exists = markerFields.some((field) => run.groupBProbeValues.get(field) != null);
    run.groupBExists = exists;
    const currentExists = hasTournamentGroup(run.record, 'B');
    if (exists && !currentExists) {
      const main = getTournamentStorageTarget(run.record, 'A', { allowFallback: false }).data;
      run.record = replaceTournamentGroup(run.record, 'B', {
        isTournamentB: true,
        system: run.groupBProbeValues.get('system') || main?.system || 'swiss',
        teams: [],
      });
    } else if (exists && run.groupBProbeValues.get('system') != null) {
      run.record = updateTournamentGroup(run.record, 'B', {
        system: run.groupBProbeValues.get('system'),
      });
    } else if (!exists && currentExists) {
      run.record = replaceTournamentGroup(run.record, 'B', null);
    }
  }

  function handlePublicSnapshot(run, registration, snapshot) {
    if (!isCurrentRun(run) || !registration.active) return;
    registration.initialized = true;
    const { entry } = registration;
    const value = snapshot.val();

    if (entry.discovery) {
      applyDiscoveryValue(run, entry, value);
    } else if (entry.kind === 'phase-probe') {
      run.phaseProbeValues[entry.signal] = value;
      derivePublicPhaseSignals(run);
      if (run.record) {
        const patch = {};
        if (!run.phaseSignals.hasCadrage) patch.cadrage = null;
        if (!run.phaseSignals.hasPlayOff) patch.playOff = null;
        if (!run.phaseSignals.hasPlayOffBracket) patch.playOffBracket = null;
        if (!run.phaseSignals.hasTeamPlayoff) patch.teamPlayoff = null;
        if (entry.signal === 'barrageStartIndex') {
          patch.barrage = value == null ? null : { startIndex: value };
        }
        if (Object.keys(patch).length) run.record = updateTournamentGroup(run.record, 'A', patch);
      }
    } else if (entry.kind === 'group-b-probe') {
      run.groupBProbeValues.set(entry.field, value);
      refreshGroupBPresence(run);
    } else if (entry.kind === 'group-node') {
      run.record = applyTournamentSnapshot(run.record, entry, value, run.source.tournamentId);
      run.groupBExists = value != null;
      if (value == null) {
        for (const field of PUBLIC_GROUP_B_PROBE_FIELDS) run.groupBProbeValues.set(field, null);
      }
    } else {
      run.record = applyTournamentSnapshot(run.record, entry, value, run.source.tournamentId);
    }

    run.pendingChange = true;
    reconcilePublic(run);
  }

  function attachPublicRegistration(run, entry) {
    const key = publicRegistrationKey(entry);
    if (run.publicListeners.has(key)) return;
    const registration = { entry, active: true, initialized: false, unsubscribe: null };
    run.publicListeners.set(key, registration);

    try {
      const callback = (snapshot) => handlePublicSnapshot(run, registration, snapshot);
      const errorCallback = (error) => failRun(run, error);
      const unsubscribe =
        entry.selector === LAST_CHILD_SELECTOR
          ? service.subscribePath(run.source.ownerUid, run.source.tournamentId, entry.path, callback, errorCallback, {
              limitToLast: 1,
            })
          : service.subscribePath(run.source.ownerUid, run.source.tournamentId, entry.path, callback, errorCallback);
      registration.unsubscribe = typeof unsubscribe === 'function' ? unsubscribe : null;
      if (!registration.active || !isCurrentRun(run)) {
        registration.active = false;
        if (typeof registration.unsubscribe === 'function') registration.unsubscribe();
        registration.unsubscribe = null;
      }
    } catch (error) {
      failRun(run, error);
    }
  }

  function allPublicEntriesInitialized(run, desired) {
    return [...desired.keys()].every((key) => run.publicListeners.get(key)?.initialized);
  }

  function startPublicFallback(run) {
    if (run.fallbackStarted || !isCurrentRun(run)) return;
    run.fallbackStarted = true;
    run.parentDetachRequested = false;
    run.parentDetached = false;
    try {
      run.parentUnsubscribe = service.subscribe(
        run.source.ownerUid,
        run.source.tournamentId,
        (snapshot) => {
          if (!isCurrentRun(run)) return;
          run.fallbackInitialized = true;
          run.fallbackRecord = snapshot.exists() ? snapshot.val() : null;
          run.record = null;
          run.format = null;
          run.pendingChange = true;
          reconcilePublic(run);
        },
        (error) => failRun(run, error),
      );
      if (run.parentDetachRequested || run.disposed) detachParent(run);
    } catch (error) {
      failRun(run, error);
    }
  }

  function emitPublicReady(run) {
    if (!isCurrentRun(run) || !run.record) return;
    if (!run.initialSelectionResolved && run.selection.tab == null) {
      run.initialSelectionResolved = true;
      const data = getTournamentStorageTarget(run.record, 'A', { allowFallback: false }).data;
      const signals = getPublicSignals(data, run.phaseSignals);
      const phase = getPublicPhase(data, signals);
      if (phase === 'idle' || phase === 'finished') {
        run.selection.tab =
          phase === 'finished' && signals.playOffFormat === 'double'
            ? 'round'
            : data?.system === 'playoff'
              ? 'teams'
              : 'ranking';
        selection = { ...run.selection };
        run.reconcileRequested = true;
        return;
      }
    }
    const discoveredFormat =
      run.discoveryValues.get('main/system') != null || run.discoveryValues.get('system') != null;
    if (run.fallbackStarted && discoveredFormat) {
      detachParent(run);
      run.fallbackStarted = false;
      run.fallbackInitialized = false;
      run.fallbackRecord = null;
    }
    run.phase = LIVE_RUN_PHASE.ready;
    settleRun(run);
    if (run.pendingChange || state.status !== 'ready' || state.record !== run.record) {
      run.pendingChange = false;
      emit('ready', { record: run.record, error: null });
    }
    resolveSelectionWaiters(run);
  }

  function reconcilePublic(run) {
    if (!isCurrentRun(run)) return;
    if (run.reconciling) {
      run.reconcileRequested = true;
      return;
    }

    run.reconciling = true;
    do {
      run.reconcileRequested = false;
      const discoveryDesired = new Map(PUBLIC_DISCOVERY_PLAN.map((entry) => [publicRegistrationKey(entry), entry]));
      for (const entry of PUBLIC_DISCOVERY_PLAN) attachPublicRegistration(run, entry);

      const discoveryReady = [...discoveryDesired.keys()].every((key) => run.publicListeners.get(key)?.initialized);
      if (!discoveryReady || !isCurrentRun(run)) continue;

      const format = getPublicFormat(run);
      if (!format) {
        for (const key of [...run.publicListeners.keys()]) {
          if (!discoveryDesired.has(key)) detachPublicRegistration(run, key);
        }
        startPublicFallback(run);
        if (run.fallbackInitialized && !run.fallbackRecord) {
          run.phase = LIVE_RUN_PHASE.missing;
          settleRun(run);
          if (state.status !== 'missing') emit('missing', { record: null, error: null });
          resolveSelectionWaiters(run);
        }
        continue;
      }

      ensurePublicRecord(run, format);
      if (!run.record) continue;
      run.groupBExists = run.groupBExists || hasTournamentGroup(run.record, 'B');

      const planOptions = {
        ...run.selection,
        phaseSignals: run.phaseSignals,
        groupBExists: run.groupBExists,
      };
      const basePlan = buildPublicTournamentSubscriptionPlan(run.record, {
        ...planOptions,
        phaseReady: false,
      });
      const baseDesired = new Map(discoveryDesired);
      for (const entry of basePlan) baseDesired.set(publicRegistrationKey(entry), entry);
      const baseReady = allPublicEntriesInitialized(run, baseDesired);
      const desired = new Map(baseDesired);
      if (baseReady) {
        const dynamicPlan = buildPublicTournamentSubscriptionPlan(run.record, planOptions);
        for (const entry of dynamicPlan) desired.set(publicRegistrationKey(entry), entry);
      }

      for (const key of [...run.publicListeners.keys()]) {
        if (!desired.has(key)) detachPublicRegistration(run, key);
      }
      for (const entry of desired.values()) attachPublicRegistration(run, entry);

      if (baseReady && allPublicEntriesInitialized(run, desired)) emitPublicReady(run);
    } while (run.reconcileRequested && isCurrentRun(run));
    run.reconciling = false;
  }

  function startPublicBootstrap(run) {
    run.pendingChange = true;
    reconcilePublic(run);
  }

  function beginBootstrap(runSource) {
    let resolveRun;
    const completion = new Promise((resolve) => {
      resolveRun = resolve;
    });
    const run = {
      source: { ...runSource },
      mode: profile.phaseAware ? 'public' : 'static',
      phase: LIVE_RUN_PHASE.loading,
      promise: completion.then(() => state),
      resolve: resolveRun,
      settled: false,
      disposed: false,
      parentUnsubscribe: null,
      parentDetachRequested: false,
      parentDetached: false,
      childUnsubscribers: new Set(),
      publicListeners: new Map(),
      selectionWaiters: new Set(),
      selection: { ...selection },
      discoveryValues: new Map(),
      phaseProbeValues: {},
      phaseSignals: {},
      groupBProbeValues: new Map(),
      groupBExists: false,
      fallbackStarted: false,
      fallbackInitialized: false,
      fallbackRecord: null,
      format: null,
      record: null,
      pendingChange: false,
      initialSelectionResolved: false,
      reconciling: false,
      reconcileRequested: false,
    };
    currentRun = run;
    emit('loading', { error: null });
    if (!isCurrentRun(run)) return run.promise;

    if (run.mode === 'public') startPublicBootstrap(run);
    else startStaticBootstrap(run);

    return run.promise;
  }

  function reload() {
    if (!active || source?.type !== 'firebase') return Promise.resolve(state);
    if (currentRun && !currentRun.settled) return currentRun.promise;
    const runSource = source;
    disposeRun(currentRun);
    return beginBootstrap(runSource);
  }

  function start(nextSource) {
    const sameFirebaseSource =
      active &&
      source?.type === 'firebase' &&
      nextSource?.type === 'firebase' &&
      source.ownerUid === nextSource.ownerUid &&
      source.tournamentId === nextSource.tournamentId;
    if (sameFirebaseSource && currentRun) {
      return currentRun.settled ? Promise.resolve(state) : currentRun.promise;
    }

    active = false;
    disposeRun(currentRun);
    source = nextSource;
    selection = { tab: null, group: 'A' };
    active = true;

    if (source?.type !== 'firebase') {
      return Promise.resolve(emit('invalid', { record: null, error: source?.error || null }));
    }

    return beginBootstrap(source);
  }

  function setSelection(nextSelection = {}) {
    const next = {
      tab: nextSelection.tab ?? selection.tab,
      group: nextSelection.group == null ? selection.group : nextSelection.group === 'B' ? 'B' : 'A',
    };
    if (next.tab === selection.tab && next.group === selection.group) return Promise.resolve(state);
    selection = next;
    const run = currentRun;
    if (!isCurrentRun(run) || run.mode !== 'public') return Promise.resolve(state);
    run.selection = { ...next };
    run.pendingChange = true;
    const promise = new Promise((resolve) => run.selectionWaiters.add(resolve));
    if (state.status === 'ready') emit('loading', { record: run.record, error: null });
    reconcilePublic(run);
    return promise;
  }

  function stop() {
    if (!active && !currentRun) return state;
    active = false;
    disposeRun(currentRun);
    source = null;
    return emit('idle', { record: null, error: null });
  }

  return {
    start,
    reload,
    setSelection,
    stop,
    unsubscribe: stop,
    getState: () => state,
  };
}
