export const SCORING = { carreau: 5, reussi: 3, touche: 1, manque: 0 };
export const ATELIER_KEYS = ['atelier1', 'atelier2', 'atelier3', 'atelier4', 'atelier5'];
export const DISTANCES_FULL = [6, 7, 8, 9];
export const DISTANCES_JUNIOR = [6, 7, 8];
export const RESULT_OPTIONS = [
  { key: 'carreau', points: 5 },
  { key: 'reussi', points: 3 },
  { key: 'touche', points: 1 },
  { key: 'manque', points: 0 },
];

export function getScoreTotal(participant, key) {
  if (!participant[key]) return 0;
  let total = 0;
  Object.values(participant[key]).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      Object.values(atelier).forEach((val) => {
        total += SCORING[val] || 0;
      });
    }
  });
  return total;
}

export function getScoreCarreauCount(participant, key) {
  if (!participant[key]) return 0;
  let count = 0;
  Object.values(participant[key]).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      Object.values(atelier).forEach((val) => {
        if (val === 'carreau') count++;
      });
    }
  });
  return count;
}

export function getScoreReussiCount(participant, key) {
  if (!participant[key]) return 0;
  let count = 0;
  Object.values(participant[key]).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      Object.values(atelier).forEach((val) => {
        if (val === 'reussi') count++;
      });
    }
  });
  return count;
}

export function getScoreToucheCount(participant, key) {
  if (!participant[key]) return 0;
  let count = 0;
  Object.values(participant[key]).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      Object.values(atelier).forEach((val) => {
        if (val === 'touche') count++;
      });
    }
  });
  return count;
}

export function getCombinedTotal(participant) {
  return getScoreTotal(participant, 'scores') + getScoreTotal(participant, 'scores2');
}

export function getThrowCount(participant, key) {
  if (!participant[key]) return 0;
  let count = 0;
  Object.values(participant[key]).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      count += Object.keys(atelier).length;
    }
  });
  return count;
}

export function isParticipantComplete(participant, key, totalThrows) {
  return getThrowCount(participant, key) >= totalThrows;
}

export function getAtelierScore(participant, key, atelierIdx) {
  const scores = participant[key]?.[atelierIdx];
  if (!scores) return 0;
  return Object.values(scores).reduce((sum, val) => sum + (SCORING[val] || 0), 0);
}

export function getAtelierThrowCount(participant, key, atelierIdx) {
  const scores = participant[key]?.[atelierIdx];
  if (!scores || typeof scores !== 'object') return 0;
  return Object.keys(scores).length;
}

export function isAtelierComplete(participant, key, atelierIdx, distancesCount) {
  return getAtelierThrowCount(participant, key, atelierIdx) >= distancesCount;
}

/**
 * Return a participant copy with one throw toggled. Score editors use this
 * operation so they never need to mutate a participant prop or know the
 * nested tournament storage shape.
 */
export function toggleParticipantScore(participant, scoresKey, atelierIndex, distance, resultType) {
  const currentScores = participant?.[scoresKey];
  const currentAtelier = currentScores?.[atelierIndex];
  const nextAtelier = currentAtelier && typeof currentAtelier === 'object' ? { ...currentAtelier } : {};

  if (nextAtelier[distance] === resultType) {
    delete nextAtelier[distance];
  } else {
    nextAtelier[distance] = resultType;
  }

  return {
    ...participant,
    [scoresKey]: {
      ...(currentScores && typeof currentScores === 'object' ? currentScores : {}),
      [atelierIndex]: nextAtelier,
    },
  };
}

/** Fill unanswered throws for a single atelier without changing the input. */
export function fillMissingAtelierScores(participant, scoresKey, atelierIndex, distances, resultType = 'manque') {
  const currentScores = participant?.[scoresKey];
  const currentAtelier = currentScores?.[atelierIndex];
  const nextAtelier = currentAtelier && typeof currentAtelier === 'object' ? { ...currentAtelier } : {};

  distances.forEach((distance) => {
    if (!nextAtelier[distance]) nextAtelier[distance] = resultType;
  });

  return {
    ...participant,
    [scoresKey]: {
      ...(currentScores && typeof currentScores === 'object' ? currentScores : {}),
      [atelierIndex]: nextAtelier,
    },
  };
}

