import { describe, expect, it } from 'vitest';
import { createTournamentData } from '@/services/tournament-record';
import { drawGroupsRound, generateConstrainedGroups } from '@/services/draw';
import {
  CLUB_MATCH_TOTAL_POINTS,
  CLUB_PHASES,
  CLUB_ROSTER_MAX,
  autoFillClubMatch,
  createClubMatch,
  createClubRound,
  getClubLineupConflicts,
  getClubMatchSummary,
  getClubRosterStatus,
  isClubMatchComplete,
  rankClubTournament,
  syncClubMatch,
} from '@/services/club-tournament';

function team(title, playerCount = 6) {
  return {
    title,
    rating: 0,
    players: Array.from({ length: playerCount }, (_, index) => ({ id: `${title}-${index}`, name: `Player ${index}` })),
    wins: 0,
    pointsPlus: 0,
    pointsMinus: 0,
    opponents: ['placeholder'],
    lanes: [],
  };
}

function finishMatch(teamOne, teamTwo, teamOneWinsCount = 6) {
  const game = createClubMatch({ team_1: teamOne, team_2: teamTwo });
  game.clubMatch.disciplines.forEach((discipline, index) => {
    const teamOneWins = index < teamOneWinsCount;
    discipline.team_1_score = teamOneWins ? 13 : 7;
    discipline.team_2_score = teamOneWins ? 7 : 13;
  });
  return syncClubMatch(game);
}

describe('club tournament format', () => {
  it('creates the official 11-game, 31-point match model', () => {
    const game = createClubMatch({ team_1: 'A', team_2: 'B' });
    const disciplines = game.clubMatch.disciplines;

    expect(disciplines).toHaveLength(11);
    expect(disciplines.filter((item) => item.phase === 'singles')).toHaveLength(6);
    expect(disciplines.filter((item) => item.phase === 'doubles')).toHaveLength(3);
    expect(disciplines.filter((item) => item.phase === 'triples')).toHaveLength(2);
    expect(CLUB_PHASES.reduce((total, phase) => total + phase.count * phase.weight, 0)).toBe(CLUB_MATCH_TOTAL_POINTS);
  });

  it('derives the aggregate game points and winner from discipline scores', () => {
    const game = createClubMatch({ team_1: 'A', team_2: 'B' });
    const winners = ['A', 'A', 'A', 'A', 'B', 'B', 'A', 'B', 'B', 'A', 'B'];
    game.clubMatch.disciplines.forEach((discipline, index) => {
      discipline.team_1_score = winners[index] === 'A' ? 13 : 8;
      discipline.team_2_score = winners[index] === 'B' ? 13 : 8;
    });

    syncClubMatch(game);

    expect(getClubMatchSummary(game)).toMatchObject({
      team_1_game_points: 16,
      team_2_game_points: 15,
      team_1_games_won: 6,
      team_2_games_won: 5,
      completed_games: 11,
    });
    expect(game).toMatchObject({ team_1_score: 16, team_2_score: 15, status: 'finished', winner: 'A' });
    expect(isClubMatchComplete(game)).toBe(true);
  });

  it('keeps the match incomplete when any subgame is missing or tied', () => {
    const game = finishMatch('A', 'B');
    game.clubMatch.disciplines[0].team_2_score = 13;

    syncClubMatch(game);

    expect(game.status).toBe('in_progress');
    expect(game.clubMatch.summary.completed_games).toBe(10);
    expect(isClubMatchComplete(game)).toBe(false);
  });

  it('supports a ten-player registered roster with six active slots per phase', () => {
    expect(CLUB_ROSTER_MAX).toBe(10);
    expect(getClubRosterStatus(team('A', 10))).toMatchObject({ count: 10, valid: true });
    expect(getClubRosterStatus(team('A', 5))).toMatchObject({ count: 5, valid: false, tooSmall: true });
    CLUB_PHASES.forEach((phase) => {
      expect(phase.count * phase.playersPerTeam).toBe(6);
    });
  });

  it('detects a player entered twice in the same phase but permits rotation between phases', () => {
    const game = createClubMatch({ team_1: 'A', team_2: 'B' });
    const [singlesOne, singlesTwo] = game.clubMatch.disciplines;
    const firstDouble = game.clubMatch.disciplines.find((item) => item.phase === 'doubles');
    singlesOne.team_1_players[0] = 'player-1';
    singlesTwo.team_1_players[0] = 'player-1';
    firstDouble.team_1_players[0] = 'player-1';

    expect(getClubLineupConflicts(game, 'team_1')).toEqual([{ phase: 'singles', playerKey: 'player-1' }]);
  });

  it('awards three match points and uses the weighted game score in standings', () => {
    const teams = [team('A'), team('B'), team('C')];
    const tournament = {
      system: 'club',
      teams,
      groups: [teams],
      games: [[finishMatch('A', 'B', 6)], [finishMatch('B', 'C', 7)], [finishMatch('C', 'A', 5)]],
    };

    const [ranking] = rankClubTournament(tournament);

    expect(ranking.map((item) => item.title)).toEqual(['B', 'A', 'C']);
    expect(ranking.map((item) => item.matchPoints)).toEqual([3, 3, 3]);
    expect(ranking[0]).toMatchObject({ gamesPlayed: 2, wins: 1, losses: 1 });
  });

  it('builds a three-round schedule for four clubs with every pairing exactly once', () => {
    const tournament = createTournamentData({ teams: [team('A'), team('B'), team('C'), team('D')], system: 'club' });
    const { groups, schemas } = generateConstrainedGroups(tournament, 4);
    tournament.groups = groups;
    tournament.groupsScheme = schemas;

    const schedule = Array.from({ length: 3 }, () => createClubRound(drawGroupsRound(tournament)));
    const normalizedRounds = schedule.map((round) => round.map((game) => `${game.team_1}-${game.team_2}`));
    const pairings = schedule
      .flat()
      .map((game) => [game.team_1, game.team_2].sort().join('-'))
      .sort();

    expect(normalizedRounds).toEqual([
      ['A-D', 'B-C'],
      ['A-C', 'D-B'],
      ['A-B', 'C-D'],
    ]);
    expect(pairings).toEqual(['A-B', 'A-C', 'A-D', 'B-C', 'B-D', 'C-D']);
    schedule.forEach((round) => {
      expect(new Set(round.flatMap((game) => [game.team_1, game.team_2])).size).toBe(4);
    });
  });

  it('can auto-fill a complete test match without a drawn subgame', () => {
    const game = createClubMatch({ team_1: 'A', team_2: 'B' });
    autoFillClubMatch(game, () => 0.75);

    expect(game.status).toBe('finished');
    expect(game.clubMatch.summary.completed_games).toBe(11);
    expect(game.clubMatch.disciplines.every((item) => item.team_1_score !== item.team_2_score)).toBe(true);
  });
});
