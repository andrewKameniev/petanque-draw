import { sortTeams, shuffleArray, toScore } from '@/helpers';
import { getAvailableLaneNumbers } from '@/services/lanes';

export function getRandomWithOneExclusion(lengthOfArray, indexToExclude1 = null, indexToExclude2 = null) {
  const exclusions = [indexToExclude1, indexToExclude2].filter((v) => v !== null);
  const validCount = lengthOfArray - exclusions.length;
  if (validCount <= 0) return 0;
  let rand;
  do {
    rand = Math.floor(Math.random() * lengthOfArray);
  } while (exclusions.includes(rand));
  return rand;
}

export function generateCompetitors(teamList, activeRound, useRating) {
  let teamIndex, opponentIndex;
  if (activeRound === 1 && !useRating) {
    teamIndex = getRandomWithOneExclusion(teamList.length);
    opponentIndex = getRandomWithOneExclusion(teamList.length, teamIndex);
    return { teamIndex, opponentIndex };
  } else {
    teamIndex = 0;
    const defaultOpponentIndex = activeRound === 1 ? teamList.length / 2 : 1;
    opponentIndex = defaultOpponentIndex;
    while (teamList[teamIndex].opponents.includes(teamList[opponentIndex].title)) {
      opponentIndex++;
      if (!teamList[opponentIndex]) {
        opponentIndex = -1;
        return { teamIndex, opponentIndex };
      }
    }
    return { teamIndex, opponentIndex };
  }
}

export function generateCompetitorsFirstLast(teamList, activeRound, useRating, reverse = false, iteration = 0) {
  let teamIndex, opponentIndex;
  if (activeRound === 1 && !useRating) {
    teamIndex = getRandomWithOneExclusion(teamList.length);
    opponentIndex = getRandomWithOneExclusion(teamList.length, teamIndex);
    return { teamIndex, opponentIndex };
  } else {
    let teamsWithSameWins, isOneTeamWithSameWins;
    if (reverse) {
      teamIndex = 0;
      opponentIndex = iteration % 2 === 0 ? teamList.length - 1 : teamIndex + 1;
    } else {
      teamsWithSameWins = teamList.filter((team) => team.wins === teamList[0].wins);
      isOneTeamWithSameWins = teamsWithSameWins.length === 1;
      if (isOneTeamWithSameWins) {
        teamsWithSameWins.push(teamList[1]);
      }
      if (teamsWithSameWins.length % 2 !== 0) {
        teamsWithSameWins.splice(teamsWithSameWins.length - 1, 1);
      }
      teamIndex = 0;
      opponentIndex = activeRound === 1 ? teamList.length / 2 : teamsWithSameWins.length - 1;
    }
    if (reverse) {
      while (teamList[teamIndex].opponents.includes(teamList[opponentIndex]?.title)) {
        opponentIndex = iteration ? (iteration % 2 === 0 ? opponentIndex - 1 : opponentIndex + 1) : opponentIndex + 1;
        if (!teamList[opponentIndex]) {
          opponentIndex = -1;
          return { teamIndex, opponentIndex };
        }
      }
    } else {
      while (teamList[teamIndex].opponents.includes(teamList[opponentIndex]?.title)) {
        isOneTeamWithSameWins || teamsWithSameWins.length < 3 ? opponentIndex++ : opponentIndex--;
        if (!teamList[opponentIndex] || teamIndex === opponentIndex) {
          opponentIndex = -1;
          return { teamIndex, opponentIndex };
        }
      }
    }
    return { teamIndex, opponentIndex };
  }
}

export function drawSwissRound(tournament, rankingTeams, activeRound) {
  const round = [];
  let teamsToDraw = JSON.parse(JSON.stringify(rankingTeams));
  teamsToDraw = sortTeams(teamsToDraw);

  let expandListIteration = 0;
  const stopExpandIndex = Math.round(teamsToDraw.length / 2 - 1);
  let teamsDrawed = [];

  const isTechnical = teamsToDraw.length % 2 !== 0;

  if (isTechnical) {
    let technicalTeamIndex =
      tournament.useRating || activeRound !== 1
        ? teamsToDraw.length - 1
        : getRandomWithOneExclusion(teamsToDraw.length);
    let technicalTeam = teamsToDraw[technicalTeamIndex];
    if (technicalTeam.opponents.includes('Technical')) {
      const fewestTechnicals = teamsToDraw.reduce(
        (best, t, i) => {
          const count = t.opponents.filter((o) => o === 'Technical').length;
          return count < best.count || (count === best.count && i > best.index) ? { count, index: i } : best;
        },
        { count: Infinity, index: technicalTeamIndex },
      );
      technicalTeamIndex = fewestTechnicals.index;
      technicalTeam = teamsToDraw[technicalTeamIndex];
    }
    round.push({
      team_1: technicalTeam.title,
      team_1_score: tournament.preferences.technical.technicalFirst,
      team_2: 'Technical',
      team_2_score: tournament.preferences.technical.technicalSecond,
      status: 'finished',
      winner: technicalTeam.title,
    });
    teamsToDraw.splice(technicalTeamIndex, 1);
  }

  while (teamsToDraw.length > 0) {
    let competitors = generateCompetitorsFirstLast(teamsToDraw, activeRound, tournament.useRating);
    while (competitors.opponentIndex === -1 && expandListIteration < stopExpandIndex) {
      expandListIteration++;
      if (teamsDrawed.length) {
        round.splice(-expandListIteration);
        for (let k = 1; k <= expandListIteration * 2; k++) {
          teamsToDraw.unshift(teamsDrawed[teamsDrawed.length - k]);
        }
        teamsDrawed.splice(teamsDrawed.length - expandListIteration * 2, expandListIteration * 2);
      }
      competitors = generateCompetitorsFirstLast(
        teamsToDraw,
        activeRound,
        tournament.useRating,
        true,
        expandListIteration,
      );
    }
    if (expandListIteration === stopExpandIndex && competitors.opponentIndex === -1) {
      return { round: null, error: 'cantDraw' };
    }
    round.push({
      team_1: teamsToDraw[competitors.teamIndex].title,
      team_1_score: null,
      team_2: teamsToDraw[Math.floor(competitors.opponentIndex)].title,
      team_2_score: null,
      status: 'not_started',
    });
    teamsDrawed.push(teamsToDraw[competitors.teamIndex], teamsToDraw[Math.floor(competitors.opponentIndex)]);
    const teamsToRemove = [
      teamsToDraw[competitors.teamIndex].title,
      teamsToDraw[Math.floor(competitors.opponentIndex)].title,
    ];
    teamsToDraw = teamsToDraw.filter((team) => !teamsToRemove.includes(team.title));
  }

  return { round, error: null };
}

