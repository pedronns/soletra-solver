import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { PrismaService } from '../src/prisma/prisma.service'
import { CreateWordDto } from '../src/words/dto/create-word.dto'
import { UpdateWordStatusDto } from '../src/words/dto/update-word-status.dto'
import { WordsService } from '../src/words/words.service'

describe('word normalization', () => {
  it('trims and lowercases while preserving accents and cedilla', async () => {
    const prisma = {
      word: {
        findUnique: async ({ where }: { where: { word: string } }) => ({
          word: where.word,
          status: null,
        }),
      },
    }
    const service = new WordsService(prisma as unknown as PrismaService)

    assert.deepEqual(await service.findOne('  AÇAÍ  '), {
      word: 'açaí',
      status: null,
    })
  })
})

describe('new word validation', () => {
  it('normalizes valid puzzle data and rejects invalid words or challenge letters', async () => {
    const valid = plainToInstance(CreateWordDto, {
      word: '  AÇAÍ  ',
      letters: ['a', 'c', 'i', 'x', 'o', 'q', 'z'],
      requiredLetter: 'a',
    })
    assert.equal(valid.word, 'açaí')
    assert.deepEqual(valid.letters, ['A', 'C', 'I', 'X', 'O', 'Q', 'Z'])
    assert.equal(valid.requiredLetter, 'A')
    assert.deepEqual(await validate(valid), [])

    for (const word of ['', 'duas palavras', '123', 'x'.repeat(81)]) {
      const dto = plainToInstance(CreateWordDto, {
        word,
        letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        requiredLetter: 'A',
      })
      assert.notDeepEqual(await validate(dto), [])
    }

    const repeatedLetters = plainToInstance(CreateWordDto, {
      word: 'abacaxi',
      letters: ['A', 'A', 'C', 'I', 'X', 'O', 'Q'],
      requiredLetter: 'A',
    })
    assert.notDeepEqual(await validate(repeatedLetters), [])
  })
})

describe('word status validation', () => {
  it('accepts ACCEPTED, REJECTED, and null', async () => {
    for (const status of ['ACCEPTED', 'REJECTED', null]) {
      const dto = Object.assign(new UpdateWordStatusDto(), { status })
      assert.deepEqual(await validate(dto), [])
    }
  })

  it('rejects invalid and missing statuses', async () => {
    for (const status of ['UNKNOWN', 1, undefined]) {
      const dto = Object.assign(new UpdateWordStatusDto(), { status })
      assert.notDeepEqual(await validate(dto), [])
    }
  })
})

describe('words service', () => {
  const challengeLetters = ['A', 'B', 'C', 'I', 'X', 'O', 'Q']
  const requiredLetter = 'A'

  async function createService(word: string | null = 'abacaxi') {
    let storedStatus: 'ACCEPTED' | 'REJECTED' | null = null
    const addedWords: Array<{
      word: string
      status: 'ACCEPTED' | 'REJECTED' | null
    }> = []
    const prisma = {
      word: {
        findUnique: async ({ where }: { where: { word: string } }) => {
          const existing = addedWords.find((item) => item.word === where.word)
          if (existing) return { word: existing.word }
          return word && word === where.word
            ? { word, status: storedStatus }
            : null
        },
        findMany: async ({ where }: { where: { userAdded?: boolean } }) =>
          where.userAdded ? addedWords : [],
        create: async ({
          data,
        }: {
          data: { word: string; userAdded: boolean }
        }) => {
          if (addedWords.some((item) => item.word === data.word)) {
            throw { code: 'P2002' }
          }
          const created = { word: data.word, status: null as const }
          addedWords.push(created)
          return created
        },
        update: async ({
          data,
        }: {
          data: { status: 'ACCEPTED' | 'REJECTED' | null }
        }) => {
          if (!word) throw { code: 'P2025' }
          storedStatus = data.status
          return { word, status: storedStatus }
        },
      },
    }
    return {
      service: new WordsService(prisma as unknown as PrismaService),
      addedWords,
    }
  }

  it('creates a normalized word in the existing dictionary and lists added words', async () => {
    const { service, addedWords } = await createService(null)

    assert.deepEqual(
      await service.create(
        '  AÇAÍ  ',
        ['A', 'Ç', 'I', 'X', 'O', 'Q', 'Z'],
        'A',
      ),
      {
        word: 'açaí',
        status: null,
      },
    )
    assert.deepEqual(addedWords, [{ word: 'açaí', status: null }])
    assert.deepEqual(await service.findAdded(), addedWords)
  })

  it('rejects duplicate words and handles unique-index races', async () => {
    const { service } = await createService()

    await assert.rejects(
      service.create(' ABACAXI ', challengeLetters, requiredLetter),
      { status: 409 },
    )
    await service.create('baba', challengeLetters, requiredLetter)
    await assert.rejects(
      service.create('BABA', challengeLetters, requiredLetter),
      { status: 409 },
    )

    const prisma = {
      word: {
        findUnique: async () => null,
        create: async () => {
          throw { code: 'P2002' }
        },
      },
    }
    const racingService = new WordsService(prisma as unknown as PrismaService)
    await assert.rejects(
      racingService.create('abacaxi', challengeLetters, requiredLetter),
      { status: 409 },
    )
  })

  it('rejects words that do not match the submitted puzzle', async () => {
    const { service } = await createService(null)

    await assert.rejects(
      service.create('banana', challengeLetters, requiredLetter),
      /Essa palavra não pode ser formada com as letras selecionadas/,
    )
    await assert.rejects(
      service.create('abacaxi', challengeLetters, 'O'),
      /Essa palavra precisa conter a letra central/,
    )
    await assert.rejects(
      service.create('abc', challengeLetters, requiredLetter),
      /pelo menos 4 letras/,
    )
    await assert.rejects(
      service.create('abacaxi', challengeLetters.slice(0, 6), requiredLetter),
      /7 letras distintas/,
    )
  })

  it('returns unknown words and reports missing dictionary words as 404', async () => {
    const existing = await createService()
    assert.deepEqual(await existing.service.findOne('abacaxi'), {
      word: 'abacaxi',
      status: null,
    })

    const missing = await createService(null)
    await assert.rejects(missing.service.findOne('inexistente'), {
      status: 404,
    })
  })

  it('updates to ACCEPTED, REJECTED, and unknown', async () => {
    const { service } = await createService()

    assert.deepEqual(await service.updateStatus('abacaxi', 'ACCEPTED'), {
      word: 'abacaxi',
      status: 'ACCEPTED',
    })
    assert.deepEqual(await service.updateStatus('abacaxi', 'REJECTED'), {
      word: 'abacaxi',
      status: 'REJECTED',
    })
    assert.deepEqual(await service.updateStatus('abacaxi', null), {
      word: 'abacaxi',
      status: null,
    })
  })
})
