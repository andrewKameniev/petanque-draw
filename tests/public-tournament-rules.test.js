import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { get, ref, remove, set, update } from 'firebase/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const PROJECT_ID = 'demo-petanque-draw-public-projection-rules';
const DATABASE_HOST = '127.0.0.1';
const DATABASE_PORT = 9000;
const RULES = readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8');

let testEnvironment;

function projection(overrides = {}) {
  return {
    schemaVersion: 1,
    complete: true,
    revision: 7,
    updatedAt: 1_786_243_200_000,
    record: {
      name: 'Public Cup',
      date: '2026-08-09',
      tournamentMessage: 'Welcome',
      activeGroup: 'A',
      main: {
        system: 'swiss',
        teams: [{ title: 'Alpha' }, { title: 'Beta' }],
        games: [[{ team_1: 'Alpha', team_2: 'Beta' }]],
        preferences: { maxScore: 13, colorSchema: 'autumn' },
      },
    },
    ...overrides,
  };
}

function databaseFor(uid, token = {}) {
  return uid
    ? testEnvironment.authenticatedContext(uid, token).database()
    : testEnvironment.unauthenticatedContext().database();
}

function writeProjection(database, ownerUid, tournamentId, value) {
  const basePath = `publicTournaments/${ownerUid}/${tournamentId}`;
  const updates = Object.fromEntries(Object.entries(value).map(([key, child]) => [`${basePath}/${key}`, child]));

  return update(ref(database), updates);
}

async function seed(path, value) {
  await testEnvironment.withSecurityRulesDisabled((context) => set(ref(context.database(), path), value));
}

const describeWithDatabaseEmulator = process.env.FIREBASE_DATABASE_EMULATOR_HOST ? describe : describe.skip;

