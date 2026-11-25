import type { Lang } from './config'
import type { LandingDict } from './landing-schema'

/**
 * The landing page's words, one chunk per language, loaded by the landing route only. They are kept out of the
 * shared dictionary (Dict) because that one is serialised into every page's HTML; this keeps the landing copy (and
 * its one story excerpt) on the landing page alone. Each file is checked with `satisfies LandingDict`, so a
 * missing key in any language still fails the type check.
 */
const loaders: Record<Lang, () => Promise<{ default: LandingDict }>> = {
  ar: () => import('./ar/landing.ts'),
  he: () => import('./he/landing.ts'),
  en: () => import('./en/landing.ts'),
  da: () => import('./da/landing.ts'),
}

export const loadLanding = (lang: Lang): Promise<LandingDict> => loaders[lang]().then((m) => m.default)
