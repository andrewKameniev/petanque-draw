<template>
  <div class="game-row-wrapper">
    <div
      class="game-row"
      data-testid="game-row"
      :class="{
        compact: compactView,
        'has-background-danger': gameHasError(game, maxScore),
        'game-row--finished': effectiveStatus === 'finished',
        'game-row--in-progress': effectiveStatus === 'in_progress',
      }"
    >
      <span
        v-if="!compactView && !isPlayoff && !isCadrage && !isThird && hasStreams"
        class="game-row__stream-indicator"
      >
        <component :is="streamIcon" :size="20" />
      </span>
      <div
        class="text-right team-block team-block--left"
        :class="{ 'has-text-weight-bold': game.team_1_score > game.team_2_score }"
      >
        <label :for="'team_' + gameIndex">{{ game.team_1 }}</label>
        <input
          :id="'team_' + gameIndex"
          v-model="currentGame.team_1_score"
          class="input -small"
          type="number"
          min="0"
          :disabled="isInputDisabled"
          @input="onScoreInput('team_1_score')"
          @focus="onFocus"
          @blur="onBlur"
          v-if="!compactView"
        />
        <span v-else class="compact-score" :class="{ 'compact-score--empty': !hasCompactScores }">
          {{ hasCompactScores ? game.team_1_score : '–' }}
        </span>
      </div>
      <span class="text-center score-block">
        <span class="lane-block is-size-7" :class="{ 'lane-block--clickable': canSwapLane }" @click="startSwap">
          <template v-if="swapMode">
            <input
              ref="swapInput"
              class="swap-lane-input"
              type="number"
              min="1"
              v-model.number="swapTarget"
              @keydown.enter.stop="confirmSwap"
              @keydown.escape="cancelSwap"
              @blur="confirmSwap"
            />
          </template>
          <template v-else>
            {{ $t('games.lane') }} <span class="is-size-5 has-text-weight-bold">{{ displayLane }}</span>
          </template>
        </span>
      </span>
      <div
        class="team-block team-block--right"
        :class="{ 'has-text-weight-bold': game.team_2_score > game.team_1_score }"
      >
        <label :for="'opponent_' + gameIndex">{{ game.team_2 }}</label>
        <input
          :id="'opponent_' + gameIndex"
          v-model="currentGame.team_2_score"
          class="input -small"
          type="number"
          min="0"
          :disabled="isInputDisabled"
          @input="onScoreInput('team_2_score')"
          @focus="onFocus"
          @blur="onBlur"
          v-if="!compactView"
        />
        <span v-else class="compact-score" :class="{ 'compact-score--empty': !hasCompactScores }">
          {{ hasCompactScores ? game.team_2_score : '–' }}
        </span>
      </div>
      <span v-if="!compactView" class="game-row__action">
        <button v-if="canFinishGame" class="game-row__finish-btn" @click.stop="$emit('finish', gameIndex)">
          {{ $t('games.finish') }}
        </button>
        <button v-else-if="canEditGame" class="game-row__edit-btn" @click.stop="unfishGame">
          <Pencil :size="16" />
        </button>
      </span>
      <div
        v-if="cochonettesEnabled && currentGame.score_history && currentGame.score_history.length && !compactView"
        class="game-row__history"
      >
        <span v-for="(entry, i) in currentGame.score_history" :key="i" class="game-row__history-chip">
          <span class="game-row__history-num">{{ i + 1 }}</span>
          <span class="game-row__history-score">{{ entry.s1 }}-{{ entry.s2 }}</span>
          <button class="game-row__history-remove" @click="removeScoreEntry(i)"><X :size="12" /></button>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { gameHasError } from '@/helpers';
import { getGameStreams, getStreamIconComponent } from '@/services/streams';
import { getGameLaneNumber } from '@/services/lanes';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { X, Pencil, Twitch, Facebook, Instagram, Video } from 'lucide-vue-next';
import YoutubeIcon from '@/components/icons/YoutubeIcon.vue';

