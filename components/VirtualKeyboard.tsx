type VirtualKeyboardProps = {
  letters: string[];
  onAddLetter: (letter: string) => void;
  onDeleteLast: () => void;
  onClearAll: () => void;
};

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function VirtualKeyboard({
  letters,
  onAddLetter,
  onDeleteLast,
  onClearAll,
}: VirtualKeyboardProps) {
  const hasReachedLimit = letters.length >= 7;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-col items-center gap-2">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-center gap-1.5 sm:gap-2"
          >
            {row.map((letter) => {
              const isSelected = letters.includes(letter);
              const disabled = isSelected || hasReachedLimit;

              return (
                <button
                  key={letter}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAddLetter(letter)}
                  className={[
                    'flex h-11 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-150 sm:w-11',
                    isSelected
                      ? 'border-teal-300 bg-teal-100 text-teal-900'
                      : 'border-stone-200 bg-white text-slate-700 hover:-translate-y-0.5',
                    disabled ? 'cursor-not-allowed opacity-55' : '',
                  ].join(' ')}
                  aria-label={letter}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={onDeleteLast}
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-stone-300"
        >
          Apagar
        </button>

        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-stone-300"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}