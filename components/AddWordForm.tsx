type AddWordFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  errorMessage: string | null;
};

export function AddWordForm({ value, onChange, onSubmit, errorMessage }: AddWordFormProps) {
  return (
    <div className="space-y-3">
      <label htmlFor="manualWord" className="block text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
        Encontrou uma palavra que não apareceu?
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="manualWord"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Digite uma palavra..."
          className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Adicionar
        </button>
      </div>
      {errorMessage && (
        <p className="text-sm font-medium text-rose-700" role="alert" aria-live="assertive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