export function fillMissingAtelierScoresForParticipants(
  participants,
  scoresKey,
  atelierIndex,
  distances,
  resultType = 'manque',
) {
  return participants.map((participant) =>
    fillMissingAtelierScores(participant, scoresKey, atelierIndex, distances, resultType),
  );
}

export function rankParticipants(participants, key) {
  return [...participants].sort(
    (a, b) =>
      getScoreTotal(b, key) - getScoreTotal(a, key) ||
      getScoreCarreauCount(b, key) - getScoreCarreauCount(a, key) ||
      getScoreReussiCount(b, key) - getScoreReussiCount(a, key) ||
      getScoreToucheCount(b, key) - getScoreToucheCount(a, key),
  );
}

export function rankByR1(participants) {
  return rankParticipants(participants, 'scores');
}

export function rankByCombined(participants) {
  return [...participants].sort(
    (a, b) =>
      getCombinedTotal(b) - getCombinedTotal(a) ||
      getScoreCarreauCount(b, 'scores') +
        getScoreCarreauCount(b, 'scores2') -
        (getScoreCarreauCount(a, 'scores') + getScoreCarreauCount(a, 'scores2')) ||
      getScoreReussiCount(b, 'scores') +
        getScoreReussiCount(b, 'scores2') -
        (getScoreReussiCount(a, 'scores') + getScoreReussiCount(a, 'scores2')) ||
      getScoreToucheCount(b, 'scores') +
        getScoreToucheCount(b, 'scores2') -
        (getScoreToucheCount(a, 'scores') + getScoreToucheCount(a, 'scores2')),
  );
}

export function getDirectQualifiers(participants, count = 4) {
  return rankByR1(participants).slice(0, count);
}

export function getR2Candidates(participants, directCount = 4, maxR2 = 16) {
  return rankByR1(participants).slice(directCount, directCount + maxR2);
}

export function getR2QualifiersWithTies(participants, tiebreakerCount, directCount = 4, r2EndPosition = 20) {
  const ranked = rankWithTiebreakers(participants, 'scores', tiebreakerCount);

  if (ranked.length <= r2EndPosition) {
    return ranked.slice(directCount);
  }

  const baseQualifiers = ranked.slice(directCount, r2EndPosition);
  const lastQualifier = ranked[r2EndPosition - 1];
  const lastScore = getScoreTotal(lastQualifier, 'scores');

  const extraQualifiers = [];
  for (let i = r2EndPosition; i < ranked.length; i++) {
    const p = ranked[i];
    if (getScoreTotal(p, 'scores') !== lastScore) break;
    extraQualifiers.push(p);
  }

  return [...baseQualifiers, ...extraQualifiers];
}

export function getTiebreakerKey(round) {
  return `tiebreaker_${round}`;
}

export function rankWithTiebreakers(participants, mainKey, tiebreakerCount) {
  return [...participants].sort((a, b) => {
    const diff =
      getScoreTotal(b, mainKey) - getScoreTotal(a, mainKey) ||
      getScoreCarreauCount(b, mainKey) - getScoreCarreauCount(a, mainKey) ||
      getScoreReussiCount(b, mainKey) - getScoreReussiCount(a, mainKey) ||
      getScoreToucheCount(b, mainKey) - getScoreToucheCount(a, mainKey);
    if (diff !== 0) return diff;
    for (let i = 1; i <= tiebreakerCount; i++) {
      const tbKey = getTiebreakerKey(i);
      const tbDiff =
        getScoreTotal(b, tbKey) - getScoreTotal(a, tbKey) ||
        getScoreCarreauCount(b, tbKey) - getScoreCarreauCount(a, tbKey) ||
        getScoreReussiCount(b, tbKey) - getScoreReussiCount(a, tbKey) ||
        getScoreToucheCount(b, tbKey) - getScoreToucheCount(a, tbKey);
      if (tbDiff !== 0) return tbDiff;
    }
    return 0;
  });
}

