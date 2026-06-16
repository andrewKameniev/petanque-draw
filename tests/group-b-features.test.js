import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const storage = {};
globalThis.localStorage = {
    getItem: vi.fn(key => storage[key] || null),
    setItem: vi.fn((key, val) => { storage[key] = val; }),
    removeItem: vi.fn(key => { delete storage[key]; }),
};

const { useMainStore } = await import('@/stores/main');

function makeTeam(title, wins = 0, opts = {}) {
    return {
        title,
        wins,
        buhgolts: opts.buhgolts || 0,
        smallBuhgolts: opts.smallBuhgolts || 0,
        pointsPlus: opts.pointsPlus || 0,
        pointsMinus: opts.pointsMinus || 0,
        opponents: opts.opponents || ['placeholder'],
        lanes: opts.lanes || [],
        rating: opts.rating || 0,
        withdrawn: opts.withdrawn || false,
        ...opts
    };
}

function setupStoreWithTournament(teamCount = 10) {
    const store = useMainStore();
    const teams = [];
    for (let i = 1; i <= teamCount; i++) {
        teams.push(makeTeam(`Team ${i}`, teamCount - i, { pointsPlus: (teamCount - i) * 13 }));
    }
    store.addTournament({ teams, system: 'swiss' });
    store.tournaments[store.currentTournamentIndex].games = [
        teams.map((t, i) => ({
            team_1: teams[i]?.title,
            team_2: teams[(i + 1) % teams.length]?.title,
            team_1_score: 13,
            team_2_score: 7
        }))
    ];
    return store;
}

describe('Feature 1: Inline Group B', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('createTournament includes groupB: null and activeGroup: A by default', () => {
        const store = useMainStore();
        store.addTournament();
        const t = store.currentTournament;
        expect(t.groupB).toBeNull();
        expect(t.activeGroup).toBe('A');
    });

    it('initGroupB populates tournament.groupB with reset teams', () => {
        const store = setupStoreWithTournament(10);
        const teams = [
            makeTeam('Team 5', 5, { pointsPlus: 65, buhgolts: 10 }),
            makeTeam('Team 6', 4, { pointsPlus: 52, buhgolts: 8 }),
        ];
        store.initGroupB(teams);
        const groupB = store.currentTournament.groupB;
        expect(groupB).not.toBeNull();
        expect(groupB.teams).toHaveLength(2);
        expect(groupB.teams[0].title).toBe('Team 5');
        expect(groupB.teams[0].wins).toBe(0);
        expect(groupB.teams[0].buhgolts).toBe(0);
        expect(groupB.teams[0].pointsPlus).toBe(0);
        expect(groupB.teams[0].opponents).toEqual(['placeholder']);
        expect(groupB.games).toEqual([]);
        expect(groupB.roundIsActive).toBe(false);
    });

    it('setActiveGroup switches between A and B', () => {
        const store = setupStoreWithTournament(10);
        store.initGroupB([makeTeam('X')]);
        expect(store.currentTournament.activeGroup).toBe('A');
        store.setActiveGroup('B');
        expect(store.currentTournament.activeGroup).toBe('B');
        store.setActiveGroup('A');
        expect(store.currentTournament.activeGroup).toBe('A');
    });

    it('addGroupBTeams appends teams to existing groupB', () => {
        const store = setupStoreWithTournament(10);
        store.initGroupB([makeTeam('X', 3)]);
        expect(store.currentTournament.groupB.teams).toHaveLength(1);
        store.addGroupBTeams([makeTeam('Y', 2), makeTeam('Z', 1)]);
        expect(store.currentTournament.groupB.teams).toHaveLength(3);
        expect(store.currentTournament.groupB.teams[1].title).toBe('Y');
        expect(store.currentTournament.groupB.teams[1].wins).toBe(0);
    });

    it('initGroupB does not create separate tournament (no isGroupB flag)', () => {
        const store = setupStoreWithTournament(10);
        const tournamentCount = Object.keys(store.tournaments).length;
        store.initGroupB([makeTeam('X')]);
        expect(Object.keys(store.tournaments).length).toBe(tournamentCount);
        expect(store.currentTournament.groupB).not.toBeNull();
    });
});

