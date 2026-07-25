import { afterEach, describe, expect, it, vi } from 'vitest';
import { assignLanes } from '@/services/draw';
import { getAvailableLaneNumbers, getGameLaneNumber, parseExcludedLaneNumbers } from '@/services/lanes';
import { getGameStreams } from '@/services/streams';

function makeTournament(teamCount = 14) {
  return {
    system: 'swiss',
    teams: Array.from({ length: teamCount }, (_, index) => ({
      title: `Team ${index + 1}`,
      lanes: [],
    })),
    preferences: {
      fieldsStart: 1,
      lanesPoolEnabled: true,
      lanesPoolFrom: 1,
      lanesPoolTo: 16,
      lanesExcluded: '8,9,10',
    },
  };
}

function makeGames(tournament) {
  const games = [];
  for (let index = 0; index < tournament.teams.length; index += 2) {
    games.push({
      team_1: tournament.teams[index].title,
      team_2: tournament.teams[index + 1].title,
      team_1_score: null,
      team_2_score: null,
      status: 'not_started',
    });
  }
  return games;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lane pool configuration', () => {
  it('builds the configured range without excluded or duplicate lane numbers', () => {
    const tournament = makeTournament();
    tournament.preferences.lanesExcluded = '8, 9, 10, 9, invalid';

    expect(parseExcludedLaneNumbers(tournament.preferences.lanesExcluded)).toEqual([8, 9, 10]);
    expect(getAvailableLaneNumbers(tournament, 7)).toEqual([1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 15, 16]);
  });

  it('randomizes equal-weight assignments across the full pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const tournament = makeTournament();

    const assignedLaneNumbers = assignLanes(makeGames(tournament), tournament).map((game) => game.lane + 1);

    expect(assignedLaneNumbers).toHaveLength(7);
    expect(assignedLaneNumbers.some((lane) => lane > 10)).toBe(true);
    expect(assignedLaneNumbers.every((lane) => lane >= 1 && lane <= 16)).toBe(true);
    expect(assignedLaneNumbers).not.toContain(8);
    expect(assignedLaneNumbers).not.toContain(9);
    expect(assignedLaneNumbers).not.toContain(10);
  });
});

describe('assigned lane display and streams', () => {
  it('uses the stored assigned lane instead of the game position', () => {
    const tournament = makeTournament();

    expect(getGameLaneNumber({ lane: 14 }, tournament, 0)).toBe(15);
    expect(getGameLaneNumber({}, tournament, 2)).toBe(3);
  });

  it('resolves lane stream presets from the assigned lane', () => {
    const tournament = makeTournament();
    tournament.streamPresets = {
      lanes: {
        15: ['https://example.com/lane-15'],
      },
    };

    expect(getGameStreams({ team_1: 'Team 1', team_2: 'Team 2', lane: 14 }, tournament, 0)).toEqual([
      'https://example.com/lane-15',
    ]);
  });
});