export function findTiesAtBoundary(rankedParticipants, boundaryIndex, mainKey, tiebreakerCount) {
  if (boundaryIndex <= 0 || boundaryIndex >= rankedParticipants.length) return [];
  const lastIn = rankedParticipants[boundaryIndex - 1];
  const firstOut = rankedParticipants[boundaryIndex];

  const lastInScore = getScoreTotal(lastIn, mainKey);
  const firstOutScore = getScoreTotal(firstOut, mainKey);
  if (lastInScore !== firstOutScore) return [];
  if (getScoreCarreauCount(lastIn, mainKey) !== getScoreCarreauCount(firstOut, mainKey)) return [];
  if (getScoreReussiCount(lastIn, mainKey) !== getScoreReussiCount(firstOut, mainKey)) return [];

  for (let i = 1; i <= tiebreakerCount; i++) {
    const tbKey = getTiebreakerKey(i);
    if (getScoreTotal(lastIn, tbKey) !== getScoreTotal(firstOut, tbKey)) return [];
    if (getScoreCarreauCount(lastIn, tbKey) !== getScoreCarreauCount(firstOut, tbKey)) return [];
    if (getScoreReussiCount(lastIn, tbKey) !== getScoreReussiCount(firstOut, tbKey)) return [];
  }

  const tiedScore = lastInScore;
  const tiedCarreau = getScoreCarreauCount(lastIn, mainKey);
  const tiedReussi = getScoreReussiCount(lastIn, mainKey);
  return rankedParticipants.filter((p) => {
    if (getScoreTotal(p, mainKey) !== tiedScore) return false;
    if (getScoreCarreauCount(p, mainKey) !== tiedCarreau) return false;
    if (getScoreReussiCount(p, mainKey) !== tiedReussi) return false;
    for (let i = 1; i <= tiebreakerCount; i++) {
      const tbKey = getTiebreakerKey(i);
      if (getScoreTotal(p, tbKey) !== getScoreTotal(lastIn, tbKey)) return false;
      if (getScoreCarreauCount(p, tbKey) !== getScoreCarreauCount(lastIn, tbKey)) return false;
      if (getScoreReussiCount(p, tbKey) !== getScoreReussiCount(lastIn, tbKey)) return false;
    }
    return true;
  });
}

export function detectTiebreakersNeeded(participants, tiebreakerCount) {
  const ranked = rankWithTiebreakers(participants, 'scores', tiebreakerCount);
  const top4Ties = findTiesAtBoundary(ranked, 4, 'scores', tiebreakerCount);
  return { top4Ties, r2Ties: [], ranked };
}

export function isTiebreakerComplete(participant, tbKey) {
  const scores = participant[tbKey];
  if (!scores) return false;
  let count = 0;
  Object.values(scores).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      count += Object.keys(atelier).length;
    }
  });
  return count >= 5;
}

export function generateSeededBracket(n) {
  if (n === 2) return [[0, 1]];
  if (n === 4)
    return [
      [0, 3],
      [1, 2],
    ];
  if (n === 8)
    return [
      [0, 7],
      [3, 4],
      [1, 6],
      [2, 5],
    ];
  return buildSeededPairs(n);
}

function buildSeededPairs(n) {
  if (n === 2) return [[0, 1]];
  const half = buildSeededPairs(n / 2);
  const pairs = [];
  for (const [a, b] of half) {
    pairs.push([a, n - 1 - a]);
    pairs.push([b, n - 1 - b]);
  }
  return pairs;
}

export function createMatch(player1, player2) {
  return {
    player1,
    player2,
    scores1: {},
    scores2: {},
    score1: null,
    score2: null,
    complete: false,
    winner: null,
    loser: null,
    tieWinner: null,
  };
}

export function buildPlayoffBracket(qualifiedNames, size) {
  if (size === 2) {
    return {
      rounds: [],
      qualified: qualifiedNames,
      size,
      thirdPlace: null,
      final: createMatch(qualifiedNames[0], qualifiedNames[1]),
    };
  }
  const pairs = generateSeededBracket(size);
  const matches = pairs.map(([a, b]) => createMatch(qualifiedNames[a], qualifiedNames[b]));
  return {
    rounds: [{ matches }],
    qualified: qualifiedNames,
    size,
    thirdPlace: null,
    final: null,
  };
}

