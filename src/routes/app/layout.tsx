import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { justDeleted, signInPath } from '@/features/account/parts'
import { useSession } from '@/features/account/session'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { Spinner } from '@/ui/controls'
import { Shell } from '@/ui/Shell'

/**
 * The signed-in app: client-only, never pre-rendered (rule 6: paid content never ships in pre-rendered pages).
 * Signed out: sent to sign-in, and back here afterwards. Signed in but not onboarded: sent to onboarding.
 */
export default function AppLayout() {
  const { lang, dict } = useLang()
  const { pathname, search } = useLocation()
  const session = useSession()
  const here = pathname.replace(/\/+$/, '')
  const welcome = localPath(lang, 'app/welcome').replace(/\/+$/, '')

  if (session.status === 'signed-out') {
    if (justDeleted.check()) return <Navigate to={localPath(lang, 'auth/deleted')} replace />
    return <Navigate to={signInPath(lang, `${pathname}${search}`)} replace />
  }
  if (session.status === 'loading' || !session.account) {
    return (
      <Shell>
        <Spinner label={dict.account.states.loading} />
      </Shell>
    )
  }
  if (!session.account.onboardedAt && here !== welcome) return <Navigate to={localPath(lang, 'app/welcome')} replace />

  const t = dict.common.nav
  const tabs = [
    ['app/library', t.library],
    ['app/collections', t.collections],
    ['app/settings', t.settings],
  ] as const
  const nav = here === welcome ? null : (
    <nav aria-label={dict.common.menu} className="mx-auto flex max-w-5xl flex-wrap gap-1 px-4 pt-4">
      {tabs.map(([page, label]) => {
        const to = localPath(lang, page)
        const current = here === to.replace(/\/+$/, '') || here.startsWith(to)
        return (
          <Link key={page} to={to} aria-current={current ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-control px-3 aria-[current=page]:bg-ink aria-[current=page]:text-paper">
            {label}
          </Link>
        )
      })}
    </nav>
  )
  return (
    <Shell nav={nav}>
      <Outlet />
    </Shell>
  )
}
