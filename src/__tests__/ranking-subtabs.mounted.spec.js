// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, it } from 'vitest';

import Ranking from '@/components/partials/Ranking.vue';

const wrappers = [];

const rankingTeams = [
  [
    { title: 'Alpha', wins: 1, pointsPlus: 13, pointsMinus: 7, players: [] },
    { title: 'Bravo', wins: 0, pointsPlus: 7, pointsMinus: 13, players: [] },
  ],
];

const finishedGroupTournament = {
  system: 'groups',
  tournamentIsFinished: true,
  teams: rankingTeams[0],
  groups: [['Alpha', 'Bravo']],
  games: [
    [
      {
        team_1: 'Alpha',
        team_2: 'Bravo',
        team_1_score: 13,
        team_2_score: 7,
        status: 'finished',
      },
    ],
  ],
  preferences: {},
};

const mountRanking = () => {
  const wrapper = mount(Ranking, {
    props: {
      tournament: finishedGroupTournament,
      rankingTeams,
      activeRound: 2,
      readOnly: true,
    },
    global: {
      plugins: [createPinia()],
      mocks: { $t: (key) => key },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
};

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
});

describe('Ranking finished-tournament table selection', () => {
  it('keeps final standings and the group ranking behind separate controls', async () => {
    const wrapper = mountRanking();
    const controls = wrapper.findAll('.ranking-subtabs button');

    expect(controls).toHaveLength(2);
    expect(controls.map((button) => button.text())).toEqual(['ranking.tournamentResult', 'ranking.ranking']);
    expect(controls.map((button) => button.attributes('type'))).toEqual(['button', 'button']);
    expect(controls.map((button) => button.attributes('aria-pressed'))).toEqual(['true', 'false']);
    expect(wrapper.find('#table-finish-ranking').exists()).toBe(true);
    expect(wrapper.find('.group-ranking-table').exists()).toBe(false);

    await controls[1].trigger('click');

    expect(wrapper.find('#table-finish-ranking').exists()).toBe(false);
    expect(wrapper.find('.group-ranking-table').exists()).toBe(true);
    expect(controls.map((button) => button.attributes('aria-pressed'))).toEqual(['false', 'true']);
  });
});
