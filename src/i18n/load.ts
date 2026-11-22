import type { Lang } from './config'
import type { Dict } from './schema'

/** One chunk per language: a visitor downloads only the language they read. */
const loaders: Record<Lang, () => Promise<{ default: Dict }>> = {
  ar: () => import('./ar/index.ts'),
  he: () => import('./he/index.ts'),
  en: () => import('./en/index.ts'),
  da: () => import('./da/index.ts'),
}

const cache = new Map<Lang, Promise<Dict>>()
export function loadDict(lang: Lang): Promise<Dict> {
  let p = cache.get(lang)
  if (!p) {
    p = loaders[lang]().then((m) => m.default)
    cache.set(lang, p)
  }
  return p
}
