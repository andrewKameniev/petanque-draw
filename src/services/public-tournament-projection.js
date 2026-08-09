import { getDatabase, ref, remove, set, update } from 'firebase/database';
import {
  getTournamentStorageTarget,
  hasTournamentGroup,
  isTournamentEnvelope,
  normalizeTournamentRecord,
} from './tournament-record.js';

export const PUBLIC_TOURNAMENT_PROJECTION_ROOT = 'publicTournaments';
export const PUBLIC_TOURNAMENT_PROJECTION_VERSION = 1;
export const PUBLIC_TOURNAMENT_MAX_VALUE_DEPTH = 12;
export const PUBLIC_TOURNAMENT_MAX_STREAM_URLS = 16;

export const PUBLIC_TOURNAMENT_PROJECTION_ERROR = Object.freeze({
  MISSING: 'missing',
  MALFORMED: 'malformed',
  PARTIAL: 'partial',
  UNSUPPORTED_VERSION: 'unsupported-version',
  STALE: 'stale',
});

export const PUBLIC_TOURNAMENT_METADATA_FIELDS = Object.freeze(['name', 'date', 'tournamentMessage', 'activeGroup']);

export const PUBLIC_TOURNAMENT_PREFERENCE_FIELDS = Object.freeze([
  'maxScore',
  'fieldsStart',
  'playOffEnabled',
  'playOffTeams',
  'playOffFormat',
  'grandFinalMode',
  'groupFormat',
  'groupTotalRounds',
  'swissRoundsCount',
  'prizePlaces',
  'timeLimitEnabled',
  'timeLimit',
  'playoffTimeLimit',
  'noTimeLimitFinale',
  'cochonettesEnabled',
  'cochonettesEnabledPlayoff',
  'cochonettes',
  'colorSchema',
]);

export const PUBLIC_TOURNAMENT_COMPETITION_FIELDS = Object.freeze([
  'system',
  'teams',
  'games',
  'groups',
  'groupSchedule',
  'preferences',
  'roundIsActive',
  'roundTimer',
  'roundRobinCircle',
  'tournamentIsFinished',
  'tournamentIsStarted',
  'useRating',
  'playOff',
  'playoff',
  'playOffBracket',
  'playOffStage',
  'cadrage',
  'barrage',
  'teamPlayoff',
  'tirParticipants',
  'tirPlayoff',
  'tirRound',
  'tirR2Participants',
  'tirTiebreakerCount',
  'tirConfig',
  'tirStarted',
  'streamPresets',
]);

const FORBIDDEN_PUBLIC_KEYS = new Set([
  'auth',
  'backup',
  'backups',
  'collaborators',
  'createdby',
  'email',
  'emails',
  'editormetadata',
  'gamescopy',
  'notificationtokens',
  'owner',
  'owneruid',
  '_owneruid',
  'password',
  'portalteam',
  'portalteamid',
  'private',
  'token',
  'tokens',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isForbiddenPublicKey(key) {
  const normalized = String(key).toLowerCase();
  return (
    FORBIDDEN_PUBLIC_KEYS.has(normalized) ||
    normalized.endsWith('email') ||
    normalized.endsWith('emails') ||
    normalized.endsWith('password') ||
    normalized.endsWith('token') ||
    normalized.endsWith('tokens')
  );
}

function clonePublicValue(value, depth = 0) {
  if (depth > PUBLIC_TOURNAMENT_MAX_VALUE_DEPTH) return undefined;
  if (Array.isArray(value)) {
    if (depth === PUBLIC_TOURNAMENT_MAX_VALUE_DEPTH) return [];
    return value.map((child) => clonePublicValue(child, depth + 1) ?? null);
  }
  if (!isObject(value)) return value;
  if (depth === PUBLIC_TOURNAMENT_MAX_VALUE_DEPTH) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isForbiddenPublicKey(key))
      .map(([key, item]) => [key, clonePublicValue(item, depth + 1)])
      .filter(([, item]) => item !== undefined),
  );
}

function hasOnlyKeys(value, allowedKeys) {
  return isObject(value) && Object.keys(value).every((key) => allowedKeys.includes(key));
}

