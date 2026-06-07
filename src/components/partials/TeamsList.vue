<template>
    <div v-if="(tournament.system === 'groups' || tournament.system === 'poules') && (activeRound > 1 || tournament.roundIsActive)" class="mb-5">
        <div v-for="(group, index) in tournament.groups" :key="index">
            <h4 class="mt-5 text-center" v-if="tournament.groups.length > 1">{{ tournament.system === 'poules' ? 'Poule' : $t('common.group') }} {{ groupsNames[index] }}</h4>
            <div v-if="hasRichData" class="teams-cards">
                <div v-for="(team, teamIndex) in group" :key="team.title"
                     class="team-card" :class="{'team-card--highlighted': isTeamHighlighted(team.title)}">
                    <div class="team-card__rank">{{ teamIndex + 1 }}</div>
                    <div class="team-card__body">
                        <div class="team-card__header">
                            <div v-if="!isSameClubTeam(team)" class="team-card__club-logos">
                                <a v-for="club in getUniqueClubs(team)" :key="club.id" :href="'https://portal.petanque.org.ua/club/' + club.id" target="_blank" class="team-card__club-link">
                                    <img v-if="club.logo" :src="club.logo" class="team-card__club-logo" alt="">
                                </a>
                            </div>
                            <a v-else-if="getClubLogo(team)" :href="getClubUrl(team)" target="_blank" class="team-card__club-link">
                                <img :src="getClubLogo(team)" class="team-card__club-logo" alt="">
                            </a>
                            <div class="team-card__title-block">
                                <span class="team-card__name">{{ team.title }}</span>
                                <a v-if="isSameClubTeam(team) && getTeamClub(team)" :href="getClubUrl(team)" target="_blank" class="team-card__club">{{ getTeamClub(team) }}</a>
                            </div>
                            <span v-if="tournament.useRating" class="rating-badge"><Star :size="12"/>{{ team.rating ? Number(team.rating).toFixed(2) : '—' }}</span>
                        </div>
                        <div v-if="team.players && team.players.length" class="team-card__players">
                            <a v-for="(player, pIdx) in team.players" :key="pIdx" class="player-chip" :class="{'player-chip--captain': isCaptain(team, pIdx)}" :href="player.id ? 'https://portal.petanque.org.ua/player/' + player.id : undefined" :target="player.id ? '_blank' : undefined">
                                <img v-if="player.avatar_url" :src="player.avatar_url" class="player-chip__avatar" alt="">
                                <UserCircle v-else :size="30" class="player-chip__avatar-placeholder"/>
                                <div class="player-chip__info">
                                    <span class="player-chip__name">{{ player.surname }} {{ player.name }}</span>
                                    <span v-if="player.rating_place" class="player-chip__rating"><TrendingUp :size="10"/>{{ player.rating_place }}</span>
                                </div>
                                <span v-if="player.sport_title" class="player-chip__sport-title">{{ sportTitleLabel(player.sport_title) }}</span>
                                <span v-if="isCaptain(team, pIdx)" class="player-chip__captain-badge">
                                    <svg class="player-chip__captain-crown" viewBox="0 0 64 48" fill="none" aria-hidden="true">
                                        <defs>
                                            <linearGradient id="captainCrownGradient" x1="16" y1="8" x2="46" y2="42">
                                                <stop offset="0%" stop-color="#9B6CFF"/>
                                                <stop offset="55%" stop-color="#7c3aed"/>
                                                <stop offset="100%" stop-color="#5521b5"/>
                                            </linearGradient>
                                            <filter id="captainCrownShadow" x="-20%" y="-20%" width="140%" height="150%">
                                                <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#6F35F4" flood-opacity="0.24"/>
                                            </filter>
                                        </defs>
                                        <g filter="url(#captainCrownShadow)">
                                            <circle cx="10" cy="11" r="3.2" fill="#7c3aed"/>
                                            <circle cx="32" cy="5" r="3.4" fill="#9B6CFF"/>
                                            <circle cx="54" cy="11" r="3.2" fill="#7c3aed"/>
                                            <path d="M9 17L21.5 27L32 10L42.5 27L55 17L50 38C50 38 42 34 32 34C22 34 14 38 14 38L9 17Z" fill="url(#captainCrownGradient)"/>
                                            <path d="M14 38C14 38 22 34 32 34C42 34 50 38 50 38C50 38 43 42 32 42C21 42 14 38 14 38Z" fill="#5521b5" opacity="0.9"/>
                                            <path d="M20 30C27 27 38 27 45 30" stroke="#DCCBFF" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
                                        </g>
                                    </svg>
                                    <span class="player-chip__captain-circle">C</span>
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <table v-else class="table">
                <tr v-for="(team, teamIndex) in group" :key="team.title" :class="{'search-highlight': isTeamHighlighted(team.title)}">
                    <td style="width: 30px">{{teamIndex + 1}}.</td>
                    <td>{{ team.title }}
                        <div class="is-size-7" v-if="team.players && team.players.length > 1">
                            (<span class="has-text-dark" v-for="(player, index) in team.players"
                                   :key="index">{{ player.name }}
                                           {{ player.surname }}<span
                                v-if="index < team.players.length - 1">, </span></span>)
                        </div>
                        <div class="is-size-7 has-text-grey" v-if="getTeamClub(team)">{{ getTeamClub(team) }}</div>
                    </td>
                    <td class="td-100" v-if="tournament.useRating"><span class="rating-badge"><Star :size="12"/>{{ team.rating ? Number(team.rating).toFixed(2) : '—' }}</span></td>
                </tr>
            </table>
        </div>
    </div>
    <div v-else-if="hasRichData" class="teams-cards">
        <div v-for="(team, teamIndex) in sortedTeams" :key="team.title"
             class="team-card" :class="{'team-card--highlighted': isTeamHighlighted(team.title)}">
            <div class="team-card__rank">{{ teamIndex + 1 }}</div>
            <div class="team-card__body">
                <div class="team-card__header">
                    <div v-if="!isSameClubTeam(team)" class="team-card__club-logos">
                        <a v-for="club in getUniqueClubs(team)" :key="club.id" :href="'https://portal.petanque.org.ua/club/' + club.id" target="_blank" class="team-card__club-link">
                            <img v-if="club.logo" :src="club.logo" class="team-card__club-logo" alt="">
                        </a>
                    </div>
                    <a v-else-if="getClubLogo(team)" :href="getClubUrl(team)" target="_blank" class="team-card__club-link">
                        <img :src="getClubLogo(team)" class="team-card__club-logo" alt="">
                    </a>
                    <div class="team-card__title-block">
                        <span class="team-card__name">{{ team.title }}</span>
                        <a v-if="isSameClubTeam(team) && getTeamClub(team)" :href="getClubUrl(team)" target="_blank" class="team-card__club">{{ getTeamClub(team) }}</a>
                    </div>
                    <span v-if="tournament.useRating" class="rating-badge"><Star :size="12"/>{{ team.rating ? Number(team.rating).toFixed(2) : '—' }}</span>
                    <button v-if="showRemove" class="team-remove-btn" @click.prevent="removeTeam(team.title)">
                        <X :size="16"/>
                    </button>
                </div>
                <div v-if="team.players && team.players.length" class="team-card__players">
                    <a v-for="(player, pIdx) in team.players" :key="pIdx" class="player-chip" :class="{'player-chip--captain': isCaptain(team, pIdx)}" :href="player.id ? 'https://portal.petanque.org.ua/player/' + player.id : undefined" :target="player.id ? '_blank' : undefined">
                        <img v-if="player.avatar_url" :src="player.avatar_url" class="player-chip__avatar" alt="">
                        <UserCircle v-else :size="30" class="player-chip__avatar-placeholder"/>
                        <div class="player-chip__info">
                            <span class="player-chip__name">{{ player.surname }} {{ player.name }}</span>
                            <span v-if="player.rating_place" class="player-chip__rating"><TrendingUp :size="10"/>{{ player.rating_place }}</span>
                        </div>
                        <span v-if="player.sport_title" class="player-chip__sport-title">{{ sportTitleLabel(player.sport_title) }}</span>
                        <span v-if="isCaptain(team, pIdx)" class="player-chip__captain-badge">
                            <svg class="player-chip__captain-crown" viewBox="0 0 64 48" fill="none" aria-hidden="true">
                                <defs>
                                    <linearGradient id="captainCrownGradient2" x1="16" y1="8" x2="46" y2="42">
                                        <stop offset="0%" stop-color="#9B6CFF"/>
                                        <stop offset="55%" stop-color="#7c3aed"/>
                                        <stop offset="100%" stop-color="#5521b5"/>
                                    </linearGradient>
                                    <filter id="captainCrownShadow2" x="-20%" y="-20%" width="140%" height="150%">
                                        <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#6F35F4" flood-opacity="0.24"/>
                                    </filter>
                                </defs>
                                <g filter="url(#captainCrownShadow2)">
                                    <circle cx="10" cy="11" r="3.2" fill="#7c3aed"/>
                                    <circle cx="32" cy="5" r="3.4" fill="#9B6CFF"/>
                                    <circle cx="54" cy="11" r="3.2" fill="#7c3aed"/>
                                    <path d="M9 17L21.5 27L32 10L42.5 27L55 17L50 38C50 38 42 34 32 34C22 34 14 38 14 38L9 17Z" fill="url(#captainCrownGradient2)"/>
                                    <path d="M14 38C14 38 22 34 32 34C42 34 50 38 50 38C50 38 43 42 32 42C21 42 14 38 14 38Z" fill="#5521b5" opacity="0.9"/>
                                    <path d="M20 30C27 27 38 27 45 30" stroke="#DCCBFF" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
                                </g>
                            </svg>
                            <span class="player-chip__captain-circle">C</span>
                        </span>
                    </a>
                </div>
            </div>
        </div>
    </div>
    <table v-else id="table-list" class="table is-fullwidth">
        <tr v-for="team in sortedTeams" :key="team.title" :class="{'search-highlight': isTeamHighlighted(team.title)}">
            <td>{{team.title}}
                <div class="is-size-7 is-hidden-tablet" v-if="team.players && team.players.length > 1">
                    (<span class="has-text-dark" v-for="(player, index) in team.players" :key="index">{{player.name}}
                                       {{player.surname}}<span v-if="index < team.players.length - 1">, </span></span>)
                </div>
                <div class="is-size-7 has-text-grey is-hidden-tablet" v-if="getTeamClub(team)">{{ getTeamClub(team) }}</div>
            </td>
            <td class="is-hidden-mobile is-size-7" v-if="team.players && team.players.length > 1">
                <span class="has-text-dark" v-for="(player, index) in team.players" :key="index">{{player.name}}
                    {{player.surname}}<span v-if="index < team.players.length - 1">, </span></span>
            </td>
            <td class="is-hidden-mobile is-size-7" v-else></td>
            <td class="is-hidden-mobile is-size-7 has-text-grey" v-if="getTeamClub(team)">
                <span v-for="(line, i) in formatClub(getTeamClub(team))" :key="i">{{ line }}<br v-if="i === 0 && formatClub(getTeamClub(team)).length > 1"></span>
            </td>
            <td class="is-hidden-mobile" v-else></td>
            <td class="td-100" v-if="tournament.useRating"><span class="rating-badge"><Star :size="12"/>{{ team.rating ? Number(team.rating).toFixed(2) : '—' }}</span></td>
            <td class="td-50" v-if="!previewTournament && (tournament.system === 'supermele' || (!tournament.games?.length && !tournament.playOff))">
                <button class="team-remove-btn" @click="removeTeam(team.title)">
                    <X :size="16"/>
                </button>
            </td>
        </tr>
    </table>
