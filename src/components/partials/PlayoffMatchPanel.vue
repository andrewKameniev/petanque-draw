<template>
  <section
    class="playoff-match-panel"
    :class="{ 'playoff-match-panel--public': publicView }"
    data-testid="playoff-match-panel"
  >
    <header class="playoff-match-panel__header">
      <h3>{{ title }}</h3>
      <slot name="actions"></slot>
    </header>
    <section v-for="stage in stages" :key="stage.id" class="playoff-match-panel__stage">
      <h4 v-if="stage.label" data-testid="playoff-stage-heading">{{ stage.label }}</h4>
      <Game
        v-for="entry in stage.matches"
        :key="entry.game.id || `${stage.id}-${entry.gameIndex}`"
        v-show="!entry.game.isBye"
        :active-tournament="tournament"
        :game="entry.game"
        :game-index="entry.gameIndex"
        :active-round="stage.stageIndex"
        :is-playoff="!entry.isThird"
        :is-third="!!entry.isThird"
        :lane-number="entry.laneNumber"
        :compact-view="publicView"
        :public-view="publicView"
        :highlighted-team="highlightedTeam"
        :team-club-map="teamClubMap"
        :tournament-finished="tournament.tournamentIsFinished"
        :class="{ 'game--highlighted': !publicView && isEntryHighlighted(entry) }"
        @save="$emit('save')"
        @swapLane="$emit('swap-lane', { stage, entry, payload: $event })"
        @update="$emit('update', { stage, entry, gameIndex: $event })"
        @finish="$emit('finish', { stage, entry, gameIndex: $event })"
      />
    </section>
    <div v-if="!publicView && scoreError" class="playoff-match-panel__error">
      {{ $t('games.resultsError') }}
    </div>
    <button
      v-if="!publicView && showSave"
      type="button"
      class="button playoff-match-panel__save"
      data-testid="btn-save-playoff"
      @click="$emit('save')"
    >
      <Save :size="16" /> {{ $t('games.saveResults') }}
    </button>
  </section>
</template>

<script>
import { Save } from 'lucide-vue-next';
import Game from '@/components/partials/Game.vue';

export default {
  name: 'PlayoffMatchPanel',
  components: { Game, Save },
  props: {
    tournament: { type: Object, required: true },
    stages: { type: Array, default: () => [] },
    title: { type: String, required: true },
    scoreError: { type: Boolean, default: false },
    showSave: { type: Boolean, default: true },
    publicView: { type: Boolean, default: false },
    highlightedTeam: { type: String, default: '' },
    teamClubMap: { type: Object, default: () => ({}) },
  },
  emits: ['finish', 'save', 'swap-lane', 'update'],
  methods: {
    isEntryHighlighted(entry) {
      if (!this.highlightedTeam) return false;
      const query = this.highlightedTeam.toLowerCase();
      const isHighlighted = (team) =>
        team?.toLowerCase().includes(query) || this.teamClubMap?.[team]?.toLowerCase().includes(query) || false;
      return isHighlighted(entry.game.team_1) || isHighlighted(entry.game.team_2);
    },
  },
};
</script>

<style scoped>
.playoff-match-panel {
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--color-primary);
  border-radius: 16px;
  background: var(--color-surface);
}

.playoff-match-panel__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  margin-bottom: 0.75rem;
}

.playoff-match-panel__header h3 {
  margin: 0;
  color: var(--color-text);
  text-align: center;
  font-size: 1.2rem;
  font-weight: 800;
}

.playoff-match-panel__stage + .playoff-match-panel__stage {
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.playoff-match-panel__stage h4 {
  margin: 0 0 0.65rem;
  color: var(--color-text-muted);
  text-align: center;
  font-size: 0.9rem;
  font-weight: 700;
}

.playoff-match-panel__error {
  margin-top: 0.75rem;
  color: var(--color-danger);
  text-align: center;
}

.playoff-match-panel__save {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0.55rem 1rem;
  margin: 1rem auto 0;
  border: 1px solid var(--color-border) !important;
  background: var(--color-surface) !important;
  color: var(--color-text) !important;
  font-weight: 600;
  box-shadow: none !important;
}

.playoff-match-panel__save:hover,
.playoff-match-panel__save:focus-visible {
  border-color: var(--color-primary) !important;
  color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px var(--color-primary-shadow) !important;
}

:deep(.game-row-wrapper) {
  width: 100%;
}

@media screen and (max-width: 768px) {
  .playoff-match-panel {
    padding: 0.75rem;
    border-radius: 12px;
  }

  .playoff-match-panel--public {
    display: contents;
  }
}
</style>
