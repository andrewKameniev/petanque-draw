import { describe, expect, it } from 'vitest';
import {
  decodeTournamentRef,
  encodeTournamentRef,
  resolveTournamentSource,
  TOURNAMENT_REF_ERROR,
  TournamentRefError,
} from '@/services/tournament-ref';

function legacyRef(ownerUid, tournamentId) {
  return globalThis.btoa(`${ownerUid}:${tournamentId}`);
}

function utf8Base64(value) {
  return globalThis.btoa(String.fromCharCode(...new globalThis.TextEncoder().encode(value)));
}

describe('public tournament reference codec', () => {
  it('round-trips dotted references without losing large integer precision', () => {
    const encoded = encodeTournamentRef('owner_uid-123', '900719925474099312345');

    expect(decodeTournamentRef(encoded)).toEqual({
      valid: true,
      ownerUid: 'owner_uid-123',
      tournamentId: '900719925474099312345',
      format: 'dotted',
    });
  });

  it('decodes legacy base64 references', () => {
    expect(decodeTournamentRef(legacyRef('owner-abc', '1740000000000'))).toEqual({
      valid: true,
      ownerUid: 'owner-abc',
      tournamentId: '1740000000000',
      format: 'legacy-base64',
    });
  });

  it.each([
    [undefined, TOURNAMENT_REF_ERROR.INVALID_TYPE],
    ['', TOURNAMENT_REF_ERROR.EMPTY],
    ['owner.', TOURNAMENT_REF_ERROR.INVALID_DOTTED],
    ['owner.12.extra', TOURNAMENT_REF_ERROR.INVALID_DOTTED],
    ['owner.!', TOURNAMENT_REF_ERROR.INVALID_DOTTED],
    ['not base64', TOURNAMENT_REF_ERROR.INVALID_BASE64],
    [globalThis.btoa('owner:not-a-number'), TOURNAMENT_REF_ERROR.INVALID_ID],
    [globalThis.btoa('owner:123:extra'), TOURNAMENT_REF_ERROR.INVALID_BASE64],
    [utf8Base64('власник:123'), TOURNAMENT_REF_ERROR.INVALID_BASE64],
  ])('returns a typed invalid result for %p', (value, code) => {
    const result = decodeTournamentRef(value);

    expect(result.valid).toBe(false);
    expect(result.error).toBeInstanceOf(TournamentRefError);
    expect(result.error.code).toBe(code);
  });

  it.each([
    ['', '123'],
    ['owner.with-dot', '123'],
    ['owner', 'not-a-number'],
  ])('rejects invalid encoder input', (ownerUid, tournamentId) => {
    expect(() => encodeTournamentRef(ownerUid, tournamentId)).toThrow(TournamentRefError);
  });
});

describe('public tournament source selection', () => {
  it('selects a valid dotted Firebase reference', () => {
    const source = resolveTournamentSource({ query: { ref: encodeTournamentRef('owner', '123456') } });

    expect(source).toEqual({
      type: 'firebase',
      ownerUid: 'owner',
      tournamentId: '123456',
      format: 'dotted',
    });
  });

  it('selects a valid legacy Firebase reference', () => {
    const source = resolveTournamentSource({ query: { ref: legacyRef('owner', '123456') } });

    expect(source).toMatchObject({
      type: 'firebase',
      ownerUid: 'owner',
      tournamentId: '123456',
      format: 'legacy-base64',
    });
  });

  it('supports the legacy user/tournament query pair', () => {
    expect(resolveTournamentSource({ query: { user: 'owner', tournament: '123456' } })).toEqual({
      type: 'firebase',
      ownerUid: 'owner',
      tournamentId: '123456',
      format: 'legacy-query',
    });
  });

  it.each([
    [{ query: { ref: 'bad ref' } }, 'invalid-ref'],
    [{ query: { user: 'owner' } }, 'invalid-query'],
    [{ query: {}, params: { id: '725' } }, 'unsupported-portal-source'],
    [{ query: {} }, 'missing-source'],
  ])('returns an explicit invalid source for %#', (route, reason) => {
    expect(resolveTournamentSource(route)).toMatchObject({ type: 'invalid', reason });
  });
});