export default {
  name: 'Game',
  components: { X, Pencil, YoutubeIcon, Twitch, Facebook, Instagram, Video },
  props: [
    'activeTournament',
    'gameIndex',
    'game',
    'activeRound',
    'compactView',
    'isPlayoff',
    'isCadrage',
    'isThird',
    'laneNumber',
  ],
  emits: ['save', 'swapLane', 'update', 'finish'],
  data() {
    return {
      swapMode: false,
      swapTarget: null,
    };
  },
  methods: {
    ...mapActions(useMainStore, [
      'updateGameScore',
      'setActiveGameMatchPath',
      'setActiveCadrageIndex',
      'setActiveBracketMatchPath',
    ]),
    gameHasError,
    onScoreInput(field) {
      const prevVal = this._prevScores?.[field] ?? null;
      this.clampScore(field);
      const newVal = Number(this.currentGame[field]);
      if (this.currentGame.status === 'not_started' || !this.currentGame.status) {
        this.currentGame.status = 'in_progress';
        this.currentGame.updated_at = new Date().toISOString();
      }
      this.$emit('update', this.gameIndex);
      if (this.cochonettesEnabled && !isNaN(newVal) && newVal > 0 && newVal > prevVal) {
        this.$nextTick(() => document.activeElement?.blur());
      }
      if (!this._prevScores) this._prevScores = {};
      this._prevScores[field] = isNaN(newVal) ? null : newVal;
    },
    clampScore(field) {
      const val = Number(this.currentGame[field]);
      if (val < 0 || isNaN(val)) {
        this.currentGame[field] = null;
      } else if (this.maxScore) {
        const max = Number(this.maxScore);
        if (val > max) {
          this.currentGame[field] = max;
        }
        const otherField = field === 'team_1_score' ? 'team_2_score' : 'team_1_score';
        const otherVal = Number(this.currentGame[otherField]);
        if (val >= max && otherVal >= max) {
          this.currentGame[otherField] = max - 1;
        }
      }
    },
    onFocus() {
      if (this.isCadrage) {
        this.setActiveCadrageIndex(this.gameIndex);
      } else if (this.isPlayoff || this.isThird) {
        const path = this.isThird ? 'thirdPlace' : `stages/${this.activeRound}/teams/${this.gameIndex}`;
        this.setActiveBracketMatchPath(path);
      } else {
        this.setActiveGameMatchPath(`${this.activeRound}/${this.gameIndex}`);
      }
    },
    onBlur() {
      if (this.isCadrage) {
        this.setActiveCadrageIndex(null);
      } else if (this.isPlayoff || this.isThird) {
        this.setActiveBracketMatchPath(null);
      } else {
        this.setActiveGameMatchPath(null);
      }
    },
    startSwap() {
      if (!this.canSwapLane) return;
      this.swapMode = true;
      this.swapTarget = this.displayLane;
      this.$nextTick(() => {
        this.$refs.swapInput?.focus();
        this.$refs.swapInput?.select();
      });
    },
    cancelSwap() {
      this.swapMode = false;
    },
    confirmSwap() {
      if (!this.swapMode) return;
      this.swapMode = false;
      if (this.swapTarget && this.swapTarget !== this.displayLane) {
        this.$emit('swapLane', { fromIndex: this.gameIndex, targetLane: this.swapTarget });
      }
    },
    unfishGame() {
      this.currentGame.status = 'in_progress';
      delete this.currentGame.winner;
      this.$emit('update', this.gameIndex);
    },
    removeScoreEntry(index) {
      this.currentGame.score_history.splice(index, 1);
      if (this.currentGame.score_history.length === 0) {
        this.currentGame.team_1_score = null;
        this.currentGame.team_2_score = null;
        this.currentGame.status = 'not_started';
        this.currentGame.updated_at = null;
        delete this.currentGame.score_history;
      } else {
        const last = this.currentGame.score_history[this.currentGame.score_history.length - 1];
        this.currentGame.team_1_score = last.s1;
        this.currentGame.team_2_score = last.s2;
      }
      this.$emit('update', this.gameIndex);
    },
  },
  computed: {
    ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament']),
    tournament() {
      return this.activeTournament || this.currentTournament;
    },
    effectiveStatus() {
      return this.game.status || 'not_started';
    },
    isInputDisabled() {
      if (this.game.team_2 === 'Technical') return true;
      if (this.effectiveStatus === 'finished' && this.tournament.system === 'groups') return false;
      return this.effectiveStatus === 'finished';
    },
    canFinishGame() {
      if (this.effectiveStatus === 'finished') return false;
      const s1 = Number(this.game.team_1_score);
      const s2 = Number(this.game.team_2_score);
      if (
        this.game.team_1_score === null ||
        this.game.team_1_score === '' ||
        this.game.team_2_score === null ||
        this.game.team_2_score === ''
      )
        return false;
      if (isNaN(s1) || isNaN(s2)) return false;
      return s1 !== s2 && (s1 > 0 || s2 > 0);
    },
    canEditGame() {
      if (this.effectiveStatus !== 'finished') return false;
      if (this.compactView || this.isThird) return false;
      if (this.tournament.system === 'groups') return false;
      return true;
    },
    canSwapLane() {
      if (this.compactView || this.isThird || this.game.team_2 === 'Technical') return false;
      if (this.effectiveStatus === 'finished' && this.tournament.system !== 'groups') return false;
      return true;
    },
    currentGame() {
      if (this.isThird) {
        return this.tournament.playOffBracket.thirdPlace;
      } else if (this.isCadrage) {
        return this.tournament.cadrage[this.gameIndex];
      } else if (this.isPlayoff) {
        return this.tournament.playOffBracket.stages[this.activeRound].teams[this.gameIndex];
      } else {
        return this.tournament.games[this.activeRound][this.gameIndex];
      }
    },
    displayLane() {
      if (!this.isPlayoff && !this.isCadrage && !this.isThird) {
        return getGameLaneNumber(this.game, this.tournament, this.gameIndex);
      }
      if (this.laneNumber != null) {
        return this.laneNumber + this.fieldsStart;
      }
      return this.gameIndex + this.fieldsStart;
    },
    maxScore() {
      return this.tournament.preferences.maxScore;
    },
    fieldsStart() {
      return this.tournament.preferences.fieldsStart;
    },
    hasCompactScores() {
      return (
        this.game.team_1_score != null &&
        this.game.team_1_score !== '' &&
        this.game.team_2_score != null &&
        this.game.team_2_score !== ''
      );
    },
    cochonettesEnabled() {
      if (this.isPlayoff || this.isThird) {
        return !!this.tournament.preferences.cochonettesEnabledPlayoff;
      }
      return !!this.tournament.preferences.cochonettesEnabled;
    },
    resolvedStreams() {
      return getGameStreams(this.game, this.tournament, this.gameIndex);
    },
    hasStreams() {
      return this.resolvedStreams.length > 0;
    },
    streamIcon() {
      if (!this.resolvedStreams.length) return 'Video';
      return getStreamIconComponent(this.resolvedStreams[0]);
    },
  },
};
</script>

