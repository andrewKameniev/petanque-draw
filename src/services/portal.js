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

  const url = new (globalThis.URL || window.URL)(`${PORTAL_BASE_URL}/tournament/team_export/${encodeURIComponent(portalId)}`);
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
