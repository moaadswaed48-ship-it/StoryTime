import { useCallback, useEffect, useState } from 'react'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { loadPublicPrices } from '@/data/public-prices'
import type { Price } from '@/data/types'

/**
 * The live price list from the backend (in Supabase: the pass_prices table that create_order charges from), so
 * the summary before paying shows the price that is charged (review finding R8). For the signed-in pages, which
 * load the backend anyway. The public pages use `usePublicPrices`.
 */
export function usePrices() {
  return usePriceList(async () => (await getApi()).listPrices())
}

/**
 * The same prices for the public home and plans pages, read without downloading the data backend
 * (src/data/public-prices.ts). The pre-rendered HTML shows the static list (src/data/prices.ts: "Price not set yet");
 * once the page runs, the prices the owner set replace it. On a failed load the static list stays.
 */
export function usePublicPrices() {
  return usePriceList(() => loadPublicPrices())
}

function usePriceList(load: () => Promise<Price[]>) {
  const [prices, setPrices] = useState<Price[] | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const reload = useCallback(async () => {
    setError(null)
    try {
      setPrices(await load())
    } catch (e) {
      setError(codeOf(e))
    }
    // `load` is a fresh arrow on every render, but what it reads never changes during a page's life: load once.
  }, [])
  useEffect(() => void reload(), [reload])
  return { prices, error, reload }
}
