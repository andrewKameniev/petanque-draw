// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';

vi.stubGlobal('localStorage', {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
});

vi.mock('@/firebase', () => ({ database: {} }));
vi.mock('@/services/db', () => ({
  userMapService: { set: vi.fn(), update: vi.fn(), remove: vi.fn(), getAll: vi.fn() },
  collaboratorService: { add: vi.fn(), remove: vi.fn(), findUserByEmail: vi.fn() },
}));
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(),
  ref: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(() => Promise.resolve({ exists: () => false })),
  remove: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  onValue: vi.fn(),
}));

const { default: PlayoffConfirmModal } = await import('@/components/partials/PlayoffConfirmModal.vue');
const { default: TeamsList } = await import('@/components/partials/TeamsList.vue');
const { useMainStore } = await import('@/stores/main');

describe('Tournament B withdrawal UI', () => {
  let pinia;
  let store;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useMainStore();
    store.user = { uid: 'owner-1', email: 'owner@example.com' };
    store.addTournament();
  });

  it('offers a withdrawal button for active Tournament B teams', async () => {
    store.initTournamentB([{ title: 'B team', opponents: [] }, { title: 'Opponent', opponents: [] }]);
    store.currentTournament.activeGroup = 'B';
    store.activeTournament.games = [
      [{ team_1: 'B team', team_1_score: null, team_2: 'Opponent', team_2_score: null, status: 'not_started' }],
    ];
    store.activeTournament.roundIsActive = true;
    const withdraw = vi.spyOn(store, 'withdrawTournamentBTeam').mockResolvedValue(true);
    const wrapper = shallowMount(TeamsList, {
      props: { activeRound: 1 },
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
        stubs: { ParticipantGames: true, PlayerChip: true },
      },
    });

    await wrapper.get('[data-testid="btn-withdraw-team"]').trigger('click');

    expect(withdraw).toHaveBeenCalledWith('B team');
  });

  it('does not show Tournament A teams in the Tournament B playoff modal', async () => {
    const wrapper = shallowMount(PlayoffConfirmModal, {
      props: {
        isSwiss: true,
        isTournamentB: true,
        teamsCount: 2,
        rankingTeams: [{ title: 'A team' }],
      },
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
        stubs: { Modal: { template: '<div><slot /></div>' } },
      },
    });

    await wrapper.setData({ showAdvanced: true });

    expect(wrapper.find('.confirm-playoff__withdraw-list').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('A team');
  });
});
