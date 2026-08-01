import { describe, expect, it } from 'vitest';
import {
  collectCanonicalPlayers,
  collectLegacyPlayers,
  extractPlayerIdentities,
  getPlayerIdentityKey,
  normalizePlayerName,
} from '@/helpers-stat-identities';

const identities = {
  42: {
    portalPlayerId: '42',
    name: 'Jonathan Doe',
    aliases: ['Johnny Doe', 'Jumbo Mumbo'],
  },
};

const stats = {
  100: {
    team1: { players: [{ name: 'Jonathan Doe', portalPlayerId: '42' }] },
    team2: { players: [{ name: 'Opponent' }] },
  },
  200: {
    team1: { players: [{ name: ' Johnny   Doe ' }] },
    team2: { players: [{ name: 'Opponent' }] },
  },
  300: {
    team1: { players: [{ name: 'Jumbo Mumbo' }] },
    team2: { players: [{ name: 'Someone Else' }] },
  },
};

describe('stats player identities', () => {
  it('normalizes whitespace, unicode, and case for matching', () => {
    expect(normalizePlayerName('  JOHNNY   Doe ')).toBe('johnny doe');
  });

  it('resolves portal players and their legacy aliases to one stable key', () => {
    expect(getPlayerIdentityKey({ name: 'Current name', portalPlayerId: 42 }, identities)).toBe('portal:42');
    expect(getPlayerIdentityKey({ name: 'johnny doe' }, identities)).toBe('portal:42');
    expect(getPlayerIdentityKey({ name: ' Jumbo  Mumbo ' }, identities)).toBe('portal:42');
  });

  it('keeps unmatched handwritten names as legacy identities', () => {
    expect(getPlayerIdentityKey({ name: 'Someone Else' }, identities)).toBe('legacy:someone else');
  });

  it('shows one analysis player for the portal identity and all aliases', () => {
    expect(extractPlayerIdentities(stats, identities)).toEqual([
      { key: 'portal:42', name: 'Jonathan Doe', portalPlayerId: '42' },
      { key: 'legacy:opponent', name: 'Opponent', portalPlayerId: null },
      { key: 'legacy:someone else', name: 'Someone Else', portalPlayerId: null },
    ]);
  });

  it('counts canonical and legacy games for the merge preview', () => {
    expect(collectCanonicalPlayers(stats, identities)).toEqual([
      {
        portalPlayerId: '42',
        name: 'Jonathan Doe',
        aliases: ['Johnny Doe', 'Jumbo Mumbo'],
        directGames: 1,
      },
    ]);
    expect(collectLegacyPlayers(stats)).toEqual([
      { name: 'Johnny Doe', normalized: 'johnny doe', games: 1 },
      { name: 'Jumbo Mumbo', normalized: 'jumbo mumbo', games: 1 },
      { name: 'Opponent', normalized: 'opponent', games: 2 },
      { name: 'Someone Else', normalized: 'someone else', games: 1 },
    ]);
  });

  it('does not guess when two portal players have the same canonical name', () => {
    const duplicateNames = {
      1: { portalPlayerId: '1', name: 'Alex Smith', aliases: [] },
      2: { portalPlayerId: '2', name: 'Alex Smith', aliases: [] },
    };
    expect(getPlayerIdentityKey({ name: 'Alex Smith' }, duplicateNames)).toBe('legacy:alex smith');

    duplicateNames[1].aliases = ['Alex Smith'];
    expect(getPlayerIdentityKey({ name: 'Alex Smith' }, duplicateNames)).toBe('portal:1');
  });
});
