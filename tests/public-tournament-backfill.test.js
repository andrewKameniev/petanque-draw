import { describe, expect, it } from 'vitest';
import {
  createPublicTournamentProjection,
  readPublicTournamentProjection,
} from '../src/services/public-tournament-projection.js';
import {
  canonicalMatchesPublicTournamentProjection,
  isDefaultEmptyPublicTournamentCandidate,
  planPublicTournamentBackfill,
  PUBLIC_TOURNAMENT_BACKFILL_ACTION,
  PUBLIC_TOURNAMENT_BACKFILL_STATUS,
  publicTournamentBackfillValuesEqual,
  runPublicTournamentBackfill,
} from '../src/services/public-tournament-backfill.js';
import { createTournamentRecord } from '../src/services/tournament-record.js';
import {
  createFirebasePublicTournamentBackfillRepository,
  parsePublicTournamentBackfillArgs,
  PublicTournamentBackfillCliError,
  resolvePublicTournamentBackfillOptions,
} from '../scripts/backfill-public-tournaments.mjs';

function record(overrides = {}) {
  return createTournamentRecord({
    name: 'Backfill Cup',
    id: 17,
    teams: [
      {
        title: 'Alpha',
        email: 'private@example.test',
        players: [{ name: 'Public Player', token: 'private-token' }],
      },
    ],
    games: [],
    collaborators: { secret: { email: 'private@example.test' } },
    ...overrides,
  });
}