export function advancePlayoff(playoff) {
  if (!playoff || !playoff.rounds || !playoff.rounds.length) return false;
  if (playoff.final) return false;

  const lastRound = playoff.rounds[playoff.rounds.length - 1];
  const allComplete = lastRound.matches.every((m) => m.complete);
  if (!allComplete) return false;

  const winners = lastRound.matches.map((m) => m.winner);
  const losers = lastRound.matches.map((m) => m.loser);

  if (winners.length === 2) {
    playoff.final = createMatch(winners[0], winners[1]);
    if (playoff.size >= 4) {
      playoff.thirdPlace = createMatch(losers[0], losers[1]);
    }
  } else if (winners.length > 2) {
    const nextMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      nextMatches.push(createMatch(winners[i], winners[i + 1]));
    }
    playoff.rounds.push({ matches: nextMatches });
  }
  return true;
}

export function getMatchPlayerScore(match, playerNum) {
  const key = playerNum === 1 ? 'scores1' : 'scores2';
  const scores = match[key];
  if (!scores) return 0;
  let total = 0;
  Object.values(scores).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      Object.values(atelier).forEach((val) => {
        total += SCORING[val] || 0;
      });
    }
  });
  return total;
}

export function getMatchPlayerThrows(match, playerNum) {
  const key = playerNum === 1 ? 'scores1' : 'scores2';
  const scores = match[key];
  if (!scores) return 0;
  let count = 0;
  Object.values(scores).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      count += Object.keys(atelier).length;
    }
  });
  return count;
}

export function isMatchComplete(match, totalThrows) {
  const t1 = getMatchPlayerThrows(match, 1);
  const t2 = getMatchPlayerThrows(match, 2);
  if (t1 < totalThrows || t2 < totalThrows) return false;
  const s1 = getMatchPlayerScore(match, 1);
  const s2 = getMatchPlayerScore(match, 2);
  if (s1 === s2) return !!match.tieWinner;
  return true;
}

export function getMatchWinner(match, totalThrows) {
  if (!isMatchComplete(match, totalThrows)) return null;
  const s1 = getMatchPlayerScore(match, 1);
  const s2 = getMatchPlayerScore(match, 2);
  if (s1 === s2) return match.tieWinner === 1 ? match.player1 : match.player2;
  return s1 > s2 ? match.player1 : match.player2;
}

export function getMatchScoreAt(match, playerNum, atelierIndex, distance) {
  const key = playerNum === 1 ? 'scores1' : 'scores2';
  return match?.[key]?.[atelierIndex]?.[distance] || null;
}

export function getMatchAtelierScore(match, playerNum, atelierIndex) {
  const key = playerNum === 1 ? 'scores1' : 'scores2';
  const scores = match?.[key]?.[atelierIndex];
  if (!scores || typeof scores !== 'object') return 0;
  return Object.values(scores).reduce((sum, resultType) => sum + (SCORING[resultType] || 0), 0);
}

export function isMatchAtelierComplete(match, playerNum, atelierIndex, distancesCount) {
  const key = playerNum === 1 ? 'scores1' : 'scores2';
  const scores = match?.[key]?.[atelierIndex];
  return !!scores && typeof scores === 'object' && Object.keys(scores).length >= distancesCount;
}

/** Derive the persisted match summary from its throw-level scores. */
export function updateTirMatchFromScores(match, totalThrows) {
  const nextMatch = {
    ...match,
    score1: getMatchPlayerScore(match, 1),
    score2: getMatchPlayerScore(match, 2),
  };
  nextMatch.complete = isMatchComplete(nextMatch, totalThrows);

  if (!nextMatch.complete) {
    nextMatch.winner = null;
    nextMatch.loser = null;
    return nextMatch;
  }

  nextMatch.winner = getMatchWinner(nextMatch, totalThrows);
  nextMatch.loser = nextMatch.winner === nextMatch.player1 ? nextMatch.player2 : nextMatch.player1;
  return nextMatch;
}

/** Return a match copy with one throw toggled and its summary recalculated. */
export function toggleTirMatchScore(match, playerNum, atelierIndex, distance, resultType, totalThrows) {
  const scoresKey = playerNum === 1 ? 'scores1' : 'scores2';
  const currentScores = match?.[scoresKey];
  const currentAtelier = currentScores?.[atelierIndex];
  const nextAtelier = currentAtelier && typeof currentAtelier === 'object' ? { ...currentAtelier } : {};

  if (nextAtelier[distance] === resultType) {
    delete nextAtelier[distance];
  } else {
    nextAtelier[distance] = resultType;
  }

  return updateTirMatchFromScores(
    {
      ...match,
      [scoresKey]: {
        ...(currentScores && typeof currentScores === 'object' ? currentScores : {}),
        [atelierIndex]: nextAtelier,
      },
    },
    totalThrows,
  );
}