function containsForbiddenPublicKey(value, depth = 0) {
  if (depth > PUBLIC_TOURNAMENT_MAX_VALUE_DEPTH) return true;
  if (Array.isArray(value)) {
    if (depth === PUBLIC_TOURNAMENT_MAX_VALUE_DEPTH) return value.length > 0;
    return value.some((child) => containsForbiddenPublicKey(child, depth + 1));
  }
  if (!isObject(value)) return false;
  if (depth === PUBLIC_TOURNAMENT_MAX_VALUE_DEPTH) return Object.keys(value).length > 0;
  return Object.entries(value).some(
    ([key, child]) => isForbiddenPublicKey(key) || containsForbiddenPublicKey(child, depth + 1),
  );
}

function projectPreferences(preferences) {
  if (!isObject(preferences)) return {};
  return Object.fromEntries(
    PUBLIC_TOURNAMENT_PREFERENCE_FIELDS.filter((field) => preferences[field] !== undefined).map((field) => [
      field,
      clonePublicValue(preferences[field], 1),
    ]),
  );
}

function projectStreamPresetMap(presets) {
  if (!isObject(presets)) return {};
  return Object.fromEntries(
    Object.entries(presets)
      .filter(([, urls]) => Array.isArray(urls))
      .map(([key, urls]) => [
        key,
        urls.filter((url) => typeof url === 'string').slice(0, PUBLIC_TOURNAMENT_MAX_STREAM_URLS),
      ]),
  );
}

function projectStreamPresets(streamPresets) {
  if (!isObject(streamPresets)) return {};
  return Object.fromEntries(
    ['teams', 'lanes']
      .filter((field) => streamPresets[field] !== undefined)
      .map((field) => [field, projectStreamPresetMap(streamPresets[field])]),
  );
}

export function projectPublicTournamentCompetition(competition) {
  if (!isObject(competition)) return null;
  return Object.fromEntries(
    PUBLIC_TOURNAMENT_COMPETITION_FIELDS.filter((field) => competition[field] !== undefined).map((field) => [
      field,
      field === 'preferences'
        ? projectPreferences(competition[field])
        : field === 'streamPresets'
          ? competition[field] == null
            ? null
            : projectStreamPresets(competition[field])
          : clonePublicValue(competition[field]),
    ]),
  );
}

function projectPublicTournamentRecord(record) {
  const normalized = normalizeTournamentRecord(record);
  if (!normalized) return null;

  const projected = Object.fromEntries(
    PUBLIC_TOURNAMENT_METADATA_FIELDS.filter((field) => normalized[field] !== undefined).map((field) => [
      field,
      clonePublicValue(normalized[field]),
    ]),
  );
  projected.activeGroup = normalized.activeGroup;
  projected.main = projectPublicTournamentCompetition(getTournamentStorageTarget(normalized, 'A').data);
  projected.tournamentB = hasTournamentGroup(normalized, 'B')
    ? projectPublicTournamentCompetition(getTournamentStorageTarget(normalized, 'B', { allowFallback: false }).data)
    : null;
  return projected;
}

export function createPublicTournamentProjection(
  record,
  { revision = 1, updatedAt = Date.now(), complete = true } = {},
) {
  const projectedRecord = projectPublicTournamentRecord(record);
  if (!projectedRecord) return null;
  return {
    schemaVersion: PUBLIC_TOURNAMENT_PROJECTION_VERSION,
    complete,
    revision,
    updatedAt,
    record: projectedRecord,
  };
}

function invalidProjection(reason) {
  return { valid: false, reason };
}

function validCompetitionShape(competition) {
  const { streamPresets, ...competitionWithoutStreamPresets } = competition || {};
  return (
    isObject(competition) &&
    hasOnlyKeys(competition, PUBLIC_TOURNAMENT_COMPETITION_FIELDS) &&
    !Object.values(competitionWithoutStreamPresets).some((value) => containsForbiddenPublicKey(value)) &&
    typeof competition.system === 'string' &&
    (competition.teams == null || Array.isArray(competition.teams)) &&
    (competition.games == null || Array.isArray(competition.games)) &&
    (competition.preferences == null ||
      (isObject(competition.preferences) &&
        hasOnlyKeys(competition.preferences, PUBLIC_TOURNAMENT_PREFERENCE_FIELDS))) &&
    (streamPresets == null ||
      (hasOnlyKeys(streamPresets, ['teams', 'lanes']) &&
        Object.values(streamPresets).every(
          (presetMap) =>
            isObject(presetMap) &&
            Object.values(presetMap).every(
              (urls) =>
                Array.isArray(urls) &&
                urls.length <= PUBLIC_TOURNAMENT_MAX_STREAM_URLS &&
                urls.every((url) => typeof url === 'string'),
            ),
        )))
  );
}

