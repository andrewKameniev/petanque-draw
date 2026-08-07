import { rankPoulesGroups, rankBarrageGroups, rankRoundRobinGroups, rankSwissGroups } from '@/services/group-ranking';
import { getDoubleEliminationPlacements } from '@/services/playoff';

const tournamentNames = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

function getGameResultInGroup(where, team1, team2, difference) {
  if (team1 === team2) {
    return '-';
  }
  const results = [];
  where.forEach((round) => {
    round.forEach((gameInRound) => {
      if (gameInRound.team_1 === team1 && gameInRound.team_2 === team2) {
        if (gameInRound.team_1_score != null || gameInRound.team_2_score != null) {
          results.push({
            score1: toScore(gameInRound.team_1_score),
            score2: toScore(gameInRound.team_2_score),
          });
        }
      } else if (gameInRound.team_2 === team1 && gameInRound.team_1 === team2) {
        if (gameInRound.team_1_score != null || gameInRound.team_2_score != null) {
          results.push({
            score1: toScore(gameInRound.team_2_score),
            score2: toScore(gameInRound.team_1_score),
          });
        }
      }
    });
  });
  if (results.length) {
    if (difference) {
      return results.reduce((sum, r) => sum + (r.score1 - r.score2), 0) || 0;
    } else {
      return results.map((r) => `${r.score1} : ${r.score2}`).join('\n');
    }
  }
}

function getDoubleEliminationRanking(tournament) {
  const bracket = tournament.playOffBracket;
  const placements = {
    ...getDoubleEliminationPlacements(bracket),
    ...(bracket.placements || {}),
  };

  return Object.entries(placements)
    .map(([title, place]) => ({
      place: String(place),
      title,
      players: tournament.teams.find((team) => team.title === title)?.players || [],
    }))
    .sort((first, second) => {
      const firstPlace = Number.parseInt(first.place.split('-')[0], 10);
      const secondPlace = Number.parseInt(second.place.split('-')[0], 10);
      return firstPlace - secondPlace;
    });
}

