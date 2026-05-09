<template>
    <div class="wrapper">
        <Navbar @open-menu="menuOpen = !menuOpen"/>
        <Menu :active="menuOpen" @closeMenu="menuOpen = false"/>
        <div class="container">

            <div v-if="activeKey && savedTournaments[activeKey]" class="tournament-selector" @click="selectorOpen = !selectorOpen" v-click-outside="closeSelector">
                <span class="tournament-selector__name">{{ savedTournaments[activeKey].name }}</span>
                <svg class="tournament-selector__arrow" :class="{'tournament-selector__arrow--open': selectorOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
                <div class="tournament-selector__dropdown" v-if="selectorOpen">
                    <a href="#" class="tournament-selector__option"
                       :class="{'tournament-selector__option--active': key === activeKey}"
                       v-for="[key, item] in tournamentEntries" :key="key"
                       @click.prevent.stop="selectTournament(key)">
                        {{ item.name }}
                    </a>
                </div>
            </div>

            <div v-if="!activeKey && !isLoading" class="empty-state">
                <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
                <h2 class="empty-state__title">{{ $t('common.archivedTournaments') }}</h2>
                <p class="empty-state__text">{{ $t('messages.noArchivedTournaments') }}</p>
                <router-link to="/" class="button empty-state__btn">{{ $t('common.draw') }}</router-link>
            </div>

            <template v-if="activeTournament && !isLoading">
                <div class="tournament-info-card mt-3 mb-3">
                    <span class="badge badge-corner" :class="badgeClass">
                        {{ badgeLabel }}
                    </span>
                    <div class="tournament-info-row" v-if="tournamentMessageLines.length">
                        <span class="has-text-grey-dark">{{ $t('teams.system') }}:</span>
                        <span class="has-text-weight-semibold">{{ tournamentMessageLines[0] }}</span>
                    </div>
                    <div class="tournament-info-row" v-if="tournamentMessageLines.length > 1">
                        <span class="has-text-grey-dark">{{ $t('common.timeLimit') }}:</span>
                        <span class="has-text-weight-semibold">{{ tournamentMessageLines[1] }}</span>
                    </div>
                    <div class="tournament-info-row" v-for="(line, i) in tournamentMessageLines.slice(2)" :key="i">
                        <span class="has-text-weight-semibold">{{ line }}</span>
                    </div>
                    <div class="tournament-info-row" v-if="!tournamentMessageLines.length">
                        <span class="has-text-grey-dark">{{ $t('teams.system') }}:</span>
                        <span class="has-text-weight-semibold">{{ systemDescription }}</span>
                    </div>
                    <div class="tournament-info-row" v-if="activeTournament.teams">
                        <span class="has-text-grey-dark">{{ $t('common.teamsCount') }}:</span>
                        <span class="has-text-weight-semibold">{{ activeTournament.teams.length }}</span>
                    </div>
                    <div class="tournament-info-row" v-if="activeTournament.cadrage">
                        <span class="has-text-grey-dark">{{ $t('games.cadrage') }}:</span>
                        <span class="has-text-weight-semibold">{{ cadrageRange }}</span>
                    </div>
                    <div class="tournament-info-row" v-if="activeTournament.playOff">
                        <span class="has-text-grey-dark">{{ $t('games.playOff') }}:</span>
                        <span class="has-text-weight-semibold">{{ playOffTeamsCount }} {{ $t('common.teamsLabel') }}</span>
                    </div>
                    <div v-if="activeTournament.playOff" class="btn-bracket-group">
                        <button class="button is-small btn-bracket" @click="$refs.playOff && ($refs.playOff.showBracket = true)">{{ $t('games.showBracket') }}</button>
                    </div>
                </div>
                <PlayOff v-if="activeTournament.playOff" ref="playOff" :active-tournament="activeTournament" :is-public-view="true" :hide-header="true" @openResults="activeTab = 'ranking'" class="playoff-public-wrapper"/>
                <div v-if="activeTournament.games && activeTournament.roundIsActive" class="current-round-card mt-3 mb-3">
                    <div class="round-header">{{ activeRound }} {{ $t('common.round') }}</div>
                    <div class="match-list">
                        <div class="match-item"
                             v-for="(game, index) in activeTournament.games[activeRound - 1]" :key="index">
                            <span class="match-team match-team-right">{{ game.team_1 }}</span>
                            <span class="match-vs">
                                <span class="match-lane">{{ index + (activeTournament.preferences?.fieldsStart || 1) }}</span>
                            </span>
                            <span class="match-team">{{ game.team_2 }}</span>
                        </div>
                    </div>
                </div>
                <div class="tabs">
                    <ul>
                        <li v-for="(tab, index) in tabs" :key="index"
                            :class="{'is-active': tab.id === activeTab}">
                            <a href="#" @click.prevent="activeTab = tab.id">{{ tab.label }}</a>
                        </li>
                    </ul>
                </div>
                <div class="content tabs-content" v-if="activeTab === 'teams'">
                    <TeamsList :previewTournament="activeTournament"/>
                </div>
                <Results v-if="activeTab === 'results'" :previewTournament="activeTournament"/>
                <div class="content tabs-content" v-if="activeTab === 'ranking'">
                    <Ranking :tournament="activeTournament"
                             :rankingTeams="rankingTeams" :activeRound="activeRound"
                             :showInSaved="!!activeTournament.ranking"/>
                </div>
            </template>
        </div>
        <Footer/>
    </div>
