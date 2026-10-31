import { useEffect, useRef } from 'react'
import { Providers } from '@/app/Providers'
import { useSiteStore } from '@/store/useSiteStore'
import { SkipLink } from '@/components/chrome/SkipLink'
import { Nav } from '@/components/chrome/Nav'
import { Hero } from '@/components/hero/Hero'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { ShelfSection } from '@/components/shelf/ShelfSection'
import { PeekInside } from '@/components/sections/PeekInside'
import { Ages } from '@/components/sections/Ages'
import { About } from '@/components/sections/About'
import { Order } from '@/components/sections/Order'
import { Footer } from '@/components/sections/Footer'

export default function App() {
  const pageRef = useRef<HTMLDivElement>(null)
  const setPageEl = useSiteStore((s) => s.setPageEl)
  useEffect(() => setPageEl(pageRef.current), [setPageEl])
  return (
    <Providers>
      <div id="page" ref={pageRef} className="relative">
        <SkipLink />
        <Nav />
        <main id="main">
          <Hero />
          <HowItWorks />
          <ShelfSection />
          <PeekInside />
          <Ages />
          <About />
          <Order />
        </main>
        <Footer />
      </div>
    </Providers>
  )
}
