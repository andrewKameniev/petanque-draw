import { beforeEach, describe, expect, it, vi } from 'vitest';

const startup = vi.hoisted(() => {
  const state = {
    authListener: null,
    authReadyResolve: null,
    beforeGuard: null,
    afterHook: null,
  };

  state.app = {
    mount: vi.fn(),
    use: vi.fn(() => state.app),
  };
  state.auth = {
    currentUser: null,
    authStateReady: vi.fn(),
  };
  state.store = {
    currentTournamentIndex: null,
    getTournaments: vi.fn(() => Promise.resolve()),
    loginUser: vi.fn((user) => {
      const previousUid = state.store.user?.uid;
      if (previousUid && previousUid !== user?.uid) state.store.tournaments = {};
      state.store.user = user;
    }),
    tournaments: {},
    user: false,
  };
  state.router = {
    afterEach: vi.fn((hook) => {
      state.afterHook = hook;
    }),
    beforeEach: vi.fn((guard) => {
      state.beforeGuard = guard;
    }),
    currentRoute: { value: { path: '/', query: {} } },
  };
  state.onAuthStateChanged = vi.fn((_auth, listener) => {
    state.authListener = listener;
  });
  state.loadLocaleModule = vi.fn(() => Promise.resolve());

  return state;
});

vi.mock('vue', () => ({ createApp: () => startup.app }));
vi.mock('pinia', () => ({ createPinia: () => ({}) }));
vi.mock('vue-router', () => ({
  createRouter: () => startup.router,
  createWebHashHistory: () => ({}),
}));
vi.mock('firebase/auth', () => ({ onAuthStateChanged: (...args) => startup.onAuthStateChanged(...args) }));
vi.mock('@/firebase', () => ({ auth: startup.auth }));
vi.mock('@/i18n', () => ({
  default: {},
  loadLocaleModule: (...args) => startup.loadLocaleModule(...args),
}));
vi.mock('@/stores/main', () => ({ useMainStore: () => startup.store }));
vi.mock('@/services/tournament-ref', () => ({ encodeTournamentRef: vi.fn() }));
vi.mock('@/App.vue', () => ({ default: {} }));

function createAuthReadyPromise() {
  return new Promise((resolve) => {
    startup.authReadyResolve = resolve;
  });
}

