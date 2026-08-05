import { describe, expect, it } from 'vitest';
import {
  getActiveTournamentGroup,
  getTournamentGroup,
  getTournamentMetadata,
  getTournamentPresentation,
  getTournamentStorageTarget,
  isTournamentEnvelope,
  normalizeTournamentRecord,
  replaceTournamentGroup,
  updateTournamentGroup,
} from '../src/services/tournament-record';

const wrapper = {
  id: 'new-1',
  name: 'Wrapper Cup',
  date: '2026-08-05',
  tournamentMessage: 'Root message',
  portalIdTournament: '725',
  collaborators: { scorer: { role: 'scorer' } },
  activeGroup: 'B',
  main: {
    system: 'swiss',
    teams: [{ title: 'A1' }],
    games: [[{ team_1: 'A1', team_2: 'A2' }]],
    preferences: { maxScore: 11 },
  },
  tournamentB: {
    system: 'playoff',
    teams: [{ title: 'B1' }],
    games: [],
    preferences: { fieldsStart: 4 },
  },
};

const legacy = {
  id: 'legacy-1',
  name: 'Legacy Cup',
  date: '2025-04-03',
  tournamentMessage: 'Legacy message',
  activeGroup: 'B',
  system: 'groups',
  teams: [{ title: 'A1' }],
  games: [],
  preferences: { maxScore: 11, fieldsStart: 2 },
  groupB: {
    teams: [{ title: 'B1' }],
  },
};

describe('canonical tournament record adapter', () => {
  it.each([
    ['new group A', wrapper, 'A', 'main/', 'A1'],
    ['new group B', wrapper, 'B', 'tournamentB/', 'B1'],
    ['legacy group A', legacy, 'A', '', 'A1'],
    ['legacy group B', legacy, 'B', 'groupB/', 'B1'],
  ])('selects %s and its Firebase prefix', (_label, record, group, prefix, team) => {
    const target = getTournamentStorageTarget(record, group);
    expect(target.prefix).toBe(prefix);
    expect(target.data.teams[0].title).toBe(team);
    expect(target.group).toBe(group);
  });

  it.each([
    [{ ...wrapper, activeGroup: 'B', tournamentB: null }, 'main/', 'A1'],
    [{ ...legacy, activeGroup: 'B', groupB: null }, '', 'A1'],
  ])('falls back safely when selected Group B is missing', (record, prefix, team) => {
    const target = getTournamentStorageTarget(record, 'B');
    expect(target.prefix).toBe(prefix);
    expect(target.group).toBe('A');
    expect(target.requestedGroup).toBe('B');
    expect(target.data.teams[0].title).toBe(team);
    expect(getActiveTournamentGroup(record)).toBe(target.data);
  });

  it('can describe an absent B storage node without falling back', () => {
    const target = getTournamentStorageTarget({ ...wrapper, tournamentB: null }, 'B', { allowFallback: false });
    expect(target).toMatchObject({ data: null, prefix: 'tournamentB/', group: 'B', exists: false });
  });

  it('keeps root metadata separate from wrapper competition data', () => {
    expect(isTournamentEnvelope(wrapper)).toBe(true);
    expect(getTournamentMetadata(wrapper)).toMatchObject({
      id: 'new-1',
      name: 'Wrapper Cup',
      tournamentMessage: 'Root message',
      portalIdTournament: '725',
      collaborators: wrapper.collaborators,
    });
    expect(getTournamentGroup(wrapper, 'A')).not.toHaveProperty('tournamentMessage');
    expect(getTournamentPresentation(wrapper, 'B')).toMatchObject({
      group: 'B',
      prefix: 'tournamentB/',
      hasGroupB: true,
      metadata: { name: 'Wrapper Cup' },
      competition: { teams: [{ title: 'B1' }] },
    });
  });

  it('normalizes missing arrays/preferences and a partial legacy group B', () => {
    const normalized = normalizeTournamentRecord({
      name: 'Partial legacy',
      system: 'groups',
      preferences: { maxScore: 9 },
      activeGroup: 'B',
      groupB: { teams: [{ title: 'B1' }] },
    });

    expect(normalized.teams).toEqual([]);
    expect(normalized.games).toEqual([]);
    expect(normalized.preferences).toMatchObject({ maxScore: 9, fieldsStart: 1 });
    expect(normalized.groupB).toMatchObject({
      isTournamentB: true,
      system: 'groups',
      teams: [{ title: 'B1' }],
      games: [],
      preferences: { maxScore: 9, fieldsStart: 1 },
    });
  });

  it('normalizes wrapper groups without moving root metadata', () => {
    const normalized = normalizeTournamentRecord(
      {
        name: 'Shared wrapper',
        tournamentMessage: 'Hello',
        main: { system: 'tir' },
      },
      { id: 'shared-1', ownerUid: 'owner-1' },
    );

    expect(normalized).toMatchObject({
      id: 'shared-1',
      _ownerUid: 'owner-1',
      name: 'Shared wrapper',
      tournamentMessage: 'Hello',
      activeGroup: 'A',
      tournamentB: null,
      main: { system: 'tir', teams: [], games: [] },
    });
    expect(normalized.main).not.toHaveProperty('name');
    expect(normalized.main).not.toHaveProperty('tournamentMessage');
  });

  it('falls back to A when activeGroup is missing or points to an absent B', () => {
    expect(normalizeTournamentRecord({ main: {}, activeGroup: 'B' }).activeGroup).toBe('A');
    expect(normalizeTournamentRecord({ teams: [] }).activeGroup).toBe('A');
  });

  it('does not mutate or retain mutable references to its source', () => {
    const source = JSON.parse(JSON.stringify(wrapper));
    const snapshot = JSON.parse(JSON.stringify(source));
    const normalized = normalizeTournamentRecord(source);

    normalized.main.teams[0].title = 'Changed';
    normalized.main.preferences.maxScore = 3;
    expect(source).toEqual(snapshot);
  });

  it('preserves record shape for immutable live group updates', () => {
    const nextWrapper = updateTournamentGroup(wrapper, 'A', { system: 'tir' });
    const nextLegacy = replaceTournamentGroup(legacy, 'B', { teams: [{ title: 'B2' }] });

    expect(nextWrapper).not.toBe(wrapper);
    expect(nextWrapper.main.system).toBe('tir');
    expect(wrapper.main.system).toBe('swiss');
    expect(nextLegacy.groupB.teams[0].title).toBe('B2');
    expect(nextLegacy).not.toHaveProperty('main');
    expect(legacy.groupB.teams[0].title).toBe('B1');
  });
});
