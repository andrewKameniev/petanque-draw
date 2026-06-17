import { describe, it, expect } from 'vitest';
import {
  DISTANCES_FULL,
  DISTANCES_JUNIOR,
  createMatch,
  findPlayoffMatchForParticipant,
  getPlayoffMatchThrowsForParticipant,
  getPlayoffMatchAtelierPercent,
} from '@/services/tir';

function makeMatch(player1, player2, scores1 = {}, scores2 = {}) {
  const match = createMatch(player1, player2);
  match.scores1 = scores1;
  match.scores2 = scores2;
  return match;
}

describe('findPlayoffMatchForParticipant', () => {
  it('returns null for empty matches', () => {
    expect(findPlayoffMatchForParticipant('Alice', [])).toBeNull();
    expect(findPlayoffMatchForParticipant('Alice', null)).toBeNull();
  });

  it('finds player1 match', () => {
    const matches = [makeMatch('Alice', 'Bob'), makeMatch('Carol', 'Dave')];
    const result = findPlayoffMatchForParticipant('Alice', matches);
    expect(result).not.toBeNull();
    expect(result.playerNum).toBe(1);
    expect(result.scoresKey).toBe('scores1');
    expect(result.match.player1).toBe('Alice');
  });

  it('finds player2 match', () => {
    const matches = [makeMatch('Alice', 'Bob'), makeMatch('Carol', 'Dave')];
    const result = findPlayoffMatchForParticipant('Bob', matches);
    expect(result).not.toBeNull();
    expect(result.playerNum).toBe(2);
    expect(result.scoresKey).toBe('scores2');
  });

  it('returns null when participant not in any match', () => {
    const matches = [makeMatch('Alice', 'Bob')];
    expect(findPlayoffMatchForParticipant('Eve', matches)).toBeNull();
  });
});

describe('getPlayoffMatchThrowsForParticipant', () => {
  it('returns 0 for participant not in match', () => {
    const matches = [makeMatch('Alice', 'Bob')];
    expect(getPlayoffMatchThrowsForParticipant('Eve', matches)).toBe(0);
  });

  it('counts throws for player1', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores1 = {
      0: { 6: 'carreau', 7: 'reussi' },
      1: { 6: 'touche' },
    };
    expect(getPlayoffMatchThrowsForParticipant('Alice', [match])).toBe(3);
  });

  it('counts throws for player2', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores2 = {
      0: { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' },
      1: { 6: 'reussi' },
    };
    expect(getPlayoffMatchThrowsForParticipant('Bob', [match])).toBe(5);
  });

  it('counts all 20 throws when complete (full distances)', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores1 = {};
    for (let i = 0; i < 5; i++) {
      match.scores1[i] = {};
      DISTANCES_FULL.forEach((d) => {
        match.scores1[i][d] = 'carreau';
      });
    }
    expect(getPlayoffMatchThrowsForParticipant('Alice', [match])).toBe(20);
  });

  it('counts all 15 throws when complete (junior distances)', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores2 = {};
    for (let i = 0; i < 5; i++) {
      match.scores2[i] = {};
      DISTANCES_JUNIOR.forEach((d) => {
        match.scores2[i][d] = 'reussi';
      });
    }
    expect(getPlayoffMatchThrowsForParticipant('Bob', [match])).toBe(15);
  });

  it('returns 0 when scores key is empty object', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores1 = {};
    expect(getPlayoffMatchThrowsForParticipant('Alice', [match])).toBe(0);
  });
});