function defaultEmptyRecord(overrides = {}) {
  return createTournamentRecord({
    name: 'Tournament A',
    id: 18,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function firebaseStoredValue(value, { arrayItem = false } = {}) {
  if (value == null) return arrayItem ? null : undefined;
  if (Array.isArray(value)) {
    if (!value.length) return arrayItem ? null : undefined;
    return value.map((item) => firebaseStoredValue(item, { arrayItem: true }));
  }
  if (typeof value !== 'object') return value;
  const entries = Object.entries(value)
    .map(([key, item]) => [key, firebaseStoredValue(item)])
    .filter(([, item]) => item !== undefined);
  if (!entries.length) return arrayItem ? null : undefined;
  return Object.fromEntries(entries);
}

function firebaseStoredProjection(value) {
  return firebaseStoredValue(value) ?? null;
}

function fakeRepository(initialOwners, hooks = {}) {
  const state = clone(initialOwners);
  const writes = [];
  return {
    state,
    writes,
    async listOwnerUids() {
      return Object.keys(state);
    },
    async listTournaments(ownerUid) {
      return clone(state[ownerUid]?.tournaments || {});
    },
    async listProjections(ownerUid) {
      return clone(state[ownerUid]?.projections || {});
    },
    async getCanonical({ ownerUid, tournamentId }) {
      if (hooks.getCanonical) return clone(await hooks.getCanonical({ ownerUid, tournamentId, state }));
      return clone(state[ownerUid]?.tournaments?.[tournamentId] ?? null);
    },
    async compareAndSetProjection(options) {
      writes.push(clone(options));
      if (hooks.beforeCompare) await hooks.beforeCompare({ ...options, state, writes });
      const owner = (state[options.ownerUid] ||= { tournaments: {}, projections: {} });
      const current = owner.projections[options.tournamentId] ?? null;
      if (!publicTournamentBackfillValuesEqual(current, options.expectedProjection ?? null)) {
        return { committed: false, projection: clone(current) };
      }
      if (options.nextProjection == null) delete owner.projections[options.tournamentId];
      else {
        owner.projections[options.tournamentId] = hooks.normalizeStoredProjection
          ? hooks.normalizeStoredProjection(clone(options.nextProjection))
          : clone(options.nextProjection);
      }
      return { committed: true, projection: clone(owner.projections[options.tournamentId] ?? null) };
    },
  };
}

describe('public tournament backfill planning', () => {
  it('reports an exact generated empty tournament as a placeholder candidate but still plans its projection', () => {
    const canonicalRecord = defaultEmptyRecord();
    const plan = planPublicTournamentBackfill({
      ownerUid: 'owner-1',
      tournamentId: '18',
      canonicalRecord,
      updatedAt: 123,
    });

    expect(isDefaultEmptyPublicTournamentCandidate(canonicalRecord)).toBe(true);
    expect(plan).toMatchObject({
      action: PUBLIC_TOURNAMENT_BACKFILL_ACTION.WRITE,
      status: PUBLIC_TOURNAMENT_BACKFILL_STATUS.MISSING,
    });
  });

  it('keeps configured, populated, TIR, and Group B records out of the placeholder diagnostic', () => {
    const withGroupB = defaultEmptyRecord();
    withGroupB.tournamentB = defaultEmptyRecord().main;

    expect(isDefaultEmptyPublicTournamentCandidate(defaultEmptyRecord({ name: 'Scheduled Cup' }))).toBe(false);
    expect(
      isDefaultEmptyPublicTournamentCandidate(defaultEmptyRecord({ preferences: { isTestTournament: true } })),
    ).toBe(false);
    expect(isDefaultEmptyPublicTournamentCandidate(defaultEmptyRecord({ teams: [{ title: 'Alpha' }] }))).toBe(false);
    expect(
      isDefaultEmptyPublicTournamentCandidate(
        defaultEmptyRecord({ system: 'tir', tirParticipants: [{ id: 1, name: 'Shooter' }] }),
      ),
    ).toBe(false);
    expect(isDefaultEmptyPublicTournamentCandidate(withGroupB)).toBe(false);
  });

  it('keeps a valid empty projection while recognizing its diagnostic shape separately', () => {
    const canonicalRecord = defaultEmptyRecord({ isPlayOff: false });
    const projection = createPublicTournamentProjection(canonicalRecord, { revision: 2, updatedAt: 2 });

    expect(isDefaultEmptyPublicTournamentCandidate(canonicalRecord)).toBe(true);
    expect(
      planPublicTournamentBackfill({
        ownerUid: 'owner-1',
        tournamentId: '18',
        canonicalRecord,
        currentProjection: projection,
      }),
    ).toEqual({ action: 'skip', status: 'valid' });
  });

  it('derives a complete V1 projection for a missing record without private values', () => {
    const plan = planPublicTournamentBackfill({
      ownerUid: 'owner-1',
      tournamentId: '17',
      canonicalRecord: record(),
      updatedAt: 123,
    });

    expect(plan.action).toBe(PUBLIC_TOURNAMENT_BACKFILL_ACTION.WRITE);
    expect(plan.status).toBe(PUBLIC_TOURNAMENT_BACKFILL_STATUS.MISSING);
    expect(plan.projection).toMatchObject({ schemaVersion: 1, complete: true, revision: 1, updatedAt: 123 });
    expect(plan.projection.record).not.toHaveProperty('collaborators');
    expect(plan.projection.record.main.teams[0]).not.toHaveProperty('email');
    expect(plan.projection.record.main.teams[0].players[0]).not.toHaveProperty('token');
    expect(readPublicTournamentProjection(plan.projection, { ownerUid: 'owner-1', tournamentId: '17' }).valid).toBe(
      true,
    );
  });

  it('skips valid and unsupported projections', () => {
    const canonicalRecord = record();
    const valid = createPublicTournamentProjection(canonicalRecord, { revision: 4, updatedAt: 100 });

    expect(
      planPublicTournamentBackfill({
        ownerUid: 'owner-1',
        tournamentId: '17',
        canonicalRecord,
        currentProjection: valid,
      }),
    ).toEqual({ action: 'skip', status: 'valid' });
    expect(
      planPublicTournamentBackfill({
        ownerUid: 'owner-1',
        tournamentId: '17',
        canonicalRecord,
        currentProjection: { ...valid, schemaVersion: 2 },
      }),
    ).toEqual({ action: 'skip', status: 'unsupported-version' });
  });

  it('repairs a valid but stale V1 projection with the next revision', () => {
    const canonicalRecord = record({ name: 'Current name' });
    const stale = createPublicTournamentProjection(record({ name: 'Old name' }), {
      revision: 4,
      updatedAt: 100,
    });

    expect(
      planPublicTournamentBackfill({
        ownerUid: 'owner-1',
        tournamentId: '17',
        canonicalRecord,
        currentProjection: stale,
        updatedAt: 200,
      }),
    ).toMatchObject({
      action: 'write',
      status: 'stale',
      projection: { revision: 5, updatedAt: 200, record: { name: 'Current name' } },
    });
  });

  it('repairs partial and malformed V1 nodes without reusing an invalid revision', () => {
    const canonicalRecord = record();
    const partial = createPublicTournamentProjection(canonicalRecord, { revision: 7, updatedAt: 100, complete: false });
    const partialPlan = planPublicTournamentBackfill({
      ownerUid: 'owner-1',
      tournamentId: '17',
      canonicalRecord,
      currentProjection: partial,
      updatedAt: 200,
    });
    const malformedPlan = planPublicTournamentBackfill({
      ownerUid: 'owner-1',
      tournamentId: '17',
      canonicalRecord,
      currentProjection: { ...partial, revision: 'bad' },
      updatedAt: 200,
    });

    expect(partialPlan).toMatchObject({ action: 'write', status: 'partial', projection: { revision: 8 } });
    expect(malformedPlan).toMatchObject({ action: 'write', status: 'partial', projection: { revision: 1 } });
  });

  it('reports invalid canonical data and never increments an exhausted revision', () => {
    expect(
      planPublicTournamentBackfill({
        ownerUid: 'owner-1',
        tournamentId: '17',
        canonicalRecord: null,
      }),
    ).toEqual({ action: 'skip', status: 'invalid-canonical' });
    expect(
      planPublicTournamentBackfill({
        ownerUid: 'owner-1',
        tournamentId: '17',
        canonicalRecord: record(),
        currentProjection: {
          ...createPublicTournamentProjection(record(), {
            revision: Number.MAX_SAFE_INTEGER,
            updatedAt: 100,
            complete: false,
          }),
        },
      }),
    ).toEqual({ action: 'skip', status: 'revision-exhausted' });
  });

  it('does not mutate the canonical record while comparing derived public data', () => {
    const canonicalRecord = record();
    const original = clone(canonicalRecord);
    const projection = createPublicTournamentProjection(canonicalRecord, { revision: 1, updatedAt: 1 });

    expect(canonicalMatchesPublicTournamentProjection(canonicalRecord, projection)).toBe(true);
    expect(canonicalRecord).toEqual(original);
    expect(canonicalMatchesPublicTournamentProjection({ ...canonicalRecord, name: 'Changed' }, projection)).toBe(false);
  });

  it('treats every Firebase-elided null and empty public field as the same record', () => {
    const canonicalRecord = record({
      preferences: { swissRoundsCount: null },
      groups: {},
      groupSchedule: [],
      roundTimer: null,
      playOffBracket: {},
      streamPresets: { teams: {}, lanes: {} },
      tirParticipants: [],
    });
    const projection = createPublicTournamentProjection(canonicalRecord, { revision: 1, updatedAt: 1 });
    const storedProjection = firebaseStoredProjection(projection);

    expect(storedProjection.record.main).not.toHaveProperty('games');
    expect(storedProjection.record.main.preferences).not.toHaveProperty('swissRoundsCount');
    expect(storedProjection.record.main).not.toHaveProperty('groups');
    expect(storedProjection.record.main).not.toHaveProperty('groupSchedule');
    expect(storedProjection.record.main).not.toHaveProperty('roundTimer');
    expect(storedProjection.record.main).not.toHaveProperty('playOffBracket');
    expect(storedProjection.record.main).not.toHaveProperty('streamPresets');
    expect(storedProjection.record.main).not.toHaveProperty('tirParticipants');
    expect(storedProjection.record).not.toHaveProperty('tournamentB');
    expect(
      canonicalMatchesPublicTournamentProjection(canonicalRecord, storedProjection, {
        ownerUid: 'owner-1',
        tournamentId: '17',
      }),
    ).toBe(true);
  });
});

describe('public tournament backfill execution', () => {
  it('counts default-empty candidates without excluding them from planned writes and bytes', async () => {
    const repository = fakeRepository({
      'owner-1': {
        tournaments: { blank: defaultEmptyRecord(), active: record() },
        projections: {},
      },
    });

    const result = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      clock: () => 500,
    });

    expect(result.summary).toMatchObject({
      tournamentsScanned: 2,
      defaultEmptyCandidates: 1,
      missing: 2,
      planned: 2,
      writesAttempted: 0,
    });
    expect(result.summary.projectionBytes).toBeGreaterThan(0);
    expect(result.items.find((item) => item.tournamentId === 'blank')).toMatchObject({
      status: 'missing',
      placeholderCandidate: true,
    });
  });

  it('keeps dry-run read-only and reports valid, missing, and orphan projections', async () => {
    const canonicalRecord = record();
    const repository = fakeRepository({
      'owner-1': {
        tournaments: { missing: canonicalRecord, valid: canonicalRecord },
        projections: {
          valid: createPublicTournamentProjection(canonicalRecord, { revision: 2, updatedAt: 2 }),
          orphan: createPublicTournamentProjection(canonicalRecord, { revision: 1, updatedAt: 1 }),
        },
      },
    });

    const result = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      clock: () => 500,
    });

    expect(result.summary).toMatchObject({
      mode: 'dry-run',
      ownersScanned: 1,
      tournamentsScanned: 2,
      missing: 1,
      valid: 1,
      planned: 1,
      orphanProjections: 1,
      writesAttempted: 0,
    });
    expect(repository.writes).toEqual([]);
  });

  it('applies only a missing projection and becomes a no-op when repeated', async () => {
    const repository = fakeRepository(
      {
        'owner-1': { tournaments: { 17: record() }, projections: {} },
      },
      { normalizeStoredProjection: firebaseStoredProjection },
    );

    const first = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      dryRun: false,
      clock: () => 500,
    });
    const second = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      dryRun: false,
      clock: () => 600,
    });

    expect(first.summary).toMatchObject({ applied: 1, writesAttempted: 1 });
    expect(second.summary).toMatchObject({ valid: 1, applied: 0, writesAttempted: 0 });
    expect(repository.writes).toHaveLength(1);
    expect(repository.state['owner-1'].tournaments['17']).toEqual(record());
  });

  it('does not overwrite a projection changed after the scan', async () => {
    const canonicalRecord = record();
    const concurrent = createPublicTournamentProjection(canonicalRecord, { revision: 9, updatedAt: 9 });
    let changed = false;
    const repository = fakeRepository(
      { 'owner-1': { tournaments: { 17: canonicalRecord }, projections: {} } },
      {
        beforeCompare({ state }) {
          if (changed) return;
          changed = true;
          state['owner-1'].projections['17'] = concurrent;
        },
      },
    );

    const result = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      dryRun: false,
      clock: () => 500,
    });

    expect(result.summary.concurrentChanges).toBe(1);
    expect(repository.state['owner-1'].projections['17']).toEqual(concurrent);
  });

  it('rolls back its projection when canonical public data changes during the write', async () => {
    const canonicalRecord = record();
    let canonicalReads = 0;
    const repository = fakeRepository(
      { 'owner-1': { tournaments: { 17: canonicalRecord }, projections: {} } },
      {
        normalizeStoredProjection: firebaseStoredProjection,
        getCanonical() {
          canonicalReads += 1;
          return { ...canonicalRecord, name: 'Changed during backfill' };
        },
      },
    );

    const result = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      dryRun: false,
      clock: () => 500,
    });

    expect(canonicalReads).toBe(1);
    expect(result.summary.rolledBack).toBe(1);
    expect(result.items[0]).toMatchObject({ status: 'rolled-back', reason: 'canonical-changed' });
    expect(repository.state['owner-1'].projections).toEqual({});
    expect(repository.writes).toHaveLength(2);
  });

  it('rolls back its projection when the canonical tournament is deleted during the write', async () => {
    const repository = fakeRepository(
      { 'owner-1': { tournaments: { 17: record() }, projections: {} } },
      { getCanonical: () => null },
    );

    const result = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      dryRun: false,
      clock: () => 500,
    });

    expect(result.summary.rolledBack).toBe(1);
    expect(result.items[0]).toMatchObject({ status: 'rolled-back', reason: 'canonical-deleted' });
    expect(repository.state['owner-1'].projections).toEqual({});
  });

  it('does not roll back over a writer that supersedes the backfill projection', async () => {
    const canonicalRecord = record();
    const writerProjection = createPublicTournamentProjection(
      { ...canonicalRecord, name: 'Changed by writer' },
      { revision: 2, updatedAt: 600 },
    );
    let compares = 0;
    const repository = fakeRepository(
      { 'owner-1': { tournaments: { 17: canonicalRecord }, projections: {} } },
      {
        getCanonical: () => ({ ...canonicalRecord, name: 'Changed during backfill' }),
        beforeCompare({ state }) {
          compares += 1;
          if (compares === 2) state['owner-1'].projections['17'] = writerProjection;
        },
      },
    );

    const result = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      dryRun: false,
      clock: () => 500,
    });

    expect(result.summary.superseded).toBe(1);
    expect(repository.state['owner-1'].projections['17']).toEqual(writerProjection);
  });

  it('waits for the batch and exposes partial results when verification and rollback fail', async () => {
    const canonicalRecord = record();
    const writerProjection = createPublicTournamentProjection(canonicalRecord, { revision: 2, updatedAt: 600 });
    let compares = 0;
    const repository = fakeRepository(
      {
        'owner-1': {
          tournaments: { one: canonicalRecord, two: record({ name: 'Two' }) },
          projections: {},
        },
      },
      {
        getCanonical({ tournamentId }) {
          if (tournamentId === 'one') throw new Error('temporary read failure');
          return record({ name: 'Two' });
        },
        beforeCompare({ tournamentId, state }) {
          if (tournamentId !== 'one') return;
          compares += 1;
          if (compares === 2) state['owner-1'].projections.one = writerProjection;
        },
      },
    );

    const run = runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      dryRun: false,
      batchSize: 2,
      clock: () => 500,
    });

    await expect(run).rejects.toMatchObject({
      code: 'VERIFY_FAILED_AFTER_WRITE',
      result: {
        summary: { failed: 1, applied: 1 },
        items: expect.arrayContaining([
          expect.objectContaining({ tournamentId: 'one', status: 'failed' }),
          expect.objectContaining({ tournamentId: 'two', status: 'applied' }),
        ]),
      },
    });
    expect(repository.state['owner-1'].projections.one).toEqual(writerProjection);
    expect(repository.state['owner-1'].projections.two).toMatchObject({ complete: true, schemaVersion: 1 });
  });

  it('keeps the projection when only private canonical data changes', async () => {
    const canonicalRecord = record();
    const repository = fakeRepository(
      { 'owner-1': { tournaments: { 17: canonicalRecord }, projections: {} } },
      {
        getCanonical() {
          return { ...canonicalRecord, collaborators: { another: { email: 'new-private@example.test' } } };
        },
      },
    );

    const result = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      dryRun: false,
      clock: () => 500,
    });

    expect(result.summary.applied).toBe(1);
    expect(repository.writes).toHaveLength(1);
  });

  it('caps canary writes and leaves remaining tournaments deferred', async () => {
    const repository = fakeRepository({
      'owner-1': { tournaments: { one: record(), two: record({ name: 'Two' }) }, projections: {} },
    });

    const result = await runPublicTournamentBackfill({
      repository,
      ownerUids: ['owner-1'],
      dryRun: false,
      maxWrites: 1,
      batchSize: 2,
      clock: () => 500,
    });

    expect(result.summary).toMatchObject({ planned: 2, writesAttempted: 1, applied: 1, deferredLimit: 1 });
  });
});

