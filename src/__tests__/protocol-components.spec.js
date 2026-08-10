import { beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({
  registryGet: vi.fn(),
  registrySave: vi.fn(),
  presetsGetAll: vi.fn(),
  presetSave: vi.fn(),
  presetRemove: vi.fn(),
  fetchRegistry: vi.fn(),
  downloadDocx: vi.fn(),
  exportPdf: vi.fn(),
  tournamentSubscribe: vi.fn(),
}));

vi.mock('@/services/db', () => ({
  arbiterRegistryService: {
    get: serviceMocks.registryGet,
    save: serviceMocks.registrySave,
  },
  arbiterPresetService: {
    getAll: serviceMocks.presetsGetAll,
    save: serviceMocks.presetSave,
    remove: serviceMocks.presetRemove,
  },
  tournamentService: {
    subscribe: serviceMocks.tournamentSubscribe,
    updatePath: vi.fn(),
  },
}));

vi.mock('@/services/arbiter-registry', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchArbiterRegistryFromSheet: serviceMocks.fetchRegistry,
}));

vi.mock('@/services/protocol-docx', () => ({
  downloadProtocolDocx: serviceMocks.downloadDocx,
}));

vi.mock('@/services/protocol-runtime', async (importOriginal) => ({
  ...(await importOriginal()),
  exportProtocolPdf: serviceMocks.exportPdf,
}));

vi.mock('@/stores/main', () => ({ useMainStore: vi.fn() }));
vi.mock('@/components/Modal', () => ({ default: {} }));
vi.mock('@/components/partials/Results', () => ({ default: {} }));
vi.mock('@/components/partials/Ranking', () => ({ default: {} }));
vi.mock('@/components/partials/TeamsList', () => ({ default: {} }));
vi.mock('@/components/partials/PlayOff.vue', () => ({ default: {} }));
vi.mock('@/components/partials/TeamPlayoff.vue', () => ({ default: {} }));
vi.mock('@/components/partials/Cadrage.vue', () => ({ default: {} }));
vi.mock('@/components/tir/TirPublicView.vue', () => ({ default: {} }));
vi.mock('@/components/partials/Footer.vue', () => ({ default: {} }));
vi.mock('@/components/Navbar.vue', () => ({ default: {} }));
vi.mock('@/components/Menu.vue', () => ({ default: {} }));

import Protocol from '@/components/partials/Protocol.vue';
import ProtocolArbiterControls from '@/components/partials/ProtocolArbiterControls.vue';
import AddTeam from '@/components/partials/AddTeam.vue';
import TirProtocol from '@/components/tir/TirProtocol.vue';
import Archived from '@/views/Archived.vue';

const arbiterMethods = ProtocolArbiterControls.methods;
const protocolMethods = Protocol.methods;
const tirProtocolMethods = TirProtocol.methods;

describe('Portal team import', () => {
  it('stores the coach supplied with a Portal team', () => {
    const coach = { id: 55, name: 'Іван', surname: 'Петренко', second_name: '' };
    const context = {
      tournament: { teams: [] },
      addTeamToStore: vi.fn(),
      syncTeams: vi.fn(),
      showMessage: vi.fn(),
      teamTitle: null,
      teamRating: null,
    };

    AddTeam.methods.addTeam.call(context, 'Team Name', 1500, [{ id: 42 }], 7, { id: 3 }, coach);

    expect(context.addTeamToStore).toHaveBeenCalledWith(expect.objectContaining({ coach }));
    expect(tirProtocolMethods.formatCoachName(coach)).toBe('Петренко Іван');
  });

  it('resolves a playoff ranking row coach from the canonical tournament team', () => {
    const coach = { id: 55, name: 'Іван', surname: 'Петренко', second_name: '' };
    const context = { tournament: { teams: [{ title: 'Team Name', coach }] } };

    expect(protocolMethods.protocolCoachName.call(context, { title: 'Team Name', players: [] })).toBe('Петренко Іван');
  });
});

