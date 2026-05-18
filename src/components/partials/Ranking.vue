<template>
    <div>
        <div class="round-tabs ranking-subtabs mb-4" v-if="tournament.system === 'swiss' && tournament.tournamentIsFinished && !isForProtocol && !showInSaved">
            <button class="button is-small mr-1 mb-1"
                    :class="{'is-purple': rankingSubtab === 'result'}"
                    @click="rankingSubtab = 'result'">
                {{ $t('ranking.tournamentResult') }}
            </button>
            <button class="button is-small mr-1 mb-1"
                    :class="{'is-purple': rankingSubtab === 'swiss'}"
                    @click="rankingSubtab = 'swiss'">
                {{ $t('ranking.swissTable') }}
            </button>
        </div>
        <div v-if="tournament.tournamentIsFinished && !isSwissOnly" class="mb-5">
            <div v-if="!isForProtocol" class="ranking-header">
                <h2>{{ $t('ranking.tournamentResult') }}</h2>
                <button class="button is-small btn-purple-outline" :class="{'btn-purple-outline--copied': resultsCopied}" @click="copyResults">
                    <template v-if="resultsCopied">
                        <Check :size="18"/>
                    </template>
                    <template v-else>
                        <span class="is-hidden-mobile">{{ $t('ranking.copyResults') }}</span>
                        <Copy class="is-hidden-tablet" :size="20"/>
                    </template>
                </button>
            </div>
            <div v-if="!isForProtocol" class="table-container">
                <table id="table-finish-ranking" class="table">
                    <thead>
                    <tr>
                        <th>{{ $t('ranking.place') }}</th>
                        <th>{{ $t('ranking.team') }}</th>
                        <th>{{ $t('ranking.players') }}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(team, index) in showInSaved ? tournament.ranking : tournamentRanking" :key="index"
                        :class="{'place-gold': team.place == 1, 'place-silver': team.place == 2, 'place-bronze': team.place == 3}">
                        <td>{{ team.place }}</td>
                        <td>{{ team.title }}</td>
                        <td>
                            <div class="is-size-7" v-if="showInSaved ? team.players && team.players.length : (team.title && getTeamPlayers(team.title).length)">
                                <span class="has-text-dark" v-for="(player, index) in (showInSaved ? team.players : getTeamPlayers(team.title))" :key="index">{{ player.name }} {{ player.surname || '' }}<span v-if="index < (showInSaved ? team.players : getTeamPlayers(team.title)).length - 1">, </span></span>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-if="tournament.games?.length && rankingTeams && !isResultOnly">
            <div v-if="tournament.system === 'swiss'">
                <div v-if="!isForProtocol && activeRound > 1 && !tournament.playOff" class="has-text-grey is-size-7 mb-2">{{ $t('ranking.roundsPlayed') }}: {{ activeRound - 1 }}</div>
                <div class="table-container" :style="activeTooltip ? 'overflow: visible' : ''">
                    <table id="table-ranking" class="table" :class="{'is-bordered': isForProtocol}">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>{{ $t('ranking.team') }}</th>
                            <th align="center">
                                <span class="is-hidden-mobile">{{ $t('ranking.wins') }}</span>
                                <span class="is-hidden-tablet">{{ $t('ranking.winsMobile') }}</span>
                            </th>
                            <th align="center" class="has-tooltip" @click="activeTooltip = activeTooltip === 'buh' ? null : 'buh'">
                                <span class="is-hidden-mobile">{{ $t('ranking.buh') }}</span>
                                <span class="is-hidden-tablet">{{ $t('ranking.buhMobile') }}</span>
                                <div v-if="activeTooltip === 'buh'" class="ranking-tooltip">{{ $t('ranking.buhTooltip') }}</div>
                            </th>
                            <th align="center" class="has-tooltip" @click="activeTooltip = activeTooltip === 'sbuh' ? null : 'sbuh'">
                                <span class="is-hidden-mobile">{{ $t('ranking.sbuh') }}</span>
                                <span class="is-hidden-tablet">{{ $t('ranking.sbuhMobile') }}</span>
                                <div v-if="activeTooltip === 'sbuh'" class="ranking-tooltip">{{ $t('ranking.sbuhTooltip') }}</div>
                            </th>
                            <th align="center" class="has-tooltip" @click="activeTooltip = activeTooltip === 'points' ? null : 'points'">
                                <span class="is-hidden-mobile">{{ $t('ranking.points') }}</span>
                                <span class="is-hidden-tablet">{{ $t('ranking.pointsMobile') }}</span>
                                <div v-if="activeTooltip === 'points'" class="ranking-tooltip ranking-tooltip-right">{{ $t('ranking.pointsTooltip') }}</div>
                            </th>
                            <th v-if="tournament.useRating" align="center">
                                <span class="is-hidden-mobile">{{ $t('ranking.rating') }}</span>
                                <span class="is-hidden-tablet">{{ $t('ranking.ratingMobile') }}</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(team, index) in rankingTeams" :key="team.title"
                            :class="{'playoff-highlight': index < tournament.preferences?.playOffTeams, 'place-gold': !tournament.playOff && tournament.tournamentIsFinished && index === 0, 'place-silver': !tournament.playOff && tournament.tournamentIsFinished && index === 1, 'place-bronze': !tournament.playOff && tournament.tournamentIsFinished && index === 2}">
                            <td><span class="team-count"></span></td>
                            <td>{{ isForProtocol ? teamTitles[team.title] : team.title}}</td>
                            <td align="center">{{ team.wins }}</td>
                            <td align="center">{{ team.buhgolts }}</td>
                            <td align="center">{{ team.smallBuhgolts }}</td>
                            <td align="center">{{ team.pointsPlus }}:{{ team.pointsMinus }}</td>
                            <td v-if="tournament.useRating" align="center"><span class="rating-badge">{{ team.rating }}</span></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else-if="tournament.system === 'supermele'">
                <div class="table-container">
                    <table id="table-ranking" class="table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>{{ $t('ranking.player') }}</th>
                            <th align="center">
                                <span class="is-hidden-mobile">{{ $t('ranking.wins') }}</span>
                                <span class="is-hidden-tablet">{{ $t('ranking.winsMobile') }}</span>
                            </th>
                            <th align="center">
                                <span class="is-hidden-mobile">{{ $t('ranking.difference') }}</span>
                                <span class="is-hidden-tablet">{{ $t('ranking.differenceMobile') }}</span>
                            </th>
                            <th align="center">
                                <span class="is-hidden-mobile">{{ $t('ranking.points') }}</span>
                                <span class="is-hidden-tablet">{{ $t('ranking.pointsMobile') }}</span>
                            </th>
                            <th v-if="tournament.useRating" align="center">
                                <span class="is-hidden-mobile">{{ $t('ranking.rating') }}</span>
                                <span class="is-hidden-tablet">{{ $t('ranking.ratingMobile') }}</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(team, index) in rankingTeams" :key="team.title"
                            :class="{'place-gold': tournament.tournamentIsFinished && index === 0, 'place-silver': tournament.tournamentIsFinished && index === 1, 'place-bronze': tournament.tournamentIsFinished && index === 2}">
                            <td><span class="team-count"></span></td>
                            <td>{{ team.title }}</td>
                            <td align="center">{{ team.wins }}</td>
                            <td align="center">{{team.pointsPlus - team.pointsMinus > 0 ? '+' : ''}}{{ team.pointsPlus - team.pointsMinus }}</td>
                            <td align="center">{{ team.pointsPlus }}:{{ team.pointsMinus }}</td>
                            <td v-if="tournament.useRating" align="center"><span class="rating-badge">{{ team.rating }}</span></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else-if="tournament.groups">
                <div v-if="!isForProtocol && activeRound > 1 && !tournament.playOff && tournament.roundRobinCircle > 1" class="has-text-grey is-size-7 mb-2">{{ $t('games.circlesPlayed') }}: {{ tournament.roundRobinCircle }}</div>
                <div v-for="(group, index) in rankingTeams" :key="index">
                    <h4 v-if="tournament.groups && tournament.groups.length > 1">{{ $t('common.group') }} {{ groupsNames[index] }}</h4>
                    <div class="table-container mb-5">
                        <table class="table table is-striped">
                            <thead>
                                <tr>
                                    <th>{{ $t('ranking.place') }}</th>
                                    <th>{{ $t('ranking.team') }}</th>
                                    <th v-for="(group, index) in group" :key="index" align="center">{{ index + 1 }}</th>
                                    <th align="center">
                                        <span class="is-hidden-mobile">{{ $t('ranking.wins') }}</span>
                                        <span class="is-hidden-tablet">{{ $t('ranking.winsMobile') }}</span>
                                    </th>
                                    <th align="center">
                                        <span class="is-hidden-mobile">{{ $t('ranking.points') }}</span>
                                        <span class="is-hidden-tablet">{{ $t('ranking.pointsMobile') }}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                            <tr v-for="(team, index) in group" :key="index"
                                :class="{'playoff-highlight': tournament.playOff && index < playOffTeamsPerGroup, 'place-gold': !tournament.playOff && tournament.tournamentIsFinished && index === 0, 'place-silver': !tournament.playOff && tournament.tournamentIsFinished && index === 1, 'place-bronze': !tournament.playOff && tournament.tournamentIsFinished && index === 2}">
                                <td>{{ index + 1 }}</td>
                                <td>{{ isForProtocol ? teamTitles[team.title] : team.title}}</td>
                                <td v-for="(opponent, indexOpponent) in group" :key="indexOpponent" align="center"
                                    class="no-wrap">
                                    {{ getGameResultInGroup(tournament.games, team.title, opponent.title) }}
                                </td>
                                <td align="center">{{ team.wins }}</td>
                                <td align="center">{{ team.pointsPlus }}:{{ team.pointsMinus }}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="!isResultOnly && !isSwissOnly">
            {{ $t('ranking.noRanking') }}
        </div>
    </div>
