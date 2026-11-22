/**
 * Build-time settings read from the environment, so the same code builds the preview and the launch site.
 *   BASE_PATH    where the site is served from: "/StoryTime/next/" for the GitHub Pages preview, "/" at launch.
 *   SITE_ORIGIN  scheme and host used in canonical and hreflang links (no trailing slash).
 *   NOINDEX=1    adds <meta name="robots" content="noindex"> to every page (the preview must not be indexed).
 */
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}

function normaliseBase(raw: string | undefined): string {
  const v = (raw ?? '/').trim()
  if (!v || v === '/') return '/'
  return `/${v.replace(/^\/+|\/+$/g, '')}/`
}

export const basePath = normaliseBase(env.BASE_PATH)
/** Placeholder origin until the launch domain is chosen; set SITE_ORIGIN for any real build. */
export const siteOrigin = (env.SITE_ORIGIN ?? 'https://moaadswaed48-ship-it.github.io').replace(/\/+$/, '')
export const noIndex = env.NOINDEX === '1'
/** Lab test pages (/lab/*) exist only in the dev server, or when LAB=1 is set for a local check. */
export const withLab = env.LAB === '1' || env.NODE_ENV !== 'production'
