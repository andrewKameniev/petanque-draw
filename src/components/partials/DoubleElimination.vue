<template>
  <section
    class="double-elimination"
    :class="[{ 'double-elimination--tv': tvView }, tvDensityClass]"
    data-testid="double-elimination-bracket"
  >
    <PlayoffHeader
      v-if="!hideHeader"
      :title="$t('doubleElimination.title')"
      :subtitle="$t('doubleElimination.singleRule')"
      :badge="`${bracket.participantCount} ${$t('common.teamsLabel')}`"
      :show-bracket-button="!isPublicView"
      @show-bracket="showBracket = true"
    />

    <div v-if="bracket.champion" class="double-elimination__champion" data-testid="double-elimination-champion">
      <Trophy :size="24" />
      <span>{{ $t('doubleElimination.champion') }}</span>
      <strong>{{ bracket.champion }}</strong>
    </div>

    <Teleport to="body" :disabled="isPublicView">
      <div
        v-if="showBracket && !isPublicView"
        class="double-elimination__backdrop"
        data-testid="double-elimination-backdrop"
        @click="showBracket = false"
      ></div>
      <div
        v-if="(isPublicView && !matchesOnly) || showBracket"
        ref="bracketSection"
        class="double-elimination__section double-elimination__section--unified"
        :class="{
          'double-elimination__section--modal': showBracket && !isPublicView,
          'double-elimination__section--fullscreen': isFullscreen,
        }"
        data-testid="double-elimination-bracket-view"
      >
        <BracketFullscreenButton
          v-if="isPublicView && bracketOnly && !tvView"
          :is-fullscreen="isFullscreen"
          :aria-label="isFullscreen ? $t('common.close') : $t('games.showBracket')"
          data-testid="toggle-double-elimination-fullscreen"
          @toggle="toggleFullscreen"
        />
        <button
          v-if="showBracket && !isPublicView"
          type="button"
          class="double-elimination__close"
          :aria-label="$t('common.close')"
          @click="showBracket = false"
        >
          <X :size="24" />
        </button>
        <div v-if="(!isPublicView || hideHeader) && !tvView" class="double-elimination__modal-title">
          {{ $t('doubleElimination.title') }}
        </div>
        <div class="double-elimination__legend double-elimination__legend--inside" aria-hidden="true">
          <span
            ><i class="double-elimination__dot double-elimination__dot--ready"></i
            >{{ $t('doubleElimination.ready') }}</span
          >
          <span
            ><i class="double-elimination__dot double-elimination__dot--finished"></i
            >{{ $t('teamPlayoff.matchFinished') }}</span
          >
        </div>
        <div ref="bracketScroll" class="double-elimination__scroll" tabindex="0">
          <div ref="bracketViewport" class="double-elimination__fit" :style="bracketFitStyle">
            <div
              ref="bracketCanvas"
              class="double-elimination__canvas"
              :style="[bracketGridStyle, bracketCanvasTransformStyle]"
            >
              <svg
                v-if="connections.length"
                class="double-elimination__connections"
                :viewBox="`0 0 ${connectionCanvas.width} ${connectionCanvas.height}`"
                :width="connectionCanvas.width"
                :height="connectionCanvas.height"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  v-for="connection in connections"
                  :key="connection.key"
                  class="double-elimination__connection"
                  :d="connection.path"
                  vector-effect="non-scaling-stroke"
                />
              </svg>
              <template v-for="row in bracketRows" :key="row.key">
                <article
                  v-for="stage in row.stages"
                  :key="stage.id"
                  class="double-elimination__round"
                  :class="{ 'double-elimination__round--current': activeStageIds.includes(stage.id) }"
                  :style="stageGridStyle(stage, row)"
                >
                  <div class="double-elimination__round-heading">
                    <span>{{ stageLabel(stage) }}</span>
                    <small v-if="activeStageIds.includes(stage.id)">{{ $t('doubleElimination.current') }}</small>
                  </div>
                  <div class="double-elimination__matches">
                    <div
                      v-for="match in stage.teams"
                      :key="match.id"
                      class="double-elimination__match"
                      :class="matchClass(match)"
                      :data-testid="`double-match-${match.id}`"
                      :data-match-id="match.id"
                    >
                      <div
                        class="double-elimination__team"
                        :class="{ 'double-elimination__team--winner': match.winner === match.team_1 }"
                        data-input-slot="1"
                      >
                        <span class="double-elimination__team-label">
                          <small class="double-elimination__match-number">{{ match.id }}</small>
                          <span
                            class="double-elimination__team-name"
                            :title="match.team_1 || sourceLabel(match.source_1)"
                          >
                            {{ match.team_1 || sourceLabel(match.source_1) }}
                          </span>
                        </span>
                        <strong>{{ displayScore(match.team_1_score) }}</strong>
                      </div>
                      <div
                        class="double-elimination__team"
                        :class="{ 'double-elimination__team--winner': match.winner === match.team_2 }"
                        data-input-slot="2"
                      >
                        <span class="double-elimination__team-label">
                          <small
                            class="double-elimination__match-number double-elimination__match-number--placeholder"
                            aria-hidden="true"
                          ></small>
                          <span
                            class="double-elimination__team-name"
                            :title="match.team_2 || sourceLabel(match.source_2)"
                          >
                            {{ match.team_2 || sourceLabel(match.source_2) }}
                          </span>
                        </span>
                        <strong>{{ displayScore(match.team_2_score) }}</strong>
                      </div>
                      <span v-if="match.isBye" class="double-elimination__status">{{ $t('games.exempt') }}</span>
                      <span v-else-if="match.status === 'skipped'" class="double-elimination__status">{{
                        $t('doubleElimination.notNeeded')
                      }}</span>
                    </div>
                  </div>
                </article>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <PlayoffMatchPanel
      v-if="showCurrentMatches"
      :tournament="tournament"
      :stages="adminMatchStages"
      :title="$t('doubleElimination.playNow')"
      :score-error="scoreError"
      data-testid="double-elimination-active-round"
      @update="onPanelMatchUpdate"
      @finish="onPanelMatchFinish"
      @save="saveCurrentStage"
    />

    <PlayoffMatchPanel
      v-if="isPublicView && !bracketOnly && !tvView"
      :tournament="tournament"
      :stages="publicPanelStages"
      :title="$t('games.playOff')"
      :public-view="true"
      :show-save="false"
      data-testid="double-elimination-public-rounds"
    />
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { Trophy, X } from 'lucide-vue-next';
import { useMainStore } from '@/stores/main';
import { isScoreError, updateScoreHistory } from '@/helpers';
import {
  advanceDoubleEliminationBracket,
  getEditableDoubleEliminationStages,
  getNextDoubleEliminationStage,
  getPublicDoubleEliminationMatches,
  recordDoubleEliminationResult,
  stageDoubleEliminationResult,
} from '@/services/playoff';
import PlayoffHeader from '@/components/partials/PlayoffHeader.vue';
import PlayoffMatchPanel from '@/components/partials/PlayoffMatchPanel.vue';
import BracketFullscreenButton from '@/components/partials/BracketFullscreenButton.vue';

