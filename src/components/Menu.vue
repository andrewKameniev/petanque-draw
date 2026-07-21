<template>
  <Teleport to="body">
    <div class="sidebar-overlay" :class="{ active: active }" @click.self="$emit('closeMenu')">
      <aside class="sidebar" :class="{ active: active }">
        <!-- Header: user info -->
        <div class="sidebar__header">
          <div class="sidebar__user" v-if="user">
            <svg class="sidebar__user-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span class="sidebar__user-email">{{ user.email }}</span>
          </div>
          <button class="sidebar__close" @click="$emit('closeMenu')" aria-label="Close menu">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="sidebar__nav">
          <p class="sidebar__label">{{ $t('common.useful') }}</p>
          <ul class="sidebar__list">
            <li v-if="user">
              <a href="#" @click.prevent="addNewTournament">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
                </svg>
                {{ $t('common.addTournament') }}
              </a>
            </li>
            <li>
              <router-link to="/" @click="$emit('closeMenu')">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                {{ $t('common.draw') }}
              </router-link>
            </li>
            <li>
              <router-link to="/stats" @click="$emit('closeMenu')">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                {{ $t('common.stat') }}
              </router-link>
            </li>
            <li>
              <router-link to="/training" @click="$emit('closeMenu')">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {{ $t('common.training') }}
              </router-link>
            </li>
          </ul>

          <!-- Archive -->
          <template v-if="$route.name !== 'Statistics'">
            <ul class="sidebar__list">
              <li>
                <router-link to="/archived" @click="$emit('closeMenu')">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  {{ $t('common.archivedTournaments') }}
                </router-link>
              </li>
              <li>
                <router-link to="/routes" @click="$emit('closeMenu')">
                  <Link2 :size="22" />
                  {{ $t('common.customRoutes') }}
                </router-link>
              </li>
            </ul>
          </template>

          <!-- Info -->
          <p class="sidebar__label">{{ $t('common.info') }}</p>
          <ul class="sidebar__list">
            <li>
              <router-link to="/docs" @click="$emit('closeMenu')">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {{ $t('common.documentation') }}
              </router-link>
            </li>
            <li>
              <router-link to="/doc" @click="$emit('closeMenu')">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01"
                  />
                </svg>
                {{ $t('common.howUse') }}
              </router-link>
            </li>
            <li>
              <a href="http://portal.petanque.org.ua/" target="_blank">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                  />
                </svg>
                {{ $t('common.portal') }}
              </a>
            </li>
          </ul>

          <!-- Settings -->
          <p class="sidebar__label">{{ $t('common.settings') }}</p>
          <ul class="sidebar__list">
            <li>
              <a href="#" @click.prevent="toggleLang">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                {{ { ua: 'Українська', en: 'English', fr: 'Français', es: 'Español' }[$i18n.locale] }}
                <svg class="sidebar__flag" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
                  <template v-if="$i18n.locale === 'ua'">
                    <rect width="640" height="240" fill="#005BBB" />
                    <rect y="240" width="640" height="240" fill="#FFD500" />
                  </template>
                  <template v-else-if="$i18n.locale === 'en'">
                    <path fill="#012169" d="M0 0h640v480H0z" />
                    <path
                      fill="#FFF"
                      d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"
                    />
                    <path
                      fill="#C8102E"
                      d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"
                    />
                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
                  </template>
                  <template v-else-if="$i18n.locale === 'fr'">
                    <rect width="213" height="480" fill="#002395" />
                    <rect x="213" width="214" height="480" fill="#FFF" />
                    <rect x="427" width="213" height="480" fill="#ED2939" />
                  </template>
                  <template v-else-if="$i18n.locale === 'es'">
                    <rect width="640" height="480" fill="#AA151B" />
                    <rect y="120" width="640" height="240" fill="#F1BF00" />
                  </template>
                </svg>
              </a>
            </li>
            <li class="sidebar__theme-item">
              <span class="sidebar__theme-label"
                ><Paintbrush :size="20" class="sidebar__theme-icon" /> {{ $t('common.theme') }}</span
              >
              <ThemeSwitcher />
            </li>
            <li v-if="user">
              <a href="#" @click.prevent="signOutUser">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {{ $t('common.logoutUser') }}
              </a>
            </li>
            <li v-else>
              <router-link to="/" @click="$emit('closeMenu')">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {{ $t('common.loginUser') }}
              </router-link>
            </li>
          </ul>
        </nav>

        <!-- Credit -->
        <div class="sidebar__credit">
          <p>
            {{ $t('common.developedBy') }} <a href="mailto:ancam1987@gmail.com">Andrii Kameniev</a> &
            <a href="mailto:nemo15.alex@gmail.com">Oleksandr Rozhok</a>
          </p>
          <p class="sidebar__version">v{{ appVersion }}</p>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { useTheme } from '@/composables/useTheme';
