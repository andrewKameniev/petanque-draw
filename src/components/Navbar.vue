<template>
    <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <router-link class="navbar-item" to="/">
                <picture>
                    <source srcset="../assets/img/logo.webp" type="image/webp">
                    <source srcset="../assets/img/logo.png" type="image/jpeg">
                    <img src="../assets/img/logo.png" alt="logo">
                </picture>
            </router-link>

            <button class="menu-burger" @click="$emit('open-menu')" aria-label="menu" aria-expanded="false">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="17" y2="12"/>
                    <line x1="3" y1="18" x2="14" y2="18"/>
                </svg>
            </button>
        </div>

        <div class="navbar-center is-hidden-touch" v-if="user">
            <router-link class="navbar-nav-link" to="/">{{ $t('common.draw') }}</router-link>
            <router-link class="navbar-nav-link" to="/stats">{{ $t('common.stat') }}</router-link>
            <router-link class="navbar-nav-link" to="/training">{{ $t('common.training') }}</router-link>
        </div>

        <div class="navbar-menu">
            <div class="navbar-start">
                <div class="navbar-item has-dropdown is-hoverable" v-if="user && Object.keys(tournaments).length > 1 && $route.name !== 'Statistics'">
                    <a class="navbar-link navbar-link--custom">
                        {{ $t('common.activeTournaments') }}
                        <svg class="navbar-link__chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </a>
                    <div class="navbar-dropdown">
                        <a class="navbar-item" :class="{'is-active': item.id === currentTournamentIndex}"
                           v-for="item in tournaments" :key="item.id"
                           @click.prevent="setActiveTournament(item.id)">
                            {{ item.name }}
                        </a>
                    </div>
                </div>
            </div>
            <div class="navbar-end">
                <div class="navbar-item" v-if="user">
                    <div class="user-dropdown" @click="userDropdownOpen = !userDropdownOpen" v-click-outside="closeDropdown">
                        <button class="btn-user">
                            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                            <span class="btn-user__email">{{ user.email }}</span>
                            <svg class="btn-icon btn-icon--chevron" :class="{'btn-icon--open': userDropdownOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        <div class="user-dropdown__menu" v-if="userDropdownOpen">
                            <a href="#" class="user-dropdown__item" @click.prevent="signOutUser">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                                {{ $t('common.logoutUser') }}
                            </a>
                        </div>
                    </div>
                </div>
                <LanguageSwitcher class="navbar-item"/>
            </div>
        </div>
    </nav>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import { signOut } from "firebase/auth";
import {auth} from "@/firebase";
import LanguageSwitcher from "@/components/partials/LanguageSwitcher.vue";

export default {
    name: "Navbar",
    components: {LanguageSwitcher},
    data() {
        return {
            userDropdownOpen: false,
        }
    },
    directives: {
        'click-outside': {
            mounted(el, binding) {
                el._clickOutside = (e) => {
                    if (!el.contains(e.target)) binding.value();
                };
                document.addEventListener('click', el._clickOutside);
            },
            unmounted(el) {
                document.removeEventListener('click', el._clickOutside);
            }
        }
    },
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'isAdmin', 'user', 'currentTournament']),
        tournament() {
            return this.currentTournament
        },
    },
    methods: {
        ...mapActions(useMainStore, ['setActiveTournament', 'loginUser']),
        closeDropdown() {
            this.userDropdownOpen = false;
        },
        signOutUser() {
            signOut(auth)
                .then(() => {
                    this.loginUser(false);
                    this.userDropdownOpen = false;
                    this.$router.push('/');
                })
                .catch((error) => {
                    console.error("Error during sign out:", error);
                });
        },
    }
}
</script>

<style scoped>
.navbar-center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.navbar-nav-link {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    padding: 0.3rem 0;
    transition: color 0.2s;
}

.navbar-nav-link + .navbar-nav-link {
    padding-left: 1.5rem;
    position: relative;
}

.navbar-nav-link + .navbar-nav-link::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 14px;
    width: 1px;
    background: var(--color-border, #e0e0e0);
}

.navbar-nav-link:hover {
    color: var(--color-primary);
}

.navbar-nav-link.router-link-exact-active {
    color: var(--color-primary);
}

.menu-burger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 0.375rem;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: color 0.2s;
    margin-left: auto;
}

.menu-burger:hover {
    color: var(--color-primary);
}

.menu-burger:active {
    opacity: 0.7;
}

@media (max-width: 1023px) {
    .menu-burger {
        display: flex;
    }
}

.navbar-link--custom {
    padding-right: 1.5rem !important;
    font-size: 0.85rem;
    font-weight: 500;
}

.navbar-link--custom::after {
    display: none !important;
}

.navbar-link__chevron {
    width: 18px;
    height: 18px;
    margin-left: 0.3rem;
    transition: transform 0.25s;
}

.has-dropdown:hover .navbar-link__chevron {
    transform: rotate(180deg);
}

.user-dropdown {
    position: relative;
}

.user-dropdown__menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--color-white);
    border-radius: 0.5rem;
    box-shadow: 0 8px 24px var(--color-dropdown-shadow), 0 2px 4px rgba(0, 0, 0, 0.04);
    min-width: 160px;
    padding: 0.35rem;
    z-index: 9999;
    animation: dropdown-in 0.15s ease;
}

@keyframes dropdown-in {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
}

.user-dropdown__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-radius: 0.35rem;
    text-decoration: none;
    transition: background 0.15s;
}

.user-dropdown__item:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.user-dropdown__item svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.btn-icon--chevron {
    width: 14px;
    height: 14px;
    transition: transform 0.2s;
}

.btn-icon--open {
    transform: rotate(180deg);
}

.btn-user__email {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
