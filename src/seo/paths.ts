/**
 * Public URLs: one per language and page, always with a trailing slash (both GitHub Pages and Cloudflare serve
 * `/ar/index.html` at `/ar/`, so this is the form that never redirects). Pure functions, also used by
 * react-router.config.ts at build time.
 */
import { FALLBACK, LANGS, type Lang } from '../i18n/config.ts'

export const LEGAL_DOCS = ['terms', 'privacy'] as const
export type LegalDoc = (typeof LEGAL_DOCS)[number]
export const isLegalDoc = (v: unknown): v is LegalDoc => typeof v === 'string' && (LEGAL_DOCS as readonly string[]).includes(v)

/** Pages that exist in every language and are pre-rendered ('' is the language's landing page). */
export const PUBLIC_PAGES = ['', 'plans', 'sign-in', 'sign-up', ...LEGAL_DOCS.map((d) => `legal/${d}`)] as const
export type PublicPage = (typeof PUBLIC_PAGES)[number]

/** Router paths to pre-render. The signed-in app (/:lang/app/*) and the lab are never in this list. */
export function prerenderPaths(): string[] {
  return ['/', ...LANGS.flatMap((l) => PUBLIC_PAGES.map((p) => (p ? `/${l}/${p}` : `/${l}`)))]
}

/** Path inside the site (no base path): `/ar/`, `/ar/plans/`. */
export const localPath = (lang: Lang, page: string = '') => `/${lang}/${page ? `${page.replace(/^\/+|\/+$/g, '')}/` : ''}`

/** Absolute URL of a local path, given the site origin and the base path the site is served from. */
export const absoluteUrl = (origin: string, base: string, path: string) => `${origin.replace(/\/+$/, '')}${base.replace(/\/+$/, '')}${path}`

export type Alternate = { hrefLang: string; href: string }

/**
 * Reciprocal hreflang links for a page: one per language plus x-default. Every language version of a page
 * returns the same list, which is what makes the links reciprocal. x-default is the language picker at `/`
 * for the landing page, and the fallback language (Arabic) for every other page.
 */
export function alternates(origin: string, base: string, page: string = ''): Alternate[] {
  const list = LANGS.map((l) => ({ hrefLang: l, href: absoluteUrl(origin, base, localPath(l, page)) }))
  const xDefault = page ? absoluteUrl(origin, base, localPath(FALLBACK, page)) : absoluteUrl(origin, base, '/')
  return [...list, { hrefLang: 'x-default', href: xDefault }]
}
