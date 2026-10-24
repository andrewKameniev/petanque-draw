import { describe, expect, it, vi } from 'vitest';
import { publishAppVersion } from '../scripts/publish-app-version.mjs';

function referenceWith(current) {
  const transaction = vi.fn(async (update) => {
    const next = update(current);
    return {
      committed: next !== undefined,
      snapshot: { val: () => next ?? current },
    };
  });
  return { transaction };
}

describe('Firebase app version publication', () => {
  it.each([null, '1.36.0'])('publishes over %s after deployment', async (current) => {
    const reference = referenceWith(current);
    await expect(publishAppVersion(reference, '1.36.1')).resolves.toBe('published');
    expect(reference.transaction).toHaveBeenCalledOnce();
    expect(reference.transaction.mock.calls[0][2]).toBe(false);
  });

  it('keeps an already published version', async () => {
    await expect(publishAppVersion(referenceWith('1.36.1'), '1.36.1')).resolves.toBe('already-current');
  });

  it('refuses an older deployment or malformed stored version', async () => {
    await expect(publishAppVersion(referenceWith('1.37.0'), '1.36.1')).rejects.toThrow('newer version');
    await expect(publishAppVersion(referenceWith('bad'), '1.36.1')).rejects.toThrow('Invalid Firebase');
  });
});
