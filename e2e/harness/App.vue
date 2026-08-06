<template>
  <main
    class="visual-page"
    :class="`visual-page--${scenario}`"
    :data-scenario="scenario"
    :data-fixture="fixture"
    :data-state="state"
    :data-nav-change-count="navChangeCount"
    data-testid="visual-fixture"
  >
    <section v-if="scenario === 'loader'" class="visual-canvas visual-canvas--loader" aria-label="Loader fixture">
      <h1 class="visual-visually-hidden">Loader fixture</h1>
      <PageLoader label="Loading tournament…" />
    </section>

    <section v-else-if="scenario === 'nav'" class="visual-canvas visual-canvas--nav" aria-label="Navigation fixture">
      <p class="visual-eyebrow">{{ navFixture.context }}</p>
      <h1>{{ navFixture.heading }}</h1>
      <TournamentNav
        v-model="activeTab"
        :tabs="navFixture.tabs"
        :label="navFixture.label"
        :variant="navFixture.variant"
        :id-prefix="`visual-${fixture}-nav`"
        :panel-id="`visual-${fixture}-panel`"
        @change="navChangeCount += 1"
      />
      <div
        :id="`visual-${fixture}-panel`"
        class="visual-nav-panel"
        role="tabpanel"
        :aria-labelledby="`visual-${fixture}-nav-${activeTab}`"
      >
        <strong>{{ navFixture.tabs.find((tab) => tab.id === activeTab)?.label }}</strong>
        <p>{{ navFixture.panelCopy }}</p>
      </div>
    </section>

    <section v-else-if="scenario === 'tir'" class="visual-canvas visual-canvas--tir" aria-label="Tir fixture">
      <template v-if="fixture !== 'primitives'">
        <h1 class="visual-visually-hidden">{{ tirFixtureHeading }}</h1>
        <h2 class="visual-visually-hidden">Fixture content</h2>
      </template>
      <template v-if="fixture === 'primitives'">
        <h1>Tir scoring</h1>
        <TirScoreLegend />
        <div class="visual-circles">
          <TirScoreCircle result="carreau" active aria-label="Carreau result" />
          <TirScoreCircle result="reussi" active aria-label="Successful result" />
          <TirScoreCircle result="touche" active aria-label="Hit result" />
          <TirScoreCircle result="manque" active aria-label="Miss result" />
        </div>
        <TirScoreGrid :distances="distances" :scores="scoreRow" read-only />
      </template>

      <TirParticipantView
        v-else-if="fixture === 'participant'"
        :participant="participantFixture"
        :ateliers="ateliers"
        :distances="distances"
      />

      <TirAtelierView
        v-else-if="fixture === 'atelier'"
        :atelier-index="0"
        :atelier="ateliers[0]"
        :participants="atelierParticipants"
        :distances="distances"
      />

      <TirParticipantView
        v-else-if="fixture === 'public'"
        :participant="publicParticipantFixture"
        :ateliers="ateliers"
        :distances="distances"
        read-only
      />

      <TirPlayoffComparison
        v-else-if="fixture === 'playoff'"
        :match="playoffFixture"
        :ateliers="ateliers"
        :distances="distances"
        round-label="Final"
      />

      <TrainingSession v-else :session="trainingFixture" />
    </section>

    <section v-else-if="scenario === 'timer'" class="visual-canvas visual-canvas--timer" aria-label="Timer fixture">
      <p class="visual-eyebrow">Round three</p>
      <h1>Round timer</h1>
      <RoundTimerControls
        :timer="timerFixture"
        :read-only="state === 'read-only'"
        cochonettes-enabled
        :cochonettes="2"
      />
      <p class="visual-timer-copy">Court 4 · Panthers against Mistral</p>
    </section>

    <PublicPageShell
      v-else-if="scenario === 'shell'"
      class="visual-shell"
      :container-size="shellFixture.containerSize"
      :textured="shellFixture.textured"
    >
      <div class="container visual-shell-content">
        <header class="visual-shell-header">
          <span class="visual-shell-mark" aria-hidden="true">P</span>
          <span>Petanque Draw</span>
        </header>
        <p class="visual-eyebrow">{{ shellFixture.eyebrow }}</p>
        <h1>{{ shellFixture.heading }}</h1>
        <p>{{ shellFixture.copy }}</p>
        <div class="visual-shell-grid">
          <article v-for="card in shellFixture.cards" :key="card.label" class="visual-shell-card">
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
          </article>
        </div>
      </div>
    </PublicPageShell>

    <div v-else-if="scenario === 'leakage'" class="visual-leakage-fixture">
      <PublicPageShell container-size="compact">
        <div class="container" data-testid="shell-container">Shell-owned container</div>
      </PublicPageShell>
      <div class="container" data-testid="unrelated-container">Unrelated container</div>
    </div>

    <section v-else class="visual-canvas visual-canvas--scroll" aria-label="Scroll controls fixture">
      <p class="visual-eyebrow">{{ fixture === 'window' ? 'Page target' : 'Panel target' }}</p>
      <h1>Scroll controls</h1>
      <div
        v-if="fixture === 'container'"
        id="visual-scroll-target"
        class="visual-scroll-target"
        tabindex="0"
        aria-label="Scrollable fixture content"
      >
        <p v-for="line in 12" :key="line">Fixture line {{ line }}</p>
      </div>
      <div v-else class="visual-window-content">
        <p v-for="line in 18" :key="line">Public tournament update {{ line }}</p>
      </div>
      <ScrollButtons
        :target="fixture"
        :container-selector="fixture === 'container' ? '#visual-scroll-target' : null"
        top-label="Scroll to top"
        bottom-label="Scroll to bottom"
      />
    </section>
  </main>
