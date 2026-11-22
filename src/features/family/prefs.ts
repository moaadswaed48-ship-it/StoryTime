import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/features/account/session'

/**
 * Reading and film settings, remembered per account on this device (localStorage, keyed by the account id).
 * NOT yet across devices: that needs a settings column on `profiles` (a migration, noted in docs/HANDOFF.md).
 */
export type Prefs = {
  /** While listening, turn the page when its recording ends. On by default (owner's request G2). */
  autoFlip: boolean
  /** Film captions shown (in the language of the voice). On by default. */
  captions: boolean
  /** Index into TEXT_SCALES (src/reader/zone.ts). */
  textScale: number
  /** How the library shows the books; null = decided by the device (list when motion is reduced). */
  view: 'shelf' | 'list' | null
  /** The four-doors hint was dismissed. */
  hintSeen: boolean
}
export const DEFAULT_PREFS: Prefs = { autoFlip: true, captions: true, textScale: 0, view: null, hintSeen: false }

const key = (accountId: string) => `storytime.prefs.${accountId}`
const listeners = new Set<() => void>()

export function readPrefs(accountId: string | null): Prefs {
  if (!accountId) return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(key(accountId))
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function writePrefs(accountId: string | null, patch: Partial<Prefs>) {
  if (!accountId) return
  try {
    localStorage.setItem(key(accountId), JSON.stringify({ ...readPrefs(accountId), ...patch }))
  } catch {
    /* private mode: the choice lasts for this page only */
  }
  for (const l of listeners) l()
}

/** The signed-in account's settings, and a setter that saves at once. */
export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const session = useSession()
  const id = session.status === 'signed-in' ? session.session.userId : null
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs(id))
  useEffect(() => {
    const sync = () => setPrefs(readPrefs(id))
    sync()
    listeners.add(sync)
    return () => void listeners.delete(sync)
  }, [id])
  const set = useCallback((patch: Partial<Prefs>) => writePrefs(id, patch), [id])
  return [prefs, set]
}

/** True when the visitor asked for less motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const q = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!q) return
    const on = () => setReduced(q.matches)
    on()
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])
  return reduced
}
