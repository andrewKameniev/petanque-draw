<template>
  <div v-if="!tournament.teams || !tournament.teams.length" class="teams-empty">
    <Users :size="40" class="teams-empty__icon" />
    <p class="teams-empty__text">{{ $t('common.noTeams') }}</p>
  </div>
  <template v-else>
    <div v-if="allClubs.length > 1" class="club-filter">
      <button
        v-for="club in allClubs"
        :key="club.id"
        class="club-filter__chip"
        :class="{ 'club-filter__chip--active': activeClubFilter === club.id }"
        @click="toggleClubFilter(club.id)"
        :title="club.name"
      >
        <img v-if="club.logo" :src="club.logo" class="club-filter__logo" :alt="club.name" />
        <span v-else class="club-filter__fallback">{{ club.name.charAt(0) }}</span>
        <span class="club-filter__count">{{ club.count }}</span>
      </button>
    </div>
    <div
      v-if="
        (tournament.system === 'groups' || tournament.system === 'poules' || tournament.groups?.length) &&
        (activeRound > 1 || tournament.roundIsActive)
      "
      class="mb-5"
    >
    <div v-for="(group, index) in sortedGroups" :key="index">
      <h4 class="mt-5 text-center" v-if="sortedGroups.length > 1">
        {{ tournament.system === 'poules' ? 'Poule' : $t('common.group') }} {{ groupsNames[index] }}
      </h4>
      <div v-if="hasRichData" class="teams-cards">
        <div
          v-for="(team, teamIndex) in group"
          :key="team.title"
          class="team-card"
          :class="{
            'team-card--highlighted': isTeamHighlighted(team.title),
            'team-card--expanded': expandedTeam === team.title,
            'team-card--clickable': hasGamesStarted,
          }"
          @click="hasGamesStarted && toggleExpand(team.title)"
        >
          <div class="team-card__rank">{{ teamIndex + 1 }}</div>
          <div class="team-card__body">
            <div class="team-card__header">
              <div v-if="!isSameClubTeam(team)" class="team-card__club-logos">
                <a
                  v-for="club in getUniqueClubs(team)"
                  :key="club.id"
                  :href="'https://portal.petanque.org.ua/club/' + club.id"
                  target="_blank"
                  class="team-card__club-link"
                  @click.stop
                >
                  <img v-if="club.logo" :src="club.logo" class="team-card__club-logo" alt="" />
                </a>
              </div>
              <a v-else-if="getClubLogo(team)" :href="getClubUrl(team)" target="_blank" class="team-card__club-link" @click.stop>
                <img :src="getClubLogo(team)" class="team-card__club-logo" alt="" />
              </a>
              <div class="team-card__title-block">
                <span class="team-card__name">{{ team.title }}</span>
                <a v-if="getTeamClub(team)" :href="getClubUrl(team)" target="_blank" class="team-card__club" @click.stop>{{
                  getTeamClub(team)
                }}</a>
              </div>
              <span v-if="tournament.useRating" class="rating-badge"
                ><Star :size="12" />{{ team.rating ? Number(team.rating).toFixed(2) : '—' }}</span
              >
              <button
                v-if="hasGamesStarted"
                class="team-card__expand-btn"
                :class="{ 'team-card__expand-btn--active': expandedTeam === team.title }"
                @click.stop="toggleExpand(team.title)"
              >
                <ChevronDown :size="16" />
              </button>
            </div>
            <div v-if="team.players && team.players.length" class="team-card__players">
              <PlayerChip
                v-for="(player, pIdx) in team.players"
                :key="pIdx"
                :player="player"
                :is-captain="isCaptain(team, pIdx)"
              />
            </div>
            <ParticipantGames
              v-if="expandedTeam === team.title"
              :team-title="team.title"
              :tournament="tournament"
              @close="expandedTeam = null"
            />
          </div>
        </div>
      </div>
      <table v-else class="table">
        <tr
          v-for="(team, teamIndex) in group"
          :key="team.title"
          :class="{ 'search-highlight': isTeamHighlighted(team.title), 'team-table-row--clickable': hasGamesStarted }"
          @click="hasGamesStarted && toggleExpand(team.title)"
        >
          <td style="width: 30px">{{ teamIndex + 1 }}.</td>
          <td>
            <div class="team-table-row">
              <span>
                {{ team.title }}
                <div class="is-size-7" v-if="team.players && team.players.length > 1">
                  (<span class="has-text-dark" v-for="(player, index) in team.players" :key="index"
                    >{{ player.name }} {{ player.surname }}<span v-if="index < team.players.length - 1">, </span></span
                  >)
                </div>
                <div class="is-size-7 has-text-grey" v-if="getTeamClub(team)">{{ getTeamClub(team) }}</div>
              </span>
              <button
                v-if="hasGamesStarted"
                class="team-card__expand-btn team-card__expand-btn--table"
                :class="{ 'team-card__expand-btn--active': expandedTeam === team.title }"
                @click.stop="toggleExpand(team.title)"
              >
                <ChevronDown :size="16" />
              </button>
            </div>
            <ParticipantGames
              v-if="expandedTeam === team.title"
              :team-title="team.title"
              :tournament="tournament"
              @close="expandedTeam = null"
            />
          </td>
          <td class="td-100" v-if="tournament.useRating">
            <span class="rating-badge"
              ><Star :size="12" />{{ team.rating ? Number(team.rating).toFixed(2) : '—' }}</span
            >
          </td>
        </tr>
      </table>
    </div>
  </div>
  <div v-else-if="hasRichData" class="teams-cards">
    <div
      v-for="(team, teamIndex) in sortedTeams"
      :key="team.title"
      class="team-card"
      :class="{
        'team-card--highlighted': isTeamHighlighted(team.title),
        'team-card--expanded': expandedTeam === team.title,
        'team-card--clickable': hasGamesStarted,
      }"
      @click="hasGamesStarted && toggleExpand(team.title)"
    >
      <div class="team-card__rank">{{ teamIndex + 1 }}</div>
      <div class="team-card__body">
        <div class="team-card__header">
          <div v-if="!isSameClubTeam(team)" class="team-card__club-logos">
            <a
              v-for="club in getUniqueClubs(team)"
              :key="club.id"
              :href="'https://portal.petanque.org.ua/club/' + club.id"
              target="_blank"
              class="team-card__club-link"
              @click.stop
            >
              <img v-if="club.logo" :src="club.logo" class="team-card__club-logo" alt="" />
            </a>
          </div>
          <a v-else-if="getClubLogo(team)" :href="getClubUrl(team)" target="_blank" class="team-card__club-link" @click.stop>
            <img :src="getClubLogo(team)" class="team-card__club-logo" alt="" />
          </a>
          <div class="team-card__title-block">
            <span class="team-card__name">{{ team.title }}</span>
            <a v-if="getTeamClub(team)" :href="getClubUrl(team)" target="_blank" class="team-card__club" @click.stop>{{
              getTeamClub(team)
            }}</a>
          </div>
          <span v-if="tournament.useRating" class="rating-badge"
            ><Star :size="12" />{{ team.rating ? Number(team.rating).toFixed(2) : '—' }}</span
          >
          <button
            v-if="hasGamesStarted"
            class="team-card__expand-btn"
            :class="{ 'team-card__expand-btn--active': expandedTeam === team.title }"
            @click.stop="toggleExpand(team.title)"
          >
            <ChevronDown :size="16" />
          </button>
          <button v-if="showRemove" class="team-remove-btn" @click.prevent="removeTeam(team.title)">
            <X :size="16" />
          </button>
        </div>
        <div v-if="team.players && team.players.length" class="team-card__players">
          <PlayerChip
            v-for="(player, pIdx) in team.players"
            :key="pIdx"
            :player="player"
            :is-captain="isCaptain(team, pIdx)"
          />
        </div>
        <ParticipantGames
          v-if="expandedTeam === team.title"
          :team-title="team.title"
          :tournament="tournament"
          @close="expandedTeam = null"
        />
      </div>
    </div>
  </div>
  <div v-else class="teams-table-wrapper">
    <table id="table-list" class="table is-fullwidth">
      <tr
        v-for="team in sortedTeams"
        :key="team.title"
        :class="{ 'search-highlight': isTeamHighlighted(team.title), 'team-table-row--clickable': hasGamesStarted }"
        @click="hasGamesStarted && toggleExpand(team.title)"
      >
        <td>
          <div class="team-table-row">
            <span>
              {{ team.title }}
              <div class="is-size-7 is-hidden-tablet" v-if="team.players && team.players.length > 1">
                (<span class="has-text-dark" v-for="(player, index) in team.players" :key="index"
                  >{{ player.name }} {{ player.surname }}<span v-if="index < team.players.length - 1">, </span></span
                >)
              </div>
              <div class="is-size-7 has-text-grey is-hidden-tablet" v-if="getTeamClub(team)">
                {{ getTeamClub(team) }}
              </div>
            </span>
            <button
              v-if="hasGamesStarted"
              class="team-card__expand-btn team-card__expand-btn--table"
              :class="{ 'team-card__expand-btn--active': expandedTeam === team.title }"
              @click.stop="toggleExpand(team.title)"
            >
              <ChevronDown :size="16" />
            </button>
          </div>
          <ParticipantGames
            v-if="expandedTeam === team.title"
            :team-title="team.title"
            :tournament="tournament"
            @close="expandedTeam = null"
          />
        </td>
        <td class="is-hidden-mobile is-size-7" v-if="team.players && team.players.length > 1">
          <span class="has-text-dark" v-for="(player, index) in team.players" :key="index"
            >{{ player.name }} {{ player.surname }}<span v-if="index < team.players.length - 1">, </span></span
          >
        </td>
        <td class="is-hidden-mobile is-size-7" v-else></td>
        <td class="is-hidden-mobile is-size-7 has-text-grey" v-if="getTeamClub(team)">
          <span v-for="(line, i) in formatClub(getTeamClub(team))" :key="i"
            >{{ line }}<br v-if="i === 0 && formatClub(getTeamClub(team)).length > 1"
          /></span>
        </td>
        <td class="is-hidden-mobile" v-else></td>
        <td class="td-100" v-if="tournament.useRating">
          <span class="rating-badge"><Star :size="12" />{{ team.rating ? Number(team.rating).toFixed(2) : '—' }}</span>
        </td>
        <td
          class="td-50"
          v-if="
            !previewTournament &&
            (tournament.system === 'supermele' || (!tournament.games?.length && !tournament.playOff))
          "
        >
          <button class="team-remove-btn" @click="removeTeam(team.title)">
            <X :size="16" />
          </button>
        </td>
      </tr>
    </table>
  </div>
  </template>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { tournamentNames, sortTeams, rankGroupByRegulations } from '@/helpers';
