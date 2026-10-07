import 'dotenv/config'
import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { importDictionaryLines } from '../src/words/import-dictionary'

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL must be configured')
  }

  const configuredDictionaryPath = process.env.DICTIONARY_PATH?.trim()
  const dictionaryPath = configuredDictionaryPath
    ? resolve(configuredDictionaryPath)
    : resolve(__dirname, '../../frontend/lib/dicionario.txt')
  const input = createReadStream(dictionaryPath, { encoding: 'utf8' })
  const lines = createInterface({ input, crlfDelay: Infinity })
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })

  try {
    const imported = await importDictionaryLines(
      lines,
      (words) => {
        const updatedAt = new Date()
        return prisma.word.createMany({
          data: words.map((word) => ({ word, updatedAt })),
          skipDuplicates: true,
        })
      },
    )
    console.info(
      `Importação concluída: ${imported.inserted} palavras inseridas; ${imported.skipped} palavras duplicadas ignoradas.`,
    )
  } finally {
    input.destroy()
    lines.close()
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error('Falha ao importar o dicionário:', error)
  process.exitCode = 1
})
