import { useRef } from 'react'
import { site } from '@/content/loadBooks'
import { useReveal } from '@/app/useReveal'
import { Section, Eyebrow, Heading } from '@/components/sections/Section'
import { ShelfControls } from './ShelfControls'
import { ShelfSlot } from '@/three/ShelfSlot'

/** M0 skeleton: heading + controls + the (empty) View target. The 3D shelf mounts into `.shelf-view` in M2. */
export function ShelfSection() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  return (
    <Section id="shelf" ref={ref} className="bg-haze py-20 lg:py-28">
      <div className="max-w-[60ch]" data-reveal>
        <Eyebrow>The shelf</Eyebrow>
        <Heading>{site.shelf.heading}</Heading>
        <p className="mt-5 text-lg leading-relaxed text-body">{site.shelf.sub}</p>
      </div>
      <ShelfControls />
      <ShelfSlot fallback={<div className="mt-6 rounded-card bg-white/40 p-8 text-center text-body">The 3D shelf needs WebGL — the catalogue below lists every book.</div>} />
      <p className="mt-4 text-center text-sm text-body">{site.shelf.hint}</p>
    </Section>
  )
}
