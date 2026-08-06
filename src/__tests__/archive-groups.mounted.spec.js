// @vitest-environment jsdom

import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({
  syncFromPortal: vi.fn(),
  updatePath: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('firebase/database', () => ({
  get: vi.fn(),
  getDatabase: vi.fn(() => ({})),
  onValue: vi.fn(),
  ref: vi.fn((_db, path) => path),
  remove: vi.fn(() => Promise.resolve()),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/services/db', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    tournamentService: {
      ...actual.tournamentService,
      updatePath: serviceMocks.updatePath,
    },
  };
});
vi.mock('@/services/portal-sync', () => ({
  FIELD_SETS: { media: ['club_logo_url'] },
  syncFromPortal: serviceMocks.syncFromPortal,
}));

import Tournament from '@/components/Tournament.vue';
import GroupSwitcher from '@/components/partials/GroupSwitcher.vue';
import Archived from '@/views/Archived.vue';

function tournamentRecord({ mainFinished = true, tournamentBFinished = true, activeGroup = 'A' } = {}) {
  return {
    id: 'archive-with-b',
    name: 'Archive with B',
    portalIdTournament: '42',
    activeGroup,
    main: {
      system: 'swiss',
      teams: [{ title: 'Main team', players: [{ id: 1 }] }],
      games: [[{ team_1: 'Main team', team_2: 'Other' }]],
      tournamentIsFinished: mainFinished,
      preferences: {},
    },
    tournamentB: {
      system: 'swiss',
      teams: [{ title: 'B team', players: [{ id: 2 }] }],
      games: [[{ team_1: 'B team', team_2: 'Other B' }]],
      tournamentIsFinished: tournamentBFinished,
      preferences: {},
    },
  };
}

function tournamentHarness(record) {
  return {
    ...Tournament,
    created() {},
    data() {
      return { ...Tournament.data(), testTournament: record };
    },
    computed: {
      ...Tournament.computed,
      tournaments: () => ({}),
      currentTournamentIndex: () => 'archive-with-b',
      isAdmin: () => false,
      user: () => ({ uid: 'owner-1' }),
      currentTournament() {
        return this.testTournament;
      },
      savedTournamentIds: () => [],
      allScoresFilled: () => false,
      isOwnerOrAdmin: () => true,
    },
  };
}

function archivedHarness(record) {
  return {
    ...Archived,
    created() {},
    watch: {},
    data() {
      return {
        ...Archived.data(),
        activeKey: record.id,
        tournament: record,
        isArchiveLoading: false,
        isLoading: false,
        showAllUsers: false,
      };
    },
    computed: {
      ...Archived.computed,
      savedTournaments() {
        return { [record.id]: this.tournament };
      },
      user: () => ({ uid: 'owner-1', email: 'owner@example.com' }),
      userTournamentMap: () => ({ [record.id]: { role: 'owner' } }),
      isSuperAdmin: () => false,
      archiveIndex: () => null,
    },
  };
}

function mountOptions(stubs = {}) {
  return {
    global: {
      mocks: {
        $i18n: { locale: 'en' },
        $t: (key) => key,
      },
      stubs: { RouterLink: true, ...stubs },
    },
  };
}

describe('Main and Tournament B archive behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    serviceMocks.syncFromPortal.mockReset();
    serviceMocks.updatePath.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('offers Archive only from Main after Main and Tournament B are both finished', async () => {
    const record = tournamentRecord({ tournamentBFinished: false });
    const wrapper = shallowMount(tournamentHarness(record), mountOptions());

    expect(wrapper.find('.bottom-actions__tooltip-wrapper').exists()).toBe(false);

    wrapper.vm.testTournament.tournamentB.tournamentIsFinished = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.bottom-actions__tooltip-wrapper').exists()).toBe(true);

    wrapper.vm.testTournament.activeGroup = 'B';
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.bottom-actions__tooltip-wrapper').exists()).toBe(false);

    wrapper.unmount();
  });

  it('switches archived groups while one logo refresh updates Main and Tournament B', async () => {
    const record = tournamentRecord();
    serviceMocks.syncFromPortal.mockImplementation(async (_portalId, { teams }) => {
      teams.forEach((team) => {
        team.players[0].club_logo_url = `logo-${team.players[0].id}`;
      });
      return { teams: { changedPlayers: teams.length }, tirParticipants: null };
    });

    const wrapper = shallowMount(
      archivedHarness(record),
      mountOptions({
        PublicPageShell: { template: '<div><slot /></div>' },
        GroupSwitcher,
      }),
    );

    expect(wrapper.vm.activeTournament.teams[0].title).toBe('Main team');
    await wrapper.findAll('.group-switcher__btn')[1].trigger('click');
    expect(wrapper.vm.activeTournament.teams[0].title).toBe('B team');

    await wrapper.vm.refreshClubLogos();
    await flushPromises();

    expect(serviceMocks.syncFromPortal).toHaveBeenCalledWith(
      '42',
      expect.objectContaining({ teams: [record.main.teams[0], record.tournamentB.teams[0]] }),
    );
    expect(serviceMocks.updatePath).toHaveBeenCalledWith('owner-1', record.id, 'main/teams', record.main.teams);
    expect(serviceMocks.updatePath).toHaveBeenCalledWith(
      'owner-1',
      record.id,
      'tournamentB/teams',
      record.tournamentB.teams,
    );

    wrapper.unmount();
  });
});
