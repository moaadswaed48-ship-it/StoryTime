import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { site, books, matchesFilter } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { useReveal } from '@/app/useReveal'
import { Section, Eyebrow, Heading } from '@/components/sections/Section'
import { ShelfControls } from './ShelfControls'
import { ShelfRack } from './ShelfRack'
import { ShelfSlot } from '@/three/ShelfSlot'
import { createBus } from '@/three/shelf/bus'

export function ShelfSection() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const bus = useMemo(() => createBus(), [])
  const index = useSiteStore((s) => s.shelf.index)
  const filter = useSiteStore((s) => s.shelf.filter)
  const phase = useSiteStore((s) => s.shelf.phase)
  const webgl = useSiteStore((s) => s.webgl)
  const openBook = useSiteStore((s) => s.openBook)
  const activeId = useSiteStore((s) => s.shelf.activeId)
  useEffect(() => {
    bus.focusShiftPx = activeId && window.innerWidth >= 1024 ? -Math.min(520, window.innerWidth * 0.46) / 2 : 0
  }, [activeId, bus])
  const visible = books.filter((b) => matchesFilter(b, filter))
  const centred = books[index]
  const pos = centred ? visible.findIndex((b) => b.id === centred.id) : -1
  const announce = centred && pos >= 0 ? site.shelf.announce.replace('{index}', String(pos + 1)).replace('{total}', String(visible.length)).replace('{title}', centred.title) : ''

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return
    const cmd = (c: Parameters<typeof bus.commands.push>[0]) => {
      bus.commands.push(c)
      e.preventDefault()
    }
    if (e.key === 'ArrowRight') cmd({ type: 'step', by: 1 })
    else if (e.key === 'ArrowLeft') cmd({ type: 'step', by: -1 })
    else if (e.key === 'Home') cmd({ type: 'home' })
    else if (e.key === 'End') cmd({ type: 'end' })
    else if (e.key === 'Enter' || e.key === ' ') cmd({ type: 'openCentred' })
  }
  const busy = phase === 'landing' || phase === 'elevating' || phase === 'preview' || phase === 'lowering'

  return (
    <Section id="shelf" ref={ref} className="bg-haze py-20 lg:py-28">
      <div className="max-w-[60ch]" data-reveal>
        <Eyebrow>The shelf</Eyebrow>
        <Heading>{site.shelf.heading}</Heading>
        <p className="mt-5 text-lg leading-relaxed text-body">{site.shelf.sub}</p>
      </div>
      <ShelfControls />
      <div
        className="shelf-wrap relative rounded-card outline-offset-4"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Bookshelf"
        aria-describedby="shelf-hint"
        onKeyDown={onKeyDown}
      >
        <ShelfSlot bus={bus} fallback={<ShelfRack />} />
        {webgl !== 'failed' && (
          <>
            <button
              type="button"
              aria-label={site.dialog.prev}
              disabled={busy || pos <= 0}
              onClick={() => bus.commands.push({ type: 'step', by: -1 })}
              className="absolute left-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/80 text-ink shadow-sm transition-opacity disabled:opacity-30 md:inline-flex"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
            <button
              type="button"
              aria-label={site.dialog.next}
              disabled={busy || pos >= visible.length - 1}
              onClick={() => bus.commands.push({ type: 'step', by: 1 })}
              className="absolute right-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/80 text-ink shadow-sm transition-opacity disabled:opacity-30 md:inline-flex"
            >
              <ChevronRight size={22} aria-hidden />
            </button>
            {visible.length === 0 && (
              <p className="absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 text-center text-lg text-body">{site.shelf.empty}</p>
            )}
          </>
        )}
      </div>
      <p id="shelf-hint" className="mt-4 text-center text-sm text-body">
        {site.shelf.hint}
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {/* Screen-reader / keyboard mirror of the 3D row (real buttons) */}
      {webgl !== 'failed' && (
        <ul className="sr-only" aria-label="Books on the shelf">
          {visible.map((b) => (
            <li key={b.id}>
              <button type="button" onFocus={() => bus.commands.push({ type: 'snapTo', id: b.id })} onClick={(e) => openBook(b.id, e.currentTarget)}>
                {b.title} — ages {b.ageRange[0]}–{b.ageRange[1]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
