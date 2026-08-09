import { describe, expect, it, vi } from 'vitest';
import {
  PUBLIC_TOURNAMENT_COMPETITION_FIELDS,
  PUBLIC_TOURNAMENT_PREFERENCE_FIELDS,
  PUBLIC_TOURNAMENT_PROJECTION_ERROR,
  PUBLIC_TOURNAMENT_PROJECTION_VERSION,
  createPublicTournamentProjection,
  createPublicTournamentWriter,
  planPublicTournamentFullWrite,
  planPublicTournamentPathWrite,
  readPublicTournamentProjection,
} from '@/services/public-tournament-projection';

const privateSentinels = {
  collaborators: { scorer: { email: 'scorer@example.com', role: 'scorer' } },
  owner: { email: 'owner@example.com' },
  ownerUid: 'owner-private',
  portalIdTournament: 'private-portal-id',
  portalTeam: { id: 91, players: [{ email: 'portal@example.com' }] },
  portalTeamId: 91,
  gamesCopy: [[{ private: 'backup result' }]],
  editorMetadata: { internal: true },
};

function competition(overrides = {}) {
  return {
    system: 'swiss',
    teams: [
      {
        title: 'Alpha',
        wins: 1,
        players: [{ id: 7, name: 'Ada', surname: 'A', club: 'Club', email: 'player@example.com' }],
        email: 'team@example.com',
        portalTeam: { id: 91, players: [{ email: 'portal@example.com' }] },
        portalTeamId: 91,
      },
    ],
    games: [[{ team_1: 'Alpha', team_2: 'Beta', team_1_score: 13, team_2_score: 8 }]],
    tirTiebreakerActive: true,
    tirTiebreakerParticipantIds: [7],
    preferences: {
      maxScore: 13,
      fieldsStart: 3,
      playOffEnabled: true,
      playOffTeams: 8,
      groupFormat: 'swiss',
      groupTotalRounds: 4,
      swissRoundsCount: 5,
      prizePlaces: 3,
      timeLimitEnabled: true,
      timeLimit: 45,
      playoffTimeLimit: 70,
      noTimeLimitFinale: true,
      cochonettesEnabled: true,
      cochonettesEnabledPlayoff: true,
      cochonettes: 2,
      colorSchema: 'autumn',
      isTestTournament: true,
      playB: true,
      collaboratorEmail: 'nested@example.com',
    },
    streamPresets: {
      teams: { Alpha: ['https://stream.example/alpha'], Owner: ['https://stream.example/owner'] },
      lanes: { 1: ['https://stream.example/lane-1'] },
      debug: { internal: true },
      ownerEmail: 'hidden@example.com',
    },
    ...privateSentinels,
    ...overrides,
  };
}

function envelopeRecord() {
  return {
    id: 'canonical-id',
    name: 'Projection Cup',
    date: '2026-08-09',
    tournamentMessage: 'Welcome',
    activeGroup: 'B',
    main: competition(),
    tournamentB: competition({
      system: 'tir',
      teams: [],
      games: [],
      tirParticipants: [{ id: 11, name: 'Shooter', city: 'Kyiv', email: 'tir@example.com' }],
    }),
    ...privateSentinels,
  };
}

