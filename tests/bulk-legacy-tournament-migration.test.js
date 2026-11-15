import { describe, expect, it, vi } from 'vitest';
import {
  applyBulkLegacyMigration,
  assertApplyPlan,
  compactFirebaseValue,
  parseBulkMigrationArgs,
  planBulkLegacyMigration,
} from '../scripts/migrate-all-legacy-tournaments.mjs';

const legacy = {
  name: 'Legacy Cup',
  system: 'groups',
  useRating: false,
  teams: [{ title: 'Alpha' }],
  preferences: { maxScore: 11 },
  groupB: { teams: [{ title: 'Beta' }] },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function databaseFixture() {
  return {
    owner: {
      tournaments: {
        old: clone(legacy),
        new: { name: 'New Cup', main: { system: 'swiss' } },
        fragment: { games: [[{ team_1_score: 13 }]] },
      },
    },
    publicTournaments: { owner: { old: { complete: true, revision: 3 } } },
  };
}

describe('bulk legacy tournament migration', () => {
  it('plans a shape-preserving migration and lists fragments separately', () => {
    const source = databaseFixture();
    const original = clone(source);
    const plan = planBulkLegacyMigration(source);

    expect(plan.summary).toMatchObject({ total: 3, newFormat: 1, ready: 1, partial: 1, blocked: 0 });
    expect(plan.summary.planSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(plan.candidates[0].expected).toMatchObject({
      name: 'Legacy Cup',
      main: { system: 'groups', teams: [{ title: 'Alpha' }] },
      tournamentB: { system: 'groups', teams: [{ title: 'Beta' }], preferences: { maxScore: 11 } },
    });
    expect(plan.partial[0]).toMatchObject({ path: 'owner/tournaments/fragment', fields: ['games'] });
    expect(source).toEqual(original);
  });

  it('blocks records whose competing Group B data or priorities cannot be migrated safely', () => {
    const source = databaseFixture();
    source.owner.tournaments.old.tournamentB = { system: 'swiss', games: [[{ status: 'finished' }]] };
    expect(planBulkLegacyMigration(source).blocked[0].reason).toBe('MIGRATION_CONFLICTING_GROUP_B');

    delete source.owner.tournaments.old.tournamentB;
    const exported = clone(source);
    exported.owner.tournaments.old.games = { '.priority': 1, 0: { status: 'finished' } };
    expect(planBulkLegacyMigration(source, exported).blocked[0].reason).toBe('MIGRATION_PRIORITY_PRESENT');
  });

  it('keeps plan hashes independent of JSON field order and sensitive to record changes', () => {
    const source = databaseFixture();
    const reordered = clone(source);
    reordered.owner.tournaments.old = Object.fromEntries(Object.entries(reordered.owner.tournaments.old).reverse());
    const firstHash = planBulkLegacyMigration(source).summary.planSha256;
    expect(planBulkLegacyMigration(reordered).summary.planSha256).toBe(firstHash);
    reordered.owner.tournaments.old.preferences.maxScore = 9;
    expect(planBulkLegacyMigration(reordered).summary.planSha256).not.toBe(firstHash);
  });

  it('requires exact live apply confirmations and a matching database URL', () => {
    const base = [
      '--project-id',
      'petanque-draw',
      '--database-url',
      'https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app',
      '--snapshot-dir',
      '/private/tmp/backup',
    ];
    expect(parseBulkMigrationArgs(base).apply).toBeUndefined();
    expect(() => parseBulkMigrationArgs([...base, '--apply'])).toThrow('APPLY_CONFIRMATION_REQUIRED');
    expect(() => parseBulkMigrationArgs([...base, '--database-url', 'https://wrong.firebaseio.com/'])).toThrow(
      'PROJECT_DATABASE_MISMATCH',
    );
    expect(() =>
      parseBulkMigrationArgs([
        '--dump',
        '/private/tmp/backup.json.gz',
        '--snapshot-dir',
        '/private/tmp/backup',
        '--apply',
      ]),
    ).toThrow('DUMP_IS_READ_ONLY');
    expect(
      parseBulkMigrationArgs([
        ...base,
        '--apply',
        '--confirm-project',
        'petanque-draw',
        '--confirm-plan',
        'a'.repeat(64),
        '--confirm-editors-paused',
        '--confirm-compatible-code-and-rules-deployed',
      ]).apply,
    ).toBe(true);
    vi.stubEnv('FIREBASE_DATABASE_EMULATOR_HOST', '127.0.0.1:19000');
    expect(() => parseBulkMigrationArgs(base)).toThrow('EMULATOR_HOST_SET');
    vi.unstubAllEnvs();
  });

  it('requires a fresh plan hash and explicit review of partial records and active rounds', () => {
    const plan = planBulkLegacyMigration(databaseFixture());
    plan.summary.activeRounds = 1;
    expect(() => assertApplyPlan({ confirmPlan: 'old' }, plan)).toThrow('PLAN_CHANGED');
    const options = { confirmPlan: plan.summary.planSha256 };
    expect(() => assertApplyPlan(options, plan)).toThrow('PARTIAL_RECORDS_REQUIRE_REVIEW');
    options.confirmPartialsSkipped = true;
    expect(() => assertApplyPlan(options, plan)).toThrow('ACTIVE_ROUNDS_REQUIRE_CONFIRMATION');
    options.confirmActiveRoundsPaused = true;
    expect(() => assertApplyPlan(options, plan)).not.toThrow();
    plan.blocked.push({ path: 'owner/tournaments/broken', reason: 'INVALID' });
    expect(() => assertApplyPlan(options, plan)).toThrow('BLOCKED_RECORDS_REQUIRE_REVIEW');
  });

  it('verifies a compare-and-swap and the unchanged public projection after each write', async () => {
    const plan = planBulkLegacyMigration(databaseFixture());
    const candidate = plan.candidates[0];
    const adapter = {
      compareAndSwap: vi.fn().mockResolvedValue(true),
      read: vi.fn(async (path) => (path === candidate.path ? clone(candidate.expected) : clone(candidate.projection))),
    };
    const onVerified = vi.fn();

    await applyBulkLegacyMigration(plan, adapter, onVerified);

    expect(adapter.compareAndSwap).toHaveBeenCalledWith(candidate);
    expect(onVerified).toHaveBeenCalledWith(candidate);
    expect(adapter.read).toHaveBeenCalledWith('publicTournaments/owner/old');
  });

  it('stops on a changed canonical record or failed post-write verification', async () => {
    const plan = planBulkLegacyMigration(databaseFixture());
    const read = vi.fn();
    await expect(
      applyBulkLegacyMigration(plan, { compareAndSwap: vi.fn().mockResolvedValue(false), read }),
    ).rejects.toThrow('CANONICAL_CHANGED');
    expect(read).not.toHaveBeenCalled();

    const candidate = plan.candidates[0];
    await expect(
      applyBulkLegacyMigration(plan, {
        compareAndSwap: vi.fn().mockResolvedValue(true),
        read: vi.fn(async (path) => (path === candidate.path ? { main: {} } : candidate.projection)),
      }),
    ).rejects.toThrow('POST_WRITE_MISMATCH');
  });

  it('models Firebase omission of empty children for exact verification', () => {
    expect(
      compactFirebaseValue({ name: 'Cup', main: { games: [], teams: [], preferences: {} }, tournamentB: null }),
    ).toEqual({
      name: 'Cup',
    });
  });
});
