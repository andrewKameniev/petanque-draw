import { describe, it, expect } from 'vitest';
import {
  SCORING,
  ATELIER_KEYS,
  DISTANCES_FULL,
  DISTANCES_JUNIOR,
  getScoreTotal,
  getScoreCarreauCount,
  getScoreReussiCount,
  getScoreToucheCount,
  getCombinedTotal,
  getThrowCount,
  isParticipantComplete,
  getAtelierScore,
  getAtelierThrowCount,
  isAtelierComplete,
  toggleParticipantScore,
  fillMissingAtelierScores,
  fillMissingAtelierScoresForParticipants,
  rankParticipants,
  getDirectQualifiers,
  getR2Candidates,
  getR2QualifiersWithTies,
  generateSeededBracket,
  createMatch,
  buildPlayoffBracket,
  advancePlayoff,
  getMatchPlayerScore,
  getMatchPlayerThrows,
  isMatchComplete,
  getMatchWinner,
  getMatchScoreAt,
  getMatchAtelierScore,
  isMatchAtelierComplete,
  updateTirMatchFromScores,
  toggleTirMatchScore,
  selectTirMatchTieWinner,
  getTirPlayoffRoundTitle,
  getTirPlayoffDisplayRounds,
  getPlayoffMatchScores,
} from '@/services/tir';

function makeParticipant(name, scores = {}) {
  return { id: name, name, scores };
}

describe('TIR Scoring Constants', () => {
  it('has correct scoring values', () => {
    expect(SCORING.carreau).toBe(5);
    expect(SCORING.reussi).toBe(3);
    expect(SCORING.touche).toBe(1);
    expect(SCORING.manque).toBe(0);
  });

  it('has 5 atelier keys', () => {
    expect(ATELIER_KEYS).toHaveLength(5);
  });

  it('has correct distances', () => {
    expect(DISTANCES_FULL).toEqual([6, 7, 8, 9]);
    expect(DISTANCES_JUNIOR).toEqual([6, 7, 8]);
  });
});

