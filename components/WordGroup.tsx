import { WordEntry } from '@/lib/types';

type WordGroupProps = {
  length: number;
  entries: WordEntry[];
};

export function WordGroup({ length, entries }: WordGroupProps) {
  return (
    <section className="space-y-2">
      <header className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1.5 text-sm font-semibold text-stone-500">
        <span>{length} letras</span>
        <span>{entries.length}</span>
      </header>
      <ul className="grid grid-cols-2 gap-x-2 sm:grid-cols-3 lg:grid-cols-4">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="min-w-0 border-b border-stone-100 px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-stone-50"
          >
            <span className="block truncate" title={entry.display}>{entry.display}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
