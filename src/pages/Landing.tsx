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

/** The front door: a short cinematic page whose one job is to make the visitor step inside. */
export function Landing() {
  return (
    <>
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
    </>
  )
}
