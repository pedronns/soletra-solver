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
    <div className="mx-[-0.6rem] mt-6 w-[calc(100%+1.2rem)] space-y-3 sm:mx-auto sm:w-full">
      <div className="flex flex-col items-center gap-2">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={[
              'flex justify-center gap-0.5 sm:w-fit sm:gap-2',
              rowIndex < 2
                ? 'w-full max-w-[32rem]'
                : 'w-[70%] max-w-[22.25rem]',
            ].join(' ')}
          >
            {row.map((letter) => {
              const isSelected = letters.includes(letter);
              const disabled = isSelected || hasReachedLimit;

              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => onAddLetter(letter)}
                  className={[
                    'flex h-11 min-w-6 flex-1 items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-150 sm:min-w-0 sm:w-11 sm:flex-none',
                    isSelected
                      ? 'border-teal-300 bg-teal-100 text-teal-900'
                      : 'border-stone-200 bg-white text-slate-700 hover:-translate-y-0.5'
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