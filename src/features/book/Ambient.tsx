import { useEffect, useRef } from 'react'

/**
 * The stage glow: the current picture, reduced to a few dozen pixels and stretched over the whole stage.
 * It is blurred once on a tiny canvas, so the page never runs a full-screen blur filter.
 */
function paint(cv: HTMLCanvasElement, im: HTMLImageElement) {
  const tiny = document.createElement('canvas')
  tiny.width = 24
  tiny.height = 14
  tiny.getContext('2d')!.drawImage(im, 0, 0, tiny.width, tiny.height)
  const ctx = cv.getContext('2d')!
  ctx.clearRect(0, 0, cv.width, cv.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  if ('filter' in ctx) ctx.filter = 'blur(4px) saturate(1.4)'
  // Overscan, so the blurred edge never fades to transparent.
  ctx.drawImage(tiny, -8, -5, cv.width + 16, cv.height + 10)
}

export function Ambient({ src }: { src: string }) {
  const a = useRef<HTMLCanvasElement>(null)
  const b = useRef<HTMLCanvasElement>(null)
  const front = useRef(1)
  useEffect(() => {
    let alive = true
    const im = new Image()
    const show = () => {
      if (!alive || !a.current || !b.current) return
      const next = front.current ^ 1
      const cv = next ? b.current : a.current
      const old = next ? a.current : b.current
      try {
        paint(cv, im)
      } catch {
        return
      }
      cv.style.opacity = '1'
      old.style.opacity = '0'
      front.current = next
    }
    im.onload = show
    im.src = src
    if (im.complete && im.naturalWidth) show()
    return () => {
      alive = false
      im.onload = null
    }
  }, [src])
  return (
    <div className="bk-amb-box">
      <canvas ref={a} className="bk-amb" width={96} height={54} />
      <canvas ref={b} className="bk-amb" width={96} height={54} />
    </div>
  )
}
