import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { backendKind } from '@/data'
import { useSession } from '@/features/account/session'
import { OwnerContext, useOwnerDict } from '@/features/owner/context'
import { getOwnerApi, type OwnerApi } from '@/features/owner/data'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { ButtonLink, Notice, Spinner } from '@/ui/controls'

export const meta = () => privateMeta('StoryTime')

/**
 * The owner's area frame: owner role only. The screen check here is a courtesy; the data layer (local) and
 * row-level security (Supabase) refuse every owner call from any other account.
 */
export default function OwnerLayout() {
  const { lang, dict } = useLang()
  const session = useSession()
  const { od, failed } = useOwnerDict(lang)
  const [api, setApi] = useState<OwnerApi | null>(null)
  const [apiFailed, setApiFailed] = useState(false)
  const { pathname } = useLocation()
  const isOwner = session.status === 'signed-in' && session.account?.role === 'owner'

  useEffect(() => {
    if (!isOwner) return
    let alive = true
    getOwnerApi().then((a) => alive && setApi(a), () => alive && setApiFailed(true))
    return () => void (alive = false)
  }, [isOwner])

  if (failed || apiFailed) {
    return <Notice tone="error" title={dict.account.errors.network} action={<button type="button" className="min-h-12 underline" onClick={() => location.reload()}>{dict.account.errors.retry}</button>} />
  }
  if (!od) return <Spinner label={dict.account.states.loading} />
  if (!isOwner) {
    return (
      <div data-testid="owner-refused" className="flex max-w-prose flex-col gap-4">
        <h1 className="text-3xl font-semibold">{od.area.notOwnerTitle}</h1>
        <p className="text-lg text-ink-muted">{od.area.notOwnerLead}</p>
        <div><ButtonLink to={localPath(lang, 'app/library')}>{od.area.backToLibrary}</ButtonLink></div>
      </div>
    )
  }
  if (!api) return <Spinner label={dict.account.states.loading} />

  const here = pathname.replace(/\/+$/, '')
  const root = localPath(lang, 'app/owner').replace(/\/+$/, '')
  const tabs = [
    ['app/owner', od.area.nav.stories, here === root || here.startsWith(`${root}/story`)],
    ['app/owner/dashboard', od.area.nav.dashboard, here === `${root}/dashboard`],
    ['app/owner/changes', od.area.nav.changes, here === `${root}/changes`],
  ] as const
  return (
    <OwnerContext.Provider value={{ od, api }}>
      <div className="flex flex-col gap-6" data-testid="owner-area">
        <nav aria-label={od.area.title} className="flex flex-wrap gap-1 border-b border-line pb-3">
          {tabs.map(([page, label, current]) => (
            <Link key={page} to={localPath(lang, page)} aria-current={current ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-control border border-line px-3 text-sm font-medium aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper">
              {label}
            </Link>
          ))}
        </nav>
        {backendKind === 'local' && <p className="text-sm text-ink-muted">{od.area.testModeNote}</p>}
        <Outlet />
      </div>
    </OwnerContext.Provider>
  )
}
