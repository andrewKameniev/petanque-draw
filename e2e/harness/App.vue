<template>
  <main class="visual-page" :data-scenario="scenario">
    <section v-if="scenario === 'loader'" class="visual-canvas visual-canvas--loader" aria-label="Loader fixture">
      <PageLoader label="Loading tournament…" />
    </section>

    <section v-else-if="scenario === 'nav'" class="visual-canvas" aria-label="Navigation fixture">
      <h1>Tournament navigation</h1>
      <TournamentNav
        v-model="activeTab"
        :tabs="tabs"
        label="Tournament sections"
        id-prefix="visual-nav"
        panel-id="visual-panel"
      />
      <div id="visual-panel" role="tabpanel" :aria-labelledby="`visual-nav-${activeTab}`">
        {{ tabs.find((tab) => tab.id === activeTab)?.label }} panel
      </div>
    </section>

    <section v-else-if="scenario === 'tir'" class="visual-canvas" aria-label="Tir fixture">
      <h1>Tir scoring</h1>
      <TirScoreLegend />
      <div class="visual-circles">
        <TirScoreCircle result="carreau" active aria-label="Carreau result" />
        <TirScoreCircle result="reussi" active aria-label="Successful result" />
        <TirScoreCircle result="touche" active aria-label="Hit result" />
        <TirScoreCircle result="manque" active aria-label="Miss result" />
      </div>
      <TirScoreGrid :distances="[6, 7, 8, 9]" :scores="scores" read-only />
    </section>

    <section v-else-if="scenario === 'timer'" class="visual-canvas" aria-label="Timer fixture">
      <h1>Round timer</h1>
      <RoundTimerControls
        :timer="{ timerStatus: 'paused', remainingMs: 125000 }"
        cochonettes-enabled
        :cochonettes="2"
      />
    </section>

    <PublicPageShell v-else-if="scenario === 'shell'" class="visual-canvas" container-size="responsive">
      <div class="container visual-shell-content">
        <h1>Archived tournament</h1>
        <p>A deterministic public shell fixture.</p>
      </div>
    </PublicPageShell>

    <section v-else class="visual-canvas" aria-label="Scroll controls fixture">
      <h1>Scroll controls</h1>
      <div id="visual-scroll-target" class="visual-scroll-target">
        <p v-for="line in 12" :key="line">Fixture line {{ line }}</p>
      </div>
      <ScrollButtons container-selector="#visual-scroll-target" />
    </section>
  </main>
</template>

<script>
import PageLoader from '@/components/ui/PageLoader.vue';
import PublicPageShell from '@/components/ui/PublicPageShell.vue';
import RoundTimerControls from '@/components/ui/RoundTimerControls.vue';
import ScrollButtons from '@/components/ui/ScrollButtons.vue';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreGrid from '@/components/ui/TirScoreGrid.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';

export default {
  name: 'Task11VisualHarness',
  components: {
    PageLoader,
    PublicPageShell,
    RoundTimerControls,
    ScrollButtons,
    TirScoreCircle,
    TirScoreGrid,
    TirScoreLegend,
    TournamentNav,
  },
  data() {
    return {
      scenario: new URLSearchParams(window.location.search).get('scenario') || 'nav',
      activeTab: 'teams',
      tabs: [
        { id: 'teams', label: 'Teams' },
        { id: 'games', label: 'Games' },
        { id: 'results', label: 'Results' },
        { id: 'ranking', label: 'Ranking' },
      ],
      scores: { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' },
    };
  },
  created() {
    const theme = new URLSearchParams(window.location.search).get('theme') || 'light';
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

.visual-canvas {
  width: min(720px, 100%);
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

.visual-canvas h1 {
  margin: 0 0 24px;
  font-size: 24px;
}

#visual-panel {
  min-height: 140px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-top: 0;
}

.visual-circles {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.visual-shell-content {
  padding-top: 48px !important;
}

.visual-scroll-target {
  height: 220px;
  padding: 0 16px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
}

@media (max-width: 500px) {
  .visual-page {
    padding: 12px;
  }

  .visual-canvas {
    padding: 16px;
  }
}
</style>
