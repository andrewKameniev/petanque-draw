// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '@/locales/en';
import ua from '@/locales/ua';
import fr from '@/locales/fr';
import es from '@/locales/es';

const store = {
  tournaments: {},
  currentTournamentIndex: null,
  isAdmin: false,
  user: { uid: 'user-1', email: 'user@example.com' },
  currentTournament: null,
  userTournamentMap: {},
};

vi.mock('@/firebase', () => ({ auth: {} }));
vi.mock('firebase/auth', () => ({ signOut: vi.fn() }));
vi.mock('@/stores/main', () => ({ useMainStore: vi.fn(() => store) }));

const { default: Navbar } = await import('@/components/Navbar.vue');

const wrappers = [];

describe('Navbar active tournaments overlay', () => {
  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  it.each([
    ['en', 'You have no active tournaments'],
    ['ua', 'У вас немає активних турнірів'],
    ['fr', 'Vous n’avez aucun tournoi actif'],
    ['es', 'No tienes torneos activos'],
  ])('renders the localized empty state in %s', async (locale, expectedText) => {
    const i18n = createI18n({
      legacy: true,
      locale,
      fallbackLocale: 'en',
      messages: { en, ua, fr, es },
    });
    const wrapper = mount(Navbar, {
      global: {
        plugins: [createPinia(), i18n],
        mocks: {
          $route: { path: '/', query: {} },
          $router: { push: vi.fn() },
        },
        stubs: {
          RouterLink: true,
          LanguageSwitcher: true,
          ThemeSwitcher: true,
          teleport: true,
        },
      },
    });
    wrappers.push(wrapper);

    await wrapper.setData({ activeOverlayOpen: true });

    const emptyState = wrapper.get('.active-overlay__empty');
    expect(emptyState.text()).toBe(expectedText);
    expect(emptyState.text()).not.toContain('training.noSessions');
  });
});
