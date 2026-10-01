export interface WordEntry {
  id: string;
  display: string;
  variants: string[];
  normalized: string;
  length: number;
}

export interface WordGroup {
  id: string;
  length: number;
  display: string;
  entries: WordEntry[];
}
