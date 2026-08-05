import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncTeamPlayers, syncTirParticipants, syncFromPortal, FIELD_SETS } from '@/services/portal-sync';

describe('syncTeamPlayers', () => {
  describe('identity matching', () => {
    it('matches by stable numeric/string portal player ID', () => {
      const teams = [{ players: [{ id: 42, surname: 'Іванов', name: 'Олег', second_name: '' }] }];
      const portalTeams = [{ players: [{ id: '42', surname: 'Іванов', name: 'Олег', second_name: 'Петрович' }] }];

      const stats = syncTeamPlayers(teams, portalTeams);
      expect(stats.matched).toBe(1);
      expect(stats.changedPlayers).toBe(1);
      expect(teams[0].players[0].second_name).toBe('Петрович');
    });

    it('falls back to unique surname+name match for records without IDs', () => {
      const teams = [{ players: [{ surname: 'Попович', name: 'Ксенія', second_name: '' }] }];
      const portalTeams = [{ players: [{ id: 77, surname: ' попович ', name: 'ксенія', second_name: 'Олегівна' }] }];

      const stats = syncTeamPlayers(teams, portalTeams);
      expect(stats.changedPlayers).toBe(1);
      expect(teams[0].players[0].second_name).toBe('Олегівна');
    });

    it('disambiguates duplicate names by club_id', () => {
      const teams = [{ players: [{ surname: 'Коваль', name: 'Олександр', club_id: 2, second_name: '' }] }];
      const portalTeams = [
        {
          players: [
            { id: 1, surname: 'Коваль', name: 'Олександр', second_name: 'Перший', club_id: 1 },
            { id: 2, surname: 'Коваль', name: 'Олександр', second_name: 'Другий', club_id: '2' },
          ],
        },
      ];

      const stats = syncTeamPlayers(teams, portalTeams);
      expect(stats.matched).toBe(1);
      expect(teams[0].players[0].second_name).toBe('Другий');
    });

    it('disambiguates duplicate names by club name when club_id unavailable', () => {
      const teams = [{ players: [{ surname: 'Коваль', name: 'Олександр', club: 'Львів', second_name: '' }] }];
      const portalTeams = [
        {
          players: [
            { surname: 'Коваль', name: 'Олександр', second_name: 'Перший', club: 'Київ' },
            { surname: 'Коваль', name: 'Олександр', second_name: 'Другий', club: 'Львів' },
          ],
        },
      ];

      const stats = syncTeamPlayers(teams, portalTeams);
      expect(stats.matched).toBe(1);
      expect(teams[0].players[0].second_name).toBe('Другий');
    });

    it('does not guess between ambiguous names without club info', () => {
      const player = { surname: 'Коваль', name: 'Олександр', second_name: '' };
      const teams = [{ players: [player] }];
      const portalTeams = [
        {
          players: [
            { surname: 'Коваль', name: 'Олександр', second_name: 'Перший' },
            { surname: 'Коваль', name: 'Олександр', second_name: 'Другий' },
          ],
        },
      ];

      const stats = syncTeamPlayers(teams, portalTeams);
      expect(stats.missing).toBe(1);
      expect(stats.matched).toBe(0);
      expect(teams[0].players[0]).toBe(player);
    });
  });

  describe('field updates', () => {
    it('updates only configured fields', () => {
      const teams = [
        {
          players: [
            {
              id: 1,
              surname: 'Іванов',
              name: 'Олег',
              second_name: 'Старе',
              club_logo_url: 'old.png',
              avatar_url: 'old-av.png',
            },
          ],
        },
      ];
      const portalTeams = [
        {
          players: [
            {
              id: '1',
              surname: 'Іванов',
              name: 'Олег',
              second_name: 'Нове',
              club_logo_url: 'new.png',
              avatar_url: 'new-av.png',
            },
          ],
        },
      ];

      syncTeamPlayers(teams, portalTeams, { fields: ['club_logo_url', 'avatar_url'] });
      expect(teams[0].players[0].second_name).toBe('Старе');
      expect(teams[0].players[0].club_logo_url).toBe('new.png');
      expect(teams[0].players[0].avatar_url).toBe('new-av.png');
    });

    it('does not erase required name fields when portal omits them', () => {
      const teams = [{ players: [{ id: 5, surname: 'Іванов', name: 'Олег', second_name: 'Петрович' }] }];
      const portalTeams = [{ players: [{ id: '5', surname: '', name: null }] }];

      const stats = syncTeamPlayers(teams, portalTeams);
      expect(stats.changedPlayers).toBe(0);
      expect(teams[0].players[0].surname).toBe('Іванов');
      expect(teams[0].players[0].name).toBe('Олег');
    });

    it('does not count unchanged players as updated', () => {
      const teams = [{ players: [{ id: 1, surname: 'Іванов', name: 'Олег', second_name: 'Петрович' }] }];
      const portalTeams = [{ players: [{ id: '1', surname: 'Іванов', name: 'Олег', second_name: 'Петрович' }] }];

      const stats = syncTeamPlayers(teams, portalTeams);
      expect(stats.matched).toBe(1);
      expect(stats.changedPlayers).toBe(0);
      expect(stats.changedFields).toBe(0);
    });

    it('skips fields not present on the portal player object', () => {
      const teams = [{ players: [{ id: 1, surname: 'Іванов', name: 'Олег', sport_title: 'МС' }] }];
      const portalTeams = [{ players: [{ id: '1', surname: 'Іванов', name: 'Олег' }] }];

      const stats = syncTeamPlayers(teams, portalTeams);
      expect(stats.changedPlayers).toBe(0);
      expect(teams[0].players[0].sport_title).toBe('МС');
    });

    it('creates immutable splice for team players (does not mutate original reference)', () => {
      const originalPlayer = { id: 1, surname: 'Іванов', name: 'Олег', second_name: '' };
      const teams = [{ players: [originalPlayer] }];
      const portalTeams = [{ players: [{ id: '1', surname: 'Іванов', name: 'Олег', second_name: 'Петрович' }] }];

      syncTeamPlayers(teams, portalTeams);
      expect(teams[0].players[0]).not.toBe(originalPlayer);
      expect(teams[0].players[0].second_name).toBe('Петрович');
    });
  });

  describe('statistics', () => {
    it('returns complete statistics', () => {
      const teams = [
        {
          players: [
            { id: 1, surname: 'Перший', name: 'Гравець', second_name: '' },
            { id: 2, surname: 'Другий', name: 'Гравець', second_name: 'Існує' },
            { surname: 'Невідомий', name: 'Гравець', second_name: '' },
          ],
        },
      ];
      const portalTeams = [
        {
          players: [
            { id: '1', surname: 'Перший', name: 'Гравець', second_name: 'Новий' },
            { id: '2', surname: 'Другий', name: 'Гравець', second_name: 'Існує' },
          ],
        },
      ];

      const stats = syncTeamPlayers(teams, portalTeams);
      expect(stats).toEqual({
        total: 3,
        matched: 2,
        changedPlayers: 1,
        changedFields: 1,
        missing: 1,
        ambiguous: 0,
      });
    });
  });

  describe('media field set', () => {
    it('syncs club logos and avatars without touching identity fields', () => {
      const teams = [
        {
          players: [
            {
              id: 1,
              surname: 'Іванов',
              name: 'Олег',
              second_name: 'Старе',
              club_id: 5,
              club_logo_url: null,
              avatar_url: null,
            },
          ],
        },
      ];
      const portalTeams = [
        {
          players: [
            {
              id: '1',
              surname: 'Іванов',
              name: 'Олег',
              second_name: 'Новий',
              club_id: '7',
              club_logo_url: 'https://portal.example/logo.png',
              avatar_url: 'https://portal.example/avatar.png',
              club: 'Новий клуб',
            },
          ],
        },
      ];

      const stats = syncTeamPlayers(teams, portalTeams, { fields: FIELD_SETS.media });
      expect(stats.changedPlayers).toBe(1);
      expect(teams[0].players[0].club_logo_url).toBe('https://portal.example/logo.png');
      expect(teams[0].players[0].avatar_url).toBe('https://portal.example/avatar.png');
      expect(teams[0].players[0].club_id).toBe('7');
      expect(teams[0].players[0].club).toBe('Новий клуб');
      expect(teams[0].players[0].second_name).toBe('Старе');
    });
  });
});

