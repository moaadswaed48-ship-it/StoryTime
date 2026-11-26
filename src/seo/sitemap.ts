/**
 * sitemap.xml and robots.txt, written at build time by scripts/postbuild.mjs from the same list of public pages
 * that is pre-rendered (paths.ts), so the three never disagree. Pure functions (unit-tested in tests/launch.test.ts).
 */
import { LANGS } from '../i18n/config.ts'
import { absoluteUrl, alternates, localPath, PUBLIC_PAGES } from './paths.ts'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * One <url> per public page and language, each listing every language version and x-default (the same list on all
 * four, which makes the links reciprocal, as Google asks). The language picker at "/" only redirects, so it is not
 * listed itself; it is the landing pages' x-default. No dates: the build has no honest "last changed" date per page.
 */
export function sitemapXml(origin: string, base: string): string {
  const urls = PUBLIC_PAGES.flatMap((page) =>
    LANGS.map((lang) => {
      const links = alternates(origin, base, page).map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hrefLang}" href="${esc(a.href)}"/>`)
      return `  <url>\n    <loc>${esc(absoluteUrl(origin, base, localPath(lang, page)))}</loc>\n${links.join('\n')}\n  </url>`
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
}

/**
 * Preview (noindex): nothing may be crawled. Launch: everything public may be; the signed-in app and the email-link
 * pages hold nothing to index (they are also noindex), and the sitemap is named.
 */
export function robotsTxt(origin: string, base: string, noIndex: boolean): string {
  if (noIndex) return 'User-agent: *\nDisallow: /\n'
  const b = base.replace(/\/+$/, '')
  return [
    'User-agent: *',
    `Allow: ${b}/`,
    ...LANGS.flatMap((l) => [`Disallow: ${b}/${l}/app/`, `Disallow: ${b}/${l}/auth/`]),
    '',
    `Sitemap: ${absoluteUrl(origin, base, '/sitemap.xml')}`,
    '',
  ].join('\n')
}
