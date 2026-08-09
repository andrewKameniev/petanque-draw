// @vitest-environment jsdom

import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase', () => ({ auth: {}, database: {} }));
vi.mock('@/services/live-tournament', () => ({
  createLiveTournamentSource: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

import Ranking from '@/components/partials/Ranking.vue';
import TeamPlayoff from '@/components/partials/TeamPlayoff.vue';
import { tournamentOrgsService } from '@/services/db';
import { useMainStore } from '@/stores/main';
import Public from '@/views/Public.vue';

const wrappers = new Set();

const publicTournament = {
  id: 'public-team-playoff',
  name: 'Public Cup',
  system: 'swiss',
  tournamentIsStarted: true,
  tournamentIsFinished: false,
  roundIsActive: false,
  games: [],
  teams: [{ title: 'Public Alpha' }, { title: 'Public Bravo' }],
  preferences: { maxScore: 13 },
  teamPlayoff: {
    size: 2,
    rounds: [
      {
        matches: [
          {
            team1: 'Public Alpha',
            team2: 'Public Bravo',
            team1Score: null,
            team2Score: null,
            status: 'not_started',
            winner: null,
          },
        ],
      },
    ],
  },
};

const finishedTournament = {
  system: 'supermele',
  portalIdTournament: '735',
  tournamentIsFinished: true,
  teams: [
    { title: 'Alpha', wins: 1, pointsPlus: 13, pointsMinus: 7, players: [] },
    { title: 'Bravo', wins: 0, pointsPlus: 7, pointsMinus: 13, players: [] },
  ],
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

function track(wrapper) {
  wrappers.add(wrapper);
  return wrapper;
}

function unmount(wrapper) {
  wrapper.unmount();
  wrappers.delete(wrapper);
}

function mountTeamPlayoff({ readOnly, activeTournament = null } = {}) {
  const pinia = createPinia();
  const store = useMainStore(pinia);
  store.tournaments.editor = {
    ...publicTournament,
    id: 'editor-team-playoff',
    teamPlayoff: {
      ...publicTournament.teamPlayoff,
      rounds: [
        {
          matches: [
            {
              ...publicTournament.teamPlayoff.rounds[0].matches[0],
              team1: 'Editor Alpha',
              team2: 'Editor Bravo',
            },
          ],
        },
      ],
    },
  };
  store.currentTournamentIndex = 'editor';
  const subscribe = vi.spyOn(store, 'subscribeTournament').mockImplementation(() => {});
  const unsubscribe = vi.spyOn(store, 'unsubscribeTournament').mockImplementation(() => {});

  const wrapper = track(
    mount(TeamPlayoff, {
      props: { readOnly, activeTournament },
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
      },
    }),
  );

  return { wrapper, subscribe, unsubscribe };
}

function mountRanking({ readOnly, userEmail = 'ancam1987@gmail.com' } = {}) {
  const pinia = createPinia();
  useMainStore(pinia).user = { uid: 'ranking-user', email: userEmail };
  return track(
    mount(Ranking, {
      props: {
        tournament: finishedTournament,
        rankingTeams: [finishedTournament.teams],
        activeRound: 2,
        readOnly,
      },
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
      },
    }),
  );
}

beforeEach(() => {
  vi.spyOn(tournamentOrgsService, 'check').mockResolvedValue({ exists: () => true });
});

afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount();
  wrappers.clear();
  vi.restoreAllMocks();
});

describe('public Team Playoff', () => {
  it('passes the selected public tournament into the read-only bracket', () => {
    const wrapper = track(
      shallowMount(Public, {
        data: () => ({ tournament: publicTournament, activeTab: 'round' }),
        global: {
          mocks: {
            $route: { fullPath: '/tournament?ref=owner.2n9c', query: { ref: 'owner.2n9c' } },
            $t: (key) => key,
            $i18n: { locale: 'en' },
          },
          stubs: {
            PublicPageShell: { template: '<main><slot /></main>' },
            RouterLink: { template: '<a><slot /></a>' },
          },
        },
      }),
    );

    const bracket = wrapper.getComponent(TeamPlayoff);
    expect(bracket.props('readOnly')).toBe(true);
    expect(bracket.props('activeTournament')).toEqual(publicTournament);
  });

  it('renders live external state without attaching or detaching editor listeners in read-only mode', async () => {
    const { wrapper, subscribe, unsubscribe } = mountTeamPlayoff({
      readOnly: true,
      activeTournament: publicTournament,
    });

    expect(wrapper.text()).toContain('Public Alpha');
    expect(wrapper.text()).toContain('Public Bravo');
    expect(wrapper.text()).not.toContain('Editor Alpha');
    expect(subscribe).not.toHaveBeenCalled();

    await wrapper.setProps({
      activeTournament: {
        ...publicTournament,
        teamPlayoff: {
          ...publicTournament.teamPlayoff,
          rounds: [
            {
              matches: [
                {
                  ...publicTournament.teamPlayoff.rounds[0].matches[0],
                  team1: 'Live Public Alpha',
                },
              ],
            },
          ],
        },
      },
    });
    expect(wrapper.text()).toContain('Live Public Alpha');
    expect(subscribe).not.toHaveBeenCalled();

    unmount(wrapper);
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it('retains editor subscription lifecycle in editable mode', () => {
    const { wrapper, subscribe, unsubscribe } = mountTeamPlayoff({ readOnly: false });

    expect(wrapper.text()).toContain('Editor Alpha');
    expect(subscribe).toHaveBeenCalledTimes(1);

    unmount(wrapper);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('read-only Ranking account traffic', () => {
  it('does not look up organizer access, including after remount', async () => {
    const first = mountRanking({ readOnly: true });
    await flushPromises();
    unmount(first);

    mountRanking({ readOnly: true });
    await flushPromises();

    expect(tournamentOrgsService.check).not.toHaveBeenCalled();
  });

  it('skips organizer access when the editable account has no result capability', async () => {
    mountRanking({ readOnly: false, userEmail: 'viewer@example.com' });
    await flushPromises();

    expect(tournamentOrgsService.check).not.toHaveBeenCalled();
  });

  it('retains organizer access lookup for an editable result account', async () => {
    const wrapper = mountRanking({ readOnly: false });
    await flushPromises();

    expect(tournamentOrgsService.check).toHaveBeenCalledOnce();
    expect(tournamentOrgsService.check).toHaveBeenCalledWith('ancam1987@gmail.com');
    expect(wrapper.vm.isTournamentOrg).toBe(true);
  });
});