</template>

<script>
import { markRaw } from 'vue';
import { BarChart3, FileText, Grid3x3, List, TableProperties, Trophy, Users } from 'lucide-vue-next';
import PageLoader from '@/components/ui/PageLoader.vue';
import PublicPageShell from '@/components/ui/PublicPageShell.vue';
import RoundTimerControls from '@/components/ui/RoundTimerControls.vue';
import ScrollButtons from '@/components/ui/ScrollButtons.vue';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreGrid from '@/components/ui/TirScoreGrid.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';
import TirAtelierView from '@/components/tir/TirAtelierView.vue';
import TirParticipantView from '@/components/tir/TirParticipantView.vue';
import TirPlayoffComparison from '@/components/tir/TirPlayoffComparison.vue';
import TrainingSession from '@/components/training/TrainingSession.vue';

const params = new URLSearchParams(window.location.search);
const resultCycle = ['carreau', 'reussi', 'touche', 'manque'];
const distances = [6, 7, 8, 9];
const ateliers = [
  { name: 'Target ball', description: 'Clear shot at a central target.' },
  { name: 'Target behind', description: 'Target protected by another ball.' },
  { name: 'Side target', description: 'Offset target with a narrow line.' },
  { name: 'Obstacle shot', description: 'Target behind an obstacle.' },
  { name: 'Cochonnet', description: 'Final precision throw.' },
];

function makeScores(offset = 0) {
  return Object.fromEntries(
    ateliers.map((_, atelierIndex) => [
      atelierIndex,
      Object.fromEntries(
        distances.map((distance, distanceIndex) => [
          distance,
          resultCycle[(atelierIndex + distanceIndex + offset) % resultCycle.length],
        ]),
      ),
    ]),
  );
}

function makeTrainingAttempts() {
  const attempts = [];
  for (const exerciseIndex of [0, 1]) {
    for (const distance of [6, 7]) {
      for (const attemptNumber of [1, 2]) {
        attempts.push({
          exerciseIndex,
          distance,
          attemptNumber,
          score: resultCycle[(exerciseIndex + distance + attemptNumber) % resultCycle.length],
        });
      }
    }
  }
  return attempts;
}

