/**
 * Canonical application adapter for the two persisted tournament record shapes.
 *
 * This module only interprets records in memory. It does not migrate Firebase
 * data, and every normalizing/updating operation returns a new object.
 */

export const TOURNAMENT_GROUP_A = 'A';
export const TOURNAMENT_GROUP_B = 'B';

const LEGACY_METADATA_KEYS = [
  'id',
  'name',
  'date',
  'createdAt',
  'tournamentMessage',
  'portalIdTournament',
  'collaborators',
  'owner',
  'ownerUid',
  '_ownerUid',
];

const defaultPreferences = {
  technical: {
    technicalFirst: 13,
    technicalSecond: 7,
  },
  maxScore: 13,
  playOffTeams: 8,
  playOffEnabled: false,
  playOffFormat: 'single',
  grandFinalMode: 'single',
  fieldsStart: 1,
  lanesPoolEnabled: false,
  lanesPoolFrom: 1,
  lanesPoolTo: 10,
  lanesExcluded: '',
  withCadrage: false,
  withBarrage: false,
  barrageTeams: 8,
  playB: false,
  timeLimitEnabled: false,
  timeLimit: 45,
  playoffTimeLimit: 70,
  noTimeLimitFinale: false,
  cochonettesEnabled: false,
  cochonettesEnabledPlayoff: false,
  cochonettes: 1,
  groupDrawMethod: 'seeded',
  groupFormat: 'round_robin',
  groupSwissRounds: 3,
  swissRoundsCount: null,
  prizePlaces: 3,
  isTestTournament: false,
  cadrageLosersToB: false,
  colorSchema: '',
};

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
}

function normalizeGroup(group) {
  return group === TOURNAMENT_GROUP_B ? TOURNAMENT_GROUP_B : TOURNAMENT_GROUP_A;
}

export function createTournamentData(overrides = {}) {
  const clonedOverrides = cloneValue(overrides);
  const tournament = {
    games: [],
    teams: [],
    system: 'swiss',
    roundIsActive: false,
    useRating: false,
    playoff: false,
    isCadrage: false,
    supermelePlayers: 2,
    supermeleMode: 'ideal',
    supermeleTetATet: true,
    tournamentIsFinished: false,
    preferences: cloneValue(defaultPreferences),
    ...clonedOverrides,
  };
  return {
    ...tournament,
    games: Array.isArray(clonedOverrides.games) ? clonedOverrides.games : [],
    teams: Array.isArray(clonedOverrides.teams) ? clonedOverrides.teams : [],
    preferences: {
      ...cloneValue(defaultPreferences),
      ...(isObject(clonedOverrides.preferences) ? clonedOverrides.preferences : {}),
    },
  };
}

export function isTournamentEnvelope(record) {
  return isObject(record) && isObject(record.main);
}

/** Return the persisted Group A competition node. */
export function getTournamentMain(record) {
  if (!isObject(record)) return null;
  return isTournamentEnvelope(record) ? record.main : record;
}

export function hasTournamentGroup(record, group = TOURNAMENT_GROUP_B) {
  if (normalizeGroup(group) === TOURNAMENT_GROUP_A) return !!getTournamentMain(record);
  const key = isTournamentEnvelope(record) ? 'tournamentB' : 'groupB';
  return isObject(record?.[key]);
}

/**
 * Return the persisted competition node for a group. A missing Group B falls
 * back to Group A; callers that need to distinguish the fallback should use
 * getTournamentStorageTarget() or getTournamentPresentation().
 */
export function getTournamentGroup(record, group = TOURNAMENT_GROUP_A) {
  const requestedGroup = normalizeGroup(group);
  if (requestedGroup === TOURNAMENT_GROUP_B && hasTournamentGroup(record, requestedGroup)) {
    return isTournamentEnvelope(record) ? record.tournamentB : record.groupB;
  }
  return getTournamentMain(record);
}

export function getActiveTournamentGroup(record) {
  return getTournamentGroup(record, record?.activeGroup);
}

/**
 * Metadata remains separate from competition data. Envelope metadata is the
 * wrapper minus its structural fields; legacy metadata is selected explicitly
 * from the root competition record.
 */
export function getTournamentMetadata(record, fallback = {}) {
  const metadata = cloneValue(isObject(fallback) ? fallback : {});
  if (!isObject(record)) return metadata;

  if (isTournamentEnvelope(record)) {
    Object.entries(record).forEach(([key, value]) => {
      if (!['main', 'tournamentB', 'groupB', 'activeGroup'].includes(key)) {
        metadata[key] = cloneValue(value);
      }
    });
    return metadata;
  }

  LEGACY_METADATA_KEYS.forEach((key) => {
    if (record[key] !== undefined) metadata[key] = cloneValue(record[key]);
  });
  return metadata;
}

/**
 * Describe the exact Firebase node used for a selected group. When Group B is
 * missing, the default behavior safely targets Group A. Pass allowFallback:
 * false when discovering/subscribing to the absent B node itself.
 */
