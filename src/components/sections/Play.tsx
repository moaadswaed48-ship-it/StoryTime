import { lazy, useRef, useState } from 'react'
import { Gamepad2, BookOpen } from 'lucide-react'
import { t } from '@/i18n/copy'
import { useReveal } from '@/app/useReveal'
import { useSiteStore } from '@/store/useSiteStore'
import { Lazy3D } from '@/three/Lazy3D'
import { Leaves } from '@/components/fx/Leaves'
import type { GameBus, GameState } from '@/game/GameView'
import { Section, Eyebrow, Heading } from './Section'

const GameView = lazy(() => import('@/game/GameView'))

export function Play() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const openReader = useSiteStore((s) => s.openReader)
  const [st, setSt] = useState<GameState>({ nameIdx: 0, got: 0, leaves: 0, done: false })
  const [running, setRunning] = useState(false)
  const bus = useRef<GameBus>({ running: false, targetY: 0, names: t.game.names, onState: () => undefined, restart: 0 })
  bus.current.onState = (s) => {
    setSt(s)
    if (s.done) setRunning(false)
  }
  const start = () => {
    bus.current.restart++
    bus.current.running = true
    setRunning(true)
  }
  const name = Array.from(t.game.names[Math.min(st.nameIdx, t.game.names.length - 1)])

  return (
    <Section id="play" ref={ref} className="bg-gradient-to-b from-[#f3c98b] via-[#e7a27c] to-[#8a5a8c] py-20 lg:py-28">
      <div className="max-w-[60ch]" data-reveal>
        <Eyebrow>{t.game.eyebrow}</Eyebrow>
        <Heading className="font-display">{t.game.heading}</Heading>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t.game.text}</p>
      </div>
      <div className="relative mt-8 overflow-hidden rounded-[28px] shadow-[0_30px_60px_rgba(60,20,40,.35)]" style={{ height: 'min(72svh, 560px)' }} data-reveal data-lenis-prevent={running ? '' : undefined}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#ffd9a0] via-[#f7a56b] to-[#b5617a]" aria-hidden />
        <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden>
          <path d="M0 150 Q200 60 420 140 T820 120 T1200 150 V260 H0Z" fill="#c9694f" opacity=".7" />
          <path d="M0 200 Q260 120 520 190 T1000 170 T1200 200 V260 H0Z" fill="#8f4a4a" />
        </svg>
        <Leaves density={10} />
        <Lazy3D className="absolute inset-0" fallback={null}>
          <GameView bus={bus} />
        </Lazy3D>
        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="rounded-2xl bg-white/85 px-4 py-2 shadow" aria-live="polite">
            <p className="text-xs font-semibold text-body">{t.game.collect}</p>
            <p className="mt-1 flex gap-1.5" data-testid="game-letters">
              {name.map((ch, i) => (
                <span key={i} className={`font-story inline-flex h-10 w-9 items-center justify-center rounded-lg text-2xl font-bold transition-colors ${i < st.got || st.done ? 'bg-[#c8421f] text-white' : 'bg-[#f3e2c4] text-[#b89b78]'}`}>
                  {ch}
                </span>
              ))}
            </p>
          </div>
          <p className="rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-ink shadow" data-testid="game-score">
            🍂 {st.leaves} {t.game.leaves}
          </p>
        </div>
        {!running && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#3a1c2a]/35 px-6 text-center">
            {st.done && (
              <>
                <p className="font-display text-5xl font-bold text-white drop-shadow">{t.game.bravo}</p>
                <p className="text-lg font-semibold text-white">{t.game.done}</p>
              </>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={start} className="inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 text-base font-bold text-[#8a2f14] shadow-lg active:scale-95" data-testid="game-start">
                <Gamepad2 size={20} aria-hidden /> {st.done ? t.game.again : t.game.start}
              </button>
              {st.done && (
                <button type="button" onClick={() => openReader('read', 0)} className="inline-flex h-14 items-center gap-2 rounded-full bg-[#f4a72c] px-7 text-base font-bold text-[#3a1c06] shadow-lg">
                  <BookOpen size={20} aria-hidden /> {t.game.read}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
