<template>
  <div class="tir-playoff">
    <TirPlayoffMatch
      v-if="activeMatch"
      :match="activeMatch"
      :ateliers="ateliers"
      :distances="distances"
      :round-label="activeMatchLabel"
      @back="$emit('close-match')"
      @update="$emit('score-update', $event)"
    />

    <template v-else>
      <div
        v-for="(round, roundIndex) in rounds"
        :key="round.key || roundIndex"
        class="tir-playoff__round"
        :class="{ 'tir-playoff__round--final': round.isFinal }"
      >
        <h4 class="tir-playoff__round-title">{{ round.title }}</h4>
        <div
          v-for="(entry, matchIndex) in round.entries"
          :key="matchIndex"
          class="tir-playoff__match"
          :class="{
            'tir-playoff__match--complete': isComplete(entry.match),
            'tir-playoff__match--in-progress': isInProgress(entry.match),
            'tir-playoff__match--pending': !entry.match.player1 || !entry.match.player2,
          }"
          @click="$emit('open-match', entry.match, round.title)"
        >
          <div class="tir-playoff__match-top">
            <span class="tir-playoff__match-num" @click.stop="$emit('edit-lane', roundIndex, matchIndex, entry.match)">
              {{ entry.lane }}
            </span>
            <span v-if="isComplete(entry.match)" class="tir-playoff__match-status tir-playoff__match-status--complete">
              {{ $t('tir.matchCompleted') }}
            </span>
            <span
              v-else-if="isInProgress(entry.match)"
              class="tir-playoff__match-status tir-playoff__match-status--progress"
            >
              {{ $t('tir.matchInProgress') }}
            </span>
            <Pencil v-if="entry.match.player1 && entry.match.player2" :size="14" class="tir-playoff__match-edit" />
          </div>
          <div class="tir-playoff__match-row">
            <span
              class="tir-playoff__player-name"
              :class="{ 'tir-playoff__player-name--winner': entry.match.winner === entry.match.player1 }"
            >
              <Trophy v-if="entry.match.winner === entry.match.player1" :size="12" class="tir-playoff__winner-icon" />
              {{ entry.match.player1 || '—' }}
            </span>
            <span
              class="tir-playoff__score"
              :class="{ 'tir-playoff__score--winner': entry.match.winner === entry.match.player1 }"
            >
              {{ entry.match.score1 !== null ? entry.match.score1 : '—' }}
            </span>
            <span class="tir-playoff__vs">vs</span>
            <span
              class="tir-playoff__score"
              :class="{ 'tir-playoff__score--winner': entry.match.winner === entry.match.player2 }"
            >
              {{ entry.match.score2 !== null ? entry.match.score2 : '—' }}
            </span>
            <span
              class="tir-playoff__player-name tir-playoff__player-name--right"
              :class="{ 'tir-playoff__player-name--winner': entry.match.winner === entry.match.player2 }"
            >
              {{ entry.match.player2 || '—' }}
              <Trophy v-if="entry.match.winner === entry.match.player2" :size="12" class="tir-playoff__winner-icon" />
            </span>
          </div>
        </div>
      </div>

      <button v-if="canFinish" class="tir-playoff__advance-btn" @click="$emit('finish')">
        {{ $t('teams.finishTournament') }}
      </button>

      <div v-if="tournamentFinished" class="tir-playoff__export">
        <button class="tir-playoff__export-btn" @click="$emit('export', 'csv')"><Download :size="16" />CSV</button>
        <button class="tir-playoff__export-btn" @click="$emit('export', 'json')"><Download :size="16" />JSON</button>
      </div>
    </template>
  </div>
</template>

<script>
import { Download, Pencil, Trophy } from 'lucide-vue-next';
import TirPlayoffMatch from './TirPlayoffMatch.vue';

export default {
  name: 'TirPlayoffAdmin',
  components: { Download, Pencil, Trophy, TirPlayoffMatch },
  props: {
    activeMatch: { type: Object, default: null },
    activeMatchLabel: { type: String, default: '' },
    ateliers: { type: Array, required: true },
    distances: { type: Array, required: true },
    rounds: { type: Array, required: true },
    canFinish: { type: Boolean, default: false },
    tournamentFinished: { type: Boolean, default: false },
  },
  emits: ['close-match', 'score-update', 'open-match', 'edit-lane', 'finish', 'export'],
  methods: {
    isComplete(match) {
      return !!match.complete || !!match.winner;
    },
    isInProgress(match) {
      return (
        !this.isComplete(match) && !!match.player1 && !!match.player2 && (match.score1 != null || match.score2 != null)
      );
    },
  },
};
</script>

<style scoped>
.tir-playoff {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tir-playoff__round {
  margin-bottom: 0;
}

.tir-playoff__round--final {
  border-color: var(--tir-touche);
}

.tir-playoff__round-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.tir-playoff__match {
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  background: var(--color-surface);
  transition:
    background 0.15s,
    border-color 0.15s;
}

.tir-playoff__match:hover {
  background: var(--color-surface-hover);
  border-color: var(--tir-touche);
}

.tir-playoff__match:last-child {
  margin-bottom: 0;
}

.tir-playoff__match--complete {
  border-color: var(--tir-carreau);
  background: rgb(76 175 80 / 6%);
  border-width: 2px;
}

.tir-playoff__match--complete .tir-playoff__match-num {
  background: var(--tir-carreau);
  color: var(--color-btn-text);
}

.tir-playoff__match--in-progress {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  border-width: 2px;
}

.tir-playoff__match--in-progress .tir-playoff__match-num {
  background: var(--color-primary);
  color: var(--color-btn-text);
}

.tir-playoff__match--pending {
  opacity: 0.5;
  cursor: default;
}

.tir-playoff__match--pending:hover {
  background: var(--color-surface);
  border-color: var(--color-border);
}

.tir-playoff__match-top,
.tir-playoff__match-row,
.tir-playoff__export {
  display: flex;
  align-items: center;
}

.tir-playoff__match-top {
  gap: 8px;
  margin-bottom: 8px;
}

.tir-playoff__match-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s;
}

.tir-playoff__match-num:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.tir-playoff__match-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.tir-playoff__match-status--complete {
  color: var(--tir-winner-text);
  background: rgb(76 175 80 / 12%);
}

.tir-playoff__match-status--progress {
  color: var(--tir-in-progress);
  background: var(--tir-in-progress-bg);
}

.tir-playoff__match-edit {
  margin-left: auto;
  color: var(--color-text-muted);
}

.tir-playoff__match-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto minmax(0, 1fr);
  gap: 8px;
}

.tir-playoff__player-name {
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: break-word;
}

.tir-playoff__player-name--right {
  text-align: right;
}

.tir-playoff__player-name--winner {
  color: var(--tir-winner);
  font-weight: 700;
}

.tir-playoff__score {
  min-width: 28px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  flex-shrink: 0;
}

.tir-playoff__score--winner {
  color: var(--color-text);
}

.tir-playoff__vs {
  min-width: 24px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.tir-playoff__winner-icon {
  color: var(--tir-winner);
  width: 12px;
  height: 12px;
  vertical-align: -1px;
  flex-shrink: 0;
  display: inline-block;
  margin-left: 4px;
}

.tir-playoff__advance-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: var(--tir-touche);
  color: var(--color-btn-text);
  font-weight: 700;
  cursor: pointer;
}

.tir-playoff__export {
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.tir-playoff__export-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.tir-playoff__export-btn:hover {
  background: var(--color-surface-alt);
}
</style>
