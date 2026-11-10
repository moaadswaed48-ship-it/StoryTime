import { Providers } from '@/app/Providers'
import { Nav } from '@/features/nav'
import { Hero } from '@/features/hero'
import { ScrollStory } from '@/features/scrollstory'
import { Library } from '@/features/library'
import { MeetSari } from '@/features/sari'
import { Game } from '@/features/game'
import { Parents } from '@/features/parents'
import { Pricing } from '@/features/pricing'
import { Author } from '@/features/author'
import { Footer } from '@/features/footer'
import { BookReader } from '@/features/book'
import { FilmPlayer } from '@/features/film'
import { AuthModal } from '@/features/auth'

/** One long scroll: film hero → scroll story → library shelf → Sari → game → parents → plans → author → footer. */
export default function App() {
  return (
    <Providers>
      <div id="page" className="relative">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">
          ↓
        </a>
        <Nav />
        <main id="main">
          <Hero />
          <ScrollStory />
          <Library />
          <MeetSari />
          <Game />
          <Parents />
          <Pricing />
          <Author />
        </main>
        <Footer />
        <BookReader />
        <FilmPlayer />
        <AuthModal />
      </div>
    </Providers>
  )
}