function getTournamentRanking(tournament, rankingTeams) {
  let tournamentRanking = [];
  if (tournament.playOffBracket) {
    const isDoubleElimination =
      tournament.playOffBracket.format === 'double' ||
      tournament.playOffBracket.stages?.some((stage) => stage.bracket === 'lower');
    if (isDoubleElimination) return getDoubleEliminationRanking(tournament);

    const playOffList = JSON.parse(JSON.stringify(tournament.playOffBracket.stages)).reverse();
    const thirdPlaceGame = tournament.playOffBracket.thirdPlace
      ? JSON.parse(JSON.stringify(tournament.playOffBracket.thirdPlace))
      : undefined;
    let teamsInRanking = [];
    for (let i = 0; i < playOffList.length; i++) {
      if (playOffList[i].stageLabel === 'cadrage') continue;
      if (playOffList[i].stageLabel === 1) {
        const finalGame = playOffList[i].teams[0];
        const team1Wins = toScore(finalGame.team_1_score) > toScore(finalGame.team_2_score);
        const firstPlace = {
          place: '1',
          title: team1Wins ? finalGame.team_1 : finalGame.team_2,
          players:
            tournament.teams.find((team) => team.title === (team1Wins ? finalGame.team_1 : finalGame.team_2))
              ?.players || [],
        };
        tournamentRanking.push(firstPlace);
        teamsInRanking.push(firstPlace.title);
        const secondPlace = {
          place: '2',
          title: team1Wins ? finalGame.team_2 : finalGame.team_1,
          players:
            tournament.teams.find((team) => team.title === (team1Wins ? finalGame.team_2 : finalGame.team_1))
              ?.players || [],
        };
        tournamentRanking.push(secondPlace);
        teamsInRanking.push(secondPlace.title);
      } else if (playOffList[i].stageLabel === 2) {
        if (thirdPlaceGame) {
          const thirdFinished =
            thirdPlaceGame.status === 'finished' ||
            (thirdPlaceGame.team_1_score != null && thirdPlaceGame.team_2_score != null);
          const thirdTeam1Wins = toScore(thirdPlaceGame.team_1_score) > toScore(thirdPlaceGame.team_2_score);
          const thirdWinner = thirdFinished
            ? thirdTeam1Wins
              ? thirdPlaceGame.team_1
              : thirdPlaceGame.team_2
            : thirdPlaceGame.team_1;
          const thirdLoser = thirdFinished
            ? thirdTeam1Wins
              ? thirdPlaceGame.team_2
              : thirdPlaceGame.team_1
            : thirdPlaceGame.team_2;
          const thirdPlace = {
            place: thirdFinished ? '3' : '3-4',
            title: thirdWinner,
            players: tournament.teams.find((team) => team.title === thirdWinner)?.players || [],
          };
          tournamentRanking.push(thirdPlace);
          teamsInRanking.push(thirdPlace.title);
          const fourthPlace = {
            place: thirdFinished ? '4' : '3-4',
            title: thirdLoser,
            players: tournament.teams.find((team) => team.title === thirdLoser)?.players || [],
          };
          tournamentRanking.push(fourthPlace);
          teamsInRanking.push(fourthPlace.title);
        }
      } else {
        playOffList[i].teams.forEach((round) => {
          const teamTitle = teamsInRanking.includes(round.team_1) ? round.team_2 : round.team_1;
          const teamPlace = {
            place: playOffList[i].stageLabel + 1 + '-' + playOffList[i].stageLabel * 2,
            title: teamTitle,
            players: tournament.teams.find((team) => team.title === teamTitle)?.players || [],
          };
          tournamentRanking.push(teamPlace);
          teamsInRanking.push(teamPlace.title);
        });
      }
    }

    const cadrageStage = tournament.playOffBracket.stages.find((s) => s.stageLabel === 'cadrage');
    if (cadrageStage) {
      const cadrageGamesPlayed = cadrageStage.teams.some((g) => g.team_1_score != null);
      if (cadrageGamesPlayed) {
        const cadrageRangeStart = teamsInRanking.length + 1;
        const cadrageRangeEnd = cadrageRangeStart + cadrageStage.teams.length - 1;
        const cadragePlace = cadrageRangeStart + '-' + cadrageRangeEnd;
        cadrageStage.teams.forEach((game) => {
          const loser = toScore(game.team_1_score) > toScore(game.team_2_score) ? game.team_2 : game.team_1;
          if (!teamsInRanking.includes(loser)) {
            tournamentRanking.push({
              place: cadragePlace,
              title: loser,
              players: tournament.teams.find((team) => team.title === loser)?.players || [],
            });
            teamsInRanking.push(loser);
          }
        });
      }
    }

    if (tournament.games?.length > 0) {
      const isNestedGroups = Array.isArray(rankingTeams?.[0]);
      const flatRanking = isNestedGroups ? rankingTeams.flat() : rankingTeams;
      const remainingTeams = flatRanking.filter((team) => !teamsInRanking.includes(team.title));
      if (isNestedGroups) {
        remainingTeams.sort(
          (a, b) =>
            b.wins - a.wins ||
            b.buhgolts - a.buhgolts ||
            b.smallBuhgolts - a.smallBuhgolts ||
            b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus) ||
            b.pointsPlus - a.pointsPlus ||
            b.rating - a.rating,
        );
      }
      const rangeStart = teamsInRanking.length + 1;
      remainingTeams.forEach((team, index) => {
        tournamentRanking.push({
          place: rangeStart + index,
          title: team.title,
          players: team.players,
        });
      });
    }
  } else {
    const isNested = Array.isArray(rankingTeams?.[0]);
    if (
      (tournament.system === 'swiss' && !isNested) ||
      ((tournament.system === 'swiss' || tournament.system === 'groups' || tournament.system === 'poules') &&
        isNested &&
        rankingTeams?.length === 1)
    ) {
      const rankingTeamsList = isNested ? rankingTeams[0] : rankingTeams;
      rankingTeamsList.forEach((team, index) => {
        const teamPlace = {
          place: index + 1,
          title: team.title,
          players: team.players,
        };
        tournamentRanking.push(teamPlace);
      });
    } else if (isNested && rankingTeams?.length > 1) {
      const groupsCount = rankingTeams.length;
      const maxTeams = Math.max(...rankingTeams.map((g) => g.length));
      for (let i = 0; i < maxTeams; i++) {
        rankingTeams.forEach((group) => {
          if (group[i]) {
            const placeStart = i * groupsCount + 1;
            const placeEnd = placeStart + groupsCount - 1;
            tournamentRanking.push({
              place: placeStart === placeEnd ? placeStart : `${placeStart}-${placeEnd}`,
              title: group[i].title,
              players: group[i].players,
            });
          }
        });
      }
    }
  }

  return tournamentRanking;
}

