import { describe, it, expect } from 'vitest';
import { updateScoreHistory } from '../src/helpers';

describe('updateScoreHistory', () => {
  function makeGame(s1, s2, history) {
    return { team_1_score: s1, team_2_score: s2, score_history: history || [] };
  }

  it('creates first chip when score entered', () => {
    const game = makeGame(3, 0);
    updateScoreHistory(game);
    expect(game.score_history).toEqual([{ s1: 3, s2: 0 }]);
  });

  it('clears history when both scores are 0', () => {
    const game = makeGame(0, 0, [{ s1: 3, s2: 0 }]);
    updateScoreHistory(game);
    expect(game.score_history).toEqual([]);
  });

  it('each cochonette for same team creates a new chip', () => {
    const game = makeGame(0, 0);
    game.score_history = [];

    game.team_1_score = 13;
    game.team_2_score = 0;
    updateScoreHistory(game);

    game.team_1_score = 13;
    game.team_2_score = 1;
    updateScoreHistory(game);

    game.team_1_score = 13;
    game.team_2_score = 2;
    updateScoreHistory(game);

    game.team_1_score = 13;
    game.team_2_score = 4;
    updateScoreHistory(game);

    game.team_1_score = 13;
    game.team_2_score = 8;
    updateScoreHistory(game);

    game.team_1_score = 13;
    game.team_2_score = 13;
    updateScoreHistory(game);

    expect(game.score_history).toEqual([
      { s1: 13, s2: 0 },
      { s1: 13, s2: 1 },
      { s1: 13, s2: 2 },
      { s1: 13, s2: 4 },
      { s1: 13, s2: 8 },
      { s1: 13, s2: 13 },
    ]);
  });

  it('alternating teams each create new chips', () => {
    const game = makeGame(0, 0);
    game.score_history = [];

    game.team_1_score = 2;
    game.team_2_score = 0;
    updateScoreHistory(game);

    game.team_1_score = 2;
    game.team_2_score = 1;
    updateScoreHistory(game);

    game.team_1_score = 3;
    game.team_2_score = 1;
    updateScoreHistory(game);

    game.team_1_score = 3;
    game.team_2_score = 4;
    updateScoreHistory(game);

    expect(game.score_history).toEqual([
      { s1: 2, s2: 0 },
      { s1: 2, s2: 1 },
      { s1: 3, s2: 1 },
      { s1: 3, s2: 4 },
    ]);
  });

  it('ignores if score goes down (user mid-edit)', () => {
    const game = makeGame(5, 9, [{ s1: 5, s2: 9 }]);

    game.team_1_score = 5;
    game.team_2_score = 1;
    updateScoreHistory(game);
    expect(game.score_history).toEqual([{ s1: 5, s2: 9 }]);
  });

  it('ignores if scores unchanged', () => {
    const game = makeGame(3, 4, [{ s1: 3, s2: 4 }]);
    updateScoreHistory(game);
    expect(game.score_history).toEqual([{ s1: 3, s2: 4 }]);
  });

  it('handles both scores going up as new chip', () => {
    const game = makeGame(3, 0, [{ s1: 3, s2: 0 }]);
    game.team_1_score = 5;
    game.team_2_score = 2;
    updateScoreHistory(game);
    expect(game.score_history).toEqual([
      { s1: 3, s2: 0 },
      { s1: 5, s2: 2 },
    ]);
  });

  it('full game scenario: 2-0 2-1 3-1 3-10 3-11 12-11 12-13', () => {
    const game = makeGame(0, 0);
    game.score_history = [];

    const steps = [
      [2, 0],
      [2, 1],
      [3, 1],
      [3, 10],
      [3, 11],
      [12, 11],
      [12, 13],
    ];
    for (const [a, b] of steps) {
      game.team_1_score = a;
      game.team_2_score = b;
      updateScoreHistory(game);
    }

    expect(game.score_history).toEqual([
      { s1: 2, s2: 0 },
      { s1: 2, s2: 1 },
      { s1: 3, s2: 1 },
      { s1: 3, s2: 10 },
      { s1: 3, s2: 11 },
      { s1: 12, s2: 11 },
      { s1: 12, s2: 13 },
    ]);
  });

  it('one team scores multiple consecutive cochonettes (team 1)', () => {
    const game = makeGame(0, 0);
    game.score_history = [];

    const steps = [
      [1, 0],
      [2, 0],
      [5, 0],
      [8, 0],
      [13, 0],
    ];
    for (const [a, b] of steps) {
      game.team_1_score = a;
      game.team_2_score = b;
      updateScoreHistory(game);
    }

    expect(game.score_history).toEqual([
      { s1: 1, s2: 0 },
      { s1: 2, s2: 0 },
      { s1: 5, s2: 0 },
      { s1: 8, s2: 0 },
      { s1: 13, s2: 0 },
    ]);
  });

  it('one team scores multiple consecutive cochonettes (team 2)', () => {
    const game = makeGame(0, 0);
    game.score_history = [];

    const steps = [
      [0, 3],
      [0, 5],
      [0, 9],
      [0, 13],
    ];
    for (const [a, b] of steps) {
      game.team_1_score = a;
      game.team_2_score = b;
      updateScoreHistory(game);
    }

    expect(game.score_history).toEqual([
      { s1: 0, s2: 3 },
      { s1: 0, s2: 5 },
      { s1: 0, s2: 9 },
      { s1: 0, s2: 13 },
    ]);
  });

  it('ignores decrease on team_1 (user clearing to retype)', () => {
    const game = makeGame(5, 3, [
      { s1: 2, s2: 0 },
      { s1: 2, s2: 3 },
      { s1: 5, s2: 3 },
    ]);

    game.team_1_score = 1;
    game.team_2_score = 3;
    updateScoreHistory(game);
    expect(game.score_history.length).toBe(3);

    game.team_1_score = 0;
    game.team_2_score = 3;
    updateScoreHistory(game);
    expect(game.score_history.length).toBe(3);
  });

  it('ignores decrease on team_2 (user clearing to retype)', () => {
    const game = makeGame(3, 9, [
      { s1: 3, s2: 0 },
      { s1: 3, s2: 9 },
    ]);

    game.team_1_score = 3;
    game.team_2_score = 1;
    updateScoreHistory(game);
    expect(game.score_history.length).toBe(2);
  });

  it('score going up after a decrease is a new chip', () => {
    const game = makeGame(5, 9, [{ s1: 5, s2: 9 }]);

    game.team_1_score = 5;
    game.team_2_score = 1;
    updateScoreHistory(game);
    expect(game.score_history.length).toBe(1);

    game.team_1_score = 5;
    game.team_2_score = 11;
    updateScoreHistory(game);
    expect(game.score_history).toEqual([
      { s1: 5, s2: 9 },
      { s1: 5, s2: 11 },
    ]);
  });

  it('initializes score_history if missing', () => {
    const game = { team_1_score: 3, team_2_score: 0 };
    updateScoreHistory(game);
    expect(game.score_history).toEqual([{ s1: 3, s2: 0 }]);
  });

  it('handles string score values (from input fields)', () => {
    const game = { team_1_score: '5', team_2_score: '0', score_history: [] };
    updateScoreHistory(game);
    expect(game.score_history).toEqual([{ s1: 5, s2: 0 }]);
  });

  it('handles null/empty scores as 0', () => {
    const game = { team_1_score: null, team_2_score: '', score_history: [{ s1: 3, s2: 2 }] };
    updateScoreHistory(game);
    expect(game.score_history).toEqual([]);
  });

  it('tight game with many lead changes', () => {
    const game = makeGame(0, 0);
    game.score_history = [];

    const steps = [
      [1, 0],
      [1, 2],
      [3, 2],
      [3, 5],
      [6, 5],
      [6, 7],
      [8, 7],
      [8, 10],
      [11, 10],
      [11, 13],
    ];
    for (const [a, b] of steps) {
      game.team_1_score = a;
      game.team_2_score = b;
      updateScoreHistory(game);
    }

    expect(game.score_history.length).toBe(10);
    expect(game.score_history[0]).toEqual({ s1: 1, s2: 0 });
    expect(game.score_history[9]).toEqual({ s1: 11, s2: 13 });
  });

  it('does not add chip when both scores are same as last', () => {
    const game = makeGame(7, 5, [
      { s1: 3, s2: 0 },
      { s1: 7, s2: 5 },
    ]);
    updateScoreHistory(game);
    updateScoreHistory(game);
    updateScoreHistory(game);
    expect(game.score_history.length).toBe(2);
  });

  it('big jumps in score (e.g. carreaux worth 3 points)', () => {
    const game = makeGame(0, 0);
    game.score_history = [];

    const steps = [
      [3, 0],
      [3, 1],
      [6, 1],
      [6, 4],
      [6, 7],
      [6, 13],
    ];
    for (const [a, b] of steps) {
      game.team_1_score = a;
      game.team_2_score = b;
      updateScoreHistory(game);
    }

    expect(game.score_history).toEqual([
      { s1: 3, s2: 0 },
      { s1: 3, s2: 1 },
      { s1: 6, s2: 1 },
      { s1: 6, s2: 4 },
      { s1: 6, s2: 7 },
      { s1: 6, s2: 13 },
    ]);
  });

  it('one-sided blowout: 13-0 in 4 cochonettes', () => {
    const game = makeGame(0, 0);
    game.score_history = [];

    const steps = [
      [4, 0],
      [7, 0],
      [10, 0],
      [13, 0],
    ];
    for (const [a, b] of steps) {
      game.team_1_score = a;
      game.team_2_score = b;
      updateScoreHistory(game);
    }

    expect(game.score_history).toEqual([
      { s1: 4, s2: 0 },
      { s1: 7, s2: 0 },
      { s1: 10, s2: 0 },
      { s1: 13, s2: 0 },
    ]);
    expect(game.score_history.length).toBe(4);
  });

  it('both scores increase simultaneously creates new chip', () => {
    const game = makeGame(3, 2, [{ s1: 3, s2: 2 }]);
    game.team_1_score = 5;
    game.team_2_score = 4;
    updateScoreHistory(game);
    expect(game.score_history).toEqual([
      { s1: 3, s2: 2 },
      { s1: 5, s2: 4 },
    ]);
  });

  it('score_history already has entries, continues correctly', () => {
    const game = makeGame(7, 5, [
      { s1: 2, s2: 0 },
      { s1: 2, s2: 3 },
      { s1: 7, s2: 3 },
      { s1: 7, s2: 5 },
    ]);

    game.team_1_score = 9;
    game.team_2_score = 5;
    updateScoreHistory(game);

    game.team_1_score = 9;
    game.team_2_score = 8;
    updateScoreHistory(game);

    expect(game.score_history.length).toBe(6);
    expect(game.score_history[4]).toEqual({ s1: 9, s2: 5 });
    expect(game.score_history[5]).toEqual({ s1: 9, s2: 8 });
  });
});