export function drawSupermeleRound(tournament, rankingTeams) {
  const round = [];
  const playersCount = tournament.teams.length;
  const isDoubles = tournament.supermelePlayers === 2;
  const avoidTechnical = !!tournament.supermeleTetATet;

  let superMeleScheme;
  let technicalPlayer = null;

  if (isDoubles && avoidTechnical) {
    const doublesCount = Math.floor(playersCount / 2);
    const leftover = playersCount % 2;
    if (leftover === 1) {
      const totalWithTriple = doublesCount - 1 + 1;
      if (totalWithTriple % 2 === 0) {
        superMeleScheme = { doubles: doublesCount - 1, triples: 1 };
      } else {
        superMeleScheme = { doubles: doublesCount, triples: 0 };
        technicalPlayer = true;
      }
    } else {
      superMeleScheme = { doubles: doublesCount, triples: 0 };
    }
  } else if (!isDoubles && avoidTechnical) {
    const triplesCount = Math.floor(playersCount / 3);
    const leftover = playersCount - triplesCount * 3;
    if (leftover === 0) {
      superMeleScheme = { doubles: 0, triples: triplesCount };
    } else if (leftover === 2) {
      superMeleScheme = { doubles: 1, triples: triplesCount };
    } else {
      superMeleScheme = { doubles: 2, triples: triplesCount - 1 };
    }
    const totalTeams = superMeleScheme.doubles + superMeleScheme.triples;
    if (totalTeams % 2 !== 0 && superMeleScheme.triples >= 2) {
      superMeleScheme.triples -= 2;
      superMeleScheme.doubles += 3;
    }
  } else if (isDoubles) {
    let gamesCount = Math.floor(playersCount / 2);
    while (gamesCount % 2 !== 0) {
      gamesCount--;
    }
    if (playersCount > gamesCount * 3) {
      gamesCount += 2;
    }
    superMeleScheme = { doubles: gamesCount, triples: 0 };
    let sum = superMeleScheme.doubles * 2;
    while (sum !== playersCount) {
      superMeleScheme.doubles--;
      superMeleScheme.triples++;
      sum = superMeleScheme.doubles * 2 + superMeleScheme.triples * 3;
      if (superMeleScheme.doubles < 0) {
        superMeleScheme.doubles = 0;
        break;
      }
    }
  } else {
    let gamesCount = Math.floor(playersCount / 3);
    while (gamesCount % 2 !== 0) {
      gamesCount++;
    }
    superMeleScheme = { doubles: 0, triples: gamesCount };
    let sum = superMeleScheme.triples * 3;
    while (sum !== playersCount) {
      superMeleScheme.triples--;
      superMeleScheme.doubles++;
      sum = superMeleScheme.doubles * 2 + superMeleScheme.triples * 3;
      if (superMeleScheme.triples < 0) {
        superMeleScheme.triples = 0;
        break;
      }
    }
  }

  const isFirstRound = !tournament.games || tournament.games.length === 0;
  const teamsToDraw = JSON.parse(JSON.stringify(rankingTeams));

  if (technicalPlayer) {
    const sorted = [...teamsToDraw].sort(
      (a, b) => a.wins - b.wins || a.pointsPlus - a.pointsMinus - (b.pointsPlus - b.pointsMinus),
    );
    let techPlayer = sorted.find((t) => !(t.opponents || []).includes('Technical'));
    if (!techPlayer) techPlayer = sorted[0];
    round.push({
      team_1: techPlayer.title,
      team_1_players: [techPlayer.title],
      team_1_score: tournament.preferences.technical.technicalFirst,
      team_2: 'Technical',
      team_2_players: [],
      team_2_score: tournament.preferences.technical.technicalSecond,
      status: 'finished',
      winner: techPlayer.title,
    });
    const techIdx = teamsToDraw.findIndex((t) => t.title === techPlayer.title);
    teamsToDraw.splice(techIdx, 1);
  }

  const opponentSets = new Map(teamsToDraw.map((t) => [t.title, new Set(t.opponents || [])]));
  const teamsForRound = [];

  function removeByTitle(title) {
    const idx = teamsToDraw.findIndex((t) => t.title === title);
    if (idx !== -1) teamsToDraw.splice(idx, 1);
  }

  function wereTeammates(a, b) {
    return opponentSets.get(a)?.has(b);
  }

  const useBalancedPairing = tournament.supermeleMode !== 'standard';

  if (!useBalancedPairing || (isFirstRound && !tournament.useRating)) {
    for (let i = 1; i <= superMeleScheme.doubles; i++) {
      if (teamsToDraw.length < 2) break;
      const p1 = getRandomWithOneExclusion(teamsToDraw.length);
      let p2 = getRandomWithOneExclusion(teamsToDraw.length, p1);
      teamsForRound.push({
        title: teamsToDraw[p1].title + ', ' + teamsToDraw[p2].title,
        players: [teamsToDraw[p1].title, teamsToDraw[p2].title],
      });
      const titles = [teamsToDraw[p1].title, teamsToDraw[p2].title];
      titles.forEach(removeByTitle);
    }
    for (let j = 1; j <= superMeleScheme.triples; j++) {
      if (teamsToDraw.length < 3) break;
      const p1 = getRandomWithOneExclusion(teamsToDraw.length);
      const p2 = getRandomWithOneExclusion(teamsToDraw.length, p1);
      const p3 = getRandomWithOneExclusion(teamsToDraw.length, p1, p2);
      teamsForRound.push({
        title: teamsToDraw[p1].title + ', ' + teamsToDraw[p2].title + ', ' + teamsToDraw[p3].title,
        players: [teamsToDraw[p1].title, teamsToDraw[p2].title, teamsToDraw[p3].title],
      });
      const titles = [teamsToDraw[p1].title, teamsToDraw[p2].title, teamsToDraw[p3].title];
      titles.forEach(removeByTitle);
    }
  } else {
    if (isFirstRound) {
      teamsToDraw.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      teamsToDraw.sort((a, b) => b.wins - a.wins || b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus));
    }

    for (let i = 1; i <= superMeleScheme.doubles; i++) {
      if (teamsToDraw.length < 2) break;
      const top = teamsToDraw[0];
      let bottomIdx = teamsToDraw.length - 1;
      let attempts = 0;
      while (attempts < teamsToDraw.length - 1 && wereTeammates(top.title, teamsToDraw[bottomIdx].title)) {
        bottomIdx--;
        attempts++;
      }
      if (bottomIdx <= 0) bottomIdx = teamsToDraw.length - 1;
      const bottom = teamsToDraw[bottomIdx];
      teamsForRound.push({
        title: top.title + ', ' + bottom.title,
        players: [top.title, bottom.title],
      });
      removeByTitle(top.title);
      removeByTitle(bottom.title);
    }

    for (let j = 1; j <= superMeleScheme.triples; j++) {
      if (teamsToDraw.length < 3) break;
      const top = teamsToDraw[0];
      let bottomIdx = teamsToDraw.length - 1;
      let attempts = 0;
      while (attempts < teamsToDraw.length - 1 && wereTeammates(top.title, teamsToDraw[bottomIdx].title)) {
        bottomIdx--;
        attempts++;
      }
      if (bottomIdx <= 0) bottomIdx = teamsToDraw.length - 1;
      const bottom = teamsToDraw[bottomIdx];
      const midIdx = Math.floor(teamsToDraw.length / 2);
      let mid = teamsToDraw[midIdx];
      if (mid.title === top.title || mid.title === bottom.title) {
        mid = teamsToDraw[midIdx === 0 ? 1 : midIdx - 1] || teamsToDraw[1];
      }
      teamsForRound.push({
        title: top.title + ', ' + mid.title + ', ' + bottom.title,
        players: [top.title, mid.title, bottom.title],
      });
      removeByTitle(top.title);
      removeByTitle(mid.title);
      removeByTitle(bottom.title);
    }
  }

  let tetATetTeam = null;
  if (avoidTechnical && teamsForRound.length % 2 !== 0) {
    const doubleIdx = teamsForRound.findLastIndex((t) => t.players.length === 2);
    if (doubleIdx !== -1) {
      tetATetTeam = teamsForRound.splice(doubleIdx, 1)[0];
    }
  }

  while (teamsForRound.length >= 2) {
    round.push({
      team_1: teamsForRound[0].title,
      team_1_players: teamsForRound[0].players,
      team_1_score: null,
      team_2: teamsForRound[1].title,
      team_2_players: teamsForRound[1].players,
      team_2_score: null,
      status: 'not_started',
    });
    teamsForRound.splice(0, 2);
  }

  if (tetATetTeam) {
    const [p1, p2] = tetATetTeam.players;
    round.push({
      team_1: p1,
      team_1_players: [p1],
      team_1_score: null,
      team_2: p2,
      team_2_players: [p2],
      team_2_score: null,
      status: 'not_started',
    });
  }

  return round;
}