</template>


<script>
import {tournamentNames, getGameResultInGroup, getTournamentRanking, copyContent} from "@/helpers";
import {Copy, Check} from "lucide-vue-next";

export default {
    name: 'Ranking',
    components: {Copy, Check},
    props: ['tournament', 'rankingTeams', 'activeRound', 'showInSaved', 'isForProtocol', 'teamTitles'],
    emits: ['is-playoff'],
    data() {
        return {
            playOffBracket: localStorage.getItem('playOffBracket') ? JSON.parse(localStorage.getItem('playOffBracket')) : null,
            activeTooltip: null,
            rankingSubtab: 'result',
            resultsCopied: false,
        }
    },
    mounted() {
        this._onClickOutside = (e) => {
            if (this.activeTooltip && !e.target.closest('.has-tooltip')) {
                this.activeTooltip = null;
            }
        };
        document.addEventListener('click', this._onClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this._onClickOutside);
    },
    methods: {
        getGameResultInGroup: getGameResultInGroup,
        copyResults() {
            let content = ''
            this.tournamentRanking.forEach(item => {
                content += item.place + ' ' + item.title + '\n'
            })
            copyContent(content)
            this.resultsCopied = true;
            setTimeout(() => { this.resultsCopied = false; }, 2000);
        },
        getTeamPlayers(title) {
            const team = this.tournament.teams?.find(item => item.title === title);
            return team?.players || '';
        },
    },
    computed: {
        groupsNames() {
            return tournamentNames
        },
        tournamentRanking() {
            return getTournamentRanking(this.tournament, this.rankingTeams)
        },
        playOffTeamsPerGroup() {
            if (!this.tournament.playOff || !this.tournament.groups?.length) return 0;
            return Math.ceil((this.tournament.preferences?.playOffTeams || 0) / this.tournament.groups.length);
        },
        isSwissOnly() {
            return this.tournament.system === 'swiss' && this.tournament.tournamentIsFinished && this.rankingSubtab === 'swiss';
        },
        isResultOnly() {
            return this.tournament.system === 'swiss' && this.tournament.tournamentIsFinished && this.rankingSubtab === 'result';
        },
    },
}
</script>

