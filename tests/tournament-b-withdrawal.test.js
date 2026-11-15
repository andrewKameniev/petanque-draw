import { describe, expect, it } from 'vitest';
import { drawSwissRound } from '../src/services/draw';
import { planTournamentBWithdrawal } from '../src/services/tournament-b-withdrawal';

function team(title, overrides = {}) {
  return {
    title,
    wins: 0,
    opponents: [],
    pointsPlus: 0,
    pointsMinus: 0,
    ...overrides,
  };
}

describe('Tournament B withdrawal', () => {
  it('marks the team withdrawn and gives it a technical loss in the active round', () => {
    const tournament = {
      roundIsActive: true,
      teams: [team('Alpha'), team('Beta')],
      games: [
        [
          {
            team_1: 'Alpha',
            team_1_score: null,
            team_2: 'Beta',
            team_2_score: null,
            status: 'not_started',
          },
        ],
      ],
      preferences: { technical: { technicalFirst: 13, technicalSecond: 7 } },
    };

    const result = planTournamentBWithdrawal(tournament, 'Alpha');

    expect(result.changed).toBe(true);
    expect(result.technicalLossApplied).toBe(true);
    expect(result.teams.find(({ title }) => title === 'Alpha').withdrawn).toBe(true);
    expect(result.games[0][0]).toMatchObject({
      team_1_score: 7,
      team_2_score: 13,
      status: 'finished',
      winner: 'Beta',
    });
    expect(tournament.teams[0].withdrawn).toBeUndefined();
    expect(tournament.games[0][0].team_1_score).toBeNull();
  });

  it('keeps completed rounds unchanged when no round is active', () => {
    const tournament = {
      roundIsActive: false,
      teams: [team('Alpha'), team('Beta')],
      games: [[{ team_1: 'Alpha', team_1_score: 13, team_2: 'Beta', team_2_score: 8, winner: 'Alpha' }]],
      preferences: { technical: { technicalFirst: 13, technicalSecond: 7 } },
    };

    const result = planTournamentBWithdrawal(tournament, 'Alpha');

    expect(result.changed).toBe(true);
    expect(result.technicalLossApplied).toBe(false);
    expect(result.games).toEqual(tournament.games);
  });

  it('does not include withdrawn teams in later Swiss draws', () => {
    const teams = [team('A'), team('B'), team('C'), team('D'), team('Withdrawn', { withdrawn: true })];
    const tournament = {
      teams,
      useRating: false,
      preferences: { technical: { technicalFirst: 13, technicalSecond: 7 } },
    };

    const { round, error } = drawSwissRound(tournament, teams, 2);
    const drawnTitles = round.flatMap((game) => [game.team_1, game.team_2]);

    expect(error).toBeNull();
    expect(drawnTitles).not.toContain('Withdrawn');
    expect(drawnTitles).toHaveLength(4);
  });
});
