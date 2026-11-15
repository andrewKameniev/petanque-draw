// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PlayOff from '@/components/partials/PlayOff.vue';
import TeamSearch from '@/components/partials/TeamSearch.vue';

vi.mock('@/stores/main', () => ({ useMainStore: () => ({ isOwnerOrAdmin: false }) }));

const club = 'Карпатська Спортивна Ліга';
const player = 'КРОХА Андрій';

describe('court finder', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(TeamSearch, {
      attachTo: document.body,
      props: { teams: [player, 'РОЖОК Олександр'], teamClubMap: { [player]: club } },
      global: { mocks: { $t: (key) => key } },
    });
    const dialog = wrapper.get('dialog').element;
    dialog.showModal = vi.fn(() => (dialog.open = true));
    dialog.close = vi.fn(() => (dialog.open = false));
  });

  afterEach(() => wrapper.unmount());

  it('opens a labeled dialog and allows keyboard selection and clearing', async () => {
    const trigger = wrapper.get('button[aria-haspopup="dialog"]');
    await trigger.trigger('click');
    expect(trigger.text()).toBe('teams.findCourt');
    expect(wrapper.get('dialog').element.open).toBe(true);

    const input = wrapper.get('input[type="search"]');
    await input.setValue('  кроха ');
    await input.trigger('keydown.enter');
    expect(wrapper.emitted('update:modelValue')).toEqual([[player]]);
    expect(wrapper.get('dialog').element.open).toBe(false);

    await wrapper.setProps({ modelValue: player });
    expect(trigger.text()).toBe(player);
    expect(trigger.attributes('aria-label')).toContain('teams.findCourt');
    await wrapper.get('.team-search-clear').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[player], [null]]);
  });

  it('keeps an empty search open and lets users pick a club or cancel', async () => {
    await wrapper.get('.team-search-btn').trigger('click');
    const input = wrapper.get('input[type="search"]');
    await input.setValue('xyz');
    await input.trigger('keydown.enter');
    expect(wrapper.get('dialog').element.open).toBe(true);
    expect(wrapper.get('dialog').text()).toContain('teams.noResults');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await input.setValue('карпатська');
    await wrapper
      .findAll('dialog li button')
      .find((button) => button.text() === club)
      .trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[club]]);

    await wrapper.get('.team-search-btn').trigger('click');
    expect(wrapper.get('input[type="search"]').element.value).toBe('');
    await wrapper.get('dialog').trigger('cancel');
    expect(wrapper.get('dialog').element.open).toBe(false);
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
  });

  it('shows short club names and logos while selecting the original club name', async () => {
    const fullName = 'Громадська Організація «Спортивний клуб «Сталеві вовки»»';
    const logo = 'https://example.com/club.png';
    await wrapper.setProps({
      teamClubMap: { [player]: fullName },
      tournamentTeams: [{ players: [{ club: fullName }, { club: fullName, club_logo_url: logo }] }],
    });
    await wrapper.get('.team-search-btn').trigger('click');
    const button = wrapper.get(`button[aria-label="${fullName}"]`);
    expect(button.text()).toBe('Сталеві вовки');
    expect(button.get('img').attributes('src')).toBe(logo);
    await button.get('img').trigger('error');
    expect(button.find('img').exists()).toBe(false);
    expect(button.find('svg').exists()).toBe(true);
    await button.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[fullName]]);
    await wrapper.setProps({ modelValue: fullName });
    expect(wrapper.get('.team-search-btn').text()).toBe('Сталеві вовки');
  });

  it('keeps full club names when shortened names collide', async () => {
    const names = ['ГО «Спортивний клуб «Лідер»»', 'ГО «Лідер»'];
    await wrapper.setProps({ teamClubMap: { [player]: names[0], 'РОЖОК Олександр': names[1] } });
    await wrapper.get('.team-search-btn').trigger('click');
    for (const name of names) expect(wrapper.get(`button[aria-label="${name}"]`).text()).toBe(name);
  });

  it.each(['Зелені леви', 'Кошовий', 'Незламні. Наша грає', 'Сталеві Лицарі'])(
    'shortens the sports petanque club prefix for %s',
    async (name) => {
      const fullName = `Спортивний петанк-клуб «${name}»`;
      await wrapper.setProps({ teamClubMap: { [player]: fullName } });
      await wrapper.get('.team-search-btn').trigger('click');
      const button = wrapper.get(`button[aria-label="${fullName}"]`);
      expect(button.text()).toBe(name);
      await button.trigger('click');
      expect(wrapper.emitted('update:modelValue')).toEqual([[fullName]]);
    },
  );
});

it('shows the finder in the quarterfinal and clears it for the semifinal and final', async () => {
  const game = { team_1: player, team_2: 'РОЖОК Олександр' };
  const tournament = {
    preferences: {},
    playOff: [game],
    playOffStage: 4,
    playOffBracket: { stages: [4, 2, 1].map((stageLabel) => ({ stageLabel, teams: [game] })) },
  };
  const playoff = mount(PlayOff, {
    props: { activeTournament: tournament, isPublicView: true, hideHeader: true },
    global: { mocks: { $t: (key) => key }, stubs: { Game: true } },
  });

  try {
    playoff.getComponent(TeamSearch).vm.$emit('update:modelValue', player);
    await playoff.vm.$nextTick();
    expect(playoff.get('.team-search-btn').text()).toBe(player);
    expect(playoff.find('.game--highlighted').exists()).toBe(true);

    for (const playOffStage of [2, 1]) {
      await playoff.setProps({ activeTournament: { ...tournament, playOffStage } });
      expect(playoff.find('.team-search-btn').exists()).toBe(false);
      expect(playoff.find('.game--highlighted').exists()).toBe(false);
    }

    await playoff.setProps({ activeTournament: tournament });
    expect(playoff.get('.team-search-btn').text()).toBe('teams.findCourt');
  } finally {
    playoff.unmount();
  }
});
