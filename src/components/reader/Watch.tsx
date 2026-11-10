import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Pause, Play, BookOpen } from 'lucide-react'
import { useSiteStore } from '@/store/useSiteStore'
import { story, spreadText } from '@/content/story'
import { t } from '@/i18n/copy'
import { locale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { Leaves } from '@/components/fx/Leaves'

/** "Watch": the same pages played as a short film — slow camera moves, captions, falling leaves. */
export function Watch() {
  const close = useSiteStore((s) => s.closeReader)
  const openReader = useSiteStore((s) => s.openReader)
  const steps = useMemo(() => story.spreads.flatMap((s, si) => spreadText(s, locale).map((text) => ({ si, text }))), [])
  const [k, setK] = useState(-1) // -1 = title card
  const [paused, setPaused] = useState(false)
  const bar = useRef<HTMLDivElement>(null)
  const done = k >= steps.length
  const step = k >= 0 && !done ? steps[k] : null
  const dur = step ? Math.max(3200, step.text.split(' ').length * 430) : 2600

  useEffect(() => {
    if (paused || done) return
    const id = window.setTimeout(() => setK((v) => v + 1), dur)
    return () => clearTimeout(id)
  }, [k, paused, done, dur])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === ' ') setPaused((p) => !p)
    }
    window.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    const lenis = useSiteStore.getState().lenis
    lenis?.stop()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      lenis?.start()
    }
  }, [close])

  const si = step ? step.si : done ? story.spreads.length - 1 : 0
  return (
    <div className="overlay-in fixed inset-0 z-[60] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label={t.reader.watch} data-lenis-prevent>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {story.spreads.map((s, idx) =>
          Math.abs(idx - si) > 1 ? null : (
            <img
              key={idx}
              src={asset(s.img)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms]"
              style={{ opacity: idx === si ? 1 : 0, animation: `${idx % 2 ? 'kenburns-b' : 'kenburns-a'} 16s ease-in-out both`, animationPlayState: paused ? 'paused' : 'running' }}
            />
          ),
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35" />
        <Leaves density={14} />
        {k === -1 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-6 text-center">
            <p className="text-sm font-semibold text-[#f4c56a]">{story.kicker[locale]}</p>
            <h2 className="font-display mt-2 text-[clamp(30px,6vw,72px)] font-bold leading-tight">{story.title[locale]}</h2>
          </div>
        )}
        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/55 px-6 text-center">
            <h2 className="font-display text-[clamp(34px,7vw,80px)] font-bold">{t.reader.end}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => setK(-1)} className="h-12 rounded-full bg-white/15 px-6 text-sm font-semibold">{t.reader.again}</button>
              <button type="button" onClick={() => openReader('read', 1)} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#f4a72c] px-6 text-sm font-bold text-[#3a1c06]">
                <BookOpen size={16} aria-hidden /> {t.reader.read}
              </button>
            </div>
          </div>
        )}
        {step && (
          <p key={k} className="overlay-in font-story absolute inset-x-0 bottom-0 mx-auto max-w-[62ch] px-5 pb-7 text-center text-[clamp(17px,2.6vw,30px)] font-bold leading-[1.9] [text-shadow:0_2px_10px_rgba(0,0,0,.9)]" aria-live="polite">
            {step.text}
          </p>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <button type="button" onClick={close} className="inline-flex h-11 items-center gap-2 rounded-full bg-black/45 px-4 text-sm font-semibold" aria-label={t.reader.close}>
            <X size={18} aria-hidden /> <span className="hidden sm:inline">{t.reader.close}</span>
          </button>
          <button type="button" onClick={() => setPaused((p) => !p)} className="inline-flex h-11 items-center gap-2 rounded-full bg-black/45 px-4 text-sm font-semibold">
            {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />} {paused ? t.reader.play : t.reader.pause}
          </button>
        </div>
      </div>
      <div className="h-1 w-full bg-white/15" dir="ltr">
        <div ref={bar} className="h-full bg-[#f4a72c] transition-[width] duration-500" style={{ width: `${Math.min(100, ((k + 1) / (steps.length + 1)) * 100)}%`, marginInlineStart: locale === 'ar' ? 'auto' : 0 }} />
      </div>
    </div>
  )
}