export default {
  name: 'DoubleElimination',
  components: { BracketFullscreenButton, PlayoffHeader, PlayoffMatchPanel, Trophy, X },
  props: {
    activeTournament: { type: Object, default: null },
    isPublicView: { type: Boolean, default: false },
    hideHeader: { type: Boolean, default: false },
    tvView: { type: Boolean, default: false },
    bracketOnly: { type: Boolean, default: false },
    matchesOnly: { type: Boolean, default: false },
  },
  data() {
    return {
      scoreError: false,
      showBracket: false,
      isFullscreen: false,
      usesFullscreenFallback: false,
      fullscreenScale: 1,
      fullscreenCanvasSize: { width: 0, height: 0 },
      connections: [],
      connectionCanvas: { width: 1, height: 1 },
    };
  },
  computed: {
    ...mapState(useMainStore, ['currentTournament', 'isOwnerOrAdmin']),
    tournament() {
      return this.activeTournament || this.currentTournament;
    },
    bracket() {
      return this.tournament.playOffBracket;
    },
    tvDensityClass() {
      if (!this.tvView) return '';
      if (this.bracket.participantCount <= 4) return 'double-elimination--tv-spacious';
      if (this.bracket.participantCount <= 8) return 'double-elimination--tv-roomy';
      return '';
    },
    activeStages() {
      return getEditableDoubleEliminationStages(this.bracket);
    },
    activeStageIds() {
      return this.activeStages.map((stage) => stage.id);
    },
    showCurrentMatches() {
      return !this.isPublicView && this.isOwnerOrAdmin && !this.bracket.champion && this.activeStages.length;
    },
    publicMatchStages() {
      return this.bracket.stages.filter((stage) => this.publicMatches(stage).length);
    },
    adminMatchStages() {
      return this.activeStages.map((stage) => ({
        id: stage.id,
        label: this.stageLabel(stage),
        stageIndex: this.stageIndex(stage),
        source: stage,
        matches: this.stageMatches(stage).map((match, displayIndex) => ({
          game: match,
          gameIndex: stage.teams.indexOf(match),
          laneNumber: this.activeLaneNumber(stage, displayIndex),
        })),
      }));
    },
    publicPanelStages() {
      return this.publicMatchStages.map((stage) => ({
        id: stage.id,
        label: this.stageLabel(stage),
        stageIndex: this.stageIndex(stage),
        source: stage,
        matches: this.publicMatches(stage).map((match, displayIndex) => ({
          game: match,
          gameIndex: stage.teams.indexOf(match),
          laneNumber: this.publicLaneNumber(stage, displayIndex),
        })),
      }));
    },
    bracketRows() {
      const upper = this.bracket.stages.filter((stage) => stage.bracket === 'upper');
      const lower = this.bracket.stages.filter((stage) => stage.bracket === 'lower');
      const grand = this.bracket.stages.filter((stage) => stage.bracket === 'grand');
      return [
        {
          key: 'upper',
          title: this.$t('doubleElimination.upperBracket'),
          hint: this.$t('doubleElimination.upperHint'),
          stages: upper,
          gridRow: 1,
        },
        ...(lower.length
          ? [
              {
                key: 'lower',
                title: this.$t('doubleElimination.lowerBracket'),
                hint: this.$t('doubleElimination.lowerHint'),
                stages: lower,
                gridRow: 2,
              },
            ]
          : []),
        {
          key: 'grand',
          title: this.$t('doubleElimination.grandFinal'),
          hint: this.$t('doubleElimination.grandHint'),
          stages: grand,
          gridRow: 1,
        },
      ];
    },
    bracketGridStyle() {
      const maxSequence = Math.max(...this.bracket.stages.map((stage) => stage.sequence));
      return {
        gridTemplateColumns: `repeat(${maxSequence}, var(--bracket-round-width, 212px))`,
      };
    },
    bracketFitStyle() {
      if (!this.isFullscreen || !this.fullscreenCanvasSize.width || !this.fullscreenCanvasSize.height) return null;
      return {
        width: `${this.fullscreenCanvasSize.width * this.fullscreenScale}px`,
        height: `${this.fullscreenCanvasSize.height * this.fullscreenScale}px`,
      };
    },
    bracketCanvasTransformStyle() {
      if (!this.isFullscreen) return null;
      return {
        transform: `scale(${this.fullscreenScale})`,
        transformOrigin: 'top left',
      };
    },
  },
  mounted() {
    if (!this.isPublicView) {
      advanceDoubleEliminationBracket(this.bracket);
      const next = getNextDoubleEliminationStage(this.bracket);
      if (!this.bracket.champion && next && this.tournament.playOffStage !== next.id) this.setPlayOffStage(next.id);
    }
    this.connectionResizeObserver =
      typeof window.ResizeObserver === 'undefined'
        ? null
        : new window.ResizeObserver(() => this.scheduleLayoutUpdate());
    window.addEventListener('resize', this.scheduleLayoutUpdate);
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    this.$nextTick(this.observeConnectionCanvas);
  },
  beforeUnmount() {
    document.documentElement.classList.remove('is-clipped');
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    window.removeEventListener('resize', this.scheduleLayoutUpdate);
    this.connectionResizeObserver?.disconnect();
    if (this.connectionFrame) window.cancelAnimationFrame(this.connectionFrame);
    if (this.fullscreenFitFrame) window.cancelAnimationFrame(this.fullscreenFitFrame);
  },
  watch: {
    showBracket(isOpen) {
      if (!this.isPublicView) document.documentElement.classList.toggle('is-clipped', isOpen);
      if (isOpen) this.$nextTick(this.observeConnectionCanvas);
      else if (!this.isPublicView) this.connections = [];
    },
    bracket: {
      deep: true,
      handler() {
        this.scheduleLayoutUpdate();
      },
    },
  },
  methods: {
    ...mapActions(useMainStore, ['setPlayOffBracket', 'setPlayOffStage', 'syncBracketMatch', 'finishTournament']),
    async toggleFullscreen() {
      const element = this.$refs.bracketSection;
      if (!element) return;
      if (this.isFullscreen && this.usesFullscreenFallback) {
        this.isFullscreen = false;
        this.usesFullscreenFallback = false;
        document.documentElement.classList.remove('is-clipped');
        this.resetFullscreenFit();
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
      if (!this.isFullscreen) this.resetFullscreenFit();
      this.$nextTick(this.observeConnectionCanvas);
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
      if (!this.isFullscreen) this.resetFullscreenFit();
      this.$nextTick(this.observeConnectionCanvas);
    },
    resetFullscreenFit() {
      this.fullscreenScale = 1;
      this.fullscreenCanvasSize = { width: 0, height: 0 };
    },
    observeConnectionCanvas() {
      const canvas = this.$refs.bracketCanvas;
      if (!canvas) return;
      this.connectionResizeObserver?.disconnect();
      this.connectionResizeObserver?.observe(canvas);
      if (this.$refs.bracketScroll) this.connectionResizeObserver?.observe(this.$refs.bracketScroll);
      this.scheduleLayoutUpdate();
    },
    scheduleLayoutUpdate() {
      if (this.isFullscreen) {
        this.scheduleFullscreenFit();
        return;
      }
      this.scheduleConnectionUpdate();
    },
    scheduleFullscreenFit() {
      if (this.fullscreenFitFrame) window.cancelAnimationFrame(this.fullscreenFitFrame);
      this.fullscreenFitFrame = window.requestAnimationFrame(() => {
        this.fullscreenFitFrame = null;
        this.updateFullscreenFit();
      });
    },
    updateFullscreenFit() {
      const canvas = this.$refs.bracketCanvas;
      const scroll = this.$refs.bracketScroll;
      if (!this.isFullscreen || !canvas || !scroll) return;

      const naturalWidth = canvas.scrollWidth;
      const naturalHeight = canvas.scrollHeight;
      if (!naturalWidth || !naturalHeight || !scroll.clientWidth || !scroll.clientHeight) return;

      this.fullscreenCanvasSize = { width: naturalWidth, height: naturalHeight };
      this.fullscreenScale = Math.max(
        0.1,
        Math.min(scroll.clientWidth / naturalWidth, scroll.clientHeight / naturalHeight),
      );
      this.$nextTick(this.scheduleConnectionUpdate);
    },
    scheduleConnectionUpdate() {
      if (this.connectionFrame) window.cancelAnimationFrame(this.connectionFrame);
      this.connectionFrame = window.requestAnimationFrame(() => {
        this.connectionFrame = null;
        this.updateConnections();
      });
    },
    updateConnections() {
      const canvas = this.$refs.bracketCanvas;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const coordinateScale = this.isFullscreen ? this.fullscreenScale : 1;
      const connections = [];
      this.bracket.stages.forEach((stage) => {
        stage.teams.forEach((match) => {
          const destination = canvas.querySelector(`[data-match-id="${match.id}"]`);
          if (!destination) return;

          const linkedSources = [match.source_1, match.source_2]
            .map((input, inputIndex) => ({ input, inputIndex }))
            .filter(({ input }) => input?.type === 'winner' && input.matchId)
            .map(({ input, inputIndex }) => ({
              input,
              inputIndex,
              element: canvas.querySelector(`[data-match-id="${input.matchId}"]`),
            }))
            .filter(({ element }) => element);
          if (!linkedSources.length) return;

          const destinationRect = destination.getBoundingClientRect();
          if (stage.bracket === 'grand') {
            linkedSources.forEach(({ input, inputIndex, element }) => {
              const destinationSlot = destination.querySelector(`[data-input-slot="${inputIndex + 1}"]`);
              if (!destinationSlot) return;
              const sourceRect = element.getBoundingClientRect();
              const destinationSlotRect = destinationSlot.getBoundingClientRect();
              const startX = (sourceRect.right - canvasRect.left) / coordinateScale;
              const startY = (sourceRect.top - canvasRect.top + sourceRect.height / 2) / coordinateScale;
              const endX = (destinationSlotRect.left - canvasRect.left) / coordinateScale;
              const endY =
                (destinationSlotRect.top - canvasRect.top + destinationSlotRect.height / 2) / coordinateScale;
              const turnX = startX + Math.max(12, (endX - startX) / 2);
              connections.push({
                key: `${input.matchId}-${match.id}-${inputIndex}`,
                path: `M ${startX} ${startY} H ${turnX} V ${endY} H ${endX}`,
              });
            });
            return;
          }

          const endX = (destinationRect.left - canvasRect.left) / coordinateScale;
          const endY = (destinationRect.top - canvasRect.top + destinationRect.height / 2) / coordinateScale;
          const sourceRects = linkedSources.map(({ element }) => element.getBoundingClientRect());
          const furthestSourceX = Math.max(
            ...sourceRects.map((sourceRect) => (sourceRect.right - canvasRect.left) / coordinateScale),
          );
          const turnX = furthestSourceX + Math.max(12, (endX - furthestSourceX) / 2);

          linkedSources.forEach(({ input, inputIndex }, sourceIndex) => {
            const sourceRect = sourceRects[sourceIndex];
            const startX = (sourceRect.right - canvasRect.left) / coordinateScale;
            const startY = (sourceRect.top - canvasRect.top + sourceRect.height / 2) / coordinateScale;
            connections.push({
              key: `${input.matchId}-${match.id}-${inputIndex}`,
              path: `M ${startX} ${startY} H ${turnX} V ${endY}${sourceIndex === 0 ? ` H ${endX}` : ''}`,
            });
          });
        });
      });

      this.connectionCanvas = {
        width: Math.max(1, Math.ceil(canvas.scrollWidth)),
        height: Math.max(1, Math.ceil(canvas.scrollHeight)),
      };
      this.connections = connections;
    },
    stageLabel(stage) {
      const upperStages = this.bracket.stages.filter((candidate) => candidate.bracket === 'upper');
      const lowerStages = this.bracket.stages.filter((candidate) => candidate.bracket === 'lower');
      if (stage.bracket === 'upper') {
        if (stage.id === upperStages[upperStages.length - 1]?.id) return this.$t('doubleElimination.winnersFinal');
        return this.$t('doubleElimination.upperRound', { round: stage.round });
      }
      if (stage.bracket === 'lower') {
        if (stage.id === lowerStages[lowerStages.length - 1]?.id) return this.$t('doubleElimination.losersFinal');
        return this.$t('doubleElimination.lowerRound', { round: stage.round });
      }
      return this.$t('doubleElimination.grandFinal');
    },
    sourceLabel(input) {
      if (!input) return this.$t('doubleElimination.pending');
      if (input.type === 'seed') return input.team || this.$t('games.exempt');
      const result =
        input.type === 'winner' ? this.$t('doubleElimination.winnerOf') : this.$t('doubleElimination.loserOf');
      return `${result} ${input.matchId}`;
    },
    displayScore(score) {
      return score == null || score === '' ? '—' : score;
    },
    stageGridStyle(stage, row) {
      return {
        gridColumn: stage.sequence,
        gridRow: stage.bracket === 'grand' ? '1 / span 2' : row.gridRow,
        alignSelf: stage.bracket === 'grand' ? 'center' : 'stretch',
      };
    },
    stageIndex(stage) {
      return this.bracket.stages.findIndex((candidate) => candidate.id === stage.id);
    },
    stageMatches(stage) {
      return getPublicDoubleEliminationMatches(stage);
    },
    publicMatches(stage) {
      return getPublicDoubleEliminationMatches(stage);
    },
    activeLaneNumber(stage, gameIndex) {
      let offset = 0;
      for (const activeStage of this.activeStages) {
        if (activeStage.id === stage.id) break;
        offset += this.stageMatches(activeStage).length;
      }
      return offset + gameIndex;
    },
    publicLaneNumber(stage, gameIndex) {
      if (this.activeStageIds.includes(stage.id)) return this.activeLaneNumber(stage, gameIndex);
      return stage.laneOrder?.[gameIndex] ?? gameIndex;
    },
    matchClass(match) {
      return {
        'double-elimination__match--finished': match.status === 'finished',
        'double-elimination__match--ready':
          match.team_1 && match.team_2 && match.status !== 'finished' && match.status !== 'skipped',
        'double-elimination__match--pending': !match.team_1 || !match.team_2,
        'double-elimination__match--bye': match.isBye,
        'double-elimination__match--skipped': match.status === 'skipped',
      };
    },
    onMatchUpdate(stage, gameIndex) {
      const match = stage.teams[gameIndex];
      if (!match) return;
      match.resultCommitted = false;
      updateScoreHistory(match);
      this.syncBracketMatch(`stages/${this.stageIndex(stage)}/teams/${gameIndex}`, match);
    },
    onMatchFinish(stage, gameIndex) {
      const match = stage.teams[gameIndex];
      if (!match || isScoreError(match, this.tournament.preferences.maxScore)) {
        this.scoreError = true;
        return;
      }
      this.scoreError = false;
      try {
        stageDoubleEliminationResult(match, match.team_1_score, match.team_2_score);
      } catch {
        this.scoreError = true;
        return;
      }
      this.syncBracketMatch(`stages/${this.stageIndex(stage)}/teams/${gameIndex}`, match);
    },
    onPanelMatchUpdate({ stage, gameIndex }) {
      this.onMatchUpdate(stage.source, gameIndex);
    },
    onPanelMatchFinish({ stage, gameIndex }) {
      this.onMatchFinish(stage.source, gameIndex);
    },
    saveCurrentStage() {
      const currentMatches = this.activeStages.flatMap((stage) => this.stageMatches(stage));
      if (
        !currentMatches.length ||
        currentMatches.some((match) => isScoreError(match, this.tournament.preferences.maxScore))
      ) {
        this.scoreError = true;
        return;
      }
      const bracket = JSON.parse(JSON.stringify(this.bracket));
      try {
        currentMatches.forEach((match) =>
          recordDoubleEliminationResult(bracket, match.id, match.team_1_score, match.team_2_score),
        );
      } catch {
        this.scoreError = true;
        return;
      }
      this.scoreError = false;
      this.setPlayOffBracket(bracket);
      if (bracket.champion) {
        this.setPlayOffStage(0);
        this.finishTournament();
      } else {
        const next = getNextDoubleEliminationStage(bracket);
        if (next) this.setPlayOffStage(next.id);
      }
    },
  },
};
</script>

<style scoped>
.double-elimination {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  color: var(--color-text);
}

.double-elimination__champion {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #e3b341;
  border-radius: 12px;
  background: rgb(227 179 65 / 12%);
  color: var(--color-text);
}

.double-elimination__champion svg {
  color: #c58b00;
}

.double-elimination__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0.75rem 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.double-elimination__legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.double-elimination__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--color-border);
}

