import { describe, it, expect } from 'vitest';
import { pluralizeRounds } from '@/helpers';

describe('pluralizeRounds', () => {
  describe('Ukrainian locale', () => {
    it('returns "коло" for 1', () => {
      expect(pluralizeRounds(1, 'ua')).toBe('коло');
    });

    it('returns "кола" for 2, 3, 4', () => {
      expect(pluralizeRounds(2, 'ua')).toBe('кола');
      expect(pluralizeRounds(3, 'ua')).toBe('кола');
      expect(pluralizeRounds(4, 'ua')).toBe('кола');
    });

    it('returns "кіл" for 5-20', () => {
      expect(pluralizeRounds(5, 'ua')).toBe('кіл');
      expect(pluralizeRounds(10, 'ua')).toBe('кіл');
      expect(pluralizeRounds(11, 'ua')).toBe('кіл');
      expect(pluralizeRounds(12, 'ua')).toBe('кіл');
      expect(pluralizeRounds(14, 'ua')).toBe('кіл');
      expect(pluralizeRounds(20, 'ua')).toBe('кіл');
    });

    it('returns "коло" for 21, 31 etc', () => {
      expect(pluralizeRounds(21, 'ua')).toBe('коло');
      expect(pluralizeRounds(31, 'ua')).toBe('коло');
    });

    it('returns "кола" for 22, 23, 24', () => {
      expect(pluralizeRounds(22, 'ua')).toBe('кола');
      expect(pluralizeRounds(23, 'ua')).toBe('кола');
      expect(pluralizeRounds(24, 'ua')).toBe('кола');
    });

    it('handles 111, 112 (special mod100 cases)', () => {
      expect(pluralizeRounds(111, 'ua')).toBe('кіл');
      expect(pluralizeRounds(112, 'ua')).toBe('кіл');
    });
  });

  describe('English locale', () => {
    it('returns "round" for 1', () => {
      expect(pluralizeRounds(1, 'en')).toBe('round');
    });

    it('returns "rounds" for values > 1', () => {
      expect(pluralizeRounds(2, 'en')).toBe('rounds');
      expect(pluralizeRounds(4, 'en')).toBe('rounds');
      expect(pluralizeRounds(10, 'en')).toBe('rounds');
    });
  });

  describe('unknown locale falls back to English', () => {
    it('returns English form for unknown locale', () => {
      expect(pluralizeRounds(1, 'fr')).toBe('round');
      expect(pluralizeRounds(4, 'fr')).toBe('rounds');
    });
  });
});
