import { Link, Outlet, useLocation } from 'react-router'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { SiteHeader } from '@/ui/SiteHeader'

/**
 * The signed-in app: client-only, never pre-rendered (rule 6: paid content never ships in pre-rendered pages).
 * Placeholder until the account work in Stage 4; there is no sign-in check yet.
 */
export default function AppLayout() {
  const { lang, dict } = useLang()
  const { pathname } = useLocation()
  const here = pathname.replace(/\/+$/, '')
  const t = dict.common.nav
  const tabs = [
    ['app/library', t.library],
    ['app/collections', t.collections],
    ['app/settings', t.settings],
  ] as const
  return (
    <>
      <SiteHeader />
      <nav aria-label={dict.common.menu} className="mx-auto flex max-w-5xl gap-1 px-4 pt-4">
        {tabs.map(([page, label]) => {
          const to = localPath(lang, page)
          // Compared without the trailing slash, so /he/app/settings and /he/app/settings/ both mark the tab.
          const current = here === to.replace(/\/+$/, '') || here.startsWith(to)
          return (
            <Link key={page} to={to} aria-current={current ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-control px-3 aria-[current=page]:bg-ink aria-[current=page]:text-paper">
              {label}
            </Link>
          )
        })}
      </nav>
      <main id="main" className="mx-auto max-w-5xl px-4 py-8">
        <p role="note" className="mb-6 inline-block rounded-control border border-dashed border-ink-muted px-3 py-2 text-sm text-ink-muted">
          {dict.common.placeholder}
        </p>
        <Outlet />
      </main>
    </>
  )
}
