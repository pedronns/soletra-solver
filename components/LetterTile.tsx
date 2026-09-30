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
        'flex h-14 w-14 items-center justify-center rounded-full border text-xl font-bold transition-all duration-200 ease-out md:h-16 md:w-16 md:text-2xl',
        isEmpty
          ? 'border-dashed  bg-gray-100 text-gray-400'
          : isRequired
            ? ' bg-teal-500 text-white shadow-soft'
            : ' bg-gray-200 text-black shadow-soft',
      ].join(' ')}
      aria-label={isEmpty ? 'Vaga vazia' : `Letra ${letter}`}
    >
      {isEmpty ? '' : letter}
    </button>
  )
}
