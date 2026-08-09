import { publicTournamentService, tournamentService } from '@/services/db';
import {
  PUBLIC_TOURNAMENT_PROJECTION_ERROR,
  readPublicTournamentProjection,
} from '@/services/public-tournament-projection';
import {
  getTournamentStorageTarget,
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
export const WRAPPER_FIELDS = Object.freeze(['name', 'tournamentMessage']);

export const LIVE_TOURNAMENT_PROFILES = Object.freeze({
  public: Object.freeze({
    name: 'public',
    fields: PUBLIC_FIELDS,
    rootFields: WRAPPER_FIELDS,
    includeGroupB: true,
  }),
  tv: Object.freeze({
    name: 'tv',
    fields: TV_FIELDS,
    rootFields: WRAPPER_FIELDS,
    includeGroupB: false,
  }),
});

const LIVE_RUN_PHASE = Object.freeze({
  loading: 'loading',
  missing: 'missing',
  handoff: 'handoff',
  ready: 'ready',
  error: 'error',
});

function permissionDenied(error) {
  return error?.code?.toLowerCase() === 'permission_denied';
}

function getProfile(profile) {
  if (typeof profile === 'string') return LIVE_TOURNAMENT_PROFILES[profile];
  return profile;
}

export function buildTournamentSubscriptionPlan(record, profile) {
  const selectedProfile = getProfile(profile);
  if (!selectedProfile) throw new Error(`Unknown live tournament profile: ${profile}`);

  const plan = [];
  for (const field of selectedProfile.rootFields || []) {
    plan.push({ path: field, kind: 'root-field', field });
  }

  const mainPrefix = getTournamentStorageTarget(record, 'A').prefix;
  for (const field of selectedProfile.fields || []) {
    plan.push({ path: `${mainPrefix}${field}`, kind: 'group-field', group: 'A', field });
  }

  if (selectedProfile.includeGroupB) {
    const groupBPrefix = getTournamentStorageTarget(record, 'B', { allowFallback: false }).prefix;
    plan.push({ path: groupBPrefix.slice(0, -1), kind: 'group-node', group: 'B' });
  }

  return [...new Map(plan.map((entry) => [entry.path, entry])).values()];
}

export function applyTournamentSnapshot(record, subscription, value, tournamentId) {
  if (!record) return record;
  if (subscription.kind === 'root-field') {
    return { ...record, [subscription.field]: value };
  }
  if (subscription.kind === 'group-field') {
    return updateTournamentGroup(record, subscription.group, { [subscription.field]: value });
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
  const projectionService = options.projectionService || (options.service ? null : publicTournamentService);
  const profile = getProfile(options.profile || 'public');
  const onState = options.onState || (() => {});

  if (!profile) throw new Error(`Unknown live tournament profile: ${options.profile}`);

  let active = false;
  let source = null;
  let currentRun = null;
  let state = {
    status: 'idle',
    record: null,
    error: null,
    source: null,
    dataSource: null,
    projection: null,
  };

  function emit(status, changes = {}) {
    state = { ...state, ...changes, status, source };
    onState(state);
    return state;
  }

  function isCurrentRun(run) {
    return active && currentRun === run && !run.disposed;
  }

  function settleRun(run) {
    if (run.settled) return;
    run.settled = true;
    run.resolve();
  }

  function detachParent(run) {
    run.parentDetachRequested = true;
    if (run.parentDetached || typeof run.parentUnsubscribe !== 'function') return;
    run.parentDetached = true;
    const unsubscribe = run.parentUnsubscribe;
    run.parentUnsubscribe = null;
    unsubscribe();
  }

  function detachProjection(run) {
    run.projectionDetachRequested = true;
    if (run.projectionDetached || typeof run.projectionUnsubscribe !== 'function') return;
    run.projectionDetached = true;
    const unsubscribe = run.projectionUnsubscribe;
    run.projectionUnsubscribe = null;
    unsubscribe();
  }

  function clearRunSubscriptions(run) {
    detachProjection(run);
    detachParent(run);
    const current = [...run.childUnsubscribers];
    run.childUnsubscribers.clear();
    current.forEach((unsubscribe) => unsubscribe());
  }

  function disposeRun(run) {
    if (!run || run.disposed) return;
    run.disposed = true;
    clearRunSubscriptions(run);
    settleRun(run);
    if (currentRun === run) currentRun = null;
  }

  function failRun(run, error) {
    if (!isCurrentRun(run) || run.phase === LIVE_RUN_PHASE.error) return;
    run.phase = LIVE_RUN_PHASE.error;
    clearRunSubscriptions(run);
    settleRun(run);
    emit('error', {
      error,
      dataSource: run.mode === 'legacy' ? 'legacy' : 'projection',
      projection:
        run.mode === 'legacy'
          ? { status: 'fallback', reason: run.fallbackReason }
          : { status: 'error', reason: 'projection-error' },
    });
  }

  function subscribeToRecord(run, record) {
    const plan = buildTournamentSubscriptionPlan(record, profile);
    // The parent snapshot already contains these values; ignore synchronous
    // cache echoes while the granular listeners are being installed.
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
            emit('ready', {
              record: nextRecord,
              error: null,
              dataSource: 'legacy',
              projection: { status: 'fallback', reason: run.fallbackReason },
            });
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

  function subscribeCanonical(run) {
    run.mode = 'legacy';
    run.phase = LIVE_RUN_PHASE.loading;
    run.parentDetachRequested = false;
    run.parentDetached = false;
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
            if (shouldEmit && isCurrentRun(run)) {
              emit('missing', {
                record: null,
                error: null,
                dataSource: 'legacy',
                projection: { status: 'fallback', reason: run.fallbackReason },
              });
            }
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
            if (shouldEmit && isCurrentRun(run)) {
              emit('missing', {
                record: null,
                error: null,
                dataSource: 'legacy',
                projection: { status: 'fallback', reason: run.fallbackReason },
              });
            }
            return;
          }

          run.phase = LIVE_RUN_PHASE.handoff;
          if (!subscribeToRecord(run, record)) {
            detachParent(run);
            return;
          }

          detachParent(run);
          if (!isCurrentRun(run)) return;
          run.phase = LIVE_RUN_PHASE.ready;
          settleRun(run);
          emit('ready', {
            record,
            error: null,
            dataSource: 'legacy',
            projection: { status: 'fallback', reason: run.fallbackReason },
          });
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

  function fallbackToCanonical(run, reason) {
    if (!isCurrentRun(run) || run.mode === 'legacy') return;
    const replacingReadyProjection = run.phase === LIVE_RUN_PHASE.ready;
    run.fallbackReason = reason;
    detachProjection(run);
    if (replacingReadyProjection) {
      emit('loading', {
        error: null,
        dataSource: 'legacy',
        projection: { status: 'fallback', reason },
      });
    }
    subscribeCanonical(run);
  }

  function subscribeProjection(run) {
    run.mode = 'projection';
    try {
      run.projectionUnsubscribe = projectionService.subscribe(
        run.source.ownerUid,
        run.source.tournamentId,
        (snapshot) => {
          if (!isCurrentRun(run) || run.mode !== 'projection') return;
          const result = readPublicTournamentProjection(snapshot.exists() ? snapshot.val() : null, {
            tournamentId: run.source.tournamentId,
            ownerUid: run.source.ownerUid,
            previousRevision: run.projectionRevision,
          });
          if (!result.valid) {
            if (
              result.reason === PUBLIC_TOURNAMENT_PROJECTION_ERROR.STALE &&
              run.phase === LIVE_RUN_PHASE.ready &&
              state.dataSource === 'projection'
            ) {
              emit('ready', {
                error: null,
                projection: {
                  status: 'stale',
                  reason: result.reason,
                  revision: run.projectionRevision,
                },
              });
              return;
            }
            fallbackToCanonical(run, result.reason);
            return;
          }

          run.phase = LIVE_RUN_PHASE.ready;
          run.projectionRevision = result.revision;
          settleRun(run);
          emit('ready', {
            record: result.record,
            error: null,
            dataSource: 'projection',
            projection: {
              status: 'ready',
              schemaVersion: result.schemaVersion,
              revision: result.revision,
              updatedAt: result.updatedAt,
            },
          });
        },
        (error) => fallbackToCanonical(run, permissionDenied(error) ? 'permission-denied' : 'projection-error'),
      );
      if (run.projectionDetachRequested || run.disposed) detachProjection(run);
    } catch (error) {
      fallbackToCanonical(run, permissionDenied(error) ? 'permission-denied' : 'projection-error');
    }
  }

  function beginBootstrap(runSource) {
    let resolveRun;
    const completion = new Promise((resolve) => {
      resolveRun = resolve;
    });
    const run = {
      source: { ...runSource },
      mode: projectionService ? 'projection' : 'legacy',
      fallbackReason: projectionService ? null : 'not-configured',
      phase: LIVE_RUN_PHASE.loading,
      promise: completion.then(() => state),
      resolve: resolveRun,
      settled: false,
      disposed: false,
      projectionRevision: null,
      projectionUnsubscribe: null,
      projectionDetachRequested: false,
      projectionDetached: false,
      parentUnsubscribe: null,
      parentDetachRequested: false,
      parentDetached: false,
      childUnsubscribers: new Set(),
    };
    currentRun = run;
    emit('loading', {
      error: null,
      dataSource: null,
      projection: projectionService ? { status: 'loading' } : { status: 'fallback', reason: 'not-configured' },
    });
    if (!isCurrentRun(run)) return run.promise;

    if (projectionService) subscribeProjection(run);
    else subscribeCanonical(run);

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
    active = true;

    if (source?.type !== 'firebase') {
      return Promise.resolve(
        emit('invalid', {
          record: null,
          error: source?.error || null,
          dataSource: null,
          projection: null,
        }),
      );
    }

    return beginBootstrap(source);
  }

  function stop() {
    if (!active && !currentRun) return state;
    active = false;
    disposeRun(currentRun);
    source = null;
    return emit('idle', { record: null, error: null, dataSource: null, projection: null });
  }

  return {
    start,
    reload,
    stop,
    unsubscribe: stop,
    getState: () => state,
  };
}