export function assignLanes(games, tournament) {
  const technicalGames = [];
  games = games.filter((game) => {
    if (game.team_2 === 'Technical') {
      technicalGames.push(game);
      return false;
    }
    return true;
  });

  const isSupermele = tournament.system === 'supermele';
  const teamMap = new Map(tournament.teams.map((t) => [t.title, t]));
  const teamsMatrix = {};
  const requiredLaneCount = Math.floor(tournament.teams.length / 2);
  const configuredLanes = getAvailableLaneNumbers(tournament, requiredLaneCount).map((lane) => lane - 1);
  const laneCount = configuredLanes.length;

  tournament.teams.forEach((team) => {
    teamsMatrix[team.title] = {};
    configuredLanes.forEach((lane) => {
      teamsMatrix[team.title][lane] = 0;
    });
    if (team.lanes && team.lanes.length) {
      team.lanes.forEach((lane) => {
        if (teamsMatrix[team.title][lane] !== undefined) {
          teamsMatrix[team.title][lane]++;
        }
      });
    }
  });

  function getLastLane(teamTitle) {
    const team = teamMap.get(teamTitle);
    if (team?.lanes?.length) return team.lanes[team.lanes.length - 1];
    return null;
  }

  function getWeight(game, lane) {
    if (isSupermele) {
      const players = [...(game.team_1_players || []), ...(game.team_2_players || [])];
      let weight = players.reduce((sum, p) => sum + (teamsMatrix[p]?.[lane] || 0), 0);
      if (players.some((p) => getLastLane(p) === lane)) weight += laneCount;
      return weight;
    }
    let weight = (teamsMatrix[game.team_1]?.[lane] || 0) + (teamsMatrix[game.team_2]?.[lane] || 0);
    if (getLastLane(game.team_1) === lane || getLastLane(game.team_2) === lane) weight += laneCount;
    return weight;
  }

  function getPlayedLanes(game) {
    if (isSupermele) {
      const players = [...(game.team_1_players || []), ...(game.team_2_players || [])];
      const lanes = new Set();
      players.forEach((p) => {
        const team = teamMap.get(p);
        if (team?.lanes) team.lanes.forEach((l) => lanes.add(l));
      });
      return lanes;
    }
    const lanes = new Set();
    const team1 = teamMap.get(game.team_1);
    const team2 = teamMap.get(game.team_2);
    if (team1?.lanes) team1.lanes.forEach((l) => lanes.add(l));
    if (team2?.lanes) team2.lanes.forEach((l) => lanes.add(l));
    return lanes;
  }

  function updateMatrix(game, lane) {
    if (isSupermele) {
      const players = [...(game.team_1_players || []), ...(game.team_2_players || [])];
      players.forEach((p) => {
        if (teamsMatrix[p]?.[lane] !== undefined) teamsMatrix[p][lane]++;
      });
    } else {
      if (teamsMatrix[game.team_1]) teamsMatrix[game.team_1][lane]++;
      if (teamsMatrix[game.team_2]) teamsMatrix[game.team_2][lane]++;
    }
  }

  const scheduledMatches = [];
  let availableLanes = shuffleArray([...configuredLanes]);

  games.forEach((game) => {
    if (game.team_2 !== 'Technical') {
      let bestLane = null;
      let minWeight = Infinity;
      const playedLanes = getPlayedLanes(game);

      const freshLanes = availableLanes.filter((i) => !playedLanes.has(i));
      const candidates = freshLanes.length > 0 ? freshLanes : availableLanes;

      candidates.forEach((i) => {
        const weight = getWeight(game, i);
        if (weight < minWeight) {
          minWeight = weight;
          bestLane = i;
        }
      });
      game.lane = bestLane;
      updateMatrix(game, bestLane);
      availableLanes = availableLanes.filter((lane) => lane !== bestLane);
      scheduledMatches.push(game);
    }
  });

  // Swap-repair: resolve consecutive-lane conflicts by swapping with non-conflicting games
  function hasConsecutiveConflict(game, lane) {
    if (isSupermele) {
      const players = [...(game.team_1_players || []), ...(game.team_2_players || [])];
      return players.some((p) => getLastLane(p) === lane);
    }
    return getLastLane(game.team_1) === lane || getLastLane(game.team_2) === lane;
  }

  let improved = true;
  let passes = 0;
  while (improved && passes < scheduledMatches.length) {
    improved = false;
    passes++;
    for (let i = 0; i < scheduledMatches.length; i++) {
      const gameA = scheduledMatches[i];
      if (!hasConsecutiveConflict(gameA, gameA.lane)) continue;
      for (let j = 0; j < scheduledMatches.length; j++) {
        if (i === j) continue;
        const gameB = scheduledMatches[j];
        if (!hasConsecutiveConflict(gameA, gameB.lane) && !hasConsecutiveConflict(gameB, gameA.lane)) {
          const tmp = gameA.lane;
          gameA.lane = gameB.lane;
          gameB.lane = tmp;
          improved = true;
          break;
        }
      }
    }
  }

  technicalGames.forEach((game) => scheduledMatches.push(game));
  return scheduledMatches.sort((a, b) => a.lane - b.lane);
}

