// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDoubleEliminationBracket } from '@/services/playoff';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/i18n', () => ({ default: { global: { t: (key) => key } } }));
vi.mock('@/services/db', () => ({
  userMapService: { getAll: vi.fn(), set: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  remove: vi.fn(),
  set: vi.fn(),
}));

const { default: DoubleElimination } = await import('@/components/partials/DoubleElimination.vue');
const { useMainStore } = await import('@/stores/main');

function createTournament() {
  const teams = Array.from({ length: 4 }, (_, index) => ({ title: `Team ${index + 1}`, players: [] }));
  const bracket = buildDoubleEliminationBracket(teams);
  return {
    teams,
    playOff: bracket.stages[0].teams,
    playOffBracket: bracket,
    playOffStage: 'upper-1',
    roundTimer: { timerStatus: 'not_started', remainingMs: 0 },
    preferences: {
      cochonettes: 1,
      cochonettesEnabledPlayoff: true,
      fieldsStart: 1,
      maxScore: 13,
      noTimeLimitFinale: false,
      playoffTimeLimit: 30,
      timeLimitEnabled: true,
    },
  };
}

describe('double-elimination playoff timer', () => {
  let pinia;
  let store;
  let tournament;
  let wrapper;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useMainStore();
    tournament = createTournament();
    store.tournaments = { test: tournament };
    store.currentTournamentIndex = 'test';
    vi.spyOn(store, '_syncPath').mockImplementation(() => undefined);
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  function mountDoubleElimination(props = {}) {
    wrapper = mount(DoubleElimination, {
      props,
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
        stubs: {
          BracketFullscreenButton: true,
          PlayoffHeader: true,
          PlayoffMatchPanel: true,
        },
      },
    });
    return wrapper;
  }

  it('lets an admin start the timer during an active double-elimination stage', async () => {
    mountDoubleElimination();

    const startButton = wrapper.get('.round-timer-controls__start');
    await startButton.trigger('click');

    expect(store.currentTournament.roundTimer).toMatchObject({
      timerStatus: 'running',
      timeLimitMinutes: 30,
    });
    expect(wrapper.find('.round-timer').exists()).toBe(true);
  });

  it('shows the active double-elimination timer in the public round view', () => {
    tournament.roundTimer = { timerStatus: 'paused', remainingMs: 65_000 };

    mountDoubleElimination({
      activeTournament: tournament,
      isPublicView: true,
      hideHeader: true,
      matchesOnly: true,
    });

    expect(wrapper.get('.round-timer').text()).toContain('1:05');
  });

  it('clears the timer when the admin saves the active stage', () => {
    tournament.roundTimer = { timerStatus: 'paused', remainingMs: 65_000 };
    tournament.playOffBracket.stages[0].teams.forEach((match) => {
      match.team_1_score = 13;
      match.team_2_score = 7;
    });
    mountDoubleElimination();

    wrapper.vm.saveCurrentStage();

    expect(store.currentTournament.roundTimer).toBeNull();
  });
});