</template>

<script>
import Ranking from "@/components/partials/Ranking";
import Results from "@/components/partials/Results";
import TeamsList from "@/components/partials/TeamsList";
import PlayOff from "@/components/partials/PlayOff.vue";
import Footer from "@/components/partials/Footer.vue";
import Navbar from "@/components/Navbar.vue";
import Menu from "@/components/Menu.vue";
import {mapState} from "pinia";
import {useMainStore} from "@/stores/main";
import {getTeamsRanking} from "@/helpers";
import {tournamentService} from "@/services/db";

export default {
    name: 'Archived',
    components: {Footer, Navbar, Menu, PlayOff, TeamsList, Results, Ranking},
    data() {
        return {
            activeTab: "ranking",
            activeKey: null,
            selectorOpen: false,
            menuOpen: false,
            tournament: null,
            isLoading: false,
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
    created() {
        if (this.tournamentKeys.length) {
            this.activeKey = this.tournamentKeys[this.tournamentKeys.length - 1];
        }
    },
    watch: {
        savedTournaments: {
            handler() {
                if (!this.activeKey && this.tournamentKeys.length) {
                    this.activeKey = this.tournamentKeys[this.tournamentKeys.length - 1];
                }
            },
            immediate: true
        },
        activeKey: {
            handler(key) {
                if (key) this.subscribeTournament(key);
            },
            immediate: true
        }
    },
    beforeUnmount() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
    },
    computed: {
        ...mapState(useMainStore, ['savedTournaments', 'user']),
        tournamentEntries() {
            return Object.entries(this.savedTournaments).reverse();
        },
        tournamentKeys() {
            return Object.keys(this.savedTournaments);
        },
        activeTournament() {
            return this.tournament;
        },
        tabs() {
            return [
                { id: 'teams', label: this.$t('teams.teams') },
                { id: 'results', label: this.$t('teams.results') },
                { id: 'ranking', label: this.$t('teams.ranking') }
            ];
        },
        activeRound() {
            if (!this.activeTournament?.games?.length) return 1;
            return this.activeTournament.roundIsActive
                ? this.activeTournament.games.length
                : this.activeTournament.games.length + 1;
        },
        isFinished() {
            return !!this.activeTournament?.tournamentIsFinished;
        },
        isStarted() {
            return !!this.activeTournament?.tournamentIsStarted || !!this.activeTournament?.games?.length;
        },
        badgeClass() {
            if (this.isFinished) return 'badge-finished';
            if (!this.isStarted) return 'badge-not-started';
            return 'badge-active';
        },
        badgeLabel() {
            if (this.isFinished) return this.$t('common.finished');
            if (!this.isStarted) return this.$t('common.notStarted');
            return this.$t('common.active');
        },
        rankingTeams() {
            if (!this.activeTournament?.teams || !this.activeTournament?.games) return [];
            if (this.activeTournament.system === 'groups' && !this.activeTournament.groups) return [];
            return getTeamsRanking(this.activeTournament, this.activeRound);
        },
        tournamentMessageLines() {
            if (!this.activeTournament?.tournamentMessage) return [];
            return this.activeTournament.tournamentMessage.split('\n').filter(l => l.trim());
        },
        systemDescription() {
            if (!this.activeTournament) return '';
            if (this.activeTournament.system !== 'swiss') {
                return this.$t('teams.' + this.activeTournament.system);
            }
            let desc;
            if (this.activeTournament.games?.length) {
                const n = this.activeTournament.games.length;
                desc = n + ' ' + this.pluralizeRounds(n) + ' ' + this.$t('ranking.swiss');
            } else {
                desc = this.$t('teams.' + this.activeTournament.system);
            }
            if (this.activeTournament.playOff || this.activeTournament.playoff || this.activeTournament.preferences?.playOffTeams < this.activeTournament.teams?.length) {
                desc += ' + ' + this.$t('games.playOff').toLowerCase();
            }
            return desc;
        },
        cadrageRange() {
            if (!this.activeTournament?.cadrage?.length) return '';
            const from = (this.activeTournament.playOff?.length || 0) + 1;
            const to = from + this.activeTournament.cadrage.length * 2 - 1;
            return `${from}-${to} ${this.$t('common.places')}`;
        },
        playOffTeamsCount() {
            if (!this.activeTournament?.playOff?.length) return 0;
            return this.activeTournament.playOff.length * 2;
        }
    },
    methods: {
        selectTournament(key) {
            this.activeKey = key;
            this.selectorOpen = false;
            this.activeTab = 'ranking';
        },
        closeSelector() {
            this.selectorOpen = false;
        },
        subscribeTournament(key) {
            if (this._unsubscribe) {
                this._unsubscribe();
                this._unsubscribe = null;
            }
            if (!this.user?.uid) return;
            const tournamentId = this.savedTournaments[key]?.id || key;
            this.isLoading = true;
            this._unsubscribe = tournamentService.subscribe(this.user.uid, tournamentId, (snapshot) => {
                if (snapshot.exists()) {
                    this.tournament = snapshot.val();
                } else {
                    this.tournament = this.savedTournaments[key] || null;
                }
                this.isLoading = false;
            }, () => {
                this.tournament = this.savedTournaments[key] || null;
                this.isLoading = false;
            });
        },
        pluralizeRounds(n) {
            if (this.$i18n.locale === 'ua') {
                const mod10 = n % 10;
                const mod100 = n % 100;
                if (mod10 === 1 && mod100 !== 11) return 'коло';
                if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'кола';
                return 'кіл';
            }
            return n === 1 ? 'round' : 'rounds';
        },
    }
}
</script>

<style scoped>
.wrapper {
    position: relative;
    background: #f4f4f4;
    min-height: 100vh;
}

.wrapper::before {
    content: "";
    position: fixed;
    inset: 0;
    background: url("@/assets/img/bg-petanque.avif") repeat;
    background-size: 800px;
    opacity: 0.5;
    z-index: 0;
    pointer-events: none;
}

.wrapper > * {
    position: relative;
    z-index: 1;
}

.wrapper .navbar-item:hover {
    background: transparent;
}

.tournament-selector {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.75rem 1.5rem;
    margin: 1rem auto;
    width: fit-content;
    max-width: 100%;
}

.tournament-selector__name {
    font-size: 2rem;
    font-weight: 800;
    color: var(--color-text);
    text-align: center;
    line-height: 1.2;
}

.tournament-selector__arrow {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    color: var(--color-primary);
    transition: transform 0.25s;
}

.tournament-selector__arrow--open {
    transform: rotate(180deg);
}

.tournament-selector__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-white);
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
    min-width: 280px;
    max-width: 90vw;
    max-height: 400px;
    overflow-y: auto;
    padding: 0.5rem;
    z-index: 100;
    animation: selector-in 0.15s ease;
}

