import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createArchiveCollaborationRuntime } from '@/services/archive-collaboration';

function createHarness() {
  const userMapService = {
    getAll: vi.fn(),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
  };
  const collaboratorService = {
    findUserByEmail: vi.fn(),
    add: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
  };
  const firebase = {
    database: 'database',
    getDatabase: () => 'database',
    ref: (_database, path) => path,
    get: vi.fn(),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    onValue: vi.fn(() => vi.fn()),
  };
  const store = {
    user: { uid: 'user1' },
    currentTournamentIndex: 't1',
    tournaments: {
      t1: {
        id: 't1',
        name: 'Tournament',
        teams: [],
        collaborators: { admin1: { role: 'admin', email: 'admin@example.com' } },
      },
    },
    userTournamentMap: { t1: { status: 'active', role: 'owner', name: 'Tournament' } },
    savedTournaments: {},
    savedTournamentIds: [],
    get currentTournament() {
      return this.tournaments[this.currentTournamentIndex];
    },
    addTournament: vi.fn(),
    setActiveTournament: vi.fn(function setActiveTournament(id) {
      this.currentTournamentIndex = id;
    }),
    setSavedTournaments: vi.fn(function setSavedTournaments(value) {
      this.savedTournaments = value;
    }),
    setTournaments: vi.fn(function setTournaments(value) {
      this.tournaments = value;
    }),
    showMessage: vi.fn(),
    subscribeTournament: vi.fn(),
    unsubscribeTournament: vi.fn(),
  };
  const runtime = createArchiveCollaborationRuntime(store, {
    ...firebase,
    userMapService,
    collaboratorService,
    translate: (key) => key,
  });
  return { collaboratorService, firebase, runtime, store, userMapService };
}

