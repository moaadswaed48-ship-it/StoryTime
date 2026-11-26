import type { MetaDescriptor } from 'react-router'
import type { Lang } from '@/i18n/config'
import type { LangData } from '@/i18n/use-dict'
import { absoluteUrl, alternates, localPath } from './paths'

const base = import.meta.env.BASE_URL

/** Title, description, canonical and reciprocal hreflang for a pre-rendered public page. */
export function pageMeta(o: { lang: Lang; page: string; title: string; description: string; siteName: string }): MetaDescriptor[] {
  const canonical = absoluteUrl(__SITE_ORIGIN__, base, localPath(o.lang, o.page))
  return [
    { title: o.page ? `${o.title} · ${o.siteName}` : `${o.siteName} · ${o.title}` },
    { name: 'description', content: o.description },
    { tagName: 'link', rel: 'canonical', href: canonical },
    ...alternates(__SITE_ORIGIN__, base, o.page).map((a) => ({ tagName: 'link', rel: 'alternate', hrefLang: a.hrefLang, href: a.href })),
  ]
}

/**
 * Structured data for a language's home page: only what is true of the site today (its name, address and language).
 * No organisation details, prices, ratings or reviews: the business details are not set and nothing is sold yet.
 */
export function websiteJsonLd(lang: Lang, siteName: string): MetaDescriptor {
  return {
    'script:ld+json': {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: absoluteUrl(__SITE_ORIGIN__, base, localPath(lang)),
      inLanguage: lang,
    },
  }
}

/**
 * Pages that must never be indexed (the signed-in app, the lab). In a NOINDEX build the root layout already puts
 * a site-wide robots tag on every page, so none is added here.
 */
export const privateMeta = (title: string): MetaDescriptor[] => [{ title }, ...(__NOINDEX__ ? [] : [{ name: 'robots', content: 'noindex' }])]

/** The `/:lang` layout's data, as seen from a child route's `meta` function. */
export function langData(matches: ReadonlyArray<{ id: string; loaderData?: unknown } | undefined>): LangData | undefined {
  return matches.find((m) => m?.id === 'lang')?.loaderData as LangData | undefined
}
