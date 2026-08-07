<template>
  <section class="club-rosters">
    <div class="club-rosters__intro">
      <h3>{{ $t('clubCup.rostersTitle') }}</h3>
      <p>{{ $t('clubCup.rostersHint') }}</p>
    </div>

    <div class="club-rosters__grid">
      <article v-for="team in tournament.teams" :key="team.title" class="club-roster-card">
        <header class="club-roster-card__header">
          <strong>{{ team.title }}</strong>
          <span
            class="club-roster-card__count"
            :class="{ 'club-roster-card__count--warning': !rosterStatus(team).valid }"
          >
            {{ $t('clubCup.playersCount', { count: rosterStatus(team).count }) }}
          </span>
        </header>

        <div v-if="team.players?.length" class="club-roster-card__players">
          <span v-for="(player, index) in team.players" :key="playerKey(player, index)" class="club-roster-player">
            {{ playerName(player) }}
            <button
              type="button"
              class="club-roster-player__remove"
              :title="$t('clubCup.removePlayer')"
              @click="removePlayer(team, index)"
            >
              <X :size="13" />
            </button>
          </span>
        </div>
        <p v-else class="club-roster-card__empty">{{ $t('clubCup.noPlayers') }}</p>

        <form class="club-roster-card__add" @submit.prevent="addPlayer(team)">
          <input
            v-model="newPlayerNames[team.title]"
            class="club-roster-card__input"
            type="text"
            :placeholder="$t('clubCup.playerName')"
            :disabled="rosterStatus(team).count >= rosterMax"
          />
          <button
            type="submit"
            class="club-roster-card__button"
            :disabled="rosterStatus(team).count >= rosterMax || !newPlayerNames[team.title]?.trim()"
          >
            {{ $t('clubCup.addPlayer') }}
          </button>
        </form>

        <p v-if="rosterStatus(team).tooSmall" class="club-roster-card__validation">
          {{ $t('clubCup.rosterTooSmall', { min: rosterMin }) }}
        </p>
        <p v-else-if="rosterStatus(team).tooLarge" class="club-roster-card__validation">
          {{ $t('clubCup.rosterTooLarge', { max: rosterMax }) }}
        </p>
      </article>
    </div>
  </section>
</template>

<script>
import { X } from 'lucide-vue-next';
import { mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { CLUB_ROSTER_MAX, CLUB_ROSTER_MIN, getClubRosterStatus } from '@/services/club-tournament';

export default {
  name: 'ClubRosterEditor',
  components: { X },
  props: {
    tournament: { type: Object, required: true },
  },
  data() {
    return {
      newPlayerNames: {},
      rosterMin: CLUB_ROSTER_MIN,
      rosterMax: CLUB_ROSTER_MAX,
    };
  },
  methods: {
    ...mapActions(useMainStore, ['syncTeams']),
    rosterStatus: getClubRosterStatus,
    playerKey(player, index) {
      return player?.id ?? `${player?.surname || ''}-${player?.name || ''}-${index}`;
    },
    playerName(player) {
      return [player?.surname, player?.name, player?.second_name].filter(Boolean).join(' ').trim();
    },
    addPlayer(team) {
      const value = this.newPlayerNames[team.title]?.trim();
      if (!value || getClubRosterStatus(team).count >= CLUB_ROSTER_MAX) return;
      if (!Array.isArray(team.players)) team.players = [];
      team.players.push({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: value,
        surname: '',
        second_name: '',
      });
      this.newPlayerNames[team.title] = '';
      this.syncTeams();
    },
    removePlayer(team, index) {
      team.players.splice(index, 1);
      this.syncTeams();
    },
  },
};
</script>

<style scoped>
.club-rosters {
  margin-top: 1.25rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.25rem;
}

.club-rosters__intro h3 {
  margin-bottom: 0.25rem;
  font-size: 1.05rem;
}

.club-rosters__intro p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.club-rosters__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.85rem;
  margin-top: 1rem;
}

.club-roster-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  padding: 0.9rem;
}

.club-roster-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.club-roster-card__count {
  flex-shrink: 0;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: rgb(46 204 113 / 14%);
  color: var(--color-success, #208e4e);
  font-size: 0.75rem;
  font-weight: 600;
}

.club-roster-card__count--warning {
  background: rgb(245 158 11 / 14%);
  color: var(--color-warning-dark, #9a6400);
}

.club-roster-card__players {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.club-roster-player {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.35rem 0.25rem 0.55rem;
  border-radius: 999px;
  background: var(--color-surface-hover);
  color: var(--color-text);
  font-size: 0.82rem;
}

.club-roster-player__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  padding: 0.1rem;
  cursor: pointer;
}

.club-roster-player__remove:hover {
  color: var(--color-danger, #e53935);
}

.club-roster-card__empty {
  margin: 0.75rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.club-roster-card__add {
  display: flex;
  gap: 0.45rem;
  margin-top: 0.75rem;
}

.club-roster-card__input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-bg-input);
  color: var(--color-text);
  padding: 0.45rem 0.6rem;
}

.club-roster-card__button {
  border: 1px solid var(--color-primary);
  border-radius: 7px;
  background: var(--color-primary);
  color: var(--color-btn-text);
  padding: 0.45rem 0.7rem;
  cursor: pointer;
}

.club-roster-card__button:disabled,
.club-roster-card__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.club-roster-card__validation {
  margin: 0.55rem 0 0;
  color: var(--color-warning-dark, #9a6400);
  font-size: 0.78rem;
}
</style>
