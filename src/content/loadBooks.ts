import catalogJson from '../../content/books.json'
import siteJson from '../../content/site.json'
import { CatalogSchema, type Book } from './schema'

const parsed = import.meta.env.DEV ? CatalogSchema.parse(catalogJson) : (catalogJson as unknown as { books: Book[] })

export const books: Book[] = [...parsed.books].sort((a, b) => a.order - b.order)
export const bookById = new Map(books.map((b) => [b.id, b]))
export const featuredBook: Book = books.find((b) => b.featured) ?? books[0]
export const newBooks: Book[] = books.filter((b) => b.isNew)
export const site = siteJson
export type Site = typeof siteJson

export const AGE_BANDS = site.shelf.ageChips as { label: string; min: number; max: number }[]

export function matchesFilter(b: Book, f: { query: string; ages: [number, number] | null; tags: string[] }): boolean {
  if (f.ages && (b.ageRange[1] < f.ages[0] || b.ageRange[0] > f.ages[1])) return false
  if (f.tags.length && !f.tags.every((t) => b.tags.includes(t))) return false
  const q = f.query.trim().toLowerCase()
  if (q) {
    const hay = `${b.title} ${b.author} ${b.tags.join(' ')} ${b.blurb}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}
