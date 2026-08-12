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

const downloadQr = vi.fn();

const QrcodeVueStub = {
  name: 'QrcodeVue',
  props: {
    value: String,
    size: Number,
    level: String,
    margin: Number,
    renderAs: String,
  },
  methods: { download: downloadQr },
  template: '<svg data-testid="tournament-qr" />',
};

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
        QrcodeVue: QrcodeVueStub,
      },
    },
  });
}

describe('portal public-link action in the QR modal', () => {
  beforeEach(() => {
    downloadQr.mockReset();
    portalMocks.showMessage.mockReset();
    portalMocks.updatePortalTournament.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a lower-density vector QR with the required quiet zone', () => {
    const wrapper = mountQr();
    const qr = wrapper.getComponent(QrcodeVueStub);

    expect(qr.props()).toMatchObject({
      value: wrapper.vm.tournamentLink,
      level: 'M',
      margin: 4,
      renderAs: 'svg',
    });
    expect(wrapper.text()).toContain('remote.qrPrintHint');
    wrapper.unmount();
  });

  it('downloads the print-safe QR as an SVG', async () => {
    const wrapper = mountQr();

    await wrapper.get('[data-testid="btn-download-qr-svg"]').trigger('click');

    expect(downloadQr).toHaveBeenCalledWith('tournament-1784965464060-qr.svg');
    wrapper.unmount();
  });

  it('provides print guidance in every supported locale', async () => {
    const locales = await Promise.all([
      import('@/locales/en'),
      import('@/locales/es'),
      import('@/locales/fr'),
      import('@/locales/ua'),
    ]);

    for (const locale of locales) {
      expect(locale.default.remote.downloadQrSvg).toBeTruthy();
      expect(locale.default.remote.qrPrintHint).toBeTruthy();
    }
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
