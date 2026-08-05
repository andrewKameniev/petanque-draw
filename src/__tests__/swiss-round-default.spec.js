import { beforeAll, describe, expect, it } from 'vitest';

let SetupCard;

beforeAll(async () => {
  ({ default: SetupCard } = await import('@/components/partials/SetupCard.vue'));
});

describe('Swiss round recommendation default', () => {
  it('replaces the initial one round with the recommended count', () => {
    const context = {
      tournament: { preferences: { swissRoundsCount: 1 } },
      lastRecommendedSwissRounds: 1,
    };

    SetupCard.watch.optimalSwissRounds.handler.call(context, 4);

    expect(context.tournament.preferences.swissRoundsCount).toBe(4);
    expect(context.lastRecommendedSwissRounds).toBe(4);
  });

  it('preserves a custom round count when the recommendation changes', () => {
    const context = {
      tournament: { preferences: { swissRoundsCount: 6 } },
      lastRecommendedSwissRounds: 4,
    };

    SetupCard.watch.optimalSwissRounds.handler.call(context, 5);

    expect(context.tournament.preferences.swissRoundsCount).toBe(6);
    expect(context.lastRecommendedSwissRounds).toBe(5);
  });
});