describe('syncTirParticipants', () => {
  describe('identity matching', () => {
    it('matches by portalTeamId when available', () => {
      const participants = [{ name: 'Коваль Олександр', portalTeamId: 91 }];
      const portalTeams = [
        {
          id: 91,
          name: 'Коваль Олександр',
          players: [{ surname: 'Коваль', name: 'Олександр', club_id: 2, sport_title: 'КМСУ' }],
        },
      ];

      const stats = syncTirParticipants(participants, portalTeams);
      expect(stats.matched).toBe(1);
      expect(stats.changedPlayers).toBe(1);
      expect(participants[0].club_id).toBe(2);
    });

    it('matches by team name when no portalTeamId', () => {
      const participants = [{ name: 'Коваль Олександр' }];
      const portalTeams = [
        {
          id: 91,
          name: 'Коваль Олександр',
          players: [{ surname: 'Коваль', name: 'Олександр', second_name: 'Петрович', club_id: 2 }],
        },
      ];

      const stats = syncTirParticipants(participants, portalTeams);
      expect(stats.matched).toBe(1);
      expect(participants[0].protocolName).toBe('Коваль Олександр Петрович');
      expect(participants[0].portalTeamId).toBe(91);
    });

    it('does not guess when names are ambiguous', () => {
      const participants = [{ name: 'Коваль Олександр' }];
      const portalTeams = [1, 2].map((id) => ({
        id,
        name: 'Коваль Олександр',
        players: [{ surname: 'Коваль', name: 'Олександр', club_id: id }],
      }));

      const stats = syncTirParticipants(participants, portalTeams);
      expect(stats.ambiguous).toBe(1);
      expect(stats.matched).toBe(0);
      expect(participants[0]).toEqual({ name: 'Коваль Олександр' });
    });

    it('returns missing when no match found', () => {
      const participants = [{ name: 'Невідомий Гравець' }];
      const portalTeams = [{ id: 1, name: 'Інший', players: [{ surname: 'Інший', name: 'Гравець' }] }];

      const stats = syncTirParticipants(participants, portalTeams);
      expect(stats.missing).toBe(1);
      expect(stats.ambiguous).toBe(0);
    });
  });

  describe('field updates', () => {
    it('updates only configured fields for media sync', () => {
      const participants = [{ name: 'Коваль Олександр', portalTeamId: 91, club_logo_url: null }];
      const portalTeams = [
        {
          id: 91,
          name: 'Коваль Олександр',
          players: [
            {
              surname: 'Коваль',
              name: 'Олександр',
              club_id: 2,
              sport_title: 'КМСУ',
              club_logo_url: 'logo.png',
              avatar_url: 'av.png',
              club: 'Клуб',
            },
          ],
        },
      ];

      const stats = syncTirParticipants(participants, portalTeams, { fields: FIELD_SETS.media });
      expect(stats.changedPlayers).toBe(1);
      expect(participants[0].club_logo_url).toBe('logo.png');
      expect(participants[0].avatar_url).toBe('av.png');
      expect(participants[0].sport_title).toBeUndefined();
    });

    it('does not overwrite with null portal values', () => {
      const participants = [{ name: 'Коваль Олександр', portalTeamId: 91, club_id: 5 }];
      const portalTeams = [
        {
          id: 91,
          name: 'Коваль Олександр',
          players: [{ surname: 'Коваль', name: 'Олександр', club_id: null, sport_title: null }],
        },
      ];

      const stats = syncTirParticipants(participants, portalTeams);
      expect(stats.changedPlayers).toBe(1);
      expect(participants[0].club_id).toBe(5);
    });
  });

  describe('statistics', () => {
    it('returns complete statistics', () => {
      const participants = [
        { name: 'Перший Гравець', portalTeamId: 1 },
        { name: 'Другий Гравець', portalTeamId: 2 },
        { name: 'Невідомий' },
      ];
      const portalTeams = [
        {
          id: 1,
          name: 'Перший Гравець',
          players: [{ surname: 'Перший', name: 'Гравець', club_id: 1, sport_title: 'МС' }],
        },
        {
          id: 2,
          name: 'Другий Гравець',
          players: [{ surname: 'Другий', name: 'Гравець', club_id: 1, sport_title: 'МС' }],
        },
      ];

      const stats = syncTirParticipants(participants, portalTeams);
      expect(stats.total).toBe(3);
      expect(stats.matched).toBe(2);
      expect(stats.missing).toBe(1);
    });
  });
});

