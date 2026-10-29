import { describe, expect, it } from 'vitest';
import { checkPrVersion } from '../scripts/check-pr-version.mjs';

describe('PR version gate', () => {
  it.each(['1.36.1', '1.37.0', '2.0.0'])('accepts one valid bump to %s', (version) => {
    expect(() => checkPrVersion('1.36.0', version, version)).not.toThrow();
  });

  it.each(['1.36.0', '1.36.2', '1.37.1', '1.38.0', '2.1.0', '1.35.9'])('rejects %s', (version) => {
    expect(() => checkPrVersion('1.36.0', version, version)).toThrow();
  });

  it('requires the lockfile to match', () => {
    expect(() => checkPrVersion('1.36.0', '1.36.1', '1.36.0')).toThrow('package-lock.json');
  });
});
