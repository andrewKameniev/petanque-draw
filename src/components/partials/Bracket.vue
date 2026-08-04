<template>
  <Teleport to="body" :disabled="embedded">
    <div v-bind="$attrs" :class="embedded ? 'bracket-embedded' : 'modal is-active'">
      <PlayoffHeader
        v-if="embedded"
        :title="$t('doubleElimination.singleElimination')"
        :subtitle="$t('doubleElimination.singleEliminationRule')"
        :badge="`${participantCount} ${$t('common.teamsLabel')}`"
      />
      <div v-if="!embedded" class="modal-background" @click.self="$emit('close-modal')"></div>
      <div
        ref="bracketSection"
        :class="[
          'bracket-modal',
          {
            'modal-content': !embedded,
            'bracket-modal--embedded': embedded,
            'bracket-modal--fullscreen': isFullscreen,
          },
        ]"
      >
        <BracketFullscreenButton
          v-if="embedded"
          :is-fullscreen="isFullscreen"
          :aria-label="isFullscreen ? $t('common.close') : $t('games.showBracket')"
          data-testid="toggle-single-elimination-fullscreen"
          @toggle="toggleFullscreen"
        />
        <div class="bracket-container">
          <svg
            :width="svgWidth"
            :height="svgHeight"
            :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
            preserveAspectRatio="xMidYMid meet"
            class="bracket-svg"
          >
            <g v-for="(stage, si) in stages" :key="si">
              <g v-for="(game, gi) in stage.games" :key="gi">
                <rect :x="game.x" :y="game.y - 14" width="34" height="12" rx="2" class="match-id-badge" />
                <text :x="game.x + 17" :y="game.y - 5" class="match-id-text">
                  {{ singleMatchId(si, gi) }}
                </text>
                <rect :x="game.x" :y="game.y" :width="boxWidth" :height="boxHeight" rx="6" ry="6" class="game-box" />
                <line
                  :x1="game.x + 1"
                  :y1="game.y + boxHeight / 2"
                  :x2="game.x + boxWidth - 1"
                  :y2="game.y + boxHeight / 2"
                  class="game-divider"
                />
                <!-- Team 1 background (rounded top, flat bottom) -->
                <path
                  v-if="teamBg(game.data, 1, stage.stageLabel)"
                  :d="topHalfPath(game.x, game.y)"
                  :class="teamBg(game.data, 1, stage.stageLabel)"
                />
                <!-- Team 2 background (flat top, rounded bottom) -->
                <path
                  v-if="teamBg(game.data, 2, stage.stageLabel)"
                  :d="bottomHalfPath(game.x, game.y)"
                  :class="teamBg(game.data, 2, stage.stageLabel)"
                />
                <!-- Team 1 place badge -->
                <g v-if="game.data.team_1_place">
                  <rect
                    :x="game.x + 6"
                    :y="game.y + boxHeight / 4 - 7"
                    width="18"
                    height="14"
                    rx="2"
                    class="place-badge"
                  />
                  <text :x="game.x + 15" :y="game.y + boxHeight / 4" class="place-text">
                    {{ game.data.team_1_place }}
                  </text>
                </g>
                <!-- Team 1 name -->
                <text
                  :x="game.x + (game.data.team_1_place || game.data.team_2_place ? 30 : 10)"
                  :y="game.y + boxHeight / 4 + 4"
                  class="team-name"
                  :class="{ 'team-winner': isWinner(game.data, 1) }"
                >
                  {{ truncName(teamLabel(game.data, si, gi, 1), game.data.team_1_place || game.data.team_2_place) }}
                </text>
                <!-- Team 1 score -->
                <path
                  v-if="teamBg(game.data, 1, stage.stageLabel)"
                  :d="scoreTopPath(game.x, game.y)"
                  :class="'score-bg-' + teamBg(game.data, 1, stage.stageLabel)"
                />
                <text :x="game.x + boxWidth - 18" :y="game.y + boxHeight / 4 + 4" class="team-score">
                  {{ game.data.team_1_score }}
                </text>
                <!-- Team 2 place badge -->
                <g v-if="game.data.team_2_place">
                  <rect
                    :x="game.x + 6"
                    :y="game.y + (boxHeight * 3) / 4 - 7"
                    width="18"
                    height="14"
                    rx="2"
                    class="place-badge"
                  />
                  <text :x="game.x + 15" :y="game.y + (boxHeight * 3) / 4" class="place-text">
                    {{ game.data.team_2_place }}
                  </text>
                </g>
                <!-- Team 2 name -->
                <text
                  :x="game.x + (game.data.team_1_place || game.data.team_2_place ? 30 : 10)"
                  :y="game.y + (boxHeight * 3) / 4 + 4"
                  class="team-name"
                  :class="{ 'team-winner': isWinner(game.data, 2) }"
                >
                  {{ truncName(teamLabel(game.data, si, gi, 2), game.data.team_1_place || game.data.team_2_place) }}
                </text>
                <!-- Team 2 score -->
                <path
                  v-if="teamBg(game.data, 2, stage.stageLabel)"
                  :d="scoreBottomPath(game.x, game.y)"
                  :class="'score-bg-' + teamBg(game.data, 2, stage.stageLabel)"
                />
                <text :x="game.x + boxWidth - 18" :y="game.y + (boxHeight * 3) / 4 + 4" class="team-score">
                  {{ game.data.team_2_score }}
                </text>
              </g>
            </g>
            <!-- Third place game -->
            <g v-if="thirdPlaceGame">
              <text :x="thirdPlaceGame.x + boxWidth / 2" :y="thirdPlaceGame.y - 8" class="round-header">
                {{ $t('games.thirdPlace') }}
              </text>
              <rect
                :x="thirdPlaceGame.x"
                :y="thirdPlaceGame.y"
                :width="boxWidth"
                :height="boxHeight"
                rx="6"
                ry="6"
                class="game-box"
              />
              <line
                :x1="thirdPlaceGame.x + 1"
                :y1="thirdPlaceGame.y + boxHeight / 2"
                :x2="thirdPlaceGame.x + boxWidth - 1"
                :y2="thirdPlaceGame.y + boxHeight / 2"
                class="game-divider"
              />
              <path
                v-if="teamBg(thirdPlaceGame.data, 1, 'third')"
                :d="topHalfPath(thirdPlaceGame.x, thirdPlaceGame.y)"
                :class="teamBg(thirdPlaceGame.data, 1, 'third')"
              />
              <path
                v-if="teamBg(thirdPlaceGame.data, 2, 'third')"
                :d="bottomHalfPath(thirdPlaceGame.x, thirdPlaceGame.y)"
                :class="teamBg(thirdPlaceGame.data, 2, 'third')"
              />
              <text
                :x="thirdPlaceGame.x + 10"
                :y="thirdPlaceGame.y + boxHeight / 4 + 4"
                class="team-name"
                :class="{ 'team-winner': isWinner(thirdPlaceGame.data, 1) }"
              >
                {{ truncName(thirdPlaceTeamLabel(thirdPlaceGame.data, 1), false) }}
              </text>
              <path
                v-if="teamBg(thirdPlaceGame.data, 1, 'third')"
                :d="scoreTopPath(thirdPlaceGame.x, thirdPlaceGame.y)"
                :class="'score-bg-' + teamBg(thirdPlaceGame.data, 1, 'third')"
              />
              <text :x="thirdPlaceGame.x + boxWidth - 18" :y="thirdPlaceGame.y + boxHeight / 4 + 4" class="team-score">
                {{ thirdPlaceGame.data.team_1_score }}
              </text>
              <text
                :x="thirdPlaceGame.x + 10"
                :y="thirdPlaceGame.y + (boxHeight * 3) / 4 + 4"
                class="team-name"
                :class="{ 'team-winner': isWinner(thirdPlaceGame.data, 2) }"
              >
                {{ truncName(thirdPlaceTeamLabel(thirdPlaceGame.data, 2), false) }}
              </text>
              <path
                v-if="teamBg(thirdPlaceGame.data, 2, 'third')"
                :d="scoreBottomPath(thirdPlaceGame.x, thirdPlaceGame.y)"
                :class="'score-bg-' + teamBg(thirdPlaceGame.data, 2, 'third')"
              />
              <text
                :x="thirdPlaceGame.x + boxWidth - 18"
                :y="thirdPlaceGame.y + (boxHeight * 3) / 4 + 4"
                class="team-score"
              >
                {{ thirdPlaceGame.data.team_2_score }}
              </text>
            </g>
            <!-- Connectors -->
            <g class="connectors">
              <path v-for="(path, i) in connectorPaths" :key="'c' + i" :d="path" class="connector-line" />
            </g>
            <!-- Round headers -->
            <g class="round-headers">
              <text
                v-for="(stage, si) in stages"
                :key="'h' + si"
                :x="stage.x + boxWidth / 2"
                :y="20"
                class="round-header"
              >
                {{ stage.label }}
              </text>
            </g>
          </svg>
        </div>
      </div>
      <button
        v-if="!embedded"
        class="modal-close is-large bracket-close"
        aria-label="close"
        @click="$emit('close-modal')"
      ></button>
    </div>
  </Teleport>
