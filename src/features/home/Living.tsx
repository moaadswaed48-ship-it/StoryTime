import { useEffect, useRef, useState } from 'react'
import { useOnScreen } from '@/design/ui'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { useSiteStore } from '@/store/useSiteStore'

/**
 * A scene picture that comes alive: the still is always there; its short silent clip loads only when the picture is on
 * screen and fades in over the still once it is really playing. It pauses off-screen and while the book, the film or the
 * game is open, and stays a still with reduced motion. Fills its positioned parent.
 */
export function LivingPicture({ still, clip, position = 'var(--living-pos, 50% 50%)', rate = 0.8, className, eager }: { still: string; clip?: string; position?: string; rate?: number; className?: string; eager?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const onScreen = useOnScreen(box, '80px 0px')
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const busy = useSiteStore((s) => s.overlay !== null || s.picking)
  const [wanted, setWanted] = useState(false)
  const [live, setLive] = useState(false)
  const run = !!clip && onScreen && !reduced && !busy

  useEffect(() => {
    if (run) setWanted(true)
  }, [run])
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (run) {
      v.playbackRate = rate
      v.play().catch(() => {
        /* autoplay refused: the still stays */
      })
    } else v.pause()
  }, [run, wanted, rate])
  useEffect(() => {
    if (reduced) setLive(false)
  }, [reduced])

  return (
    <div ref={box} className={cn('living absolute inset-0 overflow-hidden', className)} data-live={live ? '' : undefined}>
      <img src={asset(still)} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} className="living__still absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
      {clip && wanted && (
        <div className="living__film absolute inset-0">
          <video
            ref={video}
            src={asset(clip)}
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            tabIndex={-1}
            aria-hidden
            onPlaying={() => setLive(true)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: position }}
          />
        </div>
      )}
    </div>
  )
}