export function resetGroupsScheme(tournament) {
  const schemas = [];
  tournament.groups.forEach((group) => {
    let groupIndexes = [];
    group.forEach((_, index) => {
      groupIndexes.push(index);
    });
    if (group.length % 2 !== 0) {
      groupIndexes.push(group.length);
    }
    const scheme = { top: [], bottom: [] };
    for (let i = 0; i < groupIndexes.length / 2; i++) {
      scheme.top.push(i);
    }
    for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
      scheme.bottom.push(i);
    }
    schemas.push(scheme);
  });
  return schemas;
}

function createGroupsSeeded(tournament, teamsToDraw, groups, groupsQuantity) {
  if (groupsQuantity === 2 && teamsToDraw.length < 33) {
    const indexesScheme = {
      0: [1, 32, 16, 17, 9, 24, 8, 25, 5, 28, 12, 21, 13, 20, 4, 29],
      1: [3, 30, 14, 19, 11, 22, 6, 27, 7, 26, 10, 23, 15, 18, 2, 31],
    };
    Object.keys(indexesScheme).forEach((key) => {
      indexesScheme[key].forEach((item) => {
        const teamIndexInList = teamsToDraw[item - 1]
          ? tournament.teams.findIndex((team) => team.title === teamsToDraw[item - 1].title)
          : -1;
        if (teamIndexInList !== -1) {
          groups[key].push(tournament.teams[teamIndexInList]);
        }
      });
    });
  } else {
    const teamsPerPot = groupsQuantity;
    const pots = [];
    for (let i = 0; i < teamsToDraw.length; i += teamsPerPot) {
      pots.push(teamsToDraw.slice(i, i + teamsPerPot));
    }
    pots.forEach((pot) => {
      const shuffled = shuffleArray([...pot]);
      shuffled.forEach((team, i) => {
        const groupIdx = i % groupsQuantity;
        const teamIndexInList = tournament.teams.findIndex((t) => t.title === team.title);
        if (teamIndexInList !== -1) {
          groups[groupIdx].push(tournament.teams[teamIndexInList]);
        }
      });
    });
  }
}