<style scoped>
.ranking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.btn-purple-outline {
    background: transparent;
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
    border-radius: 6px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
}

.btn-purple-outline:hover {
    background: var(--color-primary);
    color: var(--color-btn-text);
}

.btn-purple-outline:focus {
    box-shadow: none;
    outline: none;
}

@media screen and (max-width: 768px) {
    .btn-purple-outline {
        border: none;
        padding: 0.5rem;
        width: 36px;
        height: 36px;
    }
}

.btn-purple-outline--copied {
    color: var(--color-text-muted) !important;
    border-color: var(--color-border) !important;
    background: transparent !important;
}

.has-tooltip {
    position: relative;
    cursor: pointer;
    text-decoration: underline dotted;
}

.ranking-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-ranking-primary-bg);
    color: var(--color-btn-text);
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: normal;
    white-space: nowrap;
    z-index: 10;
    margin-bottom: 4px;
}

.ranking-tooltip-right {
    left: auto;
    right: 0;
    transform: none;
}

.playoff-highlight td {
    background: var(--color-highlight) !important;
}

.place-gold td {
    background: var(--color-badge-gold-bg) !important;
}

.place-gold td:first-child {
    border-left: 3px solid var(--color-badge-gold-border);
}

.place-silver td {
    background: var(--color-badge-silver-bg) !important;
}

.place-silver td:first-child {
    border-left: 3px solid var(--color-badge-silver-border);
}

.place-bronze td {
    background: var(--color-badge-bronze-bg) !important;
}

.place-bronze td:first-child {
    border-left: 3px solid var(--color-badge-bronze-border);
}

.rating-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 10px;
    background: var(--color-badge-purple);
    color: var(--color-primary);
}
</style>