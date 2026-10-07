'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { LetterBoard } from '@/components/LetterBoard'
import { AddWordForm } from '@/components/AddWordForm'
import { RequiredLetterSelector } from '@/components/RequiredLetterSelector'
import { ResultsList } from '@/components/ResultsList'
import { SearchButton } from '@/components/SearchButton'
import { VirtualKeyboard } from '@/components/VirtualKeyboard'
import { WordAssessment, WordEntry, WordGroup } from '@/lib/types'
import {
  buildSearchResults,
  groupWords,
  parseDictionary,
} from '@/lib/word-utils'
import {
  type ApiWord,
  type ApiWordStatus,
  fetchAddedWords,
  fetchWordStatuses,
  updateWordStatus,
} from '@/lib/words-api'

const LETTERS_STORAGE_KEY = 'soletra-selected-letters'

function assessmentForEntry(
  entry: WordEntry,
  statuses: Map<string, ApiWordStatus>,
): WordAssessment | null {
  for (const variant of entry.variants) {
    const status = statuses.get(variant.normalize('NFC'))
    if (status === 'ACCEPTED') return 'confirmed'
    if (status === 'REJECTED') return 'rejected'
  }

  return null
}

function assessmentToApiStatus(
  assessment: WordAssessment | null,
): ApiWordStatus {
  if (assessment === 'confirmed') return 'ACCEPTED'
  if (assessment === 'rejected') return 'REJECTED'
  return null
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'erro inesperado'
}

function mergeDictionaryWords(
  current: WordEntry[],
  additions: string[],
): WordEntry[] {
  return groupWords([
    ...current.flatMap((entry) =>
      entry.variants.map((display) => ({ display })),
    ),
    ...additions.map((display) => ({ display })),
  ])
}