function sortTeams(teamsToSort) {
  countBuhgolts(teamsToSort, 'buhgolts');
  countBuhgolts(teamsToSort, 'smallBuhgolts');
  return teamsToSort.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.buhgolts - a.buhgolts ||
      b.smallBuhgolts - a.smallBuhgolts ||
      b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus) ||
      b.pointsPlus - a.pointsPlus ||
      b.rating - a.rating,
  );
}

function countBuhgolts(whereCount, whatBuhgolts) {
  const whatCount = whatBuhgolts === 'buhgolts' ? 'wins' : 'buhgolts';
  whereCount.forEach((team) => {
    let currentTeamBuhgolts = 0;
    if (team.opponents?.length && team.opponents[0] !== 'placeholder') {
      team.opponents.forEach((opponent) => {
        const opponentIndex = whereCount.findIndex((team) => team.title === opponent);
        if (opponentIndex !== -1) {
          currentTeamBuhgolts += whereCount[opponentIndex][whatCount];
        }
      });
    }
    team[whatBuhgolts] = currentTeamBuhgolts;
  });
  return whereCount;
}

function sortTeamsForSupermele(teamsToSort) {
  return teamsToSort.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus) ||
      b.pointsPlus - a.pointsPlus ||
      b.rating - a.rating,
  );
}

function getH2HStats(games, teamNames) {
  const stats = {};
  teamNames.forEach((name) => {
    stats[name] = { pointsPlus: 0, pointsMinus: 0 };
  });
  const nameSet = new Set(teamNames);
  games.forEach((round) => {
    round.forEach((game) => {
      if (game.team_1_score == null || game.team_2_score == null) return;
      if (game.status === 'in_progress' || game.status === 'not_started') return;
      const t1 = game.team_1;
      const t2 = game.team_2;
      if (!nameSet.has(t1) || !nameSet.has(t2)) return;
      const s1 = toScore(game.team_1_score);
      const s2 = toScore(game.team_2_score);
      stats[t1].pointsPlus += s1;
      stats[t1].pointsMinus += s2;
      stats[t2].pointsPlus += s2;
      stats[t2].pointsMinus += s1;
    });
  });
  return stats;
}

