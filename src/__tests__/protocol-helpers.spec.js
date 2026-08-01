import { describe, it, expect } from 'vitest';
import {
  formatName,
  getPlayerThirdName,
  formatDateToHumanReadable,
  getTeamPlaceInGroups,
  getAllTeams,
  countPlayers,
  chunkParticipants,
  buildTeamTitle,
  getProtocolTournamentMeta,
  refreshTournamentPlayerDetails,
} from '../protocol-helpers';
import { regions } from '../helpers';

describe('club region mapping', () => {
  it('covers every club in the current portal club list', () => {
    const currentClubIds = [
      1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 20, 21, 22, 23, 24, 25, 27, 29, 30, 31,
    ];

    expect(currentClubIds.filter((id) => !regions[id])).toEqual([]);
  });
});

describe('getProtocolTournamentMeta', () => {
  it('prefers the explicitly selected tournament metadata over the current store tournament', () => {
    const selectedTournament = { teams: [], date: '2026-07-04' };
    const selectedMeta = {
      id: 'archived-1',
      name: 'Selected archived tournament',
      portalIdTournament: 146,
    };
    const currentTournament = {
      id: 'current-1',
      name: 'Different current tournament',
      date: '2026-07-24',
      portalIdTournament: 100,
    };

    expect(getProtocolTournamentMeta(selectedTournament, selectedMeta, currentTournament)).toEqual({
      id: 'archived-1',
      name: 'Selected archived tournament',
      date: '2026-07-04',
      portalIdTournament: 146,
    });
  });

  it('falls back to current tournament metadata for existing callers', () => {
    expect(getProtocolTournamentMeta({ teams: [] }, null, { id: 'current-1', name: 'Current' })).toEqual({
      id: 'current-1',
      name: 'Current',
      date: '',
      portalIdTournament: undefined,
    });
  });

  it('resolves every field independently across archived and current metadata', () => {
    expect(
      getProtocolTournamentMeta(
        { date: '2026-08-01' },
        { id: 'archive-1', name: 'Archived tournament' },
        { portalIdTournament: 1784965464060 },
      ),
    ).toEqual({
      id: 'archive-1',
      name: 'Archived tournament',
      date: '2026-08-01',
      portalIdTournament: 1784965464060,
    });
  });
});

describe('formatName', () => {
  it('capitalizes first letter and lowercases rest', () => {
    expect(formatName('ІВАНОВ')).toBe('Іванов');
    expect(formatName('петренко')).toBe('Петренко');
    expect(formatName('ДмИтРо')).toBe('Дмитро');
  });

  it('handles single character', () => {
    expect(formatName('а')).toBe('А');
    expect(formatName('А')).toBe('А');
  });
});

describe('getPlayerThirdName', () => {
  const playersNames = ['ІВАНОВ ОЛЕГ ПЕТРОВИЧ', 'ПЕТРЕНКО АННА', 'СИДОРЕНКО МАКСИМ ВІКТОРОВИЧ'];

  it('returns third name when player found with 3+ parts', () => {
    expect(getPlayerThirdName('Іванов', 'Олег', playersNames)).toBe('Петрович');
  });

  it('returns placeholder when player found but no third name', () => {
    expect(getPlayerThirdName('Петренко', 'Анна', playersNames)).toBe('!!! ДОПИШІТЬ МЕНЕ!!!');
  });

  it('returns placeholder when player not found', () => {
    expect(getPlayerThirdName('Невідомий', 'Гравець', playersNames)).toBe('!!! ДОПИШІТЬ МЕНЕ!!!');
  });

  it('does not require a patronymic for Latin-script names', () => {
    expect(getPlayerThirdName('Presutti', 'Mario', playersNames)).toBe('');
  });

  it('matches regardless of name order (surname first or name first)', () => {
    expect(getPlayerThirdName('Сидоренко', 'Максим', playersNames)).toBe('Вікторович');
  });

  it('is case-insensitive', () => {
    expect(getPlayerThirdName('іванов', 'олег', playersNames)).toBe('Петрович');
  });
});

