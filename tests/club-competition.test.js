import { describe, expect, it } from 'vitest';
import {
  CLUB_CHANGE,
  createPortalClubDraft,
  isPortalClubTournament,
  planClubCompetitionChange,
  validateClubCompetitionStart,
} from '../src/services/club-competition';
import {
  CLUB_COMMAND,
  CLUB_PHASE,
  createClubEncounter,
  applyClubEncounterCommand,
  clubGameWithResult,
} from '../src/services/club-encounter';
import { projectPublicTournamentCompetition } from '../src/services/public-tournament-projection';
import { gameHasError, isScoreError } from '../src/helpers';
import { makeClub, makeClubTournament, clubPositions, beginClubStage } from './fixtures/club-competition';
import { createGroups, drawGroupsRound, drawSwissRound, saveResultsForRound } from '../src/services/draw';
import { buildPlayOffScheme } from '../src/services/playoff';
import { computeGroupStats } from '../src/services/group-ranking';
import { CLUB_ABSENCE, clubAbsenceHasError } from '../src/services/club-encounter';

describe('club competition integration plans', () => {
  it('schedules five clubs once each and gives each one rest without points or an opponent', () => {
    const tournament = {
      ...makeClubTournament(),
      games: [],
      teams: Array.from({ length: 5 }, (_, index) => makeClub(String(index))),
    };
    const { groups, schemas } = createGroups(tournament, 5);
    Object.assign(tournament, { groups, groupsScheme: schemas });
    for (let round = 0; round < 5; round++) tournament.games.push(drawGroupsRound(tournament));
    const played = tournament.games.flat().filter((game) => !game.clubAbsence);
    expect(played).toHaveLength(10);
    expect(new Set(played.map((game) => [game.team_1, game.team_2].sort().join('|'))).size).toBe(10);
    tournament.games.forEach((round) => {
      expect(round.filter((game) => game.clubAbsence === CLUB_ABSENCE.REST)).toHaveLength(1);
      round
        .filter((game) => !game.clubAbsence)
        .forEach((game) => Object.assign(game, { status: 'finished', team_1_score: 16, team_2_score: 15 }));
    });
    for (let round = 0; round < 5; round++) saveResultsForRound(tournament, round);
    tournament.teams.forEach((team) => {
      const rests = tournament.games.flat().filter((game) => game.clubAbsence && game.team_1 === team.title);
      expect(rests).toHaveLength(1);
      expect(isScoreError(rests[0], 13)).toBe(false);
      expect(team.opponents).toHaveLength(4);
      expect(team.opponents).not.toContain('Technical');
      expect(team.pointsPlus + team.pointsMinus).toBe(4 * 31);
    });
    expect(tournament.teams.reduce((sum, team) => sum + team.wins, 0)).toBe(10);
    const stats = computeGroupStats(tournament.teams, tournament.games, { includeStatuses: ['finished'] });
    expect(stats.map((team) => [team.wins, team.pointsPlus, team.pointsMinus])).toEqual(
      tournament.teams.map((team) => [team.wins, team.pointsPlus, team.pointsMinus]),
    );
    const fromFirebase = { ...tournament.games.flat().find((game) => game.clubAbsence) };
    delete fromFirebase.team_1_score;
    delete fromFirebase.team_2_score;
    delete fromFirebase.winner;
    expect(clubAbsenceHasError(fromFirebase)).toBe(false);
  });
  it.each([10, 11])('runs two Swiss rounds for %i clubs, using 21:10 only for the bye', (count) => {
    const tournament = {
      ...makeClubTournament(),
      system: 'swiss',
      useRating: true,
      games: [],
      teams: Array.from({ length: count }, (_, index) => makeClub(String(index))),
    };
    const byes = [];
    const pairs = new Set();
    for (let roundIndex = 0; roundIndex < 2; roundIndex++) {
      const { round, error } = drawSwissRound(tournament, tournament.teams, roundIndex + 1);
      expect(error).toBeNull();
      expect(round).toHaveLength(Math.ceil(count / 2));
      round.forEach((game) => {
        if (game.clubAbsence) {
          expect(game).toMatchObject({
            team_1_score: 21,
            team_2_score: 10,
            status: 'finished',
            clubAbsence: CLUB_ABSENCE.WALKOVER,
          });
          expect(game.clubEncounter).toBeUndefined();
          expect(isScoreError(game, 13)).toBe(false);
          byes.push(game.team_1);
        } else {
          const pair = [game.team_1, game.team_2].sort().join('|');
          expect(pairs.has(pair)).toBe(false);
          pairs.add(pair);
          Object.assign(game, { status: 'finished', team_1_score: 16, team_2_score: 15 });
        }
      });
      tournament.games.push(round);
      saveResultsForRound(tournament, roundIndex);
    }
    expect(byes).toHaveLength(count % 2 ? 2 : 0);
    expect(new Set(byes).size).toBe(byes.length);
    expect(tournament.teams.reduce((sum, team) => sum + team.wins, 0)).toBe(2 * Math.ceil(count / 2));
  });
  it('keeps four-club semifinals and records three walkovers for five clubs in an eight-slot bracket', () => {
    const tournament = makeClubTournament();
    expect(
      buildPlayOffScheme(
        Array.from({ length: 4 }, (_, index) => makeClub(String(index))),
        false,
        tournament,
      ),
    ).toHaveLength(2);
    const entrants = [
      ...Array.from({ length: 5 }, (_, index) => makeClub(String(index))),
      ...Array.from({ length: 3 }, () => ({ title: null, isBye: true })),
    ];
    const games = buildPlayOffScheme(entrants, false, tournament);
    expect(games.filter((game) => !game.isBye)).toHaveLength(1);
    games
      .filter((game) => game.isBye)
      .forEach((game) => {
        expect(game.winner).toBe(game.team_1 || game.team_2);
        expect([game.team_1_score, game.team_2_score].sort((a, b) => b - a)).toEqual([21, 10]);
        expect(isScoreError(game, 13)).toBe(false);
        expect(game.clubEncounter).toBeUndefined();
      });
  });
  it('locks roster size before registrations and preserves existing records', () => {
    const competition = makeClubTournament();
    const empty = { ...competition, teams: [], games: [], system: 'swiss' };
    const plan = planClubCompetitionChange(empty, { type: CLUB_CHANGE.CONFIGURE, rosterSize: 9 });
    expect(plan.paths.preferences.clubRosterSize).toBe(9);
    expect(plan.paths.system).toBe('swiss');
    expect(plan.paths.preferences.technical).toEqual({ technicalFirst: 21, technicalSecond: 10 });
    expect(empty.preferences.clubRosterSize).toBe(8);
    expect(() => planClubCompetitionChange(competition, { type: CLUB_CHANGE.CONFIGURE, rosterSize: 9 })).toThrow(
      'locked',
    );
    expect(() => validateClubCompetitionStart({ ...competition, system: 'supermele' })).toThrow('locked');
    expect(() => validateClubCompetitionStart(competition)).not.toThrow();
  });
  it('detects club rosters and imports all clubs atomically without padding seven-player entries', () => {
    const data = {
      teams: [7, 9, 8, 9].map((count, i) => ({ id: i + 1, players: makeClub(String(i), count).players })),
    };
    expect(isPortalClubTournament(data)).toBe(true);
    for (const size of [1, 2, 3])
      expect(isPortalClubTournament({ teams: [{ players: makeClub('normal', size).players }] })).toBe(false);
    expect(isPortalClubTournament({ teams: [] })).toBe(false);
    const tournament = { ...makeClubTournament(), teams: [], games: [] };
    const clubs = data.teams.map(createPortalClubDraft);
    const plan = planClubCompetitionChange(tournament, { type: CLUB_CHANGE.IMPORT, rosterSize: 9, clubs });
    expect(plan.replacements.teams.map((club) => club.players.length)).toEqual([7, 9, 8, 9]);
    expect(plan.paths.preferences.clubRosterSize).toBe(9);
    expect(tournament.teams).toEqual([]);
    clubs[3].players[0].id = clubs[0].players[0].id;
    expect(() => planClubCompetitionChange(tournament, { type: CLUB_CHANGE.IMPORT, rosterSize: 9, clubs })).toThrow(
      'duplicate',
    );
    expect(tournament.teams).toEqual([]);
  });
  it('imports a 691-shaped roster without inventing gender or changing profile clubs', () => {
    const exported = { id: 123, name: 'CAPTAIN Name', power: '24.0278', club: null, players: makeClub('a', 7).players };
    const draft = createPortalClubDraft(exported, 9);
    expect(draft.players).toHaveLength(7);
    expect(draft.rating).toBe(24.0278);
    expect(draft).toMatchObject({ clubId: 'a', title: 'Club a', captainId: 'a-0', portalTeamId: 123 });
    expect(draft.players.every((player) => !('gender' in player))).toBe(true);
    expect(exported.players).toHaveLength(7);
    const oversized = createPortalClubDraft({ ...exported, players: makeClub('a', 9).players }, 8);
    expect(oversized.players).toHaveLength(9);
    expect(oversized.players[7].club_id).toBe('guest');
  });
  it('stores one game atomically and leaves other games untouched', () => {
    const competition = makeClubTournament();
    const plan = planClubCompetitionChange(competition, {
      type: CLUB_CHANGE.MATCH,
      locator: { kind: 'round', roundIndex: 0, gameIndex: 0 },
      command: {
        type: CLUB_COMMAND.LINEUPS,
        stageIndex: 0,
        positions1: clubPositions(competition.teams[0], 0),
        positions2: clubPositions(competition.teams[1], 0),
      },
    });
    expect(Object.keys(plan.paths)).toEqual(['games/0/0']);
    expect(plan.replacements.games[0][0].clubEncounter.stages[0].published).toBe(true);
    expect(competition.games[0][0].clubEncounter).toBeUndefined();
    expect(isScoreError(plan.paths['games/0/0'], 13)).toBe(true);
  });
  it('recalculates historical standings from corrected current results, without adding twice', () => {
    const tournament = makeClubTournament();
    let encounter = createClubEncounter(tournament.teams, 8);
    for (let stageIndex = 0; stageIndex < 3; stageIndex++) {
      encounter = beginClubStage(encounter, tournament.teams, stageIndex);
      for (let gameIndex = 0; gameIndex < 6 / (stageIndex + 1); gameIndex++) {
        const wins = [[0, 1, 2, 3], [0], [0]][stageIndex];
        encounter = applyClubEncounterCommand(encounter, tournament.teams, {
          type: CLUB_COMMAND.SCORE,
          stageIndex,
          gameIndex,
          score1: wins.includes(gameIndex) ? 13 : 7,
          score2: wins.includes(gameIndex) ? 7 : 13,
          complete: true,
        });
      }
    }
    tournament.games[0][0] = clubGameWithResult(tournament.games[0][0], encounter);
    tournament.roundIsActive = false;
    const command = { type: CLUB_COMMAND.SCORE, stageIndex: 1, gameIndex: 0, score1: 7, score2: 13, complete: true };
    const change = { type: CLUB_CHANGE.MATCH, locator: { kind: 'round', roundIndex: 0, gameIndex: 0 }, command };
    const plan = planClubCompetitionChange(tournament, change);
    expect(plan.paths['games/0/0']).toMatchObject({ team_1_score: 13, team_2_score: 18, winner: 'Club b' });
    expect(plan.replacements.teams.map((club) => [club.wins, club.pointsPlus])).toEqual([
      [0, 13],
      [1, 18],
    ]);
    const second = planClubCompetitionChange({ ...tournament, ...plan.replacements }, change);
    expect(second.replacements.teams).toEqual(plan.replacements.teams);
    expect(gameHasError(plan.paths['games/0/0'], 13)).toBe(false);
  });
  it('projects all lineup and score data while keeping the arbiter audit private', () => {
    const tournament = makeClubTournament();
    const encounter = beginClubStage(createClubEncounter(tournament.teams, 8, CLUB_PHASE.PLAYOFF), tournament.teams, 0);
    tournament.games[0][0] = clubGameWithResult(tournament.games[0][0], encounter);
    const publicData = projectPublicTournamentCompetition(tournament);
    expect(publicData.preferences.clubRosterSize).toBe(8);
    expect(publicData.games[0][0].clubEncounter.stages).toEqual(encounter.stages);
    expect(publicData.games[0][0].clubEncounter.audit).toBeUndefined();
    expect(tournament.games[0][0].clubEncounter.audit).toHaveLength(2);
  });
});