function createGroupsSnake(tournament, teamsToDraw, groups, groupsQuantity) {
  let direction = 1;
  let groupIdx = 0;
  for (let i = 0; i < teamsToDraw.length; i++) {
    const teamIndexInList = tournament.teams.findIndex((t) => t.title === teamsToDraw[i].title);
    if (teamIndexInList !== -1) {
      groups[groupIdx].push(tournament.teams[teamIndexInList]);
    }
    if (direction === 1 && groupIdx === groupsQuantity - 1) {
      direction = -1;
    } else if (direction === -1 && groupIdx === 0) {
      direction = 1;
    } else {
      groupIdx += direction;
    }
  }
}

function createGroupsBalancedRandom(tournament, teamsToDraw, groups, groupsQuantity) {
  const iterations = 1000;
  let bestGroups = null;
  let bestDiff = Infinity;

  for (let iter = 0; iter < iterations; iter++) {
    const shuffled = shuffleArray([...teamsToDraw]);
    const candidate = [];
    for (let i = 0; i < groupsQuantity; i++) candidate.push([]);

    shuffled.forEach((team, i) => {
      candidate[i % groupsQuantity].push(team);
    });

    const totals = candidate.map((g) => g.reduce((sum, t) => sum + (t.rating || 0), 0));
    const diff = Math.max(...totals) - Math.min(...totals);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestGroups = candidate;
    }
  }

  bestGroups.forEach((group, gIdx) => {
    group.forEach((team) => {
      const teamIndexInList = tournament.teams.findIndex((t) => t.title === team.title);
      if (teamIndexInList !== -1) {
        groups[gIdx].push(tournament.teams[teamIndexInList]);
      }
    });
  });
}

function computeRoundRobinSchedule(n) {
  const rounds = [];
  const positions = Array.from({ length: n }, (_, i) => i);
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      pairs.push([positions[i], positions[n - 1 - i]]);
    }
    rounds.push(pairs);
    const last = positions.pop();
    positions.splice(1, 0, last);
  }
  return rounds;
}

function getMeetingRound(schedule, posA, posB) {
  for (let r = 0; r < schedule.length; r++) {
    for (const [a, b] of schedule[r]) {
      if ((a === posA && b === posB) || (a === posB && b === posA)) return r;
    }
  }
  return -1;
}

function getTeamClub(team) {
  return team.players?.[0]?.club || null;
}

function buildClubMap(teams) {
  const map = {};
  teams.forEach((t) => {
    const club = getTeamClub(t);
    if (club) {
      if (!map[club]) map[club] = [];
      map[club].push(t.title);
    }
  });
  return map;
}

function findSameClubPairs(teams) {
  const clubMap = buildClubMap(teams);
  const pairs = [];
  Object.values(clubMap).forEach((members) => {
    if (members.length >= 2) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          pairs.push([members[i], members[j]]);
        }
      }
    }
  });
  return pairs;
}

function scoreConstraints(orderedTeams, schedule) {
  const titleToPos = {};
  orderedTeams.forEach((t, i) => {
    titleToPos[t.title] = i;
  });

  const sameClubPairs = findSameClubPairs(orderedTeams);
  if (!sameClubPairs.length) return 0;

  let totalRound = 0;
  for (const [titleA, titleB] of sameClubPairs) {
    const posA = titleToPos[titleA];
    const posB = titleToPos[titleB];
    const round = getMeetingRound(schedule, posA, posB);
    totalRound += round;
  }
  return totalRound;
}

