import { WordEntry, WordStatus } from '@/lib/types';

type WordResultProps = {
  entry: WordEntry;
  onStatusChange: (id: string, status: WordStatus) => void;
};

const labels: Record<WordStatus, string> = {
  'not-tested': 'Ainda não testada',
  accepted: 'Aceita pelo jogo',
  rejected: 'Rejeitada pelo jogo',
};

const iconMap: Record<WordStatus, string> = {
  'not-tested': '•',
  accepted: '✓',
  rejected: '✕',
};

export function WordResult({ entry, onStatusChange }: WordResultProps) {
  const currentLabel = labels[entry.status];
  const isAccepted = entry.status === 'accepted';
  const isRejected = entry.status === 'rejected';

  return (
    <li className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-stone-300">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold tracking-tight text-slate-800">{entry.display}</div>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span
              className={[
                'inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium',
                isAccepted ? 'bg-emerald-100 text-emerald-800' : '',
                isRejected ? 'bg-rose-100 text-rose-800' : '',
                !isAccepted && !isRejected ? 'bg-stone-100 text-stone-600' : '',
              ].join(' ')}
            >
              <span aria-hidden="true">{iconMap[entry.status]}</span>
              {currentLabel}
            </span>
            {entry.origin === 'manual' && (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
                Adicionada por você
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onStatusChange(entry.id, 'accepted')}
            className={[
              'rounded-full border px-3 py-1.5 text-sm font-semibold transition',
              isAccepted ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50',
            ].join(' ')}
          >
            ✓ Aceita
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(entry.id, 'rejected')}
            className={[
              'rounded-full border px-3 py-1.5 text-sm font-semibold transition',
              isRejected ? 'border-rose-300 bg-rose-100 text-rose-800' : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
            ].join(' ')}
          >
            ✕ Rejeitada
          </button>
        </div>
      </div>
    </li>
  );
}
