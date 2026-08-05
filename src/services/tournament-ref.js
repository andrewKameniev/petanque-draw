const OWNER_UID_PATTERN = /^[A-Za-z0-9_-]+$/;
const DECIMAL_ID_PATTERN = /^\d+$/;
const BASE36_ID_PATTERN = /^[0-9a-z]+$/i;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export const TOURNAMENT_REF_ERROR = Object.freeze({
  EMPTY: 'empty',
  INVALID_TYPE: 'invalid-type',
  INVALID_OWNER: 'invalid-owner',
  INVALID_ID: 'invalid-id',
  INVALID_DOTTED: 'invalid-dotted',
  INVALID_BASE64: 'invalid-base64',
});

export class TournamentRefError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TournamentRefError';
    this.code = code;
  }
}

function invalid(error) {
  return { valid: false, error };
}

function validateParts(ownerUid, tournamentId) {
  if (!OWNER_UID_PATTERN.test(ownerUid)) {
    throw new TournamentRefError(TOURNAMENT_REF_ERROR.INVALID_OWNER, 'Tournament owner UID is malformed');
  }
  if (!DECIMAL_ID_PATTERN.test(tournamentId)) {
    throw new TournamentRefError(TOURNAMENT_REF_ERROR.INVALID_ID, 'Tournament ID must be a decimal integer');
  }
}

function decodeBase36(value) {
  let result = 0n;
  for (const character of value.toLowerCase()) {
    const digit = BigInt(parseInt(character, 36));
    result = result * 36n + digit;
  }
  return result.toString();
}

function decodeLegacyBase64(value) {
  if (!BASE64_PATTERN.test(value)) {
    throw new TournamentRefError(
      TOURNAMENT_REF_ERROR.INVALID_BASE64,
      'Legacy tournament reference is not valid base64',
    );
  }

  let decoded;
  try {
    decoded = globalThis.atob(value);
  } catch {
    throw new TournamentRefError(
      TOURNAMENT_REF_ERROR.INVALID_BASE64,
      'Legacy tournament reference is not valid base64',
    );
  }

  if (Array.from(decoded).some((character) => character.charCodeAt(0) > 0x7f)) {
    throw new TournamentRefError(
      TOURNAMENT_REF_ERROR.INVALID_BASE64,
      'Legacy tournament reference must contain ASCII data',
    );
  }

  const separator = decoded.indexOf(':');
  if (separator <= 0 || separator !== decoded.lastIndexOf(':') || separator === decoded.length - 1) {
    throw new TournamentRefError(
      TOURNAMENT_REF_ERROR.INVALID_BASE64,
      'Legacy tournament reference must contain an owner and tournament ID',
    );
  }

  return [decoded.slice(0, separator), decoded.slice(separator + 1)];
}

export function encodeTournamentRef(ownerUid, tournamentId) {
  const normalizedOwnerUid = String(ownerUid ?? '');
  const normalizedTournamentId = String(tournamentId ?? '');
  validateParts(normalizedOwnerUid, normalizedTournamentId);
  return `${normalizedOwnerUid}.${BigInt(normalizedTournamentId).toString(36)}`;
}

export function decodeTournamentRef(refValue) {
  if (typeof refValue !== 'string') {
    return invalid(new TournamentRefError(TOURNAMENT_REF_ERROR.INVALID_TYPE, 'Tournament reference must be a string'));
  }
  if (!refValue) {
    return invalid(new TournamentRefError(TOURNAMENT_REF_ERROR.EMPTY, 'Tournament reference is empty'));
  }

  try {
    let ownerUid;
    let tournamentId;
    let format;

    if (refValue.includes('.')) {
      const parts = refValue.split('.');
      if (parts.length !== 2 || !parts[0] || !BASE36_ID_PATTERN.test(parts[1])) {
        throw new TournamentRefError(
          TOURNAMENT_REF_ERROR.INVALID_DOTTED,
          'Dotted tournament reference must contain one owner and one base36 ID',
        );
      }
      [ownerUid] = parts;
      tournamentId = decodeBase36(parts[1]);
      format = 'dotted';
    } else {
      [ownerUid, tournamentId] = decodeLegacyBase64(refValue);
      format = 'legacy-base64';
    }

    validateParts(ownerUid, tournamentId);
    return { valid: true, ownerUid, tournamentId, format };
  } catch (error) {
    if (error instanceof TournamentRefError) return invalid(error);
    return invalid(new TournamentRefError(TOURNAMENT_REF_ERROR.INVALID_BASE64, 'Tournament reference is malformed'));
  }
}

function singleQueryValue(value) {
  return typeof value === 'string' ? value : null;
}

export function resolveTournamentSource(route = {}) {
  const query = route.query || {};
  const hasRef = Object.prototype.hasOwnProperty.call(query, 'ref');

  if (hasRef) {
    const decoded = decodeTournamentRef(singleQueryValue(query.ref));
    if (!decoded.valid) return { type: 'invalid', reason: 'invalid-ref', error: decoded.error };
    return {
      type: 'firebase',
      ownerUid: decoded.ownerUid,
      tournamentId: decoded.tournamentId,
      format: decoded.format,
    };
  }

  const user = singleQueryValue(query.user);
  const tournament = singleQueryValue(query.tournament);
  if (user !== null || tournament !== null) {
    try {
      validateParts(user || '', tournament || '');
      return { type: 'firebase', ownerUid: user, tournamentId: tournament, format: 'legacy-query' };
    } catch (error) {
      return { type: 'invalid', reason: 'invalid-query', error };
    }
  }

  // No current router entry maps a portal tournament ID to Public.vue. The old
  // fallback was behind an always-truthy route.query check and was unreachable.
  if (route.params?.id != null) {
    return { type: 'invalid', reason: 'unsupported-portal-source' };
  }

  return { type: 'invalid', reason: 'missing-source' };
}