describe('ProtocolArbiterControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncs a main arbiter from an applied preset before closing the presets modal', () => {
    const emitted = [];
    const context = {
      $emit: (...args) => emitted.push(args),
      syncSelectionFromCurrent: vi.fn(),
      showMessage: vi.fn(),
      closePresets: vi.fn(),
    };
    const preset = {
      arbiters: [
        { name: 'Суддя 1', role: 'Суддя' },
        { name: 'Суддя 2', role: 'головний арбітр', category: '1' },
      ],
    };

    arbiterMethods.applyPreset.call(context, preset);

    const applied = emitted[0][1];
    expect(emitted[0][0]).toBe('apply-preset');
    expect(applied[1].role).toBe('Головний суддя');
    expect(context.syncSelectionFromCurrent).toHaveBeenCalledWith(applied);
    expect(context.closePresets).toHaveBeenCalledOnce();
  });

  it('restores the selected and main arbiter indexes from the current protocol rows', () => {
    const context = {
      arbiters: [
        { name: 'Рожок Олександр Олекcандрович', certificate: '8' },
        { name: 'Інший Суддя', certificate: '9' },
      ],
      selectedArbiterIndexes: [],
      mainArbiterIndex: '',
    };

    arbiterMethods.syncSelectionFromCurrent.call(context, [
      { name: 'Рожок Олександр Олександрович', role: 'Головний суддя' },
    ]);

    expect(context.selectedArbiterIndexes).toEqual(['0']);
    expect(context.mainArbiterIndex).toBe('0');
  });

  it('resyncs when preset rows change while the picker is open', () => {
    const context = { pickerOpen: true, arbiters: [{ name: 'Суддя' }], syncSelectionFromCurrent: vi.fn() };
    const arbiters = [{ name: 'Суддя', role: 'Головний суддя' }];

    ProtocolArbiterControls.watch.currentArbiters.handler.call(context, arbiters);

    expect(context.syncSelectionFromCurrent).toHaveBeenCalledWith(arbiters);
  });

  it('does not resync a closed or not-yet-loaded picker', () => {
    const syncSelectionFromCurrent = vi.fn();

    ProtocolArbiterControls.watch.currentArbiters.handler.call(
      { pickerOpen: false, arbiters: [{ name: 'Суддя' }], syncSelectionFromCurrent },
      [],
    );
    ProtocolArbiterControls.watch.currentArbiters.handler.call(
      { pickerOpen: true, arbiters: [], syncSelectionFromCurrent },
      [],
    );

    expect(syncSelectionFromCurrent).not.toHaveBeenCalled();
  });

  it('clears the main arbiter when that person is removed from the multiselect', () => {
    const context = { mainArbiterIndex: '2' };

    ProtocolArbiterControls.watch.selectedArbiterIndexes.call(context, ['0', '1']);

    expect(context.mainArbiterIndex).toBe('');
  });

  it('selects all filtered arbiters without duplicating existing selections', () => {
    const context = {
      selectedArbiterIndexes: ['1'],
      filteredArbiters: [{ index: 0 }, { index: 1 }, { index: 3 }],
    };

    arbiterMethods.selectAllFiltered.call(context);

    expect(context.selectedArbiterIndexes).toEqual(['1', '0', '3']);
  });

  it('loads a cached registry and avoids a sheet request', async () => {
    const cachedArbiters = [{ name: 'Cached Arbiter' }];
    serviceMocks.registryGet.mockResolvedValue({ val: () => ({ arbiters: cachedArbiters }) });
    const context = {
      userId: 'user-1',
      arbiters: [],
      loading: false,
      loadError: 'old error',
      fetchAndCacheRegistry: vi.fn(),
    };

    await arbiterMethods.loadRegistry.call(context);

    expect(context.arbiters).toEqual(cachedArbiters);
    expect(context.fetchAndCacheRegistry).not.toHaveBeenCalled();
    expect(context.loading).toBe(false);
    expect(context.loadError).toBe('');
  });

  it('falls back to the sheet when reading the registry cache fails', async () => {
    serviceMocks.registryGet.mockRejectedValue(new Error('offline cache'));
    const context = {
      userId: 'user-1',
      arbiters: [],
      loading: false,
      loadError: '',
      fetchAndCacheRegistry: vi.fn().mockResolvedValue(undefined),
    };

    await arbiterMethods.loadRegistry.call(context);

    expect(context.fetchAndCacheRegistry).toHaveBeenCalledWith(false);
    expect(context.loadError).toBe('');
  });

  it('fetches, caches, and reports a refreshed registry', async () => {
    const arbiters = [{ name: 'Fresh Arbiter' }];
    serviceMocks.fetchRegistry.mockResolvedValue(arbiters);
    const context = { userId: 'user-1', arbiters: [], showMessage: vi.fn() };

    await arbiterMethods.fetchAndCacheRegistry.call(context, true);

    expect(context.arbiters).toEqual(arbiters);
    expect(serviceMocks.registrySave).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ arbiters, updatedAt: expect.any(Number) }),
    );
    expect(context.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Оновлено', text: 'Завантажено 1 суддів' }),
    );
  });

  it('updates judges already added to the protocol when the registry is refreshed', async () => {
    const currentArbiters = [
      { name: 'Старе ім’я', role: 'Головний суддя', certificate: '42', category: '1', region: 'Львів' },
    ];
    const context = {
      currentArbiters,
      arbiters: [],
      refreshing: false,
      loadError: '',
      pickerOpen: false,
      fetchAndCacheRegistry: vi.fn().mockImplementation(async () => {
        context.arbiters = [
          { name: 'Нове ім’я', certificate: '42', category: 'НК', region: 'Київ' },
          { name: 'Інший суддя', certificate: '7', category: '2', region: 'Одеса' },
        ];
      }),
      $emit: vi.fn(),
      syncSelectionFromCurrent: vi.fn(),
      showMessage: vi.fn(),
    };

    await arbiterMethods.refreshRegistry.call(context);

    expect(context.fetchAndCacheRegistry).toHaveBeenCalledWith(false);
    expect(context.$emit).toHaveBeenCalledWith('apply-selection', [
      { name: 'Нове ім’я', role: 'Головний суддя', certificate: '42', category: 'НК', region: 'Київ' },
    ]);
    expect(context.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('У протоколі синхронізовано 1 суддів, змінено 1') }),
    );
    expect(context.refreshing).toBe(false);
  });

  it('normalizes and emits the current multiselect as protocol rows', () => {
    const context = {
      arbiters: [{ name: 'One' }, { name: 'Two' }],
      selectedArbiterIndexes: ['0', '1'],
      mainArbiterIndex: '1',
      $emit: vi.fn(),
      closePicker: vi.fn(),
    };

    arbiterMethods.addSelectedArbiters.call(context);

    expect(context.$emit).toHaveBeenCalledWith('apply-selection', [
      { name: 'One', role: 'Суддя' },
      { name: 'Two', role: 'Головний суддя' },
    ]);
    expect(context.closePicker).toHaveBeenCalledOnce();
  });

  it('opens the picker, loads the registry once, and syncs existing rows', async () => {
    const context = {
      pickerOpen: false,
      arbiters: [],
      loadRegistry: vi.fn().mockImplementation(async () => {
        context.arbiters = [{ name: 'Loaded' }];
      }),
      syncSelectionFromCurrent: vi.fn(),
    };

    await arbiterMethods.openPicker.call(context);

    expect(context.pickerOpen).toBe(true);
    expect(context.loadRegistry).toHaveBeenCalledOnce();
    expect(context.syncSelectionFromCurrent).toHaveBeenCalledOnce();
  });

  it('adds an editable fallback row when the registry is unavailable', () => {
    const context = { $emit: vi.fn(), closePicker: vi.fn() };

    arbiterMethods.addEmptyRow.call(context);

    expect(context.$emit).toHaveBeenCalledWith('add', {
      name: '',
      role: 'Суддя',
      category: 'АФПУ',
      certificate: '',
      region: '',
    });
    expect(context.closePicker).toHaveBeenCalledOnce();
  });

  it('loads and sorts presets newest first without trusting malformed arbiter rows', async () => {
    serviceMocks.presetsGetAll.mockResolvedValue({
      val: () => ({
        old: { name: 'Old', createdAt: 1, arbiters: [{ name: 'One' }] },
        broken: { name: 'Broken', createdAt: 2, arbiters: null },
        new: { name: 'New', createdAt: 3, arbiters: [{ name: 'Two' }] },
      }),
    });
    const context = { userId: 'user-1', presetsLoading: false, presetsError: '', presets: {} };

    await arbiterMethods.loadPresets.call(context);
    const presetList = ProtocolArbiterControls.computed.presetList.call(context);

    expect(presetList.map((preset) => preset.id)).toEqual(['new', 'broken', 'old']);
    expect(presetList[1].arbiters).toEqual([]);
    expect(context.presetsLoading).toBe(false);
  });

  it('saves a normalized preset and exposes it immediately', async () => {
    serviceMocks.presetSave.mockResolvedValue(undefined);
    const context = {
      userId: 'user-1',
      presetName: 'Championship staff',
      currentArbiters: [{ name: 'Main', role: 'головний арбітр' }],
      savingPreset: false,
      presetsError: '',
      presets: {},
      showMessage: vi.fn(),
    };

    await arbiterMethods.saveCurrentPreset.call(context);

    expect(serviceMocks.presetSave).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
      expect.objectContaining({
        name: 'Championship staff',
        arbiters: [
          {
            name: 'Main',
            role: 'Головний суддя',
            category: 'АФПУ',
            certificate: '',
            region: '',
          },
        ],
      }),
    );
    expect(Object.values(context.presets)).toHaveLength(1);
    expect(context.savingPreset).toBe(false);
  });

  it('deletes a confirmed preset and keeps a cancelled preset', async () => {
    const originalWindow = globalThis.window;
    const context = {
      userId: 'user-1',
      presets: { one: { name: 'One' }, two: { name: 'Two' } },
      deletingPresetId: '',
      presetsError: '',
    };
    globalThis.window = { confirm: vi.fn(() => false) };

    try {
      await arbiterMethods.deletePreset.call(context, { id: 'one', name: 'One' });
      expect(serviceMocks.presetRemove).not.toHaveBeenCalled();

      globalThis.window.confirm.mockReturnValue(true);
      serviceMocks.presetRemove.mockResolvedValue(undefined);
      await arbiterMethods.deletePreset.call(context, { id: 'one', name: 'One' });
    } finally {
      globalThis.window = originalWindow;
    }

    expect(serviceMocks.presetRemove).toHaveBeenCalledWith('user-1', 'one');
    expect(context.presets).toEqual({ two: { name: 'Two' } });
    expect(context.deletingPresetId).toBe('');
  });
});

