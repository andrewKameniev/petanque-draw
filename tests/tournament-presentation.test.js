import { describe, expect, it } from 'vitest';
import {
  getActiveRound,
  getCadragePlaceRange,
  getPhaseLabel,
  getPlayoffParticipantCount,
  getSystemDescription,
  getTirPhaseLabel,
  getTournamentBadge,
  getTournamentExtras,
  getTournamentPhase,
  isFinale,
  isInPlayoff,
  isTournamentFinished,
  isTournamentStarted,
  splitTournamentMessage,
} from '@/services/tournament-presentation';

function tournament(overrides = {}) {
  return { system: 'swiss', games: [], teams: [], preferences: {}, ...overrides };
}

describe('getActiveRound', () => {
  it('returns 1 for no games', () => {
    expect(getActiveRound(tournament())).toBe(1);
    expect(getActiveRound(null)).toBe(1);
  });

  it('returns game count when round is active', () => {
    expect(getActiveRound(tournament({ games: [[], []], roundIsActive: true }))).toBe(2);
  });

  it('returns game count + 1 when round is not active', () => {
    expect(getActiveRound(tournament({ games: [[], []] }))).toBe(3);
  });
});

describe('isTournamentFinished', () => {
  it('returns true when finished', () => {
    expect(isTournamentFinished(tournament({ tournamentIsFinished: true }))).toBe(true);
  });

  it('returns false for active or null', () => {
    expect(isTournamentFinished(tournament())).toBe(false);
    expect(isTournamentFinished(null)).toBe(false);
  });
});

describe('isTournamentStarted', () => {
  it('detects tournamentIsStarted flag', () => {
    expect(isTournamentStarted(tournament({ tournamentIsStarted: true }))).toBe(true);
  });

  it('detects roundIsActive flag', () => {
    expect(isTournamentStarted(tournament({ roundIsActive: true }))).toBe(true);
  });

  it('detects tirStarted flag', () => {
    expect(isTournamentStarted(tournament({ tirStarted: true }))).toBe(true);
  });

  it('detects started games by status', () => {
    const games = [[{ status: 'in_progress' }]];
    expect(isTournamentStarted(tournament({ games }))).toBe(true);
  });

  it('returns false for not_started games only', () => {
    const games = [[{ status: 'not_started' }]];
    expect(isTournamentStarted(tournament({ games }))).toBe(false);
  });

  it('returns false for empty tournament', () => {
    expect(isTournamentStarted(tournament())).toBe(false);
    expect(isTournamentStarted(null)).toBe(false);
  });
});

describe('getTournamentPhase', () => {
  it('returns idle for null', () => {
    expect(getTournamentPhase(null)).toBe('idle');
  });

  it('returns finished', () => {
    expect(getTournamentPhase(tournament({ tournamentIsFinished: true }))).toBe('finished');
  });

  it('returns tir-playoff', () => {
    expect(getTournamentPhase(tournament({ system: 'tir', tirPlayoff: { rounds: [] } }))).toBe('tir-playoff');
  });

  it('returns tir-scoring', () => {
    expect(getTournamentPhase(tournament({ system: 'tir', tirStarted: true }))).toBe('tir-scoring');
  });

  it('returns playoff for playOff or playOffBracket', () => {
    expect(getTournamentPhase(tournament({ playOff: [{}] }))).toBe('playoff');
    expect(getTournamentPhase(tournament({ playOffBracket: { stages: [] } }))).toBe('playoff');
  });

  it('returns cadrage', () => {
    expect(getTournamentPhase(tournament({ cadrage: [{}] }))).toBe('cadrage');
  });

  it('returns rounds for active games', () => {
    expect(getTournamentPhase(tournament({ games: [[]], roundIsActive: true }))).toBe('rounds');
  });

  it('returns idle for configured but not started', () => {
    expect(getTournamentPhase(tournament())).toBe('idle');
  });
});