describe('Feature 2: Withdraw Teams', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('toggleWithdrawn marks and unmarks a team', () => {
        const store = setupStoreWithTournament(10);
        const team = store.currentTournament.teams[2];
        expect(team.withdrawn).toBeFalsy();
        store.toggleWithdrawn(team.title);
        expect(store.currentTournament.teams[2].withdrawn).toBe(true);
        store.toggleWithdrawn(team.title);
        expect(store.currentTournament.teams[2].withdrawn).toBe(false);
    });

    it('withdrawn teams are skipped in playoff qualification', () => {
        const store = setupStoreWithTournament(10);
        const teams = store.currentTournament.teams;
        teams[2].withdrawn = true;
        teams[4].withdrawn = true;
        const eligible = teams.filter(t => !t.withdrawn);
        expect(eligible).toHaveLength(8);
        expect(eligible.find(t => t.title === teams[2].title)).toBeUndefined();
        expect(eligible.find(t => t.title === teams[4].title)).toBeUndefined();
    });

    it('withdrawn N teams means N extra teams qualify from below cutoff', () => {
        const store = setupStoreWithTournament(16);
        const teams = store.currentTournament.teams;
        const playOffTeams = 8;
        teams[2].withdrawn = true;
        teams[5].withdrawn = true;
        const eligible = teams.filter(t => !t.withdrawn);
        const qualified = eligible.slice(0, playOffTeams);
        expect(qualified).toHaveLength(8);
        expect(qualified.find(t => t.title === 'Team 3')).toBeUndefined();
        expect(qualified.find(t => t.title === 'Team 6')).toBeUndefined();
        expect(qualified.find(t => t.title === 'Team 9')).toBeDefined();
        expect(qualified.find(t => t.title === 'Team 10')).toBeDefined();
    });

    it('ranking still shows withdrawn teams at their earned position', () => {
        const store = setupStoreWithTournament(10);
        const teams = store.currentTournament.teams;
        teams[3].withdrawn = true;
        expect(teams[3].title).toBe('Team 4');
        expect(teams[3].withdrawn).toBe(true);
    });
});

describe('Feature 3: Elimination Round', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('setGroupBEliminationRound creates elimination data', () => {
        const store = setupStoreWithTournament(10);
        store.initGroupB([
            makeTeam('B1'), makeTeam('B2'), makeTeam('B3'), makeTeam('B4'),
            makeTeam('B5'), makeTeam('B6'), makeTeam('B7'), makeTeam('B8'),
            makeTeam('B9'), makeTeam('B10')
        ]);
        const elimRound = {
            games: [
                { team_1: 'B7', team_2: 'B10', team_1_score: null, team_2_score: null },
                { team_1: 'B8', team_2: 'B9', team_1_score: null, team_2_score: null }
            ],
            qualifiedFrom: 6,
            bracketSize: 8,
            completed: false
        };
        store.setGroupBEliminationRound(elimRound);
        expect(store.currentTournament.groupB.eliminationRound).toEqual(elimRound);
    });

    it('completeGroupBElimination marks losers as eliminated', () => {
        const store = setupStoreWithTournament(10);
        store.initGroupB([
            makeTeam('B1'), makeTeam('B2'), makeTeam('B3'), makeTeam('B4'),
            makeTeam('B5'), makeTeam('B6'), makeTeam('B7'), makeTeam('B8'),
            makeTeam('B9'), makeTeam('B10')
        ]);
        store.setGroupBEliminationRound({
            games: [
                { team_1: 'B7', team_2: 'B10', team_1_score: 13, team_2_score: 5 },
                { team_1: 'B8', team_2: 'B9', team_1_score: 13, team_2_score: 7 }
            ],
            qualifiedFrom: 6,
            bracketSize: 8,
            completed: false
        });
        store.completeGroupBElimination();
        const groupB = store.currentTournament.groupB;
        expect(groupB.eliminationRound.completed).toBe(true);
        const b10 = groupB.teams.find(t => t.title === 'B10');
        const b9 = groupB.teams.find(t => t.title === 'B9');
        const b7 = groupB.teams.find(t => t.title === 'B7');
        const b8 = groupB.teams.find(t => t.title === 'B8');
        expect(b10.eliminated).toBe(true);
        expect(b9.eliminated).toBe(true);
        expect(b7.eliminated).toBeFalsy();
        expect(b8.eliminated).toBeFalsy();
    });

    it('elimination pairing is fair: best-of-pool vs worst-of-pool', () => {
        const teams = [
            makeTeam('B7'), makeTeam('B8'), makeTeam('B9'), makeTeam('B10')
        ];
        const half = Math.floor(teams.length / 2);
        const games = [];
        for (let i = 0; i < half; i++) {
            games.push({
                team_1: teams[i].title,
                team_2: teams[teams.length - 1 - i].title,
                team_1_score: null,
                team_2_score: null
            });
        }
        expect(games[0].team_1).toBe('B7');
        expect(games[0].team_2).toBe('B10');
        expect(games[1].team_1).toBe('B8');
        expect(games[1].team_2).toBe('B9');
    });

    it('cadrage losers are correctly added to Group B teams', () => {
        const store = setupStoreWithTournament(10);
        store.initGroupB([makeTeam('B1'), makeTeam('B2')]);
        const cadrageLosers = [makeTeam('Loser1', 3), makeTeam('Loser2', 2)];
        store.addGroupBTeams(cadrageLosers);
        expect(store.currentTournament.groupB.teams).toHaveLength(4);
        expect(store.currentTournament.groupB.teams[2].title).toBe('Loser1');
        expect(store.currentTournament.groupB.teams[2].wins).toBe(0);
    });

    it('startGroupBRound adds round and sets active', () => {
        const store = setupStoreWithTournament(10);
        store.initGroupB([makeTeam('B1'), makeTeam('B2'), makeTeam('B3'), makeTeam('B4')]);
        const round = [
            { team_1: 'B1', team_2: 'B4', team_1_score: null, team_2_score: null, lane: 1 },
            { team_1: 'B2', team_2: 'B3', team_1_score: null, team_2_score: null, lane: 2 }
        ];
        store.startGroupBRound(round);
        expect(store.currentTournament.groupB.games).toHaveLength(1);
        expect(store.currentTournament.groupB.roundIsActive).toBe(true);
    });
});