describe('public tournament projection V1', () => {
  it('derives an immutable, exact public envelope without private or editor-only fields', () => {
    const source = envelopeRecord();
    const snapshot = JSON.parse(JSON.stringify(source));

    const projection = createPublicTournamentProjection(source, { revision: 9, updatedAt: 1234 });

    expect(projection).toMatchObject({
      schemaVersion: PUBLIC_TOURNAMENT_PROJECTION_VERSION,
      complete: true,
      revision: 9,
      updatedAt: 1234,
      record: {
        name: 'Projection Cup',
        date: '2026-08-09',
        tournamentMessage: 'Welcome',
        activeGroup: 'B',
      },
    });
    expect(Object.keys(projection.record).sort()).toEqual(
      ['activeGroup', 'date', 'main', 'name', 'tournamentB', 'tournamentMessage'].sort(),
    );
    expect(
      Object.keys(projection.record.main).every((field) => PUBLIC_TOURNAMENT_COMPETITION_FIELDS.includes(field)),
    ).toBe(true);
    expect(Object.keys(projection.record.main.preferences).sort()).toEqual(
      PUBLIC_TOURNAMENT_PREFERENCE_FIELDS.slice().sort(),
    );
    expect(projection.record.main.preferences).not.toHaveProperty('isTestTournament');
    expect(projection.record.main.preferences).not.toHaveProperty('playB');
    expect(projection.record.main).not.toHaveProperty('gamesCopy');
    expect(projection.record.main).not.toHaveProperty('tirTiebreakerActive');
    expect(projection.record.main).not.toHaveProperty('tirTiebreakerParticipantIds');
    expect(projection.record.main.teams[0]).not.toHaveProperty('email');
    expect(projection.record.main.teams[0]).not.toHaveProperty('portalTeam');
    expect(projection.record.main.teams[0]).not.toHaveProperty('portalTeamId');
    expect(projection.record.main.teams[0].players[0]).not.toHaveProperty('email');
    expect(projection.record.main.streamPresets).not.toHaveProperty('ownerEmail');
    expect(projection.record.main.streamPresets).not.toHaveProperty('debug');
    expect(projection.record.main.streamPresets.teams.Owner).toEqual(['https://stream.example/owner']);
    expect(projection.record.tournamentB.tirParticipants[0]).not.toHaveProperty('email');
    expect(JSON.stringify(projection)).not.toContain('@example.com');
    expect(source).toEqual(snapshot);
    expect(projection.record.main.teams).not.toBe(source.main.teams);
  });

  it('normalizes legacy root/groupB records into the same projected envelope', () => {
    const legacy = {
      name: 'Legacy Cup',
      tournamentMessage: 'Legacy message',
      activeGroup: 'B',
      ...competition(),
      groupB: competition({ system: 'playoff', teams: [], games: [] }),
      ...privateSentinels,
    };

    const projection = createPublicTournamentProjection(legacy, { revision: 1, updatedAt: 1 });
    const parsed = readPublicTournamentProjection(projection, { tournamentId: '42', ownerUid: 'owner-1' });

    expect(parsed.valid).toBe(true);
    expect(parsed.record).toMatchObject({
      id: '42',
      _ownerUid: 'owner-1',
      name: 'Legacy Cup',
      activeGroup: 'B',
      main: { system: 'swiss' },
      tournamentB: { system: 'playoff' },
    });
    expect(parsed.record).not.toHaveProperty('groupB');
    expect(parsed.record).not.toHaveProperty('collaborators');
  });

  it.each(['swiss', 'groups', 'supermele', 'poules', 'playoff', 'tir'])(
    'round-trips public %s data from both persisted record formats',
    (system) => {
      const main = competition({ system, teams: [], games: [] });
      const records = [
        { name: `${system} envelope`, activeGroup: 'A', main, tournamentB: null },
        { name: `${system} legacy`, activeGroup: 'A', ...main },
      ];

      records.forEach((record) => {
        const projected = createPublicTournamentProjection(record, { revision: 1, updatedAt: 1 });
        const parsed = readPublicTournamentProjection(projected);

        expect(parsed.valid).toBe(true);
        expect(parsed.record.main.system).toBe(system);
        expect(projected.record.main.preferences).not.toHaveProperty('isTestTournament');
      });
    },
  );

  it('rejects unsupported, partial, malformed, and regressed revisions with stable reasons', () => {
    const valid = createPublicTournamentProjection(envelopeRecord(), { revision: 4, updatedAt: 20 });

    expect(readPublicTournamentProjection(null)).toEqual({
      valid: false,
      reason: PUBLIC_TOURNAMENT_PROJECTION_ERROR.MISSING,
    });
    expect(readPublicTournamentProjection({ ...valid, schemaVersion: 2 })).toEqual({
      valid: false,
      reason: PUBLIC_TOURNAMENT_PROJECTION_ERROR.UNSUPPORTED_VERSION,
    });
    expect(readPublicTournamentProjection({ ...valid, complete: false })).toEqual({
      valid: false,
      reason: PUBLIC_TOURNAMENT_PROJECTION_ERROR.PARTIAL,
    });
    expect(readPublicTournamentProjection({ ...valid, record: { ...valid.record, main: {} } })).toEqual({
      valid: false,
      reason: PUBLIC_TOURNAMENT_PROJECTION_ERROR.MALFORMED,
    });
    expect(
      readPublicTournamentProjection({
        ...valid,
        record: {
          ...valid.record,
          main: { ...valid.record.main, editorOnly: true },
        },
      }),
    ).toEqual({
      valid: false,
      reason: PUBLIC_TOURNAMENT_PROJECTION_ERROR.MALFORMED,
    });
    expect(
      readPublicTournamentProjection({
        ...valid,
        record: {
          ...valid.record,
          main: {
            ...valid.record.main,
            teams: [{ title: 'Leaked', players: [{ email: 'private@example.com' }] }],
          },
        },
      }),
    ).toEqual({
      valid: false,
      reason: PUBLIC_TOURNAMENT_PROJECTION_ERROR.MALFORMED,
    });
    expect(
      readPublicTournamentProjection({
        ...valid,
        record: {
          ...valid.record,
          main: {
            ...valid.record.main,
            games: [[{ team_1: 'Leaked', token: 'private-token' }]],
          },
        },
      }),
    ).toEqual({
      valid: false,
      reason: PUBLIC_TOURNAMENT_PROJECTION_ERROR.MALFORMED,
    });
    expect(readPublicTournamentProjection(valid, { previousRevision: 5 })).toEqual({
      valid: false,
      reason: PUBLIC_TOURNAMENT_PROJECTION_ERROR.STALE,
    });
  });

  it('normalizes empty collections that Realtime Database omits on round-trip', () => {
    const projection = createPublicTournamentProjection(
      { name: 'Empty', main: { system: 'swiss', teams: [], games: [], preferences: {} } },
      { revision: 1, updatedAt: 1 },
    );
    delete projection.record.main.teams;
    delete projection.record.main.games;
    delete projection.record.tournamentB;

    const parsed = readPublicTournamentProjection(projection);

    expect(parsed.valid).toBe(true);
    expect(parsed.record.main.teams).toEqual([]);
    expect(parsed.record.main.games).toEqual([]);
    expect(parsed.record.tournamentB).toBeNull();
  });

  it('truncates over-depth source containers and rejects over-depth persisted payloads', () => {
    let nested = { score: 13 };
    for (let depth = 0; depth < 13; depth += 1) nested = { value: nested };
    const source = { name: 'Deep', main: { system: 'swiss', games: [[{ payload: nested }]] } };

    const sanitized = createPublicTournamentProjection(source, { revision: 1, updatedAt: 1 });
    expect(readPublicTournamentProjection(sanitized).valid).toBe(true);
    expect(JSON.stringify(sanitized)).not.toContain('"score":13');

    const persisted = createPublicTournamentProjection(competition(), { revision: 1, updatedAt: 1 });
    persisted.record.main.games = [[{ payload: nested }]];
    expect(readPublicTournamentProjection(persisted)).toEqual({
      valid: false,
      reason: PUBLIC_TOURNAMENT_PROJECTION_ERROR.MALFORMED,
    });
  });
});