import { Users, X, Star, ChevronDown } from 'lucide-vue-next';
import PlayerChip from '@/components/partials/PlayerChip.vue';
import ParticipantGames from '@/components/partials/ParticipantGames.vue';

export default {
  name: 'TeamsList',
  components: { Users, X, Star, ChevronDown, PlayerChip, ParticipantGames },
  props: ['previewTournament', 'activeRound', 'highlightedTeam', 'teamClubMap'],
  data() {
    return {
      expandedTeam: null,
      activeClubFilter: null,
    };
  },
  computed: {
    ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament', 'activeTournament']),
    tournament() {
      return this.previewTournament || this.activeTournament || this.currentTournament;
    },
    allClubs() {
      if (!this.tournament?.teams?.length) return [];
      const clubMap = new Map();
      this.tournament.teams.forEach((team) => {
        if (!team.players?.length) return;
        const seenInTeam = new Set();
        team.players.forEach((p) => {
          if (!p.club_id || !p.club) return;
          if (!clubMap.has(p.club_id)) {
            clubMap.set(p.club_id, { id: p.club_id, name: p.club, logo: p.club_logo_url || null, count: 0 });
          }
          if (!seenInTeam.has(p.club_id)) {
            seenInTeam.add(p.club_id);
            clubMap.get(p.club_id).count++;
          }
        });
      });
      return [...clubMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    },
    groupsNames() {
      return tournamentNames;
    },
    isSinglePlayerTournament() {
      if (this.tournament?.system === 'tir') return true;
      if (!this.tournament?.teams?.length) return false;
      return this.tournament.teams.every((t) => !t.players?.length || t.players.length === 1);
    },
    sortedTeams() {
      if (!this.tournament?.teams) return [];
      let teams;
      if (this.isSinglePlayerTournament) {
        teams = [...this.tournament.teams].sort((a, b) => {
          const clubA = this.getTeamClub(a) || '';
          const clubB = this.getTeamClub(b) || '';
          return clubA.localeCompare(clubB) || a.title.localeCompare(b.title);
        });
      } else if (!this.tournament.games?.length && !this.tournament.roundIsActive) {
        teams = [...this.tournament.teams].sort((a, b) => a.title.localeCompare(b.title));
      } else if (this.tournament.system === 'swiss') {
        teams = sortTeams([...this.tournament.teams]);
      } else if (this.tournament.system === 'supermele') {
        teams = [...this.tournament.teams].sort(
          (a, b) =>
            (b.wins || 0) - (a.wins || 0) ||
            (b.pointsPlus || 0) - (b.pointsMinus || 0) - ((a.pointsPlus || 0) - (a.pointsMinus || 0)) ||
            (b.pointsPlus || 0) - (a.pointsPlus || 0) ||
            (b.rating || 0) - (a.rating || 0),
        );
      } else if (
        (this.tournament.system === 'groups' || this.tournament.system === 'poules') &&
        this.tournament.games?.length
      ) {
        teams = [...this.tournament.teams].sort(
          (a, b) =>
            (b.wins || 0) - (a.wins || 0) ||
            (b.pointsPlus || 0) - (b.pointsMinus || 0) - ((a.pointsPlus || 0) - (a.pointsMinus || 0)) ||
            (b.pointsPlus || 0) - (a.pointsPlus || 0),
        );
      } else {
        teams = [...this.tournament.teams].sort((a, b) => a.title.localeCompare(b.title));
      }
      if (this.activeClubFilter) {
        teams = teams.filter((t) => t.players?.some((p) => p.club_id === this.activeClubFilter));
      }
      return teams;
    },
    sortedGroups() {
      if (!this.tournament.groups) return [];
      let groups;
      if (!this.tournament.games?.length) {
        groups = this.tournament.groups;
      } else if (this.tournament.system === 'groups' || this.tournament.groups?.length) {
        groups = this.tournament.groups.map((group) => {
          const teamWins = {};
          const teamPointsPlus = {};
          const teamPointsMinus = {};
          group.forEach((t) => {
            teamWins[t.title] = 0;
            teamPointsPlus[t.title] = 0;
            teamPointsMinus[t.title] = 0;
          });
          this.tournament.games.forEach((roundGames) => {
            roundGames.forEach((game) => {
              if (game.team_1_score == null || game.team_2_score == null) return;
              if (game.status === 'in_progress' || game.status === 'not_started') return;
              const t1 = game.team_1;
              const t2 = game.team_2;
              if (!(t1 in teamWins) || !(t2 in teamWins)) return;
              const s1 = Number(game.team_1_score);
              const s2 = Number(game.team_2_score);
              teamPointsPlus[t1] = (teamPointsPlus[t1] || 0) + s1;
              teamPointsMinus[t1] = (teamPointsMinus[t1] || 0) + s2;
              teamPointsPlus[t2] = (teamPointsPlus[t2] || 0) + s2;
              teamPointsMinus[t2] = (teamPointsMinus[t2] || 0) + s1;
              if (s1 > s2) {
                teamWins[t1]++;
              } else if (s2 > s1) {
                teamWins[t2]++;
              }
            });
          });
          group.forEach((team) => {
            team.wins = teamWins[team.title] || 0;
            team.pointsPlus = teamPointsPlus[team.title] || 0;
            team.pointsMinus = teamPointsMinus[team.title] || 0;
          });
          return rankGroupByRegulations(group, this.tournament.games || []);
        });
      } else {
        groups = this.tournament.groups.map((group) => {
          return [...group].sort(
            (a, b) =>
              (b.wins || 0) - (a.wins || 0) ||
              (b.pointsPlus || 0) - (b.pointsMinus || 0) - ((a.pointsPlus || 0) - (a.pointsMinus || 0)) ||
              (b.pointsPlus || 0) - (a.pointsPlus || 0),
          );
        });
      }
      if (this.activeClubFilter) {
        groups = groups.map((g) => g.filter((t) => t.players?.some((p) => p.club_id === this.activeClubFilter)));
      }
      return groups;
    },
    hasRichData() {
      if (!this.tournament?.teams?.length) return false;
      return this.tournament.teams.some(
        (t) => t.players?.length && (t.players[0].avatar_url || t.players[0].rating_place || t.club),
      );
    },
    showRemove() {
      return (
        !this.previewTournament &&
        (this.tournament.system === 'supermele' || (!this.tournament.games?.length && !this.tournament.playOff))
      );
    },
    hasGamesStarted() {
      if (this.tournament.system === 'supermele' || this.tournament.system === 'tir') return false;
      return !!(
        this.tournament.games?.length ||
        this.tournament.cadrage?.length ||
        this.tournament.playOff?.length ||
        this.tournament.playOffBracket ||
        this.tournament.teamPlayoff
      );
    },
  },
  methods: {
    ...mapActions(useMainStore, ['removeTeam']),
    toggleExpand(teamTitle) {
      this.expandedTeam = this.expandedTeam === teamTitle ? null : teamTitle;
    },
    toggleClubFilter(clubId) {
      this.activeClubFilter = this.activeClubFilter === clubId ? null : clubId;
    },
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
      if (!team.players || !team.players.length) return false;
      const clubId = team.players[0].club_id;
      if (!clubId) return false;
      return team.players.every((p) => p.club_id === clubId);
    },
    getUniqueClubs(team) {
      if (!team.players) return [];
      const seen = new Set();
      const clubs = [];
      team.players.forEach((p) => {
        if (p.club_id && !seen.has(p.club_id)) {
          seen.add(p.club_id);
          clubs.push({ id: p.club_id, logo: p.club_logo_url });
        }
      });
      return clubs;
    },
    formatClub(club) {
      if (!club) return [];
      const match = club.match(/^(.+?)\s*([«"«].+[»"»])$/);
      if (match) {
        return [match[1], match[2]];
      }
      return [club];
    },
  },
};
</script>

