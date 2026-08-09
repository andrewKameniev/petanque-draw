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
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
}));

const { default: Draw } = await import('@/components/Draw.vue');
const { useMainStore } = await import('@/stores/main');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth');

const wrappers = [];

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('Draw explicit auth lifecycle', () => {
  let pinia;
  let store;
  let privateBootstrap;

  function mountDraw() {
    const wrapper = mount(Draw, {
      global: {
        plugins: [pinia],
        mocks: {
          $route: { path: '/', query: {} },
          $router: { replace: vi.fn(), push: vi.fn() },
          $store: { dispatch: privateBootstrap },
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
    return wrapper;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    pinia = createPinia();
    setActivePinia(pinia);
    store = useMainStore();
    store.user = false;
    store.tournaments = {};
    store.currentTournamentIndex = null;
    privateBootstrap = vi.fn();
  });

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.restoreAllMocks();
  });

  it('synchronizes the email index after explicit account registration', async () => {
    const user = { uid: 'registered-user', email: 'registered@example.com' };
    createUserWithEmailAndPassword.mockResolvedValue({ user });
    const loginUser = vi.spyOn(store, 'loginUser');
    const syncUserEmailIndex = vi.spyOn(store, 'syncUserEmailIndex').mockResolvedValue();
    const wrapper = mountDraw();
    await wrapper.setData({
      email: 'registered@example.com',
      password: 'secret1',
      passwordConfirm: 'secret1',
      registerShow: true,
    });

    wrapper.vm.loginOrRegister();
    await flushPromises();

    expect(loginUser).toHaveBeenCalledWith(user);
    expect(syncUserEmailIndex).toHaveBeenCalledWith(user);
    expect(privateBootstrap).toHaveBeenCalledWith('getTournaments');
  });

  it('synchronizes the email index after explicit sign-in', async () => {
    const user = { uid: 'returning-user', email: 'returning@example.com' };
    signInWithEmailAndPassword.mockResolvedValue({ user });
    const loginUser = vi.spyOn(store, 'loginUser');
    const syncUserEmailIndex = vi.spyOn(store, 'syncUserEmailIndex').mockResolvedValue();
    const wrapper = mountDraw();
    await wrapper.setData({ email: 'returning@example.com', password: 'secret1', registerShow: false });

    wrapper.vm.loginOrRegister();
    await flushPromises();

    expect(loginUser).toHaveBeenCalledWith(user);
    expect(syncUserEmailIndex).toHaveBeenCalledWith(user);
    expect(privateBootstrap).toHaveBeenCalledWith('getTournaments');
  });
});