describe('syncFromPortal', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches from portal and syncs both teams and tir participants', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          teams: [
            {
              id: 91,
              name: 'Коваль Олександр',
              players: [
                {
                  id: '1',
                  surname: 'Коваль',
                  name: 'Олександр',
                  second_name: 'Петрович',
                  club_id: 2,
                  club_logo_url: 'logo.png',
                },
              ],
            },
          ],
        }),
    });

    const teams = [{ players: [{ id: 1, surname: 'Коваль', name: 'Олександр', second_name: '' }] }];
    const tirParticipants = [{ name: 'Коваль Олександр', portalTeamId: 91, club_logo_url: null }];

    const results = await syncFromPortal('123', {
      teams,
      tirParticipants,
      fields: FIELD_SETS.media,
    });

    expect(results.teams.changedPlayers).toBe(1);
    expect(results.tirParticipants.changedPlayers).toBe(1);
    expect(teams[0].players[0].club_logo_url).toBe('logo.png');
    expect(tirParticipants[0].club_logo_url).toBe('logo.png');
  });

  it('only syncs teams when tirParticipants is null', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ teams: [{ players: [{ id: '1', surname: 'Т', name: 'Г', second_name: 'Н' }] }] }),
    });

    const teams = [{ players: [{ id: 1, surname: 'Т', name: 'Г', second_name: '' }] }];
    const results = await syncFromPortal('123', { teams, tirParticipants: null });
    expect(results.teams).not.toBeNull();
    expect(results.tirParticipants).toBeNull();
  });
});

describe('FIELD_SETS', () => {
  it('defines protocol fields', () => {
    expect(FIELD_SETS.protocol).toEqual(['second_name', 'surname', 'name', 'club_id', 'sport_title']);
  });

  it('defines tir fields', () => {
    expect(FIELD_SETS.tir).toEqual(['protocolName', 'portalTeamId', 'club_id', 'sport_title']);
  });

  it('defines media fields', () => {
    expect(FIELD_SETS.media).toEqual(['club_logo_url', 'avatar_url', 'club_id', 'club']);
  });
});
