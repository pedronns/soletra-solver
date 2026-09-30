type SearchButtonProps = {
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
};

export function SearchButton({ isLoading, disabled, onClick }: SearchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-bold shadow-soft transition-all duration-200',
        disabled || isLoading
          ? 'cursor-not-allowed bg-stone-200 text-stone-500'
          : 'bg-teal-500 text-white hover:-translate-y-0.5 hover:bg-teal-600',
      ].join(' ')}
    >
      {isLoading ? 'Buscando...' : 'Encontrar palavras'}
    </button>
  );
}