export function generateConstrainedGroups(tournament, teamsInGroup) {
  const groupsQuantity = Math.round(tournament.teams.length / teamsInGroup);
  if (groupsQuantity !== 1) {
    return createGroups(tournament, teamsInGroup);
  }

  const n = tournament.teams.length;
  if (n < 4 || n % 2 !== 0) {
    return createGroups(tournament, teamsInGroup);
  }

  const schedule = computeRoundRobinSchedule(n);
  const sameClubPairs = findSameClubPairs(tournament.teams);

  let bestResult = [...tournament.teams];
  let bestScore = sameClubPairs.length ? scoreConstraints(bestResult, schedule) : 0;

  if (sameClubPairs.length) {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const shuffled = shuffleArray([...tournament.teams]);
      const score = scoreConstraints(shuffled, schedule);
      if (score < bestScore) {
        bestResult = shuffled;
        bestScore = score;
      }
      if (bestScore === 0) break;
    }
  }

  const group = bestResult.map((t) => tournament.teams.find((orig) => orig.title === t.title));

  let groupIndexes = Array.from({ length: n }, (_, i) => i);
  if (n % 2 !== 0) groupIndexes.push(n);
  const scheme = { top: [], bottom: [] };
  for (let i = 0; i < groupIndexes.length / 2; i++) {
    scheme.top.push(i);
  }
  for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
    scheme.bottom.push(i);
  }

  return { groups: [group], schemas: [scheme], warning: null };
}

export function createGroups(tournament, teamsInGroup) {
  const groupsQuantity = Math.round(tournament.teams.length / teamsInGroup);
  let groups = [];
  for (let i = 1; i <= groupsQuantity; i++) {
    groups.push([]);
  }
  let teamsToDraw = JSON.parse(JSON.stringify([...tournament.teams].sort((a, b) => b.rating - a.rating)));

  const drawMethod = tournament.useRating ? tournament.preferences?.groupDrawMethod || 'seeded' : null;

  if (!tournament.useRating) {
    while (teamsToDraw.length >= 1) {
      for (let j = 0; j < teamsToDraw.length; j++) {
        for (let i = 0; i < groupsQuantity; i++) {
          const teamIndex = getRandomWithOneExclusion(teamsToDraw.length);
          if (teamIndex !== -1 && teamsToDraw.length >= 1) {
            const teamIndexInList = tournament.teams.findIndex((team) => team.title === teamsToDraw[teamIndex].title);
            groups[i].push(tournament.teams[teamIndexInList]);
            teamsToDraw.splice(teamIndex, 1);
          }
        }
      }
    }
  } else if (drawMethod === 'snake') {
    createGroupsSnake(tournament, teamsToDraw, groups, groupsQuantity);
  } else if (drawMethod === 'balanced_random') {
    createGroupsBalancedRandom(tournament, teamsToDraw, groups, groupsQuantity);
  } else {
    createGroupsSeeded(tournament, teamsToDraw, groups, groupsQuantity);
  }

  const schemas = [];
  groups.forEach((group) => {
    group.sort((a, b) => b.rating - a.rating);
    let groupIndexes = [];
    group.forEach((_, index) => {
      groupIndexes.push(index);
    });
    if (group.length % 2 !== 0) {
      groupIndexes.push(group.length);
    }
    const scheme = { top: [], bottom: [] };
    for (let i = 0; i < groupIndexes.length / 2; i++) {
      scheme.top.push(i);
    }
    for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
      scheme.bottom.push(i);
    }
    schemas.push(scheme);
  });

  return { groups, schemas };
}

function rotateRoundRobinScheme(scheme) {
  const { top, bottom } = scheme;
  // Move last from top to end of bottom
  bottom.push(top[top.length - 1]);
  // Move first from bottom to second position in top
  top.unshift(bottom[0]);
  // Remove the element that was at end (now second-to-last after unshift)
  top.splice(top.length - 1, 1);
  // Remove the duplicate that landed at index 1
  top.splice(1, 1);
  // Pin position 0 (it stays fixed in round-robin rotation)
  top.unshift(0);
  // Remove the element we moved from bottom
  bottom.splice(0, 1);
}

export function drawGroupsRound(tournament) {
  const round = [];
  tournament.groups.forEach((group, index) => {
    const isTechnical = group.length % 2 !== 0;
    const roundsPerCircle = isTechnical ? group.length : group.length - 1;
    const circles = tournament.roundRobinCircle || 1;
    if (tournament.games?.length >= roundsPerCircle * circles) {
      return;
    }
    const scheme = tournament.groupsScheme[index];
    for (let i = 0; i < scheme.top.length; i++) {
      if (!isTechnical || (scheme.top[i] !== group.length && scheme.bottom[i] !== group.length)) {
        round.push({
          group: index,
          team_1: group[scheme.top[i]].title,
          team_1_score: null,
          team_2: group[scheme.bottom[i]].title,
          team_2_score: null,
          status: 'not_started',
        });
      }
    }
    rotateRoundRobinScheme(scheme);
  });
  return round;
}

export function drawGroupsSwissRound(tournament, activeRound) {
  const round = [];
  const teamMap = new Map(tournament.teams.map((t) => [t.title, t]));

  tournament.groups.forEach((group, groupIndex) => {
    const groupTeams = group.map((g) => teamMap.get(g.title)).filter(Boolean);
    const groupTeamsCopy = JSON.parse(JSON.stringify(groupTeams));
    const groupTitles = new Set(group.map((g) => g.title));

    groupTeamsCopy.forEach((t) => {
      t.opponents = (t.opponents || []).filter((o) => o === 'Technical' || groupTitles.has(o));
    });

    const result = drawSwissRound(
      { ...tournament, teams: groupTeamsCopy, useRating: tournament.useRating },
      groupTeamsCopy,
      activeRound,
    );

    if (result.round) {
      result.round.forEach((game) => {
        round.push({ ...game, group: groupIndex });
      });
    }
  });
  return round;
}