describe('Protocol component behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shares the same gate, participant tools, and footer with the TIR protocol', () => {
    expect(TirProtocol.components.ProtocolGate).toBe(Protocol.components.ProtocolGate);
    expect(TirProtocol.components.ProtocolParticipantTools).toBe(Protocol.components.ProtocolParticipantTools);
    expect(TirProtocol.components.ProtocolFooter).toBe(Protocol.components.ProtocolFooter);
  });

  it('shows arbiter certificate numbers and keeps the AFPU category by default', () => {
    expect(Protocol.data().showArbitrCertificate).toBe(true);
    expect(Protocol.data().replaceAfpuWithSecondCategory).toBe(false);
    expect(TirProtocol.data().replaceAfpuWithSecondCategory).toBe(false);
  });

  it('displays AFPU as category 2 only while the replacement option is enabled', () => {
    expect(protocolMethods.displayArbiterCategory.call({ replaceAfpuWithSecondCategory: true }, 'АФПУ')).toBe('2');
    expect(protocolMethods.displayArbiterCategory.call({ replaceAfpuWithSecondCategory: true }, 'афпу')).toBe('2');
    expect(protocolMethods.displayArbiterCategory.call({ replaceAfpuWithSecondCategory: false }, 'АФПУ')).toBe('АФПУ');
    expect(tirProtocolMethods.displayArbiterCategory.call({ replaceAfpuWithSecondCategory: true }, 'НК')).toBe('НК');
  });

  it('saves the AFPU replacement option after the protocol rerenders', () => {
    const saveProtocolToStorage = vi.fn();
    const context = {
      replaceAfpuWithSecondCategory: false,
      $nextTick: (callback) => callback(),
      saveProtocolToStorage,
    };

    protocolMethods.updateReplaceAfpuWithSecondCategory.call(context, true);

    expect(context.replaceAfpuWithSecondCategory).toBe(true);
    expect(saveProtocolToStorage).toHaveBeenCalledOnce();
  });

  it('does not overwrite the original AFPU category when its displayed replacement blurs', () => {
    const saveProtocolToStorage = vi.fn();
    const context = {
      arbitres: [{ category: 'АФПУ' }],
      replaceAfpuWithSecondCategory: true,
      $nextTick: (callback) => callback(),
      saveProtocolToStorage,
    };

    protocolMethods.updateArbiterCategory.call(context, 0, { currentTarget: { textContent: '2' } });

    expect(context.arbitres[0].category).toBe('АФПУ');
    expect(saveProtocolToStorage).toHaveBeenCalledOnce();
  });

  it('paginates participant teams without splitting a team across pages', () => {
    const teams = [
      { title: 'A', players: Array(20).fill({}) },
      { title: 'B', players: Array(15).fill({}) },
      { title: 'C', players: [{}, {}] },
    ];

    expect(
      Protocol.computed.participantChunks.call({
        participantsList: teams,
        firstParticipantPageRows: 38,
        maxRowsPerPage: 38,
      }),
    ).toEqual([[teams[0], teams[1]], [teams[2]]]);
  });

  it('reserves first-page space for the title and tournament details', () => {
    const teams = Array.from({ length: 11 }, (_, index) => ({
      title: `Team ${index + 1}`,
      players: [{}, {}],
    }));

    const firstParticipantPageRows = Protocol.computed.firstParticipantPageRows.call({});
    const maxRowsPerPage = Protocol.computed.maxRowsPerPage.call({});

    expect({ firstParticipantPageRows, maxRowsPerPage }).toEqual({
      firstParticipantPageRows: 29,
      maxRowsPerPage: 37,
    });
    expect(
      Protocol.computed.participantChunks
        .call({ participantsList: teams, firstParticipantPageRows, maxRowsPerPage })
        .map((chunk) => chunk.length),
    ).toEqual([9, 2]);
  });

  it('calculates participant chunk offsets', () => {
    expect(Protocol.computed.participantChunkOffsets.call({ participantChunks: [[1, 2], [3], [4, 5]] })).toEqual([
      0, 2, 3,
    ]);
  });

  it('applies arbiter selections and keeps the protocol main-arbiter name in sync', () => {
    const saveProtocolToStorage = vi.fn();
    const context = {
      arbitres: [],
      arbitr: '',
      $nextTick: (callback) => callback(),
      saveProtocolToStorage,
    };
    const arbitres = [
      { name: 'Суддя 1', role: 'Суддя' },
      { name: 'Суддя 2', role: 'Головний суддя' },
    ];

    protocolMethods.applyArbiterPreset.call(context, arbitres);

    expect(context.arbitres).toBe(arbitres);
    expect(context.arbitr).toBe('Суддя 2');
    expect(saveProtocolToStorage).toHaveBeenCalledOnce();
  });

  it('updates the main-arbiter name after an editable arbiter field changes', () => {
    const context = {
      arbitres: [
        { name: 'Суддя 1', role: 'Суддя' },
        { name: 'Old name', role: 'Головний суддя' },
      ],
      arbitr: 'Old name',
    };

    protocolMethods.updateArbiterField.call(context, 1, 'name', {
      currentTarget: { textContent: ' New name ' },
    });

    expect(context.arbitres[1].name).toBe('New name');
    expect(context.arbitr).toBe('New name');
  });

  it('refreshes player details from a cache-busted portal request and saves them', async () => {
    const originalWindow = globalThis.window;
    const originalFetch = globalThis.fetch;
    const teams = [
      { title: 'Team Name', portalTeamId: 7, players: [{ id: 1, surname: 'Старе', name: 'Ім’я', second_name: '' }] },
    ];
    const coach = { id: 55, name: 'Іван', surname: 'Петренко', second_name: '' };
    globalThis.window = { URL: globalThis.URL };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          teams: [
            {
              id: '7',
              name: 'Team Name',
              coach,
              players: [{ id: '1', surname: 'Нове', name: 'Ім’я', second_name: 'По батькові' }],
            },
          ],
        }),
    });
    const context = {
      refreshing: false,
      tournamentPortalId: '1784965464060',
      tournament: { teams },
      $forceUpdate: vi.fn(),
      $nextTick: () => Promise.resolve(),
      saveProtocolToStorage: vi.fn(),
      showMessage: vi.fn(),
    };

    try {
      await protocolMethods.refreshPlayersFromPortal.call(context);
    } finally {
      globalThis.window = originalWindow;
      globalThis.fetch = originalFetch;
    }

    expect(teams[0].players[0]).toEqual(expect.objectContaining({ surname: 'Нове', second_name: 'По батькові' }));
    expect(teams[0].coach).toEqual(coach);
    expect(context.saveProtocolToStorage).toHaveBeenCalledOnce();
    expect(context.showMessage).toHaveBeenCalledWith(expect.objectContaining({ title: 'Оновлено' }));
    expect(context.refreshing).toBe(false);
  });

  it('reports a portal refresh error and always clears the busy state', async () => {
    const originalWindow = globalThis.window;
    const originalFetch = globalThis.fetch;
    globalThis.window = { URL: globalThis.URL };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const context = {
      refreshing: false,
      tournamentPortalId: '123',
      tournament: { teams: [] },
      showMessage: vi.fn(),
    };

    try {
      await protocolMethods.refreshPlayersFromPortal.call(context);
    } finally {
      globalThis.window = originalWindow;
      globalThis.fetch = originalFetch;
    }

    expect(context.showMessage).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Помилка', type: 'error', text: expect.stringContaining('503') }),
    );
    expect(context.refreshing).toBe(false);
  });

  it('does not start a second portal refresh while one is already running', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
    const context = { refreshing: true };

    try {
      await protocolMethods.refreshPlayersFromPortal.call(context);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('saves protocol HTML only when the protocol element exists', () => {
    const originalDocument = globalThis.document;
    const originalLocalStorage = globalThis.localStorage;
    const setItem = vi.fn();
    globalThis.localStorage = { setItem };
    globalThis.document = { getElementById: vi.fn(() => null) };

    try {
      protocolMethods.saveProtocolToStorage.call({ protocolStorageKey: 'protocol_1' });
      expect(setItem).not.toHaveBeenCalled();

      globalThis.document.getElementById.mockReturnValue({ innerHTML: '<h2>Protocol</h2>' });
      protocolMethods.saveProtocolToStorage.call({ protocolStorageKey: 'protocol_1' });
    } finally {
      globalThis.document = originalDocument;
      globalThis.localStorage = originalLocalStorage;
    }

    expect(setItem).toHaveBeenCalledWith('protocol_1', '<h2>Protocol</h2>');
  });

  it('removes only the patronymic warning markers from protocol text nodes', () => {
    const originalDocument = globalThis.document;
    const originalNodeFilter = globalThis.NodeFilter;
    const first = { textContent: 'Ксенія !!! ДОПИШІТЬ МЕНЕ!!!' };
    const second = { textContent: 'Mario Presutti' };
    const nodes = [first, second];
    const walker = {
      currentNode: null,
      index: 0,
      nextNode() {
        if (this.index >= nodes.length) return false;
        this.currentNode = nodes[this.index++];
        return true;
      },
    };
    globalThis.NodeFilter = { SHOW_TEXT: 4 };
    globalThis.document = {
      getElementById: () => ({ id: 'protocol' }),
      createTreeWalker: vi.fn(() => walker),
    };
    const context = { showMessage: vi.fn() };

    try {
      protocolMethods.removeDopyshit.call(context);
    } finally {
      globalThis.document = originalDocument;
      globalThis.NodeFilter = originalNodeFilter;
    }

    expect(first.textContent).toBe('Ксенія');
    expect(second.textContent).toBe('Mario Presutti');
    expect(context.showMessage).toHaveBeenCalledWith({ title: 'Готово', text: 'Прибрано 1 міток' });
  });

  it('adds a main arbiter row and saves it on the next tick', () => {
    const saveProtocolToStorage = vi.fn();
    const context = {
      arbitres: [],
      arbitr: '',
      $nextTick: (callback) => callback(),
      saveProtocolToStorage,
    };

    protocolMethods.addArbitr.call(context, { name: 'Main', role: 'Головний суддя' });

    expect(context.arbitres).toEqual([{ name: 'Main', role: 'Головний суддя' }]);
    expect(context.arbitr).toBe('Main');
    expect(saveProtocolToStorage).toHaveBeenCalledOnce();
  });

  it('keeps the rendered protocol title on the same line as the selected archived tournament', () => {
    const originalDocument = globalThis.document;
    const title = { innerHTML: '', textContent: '' };
    globalThis.document = {
      getElementById: () => ({ querySelector: (selector) => (selector === 'h2' ? title : null) }),
    };

    try {
      protocolMethods.updateProtocolTitle.call({ tournamentName: 'Selected archive' });
    } finally {
      globalThis.document = originalDocument;
    }

    expect(title.textContent).toBe('Підсумковий протокол Selected archive');
    expect(title.innerHTML).not.toContain('<br>');
  });

  it('uses ScrollButtons component for page scrolling', () => {
    const scrollButtons = Protocol.components.ScrollButtons;
    expect(scrollButtons).toBeDefined();
    expect(scrollButtons.name).toBe('ScrollButtons');
  });

  it('builds stable player detail keys for render updates', () => {
    expect(
      protocolMethods.playerDetailsKey({
        id: 1,
        surname: 'Коваль',
        name: 'Олег',
        second_name: 'Петрович',
        club_id: 2,
        sport_title: 'КМСУ',
      }),
    ).toBe('1|Коваль|Олег|Петрович|2|КМСУ');
  });

  it('builds team player detail keys for array and legacy object player collections', () => {
    const context = { playerDetailsKey: protocolMethods.playerDetailsKey };
    const player = { id: 1, surname: 'Коваль', name: 'Олег' };

    expect(protocolMethods.teamPlayerDetailsKey.call(context, { players: [player] })).toBe('1|Коваль|Олег|||');
    expect(protocolMethods.teamPlayerDetailsKey.call(context, { players: { 0: player } })).toBe('1|Коваль|Олег|||');
  });

  it('downloads DOCX once and restores the export state', async () => {
    const originalDocument = globalThis.document;
    const protocolElement = { id: 'protocol' };
    globalThis.document = { getElementById: () => protocolElement };
    serviceMocks.downloadDocx.mockResolvedValue(undefined);
    const context = { exportingDocx: false, tournamentName: 'Tournament', showMessage: vi.fn() };

    try {
      await protocolMethods.exportDocx.call(context);
    } finally {
      globalThis.document = originalDocument;
    }

    expect(serviceMocks.downloadDocx).toHaveBeenCalledWith(protocolElement, 'Tournament', { pageNumbers: true });
    expect(context.exportingDocx).toBe(false);
  });

  it('reports DOCX failures and restores the export state', async () => {
    const originalDocument = globalThis.document;
    globalThis.document = { getElementById: () => ({ id: 'protocol' }) };
    serviceMocks.downloadDocx.mockRejectedValue(new Error('write failed'));
    const context = {
      exportingDocx: false,
      tournamentName: 'Tournament',
      showMessage: vi.fn(),
      $t: (key) => key,
    };

    try {
      await protocolMethods.exportDocx.call(context);
    } finally {
      globalThis.document = originalDocument;
    }

    expect(context.showMessage).toHaveBeenCalledWith({
      title: 'messages.error',
      text: 'messages.docxExportFailed',
      type: 'error',
    });
    expect(context.exportingDocx).toBe(false);
  });
});

