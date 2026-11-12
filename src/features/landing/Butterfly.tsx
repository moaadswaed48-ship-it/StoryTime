import type { CSSProperties } from 'react'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'

/**
 * A small monarch in flight. The picture is one of the hero's own butterflies, cut out of the original plate
 * (`public/landing/monarch.webp`), so it belongs to the photograph; the wing beat is a quick squeeze across the
 * body, the flight path is given by whoever places it. `size` is its width in px (keep it under 64: the file is 199px).
 */
export function Butterfly({ size, beat = 0.26, flip = false, className, style }: { size: number; beat?: number; flip?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span className={cn('lp-bf', flip && 'is-flipped', className)} style={{ '--s': `${size}px`, '--beat': `${beat}s`, ...style } as CSSProperties} aria-hidden>
      <span className="lp-bf__fly">
        <span className="lp-bf__face">
          <img className="lp-bf__wings" src={asset('landing/monarch.webp')} alt="" width={199} height={188} decoding="async" draggable={false} />
        </span>
      </span>
    </span>
  )
}
