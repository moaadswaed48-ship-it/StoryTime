import { useCallback, useEffect, useState } from 'react'
import { getApi } from '@/data'
import { cleanPrefs } from '@/data/types'
import { useSession } from '@/features/account/session'

/**
 * Reading and film settings, kept with the account (profiles.prefs, so they follow it to another device) and
 * cached on this device (localStorage, keyed by the account id) so the screens read them at once. When the account
 * loads, its saved settings are copied into the cache; a change is written to the cache at once and sent to the
 * account in the background (a failed send keeps the change on this device).
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
  /** Classroom mode (teacher accounts only; src/features/classroom/useClassroom.ts). Off by default. */
  classroom: boolean
}
export const DEFAULT_PREFS: Prefs = { autoFlip: true, captions: true, textScale: 0, view: null, hintSeen: false, classroom: false }

const key = (accountId: string) => `storytime.prefs.${accountId}`
const listeners = new Set<() => void>()
/** The account settings already copied into this device's cache, per account. */
const applied = new Map<string, string>()

export function readPrefs(accountId: string | null): Prefs {
  if (!accountId) return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(key(accountId))
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

/** Sends a change to the account (background; the cache already holds it). */
function pushPrefs(patch: Partial<Prefs>) {
  const clean = cleanPrefs(patch)
  if (!Object.keys(clean).length) return
  void getApi().then((a) => a.updateAccount({ prefs: clean })).catch(() => { /* kept on this device */ })
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
  const saved = session.status === 'signed-in' ? session.account?.prefs : undefined
  const savedKey = saved ? JSON.stringify(saved) : ''
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs(id))
  // The account's saved settings (from another device, or from before this cache) win once, when they load.
  // Applied once per loaded value, not on every screen that mounts (that would undo a change made since).
  useEffect(() => {
    if (!id || !savedKey || savedKey === '{}' || applied.get(id) === savedKey) return
    applied.set(id, savedKey)
    writePrefs(id, JSON.parse(savedKey) as Partial<Prefs>)
  }, [id, savedKey])
  useEffect(() => {
    const sync = () => setPrefs(readPrefs(id))
    sync()
    listeners.add(sync)
    return () => void listeners.delete(sync)
  }, [id])
  const set = useCallback((patch: Partial<Prefs>) => {
    writePrefs(id, patch)
    if (id) pushPrefs(patch)
  }, [id])
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
