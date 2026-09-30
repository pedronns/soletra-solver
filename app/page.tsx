'use client'

import { useEffect, useMemo, useState } from 'react'
import { AddWordForm } from '@/components/AddWordForm'
import { LetterBoard } from '@/components/LetterBoard'
import { RequiredLetterSelector } from '@/components/RequiredLetterSelector'
import { ResultsList } from '@/components/ResultsList'
import { SearchButton } from '@/components/SearchButton'
import { VirtualKeyboard } from '@/components/VirtualKeyboard'
import { DEFAULT_LETTERS, MOCK_WORDS } from '@/lib/mock-data'
import { WordEntry, WordStatus, WordGroup } from '@/lib/types'
import {
  buildSearchResults,
  normalizeForComparison,
  validateManualWord,
} from '@/lib/word-utils'

export default function Page() {
  const [letters, setLetters] = useState<string[]>(DEFAULT_LETTERS)
  const [requiredLetter, setRequiredLetter] = useState<string>('')
  const [allWords, setAllWords] = useState<WordEntry[]>(MOCK_WORDS)
  const [selectedResults, setSelectedResults] = useState<WordGroup[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [manualWord, setManualWord] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  const canSearch = letters.length === 7 && Boolean(requiredLetter)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingInInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement

      if (isTypingInInput) return

      const key = event.key.toUpperCase()

      if (/^[A-ZÀ-ÖØ-ÞÇ]$/.test(key)) {
        event.preventDefault()
        addLetter(key)
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        removeLastLetter()
      }

      if (event.key === 'Delete' || event.key === 'Escape') {
        event.preventDefault()
        clearLetters()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [letters, requiredLetter])

  useEffect(() => {
    if (!canSearch) {
      setSelectedResults([])
      return
    }

    const timeout = window.setTimeout(() => {
      setSelectedResults(buildSearchResults(allWords, letters, requiredLetter))
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [allWords, letters, requiredLetter, canSearch])

  const totalWords = useMemo(
    () =>
      selectedResults.reduce((total, group) => total + group.entries.length, 0),
    [selectedResults],
  )

  const addLetter = (value: string) => {
    const normalized = value.toUpperCase()

    setLetters((current) => {
      if (current.includes(normalized)) {
        if (normalized === requiredLetter) {
          setRequiredLetter('')
        }

        return current.filter((letter) => letter !== normalized)
      }

      if (current.length >= 7) {
        return current
      }

      return [...current, normalized]
    })
  }

  const removeLastLetter = () => {
    setLetters((current) => {
      const next = current.slice(0, -1)
      if (requiredLetter && !next.includes(requiredLetter)) {
        setRequiredLetter(next[0] ?? '')
      }
      return next
    })
  }

  const clearLetters = () => {
    setLetters([])
    setRequiredLetter('')
    setErrorMessage(null)
  }

  const selectRequiredLetter = (letter: string) => {
    setRequiredLetter(letter)
    setStatusMessage(`Letra obrigatória: ${letter}`)
  }

  const handleSearch = () => {
    if (!canSearch) return

    setSearchLoading(true)
    setStatusMessage('Buscando palavras possíveis...')

    window.setTimeout(() => {
      setSelectedResults(buildSearchResults(allWords, letters, requiredLetter))
      setSearchLoading(false)
      setStatusMessage(
        `Resultados atualizados para a letra obrigatória ${requiredLetter}.`,
      )
    }, 500)
  }

  const handleStatusChange = (id: string, status: WordStatus) => {
    setAllWords((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
    )
    setStatusMessage(
      `Status atualizado para ${status === 'accepted' ? 'aceita' : status === 'rejected' ? 'rejeitada' : 'não testada'}.`,
    )
  }

  const handleAddManualWord = () => {
    const validation = validateManualWord(manualWord, letters, requiredLetter)
    if (validation) {
      setErrorMessage(validation)
      return
    }

    const normalized = manualWord.trim()
    const duplicate = allWords.some((entry) =>
      entry.variants.some(
        (variant) =>
          normalizeForComparison(variant) ===
          normalizeForComparison(normalized),
      ),
    )

    if (duplicate) {
      setErrorMessage('Essa palavra já foi adicionada.')
      return
    }

    const newEntry: WordEntry = {
      id: `manual-${Date.now()}`,
      display: normalized,
      variants: [normalized],
      normalized: normalized.toLowerCase(),
      length: normalized.length,
      status: 'not-tested',
      origin: 'manual',
    }

    setAllWords((current) => [...current, newEntry])
    setManualWord('')
    setErrorMessage(null)
    setStatusMessage(`Palavra adicionada: ${normalized}`)
  }

  const resultGroupsByLength = selectedResults.map((group) => ({
    ...group,
    entries: group.entries.sort((left, right) =>
      left.display.localeCompare(right.display, 'pt-BR'),
    ),
  }))

  return (
    <main className='min-h-screen bg-[#f8f6f1] text-slate-800'>
      <div className='mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 lg:px-8'>
        <header className='mb-8 flex flex-col gap-2 text-center sm:text-left'>
          <h1 className='text-3xl font-black tracking-tight text-slate-900 sm:text-4xl'>
            Soletra Helper
          </h1>
          <p className='text-base text-stone-600'>
            Encontre palavras possíveis com as letras do dia.
          </p>
        </header>

        <section className='rounded-[2rem] border border-stone-200 bg-white/80 p-4 shadow-soft backdrop-blur-sm sm:p-8'>
          <div className='mx-auto max-w-3xl'>
            <div className='text-center'>
              <h2 className='text-sm font-bold uppercase tracking-[0.25em] text-stone-500'>
                Letras do dia
              </h2>
            </div>

            <LetterBoard
              letters={letters}
              requiredLetter={requiredLetter}
              onSelectRequired={selectRequiredLetter}
            />

            <RequiredLetterSelector
              letters={letters}
              requiredLetter={requiredLetter}
              onSelect={selectRequiredLetter}
            />

            <VirtualKeyboard
              letters={letters}
              onAddLetter={addLetter}
              onDeleteLast={removeLastLetter}
              onClearAll={clearLetters}
            />

            <div className='mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <SearchButton
                isLoading={searchLoading}
                disabled={!canSearch}
                onClick={handleSearch}
              />
            </div>
          </div>
        </section>

        <section className='mt-8 space-y-6'>
          <div
            aria-live='polite'
            className='sr-only'
          >
            {statusMessage}
          </div>

          <div className='rounded-[1.75rem] border border-stone-200 bg-white/80 p-4 shadow-soft sm:p-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h2 className='text-lg font-bold text-slate-900'>Resultados</h2>
                <p className='text-sm text-stone-500'>
                  {canSearch
                    ? `Total: ${totalWords} palavras`
                    : 'Insira as 7 letras do dia para começar.'}
                </p>
              </div>

              {selectedResults.length > 0 && (
                <div className='flex flex-wrap gap-2 text-xs text-stone-600'>
                  {selectedResults.map((group) => (
                    <span
                      key={group.id}
                      className='rounded-full bg-stone-100 px-2.5 py-1 font-semibold'
                    >
                      {group.length} letras: {group.entries.length}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {selectedResults.length > 0 ? (
              <div className='mt-5'>
                <ResultsList
                  groups={resultGroupsByLength}
                  onStatusChange={handleStatusChange}
                />
              </div>
            ) : (
              !canSearch && (
                <div className='mt-5 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500'>
                  Insira as 7 letras do dia para começar.
                </div>
              )
            )}
          </div>

          <div className='rounded-[1.75rem] border border-stone-200 bg-white/80 p-4 shadow-soft sm:p-6'>
            <AddWordForm
              value={manualWord}
              onChange={setManualWord}
              onSubmit={handleAddManualWord}
              errorMessage={errorMessage}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
