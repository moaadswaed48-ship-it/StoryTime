import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { anon, freshDb, rows, signUp, user } from './harness'

/**
 * The public pages' price request (src/data/public-prices.ts, Supabase path) against the real grants and row-level
 * security in PGlite. A tiny stand-in for PostgREST answers GET /rest/v1/pass_prices as the signed-out role (anon),
 * which is what a request carrying only the publishable key runs as. Proves a visitor sees a price the owner set
 * with owner_set_price(), and "not set" again once she removes it.
 */
let db: PGlite
let owner: string
let loadPublicPrices: (f?: typeof fetch) => Promise<{ ageGroup: string; months: number; priceAgorot: number | null }[]>

const postgrest = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = new URL(String(input))
  const headers = (init?.headers ?? {}) as Record<string, string>
  if (headers.apikey !== 'sb_publishable_test' || headers.authorization) return new Response('{}', { status: 401 })
  if (url.pathname !== '/rest/v1/pass_prices' || url.searchParams.get('select') !== 'age_group,months,price_agorot') return new Response('{}', { status: 404 })
  try {
    return new Response(JSON.stringify(await rows(db, anon, 'select age_group, months, price_agorot from public.pass_prices')), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ message: (e as Error).message }), { status: 401 })
  }
}) as typeof fetch

beforeAll(async () => {
  db = await freshDb()
  owner = await signUp(db, 'owner-prices@example.test')
  await db.query(`update profiles set role = 'owner' where id = $1`, [owner])
  vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.test')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test')
  vi.resetModules()
  loadPublicPrices = (await import('@/data/public-prices')).loadPublicPrices
}, 180_000)

afterAll(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('public prices through the signed-out role (Supabase path)', () => {
  it('nothing set: nine passes, every price null', async () => {
    const list = await loadPublicPrices(postgrest)
    expect(list).toHaveLength(9)
    expect(list.every((p) => p.priceAgorot === null)).toBe(true)
  })

  it('a price the owner sets shows to a visitor; removing it shows "not set" again', async () => {
    await rows(db, user(owner), `select owner_set_price('4-5', 3, 4990)`)
    expect((await loadPublicPrices(postgrest)).filter((p) => p.priceAgorot !== null)).toEqual([{ ageGroup: '4-5', months: 3, priceAgorot: 4990 }])
    await rows(db, user(owner), `select owner_set_price('4-5', 3, null)`)
    expect((await loadPublicPrices(postgrest)).every((p) => p.priceAgorot === null)).toBe(true)
  })
})
