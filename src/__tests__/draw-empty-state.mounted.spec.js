// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/i18n', () => ({ default: { global: { t: (key) => key } } }));
vi.mock('@/services/db', () => ({
  userMapService: { getAll: vi.fn(), set: vi.fn(), update: vi.fn(), remove: vi.fn() },
  collaboratorService: { add: vi.fn(), remove: vi.fn(), findUserByEmail: vi.fn() },
}));
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
}));

const { default: Draw } = await import('@/components/Draw.vue');
const { useMainStore } = await import('@/stores/main');

const wrappers = [];

describe('Draw empty tournament state', () => {
  let pinia;
  let store;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useMainStore();
    store.user = { uid: 'user-1', email: 'user@example.com' };
    store.tournaments = {};
    store.currentTournamentIndex = null;
  });

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.restoreAllMocks();
  });

  it('offers an explicit create action instead of rendering an implicit empty tournament', async () => {
    const addTournament = vi.spyOn(store, 'addTournament').mockImplementation(() => true);
    const wrapper = mount(Draw, {
      global: {
        plugins: [pinia],
        mocks: {
          $route: { path: '/', query: {} },
          $router: { replace: vi.fn(), push: vi.fn() },
          $t: (key) => key,
        },
        stubs: {
          Footer: true,
          Help: true,
          Menu: true,
          Message: true,
          Navbar: true,
          PageLoader: true,
          Tournament: true,
        },
      },
    });
    wrappers.push(wrapper);

    expect(wrapper.get('[data-testid="tournament-empty-state"]').isVisible()).toBe(true);
    expect(wrapper.text()).toContain('common.noActiveTournamentsTitle');
    expect(wrapper.text()).toContain('common.noActiveTournamentsText');

    await wrapper.get('[data-testid="create-tournament-empty"]').trigger('click');

    expect(addTournament).toHaveBeenCalledTimes(1);
  });
});