describe('public tournament backfill CLI safety', () => {
  it('rejects conflicting execution modes', () => {
    expect(() => parsePublicTournamentBackfillArgs(['--apply', '--dry-run'])).toThrowError(
      expect.objectContaining({ code: 'CONFLICTING_MODES' }),
    );
  });

  it('defaults to dry-run with an explicit owner scope', () => {
    const parsed = parsePublicTournamentBackfillArgs([
      '--project-id',
      'petanque-draw',
      '--database-url',
      'https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app',
      '--owner',
      'owner-1',
    ]);

    expect(resolvePublicTournamentBackfillOptions(parsed, {})).toMatchObject({
      projectId: 'petanque-draw',
      owners: ['owner-1'],
      dryRun: true,
    });
  });

  it('requires matching project and database confirmation plus a new report file for apply mode', () => {
    const base = [
      '--project-id',
      'petanque-draw',
      '--database-url',
      'https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app',
      '--all-owners',
      '--apply',
    ];

    expect(() => resolvePublicTournamentBackfillOptions(parsePublicTournamentBackfillArgs(base), {})).toThrowError(
      expect.objectContaining({ code: 'PROJECT_CONFIRMATION_REQUIRED' }),
    );
    expect(() =>
      resolvePublicTournamentBackfillOptions(
        parsePublicTournamentBackfillArgs([...base, '--confirm-project', 'petanque-draw']),
        {},
      ),
    ).toThrowError(expect.objectContaining({ code: 'REPORT_REQUIRED' }));
    expect(() =>
      resolvePublicTournamentBackfillOptions(
        parsePublicTournamentBackfillArgs([
          ...base,
          '--confirm-project',
          'petanque-draw',
          '--report',
          'new-report.json',
        ]),
        {},
      ),
    ).toThrowError(expect.objectContaining({ code: 'DATABASE_CONFIRMATION_REQUIRED' }));
    expect(
      resolvePublicTournamentBackfillOptions(
        parsePublicTournamentBackfillArgs([
          ...base,
          '--confirm-project',
          'petanque-draw',
          '--confirm-database-host',
          'petanque-draw-default-rtdb.europe-west1.firebasedatabase.app',
          '--report',
          'new-report.json',
        ]),
        {},
      ),
    ).toMatchObject({ dryRun: false, databaseHost: 'petanque-draw-default-rtdb.europe-west1.firebasedatabase.app' });
  });

  it('rejects a mismatched database hostname and invalid owner path', () => {
    expect(() =>
      resolvePublicTournamentBackfillOptions(
        parsePublicTournamentBackfillArgs([
          '--project-id',
          'petanque-draw',
          '--database-url',
          'https://another-project.firebaseio.com',
          '--owner',
          'owner-1',
        ]),
        {},
      ),
    ).toThrowError(expect.objectContaining({ code: 'PROJECT_DATABASE_MISMATCH' }));
    expect(() =>
      resolvePublicTournamentBackfillOptions(
        parsePublicTournamentBackfillArgs([
          '--project-id',
          'petanque-draw',
          '--database-url',
          'https://petanque-draw-other.firebaseio.com',
          '--owner',
          'owner-1',
        ]),
        {},
      ),
    ).toThrowError(expect.objectContaining({ code: 'PROJECT_DATABASE_MISMATCH' }));
    expect(() =>
      resolvePublicTournamentBackfillOptions(
        parsePublicTournamentBackfillArgs([
          '--project-id',
          'petanque-draw',
          '--database-url',
          'https://petanque-draw-default-rtdb.europe-west1.firebasedatabase.app',
          '--owner',
          'owner/bad',
        ]),
        {},
      ),
    ).toThrowError(PublicTournamentBackfillCliError);
  });

  it('discovers owners from indexes and transacts only on the projection path', async () => {
    const paths = [];
    const transactionPaths = [];
    const values = new Map([
      ['users', { 'user-a': { tournaments: { shared: { ownerUid: 'owner-1' } } } }],
      ['archive', { archived: { ownerUid: 'owner-2' } }],
      ['owner-1/tournaments', { one: record() }],
      ['publicTournaments/owner-1', {}],
      ['owner-1/tournaments/one', record()],
      ['publicTournaments/owner-1/one', null],
    ]);
    const snapshot = (value) => ({
      exists: () => value != null,
      val: () => clone(value),
      forEach(callback) {
        Object.entries(value || {}).forEach(([key, item]) => callback(snapshotWithKey(key, item)));
      },
      child(path) {
        const childValue = path.split('/').reduce((current, key) => current?.[key], value);
        return snapshot(childValue);
      },
    });
    const snapshotWithKey = (key, value) => ({ ...snapshot(value), key });
    const database = {
      ref(path) {
        paths.push(path);
        return {
          async get() {
            return snapshot(values.get(path));
          },
          async transaction(update) {
            transactionPaths.push(path);
            const next = update(clone(values.get(path)));
            if (next === undefined) {
              return { committed: false, snapshot: snapshot(values.get(path)) };
            }
            values.set(path, clone(next));
            return { committed: true, snapshot: snapshot(values.get(path)) };
          },
        };
      },
    };
    const repository = createFirebasePublicTournamentBackfillRepository(database);

    expect(await repository.listOwnerUids()).toEqual(['owner-1', 'owner-2', 'user-a']);
    await repository.listTournaments('owner-1');
    await repository.listProjections('owner-1');
    await repository.getCanonical({ ownerUid: 'owner-1', tournamentId: 'one' });
    expect(
      await repository.compareAndSetProjection({
        ownerUid: 'owner-1',
        tournamentId: 'one',
        expectedProjection: null,
        nextProjection: { schemaVersion: 1 },
      }),
    ).toEqual({ committed: true, projection: { schemaVersion: 1 } });

    expect(paths).toEqual([
      'users',
      'archive',
      'owner-1/tournaments',
      'publicTournaments/owner-1',
      'owner-1/tournaments/one',
      'publicTournaments/owner-1/one',
    ]);
    expect(transactionPaths).toEqual(['publicTournaments/owner-1/one']);
  });
});
