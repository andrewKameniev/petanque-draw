const RESERVED_TEAM_TITLES = new Set(['technical', 'placeholder']);
const ROOT_NON_COMPETITION_KEYS = new Set([
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
  'activeGroup',
  'groupB',
]);
const TEAM_OBJECT_MARKER_KEYS = new Set([
  'players',
  'rating',
  'portalTeamId',
  'opponents',
  'lanes',
  'buhgolts',
  'smallBuhgolts',
  'pointsPlus',
  'pointsMinus',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
}

function valuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => valuesEqual(item, right[index]))
    );
  }
  if (!isObject(left) || !isObject(right)) return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => hasOwn(right, key) && valuesEqual(left[key], right[key]))
  );
}

function joinPath(parent, child) {
  return parent ? `${parent}/${child}` : String(child);
}

function comparablePortalId(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

export class TeamReplacementError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'TeamReplacementError';
    this.code = code;
  }
}

/**
 * Normalize either a raw Portal export team or a team already converted to the
 * application's internal shape.
 */
export function normalizePortalTeam(portalTeam) {
  if (!isObject(portalTeam)) {
    throw new TeamReplacementError('A Portal team object is required', 'INVALID_PORTAL_TEAM');
  }

  const title = String(portalTeam.title ?? portalTeam.name ?? '').trim();
  if (!title) {
    throw new TeamReplacementError('The replacement team title is required', 'INVALID_TARGET_TITLE');
  }
  if (RESERVED_TEAM_TITLES.has(title.toLocaleLowerCase())) {
    throw new TeamReplacementError(`${title} is a reserved team title`, 'RESERVED_TARGET_TITLE');
  }

  const portalTeamId = portalTeam.portalTeamId ?? portalTeam.id;
  if (comparablePortalId(portalTeamId) === null) {
    throw new TeamReplacementError('The replacement Portal team ID is required', 'INVALID_PORTAL_TEAM_ID');
  }

  const parsedRating = Number(portalTeam.rating ?? portalTeam.power ?? 0);
  const normalized = {
    title,
    players: Array.isArray(portalTeam.players) ? cloneValue(portalTeam.players) : [],
    rating: Number.isFinite(parsedRating) ? parsedRating : 0,
    portalTeamId,
  };

  if (hasOwn(portalTeam, 'club') && portalTeam.club !== undefined) {
    normalized.club = cloneValue(portalTeam.club);
  }
  if (hasOwn(portalTeam, 'coach') && portalTeam.coach !== undefined) {
    normalized.coach = cloneValue(portalTeam.coach);
  }

  return normalized;
}

function validateReplacement(competition, oldTitle, replacement) {
  if (!isObject(competition) || !Array.isArray(competition.teams)) {
    throw new TeamReplacementError('The active competition must contain a teams array', 'INVALID_COMPETITION');
  }
  if (typeof oldTitle !== 'string' || oldTitle.trim() === '') {
    throw new TeamReplacementError('The source team title is required', 'INVALID_SOURCE_TITLE');
  }

  const sourceIndexes = competition.teams.flatMap((team, index) =>
    isObject(team) && team.title === oldTitle ? [index] : [],
  );
  if (sourceIndexes.length === 0) {
    throw new TeamReplacementError(`Team "${oldTitle}" was not found`, 'SOURCE_TEAM_NOT_FOUND');
  }
  if (sourceIndexes.length > 1) {
    throw new TeamReplacementError(`Team "${oldTitle}" is not unique`, 'SOURCE_TEAM_NOT_UNIQUE');
  }

  const teamIndex = sourceIndexes[0];
  const titleCollision = competition.teams.some(
    (team, index) => index !== teamIndex && isObject(team) && team.title === replacement.title,
  );
  if (titleCollision) {
    throw new TeamReplacementError(`Team "${replacement.title}" already exists`, 'TARGET_TITLE_COLLISION');
  }

  const replacementPortalId = comparablePortalId(replacement.portalTeamId);
  const portalIdCollision = competition.teams.some(
    (team, index) =>
      index !== teamIndex && isObject(team) && comparablePortalId(team.portalTeamId) === replacementPortalId,
  );
  if (portalIdCollision) {
    throw new TeamReplacementError(
      `Portal team ${replacement.portalTeamId} is already linked`,
      'PORTAL_TEAM_ID_COLLISION',
    );
  }

  return teamIndex;
}