export function selectTirMatchTieWinner(match, playerNum, totalThrows) {
  return updateTirMatchFromScores({ ...match, tieWinner: playerNum }, totalThrows);
}

export function getTirPlayoffRoundTitle(matchCount, playoffSize, labels, roundIndex = 0) {
  if (playoffSize === 2) return labels.final;
  if (matchCount === 2) return labels.semifinal;
  if (matchCount === 4) return labels.quarterfinal;
  if (matchCount === 8) return labels.eighthFinal;
  if (matchCount === 16) return labels.sixteenthFinal;
  return `${labels.round} ${roundIndex + 1}`;
}

function getStoredMatchLoser(match) {
  if (!match?.winner) return null;
  return match.winner === match.player1 ? match.player2 : match.player1;
}

/** Build the canonical admin/public playoff round model. */
export function getTirPlayoffDisplayRounds(playoff, labels, { includePreviews = false } = {}) {
  if (!playoff) return [];
  const rounds = [];
  const firstRoundMatches = playoff.rounds?.[0]?.matches?.length || 0;
  const playoffSize = playoff.size || (firstRoundMatches > 0 ? firstRoundMatches * 2 : 2);

  playoff.rounds?.forEach((round, roundIndex) => {
    rounds.push({
      title: getTirPlayoffRoundTitle(round.matches.length, playoffSize, labels, roundIndex),
      matches: round.matches,
      key: `round:${roundIndex}`,
      isFinal: false,
      laneStart: 1,
    });
  });

  if (includePreviews && !playoff.thirdPlace && !playoff.final && rounds.length) {
    const lastMatches = rounds[rounds.length - 1].matches;
    if (lastMatches.length >= 2) {
      const previewMatches = [];
      for (let index = 0; index < lastMatches.length; index += 2) {
        const player1 = lastMatches[index]?.winner || null;
        const player2 = lastMatches[index + 1]?.winner || null;
        previewMatches.push({
          player1,
          player2,
          score1: null,
          score2: null,
          preview: true,
          previewLabel1: player1 || labels.pending,
          previewLabel2: player2 || labels.pending,
        });
      }

      if (lastMatches.length === 2) {
        const player1 = getStoredMatchLoser(lastMatches[0]);
        const player2 = getStoredMatchLoser(lastMatches[1]);
        rounds.push({
          title: labels.thirdPlace,
          matches: [
            {
              player1,
              player2,
              score1: null,
              score2: null,
              preview: true,
              previewLabel1: player1 || labels.pending,
              previewLabel2: player2 || labels.pending,
            },
          ],
          key: `preview-third:${rounds.length}`,
          isFinal: false,
          isPreview: true,
          laneStart: 2,
        });
      }

      const nextMatchCount = previewMatches.length;
      const isFinal = nextMatchCount === 1;
      rounds.push({
        title: isFinal ? labels.final : getTirPlayoffRoundTitle(nextMatchCount, playoffSize, labels, rounds.length),
        matches: previewMatches,
        key: `preview:${rounds.length}`,
        isFinal,
        isPreview: true,
        laneStart: 1,
      });
    }
  }

  if (playoff.thirdPlace) {
    rounds.push({
      title: labels.thirdPlace,
      matches: [playoff.thirdPlace],
      key: 'third:0',
      isFinal: false,
      laneStart: 2,
    });
  }

  if (playoff.final) {
    rounds.push({
      title: labels.final,
      matches: [playoff.final],
      key: 'final:0',
      isFinal: true,
      laneStart: 1,
    });
  }

  return rounds;
}