export function reshuffleGroupSchedule(tournament) {
  const groups = tournament.groups;
  const newGroups = [];
  const schemas = [];

  groups.forEach((group) => {
    const n = group.length;
    const schedule = computeRoundRobinSchedule(n % 2 === 0 ? n : n + 1);
    const shuffled = findBalancedOrder(group, schedule);
    newGroups.push(shuffled);

    let groupIndexes = Array.from({ length: n }, (_, i) => i);
    if (n % 2 !== 0) groupIndexes.push(n);
    const scheme = { top: [], bottom: [] };
    for (let i = 0; i < groupIndexes.length / 2; i++) {
      scheme.top.push(i);
    }
    for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
      scheme.bottom.push(i);
    }
    schemas.push(scheme);
  });

  return { groups: newGroups, schemas };
}

function scoreRatingBalance(orderedTeams, schedule) {
  const n = orderedTeams.length;
  const effectiveN = n % 2 === 0 ? n : n + 1;
  const totalRounds = effectiveN - 1;
  let penalty = 0;

  for (let r = 0; r < Math.min(schedule.length, totalRounds); r++) {
    let maxRating = 0;
    for (const [a, b] of schedule[r]) {
      if (a >= n || b >= n) continue;
      const combined = orderedTeams[a].rating + orderedTeams[b].rating;
      if (combined > maxRating) maxRating = combined;
    }
    penalty += maxRating * maxRating;
  }
  return penalty;
}

function findBalancedOrder(group, schedule) {
  const n = group.length;
  if (n < 4) return [...group];

  let bestOrder = [...group];
  let bestScore = scoreRatingBalance(bestOrder, schedule);

  for (let attempt = 0; attempt < 1000; attempt++) {
    const shuffled = shuffleArray([...group]);
    const score = scoreRatingBalance(shuffled, schedule);
    if (score < bestScore) {
      bestOrder = shuffled;
      bestScore = score;
    }
  }
  return bestOrder;
}

export const POULES_DRAW_ERROR = Object.freeze({
  INVALID_TEAM_COUNT: 'invalidPoulesTeamCount',
});

export function isValidPoulesTeamCount(teamsCount) {
  return Number.isInteger(teamsCount) && teamsCount >= 8 && teamsCount % 4 === 0;
}

export function createPoules(tournament) {
  const teamsCount = tournament?.teams?.length;
  if (!isValidPoulesTeamCount(teamsCount)) {
    return { groups: null, error: POULES_DRAW_ERROR.INVALID_TEAM_COUNT };
  }

  const groupsQuantity = teamsCount / 4;
  const groups = [];
  for (let i = 0; i < groupsQuantity; i++) {
    groups.push([]);
  }

  const teamsSorted = [...tournament.teams].sort((a, b) => b.rating - a.rating);

  // Seeding pattern: snake distribution
  // Pot 1 (seeds 1..N/4) go to groups 0,1,2,...
  // Pot 2 (seeds N/4+1..N/2) go to groups ...,2,1,0 (reversed)
  // Pot 3 reversed again, etc.
  let direction = 1;
  let groupIdx = 0;
  for (let i = 0; i < teamsCount; i++) {
    const teamIndexInList = tournament.teams.findIndex((t) => t.title === teamsSorted[i].title);
    groups[groupIdx].push(tournament.teams[teamIndexInList]);

    if (direction === 1 && groupIdx === groupsQuantity - 1) {
      direction = -1;
    } else if (direction === -1 && groupIdx === 0) {
      direction = 1;
    } else {
      groupIdx += direction;
    }
  }

  return { groups, error: null };
}

export function drawPoulesRound(tournament) {
  const round = [];
  const poulesRound = tournament.poulesRound || 1;

  tournament.groups.forEach((group, groupIndex) => {
    if (poulesRound === 1) {
      round.push({
        group: groupIndex,
        team_1: group[0].title,
        team_1_score: null,
        team_2: group[2].title,
        team_2_score: null,
        status: 'not_started',
      });
      round.push({
        group: groupIndex,
        team_1: group[1].title,
        team_1_score: null,
        team_2: group[3].title,
        team_2_score: null,
        status: 'not_started',
      });
    } else if (poulesRound === 2) {
      // Round 2: winners play winners, losers play losers
      const r1Games = tournament.games[tournament.games.length - 1].filter((g) => g.group === groupIndex);
      const game1 = r1Games[0];
      const game2 = r1Games[1];

      const winner1 = toScore(game1.team_1_score) > toScore(game1.team_2_score) ? game1.team_1 : game1.team_2;
      const loser1 = toScore(game1.team_1_score) > toScore(game1.team_2_score) ? game1.team_2 : game1.team_1;
      const winner2 = toScore(game2.team_1_score) > toScore(game2.team_2_score) ? game2.team_1 : game2.team_2;
      const loser2 = toScore(game2.team_1_score) > toScore(game2.team_2_score) ? game2.team_2 : game2.team_1;

      round.push({
        group: groupIndex,
        team_1: winner1,
        team_1_score: null,
        team_2: winner2,
        team_2_score: null,
        status: 'not_started',
      });
      round.push({
        group: groupIndex,
        team_1: loser1,
        team_1_score: null,
        team_2: loser2,
        team_2_score: null,
        status: 'not_started',
      });
    } else if (poulesRound === 3) {
      // Round 3 (barrage): two teams with exactly 1 win play each other
      const teamWins = {};
      group.forEach((t) => {
        teamWins[t.title] = 0;
      });

      tournament.games.forEach((roundGames) => {
        roundGames
          .filter((g) => g.group === groupIndex)
          .forEach((game) => {
            if (toScore(game.team_1_score) > toScore(game.team_2_score)) {
              teamWins[game.team_1]++;
            } else if (toScore(game.team_2_score) > toScore(game.team_1_score)) {
              teamWins[game.team_2]++;
            }
          });
      });

      const oneWinTeams = Object.entries(teamWins)
        .filter(([, wins]) => wins === 1)
        .map(([title]) => title);

      if (oneWinTeams.length === 2) {
        round.push({
          group: groupIndex,
          team_1: oneWinTeams[0],
          team_1_score: null,
          team_2: oneWinTeams[1],
          team_2_score: null,
          status: 'not_started',
        });
      }
    }
  });
  return round;
}