describe('Protocol tournament placements', () => {
  it('includes teams outside double elimination in the final participant list', () => {
    const teams = ['A', 'B', 'C', 'D'].map((title) => ({ title, players: [] }));
    const tournament = {
      system: 'swiss',
      teams,
      games: [[]],
      playOffBracket: {
        format: 'double',
        stages: [],
        champion: 'A',
        runnerUp: 'B',
        placements: { A: 1, B: 2 },
      },
    };
    const tournamentRanking = Protocol.computed.tournamentRanking.call({ tournament, rankingTeams: teams });
    const participants = Protocol.computed.participantsList.call({ tournament, tournamentRanking });

    expect(participants.map(({ place, title }) => ({ place, title }))).toEqual([
      { place: '1', title: 'A' },
      { place: '2', title: 'B' },
      { place: 3, title: 'C' },
      { place: 4, title: 'D' },
    ]);
  });
});

describe('Archived protocol integration', () => {
  it('exposes protocol through the native TIR public tabs', async () => {
    const { default: TirPublicView } = await vi.importActual('@/components/tir/TirPublicView.vue');

    expect(TirPublicView.props.protocolAvailable.default).toBe(false);
    expect(TirPublicView.props.protocolTournamentMeta.default).toBe(null);
    expect(TirPublicView.components.TirProtocol.__asyncLoader).toEqual(expect.any(Function));
    expect((await TirPublicView.components.TirProtocol.__asyncLoader()).name).toBe('TirProtocol');
  });

  it('uses archived metadata in the TIR protocol and supports the archive gate controls', () => {
    const archived = { name: 'Archived TIR', date: '2026-07-04' };
    const context = {
      tournamentMeta: archived,
      tournament: { name: 'Main data' },
      currentTournament: { name: 'Active' },
    };

    expect(TirProtocol.props.skipGate.default).toBe(false);
    expect(TirProtocol.props.hideClose.default).toBe(false);
    expect(TirProtocol.computed.protocolTournamentMeta.call(context)).toEqual({
      id: undefined,
      name: 'Archived TIR',
      date: '2026-07-04',
      portalIdTournament: undefined,
    });
    expect(
      TirProtocol.computed.tournamentName.call({ protocolTournamentMeta: archived, tournament: context.tournament }),
    ).toBe('Archived TIR');
  });

  it('exports fixed TIR pages without html2pdf inserting extra page-break padding', async () => {
    const originalDocument = globalThis.document;
    const protocolElement = { id: 'protocol' };
    globalThis.document = { getElementById: () => protocolElement };
    serviceMocks.exportPdf.mockResolvedValue(undefined);

    try {
      await tirProtocolMethods.exportPdf.call({ tournamentName: 'Archived TIR' });
    } finally {
      globalThis.document = originalDocument;
    }

    expect(serviceMocks.exportPdf).toHaveBeenCalledWith(protocolElement, {
      html2pdf: expect.objectContaining({
        margin: [0, 0, 0, 0],
        pagebreak: { mode: [] },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
      }),
    });
  });

  it('uses the standard protocol region mapping for TIR participants', () => {
    expect(TirProtocol.methods.getParticipantRegion({ club_id: 2, city: 'Fallback' })).toBe('Харківська');
    expect(TirProtocol.methods.getParticipantRegion({ city: 'Київ' })).toBe('Київ');
  });

  it('passes metadata from the selected archive instead of the current tournament', () => {
    const selected = {
      id: 'archive-1',
      name: 'Selected archived tournament',
      date: '2026-07-04',
      main: { teams: [] },
    };

    expect(Archived.computed.protocolTournamentMeta.call({ tournament: selected, activeKey: 'fallback-id' })).toEqual({
      id: 'archive-1',
      name: 'Selected archived tournament',
      date: '2026-07-04',
    });
    expect(
      Archived.computed.protocolTournamentMeta.call({ tournament: { name: 'Legacy' }, activeKey: 'legacy-id' }),
    ).toEqual({ name: 'Legacy', id: 'legacy-id' });
  });

  it('returns to the top after changing the selected archived tournament', () => {
    const originalWindow = globalThis.window;
    const scrollTo = vi.fn();
    globalThis.window = { scrollTo };
    const context = {
      activeKey: 'old',
      selectorOpen: true,
      activeTab: 'protocol',
      savedTournaments: { new: {} },
      $nextTick: (callback) => callback(),
      getDefaultTab: Archived.methods.getDefaultTab,
    };

    try {
      Archived.methods.selectTournament.call(context, 'new');
    } finally {
      globalThis.window = originalWindow;
    }

    expect(context.activeKey).toBe('new');
    expect(context.selectorOpen).toBe(false);
    expect(context.activeTab).toBe('ranking');
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('selects the first personal tournament when Show All is disabled', () => {
    const originalLocalStorage = globalThis.localStorage;
    const unsubscribe = vi.fn();
    const context = {
      showAllUsers: false,
      activeKey: 'foreign',
      tournament: { id: 'foreign' },
      tournamentKeys: ['mine-first', 'mine-second'],
      _unsubscribe: unsubscribe,
    };

    globalThis.localStorage = { setItem: vi.fn() };
    try {
      Archived.methods.onShowAllChange.call(context);
    } finally {
      globalThis.localStorage = originalLocalStorage;
    }

    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(context._unsubscribe).toBeNull();
    expect(context.activeKey).toBe('mine-first');
    expect(context.tournament).toBeNull();
  });
});
