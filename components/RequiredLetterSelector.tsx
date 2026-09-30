type RequiredLetterSelectorProps = {
  letters: string[]
  requiredLetter: string | null
  onSelect: (letter: string) => void
}

export function RequiredLetterSelector({
  letters,
  requiredLetter,
  onSelect,
}: RequiredLetterSelectorProps) {
  return (
    <div className='text-center mt-5'>
      <span className='text-sm font-semibold uppercase tracking-[0.2em] text-stone-500'>
        Letra obrigatória
      </span>
      {letters.length == 0 && (
        <div className='mt-2 text-center text-sm font-medium text-slate-700'>
          Selecione entre as letras abaixo.
        </div>
      )}
      <div className='mt-2 flex flex-wrap items-center justify-center gap-3'>
        <div className='flex flex-wrap justify-center gap-2'>
          {letters.map((letter, index) => (
            <button
              key={`${letter}-${index}`}
              type='button'
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
      {letters.length == 7 && !requiredLetter && (
        <div className='mt-2 text-center text-sm font-medium text-slate-700'>
          Selecione a letra obrigatória.
        </div>
      )}
    </div>
  )
}