function splitByCriterion(teams, getValue) {
  const groups = [];
  let currentGroup = [teams[0]];
  let currentVal = getValue(teams[0]);
  for (let i = 1; i < teams.length; i++) {
    const val = getValue(teams[i]);
    if (val === currentVal) {
      currentGroup.push(teams[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [teams[i]];
      currentVal = val;
    }
  }
  groups.push(currentGroup);
  return groups;
}

function rankGroupByRegulations(group, games) {
  const sorted = group.slice().sort((a, b) => b.wins - a.wins);
  const winClusters = splitByCriterion(sorted, (t) => t.wins);
  const result = [];
  winClusters.forEach((cluster) => {
    result.push(...rankCluster(cluster, games));
  });
  return result;
}

function rankCluster(cluster, games) {
  if (cluster.length <= 1) return cluster;

  const names = cluster.map((t) => t.title);

  if (cluster.length === 2) {
    return rankTwoTeams(cluster, games);
  }

  const h2h = getH2HStats(games, names);
  const withDiff = cluster.map((t) => ({
    team: t,
    h2hDiff: h2h[t.title].pointsPlus - h2h[t.title].pointsMinus,
  }));
  withDiff.sort((a, b) => b.h2hDiff - a.h2hDiff);

  const diffGroups = splitByCriterion(withDiff, (item) => item.h2hDiff);
  if (diffGroups.length > 1) {
    const result = [];
    diffGroups.forEach((g) => {
      result.push(
        ...rankCluster(
          g.map((item) => item.team),
          games,
        ),
      );
    });
    return result;
  }

  const withPlus = cluster.map((t) => ({
    team: t,
    h2hPlus: h2h[t.title].pointsPlus,
  }));
  withPlus.sort((a, b) => b.h2hPlus - a.h2hPlus);

  const plusGroups = splitByCriterion(withPlus, (item) => item.h2hPlus);
  if (plusGroups.length > 1) {
    const result = [];
    plusGroups.forEach((g) => {
      result.push(
        ...rankCluster(
          g.map((item) => item.team),
          games,
        ),
      );
    });
    return result;
  }

  const withOverall = cluster.slice().sort((a, b) => b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus));

  const overallGroups = splitByCriterion(withOverall, (t) => t.pointsPlus - t.pointsMinus);
  if (overallGroups.length > 1) {
    const result = [];
    overallGroups.forEach((g) => {
      result.push(...rankCluster(g, games));
    });
    return result;
  }

  return cluster;
}

function rankTwoTeams(pair, games) {
  const [a, b] = pair;
  const h2hResult = getGameResultBetween(games, a.title, b.title);
  if (h2hResult > 0) return [a, b];
  if (h2hResult < 0) return [b, a];
  const diffA = a.pointsPlus - a.pointsMinus;
  const diffB = b.pointsPlus - b.pointsMinus;
  if (diffA !== diffB) return diffA > diffB ? [a, b] : [b, a];
  return pair;
}

function getGameResultBetween(games, team1, team2) {
  let diff = 0;
  games.forEach((round) => {
    round.forEach((game) => {
      if (game.team_1_score == null || game.team_2_score == null) return;
      if (game.status === 'in_progress' || game.status === 'not_started') return;
      if (game.team_1 === team1 && game.team_2 === team2) {
        diff += toScore(game.team_1_score) - toScore(game.team_2_score);
      } else if (game.team_1 === team2 && game.team_2 === team1) {
        diff += toScore(game.team_2_score) - toScore(game.team_1_score);
      }
    });
  });
  return diff;
}

function sortSwissWithLiveStats(tournament) {
  if (!tournament.games?.length) {
    return sortTeams(tournament.teams.map((t) => ({ ...t, gamesPlayed: 0 })));
  }

  const activeRoundIdx = tournament.roundIsActive ? tournament.games.length - 1 : -1;
  const activeRoundGames = activeRoundIdx >= 0 ? tournament.games[activeRoundIdx] : [];

  const liveWins = {};
  const livePointsPlus = {};
  const livePointsMinus = {};
  const liveOpponents = {};
  const liveGamesPlayed = {};

  tournament.teams.forEach((t) => {
    liveWins[t.title] = 0;
    livePointsPlus[t.title] = 0;
    livePointsMinus[t.title] = 0;
    liveOpponents[t.title] = [];
    liveGamesPlayed[t.title] = 0;
  });

  activeRoundGames.forEach((game) => {
    if (game.team_1_score == null || game.team_2_score == null) return;
    if (game.status === 'in_progress' || game.status === 'not_started') return;
    const t1 = game.team_1;
    const t2 = game.team_2;
    const s1 = toScore(game.team_1_score);
    const s2 = toScore(game.team_2_score);
    const isTechnical = t2 === 'Technical';
    if (t1 in liveWins) {
      liveOpponents[t1].push(t2);
      livePointsPlus[t1] += s1;
      livePointsMinus[t1] += s2;
      liveGamesPlayed[t1]++;
      if (s1 > s2) liveWins[t1]++;
    }
    if (!isTechnical && t2 in liveWins) {
      liveOpponents[t2].push(t1);
      livePointsPlus[t2] += s2;
      livePointsMinus[t2] += s1;
      liveGamesPlayed[t2]++;
      if (s2 > s1) liveWins[t2]++;
    }
  });

  const completedRounds = activeRoundIdx >= 0 ? tournament.games.slice(0, activeRoundIdx) : tournament.games;
  const pastGamesCount = {};
  tournament.teams.forEach((t) => {
    pastGamesCount[t.title] = 0;
  });
  completedRounds.forEach((round) => {
    round.forEach((game) => {
      if (game.team_1 in pastGamesCount) pastGamesCount[game.team_1]++;
      if (game.team_2 !== 'Technical' && game.team_2 in pastGamesCount) pastGamesCount[game.team_2]++;
    });
  });

  const teams = tournament.teams.map((team) => {
    return {
      ...team,
      wins: team.wins + liveWins[team.title],
      opponents: [...(team.opponents || []), ...liveOpponents[team.title]],
      pointsPlus: team.pointsPlus + livePointsPlus[team.title],
      pointsMinus: team.pointsMinus + livePointsMinus[team.title],
      gamesPlayed: pastGamesCount[team.title] + liveGamesPlayed[team.title],
    };
  });

  return sortTeams(teams);
}

function getTeamsRanking(tournament, activeRound) {
  if (!tournament.teams) return [];

  if (tournament.system === 'poules' && tournament.groups && activeRound > 1) {
    return rankPoulesGroups(tournament);
  }

  if (
    tournament.groups?.length &&
    !tournament.barrage &&
    (activeRound > 1 || tournament.groupSchedule || tournament.groups)
  ) {
    if (tournament.preferences?.groupFormat === 'swiss') {
      return rankSwissGroups(tournament, sortTeams);
    }
    return rankRoundRobinGroups(tournament, rankGroupByRegulations);
  }

  if (
    tournament.barrage &&
    tournament.barrage.groups &&
    activeRound > tournament.barrage.startIndex &&
    !tournament.playOff &&
    !tournament.tournamentIsFinished
  ) {
    return rankBarrageGroups(tournament);
  }

  if (tournament.system === 'supermele') {
    return sortTeamsForSupermele(tournament.teams);
  }

  if (tournament.system === 'tir') {
    return tournament.teams || [];
  }

  return sortSwissWithLiveStats(tournament);
}
function gameHasError(game, maxScore) {
  const s1 = toScore(game.team_1_score);
  const s2 = toScore(game.team_2_score);
  return (s1 !== 0 && s2 !== 0 && s1 === s2) || s1 < 0 || s1 > maxScore || s2 < 0 || s2 > maxScore;
}
function copyContent(data) {
  navigator.clipboard.writeText(data.trim());
}

function isScoreError(game, maxScore) {
  const s1 = toScore(game.team_1_score);
  const s2 = toScore(game.team_2_score);
  return (
    s1 === s2 ||
    game.team_1_score === null ||
    s1 < 0 ||
    s1 > maxScore ||
    game.team_2_score === null ||
    s2 < 0 ||
    s2 > maxScore
  );
}

const regions = {
  1: 'Київ',
  2: 'Харківська',
  3: 'Харківська',
  4: 'Закарпатська',
  6: 'Харківська',
  7: 'Львівська',
  8: 'Львівська',
  9: 'Івано-Франківська',
  10: 'Закарпатська',
  11: 'Львівська',
  12: 'Харківська',
  13: 'Закарпатська',
  14: 'Львівська',
  15: 'Закарпатська',
  16: 'Київська',
  17: 'Полтавська',
  18: 'Чернігівська',
  19: 'Київська',
  20: 'Закарпатська',
  21: 'Київська',
  22: 'Волинська',
  23: 'Закарпатська',
  24: 'Закарпатська',
  25: 'Волинська',
  26: 'Тернопільська',
  27: 'Харківська',
  29: 'Львівська',
  30: 'Львівська',
  31: 'Волинська',
};

const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

function toScore(val) {
  if (val == null) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function updateScoreHistory(game) {
  const s1 = toScore(game.team_1_score);
  const s2 = toScore(game.team_2_score);
  if (s1 === 0 && s2 === 0) {
    if (game.score_history?.length) game.score_history = [];
    return;
  }
  if (!game.score_history) game.score_history = [];
  const last = game.score_history[game.score_history.length - 1];
  if (!last) {
    game.score_history.push({ s1, s2 });
    return;
  }
  if (s1 === last.s1 && s2 === last.s2) {
    return;
  }
  if (s1 < last.s1 || s2 < last.s2) {
    return;
  }
  game.score_history.push({ s1, s2 });
}

function buildEliminationGames(teams, elimCount) {
  const pool = teams.slice(teams.length - elimCount);
  const games = [];
  const half = Math.floor(pool.length / 2);
  for (let i = 0; i < half; i++) {
    games.push({
      team_1: pool[i].title,
      team_2: pool[pool.length - 1 - i].title,
      team_1_score: null,
      team_2_score: null,
    });
  }
  return {
    games,
    qualifiedFrom: teams.length - elimCount,
    bracketSize: teams.length - half,
    completed: false,
  };
}

function pluralizeRounds(n, locale) {
  if (locale === 'ua') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'коло';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'кола';
    return 'кіл';
  }
  return n === 1 ? 'round' : 'rounds';
}

function formatSwissDescription(tournament, locale, labels) {
  const { swiss, playOff, poulesBarrage, systemLabel } = labels;
  let desc;
  if (tournament.games?.length) {
    const barrage = tournament.barrage;
    const swissRounds = barrage ? barrage.startIndex : tournament.games.length;
    const total = tournament.preferences?.swissRoundsCount;
    if (total && swissRounds > 1) {
      desc = swissRounds + '/' + total + ' ' + pluralizeRounds(swissRounds, locale) + ' ' + swiss;
    } else if (total) {
      desc = total + ' ' + pluralizeRounds(total, locale) + ' ' + swiss;
    } else {
      desc = swissRounds + ' ' + pluralizeRounds(swissRounds, locale) + ' ' + swiss;
    }
    if (barrage) {
      desc += ' + ' + poulesBarrage;
    }
  } else {
    desc = systemLabel;
    const total = tournament.preferences?.swissRoundsCount;
    if (total) {
      desc += ' (' + total + ' ' + pluralizeRounds(total, locale) + ')';
    }
  }
  if (tournament.playOff || tournament.playoff || tournament.preferences?.playOffEnabled) {
    desc += ' + ' + playOff;
  }
  return desc;
}

function isValidSlug(slug) {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}

export {
  tournamentNames,
  getGameResultInGroup,
  getTournamentRanking,
  getTeamsRanking,
  gameHasError,
  copyContent,
  regions,
  sortTeams,
  countBuhgolts,
  isScoreError,
  shuffleArray,
  rankGroupByRegulations,
  updateScoreHistory,
  buildEliminationGames,
  pluralizeRounds,
  formatSwissDescription,
  isValidSlug,
  sortSwissWithLiveStats,
  toScore,
};