describe('getPlayoffMatchAtelierPercent', () => {
  it('returns 0 for participant not in match', () => {
    const matches = [makeMatch('Alice', 'Bob')];
    expect(getPlayoffMatchAtelierPercent('Eve', matches, 0, 4)).toBe(0);
  });

  it('returns 0 for atelier with no scores', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores1 = {};
    expect(getPlayoffMatchAtelierPercent('Alice', [match], 0, 4)).toBe(0);
  });

  it('returns 50% for 2 out of 4 distances completed', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores1 = { 0: { 6: 'carreau', 7: 'reussi' } };
    expect(getPlayoffMatchAtelierPercent('Alice', [match], 0, 4)).toBe(50);
  });

  it('returns 100% for fully completed atelier', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores1 = { 2: { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' } };
    expect(getPlayoffMatchAtelierPercent('Alice', [match], 2, 4)).toBe(100);
  });

  it('works for player2', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores2 = { 1: { 6: 'touche', 7: 'manque', 8: 'reussi' } };
    expect(getPlayoffMatchAtelierPercent('Bob', [match], 1, 4)).toBe(75);
  });

  it('works with junior distances (3 per atelier)', () => {
    const match = makeMatch('Alice', 'Bob');
    match.scores1 = { 0: { 6: 'carreau', 7: 'reussi' } };
    expect(getPlayoffMatchAtelierPercent('Alice', [match], 0, 3)).toBe(67);
  });

  it('handles multiple matches correctly', () => {
    const matches = [makeMatch('Alice', 'Bob'), makeMatch('Carol', 'Dave')];
    matches[1].scores2 = { 3: { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' } };
    expect(getPlayoffMatchAtelierPercent('Dave', matches, 3, 4)).toBe(100);
    expect(getPlayoffMatchAtelierPercent('Alice', matches, 3, 4)).toBe(0);
  });
});

describe('playoff progress: integration scenario', () => {
  it('shows correct progress for QF with two simultaneous matches', () => {
    const matches = [makeMatch('P1', 'P8'), makeMatch('P4', 'P5'), makeMatch('P2', 'P7'), makeMatch('P3', 'P6')];

    // Device A enters scores for Match 0 (P1 vs P8)
    matches[0].scores1 = {
      0: { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' },
      1: { 6: 'reussi', 7: 'carreau' },
    };
    matches[0].scores2 = {
      0: { 6: 'manque', 7: 'touche' },
    };

    // Device B enters scores for Match 1 (P4 vs P5)
    matches[1].scores1 = {
      0: { 6: 'carreau', 7: 'carreau', 8: 'carreau', 9: 'carreau' },
      1: { 6: 'reussi', 7: 'reussi', 8: 'reussi', 9: 'reussi' },
      2: { 6: 'touche', 7: 'touche', 8: 'touche', 9: 'touche' },
    };

    // P1 has 6 throws entered
    expect(getPlayoffMatchThrowsForParticipant('P1', matches)).toBe(6);
    // P8 has 2 throws
    expect(getPlayoffMatchThrowsForParticipant('P8', matches)).toBe(2);
    // P4 has 12 throws (3 complete ateliers)
    expect(getPlayoffMatchThrowsForParticipant('P4', matches)).toBe(12);
    // P5 has 0 throws (device B only entered P4's scores)
    expect(getPlayoffMatchThrowsForParticipant('P5', matches)).toBe(0);

    // Atelier progress for P1: atelier 0 = 100%, atelier 1 = 50%
    expect(getPlayoffMatchAtelierPercent('P1', matches, 0, 4)).toBe(100);
    expect(getPlayoffMatchAtelierPercent('P1', matches, 1, 4)).toBe(50);
    expect(getPlayoffMatchAtelierPercent('P1', matches, 2, 4)).toBe(0);

    // Atelier progress for P4: ateliers 0,1,2 = 100%
    expect(getPlayoffMatchAtelierPercent('P4', matches, 0, 4)).toBe(100);
    expect(getPlayoffMatchAtelierPercent('P4', matches, 1, 4)).toBe(100);
    expect(getPlayoffMatchAtelierPercent('P4', matches, 2, 4)).toBe(100);
    expect(getPlayoffMatchAtelierPercent('P4', matches, 3, 4)).toBe(0);
  });

  it('does not confuse qualification scores with playoff match scores', () => {
    // Participant has R1 qualification scores
    const participant = {
      id: 1,
      name: 'Alice',
      scores: { 0: { 6: 'carreau', 7: 'carreau', 8: 'carreau', 9: 'carreau' } },
    };

    // But in the playoff match, Alice has only 1 throw
    const matches = [makeMatch('Alice', 'Bob')];
    matches[0].scores1 = { 0: { 6: 'touche' } };

    // Progress should reflect the playoff match (1 throw), not qualification (4 throws)
    expect(getPlayoffMatchThrowsForParticipant('Alice', matches)).toBe(1);
    expect(getPlayoffMatchAtelierPercent('Alice', matches, 0, 4)).toBe(25);

    // The participant's own scores key is separate and unrelated to playoff match
    expect(participant.scores[0][6]).toBe('carreau');
  });
});