function validRecordShape(record) {
  return (
    hasOnlyKeys(record, [...PUBLIC_TOURNAMENT_METADATA_FIELDS, 'main', 'tournamentB']) &&
    (record.name == null || typeof record.name === 'string') &&
    (record.date == null || typeof record.date === 'string') &&
    (record.tournamentMessage == null || typeof record.tournamentMessage === 'string') &&
    (record.activeGroup === 'A' || record.activeGroup === 'B') &&
    validCompetitionShape(record.main) &&
    (record.tournamentB == null || validCompetitionShape(record.tournamentB)) &&
    (record.activeGroup !== 'B' || validCompetitionShape(record.tournamentB))
  );
}

export function readPublicTournamentProjection(projection, { tournamentId, ownerUid, previousRevision = null } = {}) {
  if (projection == null) return invalidProjection(PUBLIC_TOURNAMENT_PROJECTION_ERROR.MISSING);
  if (!isObject(projection)) return invalidProjection(PUBLIC_TOURNAMENT_PROJECTION_ERROR.MALFORMED);
  if (projection.schemaVersion !== PUBLIC_TOURNAMENT_PROJECTION_VERSION) {
    return invalidProjection(PUBLIC_TOURNAMENT_PROJECTION_ERROR.UNSUPPORTED_VERSION);
  }
  if (projection.complete !== true) return invalidProjection(PUBLIC_TOURNAMENT_PROJECTION_ERROR.PARTIAL);
  if (
    !Number.isSafeInteger(projection.revision) ||
    projection.revision < 1 ||
    !Number.isFinite(projection.updatedAt) ||
    projection.updatedAt < 0 ||
    !validRecordShape(projection.record)
  ) {
    return invalidProjection(PUBLIC_TOURNAMENT_PROJECTION_ERROR.MALFORMED);
  }
  if (Number.isSafeInteger(previousRevision) && projection.revision < previousRevision) {
    return invalidProjection(PUBLIC_TOURNAMENT_PROJECTION_ERROR.STALE);
  }

  const record = normalizeTournamentRecord(projection.record, { id: tournamentId, ownerUid });
  if (!record) return invalidProjection(PUBLIC_TOURNAMENT_PROJECTION_ERROR.MALFORMED);
  return {
    valid: true,
    record,
    revision: projection.revision,
    updatedAt: projection.updatedAt,
    schemaVersion: projection.schemaVersion,
  };
}

export function getPublicTournamentProjectionPath(ownerUid, tournamentId) {
  return `${PUBLIC_TOURNAMENT_PROJECTION_ROOT}/${ownerUid}/${tournamentId}`;
}

function projectCompetitionPathValue(pathParts, value) {
  const [field, ...nestedPath] = pathParts;
  if (!PUBLIC_TOURNAMENT_COMPETITION_FIELDS.includes(field)) return null;

  if (field === 'preferences') {
    if (!nestedPath.length) return { pathParts, value: projectPreferences(value) };
    if (!PUBLIC_TOURNAMENT_PREFERENCE_FIELDS.includes(nestedPath[0])) return null;
  }
  if (field === 'streamPresets') {
    if (!nestedPath.length) {
      return { pathParts, value: value == null ? null : projectStreamPresets(value) };
    }
    if (!['teams', 'lanes'].includes(nestedPath[0])) return null;
    if (nestedPath.length === 1) {
      return { pathParts, value: value == null ? null : projectStreamPresetMap(value) };
    }
    if (nestedPath.length === 2) {
      if (value == null) return { pathParts, value: null };
      if (!Array.isArray(value)) return null;
      return {
        pathParts,
        value: value.filter((url) => typeof url === 'string').slice(0, PUBLIC_TOURNAMENT_MAX_STREAM_URLS),
      };
    }
    return null;
  }
  if (nestedPath.some(isForbiddenPublicKey)) return null;
  return { pathParts, value: clonePublicValue(value, nestedPath.length) };
}

