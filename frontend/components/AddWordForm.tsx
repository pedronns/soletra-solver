'use client'

import { FormEvent, useState } from 'react'
import type { ApiWord } from '@/lib/words-api'
import { createWord } from '@/lib/words-api'
import type { WordEntry } from '@/lib/types'
import { validateWordForChallenge } from '@/lib/word-utils'

type AddWordFormProps = {
  existingWords: WordEntry[]
  letters: string[]
  requiredLetter: string
  onWordAdded: (word: ApiWord) => void
}

function normalizeWord(value: string): string {
  return value.trim().toLowerCase().normalize('NFC')
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
}

export function AddWordForm({
  existingWords,
  letters,
  requiredLetter,
  onWordAdded,
}: AddWordFormProps) {
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const word = normalizeWord(value)
    const validationMessage = validateWordForChallenge(
      word,
      letters,
      requiredLetter,
    )

    if (validationMessage) {
      setMessageIsError(true)
      setMessage(validationMessage)
      return
    }

    if (
      existingWords.some((entry) =>
        entry.variants.some((variant) => normalizeWord(variant) === word),
      )
    ) {
      setMessageIsError(true)
      setMessage('Essa palavra já está no dicionário.')
      return
    }

    setIsSaving(true)
    setMessage('')

    try {
      const createdWord = await createWord(word, letters, requiredLetter)
      onWordAdded(createdWord)
      setValue('')
      setMessageIsError(false)
      setMessage(`“${createdWord.word}” foi adicionada ao dicionário.`)
    } catch (error) {
      setMessageIsError(true)
      setMessage(`Não foi possível adicionar a palavra: ${getErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-stone-200 bg-stone-50 p-3"
    >
      <label
        htmlFor="add-dictionary-word"
        className="mb-2 block text-sm font-semibold text-stone-700"
      >
        Encontrou outra palavra válida?
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="add-dictionary-word"
          name="word"
          type="text"
          autoComplete="off"
          maxLength={80}
          value={value}
          disabled={isSaving}
          onChange={(event) => {
            setValue(event.target.value)
            setMessage('')
          }}
          placeholder="Digite a palavra encontrada"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-stone-100"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        >
          {isSaving ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 text-sm ${messageIsError ? 'text-rose-700' : 'text-emerald-700'}`}
          role={messageIsError ? 'alert' : 'status'}
        >
          {message}
        </p>
      )}
    </form>
  )
}
