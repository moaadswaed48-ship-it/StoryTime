import { useEffect, useState, type CSSProperties } from 'react'
import { ALargeSmall, ChevronLeft, ChevronRight, Headphones, List, LockKeyhole, Minus, Play, Plus, Volume2, VolumeX, X } from 'lucide-react'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { locale, num, rtl } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { SIZE_STEPS } from './layout'
import { s } from './strings'

/** The reader's controls. They stay out of the page until the middle of it is tapped. */
export type Panel = null | 'scenes' | 'size'

export function TopBar({
  shown,
  title,
  sub,
  panel,
  sound,
  listening,
  canListen,
  compact,
  onClose,
  onPanel,
  onSound,
  onListen,
  onWatch,
}: {
  shown: boolean
  title: string
  sub: string
  panel: Panel
  sound: boolean
  /** The story is being read aloud; `canListen` is false where there is nothing to read (paywall, end page). */
  listening: boolean
  canListen: boolean
  /** Phone: icons only. */
  compact: boolean
  onClose: () => void
  onPanel: (p: Exclude<Panel, null>) => void
  onSound: () => void
  onListen: () => void
  onWatch: () => void
}) {
  const tab = shown ? 0 : -1
  return (
    <header className="rd-bar rd-top glass-ink" data-on={shown || undefined} aria-hidden={!shown}>
      <button type="button" className="rd-btn" aria-label={t.book.close} onClick={onClose} tabIndex={tab} data-testid="rd-close">
        <X size={21} aria-hidden />
      </button>
      <div className="rd-id">
        {compact ? (
          <p className="rd-title">{sub}</p>
        ) : (
          <>
            <p className="rd-title">{title}</p>
            <p className="rd-sub">{sub}</p>
          </>
        )}
      </div>
      <div className="rd-tools">
        <button type="button" className="rd-btn rd-watch" aria-label={t.book.watch} onClick={onWatch} tabIndex={tab}>
          <Play size={17} aria-hidden />
          {!compact && <span>{t.book.watch}</span>}
        </button>
        <button
          type="button"
          className="rd-btn rd-listen"
          aria-label={listening ? t.book.stopListening : t.book.listen}
          title={listening ? t.book.stopListening : t.book.listen}
          aria-pressed={listening}
          data-active={listening || undefined}
          disabled={!listening && !canListen}
          onClick={onListen}
          tabIndex={tab}
          data-testid="rd-listen"
        >
          <Headphones size={20} aria-hidden />
        </button>
        <button type="button" className="rd-btn" aria-label={sound ? t.film.mute : t.film.unmute} aria-pressed={sound} onClick={onSound} tabIndex={tab}>
          {sound ? <Volume2 size={20} aria-hidden /> : <VolumeX size={20} aria-hidden />}
        </button>
        <button type="button" className="rd-btn" aria-label={s.textSize} aria-expanded={panel === 'size'} data-active={panel === 'size' || undefined} onClick={() => onPanel('size')} tabIndex={tab} data-testid="rd-size">
          <ALargeSmall size={22} aria-hidden />
        </button>
        <button type="button" className="rd-btn" aria-label={t.film.chapters} aria-expanded={panel === 'scenes'} data-active={panel === 'scenes' || undefined} onClick={() => onPanel('scenes')} tabIndex={tab} data-testid="rd-scenes">
          <List size={21} aria-hidden />
        </button>
      </div>
    </header>
  )
}