function projectCanonicalPath(record, path, value) {
  const parts = String(path || '')
    .split('/')
    .filter(Boolean);
  if (!parts.length) return null;

  if (PUBLIC_TOURNAMENT_METADATA_FIELDS.includes(parts[0])) {
    if (parts.length !== 1) return null;
    return { path: `record/${parts.join('/')}`, value: clonePublicValue(value) };
  }

  const envelope = isTournamentEnvelope(record);
  if (envelope && parts[0] === 'main') {
    if (parts.length === 1) {
      return { path: 'record/main', value: projectPublicTournamentCompetition(value) };
    }
    const projected = projectCompetitionPathValue(parts.slice(1), value);
    return projected ? { path: `record/main/${projected.pathParts.join('/')}`, value: projected.value } : null;
  }
  if (envelope && parts[0] === 'tournamentB') {
    if (parts.length === 1) {
      return {
        path: 'record/tournamentB',
        value: value == null ? null : projectPublicTournamentCompetition(value),
      };
    }
    const projected = projectCompetitionPathValue(parts.slice(1), value);
    return projected ? { path: `record/tournamentB/${projected.pathParts.join('/')}`, value: projected.value } : null;
  }

  if (!envelope && parts[0] === 'groupB') {
    if (parts.length === 1) {
      return {
        path: 'record/tournamentB',
        value: value == null ? null : projectPublicTournamentCompetition(value),
      };
    }
    const projected = projectCompetitionPathValue(parts.slice(1), value);
    return projected ? { path: `record/tournamentB/${projected.pathParts.join('/')}`, value: projected.value } : null;
  }
  if (!envelope) {
    const projected = projectCompetitionPathValue(parts, value);
    return projected ? { path: `record/main/${projected.pathParts.join('/')}`, value: projected.value } : null;
  }
  return null;
}

export function planPublicTournamentPathWrite({
  ownerUid,
  tournamentId,
  record,
  pathValues,
  revisionValue,
  updatedAtValue,
}) {
  const canonicalBase = `${ownerUid}/tournaments/${tournamentId}`;
  const projectionBase = getPublicTournamentProjectionPath(ownerUid, tournamentId);
  const updates = {};
  let hasProjectionUpdates = false;

  Object.entries(pathValues || {}).forEach(([path, value]) => {
    if (!path || value === undefined) return;
    updates[`${canonicalBase}/${path}`] = value;
    const projected = projectCanonicalPath(record, path, value);
    if (!projected || projected.value === undefined) return;
    hasProjectionUpdates = true;
    updates[`${projectionBase}/${projected.path}`] = projected.value;
  });

  if (hasProjectionUpdates) {
    updates[`${projectionBase}/schemaVersion`] = PUBLIC_TOURNAMENT_PROJECTION_VERSION;
    updates[`${projectionBase}/revision`] = revisionValue;
    updates[`${projectionBase}/updatedAt`] = updatedAtValue;
  }
  return { updates, hasProjectionUpdates };
}

export function planPublicTournamentFullWrite({ ownerUid, tournamentId, record, revisionValue, updatedAtValue }) {
  const projection = createPublicTournamentProjection(record, {
    revision: 1,
    updatedAt: 0,
  });
  const projectionBase = getPublicTournamentProjectionPath(ownerUid, tournamentId);
  return {
    updates: {
      [`${ownerUid}/tournaments/${tournamentId}`]: record,
      [`${projectionBase}/schemaVersion`]: projection.schemaVersion,
      [`${projectionBase}/complete`]: true,
      [`${projectionBase}/revision`]: revisionValue,
      [`${projectionBase}/updatedAt`]: updatedAtValue,
      [`${projectionBase}/record`]: projection.record,
    },
    hasProjectionUpdates: true,
  };
}

