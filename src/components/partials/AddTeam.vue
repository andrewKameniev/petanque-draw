<template>
  <div class="add-team-card">
    <div class="add-team-card__row" v-if="!importHidden">
      <input
        v-model="tournamentId"
        class="add-team-card__input"
        type="number"
        min="1"
        data-testid="input-portal-id"
        :aria-label="$t('teams.tournamentId')"
        :placeholder="$t('teams.tournamentId')"
        :disabled="importing"
        @keydown.enter.prevent="importList"
      />
      <button
        type="button"
        class="add-team-card__btn add-team-card__btn--import"
        data-testid="btn-import-portal"
        :disabled="importing || !tournamentId"
        @click="importList"
      >
        <Download :size="16" aria-hidden="true" />
        {{ $t(importing ? 'teams.importing' : 'teams.importPortal') }}
      </button>
      <button
        v-if="tournament.teams && tournament.teams.length"
        class="add-team-card__btn add-team-card__btn--clear"
        @click="onClearTeams"
      >
        <Trash2 :size="14" />
        {{ $t('teams.clearTeams') }}
      </button>
    </div>
    <div class="add-team-card__row">
      <input
        v-model="teamTitle"
        @keyup.enter="addTeam(teamTitle, teamRating)"
        class="add-team-card__input add-team-card__input--name"
        type="text"
        data-testid="input-team-title"
        :placeholder="$t('teams.teamTitle')"
      />
      <input
        v-if="tournament.useRating"
        v-model="teamRating"
        @keyup.enter="addTeam(teamTitle, teamRating)"
        class="add-team-card__input add-team-card__input--rating"
        type="number"
        :placeholder="$t('teams.rating')"
      />
      <button class="add-team-card__btn" data-testid="btn-add-team" @click="addTeam(teamTitle, teamRating)">
        {{ $t('teams.addTeam') }}
      </button>
    </div>
    <div class="add-team-card__footer">
      <label class="add-team-card__checkbox">
        <input type="checkbox" :checked="tournament.useRating" @change="changeDrawType($event.target.checked)" />
        {{ $t('teams.useTeamRating') }}
      </label>
      <button v-if="showRestore" class="add-team-card__restore" @click="$emit('restore')">
        {{ $t('teams.restoreTeams') }}
      </button>
    </div>
  </div>
</template>

<script>
import { fetchPortalTournament } from '@/services/portal';
import { isPortalClubTournament } from '@/services/club-competition';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { Download, Trash2 } from 'lucide-vue-next';

export default {
  name: 'AddTeam',
  components: { Download, Trash2 },
  props: ['importHidden', 'showRestore'],
  data() {
    return {
      teamTitle: null,
      teamRating: null,
      tournamentId: null,
      importing: false,
    };
  },
  emits: ['add-team', 'change-draw-style', 'restore', 'club-import'],
  computed: {
    ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament', 'activeTournament']),
    tournament() {
      return this.activeTournament || this.currentTournament;
    },
  },
  methods: {
    ...mapActions(useMainStore, [
      'addTeamToStore',
      'clearTeams',
      'changeDrawType',
      'showMessage',
      'setTournamentIdFromPortal',
      'setTournamentInfoFromPortal',
      'syncTeams',
    ]),
    addTeam(title, rating, players = false, portalTeamId = null, club = null, coach = null) {
      if (title !== null && title !== '') {
        let teamExists = false;
        if (!this.tournament.teams) {
          this.tournament.teams = [];
        }
        this.tournament.teams.forEach((team) => {
          if (team.title === title) {
            teamExists = true;
          }
        });
        if (!teamExists) {
          const team = {
            title: title.trim(),
            rating: rating,
            players: players,
            club: club,
            coach: coach,
            portalTeamId: portalTeamId,
            wins: 0,
            buhgolts: 0,
            smallBuhgolts: 0,
            pointsPlus: 0,
            pointsMinus: 0,
            opponents: ['placeholder'],
            lanes: [],
          };
          this.addTeamToStore(team);
          this.syncTeams();
          this.teamTitle = null;
          this.teamRating = null;
        } else {
          this.showMessage({
            title: this.$t('messages.error'),
            text: this.$t('messages.teamExists'),
            type: 'error',
          });
        }
      } else {
        this.showMessage({
          title: this.$t('messages.error'),
          text: this.$t('messages.enterFields'),
          type: 'error',
        });
      }
    },
    async importList() {
      if (!this.tournamentId || this.importing) return;
      const portalId = String(this.tournamentId).trim();
      this.importing = true;
      try {
        const importedList = await fetchPortalTournament(portalId);
        if (isPortalClubTournament(importedList)) {
          this.$emit('club-import', { ...importedList, portalId });
          return;
        }
        importedList.teams.forEach((team) => {
          this.addTeam(team.name, +team.power, team.players, team.id, team.club, team.coach);
        });
        this.setTournamentInfoFromPortal(importedList.tournament);
        this.setTournamentIdFromPortal(portalId);
        this.syncTeams();
      } catch {
        this.showMessage({
          title: this.$t('messages.error'),
          text: this.$t('messages.tournamentNotFound'),
          type: 'error',
        });
      } finally {
        this.importing = false;
      }
    },
    onClearTeams() {
      this.clearTeams();
    },
  },
};
</script>

<style scoped>
.add-team-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.add-team-card__row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.add-team-card__input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
  background: var(--color-bg-input);
  color: var(--color-text);
}

.add-team-card__input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-shadow);
}

.add-team-card__input--name {
  flex: 2;
}

.add-team-card__input--rating {
  flex: 0 0 80px;
}

.add-team-card__btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-add-team-btn);
  background: var(--color-add-team-btn);
  color: var(--color-btn-text);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.add-team-card__btn:hover {
  background: var(--color-add-team-btn-hover);
  border-color: var(--color-add-team-btn-hover);
}

.add-team-card__btn--clear {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.add-team-card__btn--import {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.add-team-card__btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.add-team-card__btn--clear:hover {
  background: var(--color-danger, #e53e3e);
  border-color: var(--color-danger, #e53e3e);
  color: #fff;
}

.add-team-card__btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.add-team-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.add-team-card__checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.add-team-card__restore {
  padding: 0.4rem 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.add-team-card__restore:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .add-team-card {
    padding: 1rem;
  }

  .add-team-card__row {
    flex-wrap: wrap;
  }

  .add-team-card__input--name {
    flex: 1 1 100%;
  }

  .add-team-card__input--rating {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .add-team-card__btn--import {
    width: 100%;
    justify-content: center;
  }
}
</style>
