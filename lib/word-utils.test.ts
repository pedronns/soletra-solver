import { describe, expect, it } from 'vitest';
import { buildSearchResults, normalizeForComparison, parseDictionary } from './word-utils';

describe('word utilities', () => {
  it('reads one trimmed word per dictionary line and groups accent variants', () => {
    const entries = parseDictionary('  terço  \nterçô\n\nterçó\nTERÇO\n');

    expect(entries).toHaveLength(1);
    expect(entries[0].display).toBe('terço/terçô/terçó');
  });

  it('normalizes accents while preserving cedilla and punctuation', () => {
    expect(normalizeForComparison('terçô')).toBe('terço');
    expect(normalizeForComparison('terço')).not.toBe(normalizeForComparison('terco'));
    expect(normalizeForComparison('a-bê-cê')).toBe('a-be-ce');
  });

  it('applies length, required-letter, and available-letter rules after normalization', () => {
    const entries = parseDictionary('sol\nsola\nárabe\nárabes\n');
    const results = buildSearchResults(entries, ['a', 'r', 'b', 'e', 'l', 'o', 'x'], 'a');

    expect(results.flatMap((group) => group.entries.map((entry) => entry.display))).toEqual(['árabe']);
  });
});