const icon = (component) => markRaw(component);
const navFixtures = {
  tournament: {
    context: 'Tournament admin',
    heading: 'Summer Open',
    label: 'Tournament sections',
    panelCopy: 'Manage the active tournament from one stable navigation row.',
    variant: 'default',
    active: 'results',
    tabs: [
      { id: 'teams', label: 'Teams', icon: icon(Users) },
      { id: 'games', label: 'Games', icon: icon(Grid3x3) },
      { id: 'results', label: 'Results', icon: icon(Trophy) },
      { id: 'ranking', label: 'Ranking', icon: icon(List) },
    ],
  },
  public: {
    context: 'Public tournament',
    heading: 'Summer Open',
    label: 'Public tournament sections',
    panelCopy: 'Follow the current round and published standings.',
    variant: 'default',
    active: 'round',
    tabs: [
      { id: 'round', label: 'Round', icon: icon(Grid3x3) },
      { id: 'results', label: 'Results', icon: icon(Trophy) },
      { id: 'stats', label: 'Statistics', icon: icon(BarChart3) },
    ],
  },
  archived: {
    context: 'Archived tournament',
    heading: 'Winter Cup 2025',
    label: 'Archived tournament sections',
    panelCopy: 'Review preserved results without changing the tournament.',
    variant: 'default',
    active: 'overview',
    tabs: [
      { id: 'overview', label: 'Overview', icon: icon(FileText) },
      { id: 'results', label: 'Results', icon: icon(Trophy) },
      { id: 'ranking', label: 'Ranking', icon: icon(List) },
    ],
  },
  tir: {
    context: 'Precision shooting',
    heading: 'Tir competition',
    label: 'Tir tournament sections',
    panelCopy: 'Record throws and compare qualification scores.',
    variant: 'tir',
    active: 'scoring',
    tabs: [
      { id: 'participants', label: 'Participants', icon: icon(Users) },
      { id: 'scoring', label: 'Scoring', icon: icon(Grid3x3) },
      { id: 'table', label: 'Table', icon: icon(TableProperties) },
      { id: 'playoff', label: 'Playoff', icon: icon(Trophy) },
    ],
  },
};

const timerFixtures = {
  'not-started': { timerStatus: 'not_started' },
  running: {
    timerStatus: 'running',
    timerStartedAt: '2026-08-06T11:47:05.000Z',
    timerEndsAt: '2026-08-06T12:02:05.000Z',
  },
  paused: { timerStatus: 'paused', remainingMs: 125000 },
  ended: { timerStatus: 'ended', remainingMs: 0 },
  'restart-open': { timerStatus: 'paused', remainingMs: 125000 },
  'read-only': {
    timerStatus: 'running',
    timerStartedAt: '2026-08-06T11:47:05.000Z',
    timerEndsAt: '2026-08-06T12:02:05.000Z',
  },
};

const shellFixtures = {
  public: {
    eyebrow: 'Live tournament',
    heading: 'Summer Open',
    copy: 'Round four is in progress. Results update as courts finish.',
    containerSize: 'responsive',
    textured: true,
    cards: [
      { label: 'Teams', value: '32' },
      { label: 'Round', value: '4 / 5' },
      { label: 'Courts', value: '8' },
    ],
  },
  'public-stats': {
    eyebrow: 'Tournament statistics',
    heading: 'Summer Open insights',
    copy: 'A compact summary of the published tournament data.',
    containerSize: 'compact',
    textured: true,
    cards: [
      { label: 'Matches', value: '74' },
      { label: 'Points', value: '812' },
      { label: 'Leaders', value: '4' },
    ],
  },
  archived: {
    eyebrow: 'Archive',
    heading: 'Winter Cup 2025',
    copy: 'This completed tournament is available as a read-only record.',
    containerSize: 'responsive',
    textured: false,
    cards: [
      { label: 'Status', value: 'Final' },
      { label: 'Teams', value: '24' },
      { label: 'Winner', value: 'Mistral' },
    ],
  },
};

function selectFixture(scenario) {
  const requested = params.get('fixture');
  const defaults = { nav: 'tournament', tir: 'primitives', shell: 'archived', scroll: 'container' };
  const allowed = {
    nav: Object.keys(navFixtures),
    tir: ['primitives', 'participant', 'atelier', 'public', 'playoff', 'training'],
    shell: Object.keys(shellFixtures),
    scroll: ['container', 'window'],
  };
  return allowed[scenario]?.includes(requested) ? requested : defaults[scenario] || '';
}

function selectTimerState() {
  const requested = params.get('state');
  return Object.hasOwn(timerFixtures, requested) ? requested : 'paused';
}

