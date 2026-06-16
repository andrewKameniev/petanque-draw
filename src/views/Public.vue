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
            <div v-if="isFinished && winnerTeam" class="winner-card">
                <div class="winner-card__trophy">
                    <TrophyIcon :size="36" />
                </div>
                <div class="winner-card__title">{{ $t('tir.tournamentWinner') }}</div>
                <div class="winner-card__team-name">{{ winnerTeam.title }}</div>
                <div v-if="winnerTeam.players && winnerTeam.players.length" class="winner-card__players">
                    <div v-for="(player, pIdx) in winnerTeam.players" :key="pIdx" class="winner-card__player">
                        <img v-if="player.avatar_url" :src="player.avatar_url" class="winner-card__avatar" alt="">
                        <div v-else class="winner-card__avatar winner-card__avatar--placeholder">
                            <Users :size="16" />
                        </div>
                        <div class="winner-card__player-info">
                            <span class="winner-card__player-name">{{ player.surname }} {{ player.name }}</span>
                            <span v-if="player.club" class="winner-card__player-club">{{ player.club }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <TeamPlayoff v-if="tournament.teamPlayoff" :read-only="true"/>
            <PlayOff v-else-if="tournament.playOff && tournament.system !== 'tir'" ref="playOff" :active-tournament="tournament" :is-public-view="true" :hide-header="true" @openResults="activeTab = 'ranking'" class="playoff-public-wrapper"/>
            <div v-else-if="tournament.cadrage" class="cadrage-public-section">
                <h3 class="cadrage-public-section__title">{{ $t('games.cadrage') }}</h3>
                <div class="match-list">
                    <div class="match-item"
                         :class="{
                            'match-item--in-progress': game.status === 'in_progress',
                            'match-item--finished': game.status === 'finished',
                            'match-item--upcoming': !game.status || game.status === 'not_started'
                         }"
                         v-for="(game, index) in tournament.cadrage" :key="'cadrage-'+index">
                        <span class="match-lane-left">{{ index + (tournament.preferences?.fieldsStart || 1) }}</span>
                        <span class="match-team match-team-right" :class="{
                            'match-team--winner': game.status === 'finished' && Number(game.team_1_score) > Number(game.team_2_score)
                        }">{{ game.team_1 }}</span>
                        <span class="match-vs">
                            <span class="match-score">
                                <template v-if="game.status === 'in_progress' || game.status === 'finished'">{{ game.team_1_score ?? 0 }} : {{ game.team_2_score ?? 0 }}</template>
                                <template v-else>-- : --</template>
                            </span>
                        </span>
                        <span class="match-team" :class="{
                            'match-team--winner': game.status === 'finished' && Number(game.team_2_score) > Number(game.team_1_score)
                        }">{{ game.team_2 }}</span>
                        <span v-if="game.status === 'in_progress'" class="match-status-badge match-status-badge--progress">
                            <span class="match-progress-dot"></span>{{ $t('teamPlayoff.matchInProgress') }}
                        </span>
                        <span v-else-if="game.status === 'finished'" class="match-status-badge match-status-badge--finished">{{ $t('teamPlayoff.matchFinished') }}</span>
                    </div>
                </div>
            </div>
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
                            'match-item--finished': game.status === 'finished',
                            'match-item--upcoming': !game.status || game.status === 'not_started'
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
                        <span v-if="getGameStreams(game, index).length" class="match-status-badge match-status-badge--live">
                            <a v-for="(streamUrl, si) in getGameStreams(game, index)" :key="si"
                               :href="streamUrl" target="_blank" rel="noopener"
                               class="match-live-link" :class="getStreamIconClass(streamUrl)">
                                <span v-if="si === 0 && game.status === 'in_progress'" class="match-live-dot"></span>
                                <component :is="getStreamIcon(streamUrl)" :size="16" />
                            </a>
                            <span class="match-live-label">{{ game.status === 'in_progress' ? $t('games.live') : $t('games.stream') }}</span>
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
import {getGameStreams, getStreamPlatform} from "@/services/streams";
import {Youtube, Twitch, Facebook, Instagram, Video} from "lucide-vue-next";
import PlayOff from "@/components/partials/PlayOff.vue";
import TeamPlayoff from "@/components/partials/TeamPlayoff.vue";
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
    components: {Footer, LanguageSwitcher, ThemeSwitcher, PlayOff, TeamPlayoff, TeamsList, Results, Ranking, GitFork, X, TeamSearch, TirPublicView, RoundTimer, Users, List, TrophyIcon, Youtube, Twitch, Facebook, Instagram, Video},
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
        this._unsubscribers = [];
        this.getInfo();
        this._onResume = () => {
            this._unsubscribeAll();
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
        this._unsubscribeAll();
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
                { id: 'ranking', label: this.$t('teams.ranking'), icon: 'TrophyIcon' },
                { id: 'results', label: this.$t('teams.results'), icon: 'List' }
            ];
        },
        showCurrentRound() {
            return this.tournament.games && this.tournament.roundIsActive && !this.tournament.tournamentIsFinished && !this.tournament.cadrage && !this.tournament.playOff && this.tournament.system !== 'tir';
        },
        activeRound() {
            return this.tournament.games?.length ? this.tournament.roundIsActive ? this.tournament.games.length : this.tournament.games.length + 1 : 1;
        },
        rankingTeams() {
            return getTeamsRanking(this.tournament, this.activeRound)
        },
        winnerTeam() {
            if (!this.isFinished || !this.tournament?.teams) return null;
            if (this.tournament.system === 'tir') {
                const playoff = this.tournament.tirPlayoff;
                if (playoff?.final?.score1 != null && playoff?.final?.score2 != null) {
                    const winnerName = playoff.final.score1 > playoff.final.score2 ? playoff.final.player1 : playoff.final.player2;
                    if (winnerName) {
                        const participants = this.tournament.tirParticipants || [];
                        const winner = participants.find(p => p.name === winnerName);
                        if (winner) return { title: winner.name, players: [winner] };
                    }
                }
                return null;
            }
            const ranking = this.rankingTeams;
            if (!ranking || !ranking.length) return null;
            const topTitle = Array.isArray(ranking[0]) ? ranking[0][0]?.title : ranking[0]?.title;
            if (!topTitle) return null;
            return this.tournament.teams.find(t => t.title === topTitle) || null;
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
        getGameStreams(game, index) {
            return getGameStreams(game, this.tournament, index);
        },
        getStreamPlatform,
        getStreamIcon(url) {
            const platform = getStreamPlatform(url);
            if (platform === 'youtube') return 'Youtube';
            if (platform === 'twitch') return 'Twitch';
            if (platform === 'facebook') return 'Facebook';
            if (platform === 'instagram') return 'Instagram';
            return 'Video';
        },
        getStreamIconClass(url) {
            const platform = getStreamPlatform(url);
            return `stream-icon--${platform}`;
        },
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
                try {
                    const snapshot = await tournamentService.getOne(this.userId, this.tournamentId);
                    if (snapshot.exists()) {
                        this.tournament = snapshot.val();
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
                this.isLoading = false;
                this._subscribeDynamic();
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
        _subscribeDynamic() {
            const paths = [
                'games', 'roundIsActive', 'roundTimer', 'playOff', 'playOffBracket',
                'playOffStage', 'cadrage', 'barrage', 'tournamentIsFinished',
                'tournamentIsStarted', 'tournamentMessage',
                'tirPlayoff', 'tirRound', 'tirStarted',
                'teams', 'preferences'
            ];
            for (const path of paths) {
                const unsub = tournamentService.subscribePath(
                    this.userId, this.tournamentId, path,
                    (snapshot) => {
                        if (!this.tournament) return;
                        this.tournament[path] = snapshot.val();
                    }
                );
                this._unsubscribers.push(unsub);
            }
        },
        _unsubscribeAll() {
            if (this._unsubscribers) {
                this._unsubscribers.forEach(fn => fn());
                this._unsubscribers = [];
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
    background: var(--color-surface);
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
    max-width: 800px !important;
    margin: 0 auto;
    padding: 0 1rem;
    padding-bottom: 2rem;
}

@media screen and (min-width: 1024px) {
    .wrapper .container {
        padding-bottom: 3rem;
    }
}

@media screen and (min-width: 1408px) {
    .wrapper .container {
        max-width: 1100px !important;
    }
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

.cadrage-public-section {
    margin-top: 1rem;
    margin-bottom: 1rem;
}

.cadrage-public-section__title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
    text-align: center;
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
    position: relative;
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

[data-theme="dark"] .match-item--finished,
[data-theme="dark"] .match-item--in-progress,
[data-theme="dark"] .match-item--upcoming {
    background-color: var(--color-surface) !important;
    background-blend-mode: soft-light;
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

.match-item--upcoming {
    border-color: #bdbdbd;
    background: url('@/assets/img/card-bg-upcoming.png') center/cover no-repeat !important;
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
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
}

.match-live-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #e53935;
    text-decoration: none;
    font-weight: 600;
}

.match-live-link.stream-icon--twitch {
    color: #9146ff;
}

.match-live-link.stream-icon--facebook {
    color: #1877f2;
}

.match-live-link.stream-icon--instagram {
    color: #e4405f;
}

.match-live-link:hover {
    opacity: 0.8;
}

.match-live-label {
    font-weight: 600;
    margin-left: 2px;
}

.match-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #e53935;
    animation: live-pulse 1.5s ease-in-out infinite;
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
    background: var(--color-surface);
    border: 1px solid var(--color-border);
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
    padding-bottom: 24px;
    min-height: 200px;
    overflow-x: auto;
}

.tabs-content-area :deep(table) {
    margin: 0 auto;
}

.winner-card {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
    border: 2px solid #d4a017;
    border-radius: 16px;
    padding: 28px 24px;
    margin: 12px 0;
    text-align: center;
    position: relative;
    overflow: hidden;
    animation: winner-glow 3s ease-in-out infinite;
}

.winner-card::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200vmax;
    height: 200vmax;
    margin-top: -100vmax;
    margin-left: -100vmax;
    border-radius: 50%;
    background: conic-gradient(from 0deg, transparent 0%, rgba(245, 200, 66, 0.15) 10%, transparent 20%, rgba(245, 200, 66, 0.2) 30%, transparent 40%, rgba(245, 200, 66, 0.1) 60%, transparent 70%);
    animation: winner-shimmer 12s linear infinite;
}

.winner-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 14px;
    padding: 2px;
    background: linear-gradient(135deg, rgba(245, 200, 66, 0.6), transparent 40%, transparent 60%, rgba(245, 200, 66, 0.6));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: winner-border-shift 3s ease-in-out infinite alternate;
    pointer-events: none;
}

@keyframes winner-glow {
    0%, 100% { box-shadow: 0 4px 20px rgba(245, 200, 66, 0.2), inset 0 0 30px rgba(245, 200, 66, 0.05); }
    50% { box-shadow: 0 6px 35px rgba(245, 200, 66, 0.4), inset 0 0 50px rgba(245, 200, 66, 0.08); }
}

@keyframes winner-shimmer {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes winner-border-shift {
    from { opacity: 0.5; }
    to { opacity: 1; }
}

.winner-card__trophy {
    color: #f5c842;
    margin-bottom: 8px;
    position: relative;
    filter: drop-shadow(0 0 8px rgba(245, 200, 66, 0.4));
}

.winner-card__title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #e8a620, #f5d442, #e8a620);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 6px;
    position: relative;
}

.winner-card__team-name {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 18px;
    position: relative;
    text-shadow: 0 0 20px rgba(245, 200, 66, 0.2);
}

.winner-card__players {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    position: relative;
}

.winner-card__player {
    display: flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(135deg, rgba(245, 200, 66, 0.08), rgba(245, 200, 66, 0.03));
    border: 1px solid rgba(245, 200, 66, 0.2);
    border-radius: 12px;
    padding: 10px 16px;
    min-width: 180px;
    backdrop-filter: blur(4px);
}

.winner-card__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid rgba(245, 200, 66, 0.3);
}

.winner-card__avatar--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(245, 200, 66, 0.1);
    color: #f5c842;
}

.winner-card__player-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.winner-card__player-name {
    font-weight: 600;
    font-size: 14px;
    color: #f0f0f0;
}

.winner-card__player-club {
    font-size: 12px;
    color: rgba(245, 200, 66, 0.7);
}
</style>