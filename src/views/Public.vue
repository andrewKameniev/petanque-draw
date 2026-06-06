<template>
    <div v-if="isLoading" class="gooey">
        <span class="dot"></span>
        <div class="dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>
    <div v-else class="wrapper" :class="{'wrapper--tir': tournament?.system === 'tir'}">
        <div v-if="tournament" class="container">
            <div class="is-flex is-justify-content-space-between is-align-items-center">
                <router-link class="navbar-item" to="/">
                    <img src="../assets/img/logo.webp" alt="logo">
                </router-link>
                <div class="is-flex is-align-items-center" style="gap: 4px;">
                    <LanguageSwitcher/>
                    <ThemeSwitcher/>
                </div>
            </div>
            <div class="text-center is-size-3 tournament-title-wrapper">
                <strong>{{ tournament.name }}</strong>
            </div>
            <div v-if="!showCurrentRound" class="tournament-info-card mt-3 mb-3">
                <span class="badge badge-corner" :class="badgeClass">
                    {{ badgeLabel }}
                </span>
                <div v-if="tournamentMessageLines.length" class="tournament-info-message">
                    <span class="has-text-grey-dark">{{ $t('remote.organizerMessage') }}: </span>
                    <span class="has-text-weight-semibold" v-for="(line, i) in tournamentMessageLines" :key="i">{{ line }}<br v-if="i < tournamentMessageLines.length - 1"></span>
                </div>
                <div class="tournament-info-row">
                    <span class="has-text-grey-dark">{{ $t('teams.system') }}:</span>
                    <span class="has-text-weight-semibold">{{ systemDescription }}</span>
                </div>
                <div class="tournament-info-row" v-if="tournament.teams">
                    <span class="has-text-grey-dark">{{ tournament.system === 'tir' ? $t('tir.participants') : $t('common.teamsCount') }}:</span>
                    <span class="has-text-weight-semibold">{{ tournament.system === 'tir' ? (tournament.tirParticipants || tournament.teams).length : tournament.teams.length }}</span>
                </div>
                <div class="tournament-info-row" v-if="tournament.preferences?.groupTotalRounds">
                    <span class="has-text-grey-dark">{{ $t('common.totalRounds') }}:</span>
                    <span class="has-text-weight-semibold">{{ tournament.preferences.groupTotalRounds }}</span>
                </div>
                <div class="tournament-info-row" v-if="tournamentExtrasLine">
                    <span class="has-text-grey-dark">{{ $t('common.timeLimit') }}:</span>
                    <span class="has-text-weight-semibold">{{ tournamentExtrasLine }}</span>
                </div>
                <div class="tournament-info-row" v-if="tournament.cadrage">
                    <span class="has-text-grey-dark">{{ $t('games.cadrage') }}:</span>
                    <span class="has-text-weight-semibold">{{ cadrageRange }}</span>
                </div>
                <div class="tournament-info-row" v-if="tournament.playOff">
                    <span class="has-text-grey-dark">{{ $t('games.playOff') }}:</span>
                    <span class="has-text-weight-semibold">{{ playOffTeamsCount }} {{ $t('common.teamsLabel') }}</span>
                </div>
                <div v-if="tournament.playOff" class="btn-bracket-group">
                    <button class="button is-small btn-bracket" @click="$refs.playOff && ($refs.playOff.showBracket = true)"><GitFork :size="14" style="transform: rotate(90deg); margin-right: 0.3rem;"/> {{ $t('games.showBracket') }}</button>
                </div>
            </div>
            <TeamPlayoff v-if="tournament.teamPlayoff" :read-only="true"/>
            <PlayOff v-else-if="tournament.playOff && tournament.system !== 'tir'" ref="playOff" :active-tournament="tournament" :is-public-view="true" :hide-header="true" @openResults="activeTab = 'ranking'" class="playoff-public-wrapper"/>
            <Cadrage v-else-if="tournament.cadrage" :active-tournament="tournament" :is-public-view="true" class="playoff-public-wrapper"/>
            <div v-if="highlightedTeam" class="search-filter-chip" @click="highlightedTeam = null">
                <span>{{ highlightedTeam }}</span>
                <X :size="14"/>
            </div>
            <div v-if="showCurrentRound" class="current-round-card mt-3 mb-3">
                <div class="tournament-info-card tournament-info-card--inline">
                    <span class="badge badge-corner" :class="badgeClass">
                        {{ badgeLabel }}
                    </span>
                    <div v-if="tournamentMessageLines.length" class="tournament-info-message">
                        <span class="has-text-grey-dark">{{ $t('remote.organizerMessage') }}: </span>
                        <span class="has-text-weight-semibold" v-for="(line, i) in tournamentMessageLines" :key="i">{{ line }}<br v-if="i < tournamentMessageLines.length - 1"></span>
                    </div>
                    <div class="tournament-info-row">
                        <span class="has-text-grey-dark">{{ $t('teams.system') }}:</span>
                        <span class="has-text-weight-semibold">{{ systemDescription }}</span>
                    </div>
                    <div class="tournament-info-row" v-if="tournament.teams">
                        <span class="has-text-grey-dark">{{ tournament.system === 'tir' ? $t('tir.participants') : $t('common.teamsCount') }}:</span>
                        <span class="has-text-weight-semibold">{{ tournament.system === 'tir' ? (tournament.tirParticipants || tournament.teams).length : tournament.teams.length }}</span>
                    </div>
                    <div class="tournament-info-row" v-if="tournament.preferences?.groupTotalRounds">
                        <span class="has-text-grey-dark">{{ $t('common.totalRounds') }}:</span>
                        <span class="has-text-weight-semibold">{{ tournament.preferences.groupTotalRounds }}</span>
                    </div>
                    <div class="tournament-info-row" v-if="tournamentExtrasLine">
                        <span class="has-text-grey-dark">{{ $t('common.timeLimit') }}:</span>
                        <span class="has-text-weight-semibold">{{ tournamentExtrasLine }}</span>
                    </div>
                </div>
                <div class="round-header">
                    <span>{{ $t('common.round') }} {{ activeRound }}<template v-if="tournament.preferences?.groupTotalRounds">/{{ tournament.preferences.groupTotalRounds }}</template></span>
                    <TeamSearch :teams="teamNames" :team-club-map="teamClubMap" v-model="highlightedTeam"/>
                </div>
                <RoundTimer v-if="showPublicTimer"
                    :timer-started-at="tournament.roundTimer.timerStartedAt"
                    :timer-ends-at="tournament.roundTimer.timerEndsAt"
                    :timer-status="tournament.roundTimer.timerStatus"
                    :cochonettes-enabled="!!tournament.preferences.cochonettesEnabled"
                    :cochonettes="tournament.preferences.cochonettes || 1"
                    :read-only="true"
                    class="mb-3"/>
                <div class="match-list">
                    <div class="match-item"
                         :class="{
                            'match-item--highlighted': isTeamHighlighted(game),
                            'match-item--in-progress': game.status === 'in_progress',
                            'match-item--finished': game.status === 'finished'
                         }"
                         v-for="(game, index) in tournament.games[activeRound - 1]" :key="index">
                        <span class="match-team match-team-right" :class="{
                            'match-team--highlighted': isTeamNameHighlighted(game.team_1),
                            'match-team--winner': game.status === 'finished' && game.winner === game.team_1
                        }">{{ game.team_1 }}</span>
                        <span class="match-vs">
                            <template v-if="game.status === 'in_progress' || game.status === 'finished'">
                                <span class="match-score">{{ game.team_1_score ?? 0 }} : {{ game.team_2_score ?? 0 }}</span>
                            </template>
                            <template v-else>
                                <span class="match-lane">{{ index + tournament.preferences.fieldsStart }}</span>
                            </template>
                        </span>
                        <span class="match-team" :class="{
                            'match-team--highlighted': isTeamNameHighlighted(game.team_2),
                            'match-team--winner': game.status === 'finished' && game.winner === game.team_2
                        }">{{ game.team_2 }}</span>
                        <span v-if="game.stream_url && game.status === 'in_progress'" class="match-status-badge match-status-badge--live">
                            <a :href="game.stream_url" target="_blank" rel="noopener" class="match-live-link">
                                <span class="match-live-dot"></span>
                                <svg class="match-live-icon" width="16" height="12" viewBox="0 0 24 18" fill="#ff0000"><path d="M23.5 2.8c-.3-1-1-1.8-2-2.1C19.6 0 12 0 12 0S4.4 0 2.5.7c-1 .3-1.7 1.1-2 2.1C0 4.7 0 9 0 9s0 4.3.5 6.2c.3 1 1 1.8 2 2.1C4.4 18 12 18 12 18s7.6 0 9.5-.7c1-.3 1.7-1.1 2-2.1.5-1.9.5-6.2.5-6.2s0-4.3-.5-6.2zM9.6 12.8V5.2l6.4 3.8-6.4 3.8z"/></svg>
                                <span>{{ $t('games.live') }}</span>
                            </a>
                        </span>
                        <span v-else-if="game.status === 'in_progress'" class="match-status-badge match-status-badge--progress">
                            <span class="match-progress-dot"></span>{{ $t('teamPlayoff.matchInProgress') }}
                        </span>
                        <span v-else-if="game.status === 'finished'" class="match-status-badge match-status-badge--finished">{{ $t('teamPlayoff.matchFinished') }}</span>
                        <div v-if="game.score_history && game.score_history.length" class="score-history">
                            <span v-for="(entry, i) in game.score_history" :key="i" class="score-history__chip">
                                <span class="score-history__num">{{ i + 1 }}</span>
                                <span class="score-history__score">{{ entry.s1 }}-{{ entry.s2 }}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- TIR: single view, no tabs -->
            <TirPublicView v-if="tournament.system === 'tir'" :tournament="tournament" class="mt-3"/>

            <!-- Other systems: tabs -->
            <template v-else>
                <div class="tournament-nav">
                    <button v-for="(tab, index) in tabs" :key="index"
                        class="tournament-nav__btn"
                        :class="[`tournament-nav__btn--${tab.id}`, {'tournament-nav__btn--active': tab.id === activeTab}]"
                        @click="activeTab = tab.id">
                        <component :is="tab.icon" :size="18"/>
                        <span>{{ tab.label }}</span>
                    </button>
                </div>
                <div class="tabs-content-area">
                    <div v-if="activeTab === 'teams'">
                        <TeamsList :previewTournament="tournament" :highlightedTeam="highlightedTeam" :teamClubMap="teamClubMap"/>
                    </div>
                    <Results v-if="activeTab === 'results'" :previewTournament="tournament" :highlightedTeam="highlightedTeam" :teamClubMap="teamClubMap" :cardView="true"/>
                    <div v-if="activeTab === 'ranking'">
                        <Ranking :tournament="tournament"
                                 :rankingTeams="rankingTeams" :activeRound="activeRound" :highlightedTeam="highlightedTeam" :teamClubMap="teamClubMap"/>
                    </div>
                </div>
            </template>
        </div>
        <div v-else class="p-5">
            <h2 class="is-size-3 text-center">{{ $t('messages.tournamentNotActive') }}</h2>
            <div class="text-center mt-5">
                <img v-if="girlImage" :src="girlImage" alt="In the petanque land"><br>
            </div>
        </div>
        <Footer/>
    </div>