describe('archive and collaboration runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('rolls back the owner map when collaborator archive propagation fails', async () => {
    const { runtime, store, userMapService } = createHarness();
    userMapService.update
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('admin write failed'))
      .mockResolvedValueOnce();

    await runtime.addToSaved(store.tournaments.t1);

    expect(userMapService.update.mock.calls).toEqual([
      ['user1', 't1', { status: 'archived' }],
      ['admin1', 't1', { status: 'archived', archiveStatusVersion: 1 }],
      ['user1', 't1', { status: 'active' }],
    ]);
    expect(store.tournaments.t1).toBeDefined();
    expect(store.userTournamentMap.t1.status).toBe('active');
    expect(store.showMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });

  it('rolls back a failed owner restore and retains the archived local record', async () => {
    const { runtime, store, userMapService } = createHarness();
    store.userTournamentMap.t1.status = 'archived';
    store.savedTournaments.t1 = store.tournaments.t1;
    store.savedTournamentIds = ['t1'];
    delete store.tournaments.t1;
    userMapService.update
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('admin restore failed'))
      .mockResolvedValueOnce();

    await expect(runtime.unarchiveTournament('t1')).resolves.toBe(false);

    expect(userMapService.update).toHaveBeenLastCalledWith('user1', 't1', { status: 'archived' });
    expect(store.savedTournaments.t1).toBeDefined();
    expect(store.userTournamentMap.t1.status).toBe('archived');
  });

  it('deletes an eligible indexed tournament from its actual owner path', async () => {
    const { firebase, runtime, store } = createHarness();
    store.user = { uid: 'super-admin', email: 'nemo15.alex@gmail.com' };
    store.userTournamentMap = {};
    store.archiveIndex = {
      t1: {
        ownerUid: 'owner1',
        portalId: '42',
        tournamentIsFinished: true,
        isTestTournament: false,
      },
    };
    firebase.get.mockImplementation((path) =>
      Promise.resolve({
        exists: () => true,
        val: () =>
          path === 'archive/t1'
            ? store.archiveIndex.t1
            : {
                portalIdTournament: '42',
                tournamentIsFinished: true,
                preferences: { isTestTournament: false },
              },
      }),
    );

    await expect(runtime.removeSavedTournament('t1')).resolves.toBe(true);

    expect(firebase.get).toHaveBeenNthCalledWith(1, 'archive/t1');
    expect(firebase.get).toHaveBeenNthCalledWith(2, 'owner1/tournaments/t1');
    expect(firebase.update).toHaveBeenCalledWith('/', {
      'archive/t1': null,
      'owner1/tournaments/t1': null,
      'users/owner1/tournaments/t1': null,
      'users/super-admin/tournaments/t1': null,
    });
    expect(firebase.remove).not.toHaveBeenCalled();
  });

  it('removes the tournament collaborator record when user-map creation fails', async () => {
    const { collaboratorService, runtime, userMapService } = createHarness();
    collaboratorService.findUserByEmail.mockResolvedValue({ exists: () => true, val: () => 'user2' });
    userMapService.set.mockRejectedValue(new Error('map write failed'));

    await expect(runtime.addCollaborator('USER2@EXAMPLE.COM', 'admin')).rejects.toThrow('map write failed');

    expect(collaboratorService.add).toHaveBeenCalledWith('user1', 't1', 'user2', {
      role: 'admin',
      email: 'user2@example.com',
    });
    expect(collaboratorService.remove).toHaveBeenCalledWith('user1', 't1', 'user2');
  });

  it('owns one access watcher and suppresses repeated revocation callbacks', () => {
    const { firebase, runtime, store, userMapService } = createHarness();
    const firstUnsubscribe = vi.fn();
    const secondUnsubscribe = vi.fn();
    let callback;
    let errorCallback;
    firebase.onValue
      .mockReturnValueOnce(firstUnsubscribe)
      .mockImplementationOnce((_path, nextCallback, nextErrorCallback) => {
        callback = nextCallback;
        errorCallback = nextErrorCallback;
        return secondUnsubscribe;
      });

    runtime.watchCollaboratorAccess('t1', 'owner1');
    runtime.watchCollaboratorAccess('t1', 'owner1');
    expect(firstUnsubscribe).toHaveBeenCalledOnce();

    store.tournaments.t1._ownerUid = 'owner1';
    callback({ exists: () => false });
    errorCallback({ code: 'PERMISSION_DENIED' });

    expect(secondUnsubscribe).toHaveBeenCalledOnce();
    expect(store.unsubscribeTournament).toHaveBeenCalledOnce();
    expect(userMapService.remove).toHaveBeenCalledOnce();
    expect(store.showMessage).toHaveBeenCalledOnce();
  });

  it('leaves shared access without deleting the owner tournament path', async () => {
    const { firebase, runtime, store, userMapService } = createHarness();
    store.tournaments.t1._ownerUid = 'owner1';
    store.userTournamentMap.t1 = { role: 'scorer', ownerUid: 'owner1', status: 'active' };

    await runtime.leaveSharedTournament('t1');

    expect(userMapService.remove).toHaveBeenCalledWith('user1', 't1');
    expect(firebase.remove).not.toHaveBeenCalled();
    expect(store.tournaments.t1).toBeUndefined();
    expect(store.currentTournamentIndex).toBeNull();
  });

  it('does not apply an owned-tournament response after the user changes', async () => {
    const { firebase, runtime, store, userMapService } = createHarness();
    let resolveMap;
    userMapService.getAll.mockReturnValue(
      new Promise((resolve) => {
        resolveMap = resolve;
      }),
    );
    firebase.get.mockResolvedValue({ exists: () => true, val: () => ({ t1: { teams: [] } }) });

    const pending = runtime.getTournaments();
    runtime.dispose();
    store.user = { uid: 'user2' };
    resolveMap({ exists: () => true, val: () => ({ t1: { role: 'owner', status: 'active' } }) });
    await pending;

    expect(store.setTournaments).not.toHaveBeenCalled();
    expect(store.userTournamentMap).toEqual({ t1: { status: 'active', role: 'owner', name: 'Tournament' } });
  });
});
