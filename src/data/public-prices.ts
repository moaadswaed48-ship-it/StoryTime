import { DataError } from './errors'
import { LOCAL_DB_KEY, backendKind, supabaseSettings } from './index'
import { PRICES } from './prices'
import { type Price } from './types'

/**
 * The pass prices for the public pages (home and plans) WITHOUT downloading the data backend, which is the largest
 * download a visitor's page would otherwise make (launch-readiness review, 26 Nov 2026):
 * - Supabase: one plain request to the pass_prices table, which signed-out visitors may read (tests/db/catalogue).
 *   Only the publishable key is sent, in the `apikey` header; no sign-in, no Supabase client.
 * - Test mode: the prices the owner set in this browser's test store (`prices` in local/server.ts's LocalDb),
 *   the same list `LocalServer.listPrices()` gives. No store: nothing is set.
 * Always the nine passes in the fixed order of src/data/prices.ts; a pass with no usable price stays null, shown as
 * "Price not set yet". Nothing here ever makes up a price.
 */
export async function loadPublicPrices(fetcher: typeof fetch = fetch): Promise<Price[]> {
  if (backendKind === 'supabase' && supabaseSettings) return fromSupabase(supabaseSettings, fetcher)
  return fromLocalStore()
}

type Row = { ageGroup: unknown; months: unknown; priceAgorot: unknown }

/** The fixed list of nine passes, each with the price found for it in `rows`, or null. */
export function mergePrices(rows: readonly Row[]): Price[] {
  return PRICES.map((p) => {
    const v = rows.find((r) => r.ageGroup === p.ageGroup && r.months === p.months)?.priceAgorot
    return { ...p, priceAgorot: typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null }
  })
}

function fromLocalStore(): Price[] {
  let raw: string | null = null
  try {
    raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(LOCAL_DB_KEY)
  } catch {
    raw = null
  }
  if (!raw) return mergePrices([])
  try {
    const db = JSON.parse(raw) as { version?: unknown; prices?: unknown }
    return mergePrices(db?.version === 1 && Array.isArray(db.prices) ? (db.prices as Row[]) : [])
  } catch {
    return mergePrices([])
  }
}

async function fromSupabase(s: { url: string; key: string }, fetcher: typeof fetch): Promise<Price[]> {
  const res = await fetcher(`${s.url.replace(/\/+$/, '')}/rest/v1/pass_prices?select=age_group,months,price_agorot`, {
    headers: { apikey: s.key, accept: 'application/json' },
  })
  if (!res.ok) throw new DataError(res.status >= 500 ? 'network' : 'unknown', `pass_prices ${res.status}`)
  const rows = (await res.json()) as { age_group: unknown; months: unknown; price_agorot: unknown }[]
  if (!Array.isArray(rows)) throw new DataError('unknown', 'pass_prices: not a list')
  return mergePrices(rows.map((r) => ({ ageGroup: r.age_group, months: r.months, priceAgorot: r.price_agorot })))
}
