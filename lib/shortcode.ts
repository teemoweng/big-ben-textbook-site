// Excludes 0/O/1/I to avoid visual confusion
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateShortCode(): string {
  return Array.from(
    { length: 5 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}
