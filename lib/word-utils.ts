import { WordEntry, WordGroup, WordOrigin, WordStatus } from './types';

type GroupableEntry = Partial<WordEntry> & {
  display: string;
  normalized?: string;
  variants?: string[];
  status?: WordStatus;
  origin?: WordOrigin;
};

export function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

export function mergeWordStatus(current: WordStatus, incoming: WordStatus): WordStatus {
  if (current === 'accepted' || incoming === 'accepted') return 'accepted';
  if (current === 'rejected' || incoming === 'rejected') return 'rejected';
  return 'not-tested';
}

export function groupWords(entries: GroupableEntry[]): WordEntry[] {
  const grouped = new Map<string, WordEntry>();

  for (const entry of entries) {
    const variants = (entry.variants ?? [entry.display]).filter(Boolean);
    const key = normalizeForComparison(variants[0] ?? entry.normalized ?? entry.display);

    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        id: entry.id ?? key,
        display: variants.join('/'),
        variants: [...variants],
        normalized: key,
        length: variants[0]?.length ?? entry.length ?? (entry.display?.length ?? 0),
        status: entry.status ?? 'not-tested',
        origin: entry.origin ?? 'dictionary',
      });
      continue;
    }

    const mergedVariants = Array.from(new Set([...current.variants, ...variants].map((word) => word.trim())));
    grouped.set(key, {
      ...current,
      variants: mergedVariants,
      display: mergedVariants.join('/'),
      status: mergeWordStatus(current.status, entry.status ?? 'not-tested'),
      origin: current.origin === 'manual' || (entry.origin ?? 'dictionary') === 'manual' ? 'manual' : 'dictionary',
      length: current.length || mergedVariants[0].length,
    });
  }

  return Array.from(grouped.values()).sort((left, right) => left.length - right.length || left.display.localeCompare(right.display, 'pt-BR'));
}

export function validateManualWord(
  word: string,
  availableLetters: string[],
  requiredLetter: string | null,
): string | null {
  const trimmed = word.trim();
  if (!trimmed) {
    return 'Digite uma palavra antes de adicionar.';
  }

  const normalized = trimmed.toLowerCase();
  if (normalized.length < 4) {
    return 'A palavra deve ter pelo menos 4 letras.';
  }

  if (!requiredLetter) {
    return 'Selecione uma letra obrigatória antes de adicionar.';
  }

  const required = requiredLetter.toLowerCase();
  if (!normalized.includes(required)) {
    return 'A palavra precisa conter a letra obrigatória.';
  }

  const library = availableLetters.map((letter) => letter.toLowerCase());
  const invalidLetter = Array.from(normalized).find((letter) => !library.includes(letter));
  if (invalidLetter) {
    return 'Essa palavra não utiliza apenas as letras disponíveis.';
  }

  return null;
}

export function buildSearchResults(entries: WordEntry[], letters: string[], requiredLetter: string | null): WordGroup[] {
  const normalizedLetters = letters.map((letter) => letter.toLowerCase());
  const required = requiredLetter?.toLowerCase() ?? '';

  const valid = groupWords(entries).filter((entry) => {
    if (!required || entry.length < 4) return false;

    return entry.variants.some((variant) => {
      const text = variant.toLowerCase();
      return (
        text.includes(required) &&
        Array.from(text).every((letter) => normalizedLetters.includes(letter)) &&
        text.length >= 4
      );
    });
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
