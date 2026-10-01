import { WordGroup } from '@/lib/types';
import { WordGroup as WordGroupComponent } from './WordGroup';

type ResultsListProps = {
  groups: WordGroup[];
};

export function ResultsList({ groups }: ResultsListProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70 p-8 text-center text-sm text-stone-500">
        Nenhuma palavra encontrada com essas letras.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <WordGroupComponent key={group.id} length={group.length} entries={group.entries} />
      ))}
    </div>
  );
}
