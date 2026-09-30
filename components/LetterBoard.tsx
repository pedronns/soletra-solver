import { LetterTile } from './LetterTile';

type LetterBoardProps = {
  letters: string[];
  requiredLetter: string | null;
  onSelectRequired: (letter: string) => void;
};

export function LetterBoard({
  letters,
  requiredLetter,
  onSelectRequired,
}: LetterBoardProps) {
  const otherLetters = letters.filter(
    (letter) => letter !== requiredLetter
  );

  const orderedLetters = requiredLetter
    ? [
        otherLetters[0] ?? '',
        otherLetters[1] ?? '',
        otherLetters[2] ?? '',
        requiredLetter,
        otherLetters[3] ?? '',
        otherLetters[4] ?? '',
        otherLetters[5] ?? '',
      ]
    : letters;

  const renderTile = (index: number) => {
    const letter = orderedLetters[index] ?? '';
    const isEmpty = !letter;

    return (
      <LetterTile
        letter={letter}
        index={index}
        isRequired={letter !== '' && requiredLetter === letter}
        isEmpty={isEmpty}
        onClick={() => {
          if (letter) onSelectRequired(letter);
        }}
        isSelected={letter !== '' && letter === requiredLetter}
      />
    );
  };

  return (
    <div className="mx-auto flex max-w-[25rem] flex-col items-center gap-2 px-2 py-5 sm:gap-0.5 sm:px-4">
      <div className="flex gap-1 sm:gap-1">
        {renderTile(0)}
        {renderTile(1)}
      </div>

      <div className="flex gap-1 sm:gap-1">
        {renderTile(2)}
        {renderTile(3)}
        {renderTile(4)}
      </div>

      <div className="flex gap-1 sm:gap-1">
        {renderTile(5)}
        {renderTile(6)}
      </div>
    </div>
  );
}