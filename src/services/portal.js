const PORTAL_EXPORT_BASE_URL = 'https://portal.petanque.org.ua/tournament/team_export';

export class PortalServiceError extends Error {
  constructor(code, message, { status, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'PortalServiceError';
    this.code = code;
    if (status != null) this.status = status;
  }
}

export function buildPortalTournamentUrl(portalId, { cacheBuster = Date.now() } = {}) {
  const id = String(portalId ?? '').trim();
  if (!id) throw new PortalServiceError('invalid-id', 'Portal tournament ID is required');

  const url = new globalThis.URL(`${PORTAL_EXPORT_BASE_URL}/${encodeURIComponent(id)}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('_fresh', String(cacheBuster));
  return url;
}

export async function fetchPortalTournamentTeams(portalId, { fetchImpl = globalThis.fetch, cacheBuster } = {}) {
  const url = buildPortalTournamentUrl(portalId, { cacheBuster });
  let response;
  try {
    response = await fetchImpl(url, { cache: 'no-store' });
  } catch (cause) {
    throw new PortalServiceError('network', 'Portal request failed', { cause });
  }

  if (!response?.ok) {
    const status = response?.status;
    const message = status ? `Portal responded ${status}` : 'Portal request failed';
    throw new PortalServiceError('http', message, { status });
  }

  let data;
  try {
    data = await response.json();
  } catch (cause) {
    throw new PortalServiceError('invalid-json', 'Portal returned invalid JSON', { cause });
  }

  if (!Array.isArray(data?.teams)) {
    throw new PortalServiceError('invalid-response', 'Portal returned an invalid tournament export');
  }
  return data.teams;
}

function normalizeId(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('uk-UA');
}

function canonicalNameKey(surname, name) {
  const normalizedSurname = normalizeName(surname);
  const normalizedName = normalizeName(name);
  return normalizedSurname && normalizedName ? `canonical:${normalizedSurname}|${normalizedName}` : '';
}

function fullNameKey(value) {
  const normalized = normalizeName(value);
  return normalized ? `full:${normalized}` : '';
}

function addToIndex(map, key, entry) {
  if (!key) return;
  const entries = map.get(key) || [];
  if (!entries.includes(entry)) entries.push(entry);
  map.set(key, entries);
}

function portalEntryNameKeys(team, player) {
  const surname = String(player?.surname || '').trim();
  const name = String(player?.name || '').trim();
  const secondName = String(player?.second_name || '').trim();
  return [
    canonicalNameKey(surname, name),
    fullNameKey([surname, name].filter(Boolean).join(' ')),
    fullNameKey([name, surname].filter(Boolean).join(' ')),
    fullNameKey([surname, name, secondName].filter(Boolean).join(' ')),
    fullNameKey([name, secondName, surname].filter(Boolean).join(' ')),
    fullNameKey(team?.name),
  ].filter(Boolean);
}

export function createPortalPlayerIndex(portalTeams) {
  const index = {
    entries: [],
    byPlayerId: new Map(),
    byTeamId: new Map(),
    byName: new Map(),
  };

  for (const team of Array.isArray(portalTeams) ? portalTeams : []) {
    for (const player of Array.isArray(team?.players) ? team.players : []) {
      const entry = { team, player };
      index.entries.push(entry);
      addToIndex(index.byPlayerId, normalizeId(player?.id), entry);
      addToIndex(index.byTeamId, normalizeId(team?.id), entry);
      portalEntryNameKeys(team, player).forEach((key) => addToIndex(index.byName, key, entry));
    }
  }

  return index;
}

function standardNameKeys(player) {
  const canonical = canonicalNameKey(player?.surname, player?.name);
  if (canonical) return [canonical];
  return [fullNameKey(player?.name)].filter(Boolean);
}

function tirNameKeys(participant) {
  return [
    canonicalNameKey(participant?.surname, participant?.firstName),
    fullNameKey(participant?.protocolName),
    fullNameKey(participant?.name),
  ].filter(Boolean);
}

export const standardPlayerAdapter = Object.freeze({
  stableIds(player) {
    return [{ type: 'player', value: player?.id }];
  },
  nameKeys: standardNameKeys,
  clubId: (player) => player?.club_id,
  clubName: (player) => player?.club,
});

export const tirParticipantAdapter = Object.freeze({
  stableIds(participant) {
    return [{ type: 'team', value: participant?.portalTeamId }];
  },
  nameKeys: tirNameKeys,
  clubId: (participant) => participant?.club_id,
  clubName: (participant) => participant?.club,
});

function uniqueCandidates(index, keys) {
  const entries = new Set();
  keys.forEach((key) => (index.byName.get(key) || []).forEach((entry) => entries.add(entry)));
  return [...entries];
}

function disambiguateByClub(candidates, localPlayer, adapter) {
  let remaining = candidates;
  const clubId = normalizeId(adapter.clubId?.(localPlayer));
  if (clubId) {
    const byClubId = remaining.filter((entry) => normalizeId(entry.player?.club_id) === clubId);
    if (byClubId.length === 1) return byClubId[0];
    if (byClubId.length > 1) remaining = byClubId;
  }

  const clubName = normalizeName(adapter.clubName?.(localPlayer));
  if (clubName) {
    const byClubName = remaining.filter((entry) => normalizeName(entry.player?.club) === clubName);
    if (byClubName.length === 1) return byClubName[0];
  }
  return null;
}

export function matchPortalPlayer(localPlayer, index, adapter = standardPlayerAdapter) {
  for (const stableId of adapter.stableIds?.(localPlayer) || []) {
    const id = normalizeId(stableId.value);
    if (!id) continue;
    const map = stableId.type === 'team' ? index.byTeamId : index.byPlayerId;
    const matches = map.get(id) || [];
    if (matches.length === 1) return { status: 'matched', entry: matches[0], matchedBy: stableId.type };
    if (matches.length > 1) return { status: 'ambiguous', entry: null, matchedBy: stableId.type };
  }

  const candidates = uniqueCandidates(index, adapter.nameKeys?.(localPlayer) || []);
  if (candidates.length === 1) return { status: 'matched', entry: candidates[0], matchedBy: 'name' };
  if (candidates.length > 1) {
    const clubMatch = disambiguateByClub(candidates, localPlayer, adapter);
    if (clubMatch) return { status: 'matched', entry: clubMatch, matchedBy: 'club' };
    return { status: 'ambiguous', entry: null, matchedBy: 'name' };
  }
  return { status: 'missing', entry: null, matchedBy: null };
}

function sourceField(source, target = source, options = {}) {
  return {
    source,
    target,
    from: 'player',
    allowEmpty: false,
    ...options,
  };
}

function teamField(source, target = source, options = {}) {
  return {
    source,
    target,
    from: 'team',
    allowEmpty: false,
    ...options,
  };
}

export const PROTOCOL_PLAYER_FIELDS = Object.freeze([
  sourceField('second_name', 'second_name', { allowEmpty: true }),
  sourceField('surname'),
  sourceField('name'),
  sourceField('club_id'),
  sourceField('sport_title'),
]);

export const TIR_PROTOCOL_FIELDS = Object.freeze([
  {
    target: 'protocolName',
    allowEmpty: false,
    read(entry) {
      const parts = [entry.player?.surname, entry.player?.name, entry.player?.second_name]
        .map((value) => String(value || '').trim())
        .filter(Boolean);
      return { present: parts.length > 0, value: parts.join(' ') };
    },
  },
  teamField('id', 'portalTeamId'),
  sourceField('club_id'),
  sourceField('sport_title'),
]);

export const ARCHIVE_MEDIA_FIELDS = Object.freeze([
  sourceField('club_logo_url'),
  sourceField('avatar_url'),
  sourceField('club_id'),
  sourceField('club'),
]);

function sameFieldValue(currentValue, nextValue) {
  return String(currentValue ?? '').trim() === String(nextValue ?? '').trim();
}

function readMappedField(field, entry, item) {
  if (field.read) return field.read(entry, item);
  const sourceObject = field.from === 'team' ? entry.team : entry.player;
  const source = field.source || field.target;
  return {
    present: Object.prototype.hasOwnProperty.call(sourceObject || {}, source),
    value: sourceObject?.[source],
  };
}

function synchronizeItems(items, index, adapter, fields) {
  const stats = { total: 0, matched: 0, changedPlayers: 0, changedFields: 0, missing: 0, ambiguous: 0 };
  const nextItems = (Array.isArray(items) ? items : []).map((item) => {
    stats.total += 1;
    const match = matchPortalPlayer(item, index, adapter);
    if (match.status !== 'matched') {
      stats[match.status] += 1;
      return item;
    }

    stats.matched += 1;
    let updated = item;
    for (const field of fields) {
      const source = readMappedField(field, match.entry, item);
      if (!source.present || source.value == null) continue;
      if (!field.allowEmpty && String(source.value).trim() === '') continue;
      if (sameFieldValue(item[field.target], source.value)) continue;
      if (updated === item) updated = { ...item };
      updated[field.target] = source.value;
      stats.changedFields += 1;
    }
    if (updated !== item) stats.changedPlayers += 1;
    return updated;
  });

  return { items: stats.changedPlayers ? nextItems : items, ...stats };
}

function addStats(target, source) {
  for (const field of ['total', 'matched', 'changedPlayers', 'changedFields', 'missing', 'ambiguous']) {
    target[field] += source[field];
  }
}

export function syncStandardTournamentPlayers(teams, portalTeams, { fields = PROTOCOL_PLAYER_FIELDS } = {}) {
  const index = createPortalPlayerIndex(portalTeams);
  const stats = { total: 0, matched: 0, changedPlayers: 0, changedFields: 0, missing: 0, ambiguous: 0 };
  const nextTeams = (Array.isArray(teams) ? teams : []).map((team) => {
    const result = synchronizeItems(team?.players, index, standardPlayerAdapter, fields);
    addStats(stats, result);
    return result.changedPlayers ? { ...team, players: result.items } : team;
  });
  return { teams: stats.changedPlayers ? nextTeams : teams, ...stats };
}

export function syncTirParticipants(participants, portalTeams, { fields = TIR_PROTOCOL_FIELDS } = {}) {
  const result = synchronizeItems(participants, createPortalPlayerIndex(portalTeams), tirParticipantAdapter, fields);
  return {
    participants: result.items,
    ...Object.fromEntries(Object.entries(result).filter(([key]) => key !== 'items')),
  };
}

export function syncArchivedPlayerMedia({ teams, tirParticipants }, portalTeams) {
  const standard = syncStandardTournamentPlayers(teams, portalTeams, { fields: ARCHIVE_MEDIA_FIELDS });
  const tir = syncTirParticipants(tirParticipants, portalTeams, { fields: ARCHIVE_MEDIA_FIELDS });
  const stats = { total: 0, matched: 0, changedPlayers: 0, changedFields: 0, missing: 0, ambiguous: 0 };
  addStats(stats, standard);
  addStats(stats, tir);
  return {
    teams: standard.teams,
    tirParticipants: tir.participants,
    changedCollections: {
      teams: standard.changedPlayers > 0,
      tirParticipants: tir.changedPlayers > 0,
    },
    ...stats,
  };
}
