import { z } from 'zod'

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'hex colour like #2b4c7e')
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{2,48}$/, 'lowercase slug')

export const PATTERNS = ['dots', 'stripes', 'stars', 'waves', 'none'] as const
export const MOTIFS = ['moon', 'boat', 'tree', 'fox', 'kite', 'lighthouse', 'umbrella', 'cloud', 'star', 'garden', 'thunder', 'yawn'] as const

export const BookSchema = z
  .object({
    id: slug,
    title: z.string().min(1).max(40),
    author: z.string().min(1).max(60),
    illustrator: z.string().min(1).max(60).optional(),
    lang: z.literal('en'),
    dir: z.literal('ltr'),
    ageRange: z.tuple([z.number().int().min(0).max(12), z.number().int().min(0).max(12)]),
    pages: z.number().int().min(8).max(80),
    readingTime: z.string().min(1).max(12),
    price: z.object({ amount: z.number().int().positive(), currency: z.literal('USD') }),
    tags: z.array(z.string().regex(/^[a-z-]+$/)).min(1).max(4),
    cover: z.object({
      palette: z.object({ bg: hex, ink: hex, accent: hex }),
      pattern: z.enum(PATTERNS),
      motif: z.enum(MOTIFS),
      titleFace: z.enum(['accent', 'sans']),
      image: z.string().nullable(),
    }),
    blurb: z.string().min(40).max(260),
    firstPage: z.object({
      heading: z.string().min(1).max(80),
      text: z.string().min(300).max(1400),
      image: z.string().nullable(),
    }),
    featured: z.boolean(),
    isNew: z.boolean(),
    order: z.number().int().min(1),
    placeholder: z.boolean(),
  })
  .strict()

export const CatalogSchema = z
  .object({ version: z.literal(1), books: z.array(BookSchema).min(1).max(60) })
  .strict()
  .superRefine((cat, ctx) => {
    const ids = new Set<string>()
    const orders = new Set<number>()
    let featured = 0
    cat.books.forEach((b, i) => {
      if (ids.has(b.id)) ctx.addIssue({ code: 'custom', path: ['books', i, 'id'], message: `duplicate id "${b.id}"` })
      ids.add(b.id)
      if (orders.has(b.order)) ctx.addIssue({ code: 'custom', path: ['books', i, 'order'], message: `duplicate order ${b.order}` })
      orders.add(b.order)
      if (b.ageRange[0] >= b.ageRange[1]) ctx.addIssue({ code: 'custom', path: ['books', i, 'ageRange'], message: 'min age must be below max age' })
      if (b.featured) featured++
    })
    if (featured !== 1) ctx.addIssue({ code: 'custom', path: ['books'], message: `exactly one book must be featured (found ${featured})` })
  })

export type Book = z.infer<typeof BookSchema>
export type Catalog = z.infer<typeof CatalogSchema>