</template>

<script>

import Ranking from "@/components/partials/Ranking";
import Results from "@/components/partials/Results";
import TeamsList from "@/components/partials/TeamsList";
import {tournamentService} from "@/services/db";
import {getTeamsRanking} from "@/helpers";
import PlayOff from "@/components/partials/PlayOff.vue";
import TeamPlayoff from "@/components/partials/TeamPlayoff.vue";
import Cadrage from "@/components/partials/Cadrage.vue";
import LanguageSwitcher from "@/components/partials/LanguageSwitcher.vue";
import ThemeSwitcher from "@/components/partials/ThemeSwitcher.vue";
import Footer from "@/components/partials/Footer.vue";
import {GitFork, X} from "lucide-vue-next";
import TeamSearch from "@/components/partials/TeamSearch.vue";
import TirPublicView from "@/components/tir/TirPublicView.vue";
import RoundTimer from "@/components/partials/RoundTimer.vue";
import {Users, List, Trophy as TrophyIcon} from "lucide-vue-next";
export default {
    name: 'Public',
    components: {Footer, LanguageSwitcher, ThemeSwitcher, PlayOff, TeamPlayoff, Cadrage, TeamsList, Results, Ranking, GitFork, X, TeamSearch, TirPublicView, RoundTimer, Users, List, TrophyIcon},
    data() {
        return {
            isLoading: false,
            tournament: null,
            activeTab: "ranking",
            notificationsEnabled: false,
            highlightedTeam: null,
            girlImage: null,
        }
    },
    mounted() {
        this.getInfo();
        this._onResume = () => {
            if (this._unsubscribe) {
                this._unsubscribe();
            }
            this.getInfo();
        };
        this._onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                this._onResume();
            }
        };
        document.addEventListener('visibilitychange', this._onVisibilityChange);
        window.addEventListener('online', this._onResume);
    },
    beforeUnmount() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
        document.removeEventListener('visibilitychange', this._onVisibilityChange);
        window.removeEventListener('online', this._onResume);
    },
    watch: {
        isLoading(val) {
            if (!val && !this.tournament) {
                import('@/assets/img/girl.avif').then(m => { this.girlImage = m.default; });
            }
        }
    },
    computed: {
        tabs() {
            return [
                { id: 'teams', label: this.$t('teams.teams'), icon: 'Users' },
                { id: 'results', label: this.$t('teams.results'), icon: 'List' },
                { id: 'ranking', label: this.$t('teams.ranking'), icon: 'TrophyIcon' }
            ];
        },
        showCurrentRound() {
            return this.tournament.games && this.tournament.roundIsActive && !this.tournament.cadrage && !this.tournament.playOff && this.tournament.system !== 'tir';
        },
        activeRound() {
            return this.tournament.games?.length ? this.tournament.roundIsActive ? this.tournament.games.length : this.tournament.games.length + 1 : 1;
        },
        rankingTeams() {
            return getTeamsRanking(this.tournament, this.activeRound)
        },
        userId() {
            if (this.$route.query.ref) {
                return this.parseRef().userId;
            }
            return this.$route.query.user;
        },
        tournamentId() {
            if (this.$route.query.ref) {
                return this.parseRef().tournamentId;
            }
            return this.$route.query.tournament;
        },
        tournamentMessageLines() {
            if (!this.tournament?.tournamentMessage) return [];
            return this.tournament.tournamentMessage.split('\n').filter(l => l.trim());
        },
        isFinished() {
            return !!this.tournament?.tournamentIsFinished;
        },
        isStarted() {
            if (this.tournament?.tournamentIsStarted || this.tournament?.roundIsActive || this.tournament?.tirStarted) return true;
            if (this.tournament?.games?.length) {
                return this.tournament.games.some(round => round.some(g => g.status && g.status !== 'not_started'));
            }
            return false;
        },
        badgeClass() {
            if (this.isFinished) return 'badge-finished';
            if (!this.isStarted) return 'badge-not-started';
            return 'badge-active';
        },
        badgeLabel() {
            if (this.isFinished) return this.$t('common.finished');
            if (!this.isStarted) return this.$t('common.notStarted');
            if (this.tournament?.system === 'tir') {
                return this.tirPhaseLabel;
            }
            const round = this.tournament?.games?.length || 0;
            if (round) return `${this.$t('common.round')} ${round}`;
            return this.$t('common.active');
        },
        tirPhaseLabel() {
            const t = this.tournament;
            if (!t) return this.$t('common.active');
            if (t.tirPlayoff) {
                const playoff = t.tirPlayoff;
                if (playoff.final?.score1 != null) return this.$t('games.final');
                const sfRound = playoff.rounds?.find(r => r.matches.length === 2);
                if (sfRound?.matches.some(m => m.score1 != null)) return this.$t('tir.semifinal');
                if (playoff.rounds?.[0]?.matches.some(m => m.score1 != null)) return this.$t('tir.quarterfinal');
                return this.$t('games.playOff');
            }
            const round = t.tirRound || 1;
            return this.$t('tir.round') + ' ' + round;
        },
        systemDescription() {
            if (this.tournament.system === 'tir') {
                let desc = this.$t('teams.tir');
                if (this.tournament.tirConfig?.rounds === 2) {
                    desc += ', ' + this.$t('tir.twoRoundsShort');
                }
                const qualifiedCount = this.tournament.tirPlayoff?.size || (this.tournament.tirConfig?.rounds === 2 ? 8 : null);
                if (qualifiedCount) {
                    desc += ', ' + qualifiedCount + ' → ' + this.$t('games.playOff').toLowerCase();
                }
                return desc;
            }
            if (this.tournament.system !== 'swiss') {
                return this.$t('teams.' + this.tournament.system);
            }
            let desc;
            if (this.tournament.games?.length) {
                const barrage = this.tournament.barrage;
                const swissRounds = barrage ? barrage.startIndex : this.tournament.games.length;
                const total = this.tournament.preferences?.swissRoundsCount;
                if (total) {
                    desc = swissRounds + '/' + total + ' ' + this.pluralizeRounds(swissRounds) + ' ' + this.$t('ranking.swiss');
                } else {
                    desc = swissRounds + ' ' + this.pluralizeRounds(swissRounds) + ' ' + this.$t('ranking.swiss');
                }
                if (barrage) {
                    desc += ' + ' + this.$t('games.poulesBarrage').toLowerCase();
                }
            } else {
                desc = this.$t('teams.' + this.tournament.system);
                const total = this.tournament.preferences?.swissRoundsCount;
                if (total) {
                    desc += ' (' + total + ' ' + this.pluralizeRounds(total) + ')';
                }
            }
            if (this.tournament.playOff || this.tournament.playoff || this.tournament.preferences?.playOffEnabled) {
                desc += ' + ' + this.$t('games.playOff').toLowerCase();
            }
            return desc;
        },
        cadrageRange() {
            if (!this.tournament?.cadrage?.length) return '';
            const from = (this.tournament.playOff?.length || 0) + 1;
            const to = from + this.tournament.cadrage.length * 2 - 1;
            return `${from}-${to} ${this.$t('common.places')}`;
        },
        playOffTeamsCount() {
            if (!this.tournament?.playOff?.length) return 0;
            return this.tournament.playOff.length * 2;
        },
        isInPlayoff() {
            return !!this.tournament?.playOff || !!this.tournament?.cadrage;
        },
        tournamentExtrasLine() {
            const prefs = this.tournament?.preferences;
            if (!prefs?.timeLimitEnabled) return '';
            const parts = [];
            const time = (prefs.playOffEnabled && this.isInPlayoff) ? (prefs.playoffTimeLimit || prefs.timeLimit) : prefs.timeLimit;
            if (prefs.noTimeLimitFinale && prefs.playOffEnabled && this.isInPlayoff && this.isFinale) {
                parts.push(this.$t('modals.noTimeLimitFinale'));
            } else {
                parts.push(`${time} ${this.$t('modals.min')}`);
            }
            if (prefs.cochonettesEnabled && prefs.cochonettes) {
                parts.push(`+ ${prefs.cochonettes} ${prefs.cochonettes === 1 ? this.$t('common.cochonette') : this.$t('common.cochonettes')}`);
            }
            return parts.join(' ');
        },
        isFinale() {
            const po = this.tournament?.playOff;
            if (!po?.length) return false;
            return po[po.length - 1].teams?.length === 1;
        },
        showPublicTimer() {
            const rt = this.tournament?.roundTimer;
            return rt && (rt.timerStatus === 'running' || rt.timerStatus === 'ended');
        },
        teamNames() {
            if (!this.tournament?.teams) return [];
            return this.tournament.teams.map(t => t.title);
        },
        teamClubMap() {
            if (!this.tournament?.teams) return {};
            const map = {};
            this.tournament.teams.forEach(t => {
                if (t.players?.length && t.players[0].club) {
                    map[t.title] = t.players[0].club;
                }
            });
            return map;
        }
    },
    methods: {
        isTeamNameHighlighted(teamName) {
            if (!this.highlightedTeam) return false;
            if (this.highlightedTeam === teamName) return true;
            return this.teamClubMap[teamName] === this.highlightedTeam;
        },
        isTeamHighlighted(game) {
            if (!this.highlightedTeam) return false;
            return this.isTeamNameHighlighted(game.team_1) || this.isTeamNameHighlighted(game.team_2);
        },
        parseRef() {
            const refParam = this.$route.query.ref;
            if (refParam.includes('.')) {
                const [userId, tournamentBase36] = refParam.split('.');
                return { userId, tournamentId: parseInt(tournamentBase36, 36).toString() };
            }
            const decoded = atob(refParam);
            const [userId, tournamentId] = decoded.split(':');
            return { userId, tournamentId };
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
        async getInfo() {
            this.isLoading = true;
            if (this.$route.query) {
                this._unsubscribe = tournamentService.subscribe(this.userId, this.tournamentId, (snapshot) => {
                    if (snapshot.exists()) {
                        this.tournament = snapshot.val();
                    }
                    this.isLoading = false;
                }, (error) => {
                    console.error('Error fetching data:', error);
                    this.isLoading = false;
                });
            } else {
                const id = this.$route.params.id;
                fetch(`https://portal.petanque.org.ua/tournament/team_export/${id}?format=json`).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error("Error " + response.status);
                }).then(tournamentInfo => {
                    this.tournament = tournamentInfo.tournament.meta ? JSON.parse(tournamentInfo.tournament.meta) : null;
                    this.isLoading = false;
                }).catch(() => {
                    this.isLoading = false;
                });
            }
        },
    }
}
</script>
<style>
.gooey {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 142px;
    height: 40px;
    margin: -20px 0 0 -71px;
}

