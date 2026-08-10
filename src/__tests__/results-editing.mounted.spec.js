// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/i18n', () => ({ default: { global: { t: (key) => key } } }));
vi.mock('@/services/db', () => ({
  userMapService: { getAll: vi.fn(), set: vi.fn(), update: vi.fn(), remove: vi.fn() },
  collaboratorService: { add: vi.fn(), remove: vi.fn(), findUserByEmail: vi.fn() },
}));
vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(() => Promise.resolve()),
  onValue: vi.fn(),
}));

const { default: Results } = await import('@/components/partials/Results.vue');
const { useMainStore } = await import('@/stores/main');

const wrappers = [];

describe('Results editing', () => {
  let pinia;
  let store;
  let tournament;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useMainStore();
    tournament = {
      system: 'groups',
      groups: [['A', 'B']],
      teams: [
        { title: 'A', wins: 1, opponents: ['B', 'B'], pointsPlus: 20, pointsMinus: 17 },
        { title: 'B', wins: 1, opponents: ['A', 'A'], pointsPlus: 17, pointsMinus: 20 },
      ],
      games: [
        [
          {
            team_1: 'A',
            team_2: 'B',
            team_1_score: 13,
            team_2_score: 4,
            winner: 'A',
            status: 'finished',
          },
        ],
        [
          {
            team_1: 'A',
            team_2: 'B',
            team_1_score: 7,
            team_2_score: 13,
            winner: 'B',
            status: 'finished',
          },
        ],
      ],
      preferences: {},
    };
    store.user = { uid: 'owner-1' };
    store.currentTournamentIndex = 'multi-circle';
    store.tournaments = { 'multi-circle': tournament };
  });

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.restoreAllMocks();
  });

  it('edits the selected repeated pairing instead of the first matching teams', async () => {
    const recalculateStandings = vi.fn();
    const syncHistoricalResultEdit = vi.fn(() => Promise.resolve());
    const wrapper = shallowMount(
      {
        ...Results,
        methods: {
          ...Results.methods,
          recalculateStandings,
          syncHistoricalResultEdit,
        },
      },
      {
        global: {
          plugins: [pinia],
          mocks: { $t: (key) => key },
        },
      },
    );
    wrappers.push(wrapper);

    expect(wrapper.vm.selectedRound).toBe(1);
    await wrapper.get('.edit-result-btn').trigger('click');
    expect(wrapper.vm.editingGameMeta).toEqual({ roundIndex: 1, gameIndex: 0 });
    await wrapper.vm.saveEditedResult({ score1: 13, score2: 10 });

    expect(tournament.games[0][0]).toEqual(expect.objectContaining({ team_1_score: 13, team_2_score: 4, winner: 'A' }));
    expect(tournament.games[1][0]).toEqual(
      expect.objectContaining({ team_1_score: 13, team_2_score: 10, winner: 'A' }),
    );
    expect(recalculateStandings).toHaveBeenCalledOnce();
    expect(syncHistoricalResultEdit).toHaveBeenCalledWith({ roundIndex: 1, gameIndex: 0 });
  });

  it('keeps the round column compact and labels it consistently in protocol results', () => {
    const wrapper = shallowMount(Results, {
      props: {
        previewTournament: tournament,
        isForProtocol: true,
        onlyQualifying: true,
        teamTitles: { A: 'Alpha', B: 'Beta' },
      },
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
      },
    });
    wrappers.push(wrapper);

    const tables = wrapper.findAll('.protocol-round-results-table');
    expect(tables).toHaveLength(2);
    for (const table of tables) {
      expect(table.attributes('data-docx-column-widths')).toBe('900,3735,2790,3735');
      expect(table.findAll('col').map((column) => column.attributes('style'))).toEqual([
        'width: 8.06%;',
        'width: 33.47%;',
        'width: 25%;',
        'width: 33.47%;',
      ]);
      expect(table.findAll('thead th')).toHaveLength(4);
      expect(table.find('.is-narrow').exists()).toBe(false);
    }
    expect(tables[0].findAll('thead th').map((cell) => cell.text())).toEqual([
      'Раунд',
      'Команда 1',
      'Рахунок',
      'Команда 2',
    ]);
    expect(tables[0].findAll('tbody td').map((cell) => cell.text())).toEqual(['R1', 'Alpha', '13 : 4', 'Beta']);
  });
});