describe('getTournamentBadge', () => {
  it('returns finished/not-started/active', () => {
    expect(getTournamentBadge(tournament({ tournamentIsFinished: true }))).toBe('finished');
    expect(getTournamentBadge(tournament())).toBe('not-started');
    expect(getTournamentBadge(tournament({ tournamentIsStarted: true }))).toBe('active');
  });
});

describe('getPhaseLabel', () => {
  it('returns finished/not-started', () => {
    expect(getPhaseLabel(tournament({ tournamentIsFinished: true }))).toBe('finished');
    expect(getPhaseLabel(tournament())).toBe('not-started');
  });

  it('returns playoff/cadrage/round-N', () => {
    expect(getPhaseLabel(tournament({ roundIsActive: true, playOff: [{}] }))).toBe('playoff');
    expect(getPhaseLabel(tournament({ roundIsActive: true, cadrage: [{}] }))).toBe('cadrage');
    expect(getPhaseLabel(tournament({ roundIsActive: true, games: [[], []] }))).toBe('round-2');
  });

  it('delegates tir phases', () => {
    expect(getPhaseLabel(tournament({ system: 'tir', tirStarted: true, tirRound: 2 }))).toBe('tir-round-2');
  });
});

describe('getTirPhaseLabel', () => {
  it('returns tir-round-N when no playoff', () => {
    expect(getTirPhaseLabel(tournament({ tirRound: 1 }))).toBe('tir-round-1');
    expect(getTirPhaseLabel(tournament({ tirRound: 2 }))).toBe('tir-round-2');
  });

  it('returns playoff phases based on scoring progress', () => {
    expect(getTirPhaseLabel(tournament({ tirPlayoff: { rounds: [{ matches: [{}] }] } }))).toBe('playoff');
    expect(getTirPhaseLabel(tournament({ tirPlayoff: { rounds: [{ matches: [{ score1: 40 }] }] } }))).toBe(
      'quarterfinal',
    );
    expect(
      getTirPhaseLabel(
        tournament({
          tirPlayoff: { rounds: [{ matches: [{ score1: 40 }] }, { matches: [{ score1: 30 }, { score1: 30 }] }] },
        }),
      ),
    ).toBe('semifinal');
    expect(getTirPhaseLabel(tournament({ tirPlayoff: { final: { score1: 45 }, rounds: [] } }))).toBe('final');
  });

  it('returns active for null', () => {
    expect(getTirPhaseLabel(null)).toBe('active');
  });
});

describe('getSystemDescription', () => {
  const labels = {
    swiss: 'swiss',
    playOff: 'playoff',
    poulesBarrage: 'poules+barrage',
    systemLabel: 'Swiss',
    tir: 'Tir',
    twoRoundsShort: '2 rounds',
    system_groups: 'Groups',
    system_poules: 'Poules',
  };

  it('returns empty for null', () => {
    expect(getSystemDescription(null, 'en', labels)).toBe('');
  });

  it('returns tir with qualifiers', () => {
    const t = tournament({ system: 'tir', tirConfig: { rounds: 2 } });
    expect(getSystemDescription(t, 'en', labels)).toBe('Tir, 2 rounds, 8 → playoff');
  });

  it('returns non-swiss system label', () => {
    expect(getSystemDescription(tournament({ system: 'groups' }), 'en', labels)).toBe('Groups');
  });

  it('delegates swiss to formatSwissDescription', () => {
    const t = tournament({
      system: 'swiss',
      games: [[], [], []],
      preferences: { swissRoundsCount: 5 },
    });
    const result = getSystemDescription(t, 'en', labels);
    expect(result).toContain('3/5');
    expect(result).toContain('swiss');
  });

  it('returns swiss label for empty system field', () => {
    expect(getSystemDescription(tournament({ system: null }), 'en', labels)).toBe('Swiss');
  });
});