</template>

<script>
import {mapState, mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {tournamentNames} from "@/helpers";
import {X, Star, UserCircle, TrendingUp} from "lucide-vue-next";

export default {
    name: "TeamsList",
    components: {X, Star, UserCircle, TrendingUp},
    props: ['previewTournament', 'activeRound', 'highlightedTeam', 'teamClubMap'],
    computed: {
        ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
        tournament() {
            return this.previewTournament || this.currentTournament
        },
        groupsNames() {
            return tournamentNames
        },
        sortedTeams() {
            if (!this.tournament?.teams) return [];
            if (this.previewTournament) {
                return [...this.tournament.teams].sort((a, b) => a.title.localeCompare(b.title));
            }
            if (this.tournament.system === 'groups' && this.tournament.games?.length) {
                return [...this.tournament.teams].sort((a, b) =>
                    (b.wins || 0) - (a.wins || 0) ||
                    ((b.pointsPlus || 0) - (b.pointsMinus || 0)) - ((a.pointsPlus || 0) - (a.pointsMinus || 0)) ||
                    (b.pointsPlus || 0) - (a.pointsPlus || 0)
                );
            }
            return this.tournament.teams;
        },
        hasRichData() {
            if (!this.tournament?.teams?.length) return false;
            return this.tournament.teams.some(t => t.players?.length && (t.players[0].avatar_url || t.players[0].rating_place || t.club));
        },
        showRemove() {
            return !this.previewTournament && (this.tournament.system === 'supermele' || (!this.tournament.games?.length && !this.tournament.playOff));
        }
    },
    methods: {
        ...mapActions(useMainStore, ['removeTeam']),
        isTeamHighlighted(title) {
            if (!this.highlightedTeam) return false;
            if (this.highlightedTeam === title) return true;
            return this.teamClubMap && this.teamClubMap[title] === this.highlightedTeam;
        },
        getTeamClub(team) {
            if (team.club?.name) return team.club.name;
            if (team.players && team.players.length && team.players[0].club) {
                return team.players[0].club;
            }
            return null;
        },
        getClubLogo(team) {
            if (team.club?.logo_url) return team.club.logo_url;
            if (team.players?.length && team.players[0].club_logo_url) return team.players[0].club_logo_url;
            return null;
        },
        getClubUrl(team) {
            const clubId = team.club?.id || (team.players?.length && team.players[0].club_id);
            if (clubId) return 'https://portal.petanque.org.ua/club/' + clubId;
            return undefined;
        },
        isCaptain(team, pIdx) {
            return team.players.length > 1 && pIdx === 0;
        },
        isSameClubTeam(team) {
            if (!team.players || team.players.length <= 1) return false;
            const clubId = team.players[0].club_id;
            if (!clubId) return false;
            return team.players.every(p => p.club_id === clubId);
        },
        getUniqueClubs(team) {
            if (!team.players) return [];
            const seen = new Set();
            const clubs = [];
            team.players.forEach(p => {
                if (p.club_id && !seen.has(p.club_id)) {
                    seen.add(p.club_id);
                    clubs.push({ id: p.club_id, logo: p.club_logo_url });
                }
            });
            return clubs;
        },
        sportTitleLabel(title) {
            const map = { candidate: 'КМС' };
            return map[title] || title;
        },
        formatClub(club) {
            if (!club) return [];
            const match = club.match(/^(.+?)\s*([«"«].+[»"»])$/);
            if (match) {
                return [match[1], match[2]];
            }
            return [club];
        }
    }
}
</script>

<style scoped>
.teams-cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.team-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #eee);
    transition: box-shadow 0.15s;
}

