import { useLayoutEffect } from 'react'
import { LandingNav } from '@/features/landing/Nav'
import { Hero } from '@/features/landing/Hero'
import { Ways } from '@/features/landing/Ways'
import { Parents } from '@/features/landing/Parents'
import { Steps } from '@/features/landing/Steps'
import { Cast } from '@/features/landing/Cast'
import { Plans } from '@/features/landing/Plans'
import { Faq } from '@/features/landing/Faq'
import { Closing } from '@/features/landing/Closing'
import { Author } from '@/features/author'
import '@/features/landing/landing.css'

/**
 * The front door. It has its own look (daylight, sky, green: everything under `.lp`), so it never reads as a
 * screen of the app. It is about the service, a world of stories, not about one story or one season.
 * It tells one story to a parent, in this order: the promise (the books on the peak) → what a story becomes here
 * (read · watch · play) → what a parent asks first, answered → how it works in three steps and what stays with the
 * child → the characters, with Sari in 3D → the author → the plans (sample prices, the demo checkout) → questions
 * parents ask → the way in. One action throughout: enter the app; beside it the two doors of the demo sign-in
 * (a new account, a returning parent). The bookshelf lives in the app.
 */
export function Landing() {
  // the page ground (what shows behind an overscroll) belongs to the landing page only while it is on screen
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-world', 'landing')
    // the phone's browser bar takes the sky's colour here and goes back to the app's night afterwards
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const night = theme?.content
    if (theme) theme.content = '#c3cedd'
    return () => {
      document.documentElement.removeAttribute('data-world')
      if (theme && night) theme.content = night
    }
  }, [])
  return (
    <div className="lp">
      <LandingNav />
      <main id="main">
        <Hero />
        <Ways />
        <Parents />
        <Steps />
        <Cast />
        <Author cta={false} />
        <Plans />
        <Faq />
        <Closing />
      </main>
    </div>
  )
}
