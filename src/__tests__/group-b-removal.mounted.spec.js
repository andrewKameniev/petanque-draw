// @vitest-environment jsdom

import { createPinia, setActivePinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ database: {} }));
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(),
  ref: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(() => Promise.resolve({ exists: () => false })),
  remove: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  onValue: vi.fn(),
}));

import { useMainStore } from '@/stores/main';
import Preferences from '@/components/partials/Preferences.vue';
import Tournament from '@/components/Tournament.vue';
import SetupCard from '@/components/partials/SetupCard.vue';
import en from '@/locales/en';
import { createTournamentData } from '@/services/tournament-record';

function record(activeGroup = 'B') {
  return {
    name: 'Example',
    activeGroup,
    main: createTournamentData(),
    tournamentB: createTournamentData(),
  };
}

function mountPreferences(role = 'owner', activeGroup = 'B', tournament = record(activeGroup)) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useMainStore();
  store.user = { uid: 'editor' };
  store.currentTournamentIndex = 't1';
  store.tournaments.t1 = tournament;
  if (role !== 'owner') {
    tournament._ownerUid = 'owner';
    store.userTournamentMap.t1 = { role, ownerUid: 'owner' };
  }

  return shallowMount(Preferences, {
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key.split('.').reduce((value, part) => value[part], en) },
      stubs: { Modal: { template: '<div><slot /></div>' } },
    },
  });
}

describe('Tournament B removal controls', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it.each(['owner', 'admin'])('offers %s a B-only button and reassurance while viewing B', async (role) => {
    const wrapper = mountPreferences(role);

    const removeButton = wrapper.find('[data-testid="btn-remove-tournament-b"]');
    expect(removeButton.exists()).toBe(true);
    expect(removeButton.classes()).toContain('prefs__btn--danger');
    expect(wrapper.find('.prefs__footer').find('[data-testid="btn-remove-tournament-b"]').exists()).toBe(true);
    expect(removeButton.text()).toBe(en.teams.removeTournamentB);
    expect(wrapper.find('.prefs__remove-b-hint').text()).toBe(en.teams.removeTournamentBHint);
    expect(wrapper.find('.prefs__footer').text()).not.toContain(en.teams.removeTournamentBHint);
    expect(wrapper.find('[data-testid="btn-remove-tournament"]').exists()).toBe(false);

    await removeButton.trigger('click');
    expect(wrapper.emitted('remove-tournament-b')).toHaveLength(1);
    wrapper.unmount();
  });

  it('hides removal from a scorer', () => {
    const wrapper = mountPreferences('scorer');

    expect(wrapper.find('[data-testid="btn-remove-tournament-b"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="btn-remove-tournament"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('keeps whole-tournament deletion in the A view', () => {
    const wrapper = mountPreferences('owner', 'A');

    expect(wrapper.find('[data-testid="btn-remove-tournament-b"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="btn-remove-tournament"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('offers the B-only control for a legacy groupB record', () => {
    const wrapper = mountPreferences('owner', 'B', {
      name: 'Legacy',
      activeGroup: 'B',
      system: 'swiss',
      teams: [],
      games: [],
      preferences: {},
      groupB: createTournamentData(),
    });

    expect(wrapper.find('[data-testid="btn-remove-tournament-b"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('labels the setup removal as B-only when B has teams but no games', () => {
    const wrapper = shallowMount(SetupCard, {
      props: {
        tournament: createTournamentData({ teams: [{ title: '1' }, { title: '2' }, { title: '3' }] }),
        isTournamentB: true,
      },
      global: { mocks: { $t: (key) => key.split('.').reduce((value, part) => value[part], en) } },
    });

    expect(wrapper.find('[data-testid="btn-delete-setup"]').text()).toContain(en.teams.removeTournamentB);
    expect(wrapper.text()).toContain(en.teams.removeTournamentBHint);
    wrapper.unmount();
  });

  it('confirms the B-specific action before dispatching deletion', async () => {
    const tournament = record();
    const removeTournamentB = vi.fn().mockResolvedValue(true);
    const showMessage = vi.fn();
    const wrapper = shallowMount(
      {
        ...Tournament,
        created() {},
        computed: {
          ...Tournament.computed,
          currentTournament: () => tournament,
          currentTournamentIndex: () => 't1',
          user: () => ({ uid: 'editor' }),
          isOwnerOrAdmin: () => true,
          savedTournamentIds: () => [],
        },
        methods: { ...Tournament.methods, removeTournamentB, showMessage },
      },
      {
        global: {
          mocks: { $t: (key) => key.split('.').reduce((value, part) => value[part], en) },
          stubs: { RouterLink: true },
        },
      },
    );

    expect(wrapper.find('.setup-card__delete').text()).toContain(en.teams.removeTournamentB);
    expect(wrapper.text()).toContain(en.teams.removeTournamentBHint);
    await wrapper.find('.setup-card__delete').trigger('click');
    expect(wrapper.vm.showRemoveBConfirm).toBe(true);
    expect(removeTournamentB).not.toHaveBeenCalled();
    wrapper.vm.showRemoveBConfirm = false;

    wrapper.vm.showPreferences = true;
    await wrapper.vm.$nextTick();
    wrapper.findComponent(Preferences).vm.$emit('remove-tournament-b');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.showRemoveBConfirm).toBe(true);
    expect(removeTournamentB).not.toHaveBeenCalled();
    const confirmation = wrapper.findComponent({ name: 'ConfirmRemoveModal' });
    expect(confirmation.props('message')).toBe(en.teams.removeTournamentBConfirm);
    confirmation.vm.$emit('remove');
    await wrapper.vm.$nextTick();

    expect(removeTournamentB).toHaveBeenCalledOnce();
    wrapper.unmount();
  });
});
