import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Globe, LibraryBig, TreeDeciduous, UsersRound, type LucideIcon } from 'lucide-react'
import { go } from '@/app/router'
import { t } from '@/i18n/copy'
import { locale, num, switchLocale } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { story } from '@/content/story'
import { leavesOf, useProfileStore } from '@/store/useProfileStore'
import { useSiteStore, type View } from '@/store/useSiteStore'
import { MAPLE, ReaderAvatar } from '@/features/enter/Avatar'
import './appnav.css'

type TabId = 'home' | 'tree' | 'grownups'
const TABS: { id: TabId; icon: LucideIcon; label: string }[] = [
  { id: 'home', icon: LibraryBig, label: t.app.tabs.home },
  { id: 'tree', icon: TreeDeciduous, label: t.app.tabs.tree },
  { id: 'grownups', icon: UsersRound, label: t.app.tabs.grownups },
]
/** The tab a screen belongs to: a story's page is part of the library, the author's desk is behind the grown-ups' door. */
const HOME_OF: Record<View, TabId | null> = { landing: null, home: 'home', story: 'home', tree: 'tree', grownups: 'grownups', studio: 'grownups' }
const otherLang = locale === 'ar' ? 'en' : 'ar'

function Tabs({ tabs, active, className, leaves }: { tabs: typeof TABS; active: TabId | null; className: string; leaves: number }) {
  const index = tabs.findIndex((x) => x.id === active)
  return (
    <nav className={cn('appnav__tabs', className)} aria-label={t.nav.menu} style={{ '--n': tabs.length, '--i': Math.max(0, index) } as CSSProperties}>
      <span className="appnav__thumb" data-none={index < 0 ? '' : undefined} aria-hidden />
      {tabs.map(({ id, icon: Icon, label }) => (
        <button key={id} type="button" className="appnav__tab" data-tab={id} aria-current={active === id ? 'page' : undefined} onClick={() => go(id)}>
          <span className="appnav__tab-pic">
            <Icon className="appnav__tab-icon" strokeWidth={active === id ? 2.3 : 1.9} aria-hidden />
            {/* the leaves earned so far ride on the tree tab */}
            {id === 'tree' && leaves > 0 && (
              <span className="appnav__badge" data-leaves={leaves} aria-hidden>
                {num(leaves)}
              </span>
            )}
          </span>
          <span className="appnav__tab-label">{label}</span>
          {id === 'tree' && leaves > 0 && (
            <span className="appnav__badge appnav__badge--inline" aria-hidden>
              {num(leaves)}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}

/**
 * The app's own navigation. Phones: a floating glass tab bar at the bottom (library · my tree · grown-ups) and a small
 * top bar (wordmark → the landing page, the reader's picture and name → "who is reading?"). Desktop: one floating pill
 * at the top with the wordmark, the tabs, the reader and the language. Hidden while the book, the film or the game is open.
 */
export function AppNav() {
  const view = useSiteStore((s) => s.view)
  const overlay = useSiteStore((s) => s.overlay)
  const profile = useProfileStore((s) => s.profile)
  const classroom = useProfileStore((s) => s.classroom)
  const leaves = useProfileStore((s) => leavesOf(s.progress[story.id]))
  const [tucked, setTucked] = useState(false)
  const root = useRef<HTMLElement>(null)

  const hidden = overlay !== null
  const tabs = classroom ? TABS.filter((x) => x.id !== 'tree') : TABS // classroom mode has no rewards
  const active = HOME_OF[view]

  // Phones: the top bar steps aside while the reader scrolls down and comes back on the way up. The tab bar always stays.
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - last) < 6) return
      setTucked(y > last && y > 120)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setTucked(false), [view])

  useEffect(() => {
    exposeQA({
      appnav: {
        state: () => {
          const st = useSiteStore.getState()
          const pr = useProfileStore.getState()
          return {
            hidden: st.overlay !== null,
            active: HOME_OF[st.view],
            tabs: (pr.classroom ? TABS.filter((x) => x.id !== 'tree') : TABS).map((x) => x.id),
            reader: pr.profile,
            tucked: root.current?.hasAttribute('data-tucked') ?? false,
          }
        },
      },
    })
  }, [])

  const who = () => useSiteStore.getState().setPicking(true)

  return (
    <header ref={root} className="appnav" data-view={view} data-hidden={hidden ? '' : undefined} data-tucked={tucked ? '' : undefined}>
      <div className="appnav__top" inert={hidden}>
        <div className="appnav__bar">
          <button type="button" className="appnav__brand" onClick={() => go('landing')} aria-label={`${t.brand} — ${t.app.back}`}>
            <svg className="appnav__mark" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d={MAPLE} />
            </svg>
            <span>{t.brand}</span>
          </button>

          <span className="appnav__rule" aria-hidden />
          <Tabs tabs={tabs} active={active} leaves={leaves} className="appnav__tabs--bar" />
          <span className="appnav__rule" aria-hidden />

          <div className="appnav__end">
            <button type="button" className="appnav__reader" data-reader onClick={who} aria-label={profile?.name ? `${t.app.who.title} ${profile.name}` : t.app.who.title}>
              <ReaderAvatar avatar={profile?.avatar ?? 'leaf'} className="appnav__face" eager />
              {profile?.name && (
                <span className="appnav__name" dir="auto">
                  {profile.name}
                </span>
              )}
            </button>
            <button type="button" className="appnav__lang" onClick={switchLocale} aria-label={t.nav.lang}>
              <Globe size={16} strokeWidth={1.9} aria-hidden />
              <span lang={otherLang}>{t.nav.lang}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="appnav__dock" inert={hidden}>
        <Tabs tabs={tabs} active={active} leaves={leaves} className="appnav__tabs--dock" />
      </div>
    </header>
  )
}