describeWithDatabaseEmulator('public tournament projection rules', () => {
  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      database: {
        host: DATABASE_HOST,
        port: DATABASE_PORT,
        rules: RULES,
      },
    });
  });

  afterEach(async () => {
    await testEnvironment.clearDatabase();
  });

  afterAll(async () => {
    await testEnvironment?.cleanup();
  });

  it('allows anonymous reads of a complete public projection', async () => {
    await seed('publicTournaments/owner-1/tournament-1', projection());

    const snapshot = await assertSucceeds(get(ref(databaseFor(null), 'publicTournaments/owner-1/tournament-1')));

    expect(snapshot.val()).toMatchObject({
      schemaVersion: 1,
      complete: true,
      record: { name: 'Public Cup', activeGroup: 'A' },
    });
  });

  it('denies anonymous projection writes', async () => {
    await assertFails(writeProjection(databaseFor(null), 'owner-1', 'tournament-1', projection()));
  });

  it('allows complete projection writes by the owner and an admin collaborator', async () => {
    await seed('owner-1/tournaments/collaborated/collaborators/admin-1', { role: 'admin' });

    await assertSucceeds(writeProjection(databaseFor('owner-1'), 'owner-1', 'owned', projection()));
    await assertSucceeds(
      writeProjection(databaseFor('admin-1'), 'owner-1', 'collaborated', projection({ revision: 8 })),
    );
  });

  it('limits scorer collaborators to the mirrored scoring fields', async () => {
    await seed('owner-1/tournaments/collaborated/collaborators/scorer-1', { role: 'scorer' });
    await seed('publicTournaments/owner-1/collaborated', projection());

    await assertSucceeds(
      update(ref(databaseFor('scorer-1')), {
        'publicTournaments/owner-1/collaborated/schemaVersion': 1,
        'publicTournaments/owner-1/collaborated/revision': 8,
        'publicTournaments/owner-1/collaborated/updatedAt': 1_786_243_260_000,
        'publicTournaments/owner-1/collaborated/record/main/games': [[{ score_1: 13, score_2: 7 }]],
      }),
    );
    await assertFails(
      update(ref(databaseFor('scorer-1')), {
        'publicTournaments/owner-1/collaborated/revision': 9,
        'publicTournaments/owner-1/collaborated/updatedAt': 1_786_243_320_000,
        'publicTournaments/owner-1/collaborated/record/name': 'Spoofed Cup',
      }),
    );
    await assertFails(writeProjection(databaseFor('scorer-1'), 'owner-1', 'collaborated', projection({ revision: 9 })));
  });

  it('allows projection deletion by the owner and archive superadmin only', async () => {
    await seed('publicTournaments/owner-1/owned', projection());
    await seed('publicTournaments/owner-1/archived', projection());
    await seed('publicTournaments/owner-1/blocked', projection());

    await assertSucceeds(remove(ref(databaseFor('owner-1'), 'publicTournaments/owner-1/owned')));
    await assertSucceeds(
      remove(
        ref(databaseFor('archive-admin', { email: 'nemo15.alex@gmail.com' }), 'publicTournaments/owner-1/archived'),
      ),
    );
    await assertFails(remove(ref(databaseFor('stranger-1'), 'publicTournaments/owner-1/blocked')));
  });

  it('requires an atomic switch to Group A when a complete projection removes Group B', async () => {
    const groupBProjection = projection({
      record: {
        ...projection().record,
        activeGroup: 'B',
        tournamentB: {
          system: 'playoff',
          teams: [{ title: 'B Alpha' }],
          games: [],
          preferences: { maxScore: 13 },
        },
      },
    });
    await seed('publicTournaments/owner-1/atomic-removal', groupBProjection);
    await seed('publicTournaments/owner-1/non-atomic-removal', groupBProjection);

    await assertSucceeds(
      update(ref(databaseFor('owner-1')), {
        'publicTournaments/owner-1/atomic-removal/revision': 8,
        'publicTournaments/owner-1/atomic-removal/updatedAt': 1_786_243_260_000,
        'publicTournaments/owner-1/atomic-removal/record/activeGroup': 'A',
        'publicTournaments/owner-1/atomic-removal/record/tournamentB': null,
      }),
    );
    await assertFails(
      update(ref(databaseFor('owner-1')), {
        'publicTournaments/owner-1/non-atomic-removal/revision': 8,
        'publicTournaments/owner-1/non-atomic-removal/updatedAt': 1_786_243_260_000,
        'publicTournaments/owner-1/non-atomic-removal/record/tournamentB': null,
      }),
    );
  });

  it('denies projection writes by an unrelated authenticated user', async () => {
    await assertFails(writeProjection(databaseFor('stranger-1'), 'owner-1', 'tournament-1', projection()));
  });

  it('allows incomplete staging nodes only when they do not claim completeness', async () => {
    const stagingRecord = { name: 'Staging Cup' };

    await assertSucceeds(
      writeProjection(
        databaseFor('owner-1'),
        'owner-1',
        'staging-false',
        projection({ complete: false, record: stagingRecord }),
      ),
    );
    const withoutComplete = projection({ record: stagingRecord });
    delete withoutComplete.complete;
    await assertSucceeds(writeProjection(databaseFor('owner-1'), 'owner-1', 'staging-omitted', withoutComplete));
    await assertFails(
      writeProjection(
        databaseFor('owner-1'),
        'owner-1',
        'incomplete-claimed',
        projection({ complete: true, record: stagingRecord }),
      ),
    );
  });

  it.each([
    ['unsupported schema version', { schemaVersion: 2 }],
    ['non-numeric revision', { revision: '7' }],
    ['zero revision', { revision: 0 }],
    ['fractional revision', { revision: 7.5 }],
    ['negative revision', { revision: -1 }],
    ['non-numeric update time', { updatedAt: 'now' }],
    ['negative update time', { updatedAt: -1 }],
    ['non-boolean completeness', { complete: 'yes' }],
  ])('rejects invalid projection metadata: %s', async (_label, overrides) => {
    await assertFails(
      writeProjection(
        databaseFor('owner-1'),
        'owner-1',
        `invalid-${String(overrides.revision ?? overrides.updatedAt ?? overrides.schemaVersion ?? overrides.complete).replaceAll('.', '-')}`,
        projection(overrides),
      ),
    );
  });

  it.each([
    ['collaborators', { private: true }],
    ['owner', { email: 'private@example.test' }],
    ['ownerUid', 'private-owner'],
    ['portalIdTournament', 'private-portal-id'],
    ['gamesCopy', [[{ private: true }]]],
  ])('rejects the private record field %s', async (field, value) => {
    await assertFails(
      writeProjection(
        databaseFor('owner-1'),
        'owner-1',
        `private-${field}`,
        projection({ record: { ...projection().record, [field]: value } }),
      ),
    );
  });

  it.each(['main', 'tournamentB'])('rejects gamesCopy inside the %s competition node', async (groupField) => {
    const record = projection().record;
    record[groupField] = {
      ...(record[groupField] || { system: 'swiss' }),
      gamesCopy: [[{ private: true }]],
    };
    if (groupField === 'tournamentB') record.activeGroup = 'B';

    await assertFails(
      writeProjection(databaseFor('owner-1'), 'owner-1', `private-${groupField}`, projection({ record })),
    );
  });

  it.each([
    ['unknown competition data', { debugPayload: { internal: true } }],
    ['non-string system', { system: 42 }],
    [
      'unused tiebreaker editor state',
      { tirTiebreakerActive: true, tirTiebreakerParticipantIds: ['private-participant'] },
    ],
    ['editor-only preferences', { preferences: { maxScore: 13, isTestTournament: true } }],
    ['team email', { teams: [{ title: 'Private', email: 'private@example.test' }] }],
    ['player email', { teams: [{ title: 'Private', players: [{ name: 'Player', email: 'private@example.test' }] }] }],
    ['portal replacement metadata', { teams: [{ title: 'Private', portalTeamId: 91 }] }],
    ['game token', { games: [[{ team_1: 'Private', token: 'private-token' }]] }],
    ['nested playoff password', { playOffBracket: { stages: [{ teams: [{ password: 'private-password' }] }] } }],
  ])('rejects %s inside a competition node', async (_label, privateCompetitionData) => {
    const record = projection().record;
    record.main = { ...record.main, ...privateCompetitionData };

    await assertFails(
      writeProjection(
        databaseFor('owner-1'),
        'owner-1',
        `private-competition-${_label.replaceAll(' ', '-')}`,
        projection({ record }),
      ),
    );
  });

  it('accepts URL-only stream presets and rejects malformed granular entries', async () => {
    const record = projection().record;
    record.main = {
      ...record.main,
      streamPresets: {
        teams: { Alpha: ['https://stream.example/alpha'] },
        lanes: { 1: ['https://stream.example/lane-1'] },
      },
    };
    await assertSucceeds(writeProjection(databaseFor('owner-1'), 'owner-1', 'stream-presets', projection({ record })));

    const streamBase = 'publicTournaments/owner-1/stream-presets/record/main/streamPresets/teams/Alpha';
    await assertSucceeds(set(ref(databaseFor('owner-1'), `${streamBase}/1`), 'https://stream.example/alpha-2'));
    await assertFails(set(ref(databaseFor('owner-1'), `${streamBase}/3`), 'https://stream.example/sparse'));
    await assertFails(set(ref(databaseFor('owner-1'), `${streamBase}/999`), 'https://stream.example/sparse'));
    await assertFails(set(ref(databaseFor('owner-1'), `${streamBase}/token`), 'private-token'));
    await assertFails(set(ref(databaseFor('owner-1'), `${streamBase}/0`), { token: 'private-token' }));
  });

  it('rejects public values deeper than the bounded V1 contract', async () => {
    let nested = { score: 13 };
    for (let depth = 0; depth < 13; depth += 1) nested = { value: nested };
    const record = projection().record;
    record.main = { ...record.main, games: [[{ payload: nested }]] };

    await assertFails(writeProjection(databaseFor('owner-1'), 'owner-1', 'too-deep', projection({ record })));
  });

  it('rejects unknown top-level projection keys', async () => {
    await assertFails(
      writeProjection(
        databaseFor('owner-1'),
        'owner-1',
        'unknown-key',
        projection({ debugPayload: { private: true } }),
      ),
    );
  });

  it('keeps anonymous canonical tournament reads enabled during compatibility rollout', async () => {
    await seed('owner-1/tournaments/legacy-tournament', {
      name: 'Legacy Canonical Cup',
      collaborators: { collaborator: { email: 'private@example.test' } },
      system: 'swiss',
    });

    const snapshot = await assertSucceeds(get(ref(databaseFor(null), 'owner-1/tournaments/legacy-tournament')));

    expect(snapshot.val().name).toBe('Legacy Canonical Cup');
  });
});
