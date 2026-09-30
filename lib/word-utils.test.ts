import { describe, expect, it } from 'vitest';
import { groupWords, normalizeForComparison, validateManualWord } from './word-utils';

describe('word utilities', () => {
  it('groups words that differ only by accent marks', () => {
    const entries = [
      { display: 'terço', normalized: 'terco', status: 'not-tested', origin: 'dictionary' },
      { display: 'terçô', normalized: 'terco', status: 'not-tested', origin: 'dictionary' },
      { display: 'terçó', normalized: 'terco', status: 'accepted', origin: 'dictionary' },
    ];

    expect(groupWords(entries).length).toBe(1);
    expect(groupWords(entries)[0].display).toBe('terço/terçô/terçó');
  });

  it('ignores accents for duplicate detection', () => {
    expect(normalizeForComparison('terçô')).toBe(normalizeForComparison('terço'));
  });

  it('rejects manual words that do not satisfy the game rules', () => {
    expect(validateManualWord('mora', ['c', 'a', 's', 'a', 'e', 'm', 'b'], 's')).toBe('A palavra precisa conter a letra obrigatória.');
    expect(validateManualWord('banzo', ['b', 'a', 'n', 'o'], 'z')).toBe('Essa palavra não utiliza apenas as letras disponíveis.');
    expect(validateManualWord('bora', ['b', 'o', 'r', 'a', 'c', 'e', 'm'], 'o')).toBeNull();
  });
});
