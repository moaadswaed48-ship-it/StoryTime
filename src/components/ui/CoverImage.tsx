import { useEffect, useRef, useState } from 'react'
import type { Book } from '@/content/schema'
import { CoverSwatch } from './CoverSwatch'
import { cn } from '@/lib/cn'

/** The canvas-rendered cover (same renderer as the 3D shelf) as an <img>, lazily drawn when near the viewport. */
export function CoverImage({ book, className, eager = false }: { book: Book; className?: string; eager?: boolean }) {
  const [src, setSrc] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    const draw = () => import('@/three/shelf/coverAtlas').then(({ coverDataUrl }) => coverDataUrl(book)).then((u) => !cancelled && setSrc(u)).catch(() => undefined)
    if (eager) {
      draw()
      return () => {
        cancelled = true
      }
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      draw()
    }, { rootMargin: '300px 0px' })
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [book, eager])
  return (
    <div ref={ref} className={cn('relative', className)}>
      {src ? (
        <img src={src} alt="" width={448} height={640} className="block w-full rounded-[6px] shadow-[inset_-3px_0_6px_rgba(0,0,0,.25),0_10px_24px_rgba(16,20,24,.18)]" decoding="async" />
      ) : (
        <CoverSwatch book={book} className="w-full [container-type:inline-size]" />
      )}
    </div>
  )
}
