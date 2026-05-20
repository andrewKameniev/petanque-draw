<template>
    <Teleport to="body">
        <div class="sidebar-overlay" :class="{active: active}" @click.self="$emit('closeMenu')">
            <aside class="sidebar" :class="{active: active}">
                <!-- Header: user info -->
                <div class="sidebar__header">
                    <div class="sidebar__user" v-if="user">
                        <svg class="sidebar__user-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        <span class="sidebar__user-email">{{ user.email }}</span>
                    </div>
                    <button class="sidebar__close" @click="$emit('closeMenu')" aria-label="Close menu">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Navigation -->
                <nav class="sidebar__nav">
                    <p class="sidebar__label">{{ $t('common.useful') }}</p>
                    <ul class="sidebar__list">
                        <li v-if="user"><a href="#" @click.prevent="addNewTournament">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/></svg>
                            {{ $t('common.addTournament') }}
                        </a></li>
                        <li><router-link to="/" @click="$emit('closeMenu')">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                            {{ $t('common.draw') }}
                        </router-link></li>
                        <li><router-link to="stats" @click="$emit('closeMenu')">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                            {{ $t('common.stat') }}
                        </router-link></li>
                        <li><router-link to="training" @click="$emit('closeMenu')">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                            {{ $t('common.training') }}
                        </router-link></li>
                    </ul>

                    <!-- Active tournaments -->
                    <template v-if="user && Object.keys(tournaments).length > 1 && $route.name !== 'Statistics'">
                        <p class="sidebar__label sidebar__label--toggle" @click="tournamentsOpen = !tournamentsOpen">
                            <span>{{ $t('common.activeTournaments') }}</span>
                            <svg class="sidebar__chevron" :class="{'sidebar__chevron--open': tournamentsOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </p>
                        <ul class="sidebar__list sidebar__list--collapsible" :class="{'sidebar__list--expanded': tournamentsOpen}">
                            <li v-for="(item, index) in tournaments" :key="index">
                                <a href="#" :class="{'sidebar__link--active': index === currentTournamentIndex}" @click.prevent="chooseTournament(index)">
                                    {{ item.name || 'Tournament ' + tournamentNames[index] }}
                                </a>
                            </li>
                        </ul>
                    </template>

                    <!-- Saved tournaments -->
                    <template v-if="$route.name !== 'Statistics' && Object.keys(savedTournaments).length">
                        <p class="sidebar__label sidebar__label--toggle" @click="savedOpen = !savedOpen">
                            <span>{{ $t('common.saved') }}</span>
                            <svg class="sidebar__chevron" :class="{'sidebar__chevron--open': savedOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </p>
                        <ul class="sidebar__list sidebar__list--collapsible" :class="{'sidebar__list--expanded': savedOpen}">
                            <li><router-link to="/archived" @click="$emit('closeMenu')">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                                {{ $t('common.archivedTournaments') }}
                            </router-link></li>
                            <li v-for="([key, item]) in Object.entries(savedTournaments).reverse()" :key="key">
                                <a href="#" @click.prevent="$emit('openSavedTournament', key)">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                                    {{ item.name }}
                                </a>
                            </li>
                        </ul>
                    </template>

                    <!-- Info -->
                    <p class="sidebar__label">{{ $t('common.info') }}</p>
                    <ul class="sidebar__list sidebar__list--plain">
                        <li><router-link to="doc" @click="$emit('closeMenu')">{{ $t('common.howUse') }}</router-link></li>
                        <li><a href="https://en.wikipedia.org/wiki/Swiss-system_tournament" target="_blank">{{ $t('common.swissSystem') }}</a></li>
                        <li><a href="https://mtg.cardsrealm.com/en-us/tools/swiss-tournament-top8-calculator" target="_blank">{{ $t('common.swissCalculator') }}</a></li>
                        <li><a href="http://portal.petanque.org.ua/" target="_blank">{{ $t('common.portal') }}</a></li>
                    </ul>

                    <!-- Settings -->
                    <p class="sidebar__label">{{ $t('common.settings') }}</p>
                    <ul class="sidebar__list">
                        <li><a href="#" @click.prevent="toggleLang">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                            {{ $i18n.locale === 'ua' ? 'Українська' : 'English' }}
                            <svg v-if="$i18n.locale === 'ua'" class="sidebar__flag" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="240" fill="#005BBB"/><rect y="240" width="640" height="240" fill="#FFD500"/></svg>
                            <svg v-else class="sidebar__flag" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg"><path fill="#012169" d="M0 0h640v480H0z"/><path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/><path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/><path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/><path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/></svg>
                        </a></li>
                        <li class="sidebar__theme-item">
                            <span class="sidebar__theme-label"><Paintbrush :size="20" class="sidebar__theme-icon"/> {{ $t('common.theme') }}</span>
                            <ThemeSwitcher />
                        </li>
                        <li v-if="user"><a href="#" @click.prevent="signOutUser">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                            {{ $t('common.logoutUser') }}
                        </a></li>
                        <li v-else><router-link to="/" @click="$emit('closeMenu')">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                            {{ $t('common.loginUser') }}
                        </router-link></li>
                    </ul>
                </nav>

                <!-- Credit -->
                <div class="sidebar__credit">
                    <p>{{ $t('common.developedBy') }} <a href="mailto:ancam1987@gmail.com">Andrii Kameniev</a></p>
                </div>
            </aside>
        </div>
    </Teleport>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {tournamentNames} from "../helpers";
import {signOut} from "firebase/auth";
import {auth} from "@/firebase";
import {useTheme} from "@/composables/useTheme";
import ThemeSwitcher from "@/components/partials/ThemeSwitcher.vue";
import {Paintbrush} from "lucide-vue-next";

export default {
    name: 'Menu',
    components: {ThemeSwitcher, Paintbrush},
    setup() {
        const { theme, toggleTheme } = useTheme();
        return { theme, toggleTheme };
    },
    data() {
        return {
            tournamentNames,
            tournamentsOpen: false,
            savedOpen: false,
        }
    },
    props: ['active'],
    emits: ['closeMenu', 'openSavedTournament'],
    watch: {
        active(val) {
            document.documentElement.style.overflow = val ? 'hidden' : '';
            document.body.style.overflow = val ? 'hidden' : '';
        }
    },
    computed: mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'savedTournaments', 'isAdmin', 'user']),
    methods: {
        ...mapActions(useMainStore, ['setActiveTournament', 'loginUser', 'addTournament']),
        chooseTournament(index) {
            this.setActiveTournament(index);
            this.$emit('closeMenu');
            if (this.$route.path !== '/') {
                this.$router.push('/');
            }
        },
        addNewTournament() {
            this.addTournament();
            this.$emit('closeMenu');
            if (this.$route.path !== '/') {
                this.$router.push('/');
            }
        },
        toggleLang() {
            const newLang = this.$i18n.locale === 'ua' ? 'en' : 'ua';
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
                    console.error("Error during sign out:", error);
                });
        },
    },
}
</script>

<style scoped>
.sidebar-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0);
    visibility: hidden;
    transition: background 0.3s, visibility 0.3s;
}

.sidebar-overlay.active {
    background: rgba(0, 0, 0, 0.5);
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
    transition: background 0.15s, color 0.15s;
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
    transition: background 0.15s, color 0.15s;
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
    box-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
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

</style>
