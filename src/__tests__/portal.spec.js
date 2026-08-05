import { describe, expect, it, vi } from 'vitest';
import {
  ARCHIVE_MEDIA_FIELDS,
  PortalServiceError,
  buildPortalTournamentUrl,
  createPortalPlayerIndex,
  fetchPortalTournamentTeams,
  matchPortalPlayer,
  standardPlayerAdapter,
  syncArchivedPlayerMedia,
  syncStandardTournamentPlayers,
  syncTirParticipants,
} from '@/services/portal';

describe('portal API service', () => {
  it('encodes tournament IDs and adds the JSON and cache-busting query parameters', () => {
    const url = buildPortalTournamentUrl(' cup/42 ', { cacheBuster: 1234 });

    expect(url.pathname).toMatch(/\/cup%2F42$/);
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('_fresh')).toBe('1234');
  });

  it('uses a no-store request and returns validated teams', async () => {
    const teams = [{ id: 1, players: [] }];
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ teams }) });

    await expect(fetchPortalTournamentTeams(42, { fetchImpl, cacheBuster: 99 })).resolves.toBe(teams);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.objectContaining({ search: expect.stringContaining('format=json') }),
      { cache: 'no-store' },
    );
  });

  it.each([
    {
      name: 'non-OK response',
      response: { ok: false, status: 503 },
      code: 'http',
      message: 'Portal responded 503',
    },
    {
      name: 'invalid response shape',
      response: { ok: true, json: vi.fn().mockResolvedValue({ players: [] }) },
      code: 'invalid-response',
      message: 'Portal returned an invalid tournament export',
    },
    {
      name: 'invalid JSON',
      response: { ok: true, json: vi.fn().mockRejectedValue(new SyntaxError('private body')) },
      code: 'invalid-json',
      message: 'Portal returned invalid JSON',
    },
  ])('normalizes a $name', async ({ response, code, message }) => {
    const request = fetchPortalTournamentTeams(42, { fetchImpl: vi.fn().mockResolvedValue(response) });

    await expect(request).rejects.toMatchObject({ name: 'PortalServiceError', code, message });
  });

  it('normalizes network failures without exposing response data', async () => {
    const request = fetchPortalTournamentTeams(42, {
      fetchImpl: vi.fn().mockRejectedValue(new Error('private upstream details')),
    });

    await expect(request).rejects.toEqual(
      expect.objectContaining({ code: 'network', message: 'Portal request failed' }),
    );
    await expect(request).rejects.toBeInstanceOf(PortalServiceError);
  });
});

describe('portal player identity matching', () => {
  it('prefers a stable player ID over mismatched names', () => {
    const portal = [{ players: [{ id: '42', surname: 'Нове', name: 'Ім’я' }] }];
    const match = matchPortalPlayer(
      { id: 42, surname: 'Старе', name: 'Ім’я' },
      createPortalPlayerIndex(portal),
      standardPlayerAdapter,
    );

    expect(match).toMatchObject({ status: 'matched', matchedBy: 'player' });
    expect(match.entry.player.surname).toBe('Нове');
  });

  it('matches a unique normalized legacy name', () => {
    const result = syncStandardTournamentPlayers(
      [{ players: [{ surname: ' попович', name: 'Ксенія ' }] }],
      [{ players: [{ surname: 'ПОПОВИЧ', name: 'ксенія', second_name: 'Володимирівна' }] }],
    );

    expect(result).toMatchObject({ matched: 1, changedPlayers: 1, missing: 0, ambiguous: 0 });
    expect(result.teams[0].players[0].second_name).toBe('Володимирівна');
  });

  it('uses club ID and then club name to disambiguate duplicate names', () => {
    const portal = [
      {
        players: [
          { id: 1, surname: 'Коваль', name: 'Олександр', club_id: 1, club: 'Одеса', avatar_url: 'one' },
          { id: 2, surname: 'Коваль', name: 'Олександр', club_id: 2, club: 'Київ', avatar_url: 'two' },
        ],
      },
    ];
    const byId = syncStandardTournamentPlayers(
      [{ players: [{ surname: 'Коваль', name: 'Олександр', club_id: '2' }] }],
      portal,
      { fields: ARCHIVE_MEDIA_FIELDS },
    );
    const byName = syncStandardTournamentPlayers(
      [{ players: [{ surname: 'Коваль', name: 'Олександр', club: 'Одеса' }] }],
      portal,
      { fields: ARCHIVE_MEDIA_FIELDS },
    );

    expect(byId.teams[0].players[0].avatar_url).toBe('two');
    expect(byName.teams[0].players[0].avatar_url).toBe('one');
  });

  it('refuses to guess when duplicate names remain ambiguous', () => {
    const local = [{ players: [{ surname: 'Коваль', name: 'Олександр', avatar_url: 'existing' }] }];
    const portal = [
      {
        players: [
          { id: 1, surname: 'Коваль', name: 'Олександр', avatar_url: 'one' },
          { id: 2, surname: 'Коваль', name: 'Олександр', avatar_url: 'two' },
        ],
      },
    ];

    const result = syncStandardTournamentPlayers(local, portal, { fields: ARCHIVE_MEDIA_FIELDS });

    expect(result).toMatchObject({ matched: 0, changedPlayers: 0, missing: 0, ambiguous: 1 });
    expect(result.teams).toBe(local);
  });
});

