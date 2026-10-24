import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined, removeItem: () => undefined });
const { default: Games } = await import('@/components/partials/Games.vue');

describe('Swiss Group B round draw', () => {
  it('does not create a third round from a repeated draw action', () => {
    const teams = Array.from({ length: 6 }, (_, index) => ({
      title: `B${index + 1}`,
      wins: 0,
      opponents: [],
      pointsPlus: 0,
      pointsMinus: 0,
    }));
    const tournament = {
      system: 'swiss',
      games: [],
      teams,
      roundIsActive: false,
      preferences: { fieldsStart: 1 },
    };
    const context = {
      tournament,
      rankingTeams: teams,
      activeRound: 1,
      addRoundToGames: vi.fn((round) => {
        tournament.games.push(round);
        tournament.roundIsActive = true;
      }),
      startRound: vi.fn(),
    };

    Games.methods.drawRound.call(context);
    Games.methods.drawRound.call(context);

    expect(tournament.games).toHaveLength(1);
    expect(context.addRoundToGames).toHaveBeenCalledTimes(1);
  });
});
