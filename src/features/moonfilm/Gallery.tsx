import { useEffect, useRef } from 'react'
import { moon } from '@/content/stories/moon'
import { Painter } from './kit/core'
import { STILLS, renderStill } from './plates'

function Plate({ n, width }: { n: number; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (cv && ctx) renderStill(new Painter(ctx, cv.width), n)
  }, [n])
  return <canvas ref={ref} width={width} height={(width * 9) / 16} data-moonfilm-still={n} />
}

/** Three book pictures drawn with the film's kit, to show the style holds across the story. */
export function Stills({ only }: { only: number | null }) {
  if (only !== null && STILLS.includes(only)) {
    return (
      <div className="mf-solo">
        <Plate n={only} width={1920} />
      </div>
    )
  }
  return (
    <div className="mf-gallery">
      {STILLS.map((n) => (
        <figure key={n} className="mf-plate">
          <Plate n={n} width={1344} />
          <figcaption dir="rtl" lang="ar">
            {moon.scenes[n - 1].title.ar}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