describe('configurable portal synchronization', () => {
  it('returns immutable copies and structured field statistics', () => {
    const player = { id: 7, surname: 'Іванов', name: 'Олег', second_name: '', club_id: 1 };
    const teams = [{ title: 'A', players: [player] }];
    const portal = [
      {
        players: [
          {
            id: '7',
            surname: 'Іванов',
            name: 'Олег',
            second_name: 'Петрович',
            club_id: '1',
            sport_title: 'КМСУ',
          },
        ],
      },
    ];

    const result = syncStandardTournamentPlayers(teams, portal);

    expect(result).toMatchObject({
      total: 1,
      matched: 1,
      changedPlayers: 1,
      changedFields: 2,
      missing: 0,
      ambiguous: 0,
    });
    expect(result.teams).not.toBe(teams);
    expect(result.teams[0].players[0]).not.toBe(player);
    expect(result.teams[0].players[0]).toEqual(
      expect.objectContaining({ second_name: 'Петрович', sport_title: 'КМСУ' }),
    );
    expect(player).toEqual({ id: 7, surname: 'Іванов', name: 'Олег', second_name: '', club_id: 1 });
  });

  it('supports explicit source-to-target mappings and does not erase omitted optional fields', () => {
    const teams = [{ players: [{ id: 8, name: 'Олег', photo: 'existing', avatar_url: 'existing-avatar' }] }];
    const portal = [{ players: [{ id: 8, name: 'Олег', avatar_url: 'new-photo', club_logo_url: null }] }];

    const result = syncStandardTournamentPlayers(teams, portal, {
      fields: [
        { source: 'avatar_url', target: 'photo', from: 'player' },
        { source: 'club_logo_url', target: 'avatar_url', from: 'player' },
      ],
    });

    expect(result.changedFields).toBe(1);
    expect(result.teams[0].players[0]).toEqual(
      expect.objectContaining({ photo: 'new-photo', avatar_url: 'existing-avatar' }),
    );
  });

  it('maps TIR protocol identity through the portal team adapter', () => {
    const participants = [{ id: 1, name: 'Local display', portalTeamId: 91 }];
    const portal = [
      {
        id: '91',
        name: 'Portal display',
        players: [{ surname: 'Коваль', name: 'Олександр', second_name: 'Петрович', club_id: 2, sport_title: 'КМСУ' }],
      },
    ];

    const result = syncTirParticipants(participants, portal);

    expect(result).toMatchObject({ matched: 1, changedPlayers: 1, changedFields: 3 });
    expect(result.participants[0]).toEqual(
      expect.objectContaining({
        name: 'Local display',
        portalTeamId: 91,
        protocolName: 'Коваль Олександр Петрович',
        club_id: 2,
        sport_title: 'КМСУ',
      }),
    );
    expect(participants[0]).toEqual({ id: 1, name: 'Local display', portalTeamId: 91 });
  });

  it('updates standard and TIR archive media while reporting changed collections', () => {
    const result = syncArchivedPlayerMedia(
      {
        teams: [{ players: [{ id: 1, surname: 'A', name: 'One' }] }],
        tirParticipants: [{ name: 'B Two', portalTeamId: 20 }],
      },
      [
        { id: 10, players: [{ id: 1, surname: 'A', name: 'One', avatar_url: 'standard.png' }] },
        { id: 20, name: 'B Two', players: [{ surname: 'B', name: 'Two', club_logo_url: 'tir.png' }] },
      ],
    );

    expect(result).toMatchObject({
      total: 2,
      matched: 2,
      changedPlayers: 2,
      changedFields: 2,
      changedCollections: { teams: true, tirParticipants: true },
    });
    expect(result.teams[0].players[0].avatar_url).toBe('standard.png');
    expect(result.tirParticipants[0].club_logo_url).toBe('tir.png');
  });
});