export function BottomBar({
  shown,
  label,
  hint,
  position,
  positions,
  canPrev,
  canNext,
  arrows,
  onPrev,
  onNext,
  onSeek,
  labelFor,
}: {
  shown: boolean
  label: string
  hint: string
  position: number
  positions: number
  canPrev: boolean
  canNext: boolean
  /** Phone: the arrows live in the bar (on wide screens they sit beside the book). */
  arrows: boolean
  onPrev: () => void
  onNext: () => void
  onSeek: (position: number) => void
  labelFor: (position: number) => string
}) {
  // While the thumb is dragged only the number changes; the book turns once, when it is let go.
  const [scrub, setScrub] = useState<number | null>(null)
  useEffect(() => setScrub(null), [position])
  const value = scrub ?? position
  const commit = () => {
    if (scrub !== null && scrub !== position) onSeek(scrub)
    else setScrub(null)
  }
  const tab = shown ? 0 : -1
  const PrevIcon = rtl ? ChevronRight : ChevronLeft
  const NextIcon = rtl ? ChevronLeft : ChevronRight
  const max = Math.max(1, positions - 1)
  return (
    <footer className="rd-bar rd-bottom glass-ink" data-on={shown || undefined} aria-hidden={!shown}>
      <div className="rd-seek">
        {arrows && (
          <button type="button" className="rd-btn" aria-label={t.book.prev} disabled={!canPrev} onClick={onPrev} tabIndex={tab}>
            <PrevIcon size={22} aria-hidden />
          </button>
        )}
        <div className="rd-range" style={{ '--p': value / max } as CSSProperties}>
          <input
            data-lenis-prevent-touch
            type="range"
            dir={rtl ? 'rtl' : 'ltr'}
            min={0}
            max={max}
            step={1}
            value={value}
            aria-label={s.page}
            aria-valuetext={labelFor(value)}
            tabIndex={tab}
            onChange={(e) => setScrub(Number(e.currentTarget.value))}
            onPointerUp={commit}
            onKeyUp={commit}
            onBlur={commit}
            data-testid="rd-range"
          />
          {scrub !== null && scrub !== position && <output className="rd-bubble glass-ink">{labelFor(scrub)}</output>}
        </div>
        {arrows && (
          <button type="button" className="rd-btn" aria-label={t.book.next} disabled={!canNext} onClick={onNext} tabIndex={tab}>
            <NextIcon size={22} aria-hidden />
          </button>
        )}
      </div>
      <p className="rd-count" data-testid="rd-count">
        {label}
      </p>
      {hint && <p className="rd-hint">{hint}</p>}
    </footer>
  )
}

export function ScenesPanel({ current, lockedFrom, onPick, onClose }: { current: number; lockedFrom: number; onPick: (scene: number) => void; onClose: () => void }) {
  return (
    <section className="rd-panel rd-scenes glass-ink" aria-label={t.film.chapters}>
      <header className="rd-panel-head">
        <h3>{t.film.chapters}</h3>
        <button type="button" className="rd-btn" aria-label={t.book.close} onClick={onClose}>
          <X size={19} aria-hidden />
        </button>
      </header>
      <ol className="rd-scene-list" data-scroll="1" data-lenis-prevent>
        {story.scenes.map((sc, i) => (
          <li key={i}>
            <button type="button" className="rd-scene" aria-current={i === current ? 'true' : undefined} onClick={() => onPick(i)} data-testid={`rd-scene-${i}`}>
              <span className="rd-thumb">
                <img src={asset(sc.thumb)} alt="" loading="lazy" draggable={false} />
                {i >= lockedFrom && (
                  <span className="rd-lock" aria-hidden>
                    <LockKeyhole size={15} />
                  </span>
                )}
              </span>
              <span className="rd-scene-text">
                <span className="rd-scene-n">{num(i + 1)}</span>
                <span className="rd-scene-title">{sc.title[locale]}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function SizePanel({ size, onSize, compact }: { size: number; onSize: (n: number) => void; compact: boolean }) {
  const last = SIZE_STEPS.length - 1
  return (
    <section className={cn('rd-panel rd-size glass-ink', compact && 'is-compact')} aria-label={s.textSize}>
      <p className="rd-size-label">{s.textSize}</p>
      <div className="rd-size-row">
        <button type="button" className="rd-btn rd-size-btn" aria-label={s.smaller} disabled={size <= 0} onClick={() => onSize(size - 1)} data-testid="rd-smaller">
          <Minus size={18} aria-hidden />
        </button>
        <div className="rd-size-dots" role="img" aria-label={`${num(size + 1)} ${t.book.of} ${num(last + 1)}`}>
          {SIZE_STEPS.map((_, i) => (
            <span key={i} data-on={i <= size || undefined} style={{ '--k': 0.55 + i * 0.2 } as CSSProperties} />
          ))}
        </div>
        <button type="button" className="rd-btn rd-size-btn" aria-label={s.larger} disabled={size >= last} onClick={() => onSize(size + 1)} data-testid="rd-larger">
          <Plus size={18} aria-hidden />
        </button>
      </div>
    </section>
  )
}