.gooey .dot {
    position: absolute;
    width: 16px;
    height: 16px;
    top: 12px;
    left: 15px;
    background: var(--color-primary);
    border-radius: 50%;
    transform: translateX(0);
    animation: dot 2.8s infinite;
}

.gooey .dots {
    transform: translateX(0);
    margin-top: 12px;
    margin-left: 31px;
    animation: dots 2.8s infinite;
}

.gooey .dots span {
    display: block;
    float: left;
    width: 16px;
    height: 16px;
    margin-left: 16px;
    background: var(--color-primary);
    border-radius: 50%;
}
@keyframes dot {
    50% {
        transform: translateX(96px)
    }
}

@keyframes dots {
    50% {
        transform: translateX(-31px)
    }
}

.tournament-title-wrapper {
    position: relative;
    font-size: 1.5rem !important;
}

.search-filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    background: var(--color-primary);
    color: var(--color-white);
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    margin: 0.5rem auto;
    transition: opacity 0.15s;
}

.search-filter-chip:hover {
    opacity: 0.85;
}

.tournament-info-card {
    position: relative;
    border: 2px solid var(--color-primary);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    padding-right: 7rem;
}

.tournament-info-card--inline {
    border: none;
    border-radius: 0;
    border-bottom: 1px solid var(--color-border);
    padding: 0.75rem 1rem;
    padding-right: 6rem;
    margin-bottom: 0.5rem;
}

