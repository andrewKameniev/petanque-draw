// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/stores/main', () => ({ useMainStore: vi.fn(() => ({})) }));
vi.mock('@/services/db', () => ({
  tournamentService: {
    getOne: vi.fn(),
    subscribe: vi.fn(),
    subscribePath: vi.fn(),
    updatePath: vi.fn(),
  },
}));
vi.mock('@/services/live-tournament', () => ({
  createLiveTournamentSource: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

const { default: Public } = await import('@/views/Public.vue');

describe('Public TIR winner card', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('shows the persisted tie-break winner when the final scores are equal', () => {
    wrapper = shallowMount(Public, {
      data: () => ({
        tournament: {
          id: 'tir-final',
          name: 'TIR Final',
          system: 'tir',
          teams: [],
          tirParticipants: [{ name: 'Player One' }, { name: 'Player Two' }],
          tirPlayoff: {
            final: {
              player1: 'Player One',
              player2: 'Player Two',
              score1: 7,
              score2: 7,
              complete: true,
              winner: 'Player One',
              loser: 'Player Two',
              tieWinner: 1,
            },
          },
          tournamentIsFinished: true,
          preferences: {},
        },
      }),
      global: {
        mocks: {
          $route: { query: { ref: 'owner.2n9c' } },
          $t: (key) => key,
          $i18n: { locale: 'en' },
        },
        stubs: {
          PublicPageShell: { template: '<main><slot /></main>' },
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const winnerCard = wrapper.get('.winner-card');
    expect(winnerCard.get('.winner-card__team-name').text()).toBe('Player One');
    expect(winnerCard.text()).not.toContain('Player Two');
  });
});
