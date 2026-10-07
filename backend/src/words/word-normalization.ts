export function normalizeWord(value: string): string {
  return value.trim().normalize('NFC').toLowerCase().normalize('NFC')
}