@media screen and (max-width: 352px) {
    .tournament-info-card {
        padding-right: 1.25rem;
        padding-top: 2.5rem;
    }
}

.badge-corner {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
}

.btn-bracket-group {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    display: flex;
    gap: 0.25rem;
}

.btn-bracket {
    background: var(--color-primary);
    color: var(--color-white);
    border: none;
}

.btn-bracket:hover {
    color: var(--color-white);
}

@media screen and (max-width: 768px) {
    .btn-bracket {
        font-size: 1rem;
    }
}

.tournament-info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0;
}

.tournament-info-message {
    margin-bottom: 0.4rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid var(--color-public-separator);
    margin-right: 6rem;
}


.badge {
    display: inline-block;
    padding: 0.3rem 0.8rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
}

.badge-active {
    background: var(--color-primary);
    color: var(--color-white);
}

.badge-finished {
    background: var(--color-grey);
    color: var(--color-white);
}

.badge-not-started {
    background: var(--color-warning-border);
    color: var(--color-white);
}

.btn-purple-outline {
    background: transparent;
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
}

.btn-purple-outline:hover {
    background: var(--color-primary);
    color: var(--color-white);
}

.button.is-purple {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-white);
}

.wrapper .navbar-item:hover {
    background: transparent;
}

.tournament-nav {
    display: flex;
    background: var(--color-surface, var(--color-white));
    border: 1px solid var(--color-border);
    border-radius: 12px 12px 0 0;
    padding: 6px 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: -1px;
}