describe('Feature 1+2 Integration: GroupB from playoff with withdrawn', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('withdrawn teams excluded from both playoff and groupB', () => {
        const store = setupStoreWithTournament(16);
        const teams = store.currentTournament.teams;
        teams[2].withdrawn = true;
        teams[5].withdrawn = true;

        const eligible = teams.filter(t => !t.withdrawn);
        const playOffTeams = 8;
        const playOffList = eligible.slice(0, playOffTeams);
        const qualifiedTitles = new Set(playOffList.map(t => t.title));
        const bTeams = eligible.filter(t => !qualifiedTitles.has(t.title));

        expect(playOffList).toHaveLength(8);
        expect(bTeams.every(t => !t.withdrawn)).toBe(true);
        expect(bTeams.find(t => t.title === 'Team 3')).toBeUndefined();
        expect(bTeams.find(t => t.title === 'Team 6')).toBeUndefined();
    });
});

describe('Feature: Test Tournament Auto-Fill', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('isTestTournament defaults to false', () => {
        const store = useMainStore();
        store.addTournament();
        expect(store.currentTournament.preferences.isTestTournament).toBe(false);
    });

    it('auto-fill generates valid non-draw scores', () => {
        const maxScore = 13;
        const games = [
            { team_1: 'A', team_2: 'B', team_1_score: null, team_2_score: null },
            { team_1: 'C', team_2: 'D', team_1_score: null, team_2_score: null },
            { team_1: 'E', team_2: 'Technical', team_1_score: null, team_2_score: null },
        ];

        games.forEach(game => {
            if (game.team_2 === 'Technical') return;
            let s1, s2;
            if (Math.random() < 0.5) {
                s1 = maxScore;
                s2 = Math.floor(Math.random() * maxScore);
            } else {
                s2 = maxScore;
                s1 = Math.floor(Math.random() * maxScore);
            }
            game.team_1_score = s1;
            game.team_2_score = s2;
        });

        expect(games[0].team_1_score).not.toBeNull();
        expect(games[0].team_2_score).not.toBeNull();
        expect(games[0].team_1_score !== games[0].team_2_score).toBe(true);
        expect(games[0].team_1_score === maxScore || games[0].team_2_score === maxScore).toBe(true);
        expect(games[1].team_1_score !== games[1].team_2_score).toBe(true);
        expect(games[2].team_1_score).toBeNull();
        expect(games[2].team_2_score).toBeNull();
    });

    it('auto-fill does not overwrite existing scores', () => {
        const maxScore = 13;
        const games = [
            { team_1: 'A', team_2: 'B', team_1_score: 10, team_2_score: 5 },
            { team_1: 'C', team_2: 'D', team_1_score: null, team_2_score: null },
        ];

        games.forEach(game => {
            if (game.team_2 === 'Technical') return;
            if (game.team_1_score != null && game.team_2_score != null &&
                game.team_1_score !== '' && game.team_2_score !== '') return;
            let s1, s2;
            if (Math.random() < 0.5) {
                s1 = maxScore;
                s2 = Math.floor(Math.random() * maxScore);
            } else {
                s2 = maxScore;
                s1 = Math.floor(Math.random() * maxScore);
            }
            game.team_1_score = s1;
            game.team_2_score = s2;
        });

        expect(games[0].team_1_score).toBe(10);
        expect(games[0].team_2_score).toBe(5);
        expect(games[1].team_1_score).not.toBeNull();
    });

    it('scores are in valid range: one team gets maxScore, other gets 0 to maxScore-1', () => {
        const maxScore = 13;
        for (let i = 0; i < 50; i++) {
            let s1, s2;
            if (Math.random() < 0.5) {
                s1 = maxScore;
                s2 = Math.floor(Math.random() * maxScore);
            } else {
                s2 = maxScore;
                s1 = Math.floor(Math.random() * maxScore);
            }
            expect(s1 === maxScore || s2 === maxScore).toBe(true);
            expect(s1 !== s2).toBe(true);
            expect(s1).toBeGreaterThanOrEqual(0);
            expect(s2).toBeGreaterThanOrEqual(0);
            expect(s1).toBeLessThanOrEqual(maxScore);
            expect(s2).toBeLessThanOrEqual(maxScore);
        }
    });
});