<style scoped>
.game-row.has-background-danger {
  background: rgb(255 56 96 / 12%) !important;
}

.game-row__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  flex-shrink: 0;
  margin-right: 8px;
}

.game-row__finish-btn {
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-primary);
  color: var(--color-btn-text, #fff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.game-row__finish-btn:hover {
  opacity: 0.85;
}

.game-row__edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-muted, #999);
  transition:
    color 0.15s,
    background 0.15s;
}

.game-row__edit-btn:hover {
  color: var(--color-primary);
  background: rgb(108 92 231 / 10%);
}

.game-row__stream-indicator {
  position: absolute;
  left: 10px;
  top: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #e53935;
  padding: 4px;
}

.game-row__history {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 12px;
  margin: 6px 0;
  width: 100%;
}

.game-row__history-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 5px 3px 10px;
  border-radius: 14px;
  border: 1px solid var(--color-border, #e0e0e0);
  background: var(--color-surface, var(--color-white));
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.game-row__history-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted, #999);
  padding: 2px;
  border-radius: 50%;
  line-height: 1;
}

.game-row__history-remove:hover {
  color: var(--color-danger, #e53935);
  background: rgb(229 57 53 / 10%);
}

.game-row__history-num {
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
  flex-shrink: 0;
}

.compact-score {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  min-width: 1.5rem;
  text-align: center;
}

.compact-score--empty {
  color: var(--color-text-muted);
  font-weight: 400;
}

@media all and (max-width: 768px) {
  .game-row__stream-indicator {
    left: 10px;
  }

  .game-row__history {
    margin-top: 8px;
    padding: 8px;
    border-radius: 8px;
    background: rgb(108 92 231 / 8%);
  }
}
</style>
