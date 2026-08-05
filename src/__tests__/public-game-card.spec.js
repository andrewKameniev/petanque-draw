import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import PublicGameCard from '@/components/partials/PublicGameCard.vue';
import { getGameLaneNumber } from '@/services/lanes';

const translations = {
  'games.live': 'Live',
  'games.stream': 'Stream',
  'teamPlayoff.matchInProgress': 'In progress',
  'teamPlayoff.matchFinished': 'Finished',
};

function makeTournament(overrides = {}) {
  return {
    preferences: {
      fieldsStart: 1,
      maxScore: 13,
      cochonettesEnabled: false,
      cochonettesEnabledPlayoff: false,
    },
    games: [[]],
    ...overrides,
  };
}

async function renderPublicGame(game, props = {}) {
  const tournament = props.activeTournament || props.tournament || makeTournament();
  const scoreHistoryEnabled = props.scoreHistoryEnabled ?? !!tournament.preferences?.cochonettesEnabled;
  const app = createSSRApp({
    render: () =>
      h(PublicGameCard, {
        game,
        tournament,
        gameIndex: 0,
        laneNumber: getGameLaneNumber(game, tournament, 0),
        scoreHistoryEnabled,
        ...props,
      }),
  });
  app.config.globalProperties.$t = (key) => translations[key] || key;
  return renderToString(app);
}

describe('public game card characterization', () => {
  it('renders upcoming, in-progress, and finished states with the resolved lane', async () => {
    const upcoming = await renderPublicGame({ team_1: 'Alpha', team_2: 'Beta', lane: 4 });
    expect(upcoming).toContain('match-item--upcoming');
    expect(upcoming).toContain('match-score--pending');
    expect(upcoming).toContain('>5</span>');

    const active = await renderPublicGame({
      team_1: 'Alpha',
      team_2: 'Beta',
      team_1_score: 6,
      team_2_score: 4,
      status: 'in_progress',
    });
    expect(active).toContain('match-item--in-progress');
    expect(active).toContain('6 : 4');
    expect(active).toContain('In progress');

    const finished = await renderPublicGame({
      team_1: 'Alpha',
      team_2: 'Beta',
      team_1_score: 13,
      team_2_score: 9,
      status: 'finished',
    });
    expect(finished).toContain('match-item--finished');
    expect(finished).toMatch(/class="[^"]*match-team--winner[^"]*match-team-right/);
    expect(finished).toContain('Finished');
  });

  it('uses numeric score comparison for string scores and leaves missing scores without a winner', async () => {
    const scored = await renderPublicGame({
      team_1: 'Alpha',
      team_2: 'Beta',
      team_1_score: '7',
      team_2_score: '13',
      status: 'finished',
    });
    expect(scored).toMatch(/match-team--winner[^>]*>Beta/);

    const missing = await renderPublicGame({ team_1: 'Alpha', team_2: 'Beta', status: 'finished' });
    expect(missing).not.toContain('match-team--winner');
  });

  it('prefers a valid persisted winner and falls back when the persisted value is invalid', async () => {
    const persisted = await renderPublicGame({
      team_1: 'Alpha',
      team_2: 'Beta',
      team_1_score: 13,
      team_2_score: 4,
      winner: 'Beta',
      status: 'finished',
    });
    expect(persisted).toMatch(/match-team--winner[^>]*>Beta/);

    const fallback = await renderPublicGame({
      team_1: 'Alpha',
      team_2: 'Beta',
      team_1_score: 13,
      team_2_score: 4,
      winner: 'Unknown',
      status: 'finished',
    });
    expect(fallback).toMatch(/match-team--winner[^>]*match-team-right[^>]*>Alpha/);
  });

  it('highlights partial team and club matches without case sensitivity', async () => {
    const byTeam = await renderPublicGame(
      { team_1: 'КРОХА Андрій', team_2: 'Beta' },
      { highlightedTeam: 'кро', teamClubMap: { 'КРОХА Андрій': 'Київ' } },
    );
    expect(byTeam).toContain('match-item--highlighted');
    expect(byTeam).toMatch(/class="[^"]*match-team--highlighted[^"]*match-team-right/);

    const byClub = await renderPublicGame(
      { team_1: 'КРОХА Андрій', team_2: 'Beta' },
      { highlightedTeam: 'КИЇ', teamClubMap: { 'КРОХА Андрій': 'Київ' } },
    );
    expect(byClub).toContain('match-item--highlighted');

    const absentMap = await renderPublicGame({ team_1: 'Alpha', team_2: 'Beta' }, { highlightedTeam: 'club' });
    expect(absentMap).not.toContain('match-item--highlighted');

    const nullSelection = await renderPublicGame({ team_1: 'Alpha', team_2: 'Beta' }, { highlightedTeam: null });
    expect(nullSelection).not.toContain('match-item--highlighted');

    const exactTeam = await renderPublicGame({ team_1: 'Alpha', team_2: 'Beta' }, { highlightedTeam: 'ALPHA' });
    expect(exactTeam).toContain('match-item--highlighted');
  });

  it('renders configured stream links, platform classes, and the live label', async () => {
    const urls = [
      'https://youtube.com/watch?v=1',
      'https://twitch.tv/example',
      'https://facebook.com/live/1',
      'https://instagram.com/example/live',
      'https://stream.example.test/live',
    ];
    const html = await renderPublicGame(
      {
        team_1: 'Alpha',
        team_2: 'Beta',
        status: 'in_progress',
        stream_url: urls[0],
      },
      {
        activeTournament: makeTournament({
          streamPresets: { teams: { Alpha: urls.slice(1) } },
        }),
      },
    );

    for (const url of urls) {
      expect(html).toContain(`href="${url}"`);
    }
    expect(html).toContain('rel="noopener"');
    expect(html).toContain('stream-icon--youtube');
    expect(html).toContain('stream-icon--twitch');
    expect(html).toContain('stream-icon--facebook');
    expect(html).toContain('stream-icon--instagram');
    expect(html).toContain('stream-icon--default');
    expect(html).toContain('Live');
  });

  it('rejects unsafe stream URLs', async () => {
    const html = await renderPublicGame(
      { team_1: 'Alpha', team_2: 'Beta' },
      { streamUrls: ['javascript:alert(1)', 'not a url', 'https://stream.example.test/live'] },
    );
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('not a url');
    expect(html).toContain('https://stream.example.test/live');
  });

  it('shows stream labels for upcoming matches and score history only when enabled and populated', async () => {
    const game = {
      team_1: 'Alpha',
      team_2: 'Beta',
      stream_url: 'https://youtube.com/watch?v=1',
      score_history: [
        { s1: 2, s2: 0 },
        { s1: 2, s2: 3 },
      ],
    };
    const enabled = await renderPublicGame(game, {
      activeTournament: makeTournament({
        preferences: {
          fieldsStart: 1,
          maxScore: 13,
          cochonettesEnabled: true,
          cochonettesEnabledPlayoff: false,
        },
      }),
    });
    expect(enabled).toContain('Stream');
    expect(enabled).not.toContain('match-live-dot');
    expect(enabled).toContain('score-history__chip');
    expect(enabled).toContain('2-0');
    expect(enabled).toContain('2-3');

    const disabled = await renderPublicGame(game);
    expect(disabled).not.toContain('score-history__chip');

    const empty = await renderPublicGame(
      { ...game, score_history: [] },
      {
        activeTournament: makeTournament({
          preferences: { fieldsStart: 1, maxScore: 13, cochonettesEnabled: true },
        }),
      },
    );
    expect(empty).not.toContain('score-history__chip');
  });
});