.double-elimination__dot--ready {
  background: #f0a202;
}

.double-elimination__dot--finished {
  background: #2e9d62;
}

.double-elimination__section {
  position: relative;
  margin: 1rem 0 1.5rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.double-elimination__section--fullscreen {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  max-height: none;
  margin: 0;
  padding: 1rem;
  border: 0;
  border-radius: 0;
  background: var(--color-surface);
}

.double-elimination__section--fullscreen .double-elimination__legend {
  padding-right: 3.5rem;
}

.double-elimination__section--fullscreen .double-elimination__scroll {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.double-elimination__section--fullscreen .double-elimination__fit {
  flex: 0 0 auto;
  min-width: 0;
}

.double-elimination__section--fullscreen .double-elimination__canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.double-elimination__backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgb(0 0 0 / 55%);
}

.double-elimination__section--modal {
  position: fixed;
  inset: 10px;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 20px);
  margin: 0;
  padding: 0.75rem;
  box-shadow: 0 12px 50px rgb(0 0 0 / 35%);
}

.double-elimination__section--modal .double-elimination__scroll {
  flex: 1 1 auto;
  overflow: auto;
}

.double-elimination__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--color-border);
  color: var(--color-text);
  cursor: pointer;
}

.double-elimination__modal-title {
  padding-right: 3rem;
  font-size: 1.05rem;
  font-weight: 700;
}

