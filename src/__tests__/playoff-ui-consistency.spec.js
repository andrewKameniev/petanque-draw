import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

let Bracket;
let DoubleElimination;
let Game;
let PlayOff;
let PlayoffMatchPanel;

beforeAll(async () => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  });
  [
    { default: Bracket },
    { default: DoubleElimination },
    { default: Game },
    { default: PlayOff },
    { default: PlayoffMatchPanel },
  ] = await Promise.all([
    import('@/components/partials/Bracket.vue'),
    import('@/components/partials/DoubleElimination.vue'),
    import('@/components/partials/Game.vue'),
    import('@/components/partials/PlayOff.vue'),
    import('@/components/partials/PlayoffMatchPanel.vue'),
  ]);
});

describe('playoff UI consistency', () => {
  it('uses the shared match panel for both elimination formats', () => {
    expect(PlayOff.components.PlayoffMatchPanel).toBe(PlayoffMatchPanel);
    expect(DoubleElimination.components.PlayoffMatchPanel).toBe(PlayoffMatchPanel);
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
