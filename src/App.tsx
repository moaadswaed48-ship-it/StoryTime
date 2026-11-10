import { useEffect, useRef } from 'react'
import { Providers } from '@/app/Providers'
import { useSiteStore } from '@/store/useSiteStore'
import { SkipLink } from '@/components/chrome/SkipLink'
import { Nav } from '@/components/chrome/Nav'
import { Hero } from '@/components/hero/Hero'
import { BookStage } from '@/components/sections/BookStage'
import { MeetHudhud } from '@/components/sections/MeetHudhud'
import { Play } from '@/components/sections/Play'
import { Learn, Plans, Author, Goodnight, DemoLogin } from '@/components/sections/More'
import { Reader } from '@/components/reader/Reader'
import { SceneMount } from '@/three/SceneMount'

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
          <BookStage />
          <MeetHudhud />
          <Play />
          <Learn />
          <Plans />
          <Author />
        </main>
        <Goodnight />
        <Reader />
        <DemoLogin />
        <SceneMount />
      </div>
    </Providers>
  )
}