.tournament-nav__btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 6px;
    border: none;
    background: none;
    color: var(--color-text-muted);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s;
}

.tournament-nav__btn--active {
    font-weight: 700;
}

.tournament-nav__btn--teams.tournament-nav__btn--active {
    color: var(--tir-delete, #e53935);
}

.tournament-nav__btn--games.tournament-nav__btn--active {
    color: var(--color-primary);
}

.tournament-nav__btn--results.tournament-nav__btn--active {
    color: var(--tir-carreau, #4caf50);
}

.tournament-nav__btn--ranking.tournament-nav__btn--active {
    color: var(--tir-touche, #ff9800);
}

.wrapper {
    position: relative;
    background: var(--color-body-bg);
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

[data-theme="dark"] .wrapper::before {
    display: none;
}

.wrapper--tir {
    background: var(--color-body-bg);
}

.wrapper--tir::before {
    display: none;
}

.wrapper--tir .tournament-info-card {
    margin-left: 10px;
    margin-right: 10px;
}

.wrapper > * {
    position: relative;
    z-index: 1;
}

.wrapper .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
}

.wrapper :deep(.navbar) {
    z-index: 10;
}

.playoff-public-wrapper .play-off-stage-wrapper {
    padding: 0;
}

.playoff-public-wrapper h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
}

.playoff-public-wrapper h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-public-text-muted);
    margin-top: 1rem;
    margin-bottom: 0.5rem;
}