</template>

<script>
import BracketFullscreenButton from '@/components/partials/BracketFullscreenButton.vue';
import PlayoffHeader from '@/components/partials/PlayoffHeader.vue';

export default {
  name: 'Bracket',
  inheritAttrs: false,
  components: { BracketFullscreenButton, PlayoffHeader },
  props: {
    bracket: { type: Object, required: true },
    embedded: { type: Boolean, default: false },
  },
  emits: ['close-modal'],
  mounted() {
    if (!this.embedded) document.documentElement.style.overflow = 'hidden';
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  },
  beforeUnmount() {
    if (!this.embedded) document.documentElement.style.overflow = '';
    document.documentElement.classList.remove('is-clipped');
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
  },
  data() {
    return {
      boxWidth: 212,
      boxHeight: 60,
      colGap: 40,
      rowGap: 16,
      headerHeight: 36,
      padding: 20,
      isFullscreen: false,
      usesFullscreenFallback: false,
    };
  },
  computed: {
    participantCount() {
      const firstStage =
        this.bracket.stages?.find((stage) => stage.stageLabel !== 'cadrage') || this.bracket.stages?.[0];
      return this.bracket.participantCount || firstStage?.teamsCount || firstStage?.teams?.length * 2 || 0;
    },
    stages() {
      return this.bracket.stages.map((stage, si) => {
        const x = this.padding + si * (this.boxWidth + this.colGap);
        const totalHeight = this.firstStageHeight;
        const gamesCount = stage.teams.length;
        const spacing = totalHeight / gamesCount;
        const games = stage.teams.map((game, gi) => {
          let data = game;
          if (si > 0) {
            const prevStage = this.bracket.stages[si - 1];
            const prev1 = prevStage.teams[gi * 2];
            const prev2 = prevStage.teams[gi * 2 + 1];
            const needsTeam1 = !game.team_1 && prev1;
            const needsTeam2 = !game.team_2 && prev2;
            if (needsTeam1 || needsTeam2) {
              data = { ...game };
              if (needsTeam1 && prev1.winner) data.team_1 = prev1.winner;
              if (needsTeam2 && prev2.winner) data.team_2 = prev2.winner;
            }
          }
          return {
            x,
            y: this.headerHeight + this.padding + gi * spacing + (spacing - this.boxHeight) / 2,
            data,
          };
        });
        let label;
        if (stage.stageLabel === 'cadrage') {
          label = this.$t('games.cadrage');
        } else if (stage.stageLabel === 1) {
          label = this.$t('games.final');
        } else {
          label = '1/' + stage.stageLabel + ' ' + this.$t('games.ofFinal');
        }
        return { games, x, label, stageLabel: stage.stageLabel };
      });
    },
    firstStageHeight() {
      const firstStage = this.bracket.stages[0];
      return firstStage.teams.length * (this.boxHeight + this.rowGap);
    },
    svgWidth() {
      return (
        this.padding * 2 + this.bracket.stages.length * this.boxWidth + (this.bracket.stages.length - 1) * this.colGap
      );
    },
    svgHeight() {
      const base = this.headerHeight + this.padding * 2 + this.firstStageHeight;
      if (this.bracket.thirdPlace && this.thirdPlaceGame) {
        return Math.max(base, this.thirdPlaceGame.y + this.boxHeight + this.padding);
      }
      return base;
    },
    thirdPlaceGame() {
      const tp = this.bracket.thirdPlace;
      if (!tp || (!tp.team_1 && !tp.team_2)) return null;
      const finalStage = this.stages[this.stages.length - 1];
      const finalGame = finalStage.games[0];
      return {
        x: finalStage.x,
        y: finalGame.y + this.boxHeight + this.rowGap + 170,
        data: tp,
      };
    },
    connectorPaths() {
      const paths = [];
      for (let si = 0; si < this.stages.length - 1; si++) {
        const currentStage = this.stages[si];
        const nextStage = this.stages[si + 1];
        if (currentStage.games.length === nextStage.games.length) {
          for (let gi = 0; gi < nextStage.games.length; gi++) {
            const curGame = currentStage.games[gi];
            const nextGame = nextStage.games[gi];
            const curMidY = curGame.y + this.boxHeight / 2;
            const nextMidY = nextGame.y + this.boxHeight / 2;
            const curRight = curGame.x + this.boxWidth;
            const nextLeft = nextGame.x;
            const midX = curRight + this.colGap / 2;
            paths.push(`M${curRight},${curMidY} H${midX} V${nextMidY} H${nextLeft}`);
          }
        } else {
          for (let gi = 0; gi < nextStage.games.length; gi++) {
            const nextGame = nextStage.games[gi];
            const nextMidY = nextGame.y + this.boxHeight / 2;
            const nextLeft = nextGame.x;
            const game1 = currentStage.games[gi * 2];
            const game2 = currentStage.games[gi * 2 + 1];
            if (game1 && game2) {
              const g1MidY = game1.y + this.boxHeight / 2;
              const g2MidY = game2.y + this.boxHeight / 2;
              const g1Right = game1.x + this.boxWidth;
              const midX = g1Right + this.colGap / 2;
              paths.push(`M${g1Right},${g1MidY} H${midX} V${nextMidY} H${nextLeft}`);
              paths.push(`M${g1Right},${g2MidY} H${midX} V${nextMidY}`);
            } else if (game1) {
              const g1MidY = game1.y + this.boxHeight / 2;
              const g1Right = game1.x + this.boxWidth;
              paths.push(`M${g1Right},${g1MidY} H${nextLeft}`);
            }
          }
        }
      }
      return paths;
    },
  },
  methods: {
    singleMatchId(stageIndex, gameIndex) {
      return `P${stageIndex + 1}M${gameIndex + 1}`;
    },
    teamLabel(game, stageIndex, gameIndex, team) {
      const teamName = team === 1 ? game.team_1 : game.team_2;
      if (teamName) return teamName;
      if (game.isBye) return this.$t('games.exempt');
      if (stageIndex === 0) return this.$t('doubleElimination.pending');
      const sourceGameIndex = gameIndex * 2 + team - 1;
      return `${this.$t('doubleElimination.winnerOf')} ${this.singleMatchId(stageIndex - 1, sourceGameIndex)}`;
    },
    thirdPlaceTeamLabel(game, team) {
      const teamName = team === 1 ? game.team_1 : game.team_2;
      if (teamName) return teamName;
      const semifinalStageIndex = Math.max(0, this.stages.length - 2);
      return `${this.$t('doubleElimination.loserOf')} ${this.singleMatchId(semifinalStageIndex, team - 1)}`;
    },
    async toggleFullscreen() {
      const element = this.$refs.bracketSection;
      if (!element) return;
      if (this.isFullscreen && this.usesFullscreenFallback) {
        this.isFullscreen = false;
        this.usesFullscreenFallback = false;
        document.documentElement.classList.remove('is-clipped');
        return;
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
        this.isFullscreen = false;
      } else if (element.requestFullscreen) {
        try {
          await element.requestFullscreen();
          if (document.fullscreenElement === element) {
            this.isFullscreen = true;
            this.usesFullscreenFallback = false;
          } else {
            this.activateFullscreenFallback();
          }
        } catch {
          this.activateFullscreenFallback();
        }
      } else {
        this.activateFullscreenFallback();
      }
    },
    activateFullscreenFallback() {
      this.usesFullscreenFallback = true;
      this.isFullscreen = true;
      document.documentElement.classList.add('is-clipped');
    },
    onFullscreenChange() {
      if (this.usesFullscreenFallback && !document.fullscreenElement) return;
      this.isFullscreen = document.fullscreenElement === this.$refs.bracketSection;
      this.usesFullscreenFallback = false;
      if (!this.isFullscreen) document.documentElement.classList.remove('is-clipped');
    },
    truncName(name, hasPlace) {
      if (!name) return '';
      const textStart = hasPlace ? 30 : 10;
      const maxWidth = this.boxWidth - 38 - textStart;
      const maxChars = Math.floor(maxWidth / 6.5);
      if (name.length > maxChars) return name.slice(0, maxChars - 1) + '…';
      return name;
    },
    isWinner(game, team) {
      if (!game || game.team_1_score == null || game.team_2_score == null) return false;
      return team === 1 ? game.team_1_score > game.team_2_score : game.team_2_score > game.team_1_score;
    },
    teamBg(game, team, stageLabel) {
      if (!game || game.team_1_score == null || game.team_2_score == null) return null;
      const isWinner = this.isWinner(game, team);
      if (stageLabel === 1) return isWinner ? 'bg-gold' : 'bg-silver';
      if (stageLabel === 'third') return isWinner ? 'bg-bronze' : 'bg-loser';
      return isWinner ? 'bg-winner' : 'bg-loser';
    },
    topHalfPath(x, y) {
      const r = 5;
      const w = this.boxWidth - 2;
      const h = this.boxHeight / 2 - 1;
      const x0 = x + 1;
      const y0 = y + 1;
      return `M${x0 + r},${y0} H${x0 + w - r} Q${x0 + w},${y0} ${x0 + w},${y0 + r} V${y0 + h} H${x0} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;
    },
    bottomHalfPath(x, y) {
      const r = 5;
      const w = this.boxWidth - 2;
      const h = this.boxHeight / 2 - 1;
      const x0 = x + 1;
      const y0 = y + this.boxHeight / 2;
      return `M${x0},${y0} H${x0 + w} V${y0 + h - r} Q${x0 + w},${y0 + h} ${x0 + w - r},${y0 + h} H${x0 + r} Q${x0},${y0 + h} ${x0},${y0 + h - r} Z`;
    },
    scoreTopPath(x, y) {
      const r = 5;
      const sw = 34;
      const x0 = x + this.boxWidth - sw - 1;
      const x1 = x + this.boxWidth - 1;
      const y0 = y + 1;
      const y1 = y + this.boxHeight / 2;
      return `M${x0},${y0} H${x1 - r} Q${x1},${y0} ${x1},${y0 + r} V${y1} H${x0} Z`;
    },
    scoreBottomPath(x, y) {
      const r = 5;
      const sw = 34;
      const x0 = x + this.boxWidth - sw - 1;
      const x1 = x + this.boxWidth - 1;
      const y0 = y + this.boxHeight / 2;
      const y1 = y + this.boxHeight - 1;
      return `M${x0},${y0} H${x1} V${y1 - r} Q${x1},${y1} ${x1 - r},${y1} H${x0} Z`;
    },
  },
};
</script>

<style scoped>
.modal {
  z-index: 10000;
}

.bracket-close {
  top: 6px !important;
}

.bracket-modal {
  --bracket-winner: var(--color-bracket-winner);
  --bracket-winner-score: var(--color-bracket-winner-score);
  --bracket-gold: var(--color-bracket-gold);
  --bracket-gold-score: var(--color-bracket-gold-score);
  --bracket-silver: var(--color-bracket-silver);
  --bracket-silver-score: var(--color-bracket-silver-score);
  --bracket-bronze: var(--color-bracket-bronze);
  --bracket-bronze-score: var(--color-bracket-bronze-score);
  --bracket-loser: var(--color-bracket-loser);
  --bracket-loser-score: var(--color-bracket-loser-score);
  --bracket-text: var(--color-bracket-text);
  --bracket-divider: var(--color-bracket-divider);
  --bracket-connector: var(--color-bracket-connector);
  --bracket-badge: var(--color-bracket-badge);

  background: var(--color-surface);
  border-radius: 8px;
  max-width: 95vw;
  max-height: 90vh;
  overflow: auto;
}

.bracket-embedded {
  width: 100%;
}

.bracket-modal--embedded {
  position: relative;
  width: 100%;
  max-width: none;
  max-height: none;
  margin-inline: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.bracket-container {
  padding: 10px 10px 20px;
}

.bracket-modal--embedded .bracket-container {
  overflow: auto hidden;
  overscroll-behavior-inline: contain;
}

.bracket-svg {
  display: block;
  margin-inline: auto;
}

.bracket-modal--fullscreen {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 1rem;
  border: 0;
  border-radius: 0;
  background: var(--color-surface);
}

.bracket-modal--fullscreen .bracket-container {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.bracket-modal--fullscreen .bracket-svg {
  width: 100%;
  height: 100%;
}

.game-box {
  fill: var(--color-surface-alt);
  stroke: var(--bracket-connector);
  stroke-width: 1;
}

.match-id-badge {
  fill: var(--color-surface-alt);
}

.match-id-text {
  fill: var(--color-text-muted);
  font-size: 8px;
  font-weight: 700;
  text-anchor: middle;
}

.game-divider {
  stroke: var(--bracket-divider);
  stroke-width: 1;
}

.team-name {
  font-size: 11px;
  fill: var(--bracket-text);
}

.team-name.team-winner {
  font-weight: 700;
}

.team-score {
  font-size: 12px;
  font-weight: 700;
  fill: var(--bracket-text);
  text-anchor: middle;
}

.place-badge {
  fill: var(--bracket-badge);
}

.place-text {
  font-size: 9px;
  fill: var(--color-surface);
  text-anchor: middle;
  dominant-baseline: central;
}

.connector-line {
  fill: none;
  stroke: var(--bracket-connector);
  stroke-width: 2;
}

.round-header {
  font-size: 12px;
  font-weight: 700;
  fill: var(--bracket-text);
  text-anchor: middle;
}

.bg-winner {
  fill: var(--bracket-winner);
}

.bg-gold {
  fill: var(--bracket-gold);
}

.bg-silver {
  fill: var(--bracket-silver);
}

.bg-bronze {
  fill: var(--bracket-bronze);
}

.bg-loser {
  fill: var(--bracket-loser);
}

.score-bg-bg-winner {
  fill: var(--bracket-winner-score);
}

.score-bg-bg-gold {
  fill: var(--bracket-gold-score);
}

.score-bg-bg-silver {
  fill: var(--bracket-silver-score);
}

.score-bg-bg-bronze {
  fill: var(--bracket-bronze-score);
}

.score-bg-bg-loser {
  fill: var(--bracket-loser-score);
}
</style>
