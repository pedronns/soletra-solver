import { describe, expect, it } from 'vitest';
import {
  buildSearchResults,
  normalizeForComparison,
  parseDictionary,
  validateWordForChallenge,
} from './word-utils';

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

  it('validates additions against the selected letters and the current required letter', () => {
    const letters = ['A', 'B', 'C', 'I', 'X', 'E', 'O'];

    expect(validateWordForChallenge('abacaxi', letters, 'A')).toBeNull();
    expect(validateWordForChallenge('abacaxi', letters, 'E')).toBe(
      'Essa palavra precisa conter a letra central.',
    );
    expect(validateWordForChallenge('banana', letters, 'A')).toBe(
      'Essa palavra não pode ser formada com as letras selecionadas.',
    );
    expect(validateWordForChallenge('abc', letters, 'A')).toBe(
      'A palavra precisa ter pelo menos 4 letras.',
    );
    expect(validateWordForChallenge('abc!', letters, 'A')).toBe(
      'Use apenas letras, sem espaços ou caracteres especiais.',
    );
    expect(validateWordForChallenge('abacaxi', letters.slice(0, 6), 'A')).toBe(
      'Selecione as 7 letras distintas e a letra central antes de adicionar.',
    );
    expect(
      validateWordForChallenge(
        'abacaxi',
        ['A', 'Á', 'B', 'C', 'I', 'X', 'O'],
        'A',
      ),
    ).toBe(
      'Selecione as 7 letras distintas e a letra central antes de adicionar.',
    );
  });
});
