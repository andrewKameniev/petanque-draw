import { formatSwissDescription, pluralizeRounds } from '@/helpers';
import { getDoubleEliminationParticipantCount } from '@/services/playoff';

export function getActiveRound(tournament) {
  if (!tournament?.games?.length) return 1;
  return tournament.roundIsActive ? tournament.games.length : tournament.games.length + 1;
}

export function isTournamentFinished(tournament) {
  return !!tournament?.tournamentIsFinished;
}

export function isTournamentStarted(tournament) {
  if (tournament?.tournamentIsStarted || tournament?.roundIsActive || tournament?.tirStarted) return true;
  if (tournament?.games?.length) {
    return tournament.games.some((round) => round.some((g) => g.status && g.status !== 'not_started'));
  }
  return false;
}

export function getTournamentPhase(tournament) {
  if (!tournament) return 'idle';
  if (tournament.tournamentIsFinished) return 'finished';
  if (tournament.system === 'tir') {
    if (tournament.tirPlayoff) return 'tir-playoff';
    return tournament.tirStarted ? 'tir-scoring' : 'idle';
  }
  if (tournament.playOff || tournament.playOffBracket) return 'playoff';
  if (tournament.cadrage) return 'cadrage';
  if (tournament.roundIsActive || tournament.games?.length) return 'rounds';
  return 'idle';
}

export function getTournamentBadge(tournament) {
  if (isTournamentFinished(tournament)) return 'finished';
  if (!isTournamentStarted(tournament)) return 'not-started';
  return 'active';
}

export function getTirPhaseLabel(tournament) {
  if (!tournament) return 'active';
  if (tournament.tirPlayoff) {
    const playoff = tournament.tirPlayoff;
    if (playoff.final?.score1 != null) return 'final';
    const sfRound = playoff.rounds?.find((r) => r.matches.length === 2);
    if (sfRound?.matches.some((m) => m.score1 != null)) return 'semifinal';
    if (playoff.rounds?.[0]?.matches.some((m) => m.score1 != null)) return 'quarterfinal';
    return 'playoff';
  }
  const round = tournament.tirRound || 1;
  return `tir-round-${round}`;
}

export function getPhaseLabel(tournament) {
  if (isTournamentFinished(tournament)) return 'finished';
  if (!isTournamentStarted(tournament)) return 'not-started';
  if (tournament?.system === 'tir') return getTirPhaseLabel(tournament);
  if (tournament?.playOff || tournament?.playOffBracket) return 'playoff';
  if (tournament?.cadrage) return 'cadrage';
  const round = tournament?.games?.length || 0;
  if (round) return `round-${round}`;
  return 'active';
}

export function getSystemDescription(tournament, locale, labels) {
  if (!tournament) return '';
  if (tournament.system === 'tir') {
    let desc = labels.tir || 'Tir';
    if (tournament.tirConfig?.rounds === 2) {
      desc += ', ' + (labels.twoRoundsShort || '2 rounds');
    }
    const qualifiedCount = tournament.tirPlayoff?.size || (tournament.tirConfig?.rounds === 2 ? 8 : null);
    if (qualifiedCount) {
      desc += ', ' + qualifiedCount + ' → ' + (labels.playOff || 'playoff');
    }
    return desc;
  }
  if (!tournament.system) return labels.systemLabel || labels.swiss || '';
  if (tournament.system !== 'swiss') return labels['system_' + tournament.system] || labels.systemLabel || '';
  return formatSwissDescription(tournament, locale, labels);
}

export function getCadragePlaceRange(tournament) {
  if (!tournament?.cadrage?.length) return null;
  const from = (tournament.playOff?.length || 0) + 1;
  const to = from + tournament.cadrage.length * 2 - 1;
  return { from, to };
}

export function getPlayoffParticipantCount(tournament) {
  if (tournament?.playOffBracket?.format === 'double') return getDoubleEliminationParticipantCount(tournament);
  return tournament?.playOff?.length ? tournament.playOff.length * 2 : 0;
}

export function isInPlayoff(tournament) {
  return !!tournament?.playOff || !!tournament?.cadrage;
}

export function isFinale(tournament) {
  const po = tournament?.playOff;
  if (!po?.length) return false;
  return po[po.length - 1].teams?.length === 1;
}

export function getTournamentExtras(tournament) {
  const prefs = tournament?.preferences;
  if (!prefs?.timeLimitEnabled) return { time: null, cochonettes: null };
  const inPlayoff = isInPlayoff(tournament);
  const inFinale = isFinale(tournament);
  let time;
  if (prefs.noTimeLimitFinale && prefs.playOffEnabled && inPlayoff && inFinale) {
    time = 'no-limit-finale';
  } else {
    time = prefs.playOffEnabled && inPlayoff ? prefs.playoffTimeLimit || prefs.timeLimit : prefs.timeLimit;
  }
  const cochonettes = prefs.cochonettesEnabled && prefs.cochonettes ? prefs.cochonettes : null;
  return { time, cochonettes };
}

export function splitTournamentMessage(message) {
  if (!message) return [];
  return message.split('\n').filter((l) => l.trim());
}

export { pluralizeRounds, formatSwissDescription };
