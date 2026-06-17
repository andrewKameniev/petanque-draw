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
} from '../protocol-helpers';

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

  it('matches regardless of name order (surname first or name first)', () => {
    expect(getPlayerThirdName('Сидоренко', 'Максим', playersNames)).toBe('Вікторович');
  });

  it('is case-insensitive', () => {
    expect(getPlayerThirdName('іванов', 'олег', playersNames)).toBe('Петрович');
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