export function buildTableRows({
  participants,
  directIds,
  r2Ids,
  r2CandidateIds,
  playoff,
  currentRound,
  isTwoRoundSystem,
  hasPlayoffScores,
  labels,
  tiebreakerCount = 0,
}) {
  const r1Ranked = rankWithTiebreakers(participants, 'scores', tiebreakerCount);

  const allPlayers = r1Ranked.map((p) => {
    const isDirect = directIds.includes(p.id);
    const isR2 = r2Ids.includes(p.id);
    const r1Started = getThrowCount(p, 'scores') > 0;
    const r1Score = getScoreTotal(p, 'scores');
    const r2Started = isR2 && getThrowCount(p, 'scores2') > 0;
    const r2Score = isR2 ? getScoreTotal(p, 'scores2') : null;
    const combined = isR2 ? r1Score + r2Score : r1Score;

    let place, rowClass;
    const qualifiedNames = playoff?.qualified || [];
    const isPlayoffQualified = qualifiedNames.includes(p.name);
    if (isDirect || (!isR2 && isPlayoffQualified)) {
      rowClass = 'tir-table__row--direct';
      place = labels.direct;
    } else if (isR2 && isPlayoffQualified) {
      rowClass = 'tir-table__row--direct';
      place = labels.r2Qualifier;
    } else if (isR2) {
      rowClass = 'tir-table__row--r2';
      place = '';
    } else if (isTwoRoundSystem && currentRound === 1 && r2CandidateIds.includes(p.id)) {
      rowClass = 'tir-table__row--r2';
      place = labels.goToR2;
    } else if (isTwoRoundSystem && currentRound === 1) {
      rowClass = '';
      place = '';
    } else {
      rowClass = 'tir-table__row--eliminated';
      place = labels.eliminated;
    }

    const matchScores = getPlayoffMatchScores(p.name, playoff);

    let playoffStage = 0;
    let playoffLastScore = 0;
    if (matchScores.final !== '') {
      playoffStage = 3;
      playoffLastScore = matchScores.final;
    } else if (matchScores.sf !== '') {
      playoffStage = 2;
      playoffLastScore = matchScores.sf;
    } else if (matchScores.qf !== '') {
      playoffStage = 1;
      playoffLastScore = matchScores.qf;
    }

    const carreauCount = getScoreCarreauCount(p, 'scores') + (isR2 ? getScoreCarreauCount(p, 'scores2') : 0);
    const reussiCount = getScoreReussiCount(p, 'scores') + (isR2 ? getScoreReussiCount(p, 'scores2') : 0);
    const toucheCount = getScoreToucheCount(p, 'scores') + (isR2 ? getScoreToucheCount(p, 'scores2') : 0);

    return {
      id: p.id,
      name: p.name,
      r1: r1Started ? r1Score : '—',
      r2: isDirect ? '—' : r2Score !== null ? (r2Started ? r2Score : '—') : '',
      r2Num: r2Score || 0,
      combined: isR2 ? (r1Started || r2Started ? combined : '—') : isDirect ? (r1Started ? r1Score : '—') : '',
      qf: matchScores.qf,
      sf: matchScores.sf,
      final: matchScores.final,
      place,
      rowClass,
      combinedNum: combined,
      carreauCount,
      reussiCount,
      toucheCount,
      playoffStage,
      playoffLastScore,
      isDirect,
    };
  });

  if (currentRound >= 2 && r2Ids.length) {
    const qualifiedRows = allPlayers.filter((r) => r.rowClass === 'tir-table__row--direct');
    const r2Rows = allPlayers.filter((r) => r.rowClass === 'tir-table__row--r2');
    const eliminatedRows = allPlayers.filter((r) => r.rowClass === 'tir-table__row--eliminated');

    if (playoff && hasPlayoffScores) {
      const playoffParticipants = [...qualifiedRows, ...r2Rows];
      const places = getPlayoffPlaces(playoff);

      playoffParticipants.forEach((row) => {
        const place = places[row.name];
        if (place === undefined) return;
        const placeNum = typeof place === 'number' ? place : parseInt(String(place).split('-')[0]);
        row.place = String(place);
        row.placeNum = placeNum;
        if (placeNum === 1) row.rowClass = 'place-gold';
        else if (placeNum === 2) row.rowClass = 'place-silver';
        else if (placeNum === 3) row.rowClass = 'place-bronze';
      });

      playoffParticipants.sort((a, b) => {
        if (a.placeNum || b.placeNum) return (a.placeNum || 99) - (b.placeNum || 99);
        const stageA = Math.max(a.playoffStage, 1);
        const stageB = Math.max(b.playoffStage, 1);
        return (
          stageB - stageA ||
          b.playoffLastScore - a.playoffLastScore ||
          (b.isDirect ? 1 : 0) - (a.isDirect ? 1 : 0) ||
          b.combinedNum - a.combinedNum ||
          b.carreauCount - a.carreauCount ||
          b.reussiCount - a.reussiCount ||
          b.toucheCount - a.toucheCount
        );
      });

      return [...playoffParticipants, ...eliminatedRows];
    }

    return [
      ...qualifiedRows,
      ...r2Rows.sort(
        (a, b) =>
          b.combinedNum - a.combinedNum ||
          b.carreauCount - a.carreauCount ||
          b.reussiCount - a.reussiCount ||
          b.toucheCount - a.toucheCount,
      ),
      ...eliminatedRows,
    ];
  }
  return allPlayers;
}

