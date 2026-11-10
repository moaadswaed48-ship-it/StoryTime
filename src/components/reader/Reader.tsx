import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft, X, Clapperboard, RotateCcw, Gamepad2 } from 'lucide-react'
import { useSiteStore } from '@/store/useSiteStore'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { rtl, dirSign } from '@/i18n/locale'
import { sfx } from '@/audio/synth'
import { exposeQA } from '@/three/shared/qa'
import { Leaves, type LeavesHandle } from '@/components/fx/Leaves'
import { Art, Words, CoverFace, PaperPage } from './parts'
import { Watch } from './Watch'

const N = story.spreads.length
const FREE = 4 // spreads readable before the demo paywall

function EndPage({ onAgain, onPlay }: { onAgain: () => void; onPlay: () => void }) {
  return (
    <div className="paper flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-[clamp(28px,5vmin,52px)] font-bold text-[#8a3d12]">{t.reader.end}</p>
      <p className="font-story text-lg text-[#5a4632]">{t.reader.endSub}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onAgain} className="inline-flex h-12 items-center gap-2 rounded-full border border-[#8a3d12]/25 bg-white px-5 text-sm font-semibold text-[#5b2a0c]">
          <RotateCcw size={16} aria-hidden /> {t.reader.again}
        </button>
        <button type="button" onClick={onPlay} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#c8421f] px-5 text-sm font-semibold text-white">
          <Gamepad2 size={16} aria-hidden /> {t.reader.playGame}
        </button>
      </div>
    </div>
  )
}

