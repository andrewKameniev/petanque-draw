import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

let Bracket;
let BracketFullscreenButton;
let DoubleElimination;
let Game;
let PlayOff;
let PlayoffHeader;
let PlayoffMatchPanel;

beforeAll(async () => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  });
  [
    { default: Bracket },
    { default: BracketFullscreenButton },
    { default: DoubleElimination },
    { default: Game },
    { default: PlayOff },
    { default: PlayoffHeader },
    { default: PlayoffMatchPanel },
  ] = await Promise.all([
    import('@/components/partials/Bracket.vue'),
    import('@/components/partials/BracketFullscreenButton.vue'),
    import('@/components/partials/DoubleElimination.vue'),
    import('@/components/partials/Game.vue'),
    import('@/components/partials/PlayOff.vue'),
    import('@/components/partials/PlayoffHeader.vue'),
    import('@/components/partials/PlayoffMatchPanel.vue'),
  ]);
});

describe('playoff UI consistency', () => {
  it('uses the shared match panel for both elimination formats', () => {
    const panelView = readFileSync(new URL('../components/partials/PlayoffMatchPanel.vue', import.meta.url), 'utf8');

    expect(PlayOff.components.PlayoffMatchPanel).toBe(PlayoffMatchPanel);
    expect(DoubleElimination.components.PlayoffMatchPanel).toBe(PlayoffMatchPanel);
    expect(panelView).toContain('background: var(--color-surface);');
    expect(panelView).not.toContain('background: var(--color-primary-bg);');
  });

  it('normalizes a single-elimination round and third-place match for the shared panel', () => {
    const round = {
      teams: [
        { id: 'semi-1', team_1: 'A', team_2: 'B' },
        { id: 'semi-2', team_1: 'C', team_2: 'D' },
      ],
    };
    const context = {
      currentPlayOffBracketIndex: 0,
      currentStageLaneOrder: [3, 1],
      currentStageTitle: '1/2 final',
      playOffStageCurrent: 1,
      playOffBracket: {
        stages: [round],
        thirdPlace: { id: 'third', team_1: 'B', team_2: 'D' },
      },
      tournament: { playOff: [{}, {}] },
      $t: (key) => key,
    };

    const stages = PlayOff.computed.singlePanelStages.call(context);

    expect(stages[0].matches).toEqual([
      expect.objectContaining({ gameIndex: 0, laneNumber: 3 }),
      expect.objectContaining({ gameIndex: 1, laneNumber: 1 }),
    ]);
    expect(stages[1]).toEqual(
      expect.objectContaining({
        id: 'single-third-place',
        label: 'games.thirdPlace',
        matches: [expect.objectContaining({ isThird: true })],
      }),
    );
  });

  it('offers the shared bracket tab for a single-elimination public tournament', () => {
    const publicView = readFileSync(new URL('../views/Public.vue', import.meta.url), 'utf8');

    expect(publicView).toContain('if (this.hasPlayoffBracket)');
    expect(publicView).toContain("activeTab === 'bracket' && hasPlayoffBracket");
    expect(publicView).toContain(':embedded="true"');
    expect(publicView).not.toContain('btn-bracket-group');
    expect(Bracket.props.embedded.default).toBe(false);
  });

  it('shares the public bracket header and fullscreen control across elimination formats', () => {
    const bracketView = readFileSync(new URL('../components/partials/Bracket.vue', import.meta.url), 'utf8');
    const doubleView = readFileSync(new URL('../components/partials/DoubleElimination.vue', import.meta.url), 'utf8');

    expect(Bracket.components.PlayoffHeader).toBe(PlayoffHeader);
    expect(Bracket.components.BracketFullscreenButton).toBe(BracketFullscreenButton);
    expect(DoubleElimination.components.BracketFullscreenButton).toBe(BracketFullscreenButton);
    expect(bracketView).toContain('data-testid="toggle-single-elimination-fullscreen"');
    expect(bracketView).toContain('{{ singleMatchId(si, gi) }}');
    expect(bracketView).toMatch(/\.bracket-modal--embedded\s*{[\s\S]*?border: 1px solid var\(--color-border\);/);
    expect(doubleView).toMatch(/\.double-elimination__match--pending,[\s\S]*?background: var\(--color-surface-alt\);/);
  });

  it('labels unresolved single-elimination teams by their source match', () => {
    const context = {
      $t: (key) =>
        ({
          'doubleElimination.pending': 'Pending',
          'doubleElimination.winnerOf': 'Winner',
          'games.exempt': 'Bye',
        })[key],
      singleMatchId: Bracket.methods.singleMatchId,
    };

    expect(Bracket.methods.teamLabel.call(context, {}, 0, 0, 1)).toBe('Pending');
    expect(Bracket.methods.teamLabel.call(context, {}, 1, 0, 1)).toBe('Winner P1M1');
    expect(Bracket.methods.teamLabel.call(context, {}, 1, 0, 2)).toBe('Winner P1M2');
  });

  it('removes the single-elimination stage wrapper box on mobile', () => {
    const playoffView = readFileSync(new URL('../components/partials/PlayOff.vue', import.meta.url), 'utf8');

    expect(playoffView).toMatch(/\.play-off-stage-wrapper\s*{\s*display: contents;/);
    expect(playoffView).toMatch(/display: contents;\s*padding-right: 0;\s*padding-left: 0;/);
  });

  it('keeps partial team and club highlighting in the shared public card', () => {
    expect(
      Game.methods.isPublicTeamHighlighted.call(
        { highlightedTeam: 'кро', teamClubMap: { 'КРОХА Андрій': 'Київ' } },
        'КРОХА Андрій',
      ),
    ).toBe(true);
    expect(
      Game.methods.isPublicTeamHighlighted.call(
        { highlightedTeam: 'киї', teamClubMap: { 'КРОХА Андрій': 'Київ' } },
        'КРОХА Андрій',
      ),
    ).toBe(true);
  });

  it('keeps every public match card on one shared stylesheet', () => {
    const gameView = readFileSync(new URL('../components/partials/Game.vue', import.meta.url), 'utf8');
    const publicView = readFileSync(new URL('../views/Public.vue', import.meta.url), 'utf8');
    const cardStyles = readFileSync(new URL('../assets/css/public-game-card.css', import.meta.url), 'utf8');

    expect(gameView).not.toContain('.public-game-card .match-lane-left--finished');
    expect(publicView).not.toContain('.match-lane-left--finished {');
    expect(publicView.match(/class="match-item public-game-card"/g)).toHaveLength(3);
    expect(cardStyles).toContain('.public-game-card .match-lane-left--finished');
    expect(cardStyles).not.toContain('background: var(--color-success)');
  });
});
