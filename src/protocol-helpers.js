import { regions } from '@/helpers';

export function getProtocolTournamentMeta(tournament, tournamentMeta, currentTournament) {
  const sources = [tournamentMeta, tournament, currentTournament];
  const getValue = (field) => sources.find((source) => source?.[field] != null)?.[field];

  return {
    id: getValue('id'),
    name: getValue('name') || '',
    date: getValue('date') || '',
    portalIdTournament: getValue('portalIdTournament'),
  };
}

export function formatName(name) {
  return name.substring(0, 1).toUpperCase() + name.substring(1, name.length).toLowerCase();
}

export function getPlayerThirdName(surname, name, playersNames) {
  const fullName = `${surname || ''} ${name || ''}`;
  const isLatinName = /[A-Za-z]/.test(fullName) && !/[А-Яа-яІіЇїЄєҐґ]/.test(fullName);
  if (isLatinName) return '';

  const s = surname.toUpperCase();
  const n = name.toUpperCase();
  const playerInfo = playersNames.find((item) => item.includes(s + ' ' + n) || item.includes(n + ' ' + s));
  if (playerInfo) {
    const playerInfoArray = playerInfo.split(' ');
    if (playerInfoArray.length >= 3) {
      return formatName(playerInfoArray[2]);
    } else {
      return '!!! ДОПИШІТЬ МЕНЕ!!!';
    }
  } else {
    return '!!! ДОПИШІТЬ МЕНЕ!!!';
  }
}

function normalizePortalPlayerId(id) {
  return id == null ? '' : String(id).trim();
}

function normalizePortalPlayerName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('uk-UA');
}

function portalPlayerNameKey(player) {
  const surname = normalizePortalPlayerName(player?.surname);
  const name = normalizePortalPlayerName(player?.name);
  return surname && name ? `${surname}|${name}` : '';
}

function buildPortalPlayerIndex(portalTeams) {
  const byId = new Map();
  const byName = new Map();

  portalTeams.forEach((team) => {
    (team.players || []).forEach((player) => {
      const id = normalizePortalPlayerId(player.id);
      if (id) byId.set(id, player);

      const nameKey = portalPlayerNameKey(player);
      if (!nameKey) return;
      const matches = byName.get(nameKey) || [];
      matches.push(player);
      byName.set(nameKey, matches);
    });
  });

  return { byId, byName };
}

function findPortalPlayer(player, index) {
  const id = normalizePortalPlayerId(player.id);
  if (id && index.byId.has(id)) return index.byId.get(id);

  const matches = index.byName.get(portalPlayerNameKey(player)) || [];
  if (matches.length === 1) return matches[0];
  if (matches.length > 1 && player.club_id != null) {
    const clubId = normalizePortalPlayerId(player.club_id);
    return matches.find((match) => normalizePortalPlayerId(match.club_id) === clubId) || null;
  }
  return null;
}

function portalFieldChanged(currentValue, portalValue) {
  return String(currentValue ?? '').trim() !== String(portalValue ?? '').trim();
}

export function refreshTournamentPlayerDetails(teams, portalTeams) {
  const index = buildPortalPlayerIndex(portalTeams);
  const fields = ['second_name', 'surname', 'name', 'club_id', 'sport_title'];
  const stats = { total: 0, matched: 0, changed: 0, missing: 0 };

  teams.forEach((team) => {
    (team.players || []).forEach((player, playerIndex) => {
      stats.total += 1;
      const portalPlayer = findPortalPlayer(player, index);
      if (!portalPlayer) {
        stats.missing += 1;
        return;
      }

      stats.matched += 1;
      const updatedPlayer = { ...player };
      let changed = false;
      fields.forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(portalPlayer, field)) return;
        if ((field === 'surname' || field === 'name') && !portalPlayer[field]) return;
        if (!portalFieldChanged(player[field], portalPlayer[field])) return;
        updatedPlayer[field] = portalPlayer[field] ?? '';
        changed = true;
      });

      if (changed) {
        team.players.splice(playerIndex, 1, updatedPlayer);
        stats.changed += 1;
      }
    });
  });

  return stats;
}

