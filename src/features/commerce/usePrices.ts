import { useCallback, useEffect, useState } from 'react'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import type { Price } from '@/data/types'

/**
 * The live price list from the backend (in Supabase: the pass_prices table that create_order charges from), so
 * the summary before paying shows the price that is charged (review finding R8). The pre-rendered public plans
 * page keeps the static list in src/data/prices.ts; tests/db/review-fixes.test.ts checks it matches the database.
 */
export function usePrices() {
  const [prices, setPrices] = useState<Price[] | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const reload = useCallback(async () => {
    setError(null)
    try {
      setPrices(await (await getApi()).listPrices())
    } catch (e) {
      setError(codeOf(e))
    }
  }, [])
  useEffect(() => void reload(), [reload])
  return { prices, error, reload }
}
