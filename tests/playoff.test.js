import { describe, it, expect } from 'vitest';
import { buildPlayOffScheme, reorderBracket, buildCadrageGames } from '@/services/playoff';

function makeTeam(title, place) {
    return { title, place };
}

function makeTeamList(count) {
    return Array.from({ length: count }, (_, i) => makeTeam(`Team${i + 1}`, i + 1));
}

describe('buildCadrageGames', () => {
    it('creates correct cadrage games for 4 teams', () => {
        const teams = makeTeamList(4);
        const result = buildCadrageGames(teams, 4);
        expect(result).toHaveLength(2);
        expect(result[0].stage).toBe('cadrage');
        expect(result[0].team_1).toBe('Team1');
        expect(result[0].team_2).toBe('Team4');
        expect(result[1].team_1).toBe('Team2');
        expect(result[1].team_2).toBe('Team3');
    });

    it('sets correct places based on teamToPlayOff', () => {
        const teams = makeTeamList(4);
        const result = buildCadrageGames(teams, 8);
        expect(result[0].team_1_place).toBe(5);
        expect(result[0].team_2_place).toBe(8);
    });

    it('all scores are null initially', () => {
        const teams = makeTeamList(6);
        const result = buildCadrageGames(teams, 6);
        result.forEach((game) => {
            expect(game.team_1_score).toBeNull();
            expect(game.team_2_score).toBeNull();
        });
    });
});

describe('buildPlayOffScheme', () => {
    it('creates correct playoff for 4 teams (stage=2)', () => {
        const teams = makeTeamList(4);
        const result = buildPlayOffScheme(teams, false);
        expect(result).toHaveLength(2);
        expect(result[0].stage).toBe(2);
        expect(result[0].team_1).toBe('Team1');
        expect(result[0].team_2).toBe('Team4');
    });

    it('creates correct playoff for 8 teams (stage=4)', () => {
        const teams = makeTeamList(8);
        const result = buildPlayOffScheme(teams, false);
        expect(result).toHaveLength(4);
        expect(result[0].stage).toBe(4);
    });

    it('sets empty string for team_2_place when hasCadrage is true', () => {
        const teams = makeTeamList(4);
        const result = buildPlayOffScheme(teams, true);
        result.forEach((game) => {
            expect(game.team_2_place).toBe('');
        });
    });

    it('sets numeric team_2_place when hasCadrage is false', () => {
        const teams = makeTeamList(4);
        const result = buildPlayOffScheme(teams, false);
        result.forEach((game) => {
            expect(typeof game.team_2_place).toBe('number');
        });
    });

    it('reorders bracket for 16 teams', () => {
        const teams = makeTeamList(16);
        const result = buildPlayOffScheme(teams, false);
        expect(result).toHaveLength(8);
        const allTeams = result.flatMap((g) => [g.team_1, g.team_2]);
        expect(new Set(allTeams).size).toBe(16);
    });

    it('reorders bracket for 32 teams', () => {
        const teams = makeTeamList(32);
        const result = buildPlayOffScheme(teams, false);
        expect(result).toHaveLength(16);
    });

    it('every team appears exactly once in playoff', () => {
        const teams = makeTeamList(16);
        const result = buildPlayOffScheme(teams, false);
        const allTeams = result.flatMap((g) => [g.team_1, g.team_2]);
        const unique = new Set(allTeams);
        expect(unique.size).toBe(16);
    });
});

describe('reorderBracket', () => {
    it('swaps positions for stage=8', () => {
        const scheme = Array.from({ length: 8 }, (_, i) => ({ id: i }));
        const result = reorderBracket([...scheme], 8);
        expect(result[2].id).toBe(4);
        expect(result[4].id).toBe(2);
        expect(result[3].id).toBe(5);
        expect(result[5].id).toBe(3);
    });

    it('returns scheme unchanged for unsupported stage', () => {
        const scheme = [{ id: 0 }, { id: 1 }];
        const result = reorderBracket(scheme, 2);
        expect(result).toEqual(scheme);
    });

    it('applies 16-team order correctly', () => {
        const scheme = Array.from({ length: 16 }, (_, i) => ({ id: i }));
        const result = reorderBracket(scheme, 16);
        expect(result[0].id).toBe(0);
        expect(result[1].id).toBe(1);
        expect(result[2].id).toBe(8);
        expect(result[3].id).toBe(9);
    });
});