.playoff-public-wrapper .game-row.compact {
    background: var(--color-white);
    border-radius: 8px;
    padding: 0.6rem 1rem;
    margin-bottom: 0.4rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    gap: 0.75rem;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
}

.playoff-public-wrapper .game-row.compact .score-block {
    flex: 0 0 auto;
    min-width: 60px;
    padding: 0 0.5rem;
}

.current-round-card {
    background: var(--color-surface, var(--color-white));
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 16px;
    min-width: 280px;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
}

@media screen and (max-width: 768px) {
    .current-round-card {
        width: auto;
        padding: 1rem 1rem;
    }
}

.round-header {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: 0.75rem;
    position: relative;
}

.round-header :deep(.team-search) {
    position: absolute;
    right: 0;
}

.match-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.match-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--color-surface, var(--color-white));
    border: 1px solid var(--color-border);
    transition: background 0.15s, border-color 0.15s;
}

.match-item:hover {
    border-color: var(--tir-touche, #ff9800);
}

.match-item--in-progress {
    border-color: var(--color-primary);
    background: url('@/assets/img/card-bg-active.png') center/cover no-repeat !important;
}

.match-item--finished {
    border-color: var(--tir-carreau, #4caf50);
    background: url('@/assets/img/card-bg-finished.png') center/cover no-repeat !important;
}

.match-team {
    min-width: 0;
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
    transition: color 0.15s;
}

.match-team--highlighted {
    color: var(--color-primary);
}

.match-item--highlighted {
    background: var(--color-primary-bg) !important;
}

.match-team-right {
    text-align: right;
}

.match-vs {
    text-align: center;
}

.match-lane {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-surface-alt, var(--color-primary-bg));
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 700;
}

.match-score {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
    white-space: nowrap;
}

.match-team--winner {
    color: var(--tir-winner, #2e7d32) !important;
    font-weight: 700;
}

.match-status-badge {
    grid-column: 1 / -1;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 0;
}

.match-status-badge--progress {
    color: var(--color-primary, #6c5ce7);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.match-progress-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary, #6c5ce7);
    animation: live-pulse 1.5s ease-in-out infinite;
}

.match-status-badge--finished {
    color: var(--tir-winner-text, #2e7d32);
}

.match-status-badge--live {
    color: #e53935;
}

.match-live-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #e53935;
    text-decoration: none;
    font-weight: 600;
}

.match-live-link:hover {
    text-decoration: underline;
}

.match-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #e53935;
    animation: live-pulse 1.5s ease-in-out infinite;
}

.match-live-icon {
    flex-shrink: 0;
}

@keyframes live-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}


.score-history {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
    padding-top: 6px;
}

.score-history__chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px 2px 4px;
    border-radius: 10px;
    background: #fff;
}

.score-history__num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
}

.score-history__score {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text);
}

.tabs-content-area {
    background: var(--color-surface, var(--color-white));
    border: 1px solid var(--color-border);
    border-radius: 0 0 12px 12px;
    padding: 16px;
    min-height: 200px;
    overflow-x: auto;
}

.tabs-content-area :deep(table) {
    margin: 0 auto;
}
</style>