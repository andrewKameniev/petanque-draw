import { regions } from '@/helpers';
import {
  formatCoachName,
  syncTeamCoaches,
  syncTeamPlayers,
  syncTirParticipants,
  FIELD_SETS,
} from '@/services/portal-sync';

export { formatCoachName };

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

export function refreshTournamentPlayerDetails(teams, portalTeams) {
  const result = syncTeamPlayers(teams, portalTeams, { fields: FIELD_SETS.protocol });
  const coachResult = syncTeamCoaches(teams, portalTeams);
  return {
    total: result.total,
    matched: result.matched,
    changed: result.changedPlayers,
    coachesChanged: coachResult.changedTeams,
    missing: result.missing,
  };
}

export function refreshTirParticipantDetails(participants, portalTeams) {
  const result = syncTirParticipants(participants, portalTeams, { fields: FIELD_SETS.tir });
  return {
    total: result.total,
    matched: result.matched,
    changed: result.changedPlayers,
    missing: result.missing + result.ambiguous,
  };
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
