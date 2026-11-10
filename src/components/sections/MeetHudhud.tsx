import { lazy, useRef, useState } from 'react'
import { t } from '@/i18n/copy'
import { useReveal } from '@/app/useReveal'
import { Lazy3D } from '@/three/Lazy3D'
import { makeCtrl } from '@/three/mascot/Hudhud'
import { Section, Eyebrow, Heading } from './Section'

const MascotView = lazy(() => import('@/three/mascot/MascotView'))
const SCARVES = ['#2f7d6d', '#c8421f', '#3b5bb5', '#8a4fb0', '#e0a21b']

export function MeetHudhud() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const ctrl = useRef(makeCtrl())
  const [scarf, setScarf] = useState(SCARVES[0])
  const btn = 'h-12 rounded-full border border-ink/15 bg-white px-5 text-sm font-bold text-ink transition-transform active:scale-95'
  return (
    <Section id="hudhud" ref={ref} className="bg-gradient-to-b from-[#f6d9a8] to-[#f3c98b] py-20 lg:py-28">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div data-reveal>
          <Eyebrow>{t.hudhud.eyebrow}</Eyebrow>
          <Heading className="font-display">{t.hudhud.heading}</Heading>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink-soft">{t.hudhud.text}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" className={btn} onClick={() => (ctrl.current.wave = 1.6)}>{t.hudhud.wave}</button>
            <button type="button" className={btn} onClick={() => (ctrl.current.hop = 0.6)}>{t.hudhud.hop}</button>
            <button type="button" className={btn} onClick={() => (ctrl.current.crest = ctrl.current.crest > 0.8 ? 0.15 : 1)}>{t.hudhud.crest}</button>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-semibold text-ink-soft">{t.hudhud.scarf}</span>
            {SCARVES.map((c) => (
              <button key={c} type="button" onClick={() => setScarf(c)} aria-label={c} aria-pressed={scarf === c} className="h-9 w-9 rounded-full border-2 border-white shadow aria-pressed:ring-2 aria-pressed:ring-ink" style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[520px]" data-reveal>
          <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_50%_35%,#fff6df,#f4b96a)] shadow-[inset_0_-30px_60px_rgba(160,80,10,.25)]" aria-hidden />
          <Lazy3D className="absolute inset-0" fallback={<p className="flex h-full items-center justify-center text-7xl" aria-hidden>🐦</p>}>
            <MascotView ctrl={ctrl} scarf={scarf} />
          </Lazy3D>
          <p className="absolute inset-x-0 bottom-0 text-center text-sm font-medium text-ink-soft">{t.hudhud.hint}</p>
        </div>
      </div>
    </Section>
  )
}
