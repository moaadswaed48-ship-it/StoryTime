import { useCallback, useEffect, useState } from 'react'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import type { AccessSnapshot } from '@/data/types'

/** The signed-in user's trial and passes, with loading and error states and a reload. */
export function useAccess() {
  const [access, setAccess] = useState<AccessSnapshot | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAccess(await (await getApi()).getAccess())
    } catch (e) {
      setError(codeOf(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => void reload(), [reload])
  return { access, error, loading, reload }
}