export function planPublicTournamentDelete({ ownerUid, tournamentId }) {
  return {
    [`${ownerUid}/tournaments/${tournamentId}`]: null,
    [getPublicTournamentProjectionPath(ownerUid, tournamentId)]: null,
  };
}

function permissionDenied(error) {
  return error?.code?.toLowerCase() === 'permission_denied';
}

function incrementServerValue(value) {
  return { '.sv': { increment: value } };
}

function timestampServerValue() {
  return { '.sv': 'timestamp' };
}

export function createPublicTournamentWriter(dependencies = {}) {
  const firebase = {
    database: dependencies.database,
    getDatabase: dependencies.getDatabase || getDatabase,
    increment: dependencies.increment || incrementServerValue,
    ref: dependencies.ref || ref,
    remove: dependencies.remove || remove,
    serverTimestamp: dependencies.serverTimestamp || timestampServerValue,
    set: dependencies.set || set,
    update: dependencies.update || update,
  };

  function database() {
    return firebase.database || firebase.getDatabase();
  }

  function projectionMetadata() {
    return {
      revisionValue: firebase.increment(1),
      updatedAtValue: firebase.serverTimestamp(),
    };
  }

  async function execute(plan, canonicalFallback) {
    try {
      await firebase.update(firebase.ref(database(), '/'), plan.updates);
      return { projection: plan.hasProjectionUpdates ? 'published' : 'unchanged' };
    } catch (error) {
      if (!plan.hasProjectionUpdates || !permissionDenied(error)) throw error;
      await canonicalFallback();
      return { projection: 'deferred', reason: 'permission-denied' };
    }
  }

  function writePaths({ ownerUid, tournamentId, record, pathValues }) {
    const serializableValues = Object.fromEntries(
      Object.entries(pathValues || {}).filter(([path, value]) => path && value !== undefined),
    );
    const plan = planPublicTournamentPathWrite({
      ownerUid,
      tournamentId,
      record,
      pathValues: serializableValues,
      ...projectionMetadata(),
    });
    const entries = Object.entries(serializableValues);
    if (!entries.length) return Promise.resolve({ projection: 'unchanged' });
    return execute(plan, () => {
      if (entries.length === 1) {
        const [path, value] = entries[0];
        return firebase.set(firebase.ref(database(), `${ownerUid}/tournaments/${tournamentId}/${path}`), value);
      }
      return firebase.update(firebase.ref(database(), `${ownerUid}/tournaments/${tournamentId}`), serializableValues);
    });
  }

  function writeFull({ ownerUid, tournamentId, record }) {
    const plan = planPublicTournamentFullWrite({
      ownerUid,
      tournamentId,
      record,
      ...projectionMetadata(),
    });
    return execute(plan, () =>
      firebase.update(firebase.ref(database(), `${ownerUid}/tournaments/`), { [tournamentId]: record }),
    );
  }

  async function removeTournament({ ownerUid, tournamentId, additionalUpdates = {} }) {
    const projectionPath = getPublicTournamentProjectionPath(ownerUid, tournamentId);
    const updates = {
      ...additionalUpdates,
      ...planPublicTournamentDelete({ ownerUid, tournamentId }),
    };
    const canonicalUpdates = { ...updates };
    delete canonicalUpdates[projectionPath];
    try {
      await firebase.update(firebase.ref(database(), '/'), updates);
      return { projection: 'removed' };
    } catch (error) {
      if (!permissionDenied(error)) throw error;
      await firebase.update(firebase.ref(database(), '/'), canonicalUpdates);
      return { projection: 'deferred', reason: 'permission-denied' };
    }
  }

  return { removeTournament, writeFull, writePaths };
}

let defaultPublicTournamentWriter;

function getDefaultPublicTournamentWriter() {
  if (!defaultPublicTournamentWriter) defaultPublicTournamentWriter = createPublicTournamentWriter();
  return defaultPublicTournamentWriter;
}

export const publicTournamentWriter = Object.freeze({
  removeTournament(options) {
    return getDefaultPublicTournamentWriter().removeTournament(options);
  },
  writeFull(options) {
    return getDefaultPublicTournamentWriter().writeFull(options);
  },
  writePaths(options) {
    return getDefaultPublicTournamentWriter().writePaths(options);
  },
});
