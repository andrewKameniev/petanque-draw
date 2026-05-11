import {test, expect} from '@playwright/test';
import {
    ensureCleanTournament, addTeams, selectSystem, setTeamsInGroup,
    drawFirstRound, playRound, playMultipleRounds,
    clickFinishTournament, deleteCurrentTournament,
} from './helpers';

test.describe('Groups (Round-Robin) System', () => {
    test.beforeEach(async ({page}) => {
        await ensureCleanTournament(page);
    });

    test('8 teams — 2 groups of 4, full round-robin (3 rounds)', async ({page}) => {
        await addTeams(page, 8);
        await selectSystem(page, 'groups');
        await setTeamsInGroup(page, 4);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        await clickFinishTournament(page);
        await deleteCurrentTournament(page);
    });

    test('9 teams (odd) — 3 groups of 3, full round-robin with bye', async ({page}) => {
        await addTeams(page, 9);
        await selectSystem(page, 'groups');
        await setTeamsInGroup(page, 3);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        await clickFinishTournament(page);
        await deleteCurrentTournament(page);
    });

    test('16 teams — 4 groups of 4, full round-robin (3 rounds)', async ({page}) => {
        await addTeams(page, 16);
        await selectSystem(page, 'groups');
        await setTeamsInGroup(page, 4);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 2);
        await clickFinishTournament(page);
        await deleteCurrentTournament(page);
    });

    test('12 teams — 2 groups of 6, full round-robin (5 rounds)', async ({page}) => {
        await addTeams(page, 12);
        await selectSystem(page, 'groups');
        await setTeamsInGroup(page, 6);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 4);
        await clickFinishTournament(page);
        await deleteCurrentTournament(page);
    });

    test('7 teams (odd) — 1 group of 7, full round-robin with bye (7 rounds)', async ({page}) => {
        await addTeams(page, 7);
        await selectSystem(page, 'groups');
        await setTeamsInGroup(page, 7);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 6);
        await clickFinishTournament(page);
        await deleteCurrentTournament(page);
    });

    test('5 teams (odd) — 1 group of 5, full round-robin with bye (5 rounds)', async ({page}) => {
        await addTeams(page, 5);
        await selectSystem(page, 'groups');
        await setTeamsInGroup(page, 5);
        await drawFirstRound(page);
        await playRound(page);
        await playMultipleRounds(page, 4);
        await clickFinishTournament(page);
        await deleteCurrentTournament(page);
    });
});