describe('public tournament projection write planning', () => {
  it('maps envelope, legacy, Group B, metadata, and nested preference paths without mirroring private fields', () => {
    const metadata = { revisionValue: { increment: 1 }, updatedAtValue: { timestamp: true } };
    const envelopePlan = planPublicTournamentPathWrite({
      ownerUid: 'owner',
      tournamentId: '7',
      record: envelopeRecord(),
      pathValues: {
        name: 'Renamed',
        'main/games/0/0/team_1_score': 12,
        'main/preferences/colorSchema': 'turquoise',
        'main/preferences/isTestTournament': false,
        'main/teams/0/email': 'hidden@example.com',
        'main/teams/0/portalTeamId': 91,
        'main/games/0/0/token': 'hidden-token',
        'main/streamPresets/teams/Alpha/0': 'https://stream.example/alpha-live',
        'main/streamPresets/teams/Beta': ['https://stream.example/beta', { token: 'hidden-token' }],
        'main/streamPresets/teams/Alpha/token': 'hidden-token',
        'main/tirTiebreakerActive': false,
        'main/tirTiebreakerParticipantIds': null,
        'tournamentB/tirParticipants': [{ name: 'Shooter', email: 'hidden@example.com' }],
        collaborators: { private: true },
      },
      ...metadata,
    });

    expect(envelopePlan.updates).toMatchObject({
      'owner/tournaments/7/name': 'Renamed',
      'owner/tournaments/7/main/games/0/0/team_1_score': 12,
      'owner/tournaments/7/main/streamPresets/teams/Alpha/0': 'https://stream.example/alpha-live',
      'publicTournaments/owner/7/record/name': 'Renamed',
      'publicTournaments/owner/7/record/main/games/0/0/team_1_score': 12,
      'publicTournaments/owner/7/record/main/preferences/colorSchema': 'turquoise',
      'publicTournaments/owner/7/record/main/streamPresets/teams/Beta': ['https://stream.example/beta'],
      'publicTournaments/owner/7/schemaVersion': 1,
    });
    expect(envelopePlan.updates).not.toHaveProperty(
      'publicTournaments/owner/7/record/main/preferences/isTestTournament',
    );
    expect(envelopePlan.updates).not.toHaveProperty('publicTournaments/owner/7/record/main/teams/0/email');
    expect(envelopePlan.updates).not.toHaveProperty('publicTournaments/owner/7/record/main/teams/0/portalTeamId');
    expect(envelopePlan.updates).not.toHaveProperty('publicTournaments/owner/7/record/main/games/0/0/token');
    expect(envelopePlan.updates).not.toHaveProperty(
      'publicTournaments/owner/7/record/main/streamPresets/teams/Alpha/token',
    );
    expect(envelopePlan.updates).not.toHaveProperty(
      'publicTournaments/owner/7/record/main/streamPresets/teams/Alpha/0',
    );
    expect(envelopePlan.updates).not.toHaveProperty('publicTournaments/owner/7/record/main/tirTiebreakerActive');
    expect(envelopePlan.updates).not.toHaveProperty(
      'publicTournaments/owner/7/record/main/tirTiebreakerParticipantIds',
    );
    expect(envelopePlan.updates).not.toHaveProperty('publicTournaments/owner/7/record/collaborators');
    expect(envelopePlan.updates['publicTournaments/owner/7/record/tournamentB/tirParticipants'][0]).toEqual({
      name: 'Shooter',
    });

    const legacyPlan = planPublicTournamentPathWrite({
      ownerUid: 'owner',
      tournamentId: '8',
      record: { ...competition(), groupB: competition() },
      pathValues: { 'games/0/0/team_2_score': 9, 'groupB/teams': [{ title: 'B' }] },
      ...metadata,
    });
    expect(legacyPlan.updates).toMatchObject({
      'publicTournaments/owner/8/record/main/games/0/0/team_2_score': 9,
      'publicTournaments/owner/8/record/tournamentB/teams': [{ title: 'B' }],
    });
  });

  it('publishes a full record and projection in one root plan', () => {
    const plan = planPublicTournamentFullWrite({
      ownerUid: 'owner',
      tournamentId: '9',
      record: envelopeRecord(),
      revisionValue: { increment: 1 },
      updatedAtValue: { timestamp: true },
    });

    expect(plan.updates['owner/tournaments/9']).toBeTruthy();
    expect(plan.updates['publicTournaments/owner/9/complete']).toBe(true);
    expect(plan.updates['publicTournaments/owner/9/record'].main.games).toHaveLength(1);
    expect(plan.updates['publicTournaments/owner/9/record']).not.toHaveProperty('collaborators');
  });

  it('executes an atomic root update and falls back only when projection permission is not rolled out yet', async () => {
    const permissionError = { code: 'PERMISSION_DENIED' };
    const dependencies = {
      database: 'db',
      ref: vi.fn((_database, path) => path),
      update: vi.fn().mockRejectedValueOnce(permissionError).mockResolvedValueOnce(),
      set: vi.fn().mockResolvedValue(),
      remove: vi.fn().mockResolvedValue(),
      increment: vi.fn(() => ({ '.sv': { increment: 1 } })),
      serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' })),
    };
    const writer = createPublicTournamentWriter(dependencies);

    const result = await writer.writePaths({
      ownerUid: 'owner',
      tournamentId: '10',
      record: envelopeRecord(),
      pathValues: { 'main/games/0/0/team_1_score': 13 },
    });

    expect(dependencies.update).toHaveBeenNthCalledWith(
      1,
      '/',
      expect.objectContaining({
        'owner/tournaments/10/main/games/0/0/team_1_score': 13,
        'publicTournaments/owner/10/record/main/games/0/0/team_1_score': 13,
      }),
    );
    expect(dependencies.set).toHaveBeenCalledWith('owner/tournaments/10/main/games/0/0/team_1_score', 13);
    expect(result).toEqual({ projection: 'deferred', reason: 'permission-denied' });
  });

  it('removes the canonical record and projection in one root update', async () => {
    const dependencies = {
      database: 'db',
      ref: vi.fn((_database, path) => path),
      update: vi.fn().mockResolvedValue(),
      remove: vi.fn().mockResolvedValue(),
    };
    const writer = createPublicTournamentWriter(dependencies);

    await writer.removeTournament({
      ownerUid: 'owner',
      tournamentId: '11',
      additionalUpdates: { 'archive/11': null },
    });

    expect(dependencies.update).toHaveBeenCalledWith('/', {
      'owner/tournaments/11': null,
      'publicTournaments/owner/11': null,
      'archive/11': null,
    });
    expect(dependencies.remove).not.toHaveBeenCalled();
  });

  it('retries an atomic canonical deletion without the projection before additive rules are live', async () => {
    const dependencies = {
      database: 'db',
      ref: vi.fn((_database, path) => path),
      update: vi.fn().mockRejectedValueOnce({ code: 'PERMISSION_DENIED' }).mockResolvedValueOnce(),
    };
    const writer = createPublicTournamentWriter(dependencies);

    await expect(
      writer.removeTournament({
        ownerUid: 'owner',
        tournamentId: '12',
        additionalUpdates: { 'archive/12': null, 'users/owner/tournaments/12': null },
      }),
    ).resolves.toEqual({ projection: 'deferred', reason: 'permission-denied' });

    expect(dependencies.update).toHaveBeenNthCalledWith(2, '/', {
      'archive/12': null,
      'users/owner/tournaments/12': null,
      'owner/tournaments/12': null,
    });
  });
});