function createDeferred() {
  let resolve;
  const promise = new Promise((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

async function importStartup() {
  await import('@/main');
  expect(startup.beforeGuard).toEqual(expect.any(Function));
}

async function resolveInitialAuth() {
  startup.authReadyResolve();
  await flushPromises();
}

describe('application auth startup', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    startup.authListener = null;
    startup.authReadyResolve = null;
    startup.beforeGuard = null;
    startup.afterHook = null;
    startup.auth.currentUser = { uid: 'signed-in-user', email: 'signed-in@example.com' };
    startup.auth.authStateReady.mockReturnValue(createAuthReadyPromise());
    startup.router.currentRoute.value = { path: '/', query: {} };
    startup.store.currentTournamentIndex = null;
    startup.store.tournaments = {};
    startup.store.user = false;
    startup.store.getTournaments.mockResolvedValue();
    startup.store.loginUser.mockImplementation((user) => {
      const previousUid = startup.store.user?.uid;
      if (previousUid && previousUid !== user?.uid) startup.store.tournaments = {};
      startup.store.user = user;
    });
  });

  it('mounts before auth resolves', async () => {
    await importStartup();

    expect(startup.app.mount).toHaveBeenCalledWith('#app');
    expect(startup.store.loginUser).not.toHaveBeenCalled();
  });

  it('never bootstraps private data when auth wins the race with lazy public navigation', async () => {
    await importStartup();

    await resolveInitialAuth();
    await startup.beforeGuard({ name: 'view', path: '/tournament', query: { ref: 'encoded' }, meta: {} });

    expect(startup.store.loginUser).toHaveBeenCalledWith(startup.auth.currentUser);
    expect(startup.store.getTournaments).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'view', path: '/tournament', query: { ref: 'encoded' } },
    { name: 'tv', path: '/tv', query: { ref: 'encoded' } },
    { name: 'PublicStats', path: '/stats/share', query: { ref: 'encoded' } },
    { name: 'PublicSlug', path: '/public/finals', query: {} },
  ])('allows direct $path navigation to finish before auth', async (to) => {
    await importStartup();

    await startup.beforeGuard({ ...to, meta: {} });

    expect(startup.store.loginUser).not.toHaveBeenCalled();
    expect(startup.store.getTournaments).not.toHaveBeenCalled();

    startup.router.currentRoute.value = to;
    await resolveInitialAuth();

    expect(startup.store.loginUser).toHaveBeenCalledWith(startup.auth.currentUser);
    expect(startup.store.getTournaments).not.toHaveBeenCalled();
  });

  it('keeps private navigation gated on auth and loads its requested tournament', async () => {
    await importStartup();

    let navigationFinished = false;
    const navigation = startup
      .beforeGuard({
        name: 'Statistics',
        path: '/stats',
        query: { t: 'private-tournament' },
        meta: { requiresAuth: true },
      })
      .then(() => {
        navigationFinished = true;
      });
    await flushPromises();

    expect(navigationFinished).toBe(false);
    expect(startup.store.getTournaments).not.toHaveBeenCalled();

    await resolveInitialAuth();
    await navigation;

    expect(startup.store.getTournaments).toHaveBeenCalledWith({ routeQueryT: 'private-tournament' });
    expect(startup.store.getTournaments).toHaveBeenCalledTimes(1);
    expect(startup.loadLocaleModule).toHaveBeenCalledWith('stat');
  });

  it('redirects a signed-out private navigation without loading account data', async () => {
    startup.auth.currentUser = null;
    await importStartup();

    const navigation = startup.beforeGuard({
      name: 'Statistics',
      path: '/stats',
      query: { t: 'private-tournament' },
      meta: { requiresAuth: true },
    });
    await resolveInitialAuth();

    await expect(navigation).resolves.toBe('/');
    expect(startup.store.loginUser).toHaveBeenCalledWith(false);
    expect(startup.store.getTournaments).not.toHaveBeenCalled();
  });

  it('loads private data when a signed-in public visitor navigates into the editor', async () => {
    await importStartup();
    startup.router.currentRoute.value = { path: '/tournament', query: { ref: 'encoded' }, meta: {} };
    await resolveInitialAuth();
    vi.clearAllMocks();

    await startup.beforeGuard({ path: '/', name: 'public', query: { t: 'editor-tournament' }, meta: {} });

    expect(startup.store.getTournaments).toHaveBeenCalledWith({ routeQueryT: 'editor-tournament' });
    expect(startup.store.getTournaments).toHaveBeenCalledTimes(1);
  });

  it('retains the selected tournament in the root route query', async () => {
    startup.store.currentTournamentIndex = 'selected-tournament';
    startup.store.tournaments = { 'selected-tournament': { id: 'selected-tournament' } };
    await importStartup();
    const navigation = startup.beforeGuard({ path: '/', name: 'public', query: {}, meta: {} });
    await resolveInitialAuth();

    await expect(navigation).resolves.toEqual({
      path: '/',
      query: { t: 'selected-tournament' },
    });
    expect(startup.store.getTournaments).not.toHaveBeenCalled();
  });

  it('retains private bootstrap when the signed-in user changes in-app', async () => {
    await importStartup();
    await resolveInitialAuth();
    vi.clearAllMocks();
    startup.router.currentRoute.value = {
      path: '/stats',
      query: { t: 'next-tournament' },
      meta: { requiresAuth: true },
    };
    const nextUser = { uid: 'next-user', email: 'next@example.com' };

    await startup.authListener(nextUser);

    expect(startup.store.loginUser).toHaveBeenCalledWith(nextUser);
    expect(startup.store.getTournaments).toHaveBeenCalledWith({ routeQueryT: 'next-tournament' });
  });

  it('restarts an in-flight private bootstrap when the user changes', async () => {
    await importStartup();
    startup.router.currentRoute.value = { path: '/tournament', query: {}, meta: {} };
    await resolveInitialAuth();
    vi.clearAllMocks();
    const firstLoad = createDeferred();
    startup.store.getTournaments.mockReturnValueOnce(firstLoad.promise).mockResolvedValueOnce();

    const navigation = startup.beforeGuard({
      name: 'Statistics',
      path: '/stats',
      query: { t: 'next-tournament' },
      meta: { requiresAuth: true },
    });
    await flushPromises();
    const nextUser = { uid: 'next-user', email: 'next@example.com' };
    await startup.authListener(nextUser);
    firstLoad.resolve();
    await navigation;

    expect(startup.store.getTournaments).toHaveBeenCalledTimes(2);
    expect(startup.store.getTournaments).toHaveBeenNthCalledWith(2, { routeQueryT: 'next-tournament' });
  });

  it('redirects when the user logs out during an in-flight private bootstrap', async () => {
    await importStartup();
    startup.router.currentRoute.value = { path: '/tournament', query: {}, meta: {} };
    await resolveInitialAuth();
    vi.clearAllMocks();
    const firstLoad = createDeferred();
    startup.store.getTournaments.mockReturnValueOnce(firstLoad.promise);

    const navigation = startup.beforeGuard({
      name: 'Statistics',
      path: '/stats',
      query: { t: 'private-tournament' },
      meta: { requiresAuth: true },
    });
    await flushPromises();
    await startup.authListener(false);
    firstLoad.resolve();

    await expect(navigation).resolves.toBe('/');
  });

  it('loads the next user after auth changes while a private locale is loading', async () => {
    await importStartup();
    startup.router.currentRoute.value = { path: '/tournament', query: {}, meta: {} };
    await resolveInitialAuth();
    startup.store.tournaments = { previous: { id: 'previous' } };
    vi.clearAllMocks();
    const localeLoad = createDeferred();
    startup.loadLocaleModule.mockReturnValueOnce(localeLoad.promise);

    const navigation = startup.beforeGuard({
      name: 'Statistics',
      path: '/stats',
      query: { t: 'next-tournament' },
      meta: { requiresAuth: true },
    });
    await flushPromises();
    await startup.authListener({ uid: 'next-user', email: 'next@example.com' });
    localeLoad.resolve();
    await navigation;

    expect(startup.store.getTournaments).toHaveBeenCalledOnce();
    expect(startup.store.getTournaments).toHaveBeenCalledWith({ routeQueryT: 'next-tournament' });
  });

  it('redirects after logout while a private locale is loading', async () => {
    await importStartup();
    startup.router.currentRoute.value = { path: '/tournament', query: {}, meta: {} };
    await resolveInitialAuth();
    startup.store.tournaments = { previous: { id: 'previous' } };
    vi.clearAllMocks();
    const localeLoad = createDeferred();
    startup.loadLocaleModule.mockReturnValueOnce(localeLoad.promise);

    const navigation = startup.beforeGuard({
      name: 'Statistics',
      path: '/stats',
      query: {},
      meta: { requiresAuth: true },
    });
    await flushPromises();
    await startup.authListener(false);
    localeLoad.resolve();

    await expect(navigation).resolves.toBe('/');
  });

  it('does not reload private data for a duplicate auth delivery of the current user', async () => {
    await importStartup();
    await resolveInitialAuth();
    vi.clearAllMocks();
    startup.router.currentRoute.value = {
      path: '/stats',
      query: { t: 'private-tournament' },
      meta: { requiresAuth: true },
    };

    await startup.authListener(startup.auth.currentUser);

    expect(startup.store.loginUser).toHaveBeenCalledWith(startup.auth.currentUser);
    expect(startup.store.getTournaments).not.toHaveBeenCalled();
  });
});
