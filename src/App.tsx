import { Providers } from '@/app/Providers'
import { ErrorBoundary } from '@/design/ErrorBoundary'
import { t } from '@/i18n/copy'
import { useRouter } from '@/app/router'
import { useSiteStore } from '@/store/useSiteStore'
import { Landing } from '@/pages/Landing'
import { AppShell } from '@/pages/AppShell'
import { Enter } from '@/features/enter'
import { BookReader } from '@/features/book'
import { Reader, canCurl } from '@/features/reader'
import { FilmPlayer } from '@/features/film'
import { GameOverlay } from '@/features/game'
import { IslandOverlay } from '@/features/island'
import { AuthModal } from '@/features/auth'
import { Checkout } from '@/features/checkout'

/** The page-curl reader where the device can run it; the DOM book otherwise (no WebGL, reduced motion). */
function Book() {
  useSiteStore((s) => s.overlay) // re-check each time the book opens
  return canCurl() ? <Reader /> : <BookReader />
}

function Views() {
  useRouter()
  const view = useSiteStore((s) => s.view)
  return view === 'landing' ? <Landing /> : <AppShell view={view} />
}

/** The game every "play" door opens is Friends Island; the older yard game stays reachable with `?game=yard`. */
const YARD = typeof location !== 'undefined' && new URLSearchParams(location.search).get('game') === 'yard'

/** Two worlds on one page: the landing page (front door) and the app behind it. Full-screen experiences sit on top of both. */
export default function App() {
  return (
    <Providers>
      <div id="page" className="relative">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">
          {t.ui.skip}
        </a>
        {/* one failed download (a lost connection) must never blank the page: each part fails on its own */}
        <ErrorBoundary>
          <Views />
        </ErrorBoundary>
        <ErrorBoundary fallback={null}>
          <Enter />
          <Book />
          <FilmPlayer />
          {YARD ? <GameOverlay /> : <IslandOverlay />}
          <AuthModal />
          <Checkout />
        </ErrorBoundary>
      </div>
    </Providers>
  )
}
