// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

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

import Preferences from '@/components/partials/Preferences.vue';
import SetupCard from '@/components/partials/SetupCard.vue';
import en from '@/locales/en';
import es from '@/locales/es';
import fr from '@/locales/fr';
import ua from '@/locales/ua';
import { createTournamentData } from '@/services/tournament-record';
import { useMainStore } from '@/stores/main';

const translate = (key) => key.split('.').reduce((value, part) => value[part], en);

function makeTournament() {
  return createTournamentData({
    teams: Array.from({ length: 6 }, (_, index) => ({ title: `Team ${index + 1}` })),
    preferences: { timeLimitEnabled: true },
  });
}

function getCochonettesSelect(wrapper) {
  return wrapper.findAll('select').find((select) =>
    select.findAll('option').some((option) => option.attributes('value') === '0'),
  );
}

describe('additional cochonettes setting', () => {
  it.each([en, ua, fr, es])('localizes the zero-value option', (locale) => {
    expect(locale.modals.noAdditionalCochonettes).toBeTruthy();
  });

  it('offers no additional cochonettes during tournament setup', async () => {
    const tournament = makeTournament();
    const wrapper = shallowMount(SetupCard, {
      props: { tournament },
      global: { mocks: { $t: translate } },
    });

    const select = getCochonettesSelect(wrapper);
    expect(select).toBeDefined();
    expect(select.find('option[value="0"]').text()).toBe(en.modals.noAdditionalCochonettes);

    await select.setValue('0');
    expect(tournament.preferences.cochonettes).toBe(0);
    wrapper.unmount();
  });

  it('offers no additional cochonettes in tournament preferences', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useMainStore();
    store.currentTournamentIndex = 't1';
    store.tournaments.t1 = makeTournament();

    const wrapper = shallowMount(Preferences, {
      global: {
        plugins: [pinia],
        mocks: { $t: translate },
        stubs: { Modal: { template: '<div><slot /></div>' } },
      },
    });

    const select = getCochonettesSelect(wrapper);
    expect(select).toBeDefined();
    expect(select.find('option[value="0"]').text()).toBe(en.modals.noAdditionalCochonettes);

    await select.setValue('0');
    expect(store.currentTournament.preferences.cochonettes).toBe(0);
    wrapper.unmount();
  });

  it('preserves zero through every timer consumer', () => {
    for (const path of [
      'src/components/partials/Games.vue',
      'src/components/partials/Cadrage.vue',
      'src/components/partials/PlayOff.vue',
      'src/components/partials/DoubleElimination.vue',
      'src/views/Public.vue',
    ]) {
      const source = readFileSync(resolve(path), 'utf8');
      expect(source).toContain('preferences.cochonettes ?? 1');
      expect(source).not.toContain('preferences.cochonettes || 1');
    }
  });
});
