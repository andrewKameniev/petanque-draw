import { describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/stores/main', () => ({ useMainStore: vi.fn() }));
vi.mock('@/components/partials/ThemeSwitcher.vue', () => ({ default: {} }));
vi.mock('@/components/partials/LanguageSwitcher.vue', () => ({ default: {} }));
vi.mock('@/components/Menu.vue', () => ({ default: {} }));
vi.mock('@/services/db', () => ({
  tournamentService: {
    getOne: vi.fn(),
    subscribe: vi.fn(),
    subscribePath: vi.fn(),
    updatePath: vi.fn(),
  },
}));

import Archived from '@/views/Archived.vue';
import Navbar from '@/components/Navbar.vue';
import Public from '@/views/Public.vue';
import TvDashboard from '@/views/TvDashboard.vue';
import { normalizeTournamentRecord } from '@/services/tournament-record';
import { createLiveTournamentSource } from '@/services/live-tournament';

const wrapper = normalizeTournamentRecord(
  {
    id: 'wrapper-1',
    name: 'Wrapper Cup',
    date: '2026-08-05',
    tournamentMessage: 'Wrapper message',
    portalIdTournament: '725',
    activeGroup: 'B',
    main: {
      system: 'swiss',
      teams: [{ title: 'A Team' }],
      games: [],
      preferences: {},
    },
    tournamentB: {
      system: 'playoff',
      teams: [{ title: 'B Team' }],
      games: [],
      preferences: {},
    },
  },
  { id: 'wrapper-1' },
);

const legacy = normalizeTournamentRecord(
  {
    id: 'legacy-1',
    name: 'Legacy Cup',
    date: '2025-06-07',
    tournamentMessage: 'Legacy message',
    system: 'groups',
    teams: [{ title: 'Legacy A' }],
    games: [],
    preferences: {},
    groupB: { teams: [{ title: 'Legacy B' }] },
  },
  { id: 'legacy-1' },
);

function createSubscribedService(record) {
  let bootstrapCallback;
  let bootstrapErrorCallback;
  const parentUnsubscribe = vi.fn();
  const pathUnsubscribe = vi.fn();
  const service = {
    getOne: vi.fn(),
    subscribe: vi.fn((_ownerUid, _tournamentId, callback, errorCallback) => {
      bootstrapCallback = callback;
      bootstrapErrorCallback = errorCallback;
      return parentUnsubscribe;
    }),
    subscribePath: vi.fn(() => pathUnsubscribe),
  };

  return {
    service,
    parentUnsubscribe,
    pathUnsubscribe,
    emit(value = record, exists = true) {
      bootstrapCallback({ exists: () => exists, val: () => value });
    },
    fail(error) {
      bootstrapErrorCallback(error);
    },
  };
}

describe('tournament-record UI consumers', () => {
  it.each([
    ['wrapper', wrapper, 'A Team', 'B Team'],
    ['legacy', legacy, 'Legacy A', 'Legacy B'],
  ])('selects public A and B data for a %s record', (_label, tournament, aTeam, bTeam) => {
    expect(Public.computed.activeTournamentView.call({ tournament, publicActiveGroup: 'A' }).teams[0].title).toBe(
      aTeam,
    );
    expect(Public.computed.activeTournamentView.call({ tournament, publicActiveGroup: 'B' }).teams[0].title).toBe(
      bTeam,
    );
    expect(Public.computed.hasTournamentB.call({ tournament })).toBe(true);
  });

  it.each([
    ['wrapper', wrapper, 'Wrapper Cup', '2026-08-05', 'swiss', 'Wrapper message'],
    ['legacy', legacy, 'Legacy Cup', '2025-06-07', 'groups', 'Legacy message'],
  ])(
    'builds Navbar metadata and competition summaries for a %s record',
    (_label, record, name, date, system, message) => {
      const [item] = Navbar.computed.sortedTournaments.call({ tournaments: { [record.id]: record } });
      expect(item).toMatchObject({ id: record.id, name, date, system, teamsCount: 1 });

      const tvContext = { tournamentRecord: record };
      expect(TvDashboard.computed.tournament.call(tvContext).system).toBe(system);
      expect(TvDashboard.computed.tournamentMetadata.call(tvContext).tournamentMessage).toBe(message);
    },
  );

  it.each([
    ['Public', Public],
    ['TV', TvDashboard],
  ])('%s resolves its Firebase source with the shared codec', (_label, component) => {
    const tournamentSource = component.computed.tournamentSource.call({
      $route: { query: { ref: 'owner.2n9c' } },
    });

    expect(tournamentSource).toEqual({
      type: 'firebase',
      ownerUid: 'owner',
      tournamentId: '123456',
      format: 'dotted',
    });
  });

  it.each([
    ['Public', Public],
    ['TV', TvDashboard],
  ])('%s delegates loading and unmount cleanup to the shared live source', async (_label, component) => {
    const tournamentSource = { type: 'firebase', ownerUid: 'owner', tournamentId: '123' };
    const liveSource = { start: vi.fn().mockResolvedValue(), stop: vi.fn() };
    const context = { _liveTournamentSource: liveSource, tournamentSource };

    await component.methods.getInfo.call(context);
    component.beforeUnmount.call(context);

    expect(liveSource.start).toHaveBeenCalledWith(tournamentSource);
    expect(liveSource.stop).toHaveBeenCalledTimes(1);
  });

  it('synchronizes Public tab and group selection only for tabbed tournaments', () => {
    const setSelection = vi.fn();
    const context = {
      liveStatus: 'loading',
      activeTournamentView: { system: 'swiss' },
      activeTab: 'results',
      publicActiveGroup: 'B',
      _liveTournamentSource: { setSelection },
    };

    Public.methods.syncLiveSelection.call(context);
    expect(setSelection).not.toHaveBeenCalled();

    context.liveStatus = 'ready';
    Public.methods.syncLiveSelection.call(context);
    expect(setSelection).toHaveBeenCalledWith({ tab: 'results', group: 'B' });

    context.activeTournamentView = { system: 'tir' };
    Public.methods.syncLiveSelection.call(context);
    expect(setSelection).toHaveBeenCalledTimes(1);
  });

  it('falls back to Public Group A when Group B disappears', () => {
    const context = { publicActiveGroup: 'B' };

    Public.watch.hasTournamentB.call(context, false);

    expect(context.publicActiveGroup).toBe('A');
  });

  it.each([
    ['wrapper', wrapper, 'Wrapper Cup', '2026-08-05', '725'],
    ['legacy', legacy, 'Legacy Cup', '2025-06-07', undefined],
  ])(
    'exposes archived metadata without competition-shape branching for a %s record',
    (_label, tournament, name, date, portalId) => {
      const tournamentMetadata = Archived.computed.tournamentMetadata.call({ tournament, activeKey: 'fallback' });
      expect(tournamentMetadata).toMatchObject({ name, date });
      expect(tournamentMetadata.portalIdTournament).toBe(portalId);
      expect(Archived.computed.activeTournament.call({ tournament }).teams).toHaveLength(1);
    },
  );

  it('createLiveTournamentSource emits ready with normalized record and updates on field changes', async () => {
    const states = [];
    const setup = createSubscribedService({
      id: 'wrapper-1',
      name: 'Wrapper Cup',
      date: '2026-08-05',
      portalIdTournament: '725',
      activeGroup: 'B',
      tournamentMessage: 'Wrapper message',
      main: { system: 'swiss', teams: [{ title: 'A Team' }], games: [], preferences: {} },
      tournamentB: { system: 'playoff', teams: [{ title: 'B Team' }], games: [], preferences: {} },
    });

    const liveSource = createLiveTournamentSource({
      profile: 'tv',
      service: setup.service,
      documentTarget: null,
      windowTarget: null,
      onState: (s) => states.push({ ...s }),
    });

    const started = liveSource.start({ type: 'firebase', ownerUid: 'owner', tournamentId: 'wrapper-1' });
    setup.emit();
    await started;

    expect(states[0].status).toBe('loading');
    const ready = states.find((s) => s.status === 'ready');
    expect(ready.record.name).toBe('Wrapper Cup');

    const publicView = Public.computed.activeTournamentView.call({ tournament: ready.record, publicActiveGroup: 'A' });
    expect(publicView.teams[0].title).toBe('A Team');

    const tvMeta = TvDashboard.computed.tournamentMetadata.call({ tournamentRecord: ready.record });
    expect(tvMeta.tournamentMessage).toBe('Wrapper message');

    expect(setup.service.getOne).not.toHaveBeenCalled();
    expect(setup.service.subscribe).toHaveBeenCalledTimes(1);
    expect(setup.service.subscribePath).toHaveBeenCalled();
    expect(setup.parentUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('createLiveTournamentSource emits missing when snapshot does not exist', async () => {
    const states = [];
    const setup = createSubscribedService(null);

    const liveSource = createLiveTournamentSource({
      profile: 'tv',
      service: setup.service,
      documentTarget: null,
      windowTarget: null,
      onState: (s) => states.push({ ...s }),
    });

    const started = liveSource.start({ type: 'firebase', ownerUid: 'u1', tournamentId: 't1' });
    setup.emit(null, false);
    await started;

    expect(states.at(-1).status).toBe('missing');
    expect(states.at(-1).record).toBeNull();
    expect(setup.service.getOne).not.toHaveBeenCalled();
  });

  it('createLiveTournamentSource emits error on bootstrap subscription failure', async () => {
    const states = [];
    const setup = createSubscribedService(null);

    const liveSource = createLiveTournamentSource({
      profile: 'tv',
      service: setup.service,
      documentTarget: null,
      windowTarget: null,
      onState: (s) => states.push({ ...s }),
    });

    const started = liveSource.start({ type: 'firebase', ownerUid: 'u1', tournamentId: 't1' });
    setup.fail(new Error('Network error'));
    await started;

    expect(states.at(-1).status).toBe('error');
    expect(states.at(-1).error.message).toBe('Network error');
    expect(setup.service.getOne).not.toHaveBeenCalled();
  });

  it('stop clears subscriptions and emits idle', async () => {
    const states = [];
    const setup = createSubscribedService({
      id: 't1',
      name: 'T',
      system: 'swiss',
      teams: [],
      games: [],
      preferences: {},
    });

    const liveSource = createLiveTournamentSource({
      profile: 'tv',
      service: setup.service,
      documentTarget: null,
      windowTarget: null,
      onState: (s) => states.push({ ...s }),
    });

    const started = liveSource.start({ type: 'firebase', ownerUid: 'u1', tournamentId: 't1' });
    setup.emit();
    await started;
    liveSource.stop();

    expect(states.at(-1).status).toBe('idle');
    expect(states.at(-1).record).toBeNull();
    expect(setup.parentUnsubscribe).toHaveBeenCalledTimes(1);
    expect(setup.pathUnsubscribe).toHaveBeenCalled();
  });
});
