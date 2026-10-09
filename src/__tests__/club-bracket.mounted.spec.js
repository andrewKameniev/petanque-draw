// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Bracket from '@/components/partials/Bracket.vue';

function mountBracket(bracket) {
  return mount(Bracket, {
    props: { bracket, embedded: true },
    global: {
      mocks: { $t: (key) => key },
      stubs: { PlayoffHeader: true, BracketFullscreenButton: true },
    },
  });
}

describe('club playoff bracket', () => {
  it('shows live club points and wraps quoted names onto a second line', async () => {
    const game = {
      team_1: 'Петанк клуб «Челлена Сува»',
      team_2: 'Петанк-клуб «Шаркані»',
      team_1_score: null,
      team_2_score: null,
      clubEncounter: { points: [8, 4], status: 'in_progress' },
    };
    const wrapper = mountBracket({ stages: [{ stageLabel: 2, teams: [game] }] });

    expect(wrapper.findAll('text.team-name').map((name) => name.findAll('tspan').map((line) => line.text()))).toEqual([
      ['Петанк клуб', '«Челлена Сува»'],
      ['Петанк-клуб', '«Шаркані»'],
    ]);
    expect(wrapper.findAll('text.team-score').map((score) => score.text())).toEqual(['8', '4']);
    expect(wrapper.find('.team-winner').exists()).toBe(false);

    await wrapper.setProps({
      bracket: { stages: [{ stageLabel: 2, teams: [{ ...game, clubEncounter: { points: [10, 6] } }] }] },
    });
    expect(wrapper.findAll('text.team-score').map((score) => score.text())).toEqual(['10', '6']);
    wrapper.unmount();
  });

  it('keeps ordinary final scores and shows a club technical result', () => {
    const wrapper = mountBracket({
      stages: [
        {
          stageLabel: 2,
          teams: [
            { team_1: 'Alpha', team_2: 'Beta', team_1_score: 13, team_2_score: 7 },
            { team_1: 'Club a', team_2: 'Technical', clubAbsence: 'walkover', team_1_score: 21, team_2_score: 10 },
          ],
        },
      ],
      thirdPlace: {
        team_1: 'ПК «Південь»',
        team_2: 'ПК «Північ»',
        clubEncounter: { points: [5, 3] },
      },
    });

    expect(wrapper.findAll('text.team-score').map((score) => score.text())).toEqual(['13', '7', '21', '10', '5', '3']);
    wrapper.unmount();
  });
});