import ThemeSwitcher from '@/components/partials/ThemeSwitcher.vue';
import { Paintbrush, Link2 } from 'lucide-vue-next';
import { version } from '../../package.json';

export default {
  name: 'Menu',
  components: { ThemeSwitcher, Paintbrush, Link2 },
  setup() {
    const { theme, toggleTheme } = useTheme();
    return { theme, toggleTheme };
  },
  data() {
    return {
      appVersion: version,
    };
  },
  props: ['active'],
  emits: ['closeMenu'],
  watch: {
    active(val) {
      document.documentElement.style.overflow = val ? 'hidden' : '';
      document.body.style.overflow = val ? 'hidden' : '';
    },
  },
  computed: mapState(useMainStore, ['isAdmin', 'user']),
  methods: {
    ...mapActions(useMainStore, ['loginUser', 'addTournament']),
    addNewTournament() {
      this.addTournament();
      this.$emit('closeMenu');
      if (this.$route.path !== '/') {
        this.$router.push('/');
      }
    },
    toggleLang() {
      const locales = ['ua', 'en', 'fr', 'es'];
      const currentIndex = locales.indexOf(this.$i18n.locale);
      const newLang = locales[(currentIndex + 1) % locales.length];
      this.$i18n.locale = newLang;
      localStorage.setItem('petanqueDrawLang', newLang);
    },
    signOutUser() {
      signOut(auth)
        .then(() => {
          this.loginUser(false);
          this.$emit('closeMenu');
          this.$router.push('/');
        })
        .catch((error) => {
          console.error('Error during sign out:', error);
        });
    },
  },
};
</script>

<style scoped>
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgb(0 0 0 / 0%);
  visibility: hidden;
  transition:
    background 0.3s,
    visibility 0.3s;
}

.sidebar-overlay.active {
  background: rgb(0 0 0 / 50%);
  visibility: visible;
}

.sidebar {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: var(--color-white);
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.active {
  transform: translateX(0);
}

/* Header */

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.sidebar__user-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border-radius: 50%;
  padding: 4px;
}

.sidebar__user-email {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 0.5rem;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.sidebar__close:hover {
  background: var(--color-primary-bg-hover);
}

/* Navigation */

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
}

.sidebar__label {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  padding: 1.25rem 1.5rem 0.5rem;
  margin: 0.5rem 0 0;
}

.sidebar__label--toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar__list--scrollable {
  max-height: 200px;
  overflow-y: auto;
}

.sidebar__list li a {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.5rem;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s;
}

.sidebar__list li a:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.sidebar__list li a svg {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  opacity: 0.7;
}

.sidebar__list li a:hover svg {
  opacity: 1;
}

.sidebar__link--active {
  background: var(--color-primary-bg) !important;
  color: var(--color-primary) !important;
  font-weight: 600 !important;
}

.sidebar__list li a.router-link-exact-active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.sidebar__list li a.router-link-exact-active svg {
  opacity: 1;
}

/* Plain list (no icons) */

.sidebar__list--plain li a {
  gap: 0;
}

/* Expandable section */

.sidebar__expandable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.5rem;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s;
  cursor: pointer;
}

.sidebar__expandable:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.sidebar__chevron {
  width: 20px;
  height: 20px;
  transition: transform 0.25s;
  flex-shrink: 0;
}

.sidebar__chevron--open {
  transform: rotate(180deg);
}

.sidebar__list--collapsible {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding-left: 1rem;
}

.sidebar__list--collapsible.sidebar__list--expanded {
  max-height: 300px;
  overflow-y: auto;
}

.sidebar__flag {
  width: 1.4rem;
  height: 1rem;
  border-radius: 2px;
  flex-shrink: 0;
  margin-left: 0.4rem;
}

.sidebar__theme-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.5rem;
}

.sidebar__theme-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.sidebar__theme-icon {
  opacity: 0.7;
  flex-shrink: 0;
}

/* Credit */

.sidebar__credit {
  padding: 1rem 1.5rem;
}

.sidebar__credit p {
  font-size: 1rem;
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
}

.sidebar__credit a {
  color: var(--color-text-muted);
  text-decoration: underline;
  transition: color 0.2s;
}

.sidebar__credit a:hover {
  color: var(--color-primary);
}

.sidebar__version {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  opacity: 0.6;
  margin-top: 0.25rem;
}
</style>
