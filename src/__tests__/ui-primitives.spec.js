import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

import PageLoader from '@/components/ui/PageLoader.vue';
import PublicPageShell from '@/components/ui/PublicPageShell.vue';
import RoundTimerControls from '@/components/ui/RoundTimerControls.vue';
import TirScoreCircle from '@/components/ui/TirScoreCircle.vue';
import TirScoreLegend from '@/components/ui/TirScoreLegend.vue';
import TournamentNav from '@/components/ui/TournamentNav.vue';

const readSource = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('shared UI primitives', () => {
  it('exposes one accessible full-page loader', () => {
    const source = readSource('../components/ui/PageLoader.vue');

    expect(PageLoader.name).toBe('PageLoader');
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('class="visually-hidden"');
  });

  it('selects tournament tabs and supports arrow, Home, and End keys', () => {
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
  });

  it('centralizes timer visibility and the start action', () => {
    expect(RoundTimerControls.name).toBe('RoundTimerControls');
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: { timerStatus: 'paused' } })).toBe(true);
    expect(RoundTimerControls.computed.hasVisibleTimer.call({ timer: { timerStatus: 'not_started' } })).toBe(false);
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
