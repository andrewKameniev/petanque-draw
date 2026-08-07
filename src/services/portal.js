const PORTAL_BASE_URL = 'https://portal.petanque.org.ua';

export class PortalError extends Error {
  constructor(message, { status = null, code = 'PORTAL_ERROR' } = {}) {
    super(message);
    this.name = 'PortalError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchPortalTeams(portalId) {
  if (portalId == null || String(portalId).trim() === '') {
    throw new PortalError('Portal tournament ID is required', { code: 'MISSING_ID' });
  }

  const url = new (globalThis.URL || window.URL)(
    `${PORTAL_BASE_URL}/tournament/team_export/${encodeURIComponent(portalId)}`,
  );
  url.searchParams.set('format', 'json');
  url.searchParams.set('_fresh', Date.now().toString());

  let response;
  try {
    response = await fetch(url, { cache: 'no-store' });
  } catch {
    throw new PortalError('Network error connecting to portal', { code: 'NETWORK_ERROR' });
  }

  if (!response.ok) {
    throw new PortalError(`Portal responded ${response.status}`, {
      status: response.status,
      code: 'HTTP_ERROR',
    });
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new PortalError('Portal returned invalid JSON', { code: 'INVALID_JSON' });
  }

  if (!Array.isArray(data?.teams)) {
    throw new PortalError('Portal returned an invalid tournament export', { code: 'INVALID_SHAPE' });
  }

  return data.teams;
}

export async function updatePortalTournament(portalId, drawId, { token = import.meta.env.VITE_FPU_AUTH_TOKEN } = {}) {
  const normalizedPortalId = String(portalId ?? '').trim();
  if (!normalizedPortalId) {
    throw new PortalError('Portal tournament ID is required', { code: 'MISSING_ID' });
  }
  if (!/^\d+$/.test(normalizedPortalId)) {
    throw new PortalError('Portal tournament ID must be an integer', { code: 'INVALID_ID' });
  }

  const numericPortalId = Number(normalizedPortalId);
  if (!Number.isSafeInteger(numericPortalId) || numericPortalId <= 0) {
    throw new PortalError('Portal tournament ID must be a positive integer', { code: 'INVALID_ID' });
  }

  const normalizedDrawId = typeof drawId === 'string' ? drawId.trim() : '';
  if (!normalizedDrawId) {
    throw new PortalError('Draw tournament ID is required', { code: 'MISSING_DRAW_ID' });
  }

  const authorization = typeof token === 'string' ? token.trim() : '';
  if (!authorization) {
    throw new PortalError('Portal API token is not configured', { code: 'MISSING_TOKEN' });
  }

  let response;
  try {
    response = await fetch(`${PORTAL_BASE_URL}/api/tournament/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify({
        tournament_id: numericPortalId,
        petanque_draw_id: normalizedDrawId,
      }),
    });
  } catch {
    throw new PortalError('Network error connecting to portal', { code: 'NETWORK_ERROR' });
  }

  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new PortalError(`Portal responded ${response.status}`, {
        status: response.status,
        code: 'HTTP_ERROR',
      });
    }
    throw new PortalError('Portal returned invalid JSON', { code: 'INVALID_JSON' });
  }

  if (!response.ok) {
    throw new PortalError(data?.error || `Portal responded ${response.status}`, {
      status: response.status,
      code: 'HTTP_ERROR',
    });
  }

  return data;
}