.team-card--highlighted {
    border-color: var(--color-primary);
    background: var(--color-primary-light, rgba(139, 92, 246, 0.06));
}

.team-card__rank {
    min-width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--color-text-muted, #999);
    margin-top: 2px;
}

.team-card__body {
    flex: 1;
    min-width: 0;
}

.team-card__header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.team-card__club-link {
    flex-shrink: 0;
    cursor: pointer;
    transition: opacity 0.15s;
}

.team-card__club-link:hover {
    opacity: 0.75;
}

.team-card__club-logos {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    flex-shrink: 0;
}

.team-card__club-logo {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    object-fit: contain;
    display: block;
    padding: 2px;
}

.team-card__title-block {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.team-card__name {
    font-weight: 600;
    font-size: 0.95rem;
    line-height: 1.3;
    color: var(--color-text);
}

.team-card__club {
    font-size: 0.75rem;
    color: var(--color-text-muted, #888);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.15s;
}

.team-card__club:hover {
    color: var(--color-primary, #7c3aed);
}

.team-card__players {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.5rem;
}

.player-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.6rem 0.3rem 0.3rem;
    border-radius: 24px;
    background: var(--color-bg-input, #f5f5f5);
    border: 1px solid var(--color-border, #eee);
}

.player-chip__avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.player-chip__avatar-placeholder {
    color: var(--color-text-muted, #bbb);
    flex-shrink: 0;
}

.player-chip__info {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
}

.player-chip__name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
}

.player-chip__rating {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 0.65rem;
    font-weight: 600;
    color: #16a34a;
    background: rgba(22, 163, 74, 0.1);
    padding: 1px 5px;
    border-radius: 8px;
    line-height: 1;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s;
}

.player-chip__rating:hover {
    background: rgba(22, 163, 74, 0.2);
}

.player-chip {
    cursor: pointer;
    text-decoration: none;
    color: inherit;
}

.player-chip:hover {
    border-color: rgba(22, 163, 74, 0.5);
}

.player-chip--captain {
    background: rgba(124, 58, 237, 0.06);
    border-color: rgba(124, 58, 237, 0.35);
}

.player-chip--captain:hover {
    border-color: rgba(124, 58, 237, 0.6);
}

.player-chip__captain-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: auto;
    flex-shrink: 0;
}

.player-chip__captain-crown {
    width: 20px;
    height: 12px;
    transform: rotate(10deg) translate(3px, -3px);
    margin-bottom: -2px;
    margin-top: -10px;
}

.player-chip__captain-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #2e1065;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    line-height: 1;
}

.player-chip__sport-title {
    font-size: 0.6rem;
    font-weight: 600;
    color: #92700c;
    background: #fdf6e3;
    padding: 1px 5px;
    border-radius: 6px;
    white-space: nowrap;
    flex-shrink: 0;
}

.team-remove-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.15s;
}

.team-remove-btn:hover {
    background: var(--color-error-bg);
    color: var(--color-error);
}

.table tr:last-child td {
    border-bottom: none;
}

.rating-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    min-width: 28px;
    padding: 0.2rem 0.6rem;
    font-size: 1rem;
    font-weight: 700;
    border-radius: 10px;
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
    white-space: nowrap;
    flex-shrink: 0;
}

.search-highlight td {
    background: var(--color-primary-light, rgba(139, 92, 246, 0.12)) !important;
}

.search-highlight td:first-child {
    border-left: 3px solid var(--color-primary);
}

@media (max-width: 480px) {
    .team-card {
        padding: 0.6rem 0.75rem;
    }

    .team-card__club-logo {
        width: 38px;
        height: 38px;
    }

    .player-chip {
        padding: 0.2rem 0.5rem 0.2rem 0.2rem;
    }

    .player-chip__avatar {
        width: 26px;
        height: 26px;
    }

    .player-chip__name {
        font-size: 0.78rem;
    }
}
</style>