describe('getScoreTotal', () => {
  it('returns 0 for empty participant', () => {
    expect(getScoreTotal({}, 'scores')).toBe(0);
  });

  it('returns 0 when key is missing', () => {
    expect(getScoreTotal({ scores: null }, 'scores')).toBe(0);
  });

  it('calculates total correctly for single atelier', () => {
    const p = { scores: { 0: { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' } } };
    expect(getScoreTotal(p, 'scores')).toBe(5 + 3 + 1 + 0);
  });

  it('calculates total for multiple ateliers', () => {
    const p = {
      scores: {
        0: { 6: 'carreau', 7: 'carreau', 8: 'carreau', 9: 'carreau' },
        1: { 6: 'reussi', 7: 'reussi', 8: 'reussi', 9: 'reussi' },
      },
    };
    expect(getScoreTotal(p, 'scores')).toBe(20 + 12);
  });

  it('handles scores2 key for round 2', () => {
    const p = { scores: { 0: { 6: 'carreau' } }, scores2: { 0: { 6: 'reussi' } } };
    expect(getScoreTotal(p, 'scores')).toBe(5);
    expect(getScoreTotal(p, 'scores2')).toBe(3);
  });

  it('ignores missing and malformed atelier entries', () => {
    const p = {
      scores: {
        0: null,
        1: 'invalid',
        2: { 6: 'carreau', 7: 'unknown', 8: null },
      },
    };

    expect(getScoreTotal(p, 'scores')).toBe(5);
    expect(getThrowCount(p, 'scores')).toBe(3);
  });
});

describe('getScoreCarreauCount', () => {
  it('returns 0 for empty', () => {
    expect(getScoreCarreauCount({}, 'scores')).toBe(0);
  });

  it('counts only carreaus', () => {
    const p = { scores: { 0: { 6: 'carreau', 7: 'reussi', 8: 'carreau', 9: 'touche' } } };
    expect(getScoreCarreauCount(p, 'scores')).toBe(2);
  });

  it('keeps every scoring-result count independent', () => {
    const p = {
      scores: {
        0: {
          6: 'carreau',
          7: 'reussi',
          8: 'reussi',
          9: 'touche',
        },
      },
    };

    expect(getScoreCarreauCount(p, 'scores')).toBe(1);
    expect(getScoreReussiCount(p, 'scores')).toBe(2);
    expect(getScoreToucheCount(p, 'scores')).toBe(1);
  });
});

describe('getCombinedTotal', () => {
  it('adds R1 and R2 scores', () => {
    const p = {
      scores: { 0: { 6: 'carreau', 7: 'carreau', 8: 'carreau', 9: 'carreau' } },
      scores2: { 0: { 6: 'reussi', 7: 'reussi', 8: 'reussi', 9: 'reussi' } },
    };
    expect(getCombinedTotal(p)).toBe(20 + 12);
  });

  it('handles missing R2', () => {
    const p = { scores: { 0: { 6: 'carreau' } } };
    expect(getCombinedTotal(p)).toBe(5);
  });
});

describe('getThrowCount', () => {
  it('counts throws across ateliers', () => {
    const p = { scores: { 0: { 6: 'carreau', 7: 'reussi' }, 1: { 6: 'touche' } } };
    expect(getThrowCount(p, 'scores')).toBe(3);
  });
});

describe('isParticipantComplete', () => {
  it('returns false when incomplete', () => {
    const p = { scores: { 0: { 6: 'carreau' } } };
    expect(isParticipantComplete(p, 'scores', 20)).toBe(false);
  });

  it('returns true when all throws done', () => {
    const scores = {};
    for (let i = 0; i < 5; i++) {
      scores[i] = {};
      DISTANCES_FULL.forEach((d) => {
        scores[i][d] = 'carreau';
      });
    }
    expect(isParticipantComplete({ scores }, 'scores', 20)).toBe(true);
  });
});

describe('getAtelierScore', () => {
  it('calculates single atelier score', () => {
    const p = { scores: { 0: { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' } } };
    expect(getAtelierScore(p, 'scores', 0)).toBe(9);
  });

  it('returns 0 for missing atelier', () => {
    expect(getAtelierScore({ scores: {} }, 'scores', 3)).toBe(0);
  });

  it('counts only object-shaped atelier throws', () => {
    expect(getAtelierThrowCount({ scores: { 0: { 6: 'carreau', 7: 'manque' } } }, 'scores', 0)).toBe(2);
    expect(getAtelierThrowCount({ scores: { 0: 'invalid' } }, 'scores', 0)).toBe(0);
  });
});

describe('isAtelierComplete', () => {
  it('returns true when all distances filled', () => {
    const p = { scores: { 0: { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' } } };
    expect(isAtelierComplete(p, 'scores', 0, 4)).toBe(true);
  });

  it('returns false when missing distances', () => {
    const p = { scores: { 0: { 6: 'carreau', 7: 'reussi' } } };
    expect(isAtelierComplete(p, 'scores', 0, 4)).toBe(false);
  });

  it('works with junior (3 distances)', () => {
    const p = { scores: { 0: { 6: 'carreau', 7: 'reussi', 8: 'touche' } } };
    expect(isAtelierComplete(p, 'scores', 0, 3)).toBe(true);
  });

  it('does not treat a malformed atelier value as complete', () => {
    expect(isAtelierComplete({ scores: { 0: 'xxxx' } }, 'scores', 0, 4)).toBe(false);
  });
});

describe('participant score updates', () => {
  it('toggles a throw on and off without mutating the participant', () => {
    const participant = { id: 'A', scores: { 0: { 6: 'reussi' } } };

    const changed = toggleParticipantScore(participant, 'scores', 0, 6, 'carreau');
    const removed = toggleParticipantScore(changed, 'scores', 0, 6, 'carreau');

    expect(changed.scores[0][6]).toBe('carreau');
    expect(removed.scores[0]).toEqual({});
    expect(participant.scores[0][6]).toBe('reussi');
    expect(changed).not.toBe(participant);
    expect(changed.scores).not.toBe(participant.scores);
    expect(changed.scores[0]).not.toBe(participant.scores[0]);
  });

  it('creates missing score containers and preserves unrelated rounds', () => {
    const participant = { id: 'A', scores2: { 1: { 7: 'touche' } } };
    const changed = toggleParticipantScore(participant, 'scores', 2, 8, 'reussi');

    expect(changed.scores).toEqual({ 2: { 8: 'reussi' } });
    expect(changed.scores2).toBe(participant.scores2);
  });

  it('fills only unanswered distances with misses', () => {
    const participant = { id: 'A', scores: { 0: { 6: 'carreau', 8: 'touche' } } };
    const filled = fillMissingAtelierScores(participant, 'scores', 0, DISTANCES_FULL);

    expect(filled.scores[0]).toEqual({
      6: 'carreau',
      7: 'manque',
      8: 'touche',
      9: 'manque',
    });
    expect(participant.scores[0]).toEqual({ 6: 'carreau', 8: 'touche' });
  });

  it('fills a whole atelier for every participant immutably', () => {
    const participants = [{ id: 'A', scores: {} }, { id: 'B' }];
    const filled = fillMissingAtelierScoresForParticipants(participants, 'scores', 1, [6, 7]);

    expect(filled.map((participant) => participant.scores[1])).toEqual([
      { 6: 'manque', 7: 'manque' },
      { 6: 'manque', 7: 'manque' },
    ]);
    expect(participants).toEqual([{ id: 'A', scores: {} }, { id: 'B' }]);
  });
});

describe('rankParticipants', () => {
  it('sorts by score descending', () => {
    const p1 = makeParticipant('A', { 0: { 6: 'carreau' } });
    const p2 = makeParticipant('B', { 0: { 6: 'reussi' } });
    const p3 = makeParticipant('C', { 0: { 6: 'touche' } });
    const ranked = rankParticipants([p3, p1, p2], 'scores');
    expect(ranked.map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });

  it('uses carreau count as tiebreaker', () => {
    const p1 = makeParticipant('A', { 0: { 6: 'reussi', 7: 'touche' } });
    const p2 = makeParticipant('B', { 0: { 6: 'carreau', 7: 'manque' } });
    const ranked = rankParticipants([p1, p2], 'scores');
    expect(ranked[0].name).toBe('B');
  });

  it('uses reussi count before touche count after score and carreau ties', () => {
    const moreReussis = makeParticipant('More reussis', {
      0: { 6: 'reussi', 7: 'reussi', 8: 'manque', 9: 'manque' },
    });
    const fewerReussis = makeParticipant('Fewer reussis', {
      0: { 6: 'reussi', 7: 'touche', 8: 'touche', 9: 'touche' },
    });
    const moreTouches = makeParticipant('More touches', {
      0: { 6: 'touche', 7: 'touche', 8: 'touche' },
    });
    const fewerTouches = makeParticipant('Fewer touches', {
      0: { 6: 'touche', 7: 'touche', 8: 'manque' },
    });

    expect(rankParticipants([fewerReussis, moreReussis], 'scores').map((p) => p.name)).toEqual([
      'More reussis',
      'Fewer reussis',
    ]);
    expect(rankParticipants([fewerTouches, moreTouches], 'scores').map((p) => p.name)).toEqual([
      'More touches',
      'Fewer touches',
    ]);
  });
});

describe('getDirectQualifiers', () => {
  it('returns top 4 by R1 score', () => {
    const participants = [];
    for (let i = 0; i < 10; i++) {
      const scores = { 0: {} };
      DISTANCES_FULL.forEach((d) => {
        scores[0][d] = i < 4 ? 'carreau' : 'manque';
      });
      participants.push(makeParticipant(`P${i}`, scores));
    }
    const direct = getDirectQualifiers(participants);
    expect(direct).toHaveLength(4);
    direct.forEach((p) => expect(getScoreTotal(p, 'scores')).toBe(20));
  });
});

describe('getR2Candidates', () => {
  it('returns positions 5-20 from R1 ranking', () => {
    const participants = [];
    for (let i = 0; i < 25; i++) {
      const scores = { 0: { 6: i >= 10 ? 'manque' : 'carreau' } };
      participants.push(makeParticipant(`P${i}`, scores));
    }
    const candidates = getR2Candidates(participants);
    expect(candidates).toHaveLength(16);
  });

  it('respects maxR2 parameter', () => {
    const participants = Array.from({ length: 25 }, (_, i) => makeParticipant(`P${i}`, {}));
    const candidates = getR2Candidates(participants, 4, 8);
    expect(candidates).toHaveLength(8);
  });
});

describe('getR2QualifiersWithTies', () => {
  function makeParticipantsWithScores(scoreArray) {
    return scoreArray.map((score, i) => {
      const scores = {};
      let remaining = score;
      const atelier = {};
      let throwIdx = 0;
      while (remaining >= 5 && throwIdx < 20) {
        atelier[throwIdx] = 'carreau';
        remaining -= 5;
        throwIdx++;
      }
      while (remaining >= 3 && throwIdx < 20) {
        atelier[throwIdx] = 'reussi';
        remaining -= 3;
        throwIdx++;
      }
      while (remaining >= 1 && throwIdx < 20) {
        atelier[throwIdx] = 'touche';
        remaining -= 1;
        throwIdx++;
      }
      scores[0] = atelier;
      return { id: `P${i}`, name: `P${i}`, scores };
    });
  }

  it('returns exactly 16 qualifiers when no ties at boundary', () => {
    const scoreArray = [];
    for (let i = 0; i < 30; i++) {
      scoreArray.push(100 - i * 3);
    }
    const participants = makeParticipantsWithScores(scoreArray);
    const qualifiers = getR2QualifiersWithTies(participants, 0);
    expect(qualifiers).toHaveLength(16);
    qualifiers.forEach((p) => {
      expect(p.id).not.toBe('P0');
      expect(p.id).not.toBe('P1');
      expect(p.id).not.toBe('P2');
      expect(p.id).not.toBe('P3');
    });
  });

  it('includes players tied with 20th place (positions 20-21)', () => {
    const scoreArray = [];
    for (let i = 0; i < 19; i++) {
      scoreArray.push(100 - i * 3);
    }
    scoreArray.push(40);
    scoreArray.push(40);
    scoreArray.push(30);
    const participants = makeParticipantsWithScores(scoreArray);
    const qualifiers = getR2QualifiersWithTies(participants, 0);
    expect(qualifiers).toHaveLength(17);
  });

  it('includes all players tied with 20th place (positions 20-25)', () => {
    const scoreArray = [];
    for (let i = 0; i < 19; i++) {
      scoreArray.push(100 - i * 3);
    }
    for (let i = 0; i < 7; i++) {
      scoreArray.push(40);
    }
    scoreArray.push(30);
    const participants = makeParticipantsWithScores(scoreArray);
    const qualifiers = getR2QualifiersWithTies(participants, 0);
    expect(qualifiers).toHaveLength(22);
  });

  it('excludes top 4 from R2 qualifiers', () => {
    const scoreArray = [];
    for (let i = 0; i < 25; i++) {
      scoreArray.push(100 - i * 3);
    }
    const participants = makeParticipantsWithScores(scoreArray);
    const qualifiers = getR2QualifiersWithTies(participants, 0);
    const top4Ids = ['P0', 'P1', 'P2', 'P3'];
    qualifiers.forEach((p) => {
      expect(top4Ids).not.toContain(p.id);
    });
  });

  it('does not include players below the tie group', () => {
    const scoreArray = [];
    for (let i = 0; i < 19; i++) {
      scoreArray.push(100 - i * 3);
    }
    scoreArray.push(40);
    scoreArray.push(40);
    scoreArray.push(40);
    scoreArray.push(20);
    scoreArray.push(10);
    const participants = makeParticipantsWithScores(scoreArray);
    const qualifiers = getR2QualifiersWithTies(participants, 0);
    const qualifierIds = qualifiers.map((p) => p.id);
    expect(qualifierIds).not.toContain('P22');
    expect(qualifierIds).not.toContain('P23');
  });

  it('returns all participants below top 4 when fewer than 20 total', () => {
    const scoreArray = [];
    for (let i = 0; i < 15; i++) {
      scoreArray.push(100 - i * 3);
    }
    const participants = makeParticipantsWithScores(scoreArray);
    const qualifiers = getR2QualifiersWithTies(participants, 0);
    expect(qualifiers).toHaveLength(11);
  });

  it('includes players with same total score but different shot compositions', () => {
    const participants = [];
    for (let i = 0; i < 19; i++) {
      participants.push({
        id: `P${i}`,
        name: `P${i}`,
        scores: { 0: { 0: 'carreau', 1: 'carreau', 2: 'carreau', 3: 'carreau' } },
      });
    }
    // Position 20: score 9 via 1 carreau + 1 reussi + 1 touche (5+3+1)
    participants.push({ id: 'P19', name: 'P19', scores: { 0: { 0: 'carreau', 1: 'reussi', 2: 'touche' } } });
    // Position 21: score 9 via 3 reussi (3+3+3)
    participants.push({ id: 'P20', name: 'P20', scores: { 0: { 0: 'reussi', 1: 'reussi', 2: 'reussi' } } });
    // Position 22: score 9 via 1 reussi + 6 touche (3+1+1+1+1+1+1)
    participants.push({
      id: 'P21',
      name: 'P21',
      scores: { 0: { 0: 'reussi', 1: 'touche', 2: 'touche', 3: 'touche', 4: 'touche', 5: 'touche', 6: 'touche' } },
    });
    // Position 23: score 5 — should NOT qualify
    participants.push({ id: 'P22', name: 'P22', scores: { 0: { 0: 'carreau' } } });
    const qualifiers = getR2QualifiersWithTies(participants, 0);
    const ids = qualifiers.map((p) => p.id);
    expect(ids).toContain('P19');
    expect(ids).toContain('P20');
    expect(ids).toContain('P21');
    expect(ids).not.toContain('P22');
    expect(qualifiers).toHaveLength(18);
  });
});

describe('generateSeededBracket', () => {
  it('generates 2-player bracket', () => {
    expect(generateSeededBracket(2)).toEqual([[0, 1]]);
  });

  it('generates 4-player bracket with correct seeding', () => {
    const bracket = generateSeededBracket(4);
    expect(bracket).toEqual([
      [0, 3],
      [1, 2],
    ]);
  });

  it('generates 8-player bracket', () => {
    const bracket = generateSeededBracket(8);
    expect(bracket).toHaveLength(4);
    expect(bracket).toEqual([
      [0, 7],
      [3, 4],
      [1, 6],
      [2, 5],
    ]);
  });

  it('generates 16-player bracket', () => {
    const bracket = generateSeededBracket(16);
    expect(bracket).toHaveLength(8);
    bracket.forEach(([a, b]) => {
      expect(a + b).toBe(15);
    });
  });

  it('rejects a non-power-of-two seed size without recursing', () => {
    expect(() => generateSeededBracket(5)).toThrow('Seeded bracket size must be a power of two');
  });
});

describe('createMatch', () => {
  it('creates match with correct structure', () => {
    const match = createMatch('Alice', 'Bob');
    expect(match.player1).toBe('Alice');
    expect(match.player2).toBe('Bob');
    expect(match.scores1).toEqual({});
    expect(match.scores2).toEqual({});
    expect(match.score1).toBeNull();
    expect(match.complete).toBe(false);
    expect(match.winner).toBeNull();
  });
});

describe('buildPlayoffBracket', () => {
  it('builds 2-player final-only bracket', () => {
    const bracket = buildPlayoffBracket(['A', 'B'], 2);
    expect(bracket.rounds).toEqual([]);
    expect(bracket.final.player1).toBe('A');
    expect(bracket.final.player2).toBe('B');
    expect(bracket.size).toBe(2);
  });

  it('builds 8-player bracket with QF round', () => {
    const names = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
    const bracket = buildPlayoffBracket(names, 8);
    expect(bracket.rounds).toHaveLength(1);
    expect(bracket.rounds[0].matches).toHaveLength(4);
    expect(bracket.final).toBeNull();
    expect(bracket.rounds[0].matches[0].player1).toBe('P1');
    expect(bracket.rounds[0].matches[0].player2).toBe('P8');
  });

  it('pads a 5-player bracket with completed byes and advances normally', () => {
    const bracket = buildPlayoffBracket(['P1', 'P2', 'P3', 'P4', 'P5'], 5);
    const openingMatches = bracket.rounds[0].matches;

    expect(openingMatches).toHaveLength(4);
    expect(openingMatches.filter((match) => match.complete)).toHaveLength(3);

    const playableMatch = openingMatches.find((match) => !match.complete);
    playableMatch.complete = true;
    playableMatch.winner = playableMatch.player1;
    playableMatch.loser = playableMatch.player2;

    expect(advancePlayoff(bracket)).toBe(true);
    expect(bracket.rounds[1].matches.map((match) => [match.player1, match.player2])).toEqual([
      ['P1', 'P4'],
      ['P2', 'P3'],
    ]);
  });
});

describe('advancePlayoff', () => {
  it('returns false when not all matches complete', () => {
    const playoff = buildPlayoffBracket(['A', 'B', 'C', 'D'], 4);
    expect(advancePlayoff(playoff)).toBe(false);
  });

  it('creates final when SF completes', () => {
    const playoff = buildPlayoffBracket(['A', 'B', 'C', 'D'], 4);
    playoff.rounds[0].matches[0].complete = true;
    playoff.rounds[0].matches[0].winner = 'A';
    playoff.rounds[0].matches[0].loser = 'D';
    playoff.rounds[0].matches[1].complete = true;
    playoff.rounds[0].matches[1].winner = 'B';
    playoff.rounds[0].matches[1].loser = 'C';
    const advanced = advancePlayoff(playoff);
    expect(advanced).toBe(true);
    expect(playoff.final.player1).toBe('A');
    expect(playoff.final.player2).toBe('B');
    expect(playoff.thirdPlace.player1).toBe('D');
    expect(playoff.thirdPlace.player2).toBe('C');
  });

  it('creates next round for 8+ players', () => {
    const names = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
    const playoff = buildPlayoffBracket(names, 8);
    playoff.rounds[0].matches.forEach((m) => {
      m.complete = true;
      m.winner = m.player1;
      m.loser = m.player2;
    });
    advancePlayoff(playoff);
    expect(playoff.rounds).toHaveLength(2);
    expect(playoff.rounds[1].matches).toHaveLength(2);
  });

  it('returns false when final already set', () => {
    const playoff = buildPlayoffBracket(['A', 'B'], 2);
    expect(advancePlayoff(playoff)).toBe(false);
  });
});

describe('playoff display rounds', () => {
  const labels = {
    final: 'Final',
    thirdPlace: 'Third place',
    semifinal: 'Semifinal',
    quarterfinal: 'Quarterfinal',
    eighthFinal: 'Round of 16',
    sixteenthFinal: 'Round of 32',
    round: 'Round',
    pending: 'Pending',
  };

  it('uses one round-title rule for every supported bracket size', () => {
    expect(getTirPlayoffRoundTitle(1, 2, labels)).toBe('Final');
    expect(getTirPlayoffRoundTitle(2, 4, labels)).toBe('Semifinal');
    expect(getTirPlayoffRoundTitle(4, 8, labels)).toBe('Quarterfinal');
    expect(getTirPlayoffRoundTitle(8, 16, labels)).toBe('Round of 16');
    expect(getTirPlayoffRoundTitle(16, 32, labels)).toBe('Round of 32');
    expect(getTirPlayoffRoundTitle(32, 64, labels, 0)).toBe('Round 1');
  });

  it('builds real rounds for admin/results displays', () => {
    const playoff = buildPlayoffBracket(['A', 'B', 'C', 'D'], 4);
    playoff.rounds[0].matches.forEach((match) => {
      match.complete = true;
      match.winner = match.player1;
      match.loser = match.player2;
    });
    advancePlayoff(playoff);

    expect(getTirPlayoffDisplayRounds(playoff, labels).map((round) => round.title)).toEqual([
      'Semifinal',
      'Third place',
      'Final',
    ]);
  });

  it('adds pending public previews without changing the playoff', () => {
    const playoff = buildPlayoffBracket(['A', 'B', 'C', 'D'], 4);
    const snapshot = JSON.parse(JSON.stringify(playoff));
    const rounds = getTirPlayoffDisplayRounds(playoff, labels, { includePreviews: true });

    expect(rounds.map((round) => round.title)).toEqual(['Semifinal', 'Third place', 'Final']);
    expect(rounds[1].matches[0].previewLabel1).toBe('Pending');
    expect(rounds[2].matches[0].preview).toBe(true);
    expect(playoff).toEqual(snapshot);
  });
});

describe('getMatchPlayerScore / getMatchPlayerThrows', () => {
  it('calculates scores from match object', () => {
    const match = createMatch('A', 'B');
    match.scores1 = { 0: { 6: 'carreau', 7: 'reussi' } };
    match.scores2 = { 0: { 6: 'touche' } };
    expect(getMatchPlayerScore(match, 1)).toBe(8);
    expect(getMatchPlayerScore(match, 2)).toBe(1);
    expect(getMatchPlayerThrows(match, 1)).toBe(2);
    expect(getMatchPlayerThrows(match, 2)).toBe(1);
  });

  it('reads individual and atelier match scores defensively', () => {
    const match = createMatch('A', 'B');
    match.scores1 = { 0: { 6: 'carreau', 7: 'reussi' }, 1: 'invalid' };

    expect(getMatchScoreAt(match, 1, 0, 6)).toBe('carreau');
    expect(getMatchScoreAt(match, 2, 0, 6)).toBeNull();
    expect(getMatchAtelierScore(match, 1, 0)).toBe(8);
    expect(getMatchAtelierScore(match, 1, 1)).toBe(0);
    expect(isMatchAtelierComplete(match, 1, 0, 2)).toBe(true);
    expect(isMatchAtelierComplete(match, 1, 1, 2)).toBe(false);
  });
});

describe('immutable playoff score updates', () => {
  it('toggles throws and derives score, completion, winner, and loser', () => {
    const match = createMatch('A', 'B');
    const withPlayer1 = toggleTirMatchScore(match, 1, 0, 6, 'carreau', 1);
    const complete = toggleTirMatchScore(withPlayer1, 2, 0, 6, 'reussi', 1);

    expect(match).toEqual(createMatch('A', 'B'));
    expect(withPlayer1.score1).toBe(5);
    expect(withPlayer1.complete).toBe(false);
    expect(complete).toMatchObject({ score1: 5, score2: 3, complete: true, winner: 'A', loser: 'B' });
    expect(complete.scores1).toBe(withPlayer1.scores1);
    expect(complete.scores2).not.toBe(withPlayer1.scores2);
  });

  it('clears a stale result when a completed match becomes incomplete', () => {
    const complete = updateTirMatchFromScores(
      {
        ...createMatch('A', 'B'),
        scores1: { 0: { 6: 'carreau' } },
        scores2: { 0: { 6: 'reussi' } },
      },
      1,
    );
    const incomplete = toggleTirMatchScore(complete, 2, 0, 6, 'reussi', 1);

    expect(incomplete).toMatchObject({ score1: 5, score2: 0, complete: false, winner: null, loser: null });
  });

  it('requires and applies an explicit winner for a tied match', () => {
    let match = toggleTirMatchScore(createMatch('A', 'B'), 1, 0, 6, 'manque', 1);
    match = toggleTirMatchScore(match, 2, 0, 6, 'manque', 1);

    expect(match).toMatchObject({ score1: 0, score2: 0, complete: false, winner: null });
    const decided = selectTirMatchTieWinner(match, 2, 1);
    expect(decided).toMatchObject({ complete: true, winner: 'B', loser: 'A', tieWinner: 2 });
    expect(match.tieWinner).toBeNull();
  });
});

describe('isMatchComplete', () => {
  it('returns false when throws incomplete', () => {
    const match = createMatch('A', 'B');
    expect(isMatchComplete(match, 20)).toBe(false);
  });

  it('returns true when both complete and not tied', () => {
    const match = createMatch('A', 'B');
    match.scores1 = {};
    match.scores2 = {};
    for (let i = 0; i < 5; i++) {
      match.scores1[i] = {};
      match.scores2[i] = {};
      DISTANCES_FULL.forEach((d) => {
        match.scores1[i][d] = 'carreau';
        match.scores2[i][d] = 'reussi';
      });
    }
    expect(isMatchComplete(match, 20)).toBe(true);
  });

  it('returns false when tied without tieWinner', () => {
    const match = createMatch('A', 'B');
    match.scores1 = {};
    match.scores2 = {};
    for (let i = 0; i < 5; i++) {
      match.scores1[i] = {};
      match.scores2[i] = {};
      DISTANCES_FULL.forEach((d) => {
        match.scores1[i][d] = 'carreau';
        match.scores2[i][d] = 'carreau';
      });
    }
    expect(isMatchComplete(match, 20)).toBe(false);
    match.tieWinner = 1;
    expect(isMatchComplete(match, 20)).toBe(true);
  });
});

describe('getMatchWinner', () => {
  it('returns higher scorer', () => {
    const match = createMatch('A', 'B');
    match.scores1 = {};
    match.scores2 = {};
    for (let i = 0; i < 5; i++) {
      match.scores1[i] = {};
      match.scores2[i] = {};
      DISTANCES_FULL.forEach((d) => {
        match.scores1[i][d] = 'carreau';
        match.scores2[i][d] = 'reussi';
      });
    }
    expect(getMatchWinner(match, 20)).toBe('A');
  });

  it('uses tieWinner when tied', () => {
    const match = createMatch('A', 'B');
    match.scores1 = {};
    match.scores2 = {};
    for (let i = 0; i < 5; i++) {
      match.scores1[i] = {};
      match.scores2[i] = {};
      DISTANCES_FULL.forEach((d) => {
        match.scores1[i][d] = 'carreau';
        match.scores2[i][d] = 'carreau';
      });
    }
    match.tieWinner = 2;
    expect(getMatchWinner(match, 20)).toBe('B');
  });
});

describe('getPlayoffMatchScores', () => {
  it('returns empty for no playoff', () => {
    expect(getPlayoffMatchScores('A', null)).toEqual({ qf: '', sf: '', final: '' });
  });

  it('returns QF score correctly', () => {
    const playoff = {
      rounds: [
        {
          matches: [
            { player1: 'A', player2: 'B', score1: 80, score2: 60 },
            { player1: 'C', player2: 'D', score1: 70, score2: 50 },
            { player1: 'E', player2: 'F', score1: 90, score2: 40 },
            { player1: 'G', player2: 'H', score1: 85, score2: 55 },
          ],
        },
      ],
    };
    expect(getPlayoffMatchScores('A', playoff).qf).toBe(80);
    expect(getPlayoffMatchScores('B', playoff).qf).toBe(60);
    expect(getPlayoffMatchScores('Z', playoff).qf).toBe('');
  });

  it('distinguishes QF from SF by match count', () => {
    const playoff = {
      rounds: [
        {
          matches: [
            { player1: 'A', player2: 'B', score1: 80, score2: 60 },
            { player1: 'C', player2: 'D', score1: 70, score2: 50 },
            { player1: 'E', player2: 'F', score1: null, score2: null },
            { player1: 'G', player2: 'H', score1: null, score2: null },
          ],
        },
        {
          matches: [
            { player1: 'A', player2: 'C', score1: 90, score2: 75 },
            { player1: 'E', player2: 'G', score1: null, score2: null },
          ],
        },
      ],
    };
    const scores = getPlayoffMatchScores('A', playoff);
    expect(scores.qf).toBe(80);
    expect(scores.sf).toBe(90);
  });

  it('reads final from playoff.final', () => {
    const playoff = {
      rounds: [],
      final: { player1: 'A', player2: 'B', score1: 95, score2: 88 },
    };
    expect(getPlayoffMatchScores('A', playoff).final).toBe(95);
    expect(getPlayoffMatchScores('B', playoff).final).toBe(88);
  });

  it('does not return null scores', () => {
    const playoff = {
      rounds: [
        {
          matches: [
            { player1: 'A', player2: 'B', score1: null, score2: null },
            { player1: 'C', player2: 'D', score1: null, score2: null },
            { player1: 'E', player2: 'F', score1: null, score2: null },
            { player1: 'G', player2: 'H', score1: null, score2: null },
          ],
        },
      ],
    };
    expect(getPlayoffMatchScores('A', playoff).qf).toBe('');
  });
});