export function getPlayoffPlaces(playoff) {
  const places = {};
  if (!playoff) return places;
  const final = playoff.final;
  const thirdPlace = playoff.thirdPlace;
  if (final?.winner) {
    places[final.winner] = 1;
    const loser = final.player1 === final.winner ? final.player2 : final.player1;
    if (loser) places[loser] = 2;
  }
  if (thirdPlace?.winner) {
    places[thirdPlace.winner] = 3;
    const loser = thirdPlace.player1 === thirdPlace.winner ? thirdPlace.player2 : thirdPlace.player1;
    if (loser) places[loser] = 4;
  } else if (thirdPlace && !thirdPlace.winner) {
    if (thirdPlace.player1) places[thirdPlace.player1] = '3-4';
    if (thirdPlace.player2) places[thirdPlace.player2] = '3-4';
  }
  if (playoff.rounds) {
    let nextPlace = Object.keys(places).length
      ? Math.max(
          ...Object.values(places).map((v) => (typeof v === 'number' ? v : parseInt(String(v).split('-')[1] || v))),
        ) + 1
      : 5;
    for (let i = playoff.rounds.length - 1; i >= 0; i--) {
      const roundLosers = playoff.rounds[i].matches.filter((m) => m.loser && !places[m.loser]).map((m) => m.loser);
      if (!roundLosers.length) continue;
      const endPlace = nextPlace + roundLosers.length - 1;
      const label = roundLosers.length > 1 ? `${nextPlace}-${endPlace}` : String(nextPlace);
      roundLosers.forEach((name) => {
        places[name] = label;
      });
      nextPlace = endPlace + 1;
    }
  }
  return places;
}

export function getTeamPlayoffPlaces(playoff) {
  const places = {};
  if (!playoff) return places;
  if (playoff.final?.winner) {
    places[playoff.final.winner] = 1;
    const loser = playoff.final.team1 === playoff.final.winner ? playoff.final.team2 : playoff.final.team1;
    if (loser) places[loser] = 2;
  }
  if (playoff.thirdPlace?.winner) {
    places[playoff.thirdPlace.winner] = 3;
    const loser =
      playoff.thirdPlace.team1 === playoff.thirdPlace.winner ? playoff.thirdPlace.team2 : playoff.thirdPlace.team1;
    if (loser) places[loser] = 4;
  } else if (playoff.thirdPlace) {
    if (playoff.thirdPlace.team1) places[playoff.thirdPlace.team1] = '3-4';
    if (playoff.thirdPlace.team2) places[playoff.thirdPlace.team2] = '3-4';
  }
  if (playoff.rounds) {
    let nextPlace = Object.keys(places).length
      ? Math.max(
          ...Object.values(places).map((v) => (typeof v === 'number' ? v : parseInt(String(v).split('-')[1] || v))),
        ) + 1
      : 5;
    for (let i = playoff.rounds.length - 1; i >= 0; i--) {
      const roundLosers = playoff.rounds[i].matches
        .filter((m) => m.winner && !places[m.winner === m.team1 ? m.team2 : m.team1])
        .map((m) => (m.winner === m.team1 ? m.team2 : m.team1));
      if (!roundLosers.length) continue;
      const endPlace = nextPlace + roundLosers.length - 1;
      const label = roundLosers.length > 1 ? `${nextPlace}-${endPlace}` : nextPlace;
      roundLosers.forEach((name) => {
        places[name] = label;
      });
      nextPlace = endPlace + 1;
    }
  }
  return places;
}

