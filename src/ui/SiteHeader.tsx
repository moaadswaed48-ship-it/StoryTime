import { Link, useLocation } from 'react-router'
import { useSession } from '@/features/account/session'
import { ENDONYM, LANGS, dirOf } from '@/i18n/config'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { TestModeBanner } from './Banners'

/**
 * Placeholder header: working name, the one menu of the site and the language switch. No visual design yet.
 * Signed out: Plans, Sign in, Create account. Signed in (once the session is known in the browser; pre-rendered
 * HTML is always the signed-out version): Library, Collections, Settings, Plans, and the owner's area for the owner.
 * This is the only menu: the app has no second bar. The page you are on is marked (aria-current), never hover-only.
 * The test-mode notice (local backend only) closes the header.
 */
export function SiteHeader() {
  const { lang, dict } = useLang()
  const { pathname } = useLocation()
  const session = useSession()
  const signedIn = session.status === 'signed-in'
  const owner = signedIn && session.account?.role === 'owner'
  const t = dict.common
  const here = pathname.replace(/\/+$/, '')
  const isHere = (page: string) => {
    const to = localPath(lang, page).replace(/\/+$/, '')
    return here === to || here.startsWith(`${to}/`)
  }
  const links: [string, string, boolean?][] = signedIn
    ? [
        ['app/library', t.nav.library],
        ['app/collections', t.nav.collections],
        ['app/settings', t.nav.settings],
        ['plans', t.nav.plans],
        ...(owner ? ([['app/owner', t.nav.owner]] as [string, string][]) : []),
      ]
    : [
        ['plans', t.nav.plans],
        ['sign-in', t.nav.signIn],
        ['sign-up', t.nav.signUp, true],
      ]
  return (
    <header className="border-b border-line bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:rounded-control focus:bg-ink focus:px-4 focus:py-3 focus:text-paper">
        {t.skipToContent}
      </a>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link to={localPath(lang)} className="me-auto inline-flex min-h-11 items-center rounded-control text-lg font-semibold">
          <bdi>{t.siteName}</bdi>
        </Link>
        <nav aria-label={t.menu} data-testid="main-menu" className="flex flex-wrap items-center gap-1">
          {links.map(([page, label, strong]) => {
            const current = isHere(page)
            return (
              <Link key={page} to={localPath(lang, page)} aria-current={current ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-control px-3 ${strong ? 'bg-ink text-paper' : 'hover:bg-line/50 aria-[current=page]:bg-ink aria-[current=page]:text-paper'}`}>
                {label}
              </Link>
            )
          })}
        </nav>
        <LanguageLinks label={t.language} className="w-full sm:w-auto" />
      </div>
      {/* Inside the header, so it sits in a landmark like everything else on the page (axe "region"). */}
      <TestModeBanner />
    </header>
  )
}

/** The same page in each of the four languages (header and footer). */
export function LanguageLinks({ label, className = '' }: { label: string; className?: string }) {
  const { lang } = useLang()
  const { pathname, search } = useLocation()
  // The same page in another language: swap the first segment.
  const page = pathname.split('/').slice(2).filter(Boolean).join('/')
  return (
    <nav aria-label={label} className={`flex flex-wrap gap-1 ${className}`}>
      {LANGS.map((l) => (
        <Link
          key={l}
          to={`${localPath(l, page)}${search}`}
          lang={l}
          dir={dirOf(l)}
          hrefLang={l}
          aria-current={l === lang ? 'true' : undefined}
          className="inline-flex min-h-11 items-center rounded-control px-3 text-sm text-ink-muted aria-[current]:bg-ink aria-[current]:text-paper"
        >
          {ENDONYM[l]}
        </Link>
      ))}
    </nav>
  )
}
