import type { DataApi } from './api'

/**
 * Picks the backend once per page load. With VITE_SUPABASE_URL and a publishable key set at build time it is
 * Supabase; otherwise the local test-mode backend (accounts kept only in this browser, nothing charged), and the
 * screens say so. Each backend is its own chunk, loaded only by the pages that need data.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined
export const backendKind: DataApi['kind'] = url && key ? 'supabase' : 'local'

let api: Promise<DataApi> | null = null
export function getApi(): Promise<DataApi> {
  if (!api) {
    const linkBase = typeof location === 'undefined' ? '/' : `${location.origin}${import.meta.env.BASE_URL}`
    api = backendKind === 'supabase'
      ? import('./supabase/index.ts').then((m) => new m.SupabaseApi(url!, key!, linkBase))
      : import('./local/index.ts').then((m) => new m.LocalApi())
  }
  return api
}

export type { DataApi } from './api'
export { DataError, codeOf, type ErrorCode } from './errors'
export * from './types'
