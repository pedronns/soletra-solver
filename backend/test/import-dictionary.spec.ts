import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { importDictionaryLines } from '../src/words/import-dictionary'
import { normalizeWord } from '../src/words/word-normalization'

async function* linesOf(...lines: string[]): AsyncIterable<string> {
  yield* lines
}

describe('dictionary importer', () => {
  it('processes a 255,781-line dictionary in bounded batches', async () => {
    async function* dictionary(): AsyncIterable<string> {
      for (let index = 0; index < 255_781; index += 1) {
        yield `palavra${index}`
      }
    }

    let batches = 0
    let largestBatch = 0
    const result = await importDictionaryLines(dictionary(), async (words) => {
      batches += 1
      largestBatch = Math.max(largestBatch, words.length)
      return { count: words.length }
    })

    assert.deepEqual(result, { inserted: 255_781, skipped: 0 })
    assert.equal(batches, 256)
    assert.equal(largestBatch, 1000)
  })

  it('normalizes words, ignores blank lines and batches inserts', async () => {
    const batches: string[][] = []
    const inserted = new Set<string>()
    const result = await importDictionaryLines(
      linesOf('  Açaí ', '', 'ABACAXI', 'açaí', ' maçã '),
      async (words) => {
        batches.push(words)
        let count = 0
        for (const word of words) {
          if (inserted.has(word)) continue
          inserted.add(word)
          count += 1
        }
        return { count }
      },
      2,
    )

    assert.deepEqual(batches, [['açaí', 'abacaxi'], ['açaí', 'maçã']])
    assert.deepEqual(result, { inserted: 3, skipped: 1 })
  })

  it('leaves existing classifications untouched by using insert-only batches', async () => {
    const stored = new Map([['abacaxi', 'ACCEPTED']])
    const result = await importDictionaryLines(
      linesOf('abacaxi', 'novo'),
      async (words) => {
        let count = 0
        for (const word of words) {
          if (stored.has(word)) continue
          stored.set(word, null)
          count += 1
        }
        return { count }
      },
    )

    assert.deepEqual(result, { inserted: 1, skipped: 1 })
    assert.equal(stored.get('abacaxi'), 'ACCEPTED')
    assert.equal(stored.get('novo'), null)
  })

  it('preserves canonical Unicode accents and cedilla when normalizing', () => {
    assert.equal(normalizeWord('  AÇÃO  '), 'ação')
    assert.equal(normalizeWord('ac\u0327a\u0303o'), 'ação')
    assert.notEqual(normalizeWord('ação'), normalizeWord('acao'))
  })
})
