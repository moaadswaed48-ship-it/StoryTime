import { Nav } from '@/features/nav'
import { Hero } from '@/features/hero'
import { ScrollStory } from '@/features/scrollstory'
import { Library } from '@/features/library'
import { MeetSari } from '@/features/sari'
import { Author } from '@/features/author'
import { Footer } from '@/features/footer'

/**
 * The front door: a short cinematic page whose one job is to make the visitor step inside.
 * Film hero → the story in scroll → the library → Sari → the author → the closing film. The game poster, the tour,
 * the parents' section and the plans are not here (the plans live in the app's grown-ups area).
 */
export function Landing() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <ScrollStory />
        <Library />
        <MeetSari />
        <Author />
      </main>
      <Footer />
    </>
  )
}