/** Fullscreen book: two-page spreads with turning leaves on wide screens, one turning sheet on phones. */
export function Reader() {
  const mode = useSiteStore((s) => s.reader)
  const startPage = useSiteStore((s) => s.readerPage)
  const close = useSiteStore((s) => s.closeReader)
  const openReader = useSiteStore((s) => s.openReader)
  const loggedIn = useSiteStore((s) => s.loggedIn)
  const setLoggedIn = useSiteStore((s) => s.setLoggedIn)
  const lenis = useSiteStore((s) => s.lenis)
  const [i, setI] = useState(0)
  const [gate, setGate] = useState(false)
  const [wide, setWide] = useState(() => window.innerWidth >= 900 && window.innerWidth > window.innerHeight)
  const leaves = useRef<LeavesHandle>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const open = mode !== 'closed'

  useEffect(() => {
    if (open) setI(startPage)
  }, [open, startPage])
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= 900 && window.innerWidth > window.innerHeight)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  useEffect(() => {
    if (!open) return
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    closeBtn.current?.focus()
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ''
    }
  }, [open, lenis])

  const go = useCallback(
    (to: number) => {
      const n = Math.max(0, Math.min(N + 1, to))
      if (n === i) return
      if (n > FREE && !useSiteStore.getState().loggedIn) {
        setGate(true)
        return
      }
      sfx.flip()
      setI(n)
    },
    [i],
  )
  useEffect(() => {
    exposeQA({ reader: { page: () => i, go, open: (m: 'read' | 'watch' = 'read') => openReader(m, 0) } })
  }, [i, go, openReader])

  useEffect(() => {
    if (mode !== 'read') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight') || e.key === ' ' || e.key === 'PageDown') go(i + 1)
      else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft') || e.key === 'PageUp') go(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, i, go, close])

  if (!open) return null
  if (mode === 'watch') return <Watch />

  const burst = (e: React.PointerEvent) => {
    const r = (e.currentTarget.closest('.reader-root') as HTMLElement).getBoundingClientRect()
    leaves.current?.burst(e.clientX - r.left, e.clientY - r.top)
    sfx.chime()
  }
  const again = () => go(0)
  const play = () => {
    close()
    setTimeout(() => useSiteStore.getState().lenis?.scrollTo('#play', { offset: -70 }), 60)
  }
  const onDown = (e: React.PointerEvent) => (drag.current = { x: e.clientX, y: e.clientY })
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const dx = (e.clientX - d.x) * dirSign
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(e.clientY - d.y) * 1.3) go(i + (dx < 0 ? 1 : -1))
  }
  const S = story.spreads

  return (
    <div className="reader-root overlay-in fixed inset-0 z-[60] flex flex-col bg-[radial-gradient(120%_90%_at_50%_10%,#5a3a22_0%,#2c1a10_70%)] text-white" role="dialog" aria-modal="true" aria-label={story.title[rtl ? 'ar' : 'en']} data-lenis-prevent>
      <Leaves ref={leaves} density={10} />
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-3">
        <button ref={closeBtn} type="button" onClick={close} className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold hover:bg-white/20" aria-label={t.reader.close}>
          <X size={18} aria-hidden /> <span className="hidden sm:inline">{t.reader.close}</span>
        </button>
        <p className="truncate text-sm font-medium text-white/80">{story.title[rtl ? 'ar' : 'en']}</p>
        <button type="button" onClick={() => openReader('watch', 0)} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f4a72c] px-4 text-sm font-bold text-[#3a1c06]">
          <Clapperboard size={18} aria-hidden /> {t.reader.watch}
        </button>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3" onPointerDown={onDown} onPointerUp={onUp} style={{ touchAction: 'pan-y' }}>
        {wide ? (
          <div
            className="book"
            style={{
              width: 'min(92vw, calc((100vh - 170px) * 2))',
              aspectRatio: '2 / 1',
              transition: 'transform .9s cubic-bezier(.3,.1,.2,1)',
              transform: `translateX(${i === 0 ? -25 * dirSign : i === N + 1 ? 25 * dirSign : 0}%)`,
            }}
          >
            {Array.from({ length: N + 1 }, (_, k) => {
              const flipped = k < i
              return (
                <div key={k} className={`leaf ${flipped ? 'is-flipped' : ''}`} style={{ zIndex: flipped ? 20 + k : N + 1 - k, transition: 'transform .95s cubic-bezier(.3,.1,.2,1), z-index 0s .42s' }}>
                  <div className="face">{k === 0 ? <CoverFace /> : <Art s={S[k - 1]} index={k - 1} active={i === k} onBurst={burst} />}</div>
                  <div className="face back">
                    {k < N ? (
                      <PaperPage n={k + 1}>
                        <Words s={S[k]} />
                      </PaperPage>
                    ) : (
                      <EndPage onAgain={again} onPlay={play} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="relative" style={{ width: 'min(94vw, calc((100vh - 190px) * 0.62))', aspectRatio: '0.62 / 1' }}>
            {Array.from({ length: N + 2 }, (_, k) => (
              <div key={k} className={`sheet overflow-hidden rounded-2xl bg-[#fbf6ea] shadow-[0_18px_40px_rgba(0,0,0,.45)] ${k < i ? 'is-gone' : ''}`} style={{ zIndex: N + 2 - k }} aria-hidden={k !== i}>
                {Math.abs(k - i) > 2 ? null : k === 0 ? (
                  <CoverFace />
                ) : k === N + 1 ? (
                  <EndPage onAgain={again} onPlay={play} />
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="aspect-square w-full shrink-0">
                      <Art s={S[k - 1]} index={k - 1} active={i === k} onBurst={burst} />
                    </div>
                    <div className="min-h-0 flex-1">
                      <PaperPage n={k}>
                        <Words s={S[k - 1]} />
                      </PaperPage>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {gate && !loggedIn && (
          <div className="overlay-in absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-5">
            <div className="max-w-sm rounded-3xl bg-[#fff8ea] p-6 text-center text-[#3a2a1c] shadow-2xl">
              <p className="font-display text-2xl font-bold text-[#8a3d12]">{t.reader.gateTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#6a5846]">{t.reader.gateSub}</p>
              <button
                type="button"
                className="mt-5 inline-flex h-12 items-center rounded-full bg-[#c8421f] px-6 text-sm font-bold text-white"
                onClick={() => {
                  setLoggedIn(true)
                  setGate(false)
                  sfx.win()
                  setI((v) => v + 1)
                }}
              >
                {t.reader.gateBtn}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 flex items-center justify-center gap-4 px-4 pb-4 pt-2">
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 disabled:opacity-30" aria-label={t.reader.prev}>
          {rtl ? <ChevronRight size={22} aria-hidden /> : <ChevronLeft size={22} aria-hidden />}
        </button>
        <p className="min-w-[90px] text-center text-sm tabular-nums text-white/80" aria-live="polite">
          {i === 0 ? t.reader.by : i > N ? t.reader.end : `${t.reader.page} ${i} / ${N}`}
        </p>
        <button type="button" onClick={() => go(i + 1)} disabled={i === N + 1} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f4a72c] text-[#3a1c06] disabled:opacity-30" aria-label={t.reader.next}>
          {rtl ? <ChevronLeft size={22} aria-hidden /> : <ChevronRight size={22} aria-hidden />}
        </button>
      </footer>
      <p className="relative z-10 pb-3 text-center text-[11px] text-white/50">{t.reader.tapHint}</p>
    </div>
  )
}
