// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, it } from 'vitest';

import Ranking from '@/components/partials/Ranking.vue';
import { buildDoubleEliminationBracket, recordDoubleEliminationResult } from '@/services/playoff';
import { useMainStore } from '@/stores/main';

const wrappers = [];

const rankingTeams = [
  [
    { title: 'Alpha', wins: 1, pointsPlus: 13, pointsMinus: 7, players: [] },
    { title: 'Bravo', wins: 0, pointsPlus: 7, pointsMinus: 13, players: [] },
  ],
];

const finishedGroupTournament = {
  system: 'groups',
  portalIdTournament: '735',
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

const mountRanking = ({
  readOnly = true,
  tournament = finishedGroupTournament,
  teamsRanking = rankingTeams,
  userEmail = 'ancam1987@gmail.com',
  isForProtocol = false,
  teamTitles = {},
} = {}) => {
  const pinia = createPinia();
  useMainStore(pinia).user = { uid: 'ranking-user', email: userEmail };
  const wrapper = mount(Ranking, {
    props: {
      tournament,
      rankingTeams: teamsRanking,
      activeRound: 2,
      readOnly,
      isForProtocol,
      teamTitles,
    },
    global: {
      plugins: [pinia],
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
  it('renders one export and copy action set for an editable finished ranking', async () => {
    const wrapper = mountRanking({
      readOnly: false,
      tournament: { ...finishedGroupTournament, system: 'supermele', groups: undefined },
    });
    await wrapper.setData({ isTournamentOrg: true });

    const actionButtons = wrapper.findAll('.ranking-header__actions button');

    expect(actionButtons).toHaveLength(2);
    expect(actionButtons.map((button) => button.text())).toEqual(['ranking.exportResults', 'ranking.copyResults']);
  });

  it('renders each double-elimination team once with its final place', () => {
    const teams = Array.from({ length: 10 }, (_, index) => ({ title: `T${index + 1}`, players: [] }));
    const bracket = buildDoubleEliminationBracket(teams.slice(0, 8));
    const finish = (matchId) => recordDoubleEliminationResult(bracket, matchId, 13, 7);
    ['U1M1', 'U1M2', 'U1M3', 'U1M4', 'U2M1', 'U2M2', 'L1M1', 'L1M2'].forEach(finish);
    ['L2M1', 'L2M2', 'U3M1', 'L3M1', 'L4M1', 'GF1'].forEach(finish);

    const wrapper = mountRanking({
      tournament: {
        system: 'playoff',
        tournamentIsFinished: true,
        teams,
        games: [[]],
        playOffBracket: bracket,
        preferences: {},
      },
      teamsRanking: teams,
    });
    const rows = wrapper.findAll('#table-finish-ranking tbody tr');

    expect(rows).toHaveLength(10);
    expect(
      rows.map((row) => {
        const cells = row.findAll('td');
        return [cells[0].text(), cells[1].text()];
      }),
    ).toEqual([
      ['1', 'T1'],
      ['2', 'T8'],
      ['3', 'T3'],
      ['4', 'T6'],
      ['5-6', 'T7'],
      ['5-6', 'T5'],
      ['7-8', 'T4'],
      ['7-8', 'T2'],
      ['9', 'T9'],
      ['10', 'T10'],
    ]);
  });

  it('hides export and copy actions from accounts other than ancam and nemo', async () => {
    const wrapper = mountRanking({ readOnly: false, userEmail: 'viewer@example.com' });
    await wrapper.setData({ isTournamentOrg: true });

    expect(wrapper.find('.ranking-header__actions').exists()).toBe(false);
    expect(wrapper.vm.canUseResultActions).toBe(false);
  });

  it.each(['ancam1987@gmail.com', 'nemo15.alex@gmail.com'])('allows result actions for %s', (userEmail) => {
    const wrapper = mountRanking({ readOnly: false, userEmail });

    expect(wrapper.vm.canUseResultActions).toBe(true);
  });

  it('marks the Swiss protocol table for a compact ordinal column', () => {
    const swissTeams = [
      {
        title: 'Alpha',
        gamesPlayed: 1,
        wins: 1,
        buhgolts: 0,
        smallBuhgolts: 0,
        pointsPlus: 13,
        pointsMinus: 7,
      },
    ];
    const wrapper = mountRanking({
      tournament: {
        system: 'swiss',
        tournamentIsFinished: true,
        teams: swissTeams,
        games: [[]],
        preferences: {},
      },
      teamsRanking: swissTeams,
      isForProtocol: true,
      teamTitles: { Alpha: 'Alpha' },
    });

    const table = wrapper.get('.protocol-swiss-ranking-table');
    expect(table.get('thead th').text()).toBe('#');
    expect(table.get('tbody td').text()).toBe('1');
  });
});
