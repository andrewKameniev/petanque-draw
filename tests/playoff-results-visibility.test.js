import { describe, it, expect } from 'vitest';
import { hasPlayOffResults, getDefaultSelectedRound } from '@/services/results';

describe('hasPlayOffResults — shows playoff tab when teams assigned', () => {
    it('returns true when stage has teams but no scores yet', () => {
        expect(hasPlayOffResults({
            playOffBracket: {
                stages: [{
                    stageLabel: 4,
                    teams: [
                        { team_1: 'A', team_2: 'B', team_1_score: null, team_2_score: null },
                        { team_1: 'C', team_2: 'D', team_1_score: null, team_2_score: null },
                    ]
                }]
            }
        })).toBe(true);
    });

    it('returns true when stage has one team assigned (bye game)', () => {
        expect(hasPlayOffResults({
            playOffBracket: {
                stages: [{
                    stageLabel: 4,
                    teams: [
                        { team_1: 'A', team_2: null, isBye: true },
                        { team_1: 'C', team_2: 'D', team_1_score: null, team_2_score: null },
                    ]
                }]
            }
        })).toBe(true);
    });

    it('returns false when stage has empty games (no teams yet)', () => {
        expect(hasPlayOffResults({
            playOffBracket: {
                stages: [{
                    stageLabel: 2,
                    teams: [
                        { team_1: null, team_2: null, team_1_score: null, team_2_score: null },
                    ]
                }]
            }
        })).toBe(false);
    });

    it('returns false when only cadrage stage has teams', () => {
        expect(hasPlayOffResults({
            playOffBracket: {
                stages: [{
                    stageLabel: 'cadrage',
                    teams: [{ team_1: 'A', team_2: 'B' }]
                }]
            }
        })).toBe(false);
    });

    it('returns true with cadrage + non-cadrage stage that has teams', () => {
        expect(hasPlayOffResults({
            playOffBracket: {
                stages: [
                    { stageLabel: 'cadrage', teams: [{ team_1: 'A', team_2: 'B' }] },
                    { stageLabel: 4, teams: [{ team_1: 'C', team_2: 'D', team_1_score: null }] },
                ]
            }
        })).toBe(true);
    });

    it('returns true for final stage (stageLabel=1) with teams', () => {
        expect(hasPlayOffResults({
            playOffBracket: {
                stages: [
                    { stageLabel: 4, teams: [{ team_1: 'A', team_2: 'B' }] },
                    { stageLabel: 2, teams: [{ team_1: null, team_2: null }] },
                    { stageLabel: 1, teams: [{ team_1: 'X', team_2: 'Y' }] },
                ]
            }
        })).toBe(true);
    });
});

describe('getDefaultSelectedRound — playoff auto-selection', () => {
    it('selects playoff when teams are assigned but unscored', () => {
        const tournament = {
            games: [[{}], [{}]],
            cadrage: [{ team_1: 'A', team_2: 'B' }],
            playOffBracket: {
                stages: [{
                    stageLabel: 4,
                    teams: [{ team_1: 'A', team_2: 'B', team_1_score: null }]
                }]
            }
        };
        expect(getDefaultSelectedRound(tournament)).toBe('playoff');
    });
});

describe('stageHasContent logic (inline check)', () => {
    function stageHasContent(stage) {
        return stage.teams?.some(g => g.team_1 || g.team_2);
    }

    it('returns true when all games have both teams', () => {
        expect(stageHasContent({
            teams: [
                { team_1: 'A', team_2: 'B' },
                { team_1: 'C', team_2: 'D' },
            ]
        })).toBe(true);
    });

    it('returns true when a game has only team_1 (bye)', () => {
        expect(stageHasContent({
            teams: [
                { team_1: 'A', team_2: null, isBye: true },
            ]
        })).toBe(true);
    });

    it('returns true when a game has only team_2', () => {
        expect(stageHasContent({
            teams: [
                { team_1: null, team_2: 'B' },
            ]
        })).toBe(true);
    });

    it('returns false when no games have teams', () => {
        expect(stageHasContent({
            teams: [
                { team_1: null, team_2: null, team_1_score: null },
                { team_1: null, team_2: null, team_1_score: null },
            ]
        })).toBe(false);
    });

    it('returns false when teams array is empty', () => {
        expect(stageHasContent({ teams: [] })).toBe(false);
    });

    it('returns falsy when teams is undefined', () => {
        expect(stageHasContent({})).toBeFalsy();
    });

    it('distinguishes cadrage stage with content from non-cadrage with content', () => {
        const cadrageStage = { stageLabel: 'cadrage', teams: [{ team_1: 'A', team_2: 'B' }] };
        const quarterFinal = { stageLabel: 4, teams: [{ team_1: 'C', team_2: 'D' }] };
        expect(stageHasContent(cadrageStage)).toBe(true);
        expect(stageHasContent(quarterFinal)).toBe(true);
    });

    it('handles mixed: some games have teams, some do not (next stage)', () => {
        expect(stageHasContent({
            teams: [
                { team_1: null, team_2: null },
                { team_1: 'A', team_2: null },
            ]
        })).toBe(true);
    });
});