.double-elimination__legend--inside {
  margin: 0.3rem 0 0.55rem;
}

.double-elimination__scroll {
  width: 100%;
  overflow: auto hidden;
  padding: 0 0 0.5rem;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
}

.double-elimination__fit {
  position: relative;
  width: max-content;
  min-width: max-content;
}

.double-elimination__canvas {
  position: relative;
  display: grid;
  gap: 1rem 2.5rem;
  min-width: max-content;
  align-items: stretch;
}

.double-elimination__connections {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.double-elimination__connection {
  fill: none;
  stroke: var(--color-bracket-connector, var(--color-border-medium));
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.82;
}

.double-elimination__round {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.double-elimination__round--current > .double-elimination__round-heading {
  color: var(--color-primary);
}

.double-elimination__round-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 1.5rem;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.double-elimination__round-heading small {
  padding: 0.1rem 0.35rem;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-btn-text, #fff);
}

.double-elimination__matches {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: space-around;
  gap: 0.5rem;
}

.double-elimination__match {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background, var(--color-surface));
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
}

.double-elimination__match--ready {
  border-left-color: #f0a202;
}

.double-elimination__match--finished {
  border-left-color: #2e9d62;
}

.double-elimination__match--pending,
.double-elimination__match--skipped {
  background: var(--color-surface-alt);
  opacity: 0.68;
}

.double-elimination__match-number {
  flex: 0 0 auto;
  box-sizing: border-box;
  width: 2.15rem;
  padding: 0.08rem 0.25rem;
  border-radius: 4px;
  background: var(--color-surface-alt, rgb(0 0 0 / 5%));
  color: var(--color-text-muted);
  font-size: 0.55rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-align: center;
}

.double-elimination__match-number--placeholder {
  visibility: hidden;
}

.double-elimination__team {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 1.875rem;
  padding: 0.25rem 0.45rem;
  font-size: 0.8rem;
  line-height: 1.2;
}

.double-elimination__team + .double-elimination__team {
  border-top: 1px solid var(--color-border);
}

.double-elimination__team-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
}

