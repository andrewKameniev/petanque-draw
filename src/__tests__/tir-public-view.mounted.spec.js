// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TirPublicView from '@/components/tir/TirPublicView.vue';

describe('TirPublicView', () => {
  it('renders participant-controlled playoff names as literal text', () => {
    const player1 = '<strong data-audit="name">Audit</strong>';
    const player2 = '<img data-audit="avatar" src="x"> Player';
    const wrapper = shallowMount(TirPublicView, {
      props: {
        tournament: {
          tirConfig: { rounds: 1 },
          tirParticipants: [],
          tirPlayoff: {
            size: 2,
            rounds: [
              {
                matches: [
                  {
                    player1,
                    player2,
                    score1: null,
                    score2: null,
                  },
                ],
              },
            ],
          },
        },
      },
      global: {
        mocks: { $t: (key) => key },
      },
    });

    const names = wrapper.findAll('.tir-playoff__player-name');

    expect(names).toHaveLength(2);
    expect(names[0].text()).toBe(player1);
    expect(names[1].text()).toBe(player2);
    expect(names.every((name) => name.findAll('.tir-playoff__name-part').length === 2)).toBe(true);
    expect(wrapper.find('[data-audit="name"]').exists()).toBe(false);
    expect(wrapper.find('[data-audit="avatar"]').exists()).toBe(false);

    wrapper.unmount();
  });
});
