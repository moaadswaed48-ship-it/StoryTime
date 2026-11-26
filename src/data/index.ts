import type { DataApi } from './api'

/**
 * Picks the backend once per page load. With VITE_SUPABASE_URL and a publishable key set at build time it is
 * Supabase; otherwise the local test-mode backend (accounts kept only in this browser, nothing charged), and the
 * screens say so. Each backend is its own chunk, loaded only by the pages that need data.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined
export const backendKind: DataApi['kind'] = url && key ? 'supabase' : 'local'
/** The Supabase address and publishable key, both public by design; null in test mode. */
export const supabaseSettings: { url: string; key: string } | null = backendKind === 'supabase' ? { url: url!, key: key! } : null
/** The test-mode store in this browser: the same key as `DB_KEY` in local/server.ts (tests/public-prices.test.ts). */
export const LOCAL_DB_KEY = 'storytime.local.v1'

let api: Promise<DataApi> | null = null
let ready: DataApi | null = null
const loaded = new Set<(a: DataApi) => void>()
export function getApi(): Promise<DataApi> {
  if (!api) {
    const linkBase = typeof location === 'undefined' ? '/' : `${location.origin}${import.meta.env.BASE_URL}`
    api = backendKind === 'supabase'
      ? import('./supabase/index.ts').then((m) => new m.SupabaseApi(url!, key!, linkBase))
      : import('./local/index.ts').then((m) => new m.LocalApi())
    api.then((a) => {
      ready = a
      loaded.forEach((fn) => fn(a))
    }, () => {})
    // A failed load (offline before the code arrived) is not kept: the next call tries again.
    api.catch(() => void (api = null))
  }
  return api
}

/** Calls `fn` once the backend is loaded by anyone (now, if it already is), without starting the load itself. */
export function whenApiLoaded(fn: (a: DataApi) => void): () => void {
  loaded.add(fn)
  if (ready) fn(ready)
  return () => void loaded.delete(fn)
}

/**
 * Whether this browser may hold a session: the test-mode store (`LOCAL_DB_KEY`) or a Supabase sign-in
 * token (`sb-<project>-auth-token`) is in localStorage. When neither is, a public page can settle as signed out
 * without downloading the backend at all (the header is the only thing that asks). Unreadable storage: assume yes.
 */
export function mayHaveSession(): boolean {
  try {
    if (typeof localStorage === 'undefined') return true
    if (backendKind === 'local') return localStorage.getItem(LOCAL_DB_KEY) !== null
    for (let i = 0; i < localStorage.length; i++) if (/^sb-.+-auth-token/.test(localStorage.key(i) ?? '')) return true
    return false
  } catch {
    return true
  }
}

export type { DataApi } from './api'
export { DataError, codeOf, type ErrorCode } from './errors'
export * from './types'
