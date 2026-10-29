// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/stores/main', () => ({ useMainStore: () => ({ showMessage: vi.fn() }) }));
vi.mock('@/services/db', () => ({ statsPlayerIdentityService: { save: vi.fn().mockResolvedValue() } }));

const { default: StatsAnalysis } = await import('@/components/stats/StatsAnalysis.vue');
const { default: StatsPlayerMerge } = await import('@/components/stats/StatsPlayerMerge.vue');
const { statsPlayerIdentityService } = await import('@/services/db');

const wrappers = [];

beforeAll(() => {
  globalThis.CSS ||= {};
  globalThis.CSS.escape ||= (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
  globalThis.Element.prototype.scrollIntoView ||= vi.fn();
});

function mountStats(component, props) {
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: {
      mocks: { $t: (key) => key },
      stubs: { VueDatePicker: true, apexchart: true },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.clearAllMocks();
});

describe('statistics select controls', () => {
  it('selects a player and updates the analysis', async () => {
    const stats = {
      1000: {
        team1: { players: [{ name: 'Jonathan Doe', portalPlayerId: '42', stat: [] }] },
        team2: { players: [] },
      },
    };
    const wrapper = mountStats(StatsAnalysis, { stats, tags: {}, identities: {} });

    await wrapper.get('[data-select-trigger]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-select-option]').text()).toContain('Jonathan Doe');

    await wrapper.get('[data-select-option]').trigger('click');
    await nextTick();
    expect(wrapper.vm.player).toBe('portal:42');
    expect(wrapper.vm.playerStatList).toHaveLength(1);
  });

  it('selects a legacy alias and saves it for the chosen portal player', async () => {
    const stats = {
      1000: {
        team1: { players: [{ name: 'Jonathan Doe', portalPlayerId: '42' }] },
        team2: { players: [{ name: 'Johnny Doe' }] },
      },
    };
    const identities = { 42: { portalPlayerId: '42', name: 'Jonathan Doe', aliases: [] } };
    const wrapper = mountStats(StatsPlayerMerge, { stats, identities, userId: 'user-1' });

    await wrapper.get('[data-select-trigger]').trigger('click');
    await nextTick();
    expect(wrapper.get('[data-select-option]').text()).toContain('Johnny Doe');

    await wrapper.get('[data-select-option]').trigger('click');
    await nextTick();
    expect(wrapper.vm.selectedAliases).toEqual(['Johnny Doe']);
    expect(wrapper.get('[data-select-tag]').text()).toContain('Johnny Doe');

    await wrapper.get('.player-merge__save').trigger('click');
    expect(statsPlayerIdentityService.save).toHaveBeenCalledWith('user-1', '42', {
      portalPlayerId: '42',
      name: 'Jonathan Doe',
      aliases: ['Johnny Doe'],
    });
  });
});
