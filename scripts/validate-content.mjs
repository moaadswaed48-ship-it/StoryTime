// Validates content/books.json against the zod schema (runs in predev/prebuild).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { CatalogSchema } from '../src/content/schema.ts'

const file = fileURLToPath(new URL('../content/books.json', import.meta.url))
let raw
try {
  raw = JSON.parse(readFileSync(file, 'utf8'))
} catch (e) {
  console.error(`✖ content/books.json is not valid JSON: ${e.message}`)
  process.exit(1)
}
const result = CatalogSchema.safeParse(raw)
if (!result.success) {
  console.error('✖ content/books.json has problems:')
  for (const issue of result.error.issues) {
    console.error(`  • books${issue.path.length ? '.' + issue.path.join('.') : ''}: ${issue.message}`)
  }
  process.exit(1)
}
const books = result.data.books
const placeholders = books.filter((b) => b.placeholder).length
const words = (s) => s.trim().split(/\s+/).length
for (const b of books) {
  const w = words(b.firstPage.text)
  if (w < 80 || w > 300) console.warn(`  ! "${b.title}": first page is ${w} words (aim for 110–170)`)
}
console.log(`✔ content/books.json: ${books.length} books, ${placeholders} placeholder${placeholders === 1 ? '' : 's'} remaining`)
