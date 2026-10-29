// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SetupCard from '@/components/partials/SetupCard.vue';
import { makeClub, makeClubTournament } from '../../tests/fixtures/club-competition';

describe('club system setup', () => {
  it('offers Swiss rounds only when Swiss can be selected', async () => {
    const tournament = {
      ...makeClubTournament(),
      system: 'swiss',
      teams: Array.from({ length: 4 }, (_, index) => makeClub(String(index))),
    };
    const wrapper = shallowMount(SetupCard, {
      props: { tournament },
      global: { mocks: { $t: (key) => key } },
    });

    expect(wrapper.find('[data-testid="radio-system-swiss"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('modals.swissRoundsCount');

    await wrapper.setProps({ tournament: { ...tournament, teams: [...tournament.teams, makeClub('fifth')] } });
    expect(wrapper.find('[data-testid="radio-system-swiss"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('modals.swissRoundsCount');
    wrapper.unmount();
  });
});
