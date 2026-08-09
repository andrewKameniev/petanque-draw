// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMocks = vi.hoisted(() => ({
  update: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/i18n', () => ({ default: { global: { t: (key) => key } } }));
vi.mock('@/services/db', () => ({
  userMapService: { getAll: vi.fn(), set: vi.fn(), update: vi.fn(), remove: vi.fn() },
  collaboratorService: { add: vi.fn(), remove: vi.fn(), findUserByEmail: vi.fn() },
}));
vi.mock('firebase/database', () => ({
  get: vi.fn(() => Promise.resolve({ exists: () => false, val: () => null })),
  getDatabase: vi.fn(() => 'database'),
  onValue: vi.fn(() => vi.fn()),
  ref: vi.fn((_database, path) => path),
  remove: vi.fn(() => Promise.resolve()),
  set: vi.fn(() => Promise.resolve()),
  update: (...args) => firebaseMocks.update(...args),
}));

const { default: Results } = await import('@/components/partials/Results.vue');
const { useMainStore } = await import('@/stores/main');

const EditResultModalStub = {
  name: 'EditResultModal',
  props: ['game'],
  emits: ['close', 'save'],
  template: '<button data-testid="save-edited-result" @click="$emit(\'save\', { score1: 7, score2: 13 })" />',
};

function createSharedTournament() {
  return {
    id: 'shared-1',
    _ownerUid: 'owner-1',
    activeGroup: 'A',
    main: {
      system: 'groups',
      games: [
        [
          {
            team_1: 'Alpha',
            team_2: 'Beta',
            team_1_score: 13,
            team_2_score: 5,
            winner: 'Alpha',
            status: 'finished',
          },
        ],
      ],
      teams: [
        { title: 'Alpha', wins: 1, opponents: ['Beta'], pointsPlus: 13, pointsMinus: 5 },
        { title: 'Beta', wins: 0, opponents: ['Alpha'], pointsPlus: 5, pointsMinus: 13 },
      ],
      preferences: {},
    },
  };
}

describe('Results shared-tournament persistence', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    store = useMainStore();
    store.user = { uid: 'collaborator-1', email: 'collaborator@example.com' };
    store.currentTournamentIndex = 'shared-1';
    store.tournaments = { 'shared-1': createSharedTournament() };
    store.userTournamentMap = {
      'shared-1': { ownerUid: 'owner-1', role: 'admin', status: 'active' },
    };
    wrapper = mount(Results, {
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
        stubs: {
          Bracket: true,
          EditResultModal: EditResultModalStub,
          Game: true,
        },
      },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('atomically writes the edited game and recalculated teams under the owner UID', async () => {
    const showMessage = vi.spyOn(store, 'showMessage');

    await wrapper.get('.edit-result-btn').trigger('click');
    await wrapper.get('[data-testid="save-edited-result"]').trigger('click');
    await flushPromises();

    expect(firebaseMocks.update).toHaveBeenCalledTimes(1);
    expect(firebaseMocks.update).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({
        'owner-1/tournaments/shared-1/main/games/0/0': expect.objectContaining({
          team_1: 'Alpha',
          team_2: 'Beta',
          team_1_score: 7,
          team_2_score: 13,
          winner: 'Beta',
          status: 'finished',
        }),
        'owner-1/tournaments/shared-1/main/teams/0/wins': 0,
        'owner-1/tournaments/shared-1/main/teams/0/opponents': ['Beta'],
        'owner-1/tournaments/shared-1/main/teams/0/pointsPlus': 7,
        'owner-1/tournaments/shared-1/main/teams/0/pointsMinus': 13,
        'owner-1/tournaments/shared-1/main/teams/1/wins': 1,
        'owner-1/tournaments/shared-1/main/teams/1/opponents': ['Alpha'],
        'owner-1/tournaments/shared-1/main/teams/1/pointsPlus': 13,
        'owner-1/tournaments/shared-1/main/teams/1/pointsMinus': 7,
        'publicTournaments/owner-1/shared-1/record/main/games/0/0': expect.any(Object),
        'publicTournaments/owner-1/shared-1/record/main/teams/0/wins': 0,
        'publicTournaments/owner-1/shared-1/record/main/teams/1/wins': 1,
        'publicTournaments/owner-1/shared-1/schemaVersion': 1,
        'publicTournaments/owner-1/shared-1/revision': { '.sv': { increment: 1 } },
        'publicTournaments/owner-1/shared-1/updatedAt': { '.sv': 'timestamp' },
      }),
    );
    expect(Object.keys(firebaseMocks.update.mock.calls[0][1])).not.toEqual(
      expect.arrayContaining([expect.stringContaining('collaborator-1/tournaments')]),
    );
    expect(showMessage).toHaveBeenCalledWith({
      title: 'messages.success',
      text: 'results.resultUpdated',
    });
    expect(wrapper.find('[data-testid="save-edited-result"]').exists()).toBe(false);
  });

  it('keeps the editor open and reports an error when the atomic write fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const showMessage = vi.spyOn(store, 'showMessage');
    firebaseMocks.update.mockRejectedValueOnce(new Error('write failed'));

    await wrapper.get('.edit-result-btn').trigger('click');
    await wrapper.get('[data-testid="save-edited-result"]').trigger('click');
    await flushPromises();

    expect(showMessage).toHaveBeenCalledWith({
      title: 'messages.error',
      text: 'messages.failedSaving',
      type: 'error',
    });
    expect(showMessage).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'messages.success' }));
    expect(wrapper.get('[data-testid="save-edited-result"]').exists()).toBe(true);
    consoleError.mockRestore();
  });
});
