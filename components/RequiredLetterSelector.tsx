type RequiredLetterSelectorProps = {
  letters: string[];
  requiredLetter: string | null;
  onSelect: (letter: string) => void;
};

export function RequiredLetterSelector({ letters, requiredLetter, onSelect }: RequiredLetterSelectorProps) {
  if (letters.length !== 7) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Letra obrigatória</span>
      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((letter, index) => (
          <button
            key={`${letter}-${index}`}
            type="button"
            onClick={() => onSelect(letter)}
            className={[
              'flex h-11 w-11 items-center justify-center rounded-full border text-lg font-bold transition-all',
              letter === requiredLetter
                ? 'bg-teal-500 text-white shadow-md'
                : 'border-stone-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-gray-50',
            ].join(' ')}
            aria-pressed={letter === requiredLetter}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
