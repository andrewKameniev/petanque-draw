// @vitest-environment jsdom

import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  syncFromPortal: vi.fn(),
  updatePath: vi.fn(() => Promise.resolve()),
  updatePortalTournament: vi.fn(),
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
vi.mock('@/services/portal', () => ({
  updatePortalTournament: serviceMocks.updatePortalTournament,
}));

import Tournament from '@/components/Tournament.vue';
import GroupSwitcher from '@/components/partials/GroupSwitcher.vue';
import Protocol from '@/components/partials/Protocol.vue';
import TirPublicView from '@/components/tir/TirPublicView.vue';
import Archived from '@/views/Archived.vue';
import en from '@/locales/en';
import es from '@/locales/es';
import fr from '@/locales/fr';
import ua from '@/locales/ua';
import { update as updateDatabase } from 'firebase/database';

function tournamentRecord({ mainFinished = true, tournamentBFinished = true, activeGroup = 'A' } = {}) {
  return {
    id: '1784965464060',
    name: 'Archive with B',
    date: '2026-08-07',
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

function archivedHarness(
  record,
  {
    archiveIndex = null,
    isSuperAdmin = false,
    role = 'owner',
    savedTournaments = { [record.id]: record },
    showAllUsers = false,
  } = {},
) {
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
        showAllUsers,
      };
    },
    computed: {
      ...Archived.computed,
      savedTournaments() {
        return savedTournaments;
      },
      user: () => ({ uid: 'owner-1', email: 'owner@example.com' }),
      userTournamentMap: () => (role ? { [record.id]: { role } } : {}),
      isSuperAdmin: () => isSuperAdmin,
      archiveIndex: () => archiveIndex,
    },
    methods: {
      ...Archived.methods,
      showMessage: serviceMocks.showMessage,
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
    serviceMocks.showMessage.mockReset();
    serviceMocks.updatePath.mockClear();
    serviceMocks.updatePortalTournament.mockReset();
    updateDatabase.mockClear();
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

  it('offers an accessible Mine/All switch to every user and places the date after the type tag', async () => {
    const record = tournamentRecord();
    const wrapper = shallowMount(
      archivedHarness(record, { archiveIndex: {} }),
      mountOptions({ PublicPageShell: false }),
    );

    const scope = wrapper.get('.archived-sidebar__scope');
    const [mine, all] = scope.findAll('button');
    expect(scope.attributes('role')).toBe('group');
    expect(mine.attributes('aria-pressed')).toBe('true');
    expect(all.attributes('aria-pressed')).toBe('false');

    await all.trigger('click');
    expect(wrapper.vm.showAllUsers).toBe(true);
    expect(all.attributes('aria-pressed')).toBe('true');

    await mine.trigger('click');
    const metadataClasses = wrapper
      .get('.archived-sidebar__item-meta')
      .findAll(':scope > span')
      .map((item) => item.classes()[0]);
    expect(metadataClasses).toEqual(['archived-sidebar__item-tag', 'archived-sidebar__item-date']);

    wrapper.unmount();
  });

  it('keeps foreign archives read-only while exposing portal and public-link actions', async () => {
    const record = tournamentRecord();
    const owner = shallowMount(archivedHarness(record), mountOptions({ PublicPageShell: false }));

    expect(owner.get('.sidebar-action-row__input').attributes('disabled')).toBeDefined();
    expect(owner.get('.sidebar-action-row__portal-link').attributes()).toMatchObject({
      href: 'https://portal.petanque.org.ua/tournament/42',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    expect(owner.find('.sidebar-action-row__save').exists()).toBe(false);
    expect(owner.find('.sidebar-action-row__db-id').exists()).toBe(false);
    expect(owner.find('.archived-links__btn--secondary').exists()).toBe(true);
    expect(owner.find('.btn-make-active').exists()).toBe(true);
    expect(owner.find('.btn-remove-archived').exists()).toBe(false);
    expect(owner.find('.tournament-selector__edit').exists()).toBe(false);
    owner.unmount();

    const archiveIndex = {
      [record.id]: {
        name: record.name,
        nameLower: record.name.toLowerCase(),
        date: record.date,
        system: 'swiss',
        ownerUid: 'foreign-owner',
        portalId: '42',
        tournamentIsFinished: true,
        isTestTournament: false,
      },
    };
    const foreign = shallowMount(
      archivedHarness(record, { archiveIndex, role: null, savedTournaments: {}, showAllUsers: true }),
      mountOptions({ PublicPageShell: false }),
    );
    expect(foreign.find('.archived-sidebar__actions').exists()).toBe(true);
    expect(foreign.get('.sidebar-action-row__input').attributes('disabled')).toBeDefined();
    expect(foreign.get('.sidebar-action-row__input').element.value).toBe('42');
    expect(foreign.get('.sidebar-action-row__portal-link').attributes('href')).toBe(
      'https://portal.petanque.org.ua/tournament/42',
    );
    expect(foreign.find('.sidebar-action-row__save').exists()).toBe(false);
    expect(foreign.find('.archived-links__btn').exists()).toBe(true);
    expect(foreign.find('.archived-links__btn--secondary').exists()).toBe(false);
    expect(foreign.find('.btn-make-active').exists()).toBe(false);
    foreign.vm.onPortalIdInput({ target: { value: '99' } });
    await foreign.vm.savePortalId();
    expect(serviceMocks.updatePath).not.toHaveBeenCalled();
    expect(foreign.find('.archived-content').exists()).toBe(true);
    foreign.unmount();

    const superAdmin = shallowMount(
      archivedHarness(record, {
        archiveIndex,
        isSuperAdmin: true,
        role: null,
        savedTournaments: {},
        showAllUsers: true,
      }),
      mountOptions({ PublicPageShell: false }),
    );
    expect(superAdmin.get('.sidebar-action-row__input').attributes('disabled')).toBeUndefined();
    expect(superAdmin.find('.sidebar-action-row__save').exists()).toBe(true);
    expect(superAdmin.get('.sidebar-action-row__portal-link').attributes('href')).toBe(
      'https://portal.petanque.org.ua/tournament/42',
    );
    superAdmin.vm.onPortalIdInput({ target: { value: '43' } });
    await superAdmin.vm.savePortalId();
    expect(updateDatabase).toHaveBeenCalledWith(undefined, {
      [`foreign-owner/tournaments/${record.id}/portalIdTournament`]: '43',
      [`archive/${record.id}/portalId`]: '43',
    });
    await superAdmin.vm.$nextTick();
    expect(superAdmin.get('.sidebar-action-row__portal-link').attributes('href')).toBe(
      'https://portal.petanque.org.ua/tournament/43',
    );
    expect(superAdmin.find('.sidebar-action-row__db-id').exists()).toBe(true);
    expect(superAdmin.find('.btn-remove-archived').exists()).toBe(true);
    superAdmin.unmount();
  });

  it('gates archived standard and TIR protocols for everyone except the superuser', async () => {
    const standard = tournamentRecord();
    const regular = shallowMount(archivedHarness(standard), mountOptions({ PublicPageShell: false }));
    regular.vm.activeTab = 'protocol';
    await regular.vm.$nextTick();
    expect(regular.getComponent(Protocol).props('skipGate')).toBe(false);
    regular.unmount();

    const tir = {
      id: '1784965464061',
      name: 'Archived TIR',
      date: '2026-08-07',
      portalIdTournament: '43',
      system: 'tir',
      tirParticipants: [{ id: 1, name: 'Player' }],
      tournamentIsFinished: true,
      preferences: {},
    };
    const regularTir = shallowMount(archivedHarness(tir), mountOptions({ PublicPageShell: false }));
    expect(regularTir.getComponent(TirPublicView).props('skipProtocolGate')).toBe(false);
    regularTir.unmount();

    const superTir = shallowMount(
      archivedHarness(tir, { isSuperAdmin: true }),
      mountOptions({ PublicPageShell: false }),
    );
    expect(superTir.getComponent(TirPublicView).props('skipProtocolGate')).toBe(true);
    superTir.unmount();
  });

  it('lets only the super admin send an eligible archived public link to the portal', async () => {
    const record = tournamentRecord();
    serviceMocks.updatePortalTournament.mockResolvedValue({ status: 'ok' });

    const owner = shallowMount(archivedHarness(record), mountOptions({ PublicPageShell: false }));
    expect(owner.find('[data-testid="btn-send-archived-portal-link"]').exists()).toBe(false);
    owner.unmount();

    const superAdmin = shallowMount(
      archivedHarness(record, { isSuperAdmin: true }),
      mountOptions({ PublicPageShell: false }),
    );
    const buttons = superAdmin.findAll('[data-testid="btn-send-archived-portal-link"]');
    expect(buttons.length).toBeGreaterThan(0);

    await buttons[0].trigger('click');
    await flushPromises();

    expect(serviceMocks.updatePortalTournament).toHaveBeenCalledWith('42', superAdmin.vm.publicTournamentRef);
    expect(serviceMocks.updatePortalTournament.mock.calls[0][1]).not.toContain('http');
    expect(serviceMocks.showMessage).toHaveBeenCalledWith({
      title: 'messages.success',
      text: 'remote.linkSentToPortal',
    });
    superAdmin.unmount();

    const testRecord = tournamentRecord();
    testRecord.main.preferences.isTestTournament = true;
    const testArchive = shallowMount(
      archivedHarness(testRecord, { isSuperAdmin: true }),
      mountOptions({ PublicPageShell: false }),
    );
    expect(testArchive.find('[data-testid="btn-send-archived-portal-link"]').exists()).toBe(false);
    testArchive.unmount();
  });

  it('defines every archived portal-link action label in all supported locales', () => {
    for (const locale of [en, es, fr, ua]) {
      expect(locale.common.databaseId).toBeTruthy();
      expect(locale.common.copyDatabaseId).toBeTruthy();
      expect(locale.remote.sendLinkToPortal).toBeTruthy();
      expect(locale.remote.sendingLinkToPortal).toBeTruthy();
      expect(locale.remote.linkSentToPortal).toBeTruthy();
      expect(locale.remote.linkPortalError).toBeTruthy();
      expect(locale.remote.portalTokenMissing).toBeTruthy();
    }
  });
});