.double-elimination__team-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.double-elimination__team strong {
  flex: 0 0 auto;
  min-width: 1rem;
  text-align: center;
}

.double-elimination__team--winner {
  background: rgb(46 157 98 / 10%);
  font-weight: 700;
}

.double-elimination__status {
  display: block;
  padding: 0.1rem 0.45rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.65rem;
  text-align: center;
}

.double-elimination--tv {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.double-elimination--tv .double-elimination__champion {
  flex: 0 0 auto;
  margin: 0 0 0.5rem;
  padding: 0.5rem;
}

.double-elimination--tv .double-elimination__section {
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.double-elimination--tv .double-elimination__legend {
  display: none;
}

.double-elimination--tv .double-elimination__scroll {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
}

.double-elimination--tv .double-elimination__canvas {
  --bracket-round-width: 200px;

  gap: 0.75rem 2rem;
  margin: auto;
}

.double-elimination--tv .double-elimination__round-heading {
  min-height: 1.25rem;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.double-elimination--tv .double-elimination__round-heading small {
  padding: 0.08rem 0.3rem;
}

.double-elimination--tv .double-elimination__matches {
  gap: 0.35rem;
}

.double-elimination--tv .double-elimination__match {
  border-radius: 6px;
}

.double-elimination--tv .double-elimination__match--pending,
.double-elimination--tv .double-elimination__match--skipped {
  opacity: 1;
}

.double-elimination--tv .double-elimination__team {
  min-height: 1.625rem;
  padding: 0.18rem 0.4rem;
  font-size: 0.78rem;
}

.double-elimination--tv .double-elimination__match-number {
  font-size: 0.5rem;
}

.double-elimination--tv-roomy .double-elimination__canvas {
  --bracket-round-width: 260px;

  gap: 1rem 3.25rem;
}

.double-elimination--tv-roomy .double-elimination__round-heading {
  min-height: 1.75rem;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}

.double-elimination--tv-roomy .double-elimination__matches {
  gap: 0.5rem;
}

.double-elimination--tv-roomy .double-elimination__team {
  min-height: 2.25rem;
  padding: 0.3rem 0.5rem;
  font-size: 0.92rem;
}

.double-elimination--tv-roomy .double-elimination__match-number {
  font-size: 0.6rem;
}

.double-elimination--tv-spacious .double-elimination__canvas {
  --bracket-round-width: 320px;

  gap: 1.25rem 4rem;
}

.double-elimination--tv-spacious .double-elimination__round-heading {
  min-height: 2rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.double-elimination--tv-spacious .double-elimination__matches {
  gap: 0.75rem;
}

.double-elimination--tv-spacious .double-elimination__team {
  min-height: 2.5rem;
  padding: 0.35rem 0.6rem;
  font-size: 1.05rem;
}

.double-elimination--tv-spacious .double-elimination__match-number {
  font-size: 0.68rem;
}

@media (max-width: 768px) {
  .double-elimination__section {
    padding: 0.75rem;
  }

  .double-elimination__canvas {
    --bracket-round-width: min(212px, 78vw);
  }

  .double-elimination__section--modal {
    inset: 4px;
    max-height: calc(100vh - 8px);
    padding: 0.75rem;
  }
}
</style>
