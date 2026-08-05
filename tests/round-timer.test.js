import { describe, expect, it } from 'vitest';
import {
  createRoundTimer,
  endRoundTimerState,
  pauseRoundTimerState,
  restartRoundTimerState,
  resumeRoundTimerState,
  shouldSkipFinalTimer,
} from '@/services/round-timer';

const NOW = new Date('2026-08-05T10:00:00.000Z').getTime();

function tournament(overrides = {}) {
  return {
    preferences: {
      timeLimitEnabled: true,
      timeLimit: 45,
      playoffTimeLimit: 70,
      noTimeLimitFinale: false,
    },
    ...overrides,
  };
}

describe('round timer state', () => {
  it('creates round and playoff timers without mutating the tournament', () => {
    const regular = tournament();
    const playoff = tournament({ playOffBracket: { stages: [] } });
    expect(createRoundTimer(regular, NOW)).toMatchObject({
      timerStartedAt: '2026-08-05T10:00:00.000Z',
      timerEndsAt: '2026-08-05T10:45:00.000Z',
      timeLimitMinutes: 45,
    });
    expect(createRoundTimer(playoff, NOW).timeLimitMinutes).toBe(70);
    expect(regular).not.toHaveProperty('roundTimer');
  });

  it('skips single- and double-elimination finals configured without a limit', () => {
    const preferences = { ...tournament().preferences, noTimeLimitFinale: true };
    expect(shouldSkipFinalTimer({ preferences, playOffStage: 1 })).toBe(true);
    expect(shouldSkipFinalTimer({ preferences, playOffStage: 'grand-final-1' })).toBe(true);
    expect(createRoundTimer({ preferences, playOffStage: 'grand-final-1' }, NOW)).toBeNull();
  });

  it('does not create a timer when limits are disabled', () => {
    expect(createRoundTimer(tournament({ preferences: { timeLimitEnabled: false } }), NOW)).toBeNull();
  });

  it('pauses and resumes from the remaining duration immutably', () => {
    const running = createRoundTimer(tournament(), NOW);
    const paused = pauseRoundTimerState(running, NOW + 5 * 60 * 1000);
    const resumed = resumeRoundTimerState(paused, NOW + 10 * 60 * 1000);

    expect(paused).toMatchObject({ timerStatus: 'paused', remainingMs: 40 * 60 * 1000 });
    expect(resumed).toMatchObject({
      timerStatus: 'running',
      timerStartedAt: '2026-08-05T10:10:00.000Z',
      timerEndsAt: '2026-08-05T10:50:00.000Z',
    });
    expect(resumed).not.toHaveProperty('remainingMs');
    expect(running.timerStatus).toBe('running');
  });

  it('ends and restarts timers immutably', () => {
    const running = createRoundTimer(tournament(), NOW);
    expect(endRoundTimerState(running)).toMatchObject({ timerStatus: 'ended' });
    expect(running.timerStatus).toBe('running');
    expect(restartRoundTimerState(15, NOW)).toMatchObject({
      timerStatus: 'running',
      timerEndsAt: '2026-08-05T10:15:00.000Z',
      timeLimitMinutes: 15,
    });
  });

  it('skips grand-final-2 (double elimination second final) configured without a limit', () => {
    const preferences = { ...tournament().preferences, noTimeLimitFinale: true };
    expect(shouldSkipFinalTimer({ preferences, playOffStage: 'grand-final-2' })).toBe(true);
    expect(createRoundTimer({ preferences, playOffStage: 'grand-final-2' }, NOW)).toBeNull();
  });

  it('pause returns null for non-running timers and resume returns null for non-paused', () => {
    const ended = { timerStatus: 'ended', timerEndsAt: '2026-08-05T10:45:00.000Z' };
    expect(pauseRoundTimerState(ended, NOW)).toBeNull();
    expect(resumeRoundTimerState(ended, NOW)).toBeNull();
    expect(pauseRoundTimerState(null, NOW)).toBeNull();
    expect(resumeRoundTimerState(null, NOW)).toBeNull();
  });

  it('endRoundTimerState returns null/undefined for null/undefined input', () => {
    expect(endRoundTimerState(null)).toBeNull();
    expect(endRoundTimerState(undefined)).toBeUndefined();
  });
});
