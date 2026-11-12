import { useEffect } from 'react'
import { useSiteStore, type View } from '@/store/useSiteStore'
import { useProfileStore } from '@/store/useProfileStore'

/**
 * Two worlds, one page: the landing page (front door) and the app (library, story, tree, grown-ups, studio).
 * Views are plain names in the address hash so a link can open a screen directly: #app, #story, #tree, #grownups, #studio.
 * Landing anchors (#parents, #pricing …) are left to the smooth scroller.
 */
const HASH: Record<Exclude<View, 'landing'>, string> = { home: 'app', story: 'story', tree: 'tree', grownups: 'grownups', studio: 'studio' }
const fromHash = (): View | null => {
  const h = typeof location === 'undefined' ? '' : location.hash.replace(/^#/, '')
  const hit = (Object.keys(HASH) as Exclude<View, 'landing'>[]).find((v) => HASH[v] === h)
  return hit ?? null
}

/** Show a view. Closes any overlay, jumps to the top and records the step in the browser history. */
export function go(view: View, opts: { replace?: boolean } = {}) {
  const st = useSiteStore.getState()
  if (st.view === view && !st.overlay) return
  st.closeOverlay()
  st.setPicking(false)
  st.setView(view)
  const url = view === 'landing' ? location.pathname + location.search : `#${HASH[view]}`
  try {
    if (opts.replace) history.replaceState(null, '', url)
    else history.pushState(null, '', url)
  } catch {
    /* sandboxed frame: the view still changes */
  }
  requestAnimationFrame(() => {
    const lenis = useSiteStore.getState().lenis
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
  })
}

/** The landing page's "enter the library" action: ask who is reading the first time, then open the app. */
export function enterApp(target: View = 'home') {
  if (!useProfileStore.getState().profile) useSiteStore.getState().setPicking(true, target)
  else go(target)
}

/** Mount once. Opens the view named in the address on load and follows the browser's back/forward buttons. */
export function useRouter() {
  useEffect(() => {
    const sync = () => {
      const v = fromHash()
      const st = useSiteStore.getState()
      if (v && v !== st.view) {
        st.closeOverlay()
        st.setView(v)
      } else if (!v && st.view !== 'landing' && !Object.values(HASH).includes(location.hash.replace(/^#/, ''))) {
        st.closeOverlay()
        st.setView('landing')
      }
    }
    sync()
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])
}
