import type { CSSProperties } from 'react'
import type { StorySummary } from '@/data/types'
import { hashString } from '@/lib/seeded'
import { emblemMask, emblemPattern } from '@/library/emblems'
import { mix } from '@/library/engine'
import type { Emblem, ShelfBook } from '@/library/types'
import { useLang } from '@/i18n/use-dict'
import { IconLock } from './icons'

/**
 * A book's cover. With a cover picture (the story's first page until a real cover exists) the picture fills the
 * board; without one, a code-drawn cloth board with an emblem. Covers carry no words: the title is real text next
 * to them. Neutral cloth colours only (the brand is not decided).
 */
const CLOTHS: ShelfBook['palette'][] = [
  { cloth: '#4d6470', ink: '#f2efe8', foil: '#e6d9bd' },
  { cloth: '#5f6f52', ink: '#f6f1e6', foil: '#ece0b8' },
  { cloth: '#6b5a6e', ink: '#f6f1e6', foil: '#ecd3c6' },
  { cloth: '#3e5a7a', ink: '#f2efe8', foil: '#d6e4ef' },
  { cloth: '#7a6a55', ink: '#f6f1e6', foil: '#efe2c4' },
  { cloth: '#546b63', ink: '#f2efe8', foil: '#dfe6cf' },
]
const EMBLEMS: Emblem[] = ['sun', 'moon', 'drop', 'flower', 'seed', 'rainbow', 'shell', 'book', 'lantern', 'starfish', 'olive', 'clock']

export function shelfBookOf(s: Pick<StorySummary, 'id'>): ShelfBook {
  const h = hashString(s.id)
  return { id: s.id, ready: true, palette: CLOTHS[h % CLOTHS.length]!, emblem: EMBLEMS[(h >>> 4) % EMBLEMS.length]! }
}

export function Cover({ story, locked, className = '', style }: { story: Pick<StorySummary, 'id' | 'coverUrl'>; locked?: boolean; className?: string; style?: CSSProperties }) {
  const { dict } = useLang()
  const b = shelfBookOf(story)
  const mask = emblemMask(b.emblem)
  return (
    <span className={`@container relative block overflow-hidden rounded-[6px] shadow-[0_1px_2px_rgb(0_0_0/0.18),0_6px_18px_-8px_rgb(0_0_0/0.35)] ${className}`} style={{ background: b.palette.cloth, ...style }} aria-hidden="true">
      {story.coverUrl ? (
        <img src={story.coverUrl} alt="" draggable={false} className="absolute inset-0 size-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <>
          <span className="absolute inset-0" style={{ backgroundImage: emblemPattern(b.emblem, mix(b.palette.cloth, b.palette.foil, 0.3), b.palette.cloth), backgroundSize: '33%', opacity: 0.45 }} />
          <span className="absolute inset-x-[24%] top-[26%] aspect-square" style={{ background: b.palette.foil, maskImage: mask, WebkitMaskImage: mask, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' } as CSSProperties} />
          {/* Marked as a stand-in: a dashed inner frame and, where the board is big enough, the words. */}
          <span className="absolute inset-[6%] rounded-[3px] border border-dashed" style={{ borderColor: b.palette.foil, opacity: 0.7 }} data-testid="cover-placeholder" />
          <span className="absolute inset-x-[8%] bottom-[9%] hidden text-center text-[0.65rem] leading-tight font-medium @[4.5rem]:block" style={{ color: b.palette.ink }}>{dict.stories.placeholder.cover}</span>
        </>
      )}
      {/* The spine's shadow, on the binding side. */}
      <span className="absolute inset-y-0 start-0 w-[7%] bg-gradient-to-r from-black/25 to-transparent rtl:bg-gradient-to-l" />
      {locked && (
        <span className="absolute inset-0 grid place-items-center bg-black/35">
          <span className="grid size-12 place-items-center rounded-full bg-white/92 text-ink shadow"><IconLock className="size-6" /></span>
        </span>
      )}
    </span>
  )
}