function portalTirNameKeys(team, player) {
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
    .map(normalizePortalPlayerName)
    .filter(Boolean);
}

export function refreshTirParticipantDetails(participants, portalTeams) {
  const byName = new Map();
  const byTeamId = new Map();
  portalTeams.forEach((team) => {
    const player = team.players?.[0];
    if (!player) return;
    const entry = { team, player };
    if (team.id != null) byTeamId.set(String(team.id), entry);
    portalTirNameKeys(team, player).forEach((key) => {
      const matches = byName.get(key) || [];
      if (!matches.includes(entry)) matches.push(entry);
      byName.set(key, matches);
    });
  });

  const stats = { total: participants.length, matched: 0, changed: 0, missing: 0 };
  participants.forEach((participant) => {
    const idMatch = participant.portalTeamId != null ? byTeamId.get(String(participant.portalTeamId)) : null;
    const matches = idMatch ? [idMatch] : byName.get(normalizePortalPlayerName(participant.name)) || [];
    if (matches.length !== 1) {
      stats.missing += 1;
      return;
    }

    const { team, player } = matches[0];
    stats.matched += 1;
    const protocolName = [player.surname, player.name, player.second_name].filter(Boolean).join(' ').trim();
    const updates = {
      protocolName: protocolName || participant.protocolName || participant.name,
      portalTeamId: team.id,
      club_id: player.club_id,
      sport_title: player.sport_title,
    };
    let changed = false;
    Object.entries(updates).forEach(([field, value]) => {
      if (value == null || !portalFieldChanged(participant[field], value)) return;
      participant[field] = value;
      changed = true;
    });
    if (changed) stats.changed += 1;
  });

  return stats;
}

export function formatDateToHumanReadable(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const formatter = new Intl.DateTimeFormat('uk-UA', options);

  const formattedParts = formatter.formatToParts(date);

  const day = formattedParts.find((part) => part.type === 'day').value;
  const month = formattedParts.find((part) => part.type === 'month').value;
  const year = formattedParts.find((part) => part.type === 'year').value;

  return `${day} ${month} ${year} року`;
}

export function getTeamPlaceInGroups(place, groupsLength) {
  if (+place === 1) {
    return '1-' + (Number(place) + (groupsLength - 1));
  } else {
    return +place * groupsLength - 1 + '-' + Number(place) * groupsLength;
  }
}

export function getAllTeams(groups) {
  let allTeams = [];
  groups.forEach((group) => {
    group.map((team, index) => {
      team.place = index + 1;
    });
    allTeams = [...allTeams, ...group];
  });
  return allTeams;
}

export function countPlayers(teams) {
  let playersCount = 0;
  teams.forEach((team) => {
    playersCount = playersCount + team.players.length;
  });
  return playersCount;
}

export function chunkParticipants(list, chunkSize) {
  if (!list) return [];
  const chunks = [];
  for (let i = 0; i < list.length; i += chunkSize) {
    chunks.push(list.slice(i, i + chunkSize));
  }
  return chunks;
}

export function buildTeamTitle(players, titleCounts, mixedTeamCount) {
  const firstPlayerClubName = regions[players[0].club_id];
  if (firstPlayerClubName) {
    if (players.every((player) => regions[player.club_id] === firstPlayerClubName)) {
      const regionGenitive = firstPlayerClubName === 'Київ' ? 'Київської' : firstPlayerClubName.replace(/ка$/, 'кої');
      let title = `Команда ${regionGenitive} області`;
      if (titleCounts[title]) {
        titleCounts[title]++;
      } else {
        titleCounts[title] = 1;
      }
      title += ` ${titleCounts[title]}`;
      return { title, mixedTeamCount };
    } else {
      const title = `Збірна команда ${mixedTeamCount}`;
      return { title, mixedTeamCount: mixedTeamCount + 1 };
    }
  } else {
    const rawSurname = players[0].surname || players[0].name || '';
    const captainSurname = rawSurname.split('/')[0].trim();
    const title = `Команда ${formatName(captainSurname)}`;
    return { title, mixedTeamCount };
  }
}
