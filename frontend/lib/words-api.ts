export type ApiWordStatus = 'ACCEPTED' | 'REJECTED' | null

export type ApiWord = {
  word: string
  status: ApiWordStatus
}

const WORDS_PER_REQUEST = 100

function getBackendUrl(): string {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001').replace(
    /\/+$/,
    '',
  )
}

function isApiWordStatus(value: unknown): value is ApiWordStatus {
  return value === 'ACCEPTED' || value === 'REJECTED' || value === null
}

function parseApiWord(value: unknown): ApiWord {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('word' in value) ||
    typeof value.word !== 'string' ||
    !('status' in value) ||
    !isApiWordStatus(value.status)
  ) {
    throw new Error('A API de palavras retornou uma resposta inválida.')
  }

  return { word: value.word, status: value.status }
}

async function readResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    let detail = ''
    try {
      const payload: unknown = await response.json()
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload
      ) {
        detail = Array.isArray(payload.message)
          ? payload.message.join(' ')
          : typeof payload.message === 'string'
            ? payload.message
            : ''
      }
    } catch {
      // Keep the HTTP status when the server returns a non-JSON error.
    }

    throw new Error(
      detail
        ? `${detail} (HTTP ${response.status})`
        : `A API de palavras retornou HTTP ${response.status}.`,
    )
  }

  try {
    return await response.json()
  } catch {
    throw new Error('A API de palavras retornou uma resposta inválida.')
  }
}

export async function fetchAddedWords(
  signal?: AbortSignal,
): Promise<ApiWord[]> {
  const response = await fetch(`${getBackendUrl()}/words/added`, { signal })
  const payload = await readResponse(response)

  if (!Array.isArray(payload)) {
    throw new Error('A API de palavras retornou uma resposta inválida.')
  }

  return payload.map(parseApiWord)
}

export async function fetchWordStatuses(
  words: string[],
  signal?: AbortSignal,
): Promise<ApiWord[]> {
  const uniqueWords = Array.from(new Set(words))
  const batches: string[][] = []

  for (let index = 0; index < uniqueWords.length; index += WORDS_PER_REQUEST) {
    batches.push(uniqueWords.slice(index, index + WORDS_PER_REQUEST))
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const query = new URLSearchParams({ words: batch.join(',') })
      const response = await fetch(`${getBackendUrl()}/words?${query}`, {
        signal,
      })
      const payload = await readResponse(response)

      if (!Array.isArray(payload)) {
        throw new Error('A API de palavras retornou uma resposta inválida.')
      }

      return payload.map(parseApiWord)
    }),
  )

  return results.flat()
}

export async function updateWordStatus(
  word: string,
  status: ApiWordStatus,
): Promise<ApiWord> {
  const response = await fetch(
    `${getBackendUrl()}/words/${encodeURIComponent(word)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  )

  const updatedWord = parseApiWord(await readResponse(response))
  if (
    updatedWord.word !== word.trim().toLowerCase().normalize('NFC')
  ) {
    throw new Error('A API de palavras retornou uma resposta inválida.')
  }

  return updatedWord
}

export async function createWord(
  input: string,
  letters: string[],
  requiredLetter: string,
): Promise<ApiWord> {
  const word = input.trim().toLowerCase().normalize('NFC')
  const response = await fetch(`${getBackendUrl()}/words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, letters, requiredLetter }),
  })
  const createdWord = parseApiWord(await readResponse(response))

  if (createdWord.word !== word || createdWord.status !== null) {
    throw new Error('A API de palavras retornou uma resposta inválida.')
  }

  return createdWord
}
