import { describe, expect, it } from 'vitest';
import {
  buildDoubleEliminationBracket,
  findDoubleEliminationMatch,
  getBracketSeedOrder,
  getDoubleEliminationParticipantCount,
  getEditableDoubleEliminationStages,
  getPublicDoubleEliminationMatches,
  getReadyDoubleEliminationStages,
  recordDoubleEliminationResult,
  stageDoubleEliminationResult,
} from '@/services/playoff';
import { autoFillScores } from '@/services/testUtils';
import ua from '@/locales/ua';

const entrants = (count) => Array.from({ length: count }, (_, index) => ({ title: `Team ${index + 1}` }));

function play(bracket, matchId, winnerSlot = 1) {
  recordDoubleEliminationResult(bracket, matchId, winnerSlot === 1 ? 13 : 7, winnerSlot === 1 ? 7 : 13);
}

describe('double-elimination bracket', () => {
  it('uses standard balanced seed positions', () => {
    expect(getBracketSeedOrder(8)).toEqual([1, 8, 5, 4, 3, 6, 7, 2]);
  });

  it('builds the expected upper/lower structure for eight entrants', () => {
    const bracket = buildDoubleEliminationBracket(entrants(8));
    expect(bracket.stages.filter((stage) => stage.bracket === 'upper').map((stage) => stage.teams.length)).toEqual([
      4, 2, 1,
    ]);
    expect(bracket.stages.filter((stage) => stage.bracket === 'lower').map((stage) => stage.teams.length)).toEqual([
      2, 2, 1, 1,
    ]);
    expect(bracket.grandFinalMode).toBe('single');
    expect(bracket.stages.flatMap((stage) => stage.teams)).toHaveLength(14);
  });

  it('assigns non-power-of-two byes to high seeds and advances them automatically', () => {
    const bracket = buildDoubleEliminationBracket(entrants(6));
    const firstRound = bracket.stages.find((stage) => stage.id === 'upper-1');
    const byeWinners = firstRound.teams.filter((match) => match.isBye).map((match) => match.winner);
    expect(bracket.size).toBe(8);
    expect(byeWinners).toEqual(['Team 1', 'Team 2']);
    expect(findDoubleEliminationMatch(bracket, 'U2M1').match.team_1).toBe('Team 1');
    expect(findDoubleEliminationMatch(bracket, 'U2M2').match.team_2).toBe('Team 2');
  });

  it('routes an upper-bracket loser into the crossed lower-bracket match', () => {
    const bracket = buildDoubleEliminationBracket(entrants(8));
    play(bracket, 'U1M1');
    play(bracket, 'U1M2');
    play(bracket, 'U1M3');
    play(bracket, 'U1M4');
    play(bracket, 'U2M1');
    play(bracket, 'U2M2');
    play(bracket, 'L1M1');
    play(bracket, 'L1M2');

    expect(findDoubleEliminationMatch(bracket, 'L2M1').match.team_2).toBe(
      findDoubleEliminationMatch(bracket, 'U2M2').match.loser,
    );
    expect(findDoubleEliminationMatch(bracket, 'L2M2').match.team_2).toBe(
      findDoubleEliminationMatch(bracket, 'U2M1').match.loser,
    );
  });

  it('makes upper and lower rounds playable together when dependencies allow it', () => {
    const bracket = buildDoubleEliminationBracket(entrants(8));
    ['U1M1', 'U1M2', 'U1M3', 'U1M4'].forEach((id) => play(bracket, id));

    expect(getReadyDoubleEliminationStages(bracket).map((stage) => stage.id)).toEqual(['upper-2', 'lower-1']);
  });

  it('auto-fills every simultaneously editable upper and lower match', () => {
    const bracket = buildDoubleEliminationBracket(entrants(8));
    ['U1M1', 'U1M2', 'U1M3', 'U1M4'].forEach((id) => play(bracket, id));
    const tournament = {
      preferences: { maxScore: 13 },
      playOff: bracket.stages[0].teams,
      playOffBracket: bracket,
      playOffStage: 'upper-2',
    };

    autoFillScores(tournament, 1);

    ['upper-2', 'lower-1'].forEach((stageId) => {
      const stage = bracket.stages.find((candidate) => candidate.id === stageId);
      stage.teams.forEach((match) => {
        expect(match.team_1_score).not.toBeNull();
        expect(match.team_2_score).not.toBeNull();
      });
    });
    expect(findDoubleEliminationMatch(bracket, 'U3M1').match.team_1_score).toBeNull();
  });

  it('keeps individually saved matches editable until the current batch is committed', () => {
    const bracket = buildDoubleEliminationBracket(entrants(4));
    const first = findDoubleEliminationMatch(bracket, 'U1M1').match;
    const second = findDoubleEliminationMatch(bracket, 'U1M2').match;

    stageDoubleEliminationResult(first, 13, 7);
    stageDoubleEliminationResult(second, 9, 13);

    expect(first.status).toBe('finished');
    expect(first.resultCommitted).toBe(false);
    expect(findDoubleEliminationMatch(bracket, 'U2M1').match.team_1).toBeNull();
    expect(getEditableDoubleEliminationStages(bracket).map((stage) => stage.id)).toEqual(['upper-1']);

    recordDoubleEliminationResult(bracket, first.id, first.team_1_score, first.team_2_score);
    recordDoubleEliminationResult(bracket, second.id, second.team_1_score, second.team_2_score);

    expect(first.resultCommitted).toBe(true);
    expect(findDoubleEliminationMatch(bracket, 'U2M1').match.team_1).toBe(first.winner);
    expect(getEditableDoubleEliminationStages(bracket).map((stage) => stage.id)).toEqual(['upper-2', 'lower-1']);
  });

  it('routes the winners-final loser into the losers final', () => {
    const bracket = buildDoubleEliminationBracket(entrants(8));
    const losersFinal = findDoubleEliminationMatch(bracket, 'L4M1').match;

    expect(losersFinal.source_2).toEqual({ type: 'loser', matchId: 'U3M1' });
  });

  it('finishes when the winners-final champion wins the grand final', () => {
    const bracket = buildDoubleEliminationBracket(entrants(4));
    ['U1M1', 'U1M2', 'U2M1', 'L1M1', 'L2M1'].forEach((id) => play(bracket, id));
    play(bracket, 'GF1');

    expect(bracket.champion).toBe(findDoubleEliminationMatch(bracket, 'GF1').match.team_1);
    expect(findDoubleEliminationMatch(bracket, 'GF2')).toBeNull();
    expect(bracket.placements[bracket.champion]).toBe(1);
  });

  it('uses one decisive grand final when the losers-final champion wins', () => {
    const bracket = buildDoubleEliminationBracket(entrants(4));
    ['U1M1', 'U1M2', 'U2M1', 'L1M1', 'L2M1'].forEach((id) => play(bracket, id));
    play(bracket, 'GF1', 2);

    expect(bracket.champion).toBe(findDoubleEliminationMatch(bracket, 'GF1').match.team_2);
    expect(bracket.runnerUp).toBe(findDoubleEliminationMatch(bracket, 'GF1').match.team_1);
    expect(findDoubleEliminationMatch(bracket, 'GF2')).toBeNull();
  });
});

describe('public double-elimination views', () => {
  it('shows all resolved public matches while omitting byes and skipped games', () => {
    const stage = {
      teams: [
        { id: 'finished', team_1: 'A', team_2: 'B', status: 'finished' },
        { id: 'ready', team_1: 'C', team_2: 'D', status: 'not_started' },
        { id: 'pending', team_1: 'E', team_2: null, status: 'not_started' },
        { id: 'bye', team_1: 'F', team_2: 'Technical', isBye: true, status: 'finished' },
        { id: 'skipped', team_1: 'G', team_2: 'H', status: 'skipped' },
      ],
    };

    expect(getPublicDoubleEliminationMatches(stage).map((match) => match.id)).toEqual(['finished', 'ready']);
  });

  it('uses the bracket participant count for the localized team badge', () => {
    const count = getDoubleEliminationParticipantCount({
      teams: Array.from({ length: 16 }),
      playOffBracket: { format: 'double', participantCount: 16 },
    });

    expect(count).toBe(16);
    expect(ua.common.teamsLabel).toBe('команд');
  });
});