export function getTournamentStorageTarget(
  record,
  group = record?.activeGroup || TOURNAMENT_GROUP_A,
  { allowFallback = true } = {},
) {
  const requestedGroup = normalizeGroup(group);
  const envelope = isTournamentEnvelope(record);

  if (requestedGroup === TOURNAMENT_GROUP_B) {
    const prefix = envelope ? 'tournamentB/' : 'groupB/';
    if (hasTournamentGroup(record, requestedGroup)) {
      return {
        data: envelope ? record.tournamentB : record.groupB,
        prefix,
        group: TOURNAMENT_GROUP_B,
        requestedGroup,
        exists: true,
      };
    }
    if (!allowFallback) {
      return { data: null, prefix, group: TOURNAMENT_GROUP_B, requestedGroup, exists: false };
    }
  }

  return {
    data: getTournamentMain(record),
    prefix: envelope ? 'main/' : '',
    group: TOURNAMENT_GROUP_A,
    requestedGroup,
    exists: !!getTournamentMain(record),
  };
}

/** A presentation model that keeps metadata and competition data explicit. */
export function getTournamentPresentation(record, group = record?.activeGroup || TOURNAMENT_GROUP_A) {
  const target = getTournamentStorageTarget(record, group);
  return {
    record,
    metadata: getTournamentMetadata(record),
    competition: target.data,
    group: target.group,
    requestedGroup: target.requestedGroup,
    prefix: target.prefix,
    hasGroupB: hasTournamentGroup(record, TOURNAMENT_GROUP_B),
  };
}

function normalizeCompetition(data, { groupB = false, fallbackCompetition = null } = {}) {
  const fallbackConfig = isObject(fallbackCompetition)
    ? {
        system: fallbackCompetition.system,
        useRating: fallbackCompetition.useRating,
        supermelePlayers: fallbackCompetition.supermelePlayers,
        supermeleMode: fallbackCompetition.supermeleMode,
        supermeleTetATet: fallbackCompetition.supermeleTetATet,
        preferences: fallbackCompetition.preferences,
      }
    : {};
  const normalized = createTournamentData({
    ...fallbackConfig,
    ...(isObject(data) ? data : {}),
    preferences: {
      ...(isObject(fallbackConfig.preferences) ? fallbackConfig.preferences : {}),
      ...(isObject(data?.preferences) ? data.preferences : {}),
    },
  });
  if (groupB) normalized.isTournamentB = true;
  return normalized;
}

/**
 * Normalize an owned, shared, public, or archived snapshot without mutating or
 * retaining mutable references to the caller's input.
 */
export function normalizeTournamentRecord(record, { id, ownerUid } = {}) {
  if (!isObject(record)) return null;
  const source = cloneValue(record);

  if (isTournamentEnvelope(source)) {
    const normalized = {
      ...source,
      main: normalizeCompetition(source.main),
      tournamentB: isObject(source.tournamentB) ? normalizeCompetition(source.tournamentB, { groupB: true }) : null,
    };
    normalized.activeGroup =
      normalizeGroup(source.activeGroup) === TOURNAMENT_GROUP_B && normalized.tournamentB
        ? TOURNAMENT_GROUP_B
        : TOURNAMENT_GROUP_A;
    if (normalized.id == null && id != null) normalized.id = id;
    if (ownerUid != null) normalized._ownerUid = ownerUid;
    return normalized;
  }

  const normalized = normalizeCompetition(source);
  normalized.id = source.id ?? id;
  normalized.groupB = isObject(source.groupB)
    ? normalizeCompetition(source.groupB, { groupB: true, fallbackCompetition: source })
    : (source.groupB ?? null);
  normalized.activeGroup =
    normalizeGroup(source.activeGroup) === TOURNAMENT_GROUP_B && normalized.groupB
      ? TOURNAMENT_GROUP_B
      : TOURNAMENT_GROUP_A;
  if (ownerUid != null) normalized._ownerUid = ownerUid;
  return normalized;
}

/** Replace one persisted group node while preserving the original record shape. */
export function replaceTournamentGroup(record, group, value) {
  if (!isObject(record)) return record;
  const requestedGroup = normalizeGroup(group);
  const nextValue = cloneValue(value);
  if (requestedGroup === TOURNAMENT_GROUP_B) {
    const key = isTournamentEnvelope(record) ? 'tournamentB' : 'groupB';
    return { ...record, [key]: nextValue };
  }
  if (isTournamentEnvelope(record)) return { ...record, main: nextValue };
  return nextValue;
}

/** Shallow-patch one persisted group node without mutating the source record. */
export function updateTournamentGroup(record, group, patch) {
  const current = getTournamentStorageTarget(record, group, { allowFallback: false }).data || {};
  return replaceTournamentGroup(record, group, { ...current, ...cloneValue(patch) });
}
