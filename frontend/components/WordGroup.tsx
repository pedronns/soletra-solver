import { WordAssessment, WordEntry } from '@/lib/types';

type WordGroupProps = {
  length: number;
  entries: WordEntry[];
  assessments: Record<string, WordAssessment>;
  pendingAssessments: Record<string, boolean>;
  onAssessmentChange: (
    wordId: string,
    assessment: WordAssessment | null,
  ) => void;
};

export function WordGroup({
  length,
  entries,
  assessments,
  pendingAssessments,
  onAssessmentChange,
}: WordGroupProps) {
  return (
    <section className="space-y-2">
      <header className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1.5 text-sm font-semibold text-stone-500">
        <span>{length} letras</span>
        <span>{entries.length}</span>
      </header>
      <ul className="grid grid-cols-2 gap-x-2 sm:grid-cols-3 lg:grid-cols-4">
        {entries.map((entry) => {
          const assessment = assessments[entry.id];
          const isPending = pendingAssessments[entry.id] ?? false;

          return (
            <li
              key={entry.id}
              data-assessment={assessment ?? 'none'}
              aria-busy={isPending}
              className={[
                'word-item group flex min-w-0 items-center justify-between gap-1 border-b px-2 py-1.5 text-sm transition-colors',
                assessment === 'confirmed'
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                  : assessment === 'rejected'
                    ? 'border-rose-200 bg-rose-50/70 text-rose-950'
                    : 'border-stone-100 text-slate-700 hover:bg-stone-50',
              ].join(' ')}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="block truncate" title={entry.display}>
                  {entry.display}
                </span>
                {assessment && (
                  <button
                    type="button"
                    aria-label={`Remover classificação de ${entry.display}`}
                    title={
                      isPending
                        ? 'Salvando classificação'
                        : 'Remover classificação'
                    }
                    disabled={isPending}
                    onClick={() => onAssessmentChange(entry.id, null)}
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-1 disabled:cursor-wait',
                      assessment === 'confirmed'
                        ? 'text-emerald-700 hover:bg-emerald-100'
                        : 'text-rose-700 hover:bg-rose-100',
                    ].join(' ')}
                  >
                    {assessment === 'confirmed' ? '✓' : '✕'}
                  </button>
                )}
              </span>
              {!assessment && (
                <span className="word-assessment-actions flex shrink-0 items-center gap-0.5 transition-opacity">
                  <button
                    type="button"
                    aria-label={`Confirmar ${entry.display}`}
                    title="Confirmar palavra"
                    disabled={isPending}
                    onClick={() => onAssessmentChange(entry.id, 'confirmed')}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-stone-500 transition-colors hover:bg-emerald-100 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 disabled:cursor-wait"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    aria-label={`Rejeitar ${entry.display}`}
                    title="Rejeitar palavra"
                    disabled={isPending}
                    onClick={() => onAssessmentChange(entry.id, 'rejected')}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-stone-500 transition-colors hover:bg-rose-100 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-1 disabled:cursor-wait"
                  >
                    ✕
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
