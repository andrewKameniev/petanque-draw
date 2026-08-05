import { describe, it, expect } from 'vitest';
import { toScore } from '@/helpers';

describe('toScore', () => {
  it('returns 0 for null and undefined', () => {
    expect(toScore(null)).toBe(0);
    expect(toScore(undefined)).toBe(0);
  });

  it('coerces string numbers to numeric values', () => {
    expect(toScore('13')).toBe(13);
    expect(toScore('9')).toBe(9);
    expect(toScore('0')).toBe(0);
  });

  it('passes through numeric values unchanged', () => {
    expect(toScore(13)).toBe(13);
    expect(toScore(0)).toBe(0);
    expect(toScore(-1)).toBe(-1);
  });

  it('returns 0 for non-numeric strings', () => {
    expect(toScore('abc')).toBe(0);
    expect(toScore('')).toBe(0);
    expect(toScore('NaN')).toBe(0);
  });

  it('returns 0 for NaN and Infinity', () => {
    expect(toScore(NaN)).toBe(0);
    expect(toScore(Infinity)).toBe(0);
    expect(toScore(-Infinity)).toBe(0);
  });

  it('fixes the string comparison bug: "9" vs "13"', () => {
    expect(toScore('9') > toScore('13')).toBe(false);
    expect(toScore('13') > toScore('9')).toBe(true);
  });

  it('fixes the string concatenation bug: 0 + "13"', () => {
    let points = 0;
    points += toScore('13');
    expect(points).toBe(13);
    expect(typeof points).toBe('number');
  });
});
