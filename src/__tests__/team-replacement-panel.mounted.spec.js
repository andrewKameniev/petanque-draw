// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeamReplacementPanel from '@/components/partials/TeamReplacementPanel.vue';

const { fetchPortalTeams } = vi.hoisted(() => ({ fetchPortalTeams: vi.fn() }));

vi.mock('@/services/portal', () => ({ fetchPortalTeams }));

const portalTeam = {
  id: 3895,
  name: 'КЕЙБАЛО Володимир',
  power: '11.8594',
  players: [
    { id: 738, surname: 'Кейбало', name: 'Володимир' },
    { id: 1393, surname: 'Єрьоменко', name: 'Ірина' },
  ],
};

function mountPanel() {
  return mount(TeamReplacementPanel, {
    props: {
      portalTournamentId: 123,
      teams: [
        { title: 'КЕЙБАЛО Володимир, ЄРЬОМЕНКО Ірина', players: false },
        { title: 'Інша команда', portalTeamId: 55 },
      ],
    },
    global: {
      mocks: {
        $t: (key, params = {}) => `${key}${params.oldTeam ? `:${params.oldTeam}:${params.newTeam}` : ''}`,
      },
      stubs: {
        Modal: { template: '<div><slot /></div>' },
        ConfirmDialog: {
          emits: ['confirm', 'cancel'],
          template: '<button data-testid="confirm-stub" @click="$emit(\'confirm\')">confirm</button>',
        },
      },
    },
  });
}

describe('TeamReplacementPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPortalTeams.mockResolvedValue([portalTeam]);
  });

  it('loads Portal teams, previews the match, and emits only after confirmation', async () => {
    const wrapper = mountPanel();

    await wrapper.get('[data-testid="team-replacement-open"]').trigger('click');
    await wrapper.get('[data-testid="team-replacement-modal"]').trigger('submit');
    await flushPromises();

    expect(fetchPortalTeams).toHaveBeenCalledWith('123');
    await wrapper.get('[data-testid="team-replacement-old-select"]').setValue('КЕЙБАЛО Володимир, ЄРЬОМЕНКО Ірина');
    await wrapper.get('[data-testid="team-replacement-portal-select"]').setValue('0');
    expect(wrapper.get('[data-testid="team-replacement-preview"]').text()).toContain('КЕЙБАЛО Володимир');
    expect(wrapper.emitted('replace')).toBeUndefined();

    await wrapper.get('[data-testid="team-replacement-submit"]').trigger('click');
    await wrapper.get('[data-testid="confirm-stub"]').trigger('click');

    expect(wrapper.emitted('replace')).toEqual([
      [
        {
          oldTitle: 'КЕЙБАЛО Володимир, ЄРЬОМЕНКО Ірина',
          portalTeam,
        },
      ],
    ]);
  });

  it('keeps an already-linked Portal team unavailable for a different source team', async () => {
    fetchPortalTeams.mockResolvedValue([{ ...portalTeam, id: 55, name: 'Another Portal Team' }]);
    const wrapper = mountPanel();

    await wrapper.get('[data-testid="team-replacement-open"]').trigger('click');
    await wrapper.get('[data-testid="team-replacement-modal"]').trigger('submit');
    await flushPromises();

    const option = wrapper.get('[data-testid="team-replacement-portal-select"] option[value="0"]');
    expect(option.attributes('disabled')).toBeDefined();
  });
});
