/**
 * Build-time settings read from the environment, so the same code builds the preview and the launch site.
 *   BASE_PATH    where the site is served from: "/StoryTime/next/" for the GitHub Pages preview, "/" at launch.
 *   SITE_ORIGIN  scheme and host used in canonical and hreflang links (no trailing slash).
 *   NOINDEX=1    adds <meta name="robots" content="noindex"> to every page (the preview must not be indexed).
 * A build without a real SITE_ORIGIN (unset, or the placeholder below) never invites crawling: it is treated as
 * NOINDEX=1 (robots.txt disallows everything, every page says noindex). A launch build (Supabase configured) with
 * the placeholder and without NOINDEX=1 is refused outright in vite.config.ts (review 26 Nov, finding 8).
 */
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}

function normaliseBase(raw: string | undefined): string {
  const v = (raw ?? '/').trim()
  if (!v || v === '/') return '/'
  return `/${v.replace(/^\/+|\/+$/g, '')}/`
}

export const basePath = normaliseBase(env.BASE_PATH)
/** Placeholder origin until the launch domain is chosen (the GitHub Pages preview); set SITE_ORIGIN for any real build. */
export const PLACEHOLDER_ORIGIN = 'https://moaadswaed48-ship-it.github.io'
export const siteOrigin = (env.SITE_ORIGIN?.trim() || PLACEHOLDER_ORIGIN).replace(/\/+$/, '')
/** No real address yet: SITE_ORIGIN unset or still the placeholder. */
export const originIsPlaceholder = siteOrigin === PLACEHOLDER_ORIGIN
export const noIndexAsked = env.NOINDEX === '1'
/** Hidden from search engines: asked for (NOINDEX=1), or no real address to invite them to. */
export const noIndex = noIndexAsked || originIsPlaceholder
/** Lab test pages (/lab/*) exist only in the dev server, or when LAB=1 is set for a local check. */
export const withLab = env.LAB === '1' || env.NODE_ENV !== 'production'