@keyframes selector-in {
    from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.tournament-selector__option {
    display: block;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-radius: 0.5rem;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
}

.tournament-selector__option:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.tournament-selector__option--active {
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: 600;
}

.wrapper .tabs a {
    border-bottom-color: transparent;
    transition: border-bottom-color 0.3s ease, color 0.3s ease;
}

.wrapper .tabs a:hover {
    border-bottom-color: transparent;
    color: var(--color-primary);
}

.wrapper .tabs li.is-active a {
    border-bottom: 3px solid var(--color-primary);
    color: var(--color-primary);
}

@media screen and (max-width: 768px) {
    .tournament-selector__name {
        font-size: 1.4rem;
    }

    .tournament-selector__arrow {
        width: 22px;
        height: 22px;
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
}

.empty-state__icon {
    width: 64px;
    height: 64px;
    color: var(--color-primary);
    opacity: 0.4;
    margin-bottom: 1.5rem;
}

.empty-state__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 0.5rem;
}

.empty-state__text {
    font-size: 1rem;
    color: var(--color-text-muted);
    max-width: 360px;
    margin-bottom: 1.5rem;
}

.empty-state__btn {
    background: var(--color-primary);
    color: var(--color-white);
    border: none;
    font-weight: 600;
    padding: 0.6rem 1.5rem;
    border-radius: 0.5rem;
}

.empty-state__btn:hover {
    opacity: 0.9;
    color: var(--color-white);
}
</style>
