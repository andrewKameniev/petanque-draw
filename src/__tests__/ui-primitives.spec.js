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

/* ─────────────────────────────────────────────────────────────────────────────
 * PageLoader
 * ───────────────────────────────────────────────────────────────────────────── */
describe('PageLoader', () => {
  it('has correct component name', () => {
    expect(PageLoader.name).toBe('PageLoader');
  });

  it('renders with role="status" and aria-live="polite"', async () => {
    const html = await render(PageLoader);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it('renders aria-label with default loading text', async () => {
    const html = await render(PageLoader);
    expect(html).toContain('aria-label="Loading…"');
  });

  it('renders custom label via prop', async () => {
    const html = await render(PageLoader, { label: 'Please wait' });
    expect(html).toContain('aria-label="Please wait"');
    expect(html).toContain('Please wait');
  });

  it('has visually-hidden text for screen readers', async () => {
    const html = await render(PageLoader);
    expect(html).toContain('class="visually-hidden"');
  });

  it('hides decorative dots from assistive tech', async () => {
    const html = await render(PageLoader);
    expect(html).toContain('aria-hidden="true"');
  });

  it('respects prefers-reduced-motion via CSS media query', () => {
    const source = readSource('../components/ui/PageLoader.vue');
    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toContain('animation-duration: 8s');
  });

  it('is used by consumers (Draw, Public, PublicStats) via <PageLoader v-if="isLoading"', () => {
    const draw = readSource('../components/Draw.vue');
    const publicView = readSource('../views/Public.vue');
    const publicStats = readSource('../views/PublicStats.vue');
    for (const parent of [draw, publicView, publicStats]) {
      expect(parent).toContain('<PageLoader v-if="isLoading"');
      expect(parent).not.toContain('class="gooey"');
    }
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * PublicPageShell
 * ───────────────────────────────────────────────────────────────────────────── */
describe('PublicPageShell', () => {
  it('has correct component name', () => {
    expect(PublicPageShell.name).toBe('PublicPageShell');
  });

  it('defaults textured to true', () => {
    expect(PublicPageShell.props.textured.default).toBe(true);
  });

  it('validates containerSize prop', () => {
    expect(PublicPageShell.props.containerSize.validator('')).toBe(true);
    expect(PublicPageShell.props.containerSize.validator('compact')).toBe(true);
    expect(PublicPageShell.props.containerSize.validator('responsive')).toBe(true);
    expect(PublicPageShell.props.containerSize.validator('invalid')).toBe(false);
  });

  it('renders default slot content', async () => {
    const html = await render(PublicPageShell, {}, { default: () => h('div', { class: 'test-content' }, 'Hello') });
    expect(html).toContain('test-content');
    expect(html).toContain('Hello');
    expect(html).toContain('public-page-shell');
  });

  it('applies --plain modifier when textured is false', async () => {
    const html = await render(PublicPageShell, { textured: false });
    expect(html).toContain('public-page-shell--plain');
  });

  it('does not apply --plain modifier when textured is true', async () => {
    const html = await render(PublicPageShell, { textured: true });
    expect(html).not.toContain('public-page-shell--plain');
  });

  it('applies containerSize class', async () => {
    const compact = await render(PublicPageShell, { containerSize: 'compact' });
    const responsive = await render(PublicPageShell, { containerSize: 'responsive' });
    expect(compact).toContain('public-page-shell--compact');
    expect(responsive).toContain('public-page-shell--responsive');
  });

  it('supports dark theme via data-theme attribute in styles', () => {
    const source = readSource('../components/ui/PublicPageShell.vue');
    expect(source).toContain("[data-theme='dark']");
  });

  it('is used by Public, PublicStats, and Archived views', () => {
    const publicView = readSource('../views/Public.vue');
    const publicStats = readSource('../views/PublicStats.vue');
    const archived = readSource('../views/Archived.vue');
    for (const source of [publicView, publicStats, archived]) {
      expect(source).toContain('<PublicPageShell');
    }
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * TournamentNav
 * ───────────────────────────────────────────────────────────────────────────── */
describe('TournamentNav', () => {
  it('has correct component name', () => {
    expect(TournamentNav.name).toBe('TournamentNav');
  });

  it('renders dynamic tab list with role="tablist"', async () => {
    const html = await render(TournamentNav, {
      tabs: [
        { id: 'teams', label: 'Teams' },
        { id: 'games', label: 'Games' },
      ],
      modelValue: 'teams',
    });
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('aria-label="Tournament sections"');
  });

  it('marks active tab with aria-selected and active class', async () => {
    const html = await render(TournamentNav, {
      tabs: [
        { id: 'teams', label: 'Teams' },
        { id: 'games', label: 'Games' },
      ],
      modelValue: 'games',
    });
    expect(html).toContain('tournament-nav__btn--active');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-selected="false"');
  });

  it('sets tabindex=0 on active tab and -1 on others', async () => {
    const html = await render(TournamentNav, {
      tabs: [
        { id: 'teams', label: 'Teams' },
        { id: 'games', label: 'Games' },
      ],
      modelValue: 'teams',
    });
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('tabindex="-1"');
  });

  it('generates unique tab IDs using idPrefix', () => {
    expect(TournamentNav.methods.tabId.call({ idPrefix: 'public-tab' }, 'results')).toBe('public-tab-results');
    expect(TournamentNav.methods.tabId.call({ idPrefix: 'tab' }, 'teams')).toBe('tab-teams');
  });

  it('renders tab icons when provided', async () => {
    const TestIcon = { render: () => h('svg', { class: 'test-icon' }) };
    const html = await render(TournamentNav, {
      tabs: [{ id: 'teams', label: 'Teams', icon: TestIcon }],
      modelValue: 'teams',
    });
    expect(html).toContain('test-icon');
    expect(html).toContain('aria-hidden="true"');
  });

  it('emits update:modelValue and change on selectTab', () => {
    const emitted = [];
    const context = {
      tabs: [{ id: 'teams' }, { id: 'games' }],
      modelValue: 'teams',
      $emit: (...args) => emitted.push(args),
    };
    TournamentNav.methods.selectTab.call(context, { id: 'games' });
    expect(emitted).toEqual([
      ['update:modelValue', 'games'],
      ['change', 'games'],
    ]);
  });

  it('does not emit if tab has no id', () => {
    const emitted = [];
    const context = { $emit: (...args) => emitted.push(args) };
    TournamentNav.methods.selectTab.call(context, {});
    TournamentNav.methods.selectTab.call(context, null);
    expect(emitted).toEqual([]);
  });

  it('handles ArrowRight keyboard navigation (wraps around)', () => {
    const emitted = [];
    const context = {
      tabs: [{ id: 'teams' }, { id: 'games' }, { id: 'results' }],
      $emit: (...args) => emitted.push(args),
      selectTab: TournamentNav.methods.selectTab,
      focusTab: () => {},
    };
    const keyEvent = (key) => ({ key, preventDefault() {} });
    TournamentNav.methods.onKeydown.call(context, keyEvent('ArrowRight'), 2);
    expect(emitted).toEqual([
      ['update:modelValue', 'teams'],
      ['change', 'teams'],
    ]);
  });

  it('handles ArrowLeft keyboard navigation (wraps around)', () => {
    const emitted = [];
    const context = {
      tabs: [{ id: 'teams' }, { id: 'games' }, { id: 'results' }],
      $emit: (...args) => emitted.push(args),
      selectTab: TournamentNav.methods.selectTab,
      focusTab: () => {},
    };
    const keyEvent = (key) => ({ key, preventDefault() {} });
    TournamentNav.methods.onKeydown.call(context, keyEvent('ArrowLeft'), 0);
    expect(emitted).toEqual([
      ['update:modelValue', 'results'],
      ['change', 'results'],
    ]);
  });

  it('handles Home key (moves to first tab)', () => {
    const emitted = [];
    const context = {
      tabs: [{ id: 'teams' }, { id: 'games' }, { id: 'results' }],
      $emit: (...args) => emitted.push(args),
      selectTab: TournamentNav.methods.selectTab,
      focusTab: () => {},
    };
    TournamentNav.methods.onKeydown.call(context, { key: 'Home', preventDefault() {} }, 2);
    expect(emitted).toEqual([
      ['update:modelValue', 'teams'],
      ['change', 'teams'],
    ]);
  });

  it('handles End key (moves to last tab)', () => {
    const emitted = [];
    const context = {
      tabs: [{ id: 'teams' }, { id: 'games' }, { id: 'results' }],
      $emit: (...args) => emitted.push(args),
      selectTab: TournamentNav.methods.selectTab,
      focusTab: () => {},
    };
    TournamentNav.methods.onKeydown.call(context, { key: 'End', preventDefault() {} }, 0);
    expect(emitted).toEqual([
      ['update:modelValue', 'results'],
      ['change', 'results'],
    ]);
  });

  it('ignores unrecognized keys', () => {
    const emitted = [];
    const context = {
      tabs: [{ id: 'teams' }, { id: 'games' }],
      $emit: (...args) => emitted.push(args),
      selectTab: TournamentNav.methods.selectTab,
      focusTab: () => {},
    };
    TournamentNav.methods.onKeydown.call(context, { key: 'Tab', preventDefault() {} }, 0);
    TournamentNav.methods.onKeydown.call(context, { key: 'Enter', preventDefault() {} }, 0);
    expect(emitted).toEqual([]);
  });

  it('supports variant prop (default, tir)', async () => {
    const defaultHtml = await render(TournamentNav, {
      tabs: [{ id: 'a', label: 'A' }],
      modelValue: 'a',
    });
    const tirHtml = await render(TournamentNav, {
      tabs: [{ id: 'a', label: 'A' }],
      modelValue: 'a',
      variant: 'tir',
    });
    expect(defaultHtml).toContain('tournament-nav--default');
    expect(tirHtml).toContain('tournament-nav--tir');
  });

  it('consumers use TournamentNav instead of duplicated nav markup', () => {
    const publicView = readSource('../views/Public.vue');
    const archived = readSource('../views/Archived.vue');
    const tournament = readSource('../components/Tournament.vue');
    for (const source of [publicView, archived, tournament]) {
      expect(source).toContain('<TournamentNav');
      expect(source).not.toContain('<div class="tournament-nav">');
    }
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * TirScoreGrid
 * ───────────────────────────────────────────────────────────────────────────── */
describe('TirScoreGrid', () => {
  it('has correct component name', () => {
    expect(TirScoreGrid.name).toBe('TirScoreGrid');
  });

  it('renders all four result states (carreau, reussi, touche, manque)', async () => {
    const scores = { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' };
    const html = await render(TirScoreGrid, { distances: [6, 7, 8, 9], scores });
    for (const result of ['carreau', 'reussi', 'touche', 'manque']) {
      expect(html).toContain(`tir-score-grid__cell--${result}`);
    }
  });

  it('marks selected cells with aria-pressed="true"', async () => {
    const scores = { 6: 'carreau', 7: 'reussi', 8: 'touche', 9: 'manque' };
    const html = await render(TirScoreGrid, { distances: [6, 7, 8, 9], scores });
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(4);
  });

  it('marks unselected cells with aria-pressed="false"', async () => {
    const html = await render(TirScoreGrid, { distances: [6, 7, 8, 9], scores: { 6: 'carreau' } });
    expect(html).toContain('aria-pressed="false"');
  });

  it('disables all cells in readOnly mode', async () => {
    const html = await render(TirScoreGrid, { distances: [6, 7, 8, 9], scores: {}, readOnly: true });
    expect(html.match(/ disabled/g)).toHaveLength(16);
  });

  it('enables all cells in editable mode', async () => {
    const html = await render(TirScoreGrid, { distances: [6, 7, 8, 9], scores: {} });
    expect(html).not.toContain(' disabled');
  });

  it('renders correct distances (senior: 6-9)', async () => {
    const html = await render(TirScoreGrid, { distances: [6, 7, 8, 9], scores: {} });
    expect(html).toContain('6m');
    expect(html).toContain('7m');
    expect(html).toContain('8m');
    expect(html).toContain('9m');
  });

  it('renders correct distances (junior: 6-8)', async () => {
    const html = await render(TirScoreGrid, { distances: [6, 7, 8], scores: {} });
    expect(html).toContain('6m');
    expect(html).toContain('7m');
    expect(html).toContain('8m');
    expect(html).not.toContain('9m');
  });

  it('provides accessible labels combining distance and result', async () => {
    const html = await render(TirScoreGrid, { distances: [6], scores: {} });
    expect(html).toContain('aria-label="6m, tir.carreau"');
    expect(html).toContain('aria-label="6m, tir.touche"');
  });

  it('valueAt returns correct result or null', () => {
    const scores = { 6: 'carreau', 8: 'touche' };
    expect(TirScoreGrid.methods.valueAt.call({ scores }, 6)).toBe('carreau');
    expect(TirScoreGrid.methods.valueAt.call({ scores }, 8)).toBe('touche');
    expect(TirScoreGrid.methods.valueAt.call({ scores }, 7)).toBeNull();
    expect(TirScoreGrid.methods.valueAt.call({ scores: undefined }, 6)).toBeNull();
  });

  it('supports compact mode', async () => {
    const html = await render(TirScoreGrid, { distances: [6], scores: {}, compact: true });
    expect(html).toContain('tir-score-grid--compact');
  });

  it('hides header from assistive tech', async () => {
    const html = await render(TirScoreGrid, { distances: [6], scores: {} });
    expect(html).toContain('aria-hidden="true"');
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * TirScoreCircle
 * ───────────────────────────────────────────────────────────────────────────── */
describe('TirScoreCircle', () => {
  it('has correct component name', () => {
    expect(TirScoreCircle.name).toBe('TirScoreCircle');
  });

  it('renders each result type (carreau, reussi, touche, manque)', async () => {
    for (const result of ['carreau', 'reussi', 'touche', 'manque']) {
      const html = await render(TirScoreCircle, { result });
      expect(html).toContain(`tir-score-circle--${result}`);
    }
  });

  it('renders as span when not interactive', async () => {
    const html = await render(TirScoreCircle, { result: 'carreau' });
    expect(html).toContain('<span');
    expect(html).not.toContain('<button');
  });

  it('renders as button when interactive', async () => {
    const html = await render(TirScoreCircle, { result: 'carreau', interactive: true });
    expect(html).toContain('<button');
  });

  it('shows aria-pressed only when interactive', async () => {
    const interactive = await render(TirScoreCircle, { result: 'carreau', interactive: true, active: true });
    const nonInteractive = await render(TirScoreCircle, { result: 'carreau', active: true });
    expect(interactive).toContain('aria-pressed="true"');
    expect(nonInteractive).not.toContain('aria-pressed');
  });

  it('applies active class when active', async () => {
    const html = await render(TirScoreCircle, { result: 'reussi', active: true });
    expect(html).toContain('tir-score-circle--active');
  });

  it('does not apply active class when inactive', async () => {
    const html = await render(TirScoreCircle, { result: 'reussi', active: false });
    expect(html).not.toContain('tir-score-circle--active');
  });

  it('supports disabled state', async () => {
    const html = await render(TirScoreCircle, { result: 'touche', interactive: true, disabled: true });
    expect(html).toContain('disabled');
  });

  it('supports size variants (small, compact, large)', async () => {
    const small = await render(TirScoreCircle, { result: 'carreau', size: 'small' });
    const compact = await render(TirScoreCircle, { result: 'carreau', size: 'compact' });
    const large = await render(TirScoreCircle, { result: 'carreau', size: 'large' });
    expect(small).toContain('tir-score-circle--small');
    expect(compact).toContain('tir-score-circle--compact');
    expect(large).toContain('tir-score-circle--large');
  });

  it('supports legacy small boolean prop', async () => {
    const html = await render(TirScoreCircle, { result: 'carreau', small: true });
    expect(html).toContain('tir-score-circle--small');
  });

  it('includes aria-label when interactive', async () => {
    const html = await render(TirScoreCircle, { result: 'carreau', interactive: true, ariaLabel: 'Score circle' });
    expect(html).toContain('aria-label="Score circle"');
  });

  it('validates result prop', () => {
    const validator = TirScoreCircle.props.result.validator;
    expect(validator('carreau')).toBe(true);
    expect(validator('reussi')).toBe(true);
    expect(validator('touche')).toBe(true);
    expect(validator('manque')).toBe(true);
    expect(validator('invalid')).toBe(false);
  });

  it('validates size prop', () => {
    const validator = TirScoreCircle.props.size.validator;
    expect(validator('small')).toBe(true);
    expect(validator('compact')).toBe(true);
    expect(validator('default')).toBe(true);
    expect(validator('large')).toBe(true);
    expect(validator('invalid')).toBe(false);
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * TirScoringCard
 * ───────────────────────────────────────────────────────────────────────────── */
describe('TirScoringCard', () => {
  it('has correct component name', () => {
    expect(TirScoringCard.name).toBe('TirScoringCard');
  });

  it('renders number, name, and score', async () => {
    const html = await render(TirScoringCard, { number: 3, name: 'Atelier 3', score: 15, maxScore: 20 });
    expect(html).toContain('3');
    expect(html).toContain('Atelier 3');
    expect(html).toContain('15/20');
  });

  it('hides score display when score is null', async () => {
    const html = await render(TirScoringCard, { number: 1, name: 'Test' });
    expect(html).not.toContain('tir-scoring-card__score');
  });

  it('renders slot content', async () => {
    const html = await render(
      TirScoringCard,
      { number: 1, name: 'Test' },
      { default: () => h('div', { class: 'slot-content' }, 'Grid here') },
    );
    expect(html).toContain('slot-content');
    expect(html).toContain('Grid here');
  });

  it('applies compact modifier', async () => {
    const html = await render(TirScoringCard, { number: 1, name: 'Test', compact: true });
    expect(html).toContain('tir-scoring-card--compact');
  });

  it('renders as section element', async () => {
    const html = await render(TirScoringCard, { number: 1, name: 'Test' });
    expect(html).toContain('<section');
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * TirScoringAction
 * ───────────────────────────────────────────────────────────────────────────── */
describe('TirScoringAction', () => {
  it('has correct component name', () => {
    expect(TirScoringAction.name).toBe('TirScoringAction');
  });

  it('renders each variant (default, primary, success, danger)', async () => {
    for (const variant of ['default', 'primary', 'success', 'danger']) {
      const html = await render(TirScoringAction, { variant }, { default: () => 'Action' });
      expect(html).toContain(`tir-scoring-action--${variant}`);
    }
  });

  it('renders slot content', async () => {
    const html = await render(TirScoringAction, {}, { default: () => 'Save Results' });
    expect(html).toContain('Save Results');
  });

  it('supports disabled state', async () => {
    const html = await render(TirScoringAction, { disabled: true }, { default: () => 'Save' });
    expect(html).toContain('disabled');
  });

  it('applies compact modifier', async () => {
    const html = await render(TirScoringAction, { compact: true }, { default: () => 'Save' });
    expect(html).toContain('tir-scoring-action--compact');
  });

  it('validates variant prop', () => {
    const validator = TirScoringAction.props.variant.validator;
    expect(validator('default')).toBe(true);
    expect(validator('primary')).toBe(true);
    expect(validator('success')).toBe(true);
    expect(validator('danger')).toBe(true);
    expect(validator('warning')).toBe(false);
  });

  it('renders as button element', async () => {
    const html = await render(TirScoringAction, {}, { default: () => 'Click' });
    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * TirAtelierTabs
 * ───────────────────────────────────────────────────────────────────────────── */
describe('TirAtelierTabs', () => {
  it('has correct component name', () => {
    expect(TirAtelierTabs.name).toBe('TirAtelierTabs');
  });

  it('renders tabs with role="tablist"', async () => {
    const html = await render(TirAtelierTabs, {
      items: [
        { id: 0, label: '1' },
        { id: 1, label: '2' },
      ],
      modelValue: 0,
    });
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
  });

  it('marks active tab with aria-selected and active class', async () => {
    const html = await render(TirAtelierTabs, {
      items: [
        { id: 0, label: '1' },
        { id: 1, label: '2' },
      ],
      modelValue: 1,
    });
    expect(html).toContain('tir-atelier-tabs__tab--active');
    expect(html).toContain('aria-selected="true"');
  });

  it('marks complete tabs with --complete modifier', async () => {
    const html = await render(TirAtelierTabs, {
      items: [
        { id: 0, label: '1', complete: true },
        { id: 1, label: '2' },
      ],
      modelValue: 1,
    });
    expect(html).toContain('tir-atelier-tabs__tab--complete');
  });

  it('generates unique tab IDs via idPrefix', () => {
    const context = { idPrefix: 'training-atelier' };
    expect(TirAtelierTabs.methods.tabId.call(context, 0)).toBe('training-atelier-0');
    expect(TirAtelierTabs.methods.tabId.call(context, 2)).toBe('training-atelier-2');
  });

  it('handles ArrowRight keyboard navigation', () => {
    const emitted = [];
    const context = {
      items: [{ id: 0 }, { id: 1 }, { id: 2 }],
      select: (id) => emitted.push(['select', id]),
      focus: (index) => emitted.push(['focus', index]),
    };
    TirAtelierTabs.methods.onKeydown.call(context, { key: 'ArrowRight', preventDefault() {} }, 0);
    expect(emitted).toEqual([
      ['select', 1],
      ['focus', 1],
    ]);
  });

  it('handles ArrowLeft wrapping to last item', () => {
    const emitted = [];
    const context = {
      items: [{ id: 0 }, { id: 1 }, { id: 2 }],
      select: (id) => emitted.push(['select', id]),
      focus: (index) => emitted.push(['focus', index]),
    };
    TirAtelierTabs.methods.onKeydown.call(context, { key: 'ArrowLeft', preventDefault() {} }, 0);
    expect(emitted).toEqual([
      ['select', 2],
      ['focus', 2],
    ]);
  });

  it('handles Home key', () => {
    const emitted = [];
    const context = {
      items: [{ id: 0 }, { id: 1 }, { id: 2 }],
      select: (id) => emitted.push(['select', id]),
      focus: (index) => emitted.push(['focus', index]),
    };
    TirAtelierTabs.methods.onKeydown.call(context, { key: 'Home', preventDefault() {} }, 2);
    expect(emitted).toEqual([
      ['select', 0],
      ['focus', 0],
    ]);
  });

  it('handles End key', () => {
    const emitted = [];
    const context = {
      items: [{ id: 0 }, { id: 1 }, { id: 2 }],
      select: (id) => emitted.push(['select', id]),
      focus: (index) => emitted.push(['focus', index]),
    };
    TirAtelierTabs.methods.onKeydown.call(context, { key: 'End', preventDefault() {} }, 0);
    expect(emitted).toEqual([
      ['select', 2],
      ['focus', 2],
    ]);
  });

  it('ignores unrecognized keys', () => {
    const emitted = [];
    const context = {
      items: [{ id: 0 }, { id: 1 }],
      select: (id) => emitted.push(id),
      focus: (index) => emitted.push(index),
    };
    TirAtelierTabs.methods.onKeydown.call(context, { key: 'Space', preventDefault() {} }, 0);
    expect(emitted).toEqual([]);
  });

  it('sets correct tabindex (0 for active, -1 for others)', async () => {
    const html = await render(TirAtelierTabs, {
      items: [
        { id: 0, label: '1' },
        { id: 1, label: '2' },
      ],
      modelValue: 0,
    });
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('tabindex="-1"');
  });

  it('uses default aria-label', async () => {
    const html = await render(TirAtelierTabs, {
      items: [{ id: 0, label: '1' }],
      modelValue: 0,
    });
    expect(html).toContain('aria-label="Scoring ateliers"');
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * TirRoundTabs
 * ───────────────────────────────────────────────────────────────────────────── */
describe('TirRoundTabs', () => {
  it('has correct component name', () => {
    expect(TirRoundTabs.name).toBe('TirRoundTabs');
  });

  it('renders tabs with role="tablist"', async () => {
    const html = await render(TirRoundTabs, {
      tabs: [
        { key: 'r1', label: 'Round 1' },
        { key: 'r2', label: 'Round 2' },
      ],
      modelValue: 'r1',
    });
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('Round 1');
    expect(html).toContain('Round 2');
  });

  it('marks active tab correctly', async () => {
    const html = await render(TirRoundTabs, {
      tabs: [
        { key: 'r1', label: 'Round 1' },
        { key: 'r2', label: 'Round 2' },
      ],
      modelValue: 'r2',
    });
    expect(html).toContain('tir-round-tabs__tab--active');
    expect(html).toContain('aria-selected="true"');
  });

  it('generates tab IDs using idPrefix', () => {
    const context = { idPrefix: 'scoring-round' };
    expect(TirRoundTabs.methods.tabId.call(context, 'r1')).toBe('scoring-round-r1');
  });

  it('handles ArrowRight wrapping from last to first', () => {
    const emitted = [];
    const context = {
      tabs: [{ key: 'r1' }, { key: 'r2' }],
      select: (key) => emitted.push(['select', key]),
      focus: (index) => emitted.push(['focus', index]),
    };
    TirRoundTabs.methods.onKeydown.call(context, { key: 'ArrowRight', preventDefault() {} }, 1);
    expect(emitted).toEqual([
      ['select', 'r1'],
      ['focus', 0],
    ]);
  });

  it('handles ArrowLeft navigation', () => {
    const emitted = [];
    const context = {
      tabs: [{ key: 'r1' }, { key: 'r2' }, { key: 'r3' }],
      select: (key) => emitted.push(['select', key]),
      focus: (index) => emitted.push(['focus', index]),
    };
    TirRoundTabs.methods.onKeydown.call(context, { key: 'ArrowLeft', preventDefault() {} }, 2);
    expect(emitted).toEqual([
      ['select', 'r2'],
      ['focus', 1],
    ]);
  });

  it('handles Home key (moves to first)', () => {
    const emitted = [];
    const context = {
      tabs: [{ key: 'r1' }, { key: 'r2' }, { key: 'r3' }],
      select: (key) => emitted.push(['select', key]),
      focus: (index) => emitted.push(['focus', index]),
    };
    TirRoundTabs.methods.onKeydown.call(context, { key: 'Home', preventDefault() {} }, 2);
    expect(emitted).toEqual([
      ['select', 'r1'],
      ['focus', 0],
    ]);
  });

  it('handles End key (moves to last)', () => {
    const emitted = [];
    const context = {
      tabs: [{ key: 'r1' }, { key: 'r2' }, { key: 'r3' }],
      select: (key) => emitted.push(['select', key]),
      focus: (index) => emitted.push(['focus', index]),
    };
    TirRoundTabs.methods.onKeydown.call(context, { key: 'End', preventDefault() {} }, 0);
    expect(emitted).toEqual([
      ['select', 'r3'],
      ['focus', 2],
    ]);
  });

  it('uses default aria-label', async () => {
    const html = await render(TirRoundTabs, {
      tabs: [{ key: 'r1', label: 'R1' }],
      modelValue: 'r1',
    });
    expect(html).toContain('aria-label="Scoring rounds"');
  });

  it('is used by TirParticipantsList and TirScoringWorkspace', () => {
    const participantsList = readSource('../components/tir/TirParticipantsList.vue');
    const workspace = readSource('../components/tir/TirScoringWorkspace.vue');
    expect(participantsList).toContain('<TirRoundTabs');
    expect(workspace).toContain('<TirRoundTabs');
    expect(participantsList).not.toContain('.tir-plist__bracket-switcher');
    expect(workspace).not.toContain('.tir-scoring__round-switcher');
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * TirScoreLegend
 * ───────────────────────────────────────────────────────────────────────────── */
describe('TirScoreLegend', () => {
  it('has correct component name', () => {
    expect(TirScoreLegend.name).toBe('TirScoreLegend');
  });

  it('renders dot variant by default', async () => {
    const html = await render(TirScoreLegend);
    expect(html).toContain('tir-score-legend--dot');
    expect(html).toContain('tir-score-legend__marker--dot');
  });

  it('renders badge variant', async () => {
    const html = await render(TirScoreLegend, { variant: 'badge' });
    expect(html).toContain('tir-score-legend--badge');
    expect(html).toContain('tir-score-legend__marker--badge');
  });

  it('renders all four result markers', async () => {
    const html = await render(TirScoreLegend);
    for (const key of ['carreau', 'reussi', 'touche', 'manque']) {
      expect(html).toContain(`tir-score-legend__marker--${key}`);
    }
  });

  it('validates variant prop', () => {
    const validator = TirScoreLegend.props.variant.validator;
    expect(validator('dot')).toBe(true);
    expect(validator('badge')).toBe(true);
    expect(validator('circle')).toBe(false);
  });

  it('is shared between tir views and training', () => {
    const participant = readSource('../components/tir/TirParticipantView.vue');
    const match = readSource('../components/tir/TirPlayoffMatch.vue');
    const comparison = readSource('../components/tir/TirPlayoffComparison.vue');
    const training = readSource('../components/training/TrainingSession.vue');
    for (const source of [participant, match, comparison, training]) {
      expect(source).toContain('<TirScoreLegend');
      expect(source).not.toContain('.tir-pview__legend-dot--carreau');
    }
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * RoundTimerControls
 * ───────────────────────────────────────────────────────────────────────────── */
describe('RoundTimerControls', () => {
  it('has correct component name', () => {
    expect(RoundTimerControls.name).toBe('RoundTimerControls');
  });

  it('hasVisibleTimer is true for running state', () => {
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: { timerStatus: 'running' } })).toBe(true);
  });

  it('hasVisibleTimer is true for paused state', () => {
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: { timerStatus: 'paused' } })).toBe(true);
  });

  it('hasVisibleTimer is true for ended state', () => {
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: { timerStatus: 'ended' } })).toBe(true);
  });

  it('hasVisibleTimer is false for not_started state', () => {
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: { timerStatus: 'not_started' } })).toBe(false);
  });

  it('hasVisibleTimer is false when timer is empty', () => {
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: {} })).toBe(false);
  });

  it('hasVisibleTimer is false when timer is null', () => {
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: null })).toBe(false);
  });

  it('renders start button in editable mode when timer not started', async () => {
    const html = await render(RoundTimerControls, { timer: {}, enabled: true });
    expect(html).toContain('round-timer-controls__start');
    expect(html).toContain('timer.startTimer');
  });

  it('hides start button in readOnly mode', async () => {
    const html = await render(RoundTimerControls, { timer: {}, enabled: true, readOnly: true });
    expect(html).not.toContain('round-timer-controls__start');
  });

  it('renders nothing when not enabled', async () => {
    const html = await render(RoundTimerControls, { timer: {}, enabled: false });
    expect(html).toContain('<!--');
    expect(html).not.toContain('round-timer-controls');
  });

  it('declares correct emits', () => {
    expect(RoundTimerControls.emits).toEqual(['start', 'timer-ended', 'restart', 'pause', 'resume', 'reset']);
  });

  it('is used by Games, PlayOff, and Cadrage without duplicate start markup', () => {
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
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Consumer source-string assertions: no duplicate patterns
 * ───────────────────────────────────────────────────────────────────────────── */
describe('consumer deduplication', () => {
  it('tir views use shared primitives instead of inline scoring markup', () => {
    const participant = readSource('../components/tir/TirParticipantView.vue');
    const atelier = readSource('../components/tir/TirAtelierView.vue');
    const training = readSource('../components/training/TrainingSession.vue');

    expect(participant).toContain('<TirAtelierTabs');
    expect(participant).toContain('<TirScoreGrid');
    expect(participant).toContain('<TirScoringCard');
    expect(participant).toContain('<TirScoringAction');
    expect(atelier).toContain('<TirScoreGrid');
    expect(training).toContain('<TirAtelierTabs');
    expect(training).toContain('<TirScoringCard');
    expect(training).toContain('<TirScoringAction');

    for (const source of [participant, atelier, training]) {
      expect(source).not.toContain('.tir-pview__grid');
      expect(source).not.toContain('.tir-pview__tabs');
      expect(source).not.toContain('.tir-pview__nav-btn');
    }
  });

  it('tir navigation views use TournamentNav without inline nav', () => {
    const publicTir = readSource('../components/tir/TirPublicView.vue');
    const adminTir = readSource('../components/tir/TirModule.vue');

    expect(publicTir).toContain('<TournamentNav');
    expect(adminTir).toContain('<TournamentNav');
    for (const source of [publicTir, adminTir]) {
      expect(source).not.toContain('.tir-nav');
    }
  });

  it('TirScoreCircle is shared across tir views and training', () => {
    const participant = readSource('../components/tir/TirParticipantView.vue');
    const match = readSource('../components/tir/TirPlayoffMatch.vue');
    const comparison = readSource('../components/tir/TirPlayoffComparison.vue');
    const training = readSource('../components/training/TrainingSession.vue');
    for (const source of [participant, match, comparison, training]) {
      expect(source).toContain('<TirScoreCircle');
    }
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Theme: CSS variable usage (no hardcoded hex colors)
 * ───────────────────────────────────────────────────────────────────────────── */
describe('theme CSS variables', () => {
  const primitiveFiles = [
    '../components/ui/TournamentNav.vue',
    '../components/ui/TirAtelierTabs.vue',
    '../components/ui/TirScoreCircle.vue',
    '../components/ui/TirScoreGrid.vue',
    '../components/ui/TirScoreLegend.vue',
    '../components/ui/TirScoringAction.vue',
    '../components/ui/TirScoringCard.vue',
    '../components/ui/TirRoundTabs.vue',
    '../components/ui/PageLoader.vue',
    '../components/ui/PublicPageShell.vue',
    '../components/ui/RoundTimerControls.vue',
  ];

  for (const file of primitiveFiles) {
    const name = file.split('/').pop().replace('.vue', '');
    it(`${name} uses only CSS variables (no hardcoded hex colors)`, () => {
      const source = readSource(file);
      const style = source.match(/<style[\s\S]*?<\/style>/)?.[0] || '';
      expect(style).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    });
  }
});
