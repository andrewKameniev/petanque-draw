// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount, shallowMount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('firebase/database', () => ({
  get: vi.fn(),
  getDatabase: vi.fn(() => ({})),
  onValue: vi.fn(),
  ref: vi.fn((_db, path) => path),
  remove: vi.fn(() => Promise.resolve()),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
}));

import Tournament from '@/components/Tournament.vue';
import Ranking from '@/components/partials/Ranking.vue';
import { useMainStore } from '@/stores/main';

function finishedSwissTournamentWithPlayoff() {
  return {
    id: 'finished-swiss',
    name: 'Finished Swiss',
    system: 'swiss',
    teams: Array.from({ length: 32 }, (_, index) => ({
      title: `Team ${index + 1}`,
      players: [],
      opponents: [],
      lanes: [],
    })),
    games: [[{ team_1: 'Team 1', team_2: 'Team 2', status: 'finished' }]],
    roundIsActive: false,
    tournamentIsFinished: true,
    preferences: {
      fieldsStart: 1,
      lanesExcluded: '',
      lanesPoolEnabled: false,
      playOffEnabled: true,
      playOffFormat: 'single',
      playOffTeams: 16,
    },
  };
}

function playoffConfig() {
  return {
    barrageTeams: 8,
    cadrageLosersToB: false,
    fieldsStart: 1,
    lanesExcluded: '',
    lanesPoolEnabled: false,
    lanesPoolFrom: 1,
    lanesPoolTo: 1,
    noTimeLimitFinale: false,
    playB: false,
    playOffFormat: 'single',
    playOffTeams: 16,
    playoffTimeLimit: 30,
    withBarrage: false,
    withCadrage: false,
  };
}

describe('reported UI regressions', () => {
  it('keeps the hand-entered team rank in the same visual row as its name', () => {
    const teamsList = readFileSync(resolve('src/components/partials/TeamsList.vue'), 'utf8');

    expect(teamsList).toContain('v-for="(team, teamIndex) in sortedTeams"');
    expect(teamsList).toContain('<span class="team-table-row__rank">{{ teamIndex + 1 }}.</span>');
    expect(teamsList).toContain(':colspan="hasTeamDetails(team) ? 1 : 3"');
    expect(teamsList).toMatch(/\.team-table-row\s*{[\s\S]*?display: flex;[\s\S]*?align-items: center;/);
  });

  it('does not use the keyboard focus halo for a pointer hover', () => {
    const playoffHeader = readFileSync(resolve('src/components/partials/PlayoffHeader.vue'), 'utf8');

    expect(playoffHeader).toMatch(/\.playoff-header__bracket-btn:hover\s*{[^}]*box-shadow: none !important;/);
    expect(playoffHeader).toMatch(
      /\.playoff-header__bracket-btn:focus-visible\s*{[^}]*box-shadow: 0 0 0 3px var\(--color-primary-shadow\) !important;/,
    );
  });

  it('shows the table tab for a playoff-only tournament only after it is finished', () => {
    const context = {
      tournament: { system: 'playoff', tournamentIsFinished: false },
      $t: (key) => key,
    };

    expect(Tournament.computed.tabs.call(context).map((tab) => tab.id)).toEqual([
      'teams',
      'games',
      'results',
      'streams',
    ]);

    context.tournament.tournamentIsFinished = true;

    expect(Tournament.computed.tabs.call(context).map((tab) => tab.id)).toEqual([
      'teams',
      'games',
      'results',
      'ranking',
      'streams',
    ]);
  });

  it('shows only final standings on a finished playoff table', () => {
    const wrapper = mount(Ranking, {
      props: {
        tournament: {
          system: 'playoff',
          tournamentIsFinished: true,
          teams: [{ title: 'Alpha', players: [] }],
          games: [],
          preferences: {},
        },
        rankingTeams: [{ title: 'Alpha', players: [] }],
        activeRound: 1,
        readOnly: true,
      },
      global: {
        plugins: [createPinia()],
        mocks: { $t: (key) => key },
      },
    });

    expect(wrapper.find('#table-finish-ranking').exists()).toBe(true);
    expect(wrapper.find('.ranking-empty').exists()).toBe(false);

    wrapper.unmount();
  });

  it('offers the playoff transition after playoff is enabled for a finished Swiss tournament', () => {
    const pinia = createPinia();
    const store = useMainStore(pinia);
    store.currentTournamentIndex = 'finished-swiss';
    store.tournaments = { 'finished-swiss': finishedSwissTournamentWithPlayoff() };

    const wrapper = shallowMount(Tournament, {
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
      },
    });

    expect(wrapper.find('[data-testid="btn-go-playoff"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('reopens a finished tournament before starting its confirmed playoff', () => {
    const tournament = finishedSwissTournamentWithPlayoff();
    const context = {
      tournament,
      showPlayoffConfirm: true,
      withCadrage: false,
      withBarrage: false,
      playB: false,
      revertFinishTournament: vi.fn(() => {
        tournament.tournamentIsFinished = false;
      }),
      savePreferences: vi.fn(),
      setPlayOffList: vi.fn(),
    };

    Tournament.methods.onPlayoffConfirm.call(context, playoffConfig());

    expect(context.revertFinishTournament).toHaveBeenCalledOnce();
    expect(context.setPlayOffList).toHaveBeenCalledOnce();
    expect(tournament.tournamentIsFinished).toBe(false);
  });
});
