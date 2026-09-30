import { WordEntry } from '@/lib/types';
import { WordResult } from './WordResult';

type WordGroupProps = {
  length: number;
  entries: WordEntry[];
  onStatusChange: (id: string, status: 'accepted' | 'rejected' | 'not-tested') => void;
};

export function WordGroup({ length, entries, onStatusChange }: WordGroupProps) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2 text-sm font-semibold text-stone-500">
        <span>{length} letras</span>
        <span>{entries.length}</span>
      </header>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <WordResult key={entry.id} entry={entry} onStatusChange={onStatusChange} />
        ))}
      </ul>
    </section>
  );
}