<style scoped>
.club-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0;
  margin-bottom: 0.75rem;
  align-items: center;
}

.club-filter__chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--color-surface, #fff);
  cursor: pointer;
  transition: all 0.15s;
}

.club-filter__chip:hover {
  border-color: var(--color-primary, #7c3aed);
}

.club-filter__chip--active {
  border-color: var(--color-primary, #7c3aed);
  box-shadow: 0 0 0 2px rgb(124 58 237 / 20%);
}

.club-filter__logo {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
}

.club-filter__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: var(--color-bg-input, #f0f0f0);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-muted, #888);
}

.club-filter__count {
  position: absolute;
  top: -4px;
  right: -4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  background: var(--color-text-muted, #888);
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
}

.club-filter__chip--active .club-filter__count {
  background: var(--color-primary, #7c3aed);
}

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
  background: var(--color-primary-light, rgb(139 92 246 / 6%));
}

.team-card__rank {
  min-width: 24px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text-muted, #999);
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
  background: rgb(124 58 237 / 10%);
  color: #7c3aed;
  white-space: nowrap;
  flex-shrink: 0;
}

.search-highlight td {
  background: var(--color-primary-light, rgb(139 92 246 / 12%)) !important;
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
}

.team-card--expanded {
  border-color: var(--color-primary, #7c3aed);
  box-shadow: 0 2px 8px rgb(124 58 237 / 8%);
}

.team-card--clickable {
  cursor: pointer;
}

.team-table-row--clickable {
  cursor: pointer;
}

.team-card__expand-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border, #eee);
  background: var(--color-surface, #fff);
  color: var(--color-text-muted, #999);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.team-card__expand-btn:hover {
  border-color: var(--color-primary, #7c3aed);
  color: var(--color-primary, #7c3aed);
  background: rgb(124 58 237 / 6%);
}

.team-card__expand-btn--active {
  border-color: var(--color-primary, #7c3aed);
  color: var(--color-primary, #7c3aed);
  background: rgb(124 58 237 / 10%);
  transform: rotate(180deg);
}

.team-card__expand-btn--table {
  margin-left: auto;
}

.team-table-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.teams-table-wrapper {
  width: 100%;
}

.teams-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.teams-empty__icon {
  color: var(--color-text-muted);
  opacity: 0.5;
  margin-bottom: 0.75rem;
}

.teams-empty__text {
  color: var(--color-text-muted);
  font-size: 1rem;
  margin: 0;
}
</style>
