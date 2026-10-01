type LetterTileProps = {
  letter: string
  index: number
  isRequired: boolean
  isEmpty: boolean
  onClick: () => void
  isSelected?: boolean
}

export function LetterTile({
  letter,
  isRequired,
  isEmpty,
  onClick,
}: LetterTileProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={[
  'flex h-16 w-16 items-center justify-center rounded-full border text-2xl font-bold transition-all duration-200 ease-out sm:h-[4.5rem] sm:w-[4.5rem] sm:text-3xl md:h-20 md:w-20',
  isEmpty
    ? 'border-dashed bg-gray-100 text-gray-400'
    : isRequired
      ? 'bg-teal-500 text-white shadow-soft'
      : 'bg-gray-200 text-black shadow-soft',
].join(' ')}
      aria-label={isEmpty ? 'Vaga vazia' : `Letra ${letter}`}
    >
      {isEmpty ? '' : letter}
    </button>
  )
}
