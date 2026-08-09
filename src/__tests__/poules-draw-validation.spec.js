// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
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
import SetupCard from '@/components/partials/SetupCard.vue';

function makeTeam(index) {
  return {
    title: `Team ${index + 1}`,
    rating: 0,
    players: [],
  };
}

function makeTournament(teamCount) {
  return {
    teams: Array.from({ length: teamCount }, (_, index) => makeTeam(index)),
    system: 'poules',
    useRating: false,
    preferences: {
      fieldsStart: 1,
      groupFormat: 'round_robin',
      lanesExcluded: '',
      lanesPoolEnabled: false,
      playOffFormat: 'single',
      playOffTeams: 4,
      swissRoundsCount: 3,
    },
  };
}

describe('Poules setup validation', () => {
  it('keeps the selected setup visible and emits draw after the count becomes invalid', async () => {
    const tournament = makeTournament(8);
    const wrapper = shallowMount(SetupCard, {
      props: { tournament },
      global: { mocks: { $t: (key) => key } },
    });

    expect(wrapper.find('[data-testid="radio-system-poules"]').exists()).toBe(true);

    await wrapper.setProps({ tournament: { ...tournament, teams: [...tournament.teams, makeTeam(8)] } });

    expect(wrapper.find('[data-testid="radio-system-poules"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('setup.poulesHint');
    expect(wrapper.get('[data-testid="btn-draw-first-round"]').attributes('disabled')).toBeUndefined();

    await wrapper.get('[data-testid="btn-draw-first-round"]').trigger('click');

    expect(wrapper.emitted('draw')).toHaveLength(1);
    wrapper.unmount();
  });

  it('leaves the setup unchanged and shows an actionable error at the draw boundary', () => {
    const tournament = makeTournament(9);
    const originalTournament = JSON.parse(JSON.stringify(tournament));
    const context = {
      tournament,
      $t: (key) => key,
      showMessage: vi.fn(),
      addRoundToGames: vi.fn(),
      syncTournamentStarted: vi.fn(),
      syncDrawStart: vi.fn(),
    };

    Tournament.methods.drawFirstRound.call(context);

    expect(context.showMessage).toHaveBeenCalledWith({
      title: 'messages.cantDraw',
      text: 'setup.poulesHint',
      type: 'error',
    });
    expect(tournament).toEqual(originalTournament);
    expect(context.addRoundToGames).not.toHaveBeenCalled();
    expect(context.syncTournamentStarted).not.toHaveBeenCalled();
    expect(context.syncDrawStart).not.toHaveBeenCalled();
  });
});
