import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOCAL_DB_KEY } from '@/data'
import { DB_KEY } from '@/data/local/server'
import { PRICES } from '@/data/prices'

/**
 * The public home and plans pages read prices without downloading the data backend (src/data/public-prices.ts,
 * integration of 26 Nov 2026). Test mode: the owner's prices from this browser's store. Supabase: one plain request
 * with the publishable key (proven against the real grants in tests/db/public-prices.test.ts). Nothing invented.
 */
function fakeStorage(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init))
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size } }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('public prices in test mode (no backend download)', () => {
  it('reads the same store key as the local backend', () => {
    expect(LOCAL_DB_KEY).toBe(DB_KEY)
  })

  it('no store in this browser: all nine passes, every price not set', async () => {
    vi.stubGlobal('localStorage', fakeStorage())
    const { loadPublicPrices } = await import('@/data/public-prices')
    expect(await loadPublicPrices()).toEqual(PRICES)
  })

  it('shows exactly the prices the owner set, the rest stay not set; junk is ignored, never shown as a price', async () => {
    vi.stubGlobal('localStorage', fakeStorage({
      [DB_KEY]: JSON.stringify({ version: 1, prices: [
        { ageGroup: '4-5', months: 3, priceAgorot: 4990 },
        { ageGroup: '6-8', months: 1, priceAgorot: 'free' },
        { ageGroup: '2-3', months: 12, priceAgorot: -5 },
        { ageGroup: '9-12', months: 1, priceAgorot: 100 },
      ] }),
    }))
    const { loadPublicPrices } = await import('@/data/public-prices')
    const list = await loadPublicPrices()
    expect(list).toHaveLength(PRICES.length)
    expect(list.filter((p) => p.priceAgorot !== null)).toEqual([{ ageGroup: '4-5', months: 3, priceAgorot: 4990 }])
  })

  it('a broken or older store, or storage that throws: nothing set, no error', async () => {
    vi.stubGlobal('localStorage', fakeStorage({ [DB_KEY]: '{not json' }))
    let m = await import('@/data/public-prices')
    expect(await m.loadPublicPrices()).toEqual(PRICES)
    vi.resetModules()
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') } })
    m = await import('@/data/public-prices')
    expect(await m.loadPublicPrices()).toEqual(PRICES)
  })
})

describe('public prices with Supabase (no Supabase client)', () => {
  const supabase = async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.test/')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test')
    return import('@/data/public-prices')
  }

  it('asks pass_prices once with only the publishable key, and maps the rows', async () => {
    const { loadPublicPrices } = await supabase()
    const fetcher = vi.fn(async () => new Response(JSON.stringify([{ age_group: '6-8', months: 12, price_agorot: 29900 }, { age_group: '2-3', months: 1, price_agorot: null }]), { status: 200 }))
    const list = await loadPublicPrices(fetcher as unknown as typeof fetch)
    expect(fetcher).toHaveBeenCalledOnce()
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://project.supabase.test/rest/v1/pass_prices?select=age_group,months,price_agorot')
    expect(init.headers).toEqual({ apikey: 'sb_publishable_test', accept: 'application/json' })
    expect(list.filter((p) => p.priceAgorot !== null)).toEqual([{ ageGroup: '6-8', months: 12, priceAgorot: 29900 }])
    expect(list).toHaveLength(PRICES.length)
  })

  it('a failed request is an error (the page keeps its static "Price not set yet"), never a made-up price', async () => {
    const { loadPublicPrices } = await supabase()
    await expect(loadPublicPrices((async () => new Response('down', { status: 503 })) as unknown as typeof fetch)).rejects.toThrow(/network/)
    await expect(loadPublicPrices((async () => new Response('{}', { status: 401 })) as unknown as typeof fetch)).rejects.toThrow(/unknown/)
  })
})