describe('refreshTournamentPlayerDetails', () => {
  it('matches numeric local IDs to string portal IDs and updates patronymics', () => {
    const teams = [
      {
        players: [{ id: 42, surname: 'Іванов', name: 'Олег', second_name: 'Старе', club_id: 1 }],
      },
    ];
    const portalTeams = [
      {
        players: [{ id: '42', surname: 'Іванов', name: 'Олег', second_name: 'Петрович', club_id: '1' }],
      },
    ];

    expect(refreshTournamentPlayerDetails(teams, portalTeams)).toEqual({
      total: 1,
      matched: 1,
      changed: 1,
      missing: 0,
    });
    expect(teams[0].players[0].second_name).toBe('Петрович');
  });

  it('falls back to a unique surname and name match when an old tournament has no player IDs', () => {
    const teams = [{ players: [{ surname: 'Попович', name: 'Ксенія', second_name: '' }] }];
    const portalTeams = [{ players: [{ id: 77, surname: ' попович ', name: 'ксенія', second_name: 'Володимирівна' }] }];

    expect(refreshTournamentPlayerDetails(teams, portalTeams).changed).toBe(1);
    expect(teams[0].players[0].second_name).toBe('Володимирівна');
  });

  it('can remove a patronymic and does not report unchanged players as updated', () => {
    const teams = [
      {
        players: [
          { id: 1, surname: 'Presutti', name: 'Mario', second_name: 'REMOVE ME' },
          { id: 2, surname: 'Іванов', name: 'Олег', second_name: 'Петрович' },
        ],
      },
    ];
    const portalTeams = [
      {
        players: [
          { id: '1', surname: 'Presutti', name: 'Mario', second_name: '' },
          { id: '2', surname: 'Іванов', name: 'Олег', second_name: 'Петрович' },
        ],
      },
    ];

    expect(refreshTournamentPlayerDetails(teams, portalTeams)).toEqual({
      total: 2,
      matched: 2,
      changed: 1,
      missing: 0,
    });
    expect(teams[0].players[0].second_name).toBe('');
  });

  it('uses the club to disambiguate duplicate names and refreshes all protocol fields', () => {
    const teams = [
      {
        players: [
          {
            surname: 'Коваль',
            name: 'Олександр',
            second_name: '',
            club_id: 2,
            sport_title: '',
          },
        ],
      },
    ];
    const portalTeams = [
      {
        players: [
          { id: 1, surname: 'Коваль', name: 'Олександр', second_name: 'Перший', club_id: 1 },
          {
            id: 2,
            surname: 'Коваль',
            name: 'Олександр',
            second_name: 'Петрович',
            club_id: '2',
            sport_title: 'КМСУ',
          },
        ],
      },
    ];

    expect(refreshTournamentPlayerDetails(teams, portalTeams)).toEqual({
      total: 1,
      matched: 1,
      changed: 1,
      missing: 0,
    });
    expect(teams[0].players[0]).toEqual({
      surname: 'Коваль',
      name: 'Олександр',
      second_name: 'Петрович',
      club_id: 2,
      sport_title: 'КМСУ',
    });
  });

  it('does not guess between duplicate names when no club identifies the player', () => {
    const player = { surname: 'Коваль', name: 'Олександр', second_name: '' };
    const teams = [{ players: [player] }, { players: [] }];
    const portalTeams = [
      {
        players: [
          { id: 1, surname: 'Коваль', name: 'Олександр', second_name: 'Перший' },
          { id: 2, surname: 'Коваль', name: 'Олександр', second_name: 'Другий' },
        ],
      },
    ];

    expect(refreshTournamentPlayerDetails(teams, portalTeams)).toEqual({
      total: 1,
      matched: 0,
      changed: 0,
      missing: 1,
    });
    expect(teams[0].players[0]).toBe(player);
  });

  it('ignores missing portal fields and refuses to erase required names', () => {
    const player = { id: 5, surname: 'Іванов', name: 'Олег', second_name: 'Петрович' };
    const teams = [{ players: [player] }];
    const portalTeams = [{ players: [{ id: 5, surname: '', name: null }] }];

    expect(refreshTournamentPlayerDetails(teams, portalTeams).changed).toBe(0);
    expect(teams[0].players[0]).toBe(player);
  });
});

describe('formatDateToHumanReadable', () => {
  it('formats ISO date string to Ukrainian format', () => {
    const result = formatDateToHumanReadable('2024-03-15');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
    expect(result).toContain('року');
  });

  it('returns empty string for empty input', () => {
    expect(formatDateToHumanReadable('')).toBe('');
    expect(formatDateToHumanReadable(null)).toBe('');
    expect(formatDateToHumanReadable(undefined)).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDateToHumanReadable('not-a-date')).toBe('');
  });
});

describe('getTeamPlaceInGroups', () => {
  it('returns range for 1st place with 4 groups', () => {
    expect(getTeamPlaceInGroups(1, 4)).toBe('1-4');
  });

  it('returns range for 2nd place with 4 groups', () => {
    expect(getTeamPlaceInGroups(2, 4)).toBe('7-8');
  });

  it('returns range for 3rd place with 2 groups', () => {
    expect(getTeamPlaceInGroups(3, 2)).toBe('5-6');
  });

  it('handles string place value', () => {
    expect(getTeamPlaceInGroups('1', 3)).toBe('1-3');
  });
});

