import { backendKind, getApi } from '@/data'
import type { OwnerApi } from './api'

/**
 * The owner's data layer, on the same backend as the rest of the site (src/data/index.ts). Loaded only by the
 * owner's area, as its own chunk.
 */
let api: Promise<OwnerApi> | null = null
export function getOwnerApi(): Promise<OwnerApi> {
  if (!api) {
    api = backendKind === 'supabase'
      ? Promise.all([getApi(), import('./supabase')]).then(([base, m]) => new m.SupabaseOwnerApi((base as unknown as { sb: ConstructorParameters<typeof m.SupabaseOwnerApi>[0] }).sb))
      : Promise.all([import('./local'), import('./blobs'), import('@/data/local/server')]).then(
          ([m, b, s]) => new m.LocalOwnerApi(new m.LocalOwnerServer(s.browserKv(), b.indexedDbBlobs()), async () => (await (await getApi()).getSession())?.userId ?? null),
        )
    api.catch(() => void (api = null))
  }
  return api
}

export { OwnerError, ownerCodeOf, type OwnerApi, type OwnerErrorCode } from './api'
export * from './types'
