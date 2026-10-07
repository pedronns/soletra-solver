import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createWord,
  fetchAddedWords,
  fetchWordStatuses,
  updateWordStatus,
} from './words-api'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('words API client', () => {
  it('loads user-added words and creates normalized words using the API contract', async () => {
    const letters = ['P', 'I', 'N', 'H', 'A', 'O', 'Q']
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ word: 'pinhao', status: null }])),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ word: 'pinhao', status: null }), {
          status: 201,
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchAddedWords()).resolves.toEqual([
      { word: 'pinhao', status: null },
    ])
    await expect(createWord(' PINHAO ', letters, 'A')).resolves.toEqual({
      word: 'pinhao',
      status: null,
    })

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3001/words/added',
    )
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:3001/words')
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: 'pinhao', letters, requiredLetter: 'A' }),
    })
  })

  it('surfaces duplicate and validation errors returned by the backend', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ statusCode: 409, message: 'A palavra já existe.' }),
          { status: 409 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ statusCode: 400, message: ['Palavra inválida.'] }),
          { status: 400 },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    await expect(
      createWord('abacaxi', letters, 'A'),
    ).rejects.toThrow('A palavra já existe. (HTTP 409)')
    await expect(
      createWord('palavra', letters, 'A'),
    ).rejects.toThrow('Palavra inválida. (HTTP 400)')
  })

  it('loads statuses in batches using the backend query contract', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ word: 'abacaxi', status: 'ACCEPTED' }])),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('NEXT_PUBLIC_BACKEND_URL', 'http://backend.test/')

    const words = Array.from({ length: 201 }, (_, index) => `word${index}`)
    const results = await fetchWordStatuses(words)

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][0]).toContain(
      'http://backend.test/words?words=',
    )
    expect(results).toHaveLength(3)
  })

  it('updates and clears status using PATCH and the backend status values', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ word: 'ação', status: 'ACCEPTED' })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ word: 'ação', status: null })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ word: 'outra', status: 'REJECTED' })),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(updateWordStatus('ação', 'ACCEPTED')).resolves.toEqual({
      word: 'ação',
      status: 'ACCEPTED',
    })
    await expect(updateWordStatus('ação', null)).resolves.toEqual({
      word: 'ação',
      status: null,
    })

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3001/words/a%C3%A7%C3%A3o',
    )
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACCEPTED' }),
    })
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ status: null }),
    })
    await expect(updateWordStatus('ação', 'REJECTED')).rejects.toThrow(
      'resposta inválida',
    )
  })

  it('reports backend errors and unexpected response shapes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('Not found', { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ word: 'x' })))
    vi.stubGlobal('fetch', fetchMock)

    await expect(updateWordStatus('inexistente', 'REJECTED')).rejects.toThrow(
      'HTTP 404',
    )
    await expect(fetchWordStatuses(['abacaxi'])).rejects.toThrow(
      'resposta inválida',
    )
  })
})
