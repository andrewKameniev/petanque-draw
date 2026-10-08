// @vitest-environment jsdom

import { createPinia, setActivePinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ database: {} }));
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

import SaveTournament from '@/components/partials/SaveTournament.vue';
import { useMainStore } from '@/stores/main';

const tournamentName = 'Всеукраїнські змагання "Каштани" (дуплети)';

function mountDialog(tournament) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useMainStore();
  store.currentTournamentIndex = 't1';
  store.tournaments.t1 = { id: 't1', ...tournament };

  const wrapper = shallowMount(SaveTournament, {
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
      stubs: { Modal: { template: '<div><slot /></div>' } },
    },
  });
  return { wrapper, store };
}

describe('archive tournament name suggestion', () => {
  afterEach(() => vi.useRealTimers());

  it('places the event year before the trailing format and saves that name', async () => {
    const { wrapper, store } = mountDialog({ name: tournamentName, date: '2026-05-23' });
    const changeName = vi.spyOn(store, 'changeTournamentName').mockImplementation(() => {});
    const archive = vi.spyOn(store, 'addToSaved').mockImplementation(() => {});

    expect(wrapper.find('input').element.value).toBe('Всеукраїнські змагання "Каштани" 2026 (дуплети)');
    expect(store.currentTournament.name).toBe(tournamentName);

    await wrapper.find('.save-tournament__btn--save').trigger('click');
    expect(changeName).toHaveBeenCalledWith('Всеукраїнські змагання "Каштани" 2026 (дуплети)');
    expect(archive).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it('does not add another year to a name that already has one', () => {
    const name = 'Каштани 2025 (дуплети)';
    const { wrapper } = mountDialog({ name, date: '2026-05-23' });

    expect(wrapper.find('input').element.value).toBe(name);
    wrapper.unmount();
  });

  it('uses the first game date when the event date is absent', () => {
    const { wrapper } = mountDialog({
      name: tournamentName,
      main: { games: [[{ date: new Date('2024-07-01T12:00:00Z').getTime() }]] },
    });

    expect(wrapper.find('input').element.value).toBe('Всеукраїнські змагання "Каштани" 2024 (дуплети)');
    wrapper.unmount();
  });

  it('uses the current year when no tournament date is available', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-10-08T12:00:00Z'));
    const { wrapper } = mountDialog({ name: 'Каштани' });

    expect(wrapper.find('input').element.value).toBe('Каштани 2026');
    wrapper.unmount();
  });

  it('keeps an empty name empty so the existing validation still applies', async () => {
    const { wrapper } = mountDialog({ name: '' });

    expect(wrapper.find('input').element.value).toBe('');
    await wrapper.find('.save-tournament__btn--save').trigger('click');
    expect(wrapper.find('.save-tournament__error').exists()).toBe(true);
    wrapper.unmount();
  });
});
