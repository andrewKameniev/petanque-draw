function timestamp(now) {
  return now instanceof Date ? now.getTime() : Number(now);
}

function isFinalStage(tournament) {
  if (tournament?.playOffStage === 1) return true;
  if (typeof tournament?.playOffStage === 'string' && tournament.playOffStage.startsWith('grand-final')) return true;
  const finalPlayoffRound = tournament?.playOff?.[tournament.playOff.length - 1];
  return finalPlayoffRound?.teams?.length === 1;
}

export function shouldSkipFinalTimer(tournament) {
  return !!(tournament?.preferences?.noTimeLimitFinale && isFinalStage(tournament));
}

export function createRoundTimer(tournament, now = Date.now()) {
  const preferences = tournament?.preferences;
  if (!preferences?.timeLimitEnabled || shouldSkipFinalTimer(tournament)) return null;

  const isPlayoff = !!(tournament.playOff || tournament.playOffBracket || tournament.cadrage || tournament.teamPlayoff);
  const minutes = isPlayoff && preferences.playoffTimeLimit ? preferences.playoffTimeLimit : preferences.timeLimit;
  const startedAt = timestamp(now);
  return {
    timerStartedAt: new Date(startedAt).toISOString(),
    timerEndsAt: new Date(startedAt + minutes * 60 * 1000).toISOString(),
    timerStatus: 'running',
    timeLimitMinutes: minutes,
  };
}

export function restartRoundTimerState(minutes, now = Date.now()) {
  const startedAt = timestamp(now);
  return {
    timerStartedAt: new Date(startedAt).toISOString(),
    timerEndsAt: new Date(startedAt + minutes * 60 * 1000).toISOString(),
    timerStatus: 'running',
    timeLimitMinutes: minutes,
  };
}

export function endRoundTimerState(timer) {
  return timer ? { ...timer, timerStatus: 'ended' } : timer;
}

export function pauseRoundTimerState(timer, now = Date.now()) {
  if (!timer || timer.timerStatus !== 'running') return null;
  return {
    ...timer,
    timerStatus: 'paused',
    remainingMs: Math.max(0, new Date(timer.timerEndsAt).getTime() - timestamp(now)),
  };
}

export function resumeRoundTimerState(timer, now = Date.now()) {
  if (!timer || timer.timerStatus !== 'paused') return null;
  const startedAt = timestamp(now);
  const { remainingMs = 0, ...timerWithoutRemaining } = timer;
  return {
    ...timerWithoutRemaining,
    timerStatus: 'running',
    timerStartedAt: new Date(startedAt).toISOString(),
    timerEndsAt: new Date(startedAt + remainingMs).toISOString(),
  };
}