export default {
  name: 'Task11VisualHarness',
  components: {
    PageLoader,
    PublicPageShell,
    RoundTimerControls,
    ScrollButtons,
    TirAtelierView,
    TirParticipantView,
    TirPlayoffComparison,
    TirScoreCircle,
    TirScoreGrid,
    TirScoreLegend,
    TournamentNav,
    TrainingSession,
  },
  data() {
    const scenario = params.get('scenario') || 'nav';
    const fixture = selectFixture(scenario);
    const state = scenario === 'timer' ? selectTimerState() : '';
    return {
      scenario,
      fixture,
      state,
      activeTab: navFixtures[fixture]?.active || 'teams',
      navChangeCount: 0,
      ateliers,
      distances,
      scoreRow: { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' },
      participantFixture: {
        id: 'participant-camille',
        name: 'Camille Martin',
        scores: makeScores(),
      },
      publicParticipantFixture: {
        id: 'participant-noa',
        name: 'Noa Bernard',
        scores: makeScores(1),
      },
      atelierParticipants: [
        { id: 'p-alex', name: 'Alex Morgan', scores: { 0: makeScores()[0] } },
        { id: 'p-sam', name: 'Sam Rivera', scores: { 0: makeScores(1)[0] } },
        { id: 'p-lee', name: 'Lee Dubois', scores: { 0: { 6: 'touche', 7: 'manque' } } },
      ],
      playoffFixture: {
        id: 'final-1',
        player1: 'Camille Martin',
        player2: 'Noa Bernard',
        scores1: makeScores(),
        scores2: makeScores(2),
        tieWinner: 1,
      },
      trainingFixture: {
        id: 'training-2026-08-06',
        name: 'Thursday precision practice',
        type: 'tir_custom',
        status: 'in_progress',
        config: { exercises: [0, 1], distances: [6, 7], attempts: 2 },
        attempts: makeTrainingAttempts(),
        createdAt: Date.parse('2026-08-06T09:00:00.000Z'),
        updatedAt: Date.parse('2026-08-06T10:30:00.000Z'),
        completedAt: null,
      },
    };
  },
  computed: {
    navFixture() {
      return navFixtures[this.fixture] || navFixtures.tournament;
    },
    timerFixture() {
      return timerFixtures[this.state] || timerFixtures.paused;
    },
    shellFixture() {
      return shellFixtures[this.fixture] || shellFixtures.archived;
    },
    tirFixtureHeading() {
      const headings = {
        participant: 'Editable participant scoring',
        atelier: 'Editable atelier scoring',
        public: 'Public read-only tir results',
        playoff: 'Tir playoff comparison',
        training: 'Tir training session',
      };
      return headings[this.fixture] || 'Tir scoring';
    },
  },
  created() {
    const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  },
};
</script>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
  margin: 0;
}

body {
  font-family: Inter, Arial, sans-serif;
  color: var(--color-text);
  background: var(--color-body-bg);
}

button,
input {
  font: inherit;
}

.visual-page {
  min-height: 100vh;
  padding: 32px;
}

.visual-page--shell {
  padding: 0;
}

.visual-canvas {
  width: min(760px, 100%);
  min-height: 320px;
  padding: 24px;
  margin: 0 auto;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.visual-canvas--loader {
  min-height: 420px;
}

.visual-canvas--tir {
  width: min(840px, 100%);
  overflow: visible;
}

.visual-canvas--timer {
  min-height: 260px;
}

.visual-canvas h1,
.visual-shell h1 {
  margin: 0 0 24px;
  font-size: 24px;
}

.visual-eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.visual-nav-panel {
  min-height: 140px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-top: 0;
}

.visual-nav-panel p {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
}

.visual-circles {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.visual-timer-copy {
  margin: 18px 0 0;
  color: var(--color-text-secondary);
  text-align: center;
}

.visual-shell-content {
  padding-top: 48px !important;
}

.visual-shell-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 56px;
  font-weight: 700;
}

.visual-shell-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-btn-text);
  background: var(--color-primary);
  border-radius: 50%;
}

.visual-shell-content > p:not(.visual-eyebrow) {
  max-width: 600px;
  margin: 0 0 28px;
  color: var(--color-text-secondary);
}

.visual-shell-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.visual-shell-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 108px;
  padding: 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.visual-shell-card span {
  color: var(--color-text-secondary);
}

.visual-shell-card strong {
  font-size: 22px;
}

.visual-scroll-target {
  height: 220px;
  padding: 0 16px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
}

.visual-window-content {
  display: grid;
  gap: 10px;
}

.visual-window-content p {
  padding: 12px;
  margin: 0;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.visual-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 500px) {
  .visual-page {
    padding: 12px;
  }

  .visual-page--shell {
    padding: 0;
  }

  .visual-canvas {
    padding: 16px;
  }

  .visual-canvas h1,
  .visual-shell h1 {
    font-size: 21px;
  }

  .visual-shell-content {
    padding-top: 28px !important;
  }

  .visual-shell-header {
    margin-bottom: 36px;
  }

  .visual-shell-grid {
    grid-template-columns: 1fr;
  }

  .visual-shell-card {
    min-height: 84px;
  }
}
</style>
