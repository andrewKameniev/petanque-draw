import { fetchPortalTeams } from './portal';

function normalizeId(id) {
  return id == null ? '' : String(id).trim();
}

function normalizeName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('uk-UA');
}

function playerNameKey(player) {
  const surname = normalizeName(player?.surname);
  const name = normalizeName(player?.name);
  return surname && name ? `${surname}|${name}` : '';
}

function buildPlayerIndex(portalTeams) {
  const byId = new Map();
  const byName = new Map();

  portalTeams.forEach((team) => {
    (team.players || []).forEach((player) => {
      const id = normalizeId(player.id);
      if (id) byId.set(id, player);

      const nameKey = playerNameKey(player);
      if (!nameKey) return;
      const matches = byName.get(nameKey) || [];
      matches.push(player);
      byName.set(nameKey, matches);
    });
  });

  return { byId, byName };
}

function findPlayer(player, index) {
  const id = normalizeId(player.id);
  if (id && index.byId.has(id)) return index.byId.get(id);

  const nameKey = playerNameKey(player);
  const matches = nameKey ? index.byName.get(nameKey) || [] : [];
  if (matches.length === 1) return matches[0];

  if (matches.length > 1 && player.club_id != null) {
    const clubId = normalizeId(player.club_id);
    const byClub = matches.find((m) => normalizeId(m.club_id) === clubId);
    if (byClub) return byClub;
  }
  if (matches.length > 1 && player.club) {
    const clubName = normalizeName(player.club);
    const byClubName = matches.find((m) => normalizeName(m.club) === clubName);
    if (byClubName) return byClubName;
  }

  return null;
}

function fieldChanged(currentValue, portalValue) {
  return String(currentValue ?? '').trim() !== String(portalValue ?? '').trim();
}

function tirNameKeys(team, player) {
  const surname = String(player?.surname || '').trim();
  const firstName = String(player?.name || '').trim();
  const secondName = String(player?.second_name || '').trim();
  return [
    team?.name,
    [surname, firstName].filter(Boolean).join(' '),
    [firstName, surname].filter(Boolean).join(' '),
    [surname, firstName, secondName].filter(Boolean).join(' '),
    [firstName, secondName, surname].filter(Boolean).join(' '),
  ]
    .map(normalizeName)
    .filter(Boolean);
}

function buildTirIndex(portalTeams) {
  const byName = new Map();
  const byTeamId = new Map();
  portalTeams.forEach((team) => {
    const player = team.players?.[0];
    if (!player) return;
    const entry = { team, player };
    if (team.id != null) byTeamId.set(String(team.id), entry);
    tirNameKeys(team, player).forEach((key) => {
      const matches = byName.get(key) || [];
      if (!matches.includes(entry)) matches.push(entry);
      byName.set(key, matches);
    });
  });
  return { byName, byTeamId };
}

export const FIELD_SETS = {
  protocol: ['second_name', 'surname', 'name', 'club_id', 'sport_title'],
  tir: ['protocolName', 'portalTeamId', 'club_id', 'sport_title'],
  media: ['club_logo_url', 'avatar_url', 'club_id', 'club'],
};

const REQUIRED_FIELDS = new Set(['surname', 'name']);

export function syncTeamPlayers(teams, portalTeams, { fields = FIELD_SETS.protocol } = {}) {
  const index = buildPlayerIndex(portalTeams);
  const stats = { total: 0, matched: 0, changedPlayers: 0, changedFields: 0, missing: 0, ambiguous: 0 };

  teams.forEach((team) => {
    (team.players || []).forEach((player, playerIndex) => {
      stats.total += 1;
      const portalPlayer = findPlayer(player, index);
      if (!portalPlayer) {
        stats.missing += 1;
        return;
      }

      stats.matched += 1;
      const updatedPlayer = { ...player };
      let playerChanged = false;

      fields.forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(portalPlayer, field)) return;
        if (REQUIRED_FIELDS.has(field) && !portalPlayer[field]) return;
        if (!fieldChanged(player[field], portalPlayer[field])) return;
        updatedPlayer[field] = portalPlayer[field] ?? '';
        playerChanged = true;
        stats.changedFields += 1;
      });

      if (playerChanged) {
        team.players.splice(playerIndex, 1, updatedPlayer);
        stats.changedPlayers += 1;
      }
    });
  });

  return stats;
}

export function syncTirParticipants(participants, portalTeams, { fields = FIELD_SETS.tir } = {}) {
  const index = buildTirIndex(portalTeams);
  const stats = {
    total: participants.length,
    matched: 0,
    changedPlayers: 0,
    changedFields: 0,
    missing: 0,
    ambiguous: 0,
  };

  participants.forEach((participant) => {
    const idMatch = participant.portalTeamId != null ? index.byTeamId.get(String(participant.portalTeamId)) : null;
    const matches = idMatch ? [idMatch] : index.byName.get(normalizeName(participant.name)) || [];

    if (matches.length === 0) {
      stats.missing += 1;
      return;
    }
    if (matches.length > 1) {
      stats.ambiguous += 1;
      return;
    }

    const { team, player } = matches[0];
    stats.matched += 1;

    const protocolName = [player.surname, player.name, player.second_name].filter(Boolean).join(' ').trim();
    const portalValues = {
      protocolName: protocolName || participant.protocolName || participant.name,
      portalTeamId: team.id,
      club_id: player.club_id,
      sport_title: player.sport_title,
      club_logo_url: player.club_logo_url,
      avatar_url: player.avatar_url,
      club: player.club,
    };

    let changed = false;
    fields.forEach((field) => {
      const value = portalValues[field];
      if (value == null) return;
      if (!fieldChanged(participant[field], value)) return;
      participant[field] = value;
      changed = true;
      stats.changedFields += 1;
    });
    if (changed) stats.changedPlayers += 1;
  });

  return stats;
}

export async function syncFromPortal(portalId, { teams, tirParticipants, fields }) {
  const portalTeams = await fetchPortalTeams(portalId);
  const results = { teams: null, tirParticipants: null };

  if (teams) {
    results.teams = syncTeamPlayers(teams, portalTeams, { fields });
  }
  if (tirParticipants) {
    results.tirParticipants = syncTirParticipants(tirParticipants, portalTeams, { fields });
  }

  return results;
}