export function getBracketPlayoffPlaces(bracket) {
  const places = {};
  if (!bracket?.stages) return places;
  if (bracket.format === 'double') {
    return { ...(bracket.placements || {}) };
  }
  const finalStage = bracket.stages.find((s) => s.stageLabel === 1);
  if (finalStage?.teams?.length) {
    const game = finalStage.teams[0];
    if (game.team_1_score != null && game.team_2_score != null) {
      const winner = Number(game.team_1_score) > Number(game.team_2_score) ? game.team_1 : game.team_2;
      const loser = winner === game.team_1 ? game.team_2 : game.team_1;
      places[winner] = 1;
      if (loser) places[loser] = 2;
    }
  }
  if (bracket.thirdPlace && bracket.thirdPlace.team_1_score != null && bracket.thirdPlace.team_2_score != null) {
    const tp = bracket.thirdPlace;
    const winner = Number(tp.team_1_score) > Number(tp.team_2_score) ? tp.team_1 : tp.team_2;
    const loser = winner === tp.team_1 ? tp.team_2 : tp.team_1;
    places[winner] = 3;
    if (loser) places[loser] = 4;
  }
  const nonFinalStages = bracket.stages
    .filter((s) => s.stageLabel !== 1 && s.stageLabel !== 'cadrage')
    .sort((a, b) => a.stageLabel - b.stageLabel);
  let nextPlace = Object.keys(places).length
    ? Math.max(...Object.values(places).map((v) => (typeof v === 'number' ? v : parseInt(String(v).split('-')[1])))) + 1
    : 5;
  for (const stage of nonFinalStages) {
    const losers = stage.teams
      .filter((g) => !g.isBye && g.team_1_score != null && g.team_2_score != null)
      .map((g) => (Number(g.team_1_score) > Number(g.team_2_score) ? g.team_2 : g.team_1))
      .filter((name) => name && !places[name]);
    if (!losers.length) continue;
    const endPlace = nextPlace + losers.length - 1;
    const label = losers.length > 1 ? `${nextPlace}-${endPlace}` : nextPlace;
    losers.forEach((name) => {
      places[name] = label;
    });
    nextPlace = endPlace + 1;
  }
  return places;
}

export function getPlayoffMatchScores(playerName, playoff) {
  const result = { qf: '', sf: '', final: '' };
  if (!playoff) return result;
  if (playoff.rounds) {
    playoff.rounds.forEach((round) => {
      round.matches.forEach((m) => {
        if (m.player1 === playerName || m.player2 === playerName) {
          const score = m.player1 === playerName ? m.score1 : m.score2;
          if (score != null) {
            if (round.matches.length >= 4) result.qf = score;
            else if (round.matches.length === 2) result.sf = score;
            else if (round.matches.length === 1) result.final = score;
          }
        }
      });
    });
  }
  if (playoff.final && (playoff.final.player1 === playerName || playoff.final.player2 === playerName)) {
    const score = playoff.final.player1 === playerName ? playoff.final.score1 : playoff.final.score2;
    if (score != null) result.final = score;
  }
  if (playoff.thirdPlace && (playoff.thirdPlace.player1 === playerName || playoff.thirdPlace.player2 === playerName)) {
    const score = playoff.thirdPlace.player1 === playerName ? playoff.thirdPlace.score1 : playoff.thirdPlace.score2;
    if (score != null) result.final = score;
  }
  return result;
}

export function findPlayoffMatchForParticipant(participantName, matches) {
  if (!matches) return null;
  for (const m of matches) {
    if (m.player1 === participantName) return { match: m, playerNum: 1, scoresKey: 'scores1' };
    if (m.player2 === participantName) return { match: m, playerNum: 2, scoresKey: 'scores2' };
  }
  return null;
}

export function getPlayoffMatchThrowsForParticipant(participantName, matches) {
  const info = findPlayoffMatchForParticipant(participantName, matches);
  if (!info) return 0;
  return getMatchPlayerThrows(info.match, info.playerNum);
}

export function getPlayoffMatchAtelierPercent(participantName, matches, atelierIdx, distancesCount) {
  const info = findPlayoffMatchForParticipant(participantName, matches);
  if (!info) return 0;
  const scores = info.match[info.scoresKey]?.[atelierIdx];
  if (!scores || typeof scores !== 'object') return 0;
  return Math.round((Object.keys(scores).length / distancesCount) * 100);
}
