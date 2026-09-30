export type WordStatus = 'not-tested' | 'accepted' | 'rejected';
export type WordOrigin = 'dictionary' | 'manual';

export interface WordEntry {
  id: string;
  display: string;
  variants: string[];
  normalized: string;
  length: number;
  status: WordStatus;
  origin: WordOrigin;
}

export interface WordGroup {
  id: string;
  length: number;
  display: string;
  entries: WordEntry[];
}
