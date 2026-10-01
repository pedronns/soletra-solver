import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function GET() {
  const dictionary = await readFile(join(process.cwd(), 'lib', 'dicionario.txt'), 'utf8')

  return new Response(dictionary, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}