describe('getCadragePlaceRange', () => {
  it('returns null when no cadrage', () => {
    expect(getCadragePlaceRange(tournament())).toBeNull();
    expect(getCadragePlaceRange(tournament({ cadrage: [] }))).toBeNull();
  });

  it('computes range from playoff length', () => {
    const t = tournament({ cadrage: [{}, {}, {}, {}], playOff: [{}, {}, {}, {}] });
    expect(getCadragePlaceRange(t)).toEqual({ from: 5, to: 12 });
  });

  it('starts from 1 without playoff', () => {
    expect(getCadragePlaceRange(tournament({ cadrage: [{}, {}] }))).toEqual({ from: 1, to: 4 });
  });
});

describe('getPlayoffParticipantCount', () => {
  it('returns 0 without playoff', () => {
    expect(getPlayoffParticipantCount(tournament())).toBe(0);
  });

  it('returns playOff.length * 2 for standard', () => {
    expect(getPlayoffParticipantCount(tournament({ playOff: [{}, {}, {}, {}] }))).toBe(8);
  });

  it('returns participantCount for double elimination', () => {
    const t = tournament({ playOffBracket: { format: 'double', participantCount: 16 } });
    expect(getPlayoffParticipantCount(t)).toBe(16);
  });
});

describe('isInPlayoff / isFinale', () => {
  it('detects playoff or cadrage', () => {
    expect(isInPlayoff(tournament())).toBe(false);
    expect(isInPlayoff(tournament({ playOff: [{}] }))).toBe(true);
    expect(isInPlayoff(tournament({ cadrage: [{}] }))).toBe(true);
  });

  it('detects finale stage', () => {
    expect(isFinale(tournament())).toBe(false);
    expect(isFinale(tournament({ playOff: [{ teams: [{}, {}] }] }))).toBe(false);
    expect(isFinale(tournament({ playOff: [{ teams: [{}, {}] }, { teams: [{}] }] }))).toBe(true);
  });
});

describe('getTournamentExtras', () => {
  it('returns nulls when time limit disabled', () => {
    expect(getTournamentExtras(tournament())).toEqual({ time: null, cochonettes: null });
  });

  it('returns time in minutes', () => {
    const t = tournament({ preferences: { timeLimitEnabled: true, timeLimit: 45 } });
    expect(getTournamentExtras(t)).toEqual({ time: 45, cochonettes: null });
  });

  it('uses playoff time when in playoff', () => {
    const t = tournament({
      playOff: [{}],
      preferences: { timeLimitEnabled: true, timeLimit: 45, playoffTimeLimit: 70, playOffEnabled: true },
    });
    expect(getTournamentExtras(t).time).toBe(70);
  });

  it('returns no-limit-finale in final', () => {
    const t = tournament({
      playOff: [{ teams: [{}] }],
      preferences: { timeLimitEnabled: true, timeLimit: 45, noTimeLimitFinale: true, playOffEnabled: true },
    });
    expect(getTournamentExtras(t).time).toBe('no-limit-finale');
  });

  it('returns cochonettes only when enabled', () => {
    const t1 = tournament({ preferences: { timeLimitEnabled: true, timeLimit: 45, cochonettes: 2 } });
    expect(getTournamentExtras(t1).cochonettes).toBeNull();

    const t2 = tournament({
      preferences: { timeLimitEnabled: true, timeLimit: 45, cochonettesEnabled: true, cochonettes: 2 },
    });
    expect(getTournamentExtras(t2).cochonettes).toBe(2);
  });

  it('disabled cochonettes not shown even with nonzero default count', () => {
    const t = tournament({
      preferences: { timeLimitEnabled: true, timeLimit: 45, cochonettesEnabled: false, cochonettes: 3 },
    });
    expect(getTournamentExtras(t).cochonettes).toBeNull();
  });
});

describe('splitTournamentMessage', () => {
  it('returns empty for null/empty', () => {
    expect(splitTournamentMessage(null)).toEqual([]);
    expect(splitTournamentMessage('')).toEqual([]);
  });

  it('splits by newline and trims empty lines', () => {
    expect(splitTournamentMessage('Hello\n\nWorld\n  \nFoo')).toEqual(['Hello', 'World', 'Foo']);
  });
});
