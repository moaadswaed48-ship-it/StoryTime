import { useEffect, useState } from 'react'

/** Portrait phones (and small portrait tablets): the picture card sits on top and the text below it. */
export const STACK_QUERY = '(max-width: 900px) and (orientation: portrait)'
/** Short landscape screens (phones on their side): the picture on one side, the author's text in a column beside it. */
export const SIDE_QUERY = '(max-height: 600px) and (orientation: landscape)'

export function useMedia(query: string): boolean {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setOn(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [query])
  return on
}

export interface Lagged<T> {
  cur: { v: T; k: string }
  /** The value that was shown before, kept for `ms` so it can fade out over the new one. */
  prev: { v: T; k: string } | null
}

/** Cross-fade helper: when `key` changes, the old value stays around for `ms`. */
export function useLagged<T>(value: T, key: string, ms = 260): Lagged<T> {
  const [st, setSt] = useState<Lagged<T>>({ cur: { v: value, k: key }, prev: null })
  if (st.cur.k !== key) setSt({ cur: { v: value, k: key }, prev: st.cur })
  useEffect(() => {
    if (!st.prev) return
    const id = window.setTimeout(() => setSt((s) => (s.prev ? { cur: s.cur, prev: null } : s)), ms)
    return () => window.clearTimeout(id)
  }, [st.prev, ms])
  return { cur: { v: value, k: key }, prev: st.cur.k === key ? st.prev : st.cur }
}
