import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPortalTeams, PortalError } from '@/services/portal';

describe('fetchPortalTeams', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches teams with encoded ID and cache-busting params', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ teams: [{ id: 1, players: [] }] }),
    });

    const result = await fetchPortalTeams('123');
    expect(result).toEqual([{ id: 1, players: [] }]);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url.toString()).toContain('/tournament/team_export/123');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.has('_fresh')).toBe(true);
    expect(options.cache).toBe('no-store');
  });

  it('encodes special characters in portal ID', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ teams: [] }),
    });

    await fetchPortalTeams('test/id with spaces');
    const [url] = fetchMock.mock.calls[0];
    expect(url.toString()).toContain('test%2Fid%20with%20spaces');
  });

  it('throws MISSING_ID for null/empty portal ID', async () => {
    await expect(fetchPortalTeams(null)).rejects.toThrow(PortalError);
    await expect(fetchPortalTeams(null)).rejects.toMatchObject({ code: 'MISSING_ID' });
    await expect(fetchPortalTeams('')).rejects.toMatchObject({ code: 'MISSING_ID' });
    await expect(fetchPortalTeams('  ')).rejects.toMatchObject({ code: 'MISSING_ID' });
  });

  it('throws NETWORK_ERROR when fetch itself fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchPortalTeams('123')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Network error connecting to portal',
    });
  });

  it('throws HTTP_ERROR with status for non-OK responses', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    const err = await fetchPortalTeams('123').catch((e) => e);
    expect(err).toBeInstanceOf(PortalError);
    expect(err.code).toBe('HTTP_ERROR');
    expect(err.status).toBe(404);
    expect(err.message).toContain('404');
  });

  it('throws INVALID_JSON when response is not valid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });

    await expect(fetchPortalTeams('123')).rejects.toMatchObject({ code: 'INVALID_JSON' });
  });

  it('throws INVALID_SHAPE when teams is not an array', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ teams: 'not-an-array' }),
    });
    await expect(fetchPortalTeams('123')).rejects.toMatchObject({ code: 'INVALID_SHAPE' });

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    await expect(fetchPortalTeams('123')).rejects.toMatchObject({ code: 'INVALID_SHAPE' });
  });

  it('accepts numeric portal IDs', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ teams: [] }),
    });

    await fetchPortalTeams(456);
    const [url] = fetchMock.mock.calls[0];
    expect(url.toString()).toContain('/tournament/team_export/456');
  });
});
