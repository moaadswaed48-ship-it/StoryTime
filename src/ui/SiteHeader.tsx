import { Link, useLocation } from 'react-router'
import { useSession } from '@/features/account/session'
import { ENDONYM, LANGS, dirOf } from '@/i18n/config'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'

/**
 * Placeholder header: working name, the main links and the language switch. No visual design yet.
 * Signed in, "Sign in / Create account" become "Library / Settings" once the session is known in the browser
 * (pre-rendered HTML is always the signed-out version).
 */
export function SiteHeader() {
  const { lang, dict } = useLang()
  const { pathname, search } = useLocation()
  const session = useSession()
  const signedIn = session.status === 'signed-in'
  // The same page in another language: swap the first segment.
  const page = pathname.split('/').slice(2).filter(Boolean).join('/')
  const t = dict.common
  return (
    <header className="border-b border-line bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:rounded-control focus:bg-ink focus:px-4 focus:py-3 focus:text-paper">
        {t.skipToContent}
      </a>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link to={localPath(lang)} className="me-auto inline-flex min-h-11 items-center rounded-control text-lg font-semibold">
          <bdi>{t.siteName}</bdi>
        </Link>
        <nav aria-label={t.menu} className="flex flex-wrap items-center gap-1">
          <NavLink to={localPath(lang, 'plans')}>{t.nav.plans}</NavLink>
          {signedIn ? (
            <>
              <NavLink to={localPath(lang, 'app/library')}>{t.nav.library}</NavLink>
              <NavLink to={localPath(lang, 'app/settings')}>{t.nav.settings}</NavLink>
            </>
          ) : (
            <>
              <NavLink to={localPath(lang, 'sign-in')}>{t.nav.signIn}</NavLink>
              <NavLink to={localPath(lang, 'sign-up')} strong>
                {t.nav.signUp}
              </NavLink>
            </>
          )}
        </nav>
        <nav aria-label={t.language} className="flex w-full flex-wrap gap-1 sm:w-auto">
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
      </div>
    </header>
  )
}

function NavLink({ to, children, strong }: { to: string; children: string; strong?: boolean }) {
  return (
    <Link to={to} className={`inline-flex min-h-11 items-center rounded-control px-3 ${strong ? 'bg-ink text-paper' : 'hover:bg-line/50'}`}>
      {children}
    </Link>
  )
}