describe('getAllTeams', () => {
  it('flattens groups and assigns place to each team', () => {
    const groups = [
      [{ title: 'A' }, { title: 'B' }],
      [{ title: 'C' }, { title: 'D' }],
    ];
    const result = getAllTeams(groups);
    expect(result).toHaveLength(4);
    expect(result[0].place).toBe(1);
    expect(result[1].place).toBe(2);
    expect(result[2].place).toBe(1);
    expect(result[3].place).toBe(2);
  });

  it('returns empty array for empty groups', () => {
    expect(getAllTeams([])).toEqual([]);
  });
});

describe('countPlayers', () => {
  it('counts total players across all teams', () => {
    const teams = [
      { players: [{ id: 1 }, { id: 2 }] },
      { players: [{ id: 3 }] },
      { players: [{ id: 4 }, { id: 5 }, { id: 6 }] },
    ];
    expect(countPlayers(teams)).toBe(6);
  });

  it('returns 0 for empty teams array', () => {
    expect(countPlayers([])).toBe(0);
  });

  it('handles teams with single player', () => {
    const teams = [{ players: [{ id: 1 }] }, { players: [{ id: 2 }] }];
    expect(countPlayers(teams)).toBe(2);
  });
});

describe('chunkParticipants', () => {
  it('splits list into chunks of given size', () => {
    const list = Array.from({ length: 60 }, (_, i) => ({ title: `Team ${i}` }));
    const chunks = chunkParticipants(list, 28);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(28);
    expect(chunks[1]).toHaveLength(28);
    expect(chunks[2]).toHaveLength(4);
  });

  it('returns single chunk if list is smaller than chunk size', () => {
    const list = [{ title: 'A' }, { title: 'B' }];
    const chunks = chunkParticipants(list, 28);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(2);
  });

  it('returns empty array for null/undefined input', () => {
    expect(chunkParticipants(null, 28)).toEqual([]);
    expect(chunkParticipants(undefined, 28)).toEqual([]);
  });

  it('returns empty array for empty list', () => {
    expect(chunkParticipants([], 28)).toEqual([]);
  });
});

describe('buildTeamTitle', () => {
  it('uses the correct adjective for a Kyiv team title', () => {
    const players = [
      { club_id: 1, surname: 'Гравець' },
      { club_id: 1, surname: 'Спортсмен' },
    ];

    expect(buildTeamTitle(players, {}, 1).title).toBe('Команда Київської області 1');
  });

  it('maps the latest Lviv clubs to the Lviv region', () => {
    const players = [
      { club_id: 29, surname: 'Рожок' },
      { club_id: 30, surname: 'Попович' },
    ];

    expect(buildTeamTitle(players, {}, 1).title).toContain('Львівської області');
  });

  it('maps the Novik Titans club to the Volyn region', () => {
    const players = [
      { club_id: 31, surname: 'Гравець' },
      { club_id: 31, surname: 'Спортсмен' },
    ];

    expect(buildTeamTitle(players, {}, 1).title).toContain('Волинської області');
  });

  it('builds region-based title when all players from same region', () => {
    const players = [
      { club_id: 1, surname: 'Іванов' },
      { club_id: 1, surname: 'Петров' },
    ];
    const titleCounts = {};
    const result = buildTeamTitle(players, titleCounts, 1);
    expect(result.title).toContain('Команда');
    expect(result.title).toContain('області');
  });

  it('increments count for repeated region teams', () => {
    const players = [
      { club_id: 7, surname: 'Іванов' },
      { club_id: 7, surname: 'Петров' },
    ];
    const titleCounts = {};
    const result1 = buildTeamTitle(players, titleCounts, 1);
    expect(result1.title).toContain('1');

    const result2 = buildTeamTitle(players, titleCounts, 1);
    expect(result2.title).toContain('2');
  });

  it('builds mixed team title when players from different regions', () => {
    const players = [
      { club_id: 1, surname: 'Іванов' },
      { club_id: 7, surname: 'Петров' },
    ];
    const titleCounts = {};
    const result = buildTeamTitle(players, titleCounts, 1);
    expect(result.title).toBe('Збірна команда 1');
    expect(result.mixedTeamCount).toBe(2);
  });

  it('uses captain surname when no region found', () => {
    const players = [
      { club_id: 999, surname: 'Тестенко', name: 'Олег' },
      { club_id: 999, surname: 'Іванов', name: 'Петро' },
    ];
    const titleCounts = {};
    const result = buildTeamTitle(players, titleCounts, 1);
    expect(result.title).toBe('Команда Тестенко');
  });

  it('handles surname with slash (takes first part)', () => {
    const players = [
      { club_id: 999, surname: 'Тест/Інший', name: 'Олег' },
      { club_id: 999, surname: 'Іванов', name: 'Петро' },
    ];
    const titleCounts = {};
    const result = buildTeamTitle(players, titleCounts, 1);
    expect(result.title).toBe('Команда Тест');
  });
});
