import { WordEntry, WordGroup } from './types';

export function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/ç/g, '\u0000')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0000/g, 'ç')
    .normalize('NFC');
}

export function parseDictionary(text: string): WordEntry[] {
  const words = text
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);

  return groupWords(words.map((display) => ({ display })));
}

export function groupWords(entries: Array<{ display: string }>): WordEntry[] {
  const grouped = new Map<string, WordEntry>();

  for (const entry of entries) {
    const display = entry.display.trim().toLowerCase();
    if (!display) continue;

    const key = normalizeForComparison(display);

    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        id: key,
        display,
        variants: [display],
        normalized: key,
        length: key.length,
      });
      continue;
    }

    const mergedVariants = Array.from(new Set([...current.variants, display]));
    grouped.set(key, {
      ...current,
      variants: mergedVariants,
      display: mergedVariants.join('/'),
    });
  }

  return Array.from(grouped.values()).sort((left, right) => left.length - right.length || left.display.localeCompare(right.display, 'pt-BR'));
}

export function buildSearchResults(entries: WordEntry[], letters: string[], requiredLetter: string | null): WordGroup[] {
  const normalizedLetters = new Set(letters.map(normalizeForComparison));
  const required = requiredLetter ? normalizeForComparison(requiredLetter) : '';

  const valid = entries.filter((entry) => {
    if (!required || entry.length < 4) return false;

    return (
      entry.normalized.includes(required) &&
      Array.from(entry.normalized).every((letter) => normalizedLetters.has(letter))
    );
  });

  const groups = new Map<number, WordEntry[]>();

  valid.forEach((entry) => {
    const bucket = groups.get(entry.length) ?? [];
    bucket.push(entry);
    groups.set(entry.length, bucket);
  });

  return Array.from(groups.entries())
    .sort(([left], [right]) => left - right)
    .map(([length, items]) => ({
      id: `group-${length}`,
      length,
      display: `${length} letras`,
      entries: items.sort((left, right) => left.display.localeCompare(right.display, 'pt-BR')),
    }));
}
