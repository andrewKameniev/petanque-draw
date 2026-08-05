import { tournamentService } from '@/services/db';
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
  'tirTiebreakerActive',
  'tirTiebreakerCount',
  'tirTiebreakerParticipantIds',
  'tirConfig',
  'tirStarted',
  'streamPresets',
]);

export const TV_FIELDS = Object.freeze([...SHARED_COMPETITION_FIELDS, 'groupSchedule']);
export const WRAPPER_FIELDS = Object.freeze(['activeGroup', 'tournamentMessage']);

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
    rootFields: Object.freeze(['tournamentMessage']),
    includeGroupB: false,
  }),
});

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
  const profile = getProfile(options.profile || 'public');
  const onState = options.onState || (() => {});
  const documentTarget =
    options.documentTarget === undefined ? (typeof document === 'undefined' ? null : document) : options.documentTarget;
  const windowTarget =
    options.windowTarget === undefined ? (typeof window === 'undefined' ? null : window) : options.windowTarget;

  if (!profile) throw new Error(`Unknown live tournament profile: ${options.profile}`);

  let active = false;
  let source = null;
  let generation = 0;
  let unsubscribers = [];
  let resumeListenersAttached = false;
  let state = { status: 'idle', record: null, error: null, source: null };

  function emit(status, changes = {}) {
    state = { ...state, ...changes, status, source };
    onState(state);
    return state;
  }

  function clearSubscriptions() {
    const current = unsubscribers;
    unsubscribers = [];
    current.forEach((unsubscribe) => unsubscribe());
  }

  function handleSubscriptionError(error, run) {
    if (!active || run !== generation) return;
    emit('error', { error });
  }

  function subscribeToRecord(record, run) {
    const plan = buildTournamentSubscriptionPlan(record, profile);
    try {
      for (const subscription of plan) {
        const unsubscribe = service.subscribePath(
          source.ownerUid,
          source.tournamentId,
          subscription.path,
          (snapshot) => {
            if (!active || run !== generation || !state.record) return;
            const nextRecord = applyTournamentSnapshot(state.record, subscription, snapshot.val(), source.tournamentId);
            emit('ready', { record: nextRecord, error: null });
          },
          (error) => handleSubscriptionError(error, run),
        );
        if (typeof unsubscribe === 'function') unsubscribers.push(unsubscribe);
      }
    } catch (error) {
      clearSubscriptions();
      handleSubscriptionError(error, run);
    }
  }

  async function reload() {
    if (!active || source?.type !== 'firebase') return state;
    const run = ++generation;
    clearSubscriptions();
    emit('loading', { error: null });

    try {
      const snapshot = await service.getOne(source.ownerUid, source.tournamentId);
      if (!active || run !== generation) return state;
      if (!snapshot.exists()) return emit('missing', { record: null, error: null });

      const record = normalizeTournamentRecord(snapshot.val(), {
        id: source.tournamentId,
        ownerUid: source.ownerUid,
      });
      if (!record) return emit('missing', { record: null, error: null });

      emit('ready', { record, error: null });
      subscribeToRecord(record, run);
      return state;
    } catch (error) {
      if (!active || run !== generation) return state;
      return emit('error', { error });
    }
  }

  function onVisibilityChange() {
    if (documentTarget?.visibilityState === 'visible') void reload();
  }

  function onOnline() {
    void reload();
  }

  function attachResumeListeners() {
    if (resumeListenersAttached) return;
    documentTarget?.addEventListener?.('visibilitychange', onVisibilityChange);
    windowTarget?.addEventListener?.('online', onOnline);
    resumeListenersAttached = true;
  }

  function detachResumeListeners() {
    if (!resumeListenersAttached) return;
    documentTarget?.removeEventListener?.('visibilitychange', onVisibilityChange);
    windowTarget?.removeEventListener?.('online', onOnline);
    resumeListenersAttached = false;
  }

  async function start(nextSource) {
    generation++;
    clearSubscriptions();
    source = nextSource;
    active = true;

    if (source?.type !== 'firebase') {
      detachResumeListeners();
      return emit('invalid', { record: null, error: source?.error || null });
    }

    attachResumeListeners();
    return reload();
  }

  function stop() {
    if (!active && !resumeListenersAttached && unsubscribers.length === 0) return state;
    active = false;
    generation++;
    clearSubscriptions();
    detachResumeListeners();
    source = null;
    return emit('idle', { record: null, error: null });
  }

  return {
    start,
    reload,
    stop,
    unsubscribe: stop,
    getState: () => state,
  };
}