export function getPoulesQualifiedTeams(tournament) {
  const groupQualified = [];
  tournament.groups.forEach((group, groupIndex) => {
    const teamWins = {};
    const teamPoints = {};
    group.forEach((t) => {
      teamWins[t.title] = 0;
      teamPoints[t.title] = 0;
    });

    tournament.games.forEach((roundGames) => {
      roundGames
        .filter((g) => g.group === groupIndex)
        .forEach((game) => {
          const s1 = toScore(game.team_1_score);
          const s2 = toScore(game.team_2_score);
          if (s1 > s2) {
            teamWins[game.team_1]++;
          } else if (s2 > s1) {
            teamWins[game.team_2]++;
          }
          teamPoints[game.team_1] = (teamPoints[game.team_1] || 0) + (s1 - s2);
          teamPoints[game.team_2] = (teamPoints[game.team_2] || 0) + (s2 - s1);
        });
    });

    const qualifiedFromGroup = Object.entries(teamWins)
      .filter(([, wins]) => wins >= 2)
      .sort((a, b) => b[1] - a[1] || (teamPoints[b[0]] || 0) - (teamPoints[a[0]] || 0))
      .map(([title]) => tournament.teams.find((t) => t.title === title));

    groupQualified.push(qualifiedFromGroup);
  });

  // Interleave: all group winners first, then all runners-up
  const qualified = [];
  const maxPerGroup = Math.max(...groupQualified.map((g) => g.length));
  for (let i = 0; i < maxPerGroup; i++) {
    groupQualified.forEach((group) => {
      if (group[i]) qualified.push(group[i]);
    });
  }

  // Pad to next power of 2 with bye placeholders for proper bracket generation
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(qualified.length)));
  while (qualified.length < nextPow2) {
    qualified.push({ title: null, isBye: true });
  }

  return qualified;
}

export function saveResultsForRound(tournament, round) {
  if (tournament.games.length <= 2) {
    tournament.teams.forEach((team) => {
      team.opponents = (team.opponents || []).filter((item) => item !== 'placeholder');
    });
  }
  const teamMap = new Map(tournament.teams.map((t) => [t.title, t]));
  if (tournament.system === 'supermele') {
    tournament.games[round].forEach((game) => {
      const s1 = toScore(game.team_1_score);
      const s2 = toScore(game.team_2_score);
      game.team_1_players.forEach((player) => {
        const team = teamMap.get(player);
        if (team) {
          if (!team.opponents) team.opponents = [];
          const partners = game.team_1_players.filter((item) => item !== player);
          partners.forEach((item) => team.opponents.push(item));
          team.pointsPlus += s1;
          team.pointsMinus += s2;
          if (s1 > s2) {
            team.wins++;
          }
        }
      });
      game.team_2_players.forEach((player) => {
        const team = teamMap.get(player);
        if (team) {
          if (!team.opponents) team.opponents = [];
          const partners = game.team_2_players.filter((item) => item !== player);
          partners.forEach((item) => team.opponents.push(item));
          team.pointsPlus += s2;
          team.pointsMinus += s1;
          if (s2 > s1) {
            team.wins++;
          }
        }
      });
    });
  } else {
    tournament.games[round].forEach((game) => {
      const s1 = toScore(game.team_1_score);
      const s2 = toScore(game.team_2_score);
      const firstTeam = teamMap.get(game.team_1);
      if (firstTeam) {
        if (!firstTeam.opponents) firstTeam.opponents = [];
        firstTeam.opponents.push(game.team_2);
        firstTeam.pointsPlus += s1;
        firstTeam.pointsMinus += s2;
      }
      const secondTeam = teamMap.get(game.team_2);
      if (secondTeam) {
        if (!secondTeam.opponents) secondTeam.opponents = [];
        secondTeam.opponents.push(game.team_1);
        secondTeam.pointsPlus += s2;
        secondTeam.pointsMinus += s1;
      }
      if (s1 > s2) {
        if (firstTeam) {
          firstTeam.wins++;
        }
      } else if (s2 > s1 && secondTeam && game.team_2 !== 'Technical') {
        secondTeam.wins++;
      }
    });
  }
}
