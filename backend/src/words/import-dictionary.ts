import { normalizeWord } from './word-normalization'

export const DEFAULT_IMPORT_BATCH_SIZE = 1000

export type DictionaryInsert = (words: string[]) => Promise<{ count: number }>

export async function importDictionaryLines(
  lines: AsyncIterable<string>,
  insertWords: DictionaryInsert,
  batchSize = DEFAULT_IMPORT_BATCH_SIZE,
): Promise<{ inserted: number; skipped: number }> {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new RangeError('batchSize must be a positive integer')
  }

  let batch: string[] = []
  let inserted = 0
  let processed = 0

  const flush = async () => {
    if (batch.length === 0) return
    const result = await insertWords(batch)
    inserted += result.count
    processed += batch.length
    batch = []
  }

  for await (const line of lines) {
    const word = normalizeWord(line)
    if (!word) continue

    batch.push(word)
    if (batch.length === batchSize) {
      await flush()
    }
  }

  await flush()
  return { inserted, skipped: processed - inserted }
}
