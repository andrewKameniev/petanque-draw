import { describe, it, expect } from 'vitest';
import { assignLanes } from '@/services/draw';

function makeTeam(title, lanes = []) {
    return {
        title,
        wins: 0,
        opponents: [],
        rating: 0,
        buhgolts: 0,
        smallBuhgolts: 0,
        pointsPlus: 0,
        pointsMinus: 0,
        lanes,
        players: []
    };
}

function makeTournament(teams, options = {}) {
    return {
        teams,
        system: options.system || 'swiss',
        useRating: false,
        supermelePlayers: 2,
        preferences: {
            fieldsStart: options.fieldsStart || 1,
            technical: { technicalFirst: 13, technicalSecond: 0 },
            maxScore: 13
        },
        games: options.games || [],
    };
}

function makeGames(tournament) {
    const teams = tournament.teams;
    const games = [];
    for (let i = 0; i < teams.length - 1; i += 2) {
        games.push({
            team_1: teams[i].title,
            team_2: teams[i + 1].title,
            team_1_score: null,
            team_2_score: null,
        });
    }
    return assignLanes(games, tournament);
}

function swapLanes(games, teams, indexA, indexB) {
    const temp = games[indexA];
    games[indexA] = games[indexB];
    games[indexB] = temp;
    const tempLane = games[indexA].lane;
    games[indexA].lane = games[indexB].lane;
    games[indexB].lane = tempLane;
    teams.forEach(team => {
        if (team.lanes) team.lanes.pop();
    });
    games.forEach(game => {
        teams.forEach(team => {
            if (!team.lanes) team.lanes = [];
            if (team.title === game.team_1 && game.lane != null) {
                team.lanes.push(game.lane);
            }
            if (team.title === game.team_2 && game.lane != null) {
                team.lanes.push(game.lane);
            }
        });
    });
    return games;
}

describe('swap lanes', () => {
    it('swaps two games by their positions', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const tournament = makeTournament(teams);
        const games = makeGames(tournament);

        const team1AtLane0 = games[0].team_1;
        const team2AtLane0 = games[0].team_2;
        const team1AtLane1 = games[1].team_1;
        const team2AtLane1 = games[1].team_2;

        swapLanes(games, teams, 0, 1);

        expect(games[0].team_1).toBe(team1AtLane1);
        expect(games[0].team_2).toBe(team2AtLane1);
        expect(games[1].team_1).toBe(team1AtLane0);
        expect(games[1].team_2).toBe(team2AtLane0);
    });

    it('swaps lane properties correctly', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const tournament = makeTournament(teams);
        const games = makeGames(tournament);

        const lane0Before = games[0].lane;
        const lane1Before = games[1].lane;

        swapLanes(games, teams, 0, 1);

        expect(games[0].lane).toBe(lane0Before);
        expect(games[1].lane).toBe(lane1Before);
    });

    it('updates team lanes history after swap', () => {
        const teams = [makeTeam('A', [0]), makeTeam('B', [0]), makeTeam('C', [1]), makeTeam('D', [1])];
        const tournament = makeTournament(teams);
        const games = makeGames(tournament);

        const teamA = teams.find(t => t.title === 'A');
        const teamC = teams.find(t => t.title === 'C');
        const laneOfA = games.find(g => g.team_1 === 'A' || g.team_2 === 'A').lane;
        const laneOfC = games.find(g => g.team_1 === 'C' || g.team_2 === 'C').lane;

        const indexA = games.findIndex(g => g.team_1 === 'A' || g.team_2 === 'A');
        const indexC = games.findIndex(g => g.team_1 === 'C' || g.team_2 === 'C');

        swapLanes(games, teams, indexA, indexC);

        const newLaneOfA = games.find(g => g.team_1 === 'A' || g.team_2 === 'A').lane;
        const newLaneOfC = games.find(g => g.team_1 === 'C' || g.team_2 === 'C').lane;

        expect(newLaneOfA).toBe(laneOfC);
        expect(newLaneOfC).toBe(laneOfA);
        expect(teamA.lanes[teamA.lanes.length - 1]).toBe(newLaneOfA);
        expect(teamC.lanes[teamC.lanes.length - 1]).toBe(newLaneOfC);
    });

    it('works with fieldsStart offset', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D'), makeTeam('E'), makeTeam('F')];
        const tournament = makeTournament(teams, { fieldsStart: 5 });
        const games = makeGames(tournament);

        expect(games[0].lane).toBe(4);
        expect(games[1].lane).toBe(5);
        expect(games[2].lane).toBe(6);

        const team1First = games[0].team_1;
        const team1Third = games[2].team_1;

        swapLanes(games, teams, 0, 2);

        expect(games[0].team_1).toBe(team1Third);
        expect(games[2].team_1).toBe(team1First);
        expect(games[0].lane).toBe(4);
        expect(games[2].lane).toBe(6);
    });

    it('handles swap with same index (no-op)', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const tournament = makeTournament(teams);
        const games = makeGames(tournament);

        const gamesBefore = JSON.parse(JSON.stringify(games));
        swapLanes(games, teams, 0, 0);

        expect(games[0].team_1).toBe(gamesBefore[0].team_1);
        expect(games[0].team_2).toBe(gamesBefore[0].team_2);
        expect(games[1].team_1).toBe(gamesBefore[1].team_1);
        expect(games[1].team_2).toBe(gamesBefore[1].team_2);
    });

    it('swap is reversible', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D')];
        const tournament = makeTournament(teams);
        const games = makeGames(tournament);

        const originalOrder = games.map(g => g.team_1);

        swapLanes(games, teams, 0, 1);
        swapLanes(games, teams, 0, 1);

        expect(games.map(g => g.team_1)).toEqual(originalOrder);
    });

    it('works with 6 teams and non-adjacent swap', () => {
        const teams = [makeTeam('A'), makeTeam('B'), makeTeam('C'), makeTeam('D'), makeTeam('E'), makeTeam('F')];
        const tournament = makeTournament(teams);
        const games = makeGames(tournament);

        const firstGame = { ...games[0] };
        const lastGame = { ...games[2] };

        swapLanes(games, teams, 0, 2);

        expect(games[0].team_1).toBe(lastGame.team_1);
        expect(games[0].team_2).toBe(lastGame.team_2);
        expect(games[2].team_1).toBe(firstGame.team_1);
        expect(games[2].team_2).toBe(firstGame.team_2);
    });
});
