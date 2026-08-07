// @vitest-environment jsdom

import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const portalMocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  updatePortalTournament: vi.fn(),
}));

vi.mock('@/services/portal', async (importOriginal) => ({
  ...(await importOriginal()),
  updatePortalTournament: portalMocks.updatePortalTournament,
}));

import QrCode from '@/components/partials/QrCode.vue';

function qrHarness({ portalId = '42', isTestTournament = false } = {}) {
  const tournament = {
    portalIdTournament: portalId,
    preferences: { isTestTournament },
  };

  return {
    ...QrCode,
    data() {
      return { ...QrCode.data(), testTournament: tournament };
    },
    computed: {
      ...QrCode.computed,
      currentTournamentIndex: () => '1784965464060',
      user: () => ({ uid: 'owner-1', email: 'owner@example.com' }),
      currentTournament() {
        return this.testTournament;
      },
      activeTournament() {
        return this.testTournament;
      },
    },
    methods: {
      ...QrCode.methods,
      showMessage: portalMocks.showMessage,
      addCollaborator: vi.fn(),
      removeCollaborator: vi.fn(),
      _getTournamentOwnerUid: () => 'owner-1',
    },
  };
}

function mountQr(options) {
  return shallowMount(qrHarness(options), {
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        Modal: { template: '<div><slot /></div>' },
        QrcodeVue: true,
      },
    },
  });
}

describe('portal public-link action in the QR modal', () => {
  beforeEach(() => {
    portalMocks.showMessage.mockReset();
    portalMocks.updatePortalTournament.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is available only for a non-test tournament imported from the portal', () => {
    const eligible = mountQr();
    expect(eligible.find('[data-testid="btn-send-portal-link"]').exists()).toBe(true);
    eligible.unmount();

    const testTournament = mountQr({ isTestTournament: true });
    expect(testTournament.find('[data-testid="btn-send-portal-link"]').exists()).toBe(false);
    testTournament.unmount();

    const localTournament = mountQr({ portalId: '' });
    expect(localTournament.find('[data-testid="btn-send-portal-link"]').exists()).toBe(false);
    localTournament.unmount();
  });

  it('posts only the mounted tournament ref and reports success', async () => {
    portalMocks.updatePortalTournament.mockResolvedValue({ status: 'ok' });
    const wrapper = mountQr();

    await wrapper.get('[data-testid="btn-send-portal-link"]').trigger('click');
    await flushPromises();

    expect(portalMocks.updatePortalTournament).toHaveBeenCalledWith('42', wrapper.vm.shortRef);
    expect(portalMocks.updatePortalTournament.mock.calls[0][1]).not.toContain('http');
    expect(portalMocks.showMessage).toHaveBeenCalledWith({
      title: 'messages.success',
      text: 'remote.linkSentToPortal',
    });
    wrapper.unmount();
  });

  it('re-enables the action and reports a failed portal request', async () => {
    portalMocks.updatePortalTournament.mockRejectedValue(new Error('Portal failed'));
    const wrapper = mountQr();

    await wrapper.get('[data-testid="btn-send-portal-link"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="btn-send-portal-link"]').attributes('disabled')).toBeUndefined();
    expect(portalMocks.showMessage).toHaveBeenCalledWith({
      title: 'messages.error',
      text: 'remote.linkPortalError',
      type: 'error',
    });
    wrapper.unmount();
  });

  it('explains why localhost cannot send when the portal API token is missing', async () => {
    portalMocks.updatePortalTournament.mockRejectedValue({ code: 'MISSING_TOKEN' });
    const wrapper = mountQr();

    await wrapper.get('[data-testid="btn-send-portal-link"]').trigger('click');
    await flushPromises();

    expect(portalMocks.showMessage).toHaveBeenCalledWith({
      title: 'messages.error',
      text: 'remote.portalTokenMissing',
      type: 'error',
    });
    wrapper.unmount();
  });
});
