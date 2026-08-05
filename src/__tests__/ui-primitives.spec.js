import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';

import PageLoader from '@/components/ui/PageLoader.vue';
import PublicPageShell from '@/components/ui/PublicPageShell.vue';
import RoundTimerControls from '@/components/ui/RoundTimerControls.vue';
import TirAtelierTabs from '@/components/ui/TirAtelierTabs.vue';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreGrid from '@/components/ui/TirScoreGrid.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';
import TirScoringAction from '@/components/ui/TirScoringAction.vue';
import TirScoringCard from '@/components/ui/TirScoringCard.vue';
import TirRoundTabs from '@/components/ui/TirRoundTabs.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';

const readSource = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const render = (component, props = {}, slots = {}) => {
  const app = createSSRApp({ render: () => h(component, props, slots) });
  app.config.globalProperties.$t = (key) => key;
  return renderToString(app);
};

describe('shared UI primitives', () => {
  it('exposes one accessible full-page loader', () => {
    const source = readSource('../components/ui/PageLoader.vue');
    const draw = readSource('../components/Draw.vue');
    const publicView = readSource('../views/Public.vue');
    const publicStats = readSource('../views/PublicStats.vue');

    expect(PageLoader.name).toBe('PageLoader');
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('class="visually-hidden"');
    for (const parent of [draw, publicView, publicStats]) {
      expect(parent).toContain('<PageLoader v-if="isLoading"');
      expect(parent).not.toContain('class="gooey"');
    }
  });

  it('renders dynamic tournament tabs and supports selection and keyboard navigation', async () => {
    const tabs = [{ id: 'teams' }, { id: 'games' }, { id: 'results' }];
    const emitted = [];
    const focusTab = (id) => emitted.push(['focus', id]);
    const context = {
      tabs,
      modelValue: 'games',
      focusTab,
      $emit: (...args) => emitted.push(args),
    };
    context.selectTab = (tab) => TournamentNav.methods.selectTab.call(context, tab);

    const keyEvent = (key) => ({ key, preventDefault() {} });
    TournamentNav.methods.selectTab.call(context, tabs[2]);
    TournamentNav.methods.onKeydown.call(context, keyEvent('ArrowLeft'), 1);
    TournamentNav.methods.onKeydown.call(context, keyEvent('Home'), 2);
    TournamentNav.methods.onKeydown.call(context, keyEvent('End'), 0);

    expect(emitted).toEqual([
      ['update:modelValue', 'results'],
      ['change', 'results'],
      ['update:modelValue', 'teams'],
      ['change', 'teams'],
      ['focus', 'teams'],
      ['update:modelValue', 'teams'],
      ['change', 'teams'],
      ['focus', 'teams'],
      ['update:modelValue', 'results'],
      ['change', 'results'],
      ['focus', 'results'],
    ]);
    expect(TournamentNav.methods.tabId.call({ idPrefix: 'public-tab' }, 'results')).toBe('public-tab-results');

    const TestIcon = { render: () => h('svg', { class: 'test-tab-icon' }) };
    const html = await render(TournamentNav, {
      tabs: [
        { id: 'teams', label: 'Teams', icon: TestIcon },
        { id: 'results', label: 'Results' },
      ],
      modelValue: 'results',
      idPrefix: 'test-tab',
    });
    expect(html).toContain('test-tab-teams');
    expect(html).toContain('test-tab-icon');
    expect(html).toContain('tournament-nav__btn--active');
    expect(html).toContain('aria-selected="true"');
  });

  it('shares keyboard-accessible atelier and round tabs', () => {
    const atelierItems = [{ id: 0 }, { id: 1 }, { id: 2 }];
    const atelierEvents = [];
    const atelierContext = {
      items: atelierItems,
      select: (id) => atelierEvents.push(['select', id]),
      focus: (index) => atelierEvents.push(['focus', index]),
    };
    const roundTabs = [{ key: 'r1' }, { key: 'r2' }];
    const roundEvents = [];
    const roundContext = {
      tabs: roundTabs,
      select: (key) => roundEvents.push(['select', key]),
      focus: (index) => roundEvents.push(['focus', index]),
    };
    const keyEvent = (key) => ({ key, preventDefault() {} });

    TirAtelierTabs.methods.onKeydown.call(atelierContext, keyEvent('ArrowLeft'), 0);
    TirAtelierTabs.methods.onKeydown.call(atelierContext, keyEvent('End'), 0);
    TirRoundTabs.methods.onKeydown.call(roundContext, keyEvent('ArrowRight'), 1);
    TirRoundTabs.methods.onKeydown.call(roundContext, keyEvent('Home'), 1);

    expect(atelierEvents).toEqual([
      ['select', 2],
      ['focus', 2],
      ['select', 2],
      ['focus', 2],
    ]);
    expect(roundEvents).toEqual([
      ['select', 'r1'],
      ['focus', 0],
      ['select', 'r1'],
      ['focus', 0],
    ]);
  });

  it('renders every tir score state through one editable/read-only grid', async () => {
    const scores = { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' };
    const readOnly = await render(TirScoreGrid, { distances: [6, 7, 8, 9], scores, readOnly: true });
    const editable = await render(TirScoreGrid, { distances: [6, 7, 8, 9], scores: { 6: 'carreau' } });

    for (const result of ['carreau', 'reussi', 'touche', 'manque']) {
      expect(readOnly).toContain(`tir-score-grid__cell--${result}`);
    }
    expect(readOnly.match(/aria-pressed="true"/g)).toHaveLength(4);
    expect(readOnly.match(/ disabled/g)).toHaveLength(16);
    expect(editable).toContain('aria-pressed="false"');
    expect(editable).not.toContain(' disabled');
    expect(TirScoreGrid.methods.valueAt.call({ scores }, 8)).toBe('touche');
  });

  it('renders shared scoring cards and actions without domain coupling', async () => {
    const card = await render(
      TirScoringCard,
      { number: 2, name: 'Atelier 2', score: 12, maxScore: 20, compact: true },
      { default: () => h('span', 'shared content') },
    );
    const action = await render(TirScoringAction, { variant: 'success', disabled: true }, { default: () => 'Save' });

    expect(card).toContain('tir-scoring-card--compact');
    expect(card).toContain('12/20');
    expect(card).toContain('shared content');
    expect(action).toContain('tir-scoring-action--success');
    expect(action).toContain('disabled');
  });

  it('centralizes timer visibility, read-only state, and the start action', async () => {
    expect(RoundTimerControls.name).toBe('RoundTimerControls');
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: { timerStatus: 'paused' } })).toBe(true);
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: { timerStatus: 'not_started' } })).toBe(false);

    const editable = await render(RoundTimerControls, { timer: {}, enabled: true });
    const readOnly = await render(RoundTimerControls, { timer: {}, enabled: true, readOnly: true });
    expect(editable).toContain('round-timer-controls__start');
    expect(editable).toContain('timer.startTimer');
    expect(readOnly).not.toContain('round-timer-controls__start');

    for (const parent of [
      '../components/partials/Games.vue',
      '../components/partials/PlayOff.vue',
      '../components/partials/Cadrage.vue',
    ]) {
      const source = readSource(parent);
      expect(source).toContain('<RoundTimerControls');
      expect(source).not.toContain('class="start-round-timer"');
    }
  });

  it('shares tir legend and circle visuals with training', () => {
    const participant = readSource('../components/tir/TirParticipantView.vue');
    const match = readSource('../components/tir/TirPlayoffMatch.vue');
    const comparison = readSource('../components/tir/TirPlayoffComparison.vue');
    const training = readSource('../components/training/TrainingSession.vue');

    expect(TirScoreLegend.name).toBe('TirScoreLegend');
    expect(TirScoreCircle.name).toBe('TirScoreCircle');
    for (const source of [participant, match, comparison, training]) {
      expect(source).toContain('<TirScoreLegend');
      expect(source).toContain('<TirScoreCircle');
      expect(source).not.toContain('.tir-pview__legend-dot--carreau');
    }
  });

  it('removes obsolete tir scoring, navigation, and round-tab copies', () => {
    const participant = readSource('../components/tir/TirParticipantView.vue');
    const atelier = readSource('../components/tir/TirAtelierView.vue');
    const training = readSource('../components/training/TrainingSession.vue');
    const publicTir = readSource('../components/tir/TirPublicView.vue');
    const adminTir = readSource('../components/tir/TirModule.vue');
    const participantsList = readSource('../components/tir/TirParticipantsList.vue');
    const workspace = readSource('../components/tir/TirScoringWorkspace.vue');

    expect(participant).toContain('<TirAtelierTabs');
    expect(participant).toContain('<TirScoreGrid');
    expect(participant).toContain('<TirScoringCard');
    expect(participant).toContain('<TirScoringAction');
    expect(atelier).toContain('<TirScoreGrid');
    expect(training).toContain('<TirAtelierTabs');
    expect(training).toContain('<TirScoringCard');
    expect(training).toContain('<TirScoringAction');
    expect(publicTir).toContain('<TournamentNav');
    expect(adminTir).toContain('<TournamentNav');
    expect(participantsList).toContain('<TirRoundTabs');
    expect(workspace).toContain('<TirRoundTabs');

    for (const source of [participant, atelier, training]) {
      expect(source).not.toContain('.tir-pview__grid');
      expect(source).not.toContain('.tir-pview__tabs');
      expect(source).not.toContain('.tir-pview__nav-btn');
    }
    for (const source of [publicTir, adminTir]) {
      expect(source).not.toContain('.tir-nav');
    }
    expect(participantsList).not.toContain('.tir-plist__bracket-switcher');
    expect(workspace).not.toContain('.tir-scoring__round-switcher');
  });

  it('keeps extracted primitive colors theme-token based', () => {
    const primitives = [
      '../components/ui/TournamentNav.vue',
      '../components/ui/TirAtelierTabs.vue',
      '../components/ui/TirScoreCircle.vue',
      '../components/ui/TirScoreGrid.vue',
      '../components/ui/TirScoreLegend.vue',
      '../components/ui/TirScoringAction.vue',
      '../components/ui/TirScoringCard.vue',
      '../components/ui/TirRoundTabs.vue',
    ].map(readSource);

    for (const source of primitives) {
      const style = source.match(/<style[\s\S]*?<\/style>/)?.[0] || '';
      expect(style).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });

  it('uses one public page shell and one tournament navigation component', () => {
    const publicView = readSource('../views/Public.vue');
    const publicStats = readSource('../views/PublicStats.vue');
    const archived = readSource('../views/Archived.vue');
    const tournament = readSource('../components/Tournament.vue');

    expect(PublicPageShell.name).toBe('PublicPageShell');
    expect(PublicPageShell.props.textured.default).toBe(true);
    expect(PublicPageShell.props.containerSize.validator('responsive')).toBe(true);
    expect(readSource('../components/ui/PublicPageShell.vue')).toContain("[data-theme='dark']");
    for (const source of [publicView, publicStats, archived]) {
      expect(source).toContain('<PublicPageShell');
    }
    for (const source of [publicView, archived, tournament]) {
      expect(source).toContain('<TournamentNav');
      expect(source).not.toContain('<div class="tournament-nav">');
    }
  });
});