function renameReferences(value, oldTitle, newTitle, path, updates, trackUpdates = true) {
  if (typeof value === 'string') {
    if (oldTitle !== newTitle && value === oldTitle) {
      if (trackUpdates) updates[path] = newTitle;
      return newTitle;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      renameReferences(item, oldTitle, newTitle, joinPath(path, index), updates, trackUpdates),
    );
  }
  if (!isObject(value)) return value;

  const renamed = {};
  Object.entries(value).forEach(([key, item]) => {
    if (!path && ROOT_NON_COMPETITION_KEYS.has(key)) {
      renamed[key] = cloneValue(item);
      return;
    }

    if (oldTitle !== newTitle && key === oldTitle) {
      if (hasOwn(value, newTitle)) {
        throw new TeamReplacementError(
          `Cannot rename object key "${oldTitle}" because "${newTitle}" already exists`,
          'REFERENCE_KEY_COLLISION',
        );
      }

      const oldPath = joinPath(path, key);
      const newPath = joinPath(path, newTitle);
      const nextValue = renameReferences(item, oldTitle, newTitle, newPath, updates, false);
      renamed[newTitle] = nextValue;
      if (trackUpdates) {
        updates[oldPath] = null;
        updates[newPath] = cloneValue(nextValue);
      }
      return;
    }

    const nextPath = joinPath(path, key);
    renamed[key] = renameReferences(item, oldTitle, newTitle, nextPath, updates, trackUpdates);
  });
  return renamed;
}

function isTeamObject(value, oldTitle) {
  return (
    isObject(value) && value.title === oldTitle && Object.keys(value).some((key) => TEAM_OBJECT_MARKER_KEYS.has(key))
  );
}

function updateIdentity(team, replacement, path, updates) {
  ['title', 'players', 'rating', 'portalTeamId'].forEach((key) => {
    if (!valuesEqual(team[key], replacement[key])) {
      team[key] = cloneValue(replacement[key]);
      updates[joinPath(path, key)] = cloneValue(replacement[key]);
    }
  });

  if (hasOwn(replacement, 'club') && !valuesEqual(team.club, replacement.club)) {
    team.club = cloneValue(replacement.club);
    updates[joinPath(path, 'club')] = cloneValue(replacement.club);
  }
  if (hasOwn(replacement, 'coach') && !valuesEqual(team.coach, replacement.coach)) {
    team.coach = cloneValue(replacement.coach);
    updates[joinPath(path, 'coach')] = cloneValue(replacement.coach);
  }
}

function updateTeamCopies(source, target, oldTitle, replacement, path, updates) {
  if (Array.isArray(source)) {
    source.forEach((item, index) => {
      updateTeamCopies(item, target[index], oldTitle, replacement, joinPath(path, index), updates);
    });
    return;
  }
  if (!isObject(source) || !isObject(target)) return;

  if (isTeamObject(source, oldTitle)) updateIdentity(target, replacement, path, updates);

  Object.entries(source).forEach(([key, item]) => {
    if (!path && ROOT_NON_COMPETITION_KEYS.has(key)) return;

    const nextKey = key === oldTitle && oldTitle !== replacement.title ? replacement.title : key;
    updateTeamCopies(item, target[nextKey], oldTitle, replacement, joinPath(path, nextKey), updates);
  });
}

function readPath(root, path) {
  return path.split('/').reduce((value, segment) => value?.[segment], root);
}

function finalizeUpdates(candidates, competition) {
  const paths = Object.keys(candidates).sort((left, right) => {
    const depthDifference = left.split('/').length - right.split('/').length;
    return depthDifference || left.localeCompare(right);
  });
  const retained = [];

  paths.forEach((path) => {
    if (!retained.some((parent) => path.startsWith(`${parent}/`))) retained.push(path);
  });

  return Object.fromEntries(
    retained.map((path) => [path, candidates[path] === null ? null : cloneValue(readPath(competition, path))]),
  );
}

/**
 * Immutably replace a team identity in one active competition node.
 *
 * `updates` contains Firebase-compatible, slash-delimited paths relative to
 * the competition root. It can be prefixed by the caller and sent in one
 * atomic multi-path update.
 */
export function replaceTeamInCompetition(competition, oldTitle, portalTeam) {
  const replacement = normalizePortalTeam(portalTeam);
  const teamIndex = validateReplacement(competition, oldTitle, replacement);
  const candidateUpdates = {};
  const nextCompetition = renameReferences(competition, oldTitle, replacement.title, '', candidateUpdates);
  updateTeamCopies(competition, nextCompetition, oldTitle, replacement, '', candidateUpdates);
  updateIdentity(nextCompetition.teams[teamIndex], replacement, `teams/${teamIndex}`, candidateUpdates);

  const updates = finalizeUpdates(candidateUpdates, nextCompetition);
  const changedTopLevelPaths = [...new Set(Object.keys(updates).map((path) => path.split('/')[0]))];

  return {
    competition: nextCompetition,
    tournament: nextCompetition,
    updates,
    changedTopLevelPaths,
    replacement: cloneValue(replacement),
    oldTitle,
    newTitle: replacement.title,
    teamIndex,
  };
}
