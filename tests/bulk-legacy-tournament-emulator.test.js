import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  applyBulkLegacyMigration,
  compareAndSwapTournament,
  planBulkLegacyMigration,
} from '../scripts/migrate-all-legacy-tournaments.mjs';
import { isTournamentEnvelope } from '../src/services/tournament-record.js';

const describeWithDatabaseEmulator = process.env.BULK_MIGRATION_EMULATOR_TEST === '1' ? describe : describe.skip;

describeWithDatabaseEmulator('bulk legacy migration against Realtime Database', () => {
  const emulatorHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  let app;
  let database;

  beforeAll(() => {
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(emulatorHost ?? '')) {
      throw new Error('Bulk migration tests require a local Realtime Database emulator');
    }

    app = initializeApp(
      {
        projectId: 'demo-petanque-draw-public-projection-rules',
        databaseURL: 'https://demo-petanque-draw-public-projection-rules-default-rtdb.firebaseio.com',
      },
      'bulk-legacy-migration-emulator-test',
    );
    database = getDatabase(app);
  });

  afterAll(async () => {
    if (app) await deleteApp(app);
  });

  it('moves a partial legacy Group B through a compare-and-swap and verifies the stored shape', async () => {
    await database.ref('bulk-owner/tournaments/old').set({
      name: 'Cup',
      system: 'groups',
      useRating: false,
      teams: [{ title: 'Alpha' }],
      preferences: { maxScore: 11 },
      groupB: { teams: [{ title: 'Beta' }] },
    });
    await database.ref('publicTournaments/bulk-owner/old').set({ complete: true, revision: 4 });

    const rootSnapshot = await database.ref('/').get();
    const plan = planBulkLegacyMigration(rootSnapshot.val(), rootSnapshot.exportVal());
    expect(plan.summary).toMatchObject({ ready: 1, blocked: 0 });
    const namespace = 'demo-petanque-draw-public-projection-rules-default-rtdb';
    const adapter = {
      async compareAndSwap(candidate) {
        return compareAndSwapTournament(candidate, {
          databaseUrl: `http://${emulatorHost}/`,
          accessToken: 'owner', // Built-in Database Emulator admin token.
          fetchImpl: (url, options) => fetch(`${url}${url.includes('?') ? '&' : '?'}ns=${namespace}`, options),
        });
      },
      async read(path) {
        return (await database.ref(path).get()).val();
      },
    };

    await applyBulkLegacyMigration(plan, adapter);

    const stored = (await database.ref('bulk-owner/tournaments/old').get()).val();
    expect(isTournamentEnvelope(stored)).toBe(true);
    expect(stored).not.toHaveProperty('groupB');
    expect(stored.tournamentB).toMatchObject({ teams: [{ title: 'Beta' }], preferences: { maxScore: 11 } });
    expect(planBulkLegacyMigration((await database.ref('/').get()).val()).summary.ready).toBe(0);
  });

  it('refuses an outdated ETag when another editor changes the record before the write', async () => {
    const path = 'bulk-owner/tournaments/conflict';
    await database.ref(path).set({ name: 'Before', system: 'swiss', teams: [{ title: 'Alpha' }] });
    const plan = planBulkLegacyMigration((await database.ref('/').get()).val());
    const candidate = plan.candidates.find((item) => item.path === path);
    const namespace = 'demo-petanque-draw-public-projection-rules-default-rtdb';

    const committed = await compareAndSwapTournament(candidate, {
      databaseUrl: `http://${emulatorHost}/`,
      accessToken: 'owner',
      fetchImpl: async (url, options) => {
        if (options.method === 'PUT') await database.ref(path).update({ name: 'Changed by editor' });
        return fetch(`${url}${url.includes('?') ? '&' : '?'}ns=${namespace}`, options);
      },
    });

    expect(committed).toBe(false);
    expect((await database.ref(path).get()).val()).toMatchObject({ name: 'Changed by editor', system: 'swiss' });
  });
});
