import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { DIRECTIONS, DIRECTION_IDS } from '@/studio/instructions'
import { mountSet, type MountedSet } from '@/studio/instructions/mount'
import type { Lang } from '@/studio/scene'
import type { DirectionId } from '@/studio/style/instruction-profiles'

/**
 * The three candidate directions for activity instruction pictures, live: both example activities, with their
 * captions as real text in any of the four languages, and the moving steps playing as loops.
 * It mounts the same code the export script captures. /lab/instructions?dir=hands&lang=ar
 * (Reduced motion: the loops stand still at their chosen moment.)
 */
const LANGS: Lang[] = ['en', 'ar', 'he', 'da']
const selectClass = 'min-h-11 rounded-control border border-line bg-surface px-3'

export default function InstructionsLab() {
  const [params, setParams] = useSearchParams()
  const holder = useRef<HTMLDivElement>(null)
  const dir = (DIRECTION_IDS.includes(params.get('dir') as DirectionId) ? params.get('dir') : 'above') as DirectionId
  const lang = (LANGS.includes(params.get('lang') as Lang) ? params.get('lang') : 'en') as Lang
  const cols = Math.max(1, Math.min(3, Number(params.get('cols') ?? 0))) || undefined

  useEffect(() => {
    const el = holder.current
    if (!el) return
    const wide = el.clientWidth >= 700
    const set: MountedSet = mountSet(el, dir, { lang, cols: cols ?? (wide ? 3 : 1) })
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const t0 = performance.now()
    const moving = set.cards.filter((c) => c.card.loop)
    const tick = (now: number) => {
      for (const c of moving) c.seek(((now - t0) / 1000) % (c.card.loop ?? 1))
      raf = requestAnimationFrame(tick)
    }
    if (!still && moving.length) raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      set.destroy()
    }
  }, [dir, lang, cols])

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  return (
    <main className="flex flex-1 flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Direction
          <select className={selectClass} value={dir} onChange={(e) => set('dir', e.target.value)}>
            {DIRECTION_IDS.map((id) => (
              <option key={id} value={id}>
                {DIRECTIONS[id].profile.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Language
          <select className={selectClass} value={lang} onChange={(e) => set('lang', e.target.value)}>
            {LANGS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="max-w-prose text-sm text-ink-muted">{DIRECTIONS[dir].profile.idea}</p>
      <div ref={holder} className="mx-auto w-full max-w-[1100px]" />
    </main>
  )
}