export default function Page() {
  const [letters, setLetters] = useState<string[]>([])
  const [requiredLetter, setRequiredLetter] = useState<string>('')
  const [selectionRestored, setSelectionRestored] = useState(false)
  const [dictionaryWords, setDictionaryWords] = useState<WordEntry[]>([])
  const [dictionaryLoading, setDictionaryLoading] = useState(true)
  const [dictionaryError, setDictionaryError] = useState<string | null>(null)
  const [addedWordsError, setAddedWordsError] = useState<string | null>(null)
  const [selectedResults, setSelectedResults] = useState<WordGroup[]>([])
  const [selectedLengths, setSelectedLengths] = useState<number[]>([])
  const [wordAssessments, setWordAssessments] = useState<
    Record<string, WordAssessment>
  >({})
  const [pendingAssessments, setPendingAssessments] = useState<
    Record<string, boolean>
  >({})
  const [assessmentSyncLoading, setAssessmentSyncLoading] = useState(false)
  const [assessmentError, setAssessmentError] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const pendingAssessmentIdsRef = useRef(new Set<string>())
  const assessmentRevisionsRef = useRef<Record<string, number>>({})

  const canSearch = letters.length === 7 && Boolean(requiredLetter)

  useEffect(() => {
    try {
      const storedSelection = window.localStorage.getItem(LETTERS_STORAGE_KEY)

      if (storedSelection) {
        const parsed = JSON.parse(storedSelection) as {
          letters?: unknown
          requiredLetter?: unknown
        } | null
        const storedLetters = Array.isArray(parsed?.letters)
          ? parsed.letters.filter(
              (letter): letter is string =>
                typeof letter === 'string' && /^[A-ZÀ-ÖØ-ÞÇ]$/.test(letter),
            )
          : []
        const restoredLetters = Array.from(new Set(storedLetters)).slice(0, 7)

        setLetters(restoredLetters)
        setRequiredLetter(
          typeof parsed?.requiredLetter === 'string' &&
            restoredLetters.includes(parsed.requiredLetter)
            ? parsed.requiredLetter
            : '',
        )
      }
    } catch {
      // Keep the in-memory selection usable when storage is unavailable or invalid.
    } finally {
      setSelectionRestored(true)
    }
  }, [])

  useEffect(() => {
    if (!selectionRestored) return

    try {
      window.localStorage.setItem(
        LETTERS_STORAGE_KEY,
        JSON.stringify({ letters, requiredLetter }),
      )
    } catch {
      // Ignore storage restrictions; the in-memory selection still works.
    }
  }, [letters, requiredLetter, selectionRestored])

  useEffect(() => {
    let isMounted = true

    fetch('/api/dictionary')
      .then((response) => {
        if (!response.ok) throw new Error('Dictionary request failed')
        return response.text()
      })
      .then((text) => {
        if (isMounted) {
          setDictionaryWords((current) =>
            mergeDictionaryWords(
              current,
              parseDictionary(text).flatMap((entry) => entry.variants),
            ),
          )
        }
      })
      .catch(() => {
        if (isMounted)
          setDictionaryError('Não foi possível carregar o dicionário.')
      })
      .finally(() => {
        if (isMounted) setDictionaryLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchAddedWords(controller.signal)
      .then((words) => {
        setDictionaryWords((current) =>
          mergeDictionaryWords(
            current,
            words.map((word) => word.word),
          ),
        )
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAddedWordsError(
            `Não foi possível carregar as palavras adicionadas: ${errorMessage(error)}`,
          )
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingInInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement

      if (isTypingInInput || event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      const key = event.key.toUpperCase()

      if (/^[A-ZÀ-ÖØ-ÞÇ]$/.test(key) && !letters.includes(key)) {
        event.preventDefault()
        setLetters((current) => {
          if (current.includes(key) || current.length >= 7) return current
          return [...current, key]
        })
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
    if (!canSearch || dictionaryLoading) {
      setSelectedResults([])
      return
    }

    const timeout = window.setTimeout(() => {
      setSelectedResults(
        buildSearchResults(dictionaryWords, letters, requiredLetter),
      )
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [dictionaryWords, dictionaryLoading, letters, requiredLetter, canSearch])

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
  }

  const selectRequiredLetter = (letter: string) => {
    setRequiredLetter(letter)
    setStatusMessage(`Letra obrigatória: ${letter}`)
  }

  const handleSearch = () => {
    if (!canSearch || dictionaryLoading) return

    setSearchLoading(true)
    setStatusMessage('Buscando palavras possíveis...')

    window.setTimeout(() => {
      setSelectedResults(
        buildSearchResults(dictionaryWords, letters, requiredLetter),
      )
      setSearchLoading(false)
      setStatusMessage(
        `Resultados atualizados para a letra obrigatória ${requiredLetter}.`,
      )
    }, 500)
  }

  const resultGroupsByLength = useMemo(
    () =>
      selectedResults.map((group) => ({
        ...group,
        entries: [...group.entries].sort((left, right) =>
          left.display.localeCompare(right.display, 'pt-BR'),
        ),
      })),
    [selectedResults],
  )
  const filteredResultGroups = useMemo(
    () =>
      selectedLengths.length
        ? resultGroupsByLength.filter((group) =>
            selectedLengths.includes(group.length),
          )
        : resultGroupsByLength,
    [resultGroupsByLength, selectedLengths],
  )
  const visibleEntries = useMemo(
    () => filteredResultGroups.flatMap((group) => group.entries),
    [filteredResultGroups],
  )
  const hasVisibleResults = filteredResultGroups.length > 0

  useEffect(() => {
    if (visibleEntries.length === 0) {
      setAssessmentSyncLoading(false)
      return
    }

    const controller = new AbortController()
    const requestedRevisions = new Map(
      visibleEntries.map((entry) => [
        entry.id,
        assessmentRevisionsRef.current[entry.id] ?? 0,
      ]),
    )
    setAssessmentSyncLoading(true)
    setAssessmentError(null)

    fetchWordStatuses(
      visibleEntries.flatMap((entry) => entry.variants),
      controller.signal,
    )
      .then((words) => {
        const statuses = new Map(
          words.map((word) => [
            word.word.toLowerCase().normalize('NFC'),
            word.status,
          ]),
        )

        setWordAssessments((current) => {
          const next = { ...current }
          for (const entry of visibleEntries) {
            if (
              pendingAssessmentIdsRef.current.has(entry.id) ||
              requestedRevisions.get(entry.id) !==
                (assessmentRevisionsRef.current[entry.id] ?? 0)
            ) {
              continue
            }

            const assessment = assessmentForEntry(entry, statuses)
            if (assessment) {
              next[entry.id] = assessment
            } else {
              delete next[entry.id]
            }
          }
          return next
        })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAssessmentError(
            `Não foi possível carregar as classificações: ${errorMessage(error)}`,
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAssessmentSyncLoading(false)
      })

    return () => controller.abort()
  }, [visibleEntries])

  const toggleLengthFilter = (length: number) => {
    setSelectedLengths((current) =>
      current.includes(length)
        ? current.filter((selectedLength) => selectedLength !== length)
        : [...current, length],
    )
  }

  const clearLengthFilters = () => setSelectedLengths([])

  const handleWordAdded = (word: ApiWord) => {
    setDictionaryWords((current) => mergeDictionaryWords(current, [word.word]))
    setAddedWordsError(null)
  }

  const updateWordAssessment = async (
    wordId: string,
    assessment: WordAssessment | null,
  ): Promise<void> => {
    const entry = dictionaryWords.find((word) => word.id === wordId)
    if (!entry || pendingAssessmentIdsRef.current.has(wordId)) return

    const previousAssessment = wordAssessments[wordId]
    const apiStatus = assessmentToApiStatus(assessment)
    assessmentRevisionsRef.current[wordId] =
      (assessmentRevisionsRef.current[wordId] ?? 0) + 1
    pendingAssessmentIdsRef.current.add(wordId)
    setPendingAssessments((current) => ({ ...current, [wordId]: true }))
    setAssessmentError(null)
    setStatusMessage(`Salvando a classificação de ${entry.display}...`)
    setWordAssessments((current) => {
      const next = { ...current }
      if (assessment) {
        next[wordId] = assessment
      } else {
        delete next[wordId]
      }
      return next
    })

    try {
      const results = await Promise.allSettled(
        entry.variants.map((variant) => updateWordStatus(variant, apiStatus)),
      )
      const failedUpdate = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      )

      if (failedUpdate) throw failedUpdate.reason

      const updatedWords = results.map((result) => {
        if (result.status === 'rejected') throw result.reason
        return result.value
      })
      if (updatedWords.some((word) => word.status !== apiStatus)) {
        throw new Error('A API não confirmou a classificação solicitada.')
      }

      setWordAssessments((current) => {
        const next = { ...current }
        if (assessment) {
          next[wordId] = assessment
        } else {
          delete next[wordId]
        }
        return next
      })
      setStatusMessage(`Classificação de ${entry.display} atualizada.`)
    } catch (error) {
      let message = errorMessage(error)

      try {
        const words = await fetchWordStatuses(entry.variants)
        const statuses = new Map(
          words.map((word) => [
            word.word.toLowerCase().normalize('NFC'),
            word.status,
          ]),
        )
        const persistedAssessment = assessmentForEntry(entry, statuses)

        setWordAssessments((current) => {
          const next = { ...current }
          if (persistedAssessment) {
            next[wordId] = persistedAssessment
          } else {
            delete next[wordId]
          }
          return next
        })
      } catch (syncError) {
        message += ` Não foi possível confirmar o estado salvo: ${errorMessage(syncError)}`
        setWordAssessments((current) => {
          const next = { ...current }
          if (previousAssessment) {
            next[wordId] = previousAssessment
          } else {
            delete next[wordId]
          }
          return next
        })
      }

      setAssessmentError(
        `Não foi possível salvar a classificação de ${entry.display}: ${message}`,
      )
    } finally {
      pendingAssessmentIdsRef.current.delete(wordId)
      setPendingAssessments((current) => {
        const next = { ...current }
        delete next[wordId]
        return next
      })
    }
  }

  return (
    <main className='min-h-screen bg-[#f8f6f1] text-slate-800 lg:h-dvh lg:overflow-hidden'>
      <div className='mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:px-8 lg:pb-6 lg:pt-6'>
        <header className='mb-8 flex flex-col gap-2 text-center sm:text-left lg:mb-4 lg:shrink-0'>
          <h1 className='text-3xl font-black tracking-tight text-slate-900 sm:text-4xl'>
            Soletra Solver
          </h1>

          <p className='text-base text-stone-600'>
            Encontre palavras possíveis com as letras do dia.
          </p>
        </header>

        <div className='grid gap-8 lg:min-h-0 lg:flex-1 lg:grid-cols-2'>
          {/* coluna esquerda: jogo */}
          <section className='rounded-[2rem] border border-stone-200 bg-white/80 p-4 shadow-soft backdrop-blur-sm sm:p-8 lg:min-h-0 lg:overflow-y-auto'>
            <div className='mx-auto flex h-full max-w-3xl flex-col'>
              <div className='text-center'>
                <h2 className='text-sm font-bold uppercase tracking-[0.25em] text-stone-500'>
                  Letras do dia
                </h2>
              </div>

              <div className='flex flex-1 flex-col justify-between mt-4'>
                <div>
                  <LetterBoard
                    letters={letters}
                    requiredLetter={requiredLetter}
                    onSelectRequired={selectRequiredLetter}
                  />
                </div>

                <div className='mb-4 mt-auto sm:mb-6 md:mb-8mb-8 mt-auto'>
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
                </div>
              </div>
            </div>
          </section>

          {/* coluna direita: resultados */}
          <section className='lg:min-h-0'>
            <div
              aria-live='polite'
              className='sr-only'
            >
              {statusMessage}
            </div>

            <div
              className={`rounded-[1.75rem] border border-stone-200 bg-white/80 p-4 shadow-soft sm:p-6 ${
                hasVisibleResults
                  ? 'lg:flex lg:h-full lg:min-h-0 lg:flex-col'
                  : ''
              }`}
            >
              <div
                className={`flex flex-col gap-4 ${
                  hasVisibleResults ? 'lg:min-h-0 lg:flex-1' : ''
                }`}
              >
                <div>
                  <h2 className='text-lg font-bold text-slate-900'>
                    Resultados
                  </h2>

                  <p className='text-sm text-stone-500'>
                    {dictionaryLoading
                      ? 'Carregando o dicionário...'
                      : dictionaryError
                        ? dictionaryError
                        : canSearch && `Total: ${totalWords} palavras`}
                  </p>
                  {assessmentSyncLoading && (
                    <p className='text-xs text-stone-500'>
                      Sincronizando classificações...
                    </p>
                  )}
                  {assessmentError && (
                    <p
                      className='text-sm text-rose-700'
                      role='alert'
                    >
                      {assessmentError}
                    </p>
                  )}
                  {addedWordsError && (
                    <p
                      className='text-sm text-rose-700'
                      role='alert'
                    >
                      {addedWordsError}
                    </p>
                  )}
                </div>

                {canSearch && (
                  <AddWordForm
                    existingWords={dictionaryWords}
                    letters={letters}
                    requiredLetter={requiredLetter}
                    onWordAdded={handleWordAdded}
                  />
                )}

                {(selectedResults.length > 0 || selectedLengths.length > 0) && (
                  <div className='flex flex-col gap-2 text-xs text-stone-600'>
                    <div className='flex flex-wrap gap-2'>
                      {resultGroupsByLength.map((group) => {
                        const isSelected = selectedLengths.includes(
                          group.length,
                        )

                        return (
                          <button
                            key={group.id}
                            type='button'
                            aria-pressed={isSelected}
                            onClick={() => toggleLengthFilter(group.length)}
                            className={[
                              'rounded-full px-2.5 py-1 font-semibold transition-colors duration-150',
                              isSelected
                                ? 'bg-teal-500 text-white ring-1 ring-inset ring-teal-300'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                            ].join(' ')}
                          >
                            {group.length} letras: {group.entries.length}
                          </button>
                        )
                      })}
                    </div>

                    {selectedLengths.length > 0 && (
                      <button
                        type='button'
                        onClick={clearLengthFilters}
                        className='self-start py-1 font-semibold'
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                )}

                <div
                  className={
                    hasVisibleResults
                      ? 'lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2'
                      : ''
                  }
                >
                  {dictionaryLoading ? (
                    <div className='rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500'>
                      Carregando o dicionário...
                    </div>
                  ) : dictionaryError ? (
                    <div
                      className='rounded-xl border border-dashed border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700'
                      role='alert'
                    >
                      {dictionaryError}
                    </div>
                  ) : canSearch ? (
                    <ResultsList
                      groups={filteredResultGroups}
                      assessments={wordAssessments}
                      pendingAssessments={pendingAssessments}
                      onAssessmentChange={updateWordAssessment}
                    />
                  ) : (
                    <div className='rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500'>
                      Insira as 7 letras do dia para começar.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
