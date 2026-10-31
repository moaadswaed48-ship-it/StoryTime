import { useEffect, useRef } from 'react'
import { Providers } from '@/app/Providers'
import { useSiteStore } from '@/store/useSiteStore'
import { SkipLink } from '@/components/chrome/SkipLink'
import { Nav } from '@/components/chrome/Nav'
import { Hero } from '@/components/hero/Hero'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { ShelfSection } from '@/components/shelf/ShelfSection'
import { PeekInside } from '@/components/sections/PeekInside'
import { Catalogue } from '@/components/sections/Catalogue'
import { Ages } from '@/components/sections/Ages'
import { About } from '@/components/sections/About'
import { Order } from '@/components/sections/Order'
import { Footer } from '@/components/sections/Footer'
import { SceneMount } from '@/three/SceneMount'
import { BookPreviewDialog } from '@/components/shelf/BookPreviewDialog'

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
          <Catalogue />
          <Ages />
          <About />
          <Order />
        </main>
        <Footer />
        <BookPreviewDialog />
        <SceneMount />
      </div>
    </Providers>
  )
}
