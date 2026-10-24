import { describe, expect, it } from 'vitest';
import { parseMigrationArgs, planLegacyTournamentMigration } from '../scripts/migrate-legacy-tournament.mjs';
import { createPublicTournamentProjection } from '../src/services/public-tournament-projection.js';
import { migrateLegacyTournamentRecord } from '../src/services/tournament-record.js';

const legacy = {
  id: 'cup-1',
  name: 'Cup',
  activeGroup: 'B',
  collaborators: { scorer: { role: 'scorer' } },
  system: 'swiss',
  teams: [
    { title: 'A1', wins: 1 },
    { title: 'A2', wins: 0 },
  ],
  games: [[{ team_1: 'A1', team_2: 'A2', team_1_score: 13, team_2_score: 5, status: 'finished' }]],
  playOffBracket: { stages: [{ teams: [{ team_1: 'A1', team_2: 'A2' }] }] },
  preferences: { playOffEnabled: true },
  groupB: {
    system: 'swiss',
    useRating: false,
    preferences: { playOffEnabled: false },
    teams: [
      { title: 'B1', wins: 1 },
      { title: 'B2', wins: 0 },
    ],
    games: [
      [{ team_1: 'B1', team_2: 'B2', team_1_score: 13, team_2_score: 3, status: 'finished' }],
      [{ team_1: 'B1', team_2: 'B2', status: 'not_started' }],
    ],
    roundIsActive: true,
  },
  tournamentB: { system: 'swiss', teams: [{ title: 'Stale B' }], roundIsActive: false },
};

describe('legacy tournament migration', () => {
  it('preserves all main and live B data and leaves the public projection unchanged', () => {
    const source = JSON.parse(JSON.stringify(legacy));
    const projection = createPublicTournamentProjection(source, { revision: 8, updatedAt: 1234 });
    expect(
      createPublicTournamentProjection(migrateLegacyTournamentRecord(source), { revision: 8, updatedAt: 1234 }),
    ).toEqual(projection);
    const plan = planLegacyTournamentMigration(source, projection);

    expect(plan.migrated.main).toEqual({
      system: source.system,
      teams: source.teams,
      games: source.games,
      playOffBracket: source.playOffBracket,
      preferences: source.preferences,
    });
    expect(plan.migrated.tournamentB).toEqual(source.groupB);
    expect(plan.migrated).not.toHaveProperty('groupB');
    expect(plan.migrated).not.toHaveProperty('games');
    expect(plan.summary).toMatchObject({
      discardedStaleTournamentB: true,
      projectionUnchanged: true,
      main: { teams: 2, rounds: [{ games: 1, finished: 1 }] },
      groupB: {
        teams: 2,
        rounds: [
          { games: 1, finished: 1 },
          { games: 1, finished: 0 },
        ],
      },
    });
    expect(source).toEqual(legacy);
  });

  it('stops when the public projection is stale', () => {
    const projection = createPublicTournamentProjection(legacy);
    projection.record.tournamentB.games[0][0].team_1_score = 7;
    expect(() => planLegacyTournamentMigration(legacy, projection)).toThrow('PUBLIC_PROJECTION_WOULD_CHANGE');
  });

  it('requires exact apply confirmations', () => {
    const args = [
      '--project-id',
      'petanque-draw',
      '--database-url',
      'https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app',
      '--owner',
      'owner-1',
      '--tournament-id',
      'cup-1',
      '--snapshot-dir',
      'output/migration-snapshots',
    ];
    expect(parseMigrationArgs(args).apply).toBe(false);
    expect(() => parseMigrationArgs([...args, '--apply'])).toThrow('APPLY_CONFIRMATION_REQUIRED');
    expect(
      parseMigrationArgs([
        ...args,
        '--apply',
        '--confirm-project',
        'petanque-draw',
        '--confirm-owner',
        'owner-1',
        '--confirm-tournament',
        'cup-1',
        '--confirm-editors-paused',
      ]).apply,
    ).toBe(true);
  });
});
