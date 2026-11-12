import { useLayoutEffect, useRef, type RefObject } from 'react'
import { story } from '@/content/story'
import { locale } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { paragraphs } from './logic'
import { useLagged } from './hooks'

/** wide: over the bottom of the spread · stack: under the picture card (portrait phones) · side: a column beside it (landscape phones). */
export type CapLayout = 'wide' | 'stack' | 'side'

/** Never set the author's text smaller than this, whatever the screen. */
const MIN_PX = 17

/** The soft dark pool behind the text on the wide spread. It grows from the start-bottom corner to the paragraph's height. */
function Grad({ out, gref }: { out?: boolean; gref?: RefObject<HTMLDivElement | null> }) {
  return <div ref={gref} className={cn('bk-cap-grad', out && 'is-out')} aria-hidden />
}

function Item({ scene, step, out, layout, grad }: { scene: number; step: number; out?: boolean; layout: CapLayout; grad?: RefObject<HTMLDivElement | null> }) {
  const item = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const para = useRef<HTMLParagraphElement>(null)
  const all = paragraphs(scene)
  const text = all[step] ?? ''

  // The author's paragraph is never cut: on the wide spread first try a slightly smaller size (never below MIN_PX),
  // then let the text area scroll. Under or beside the picture the column itself scrolls.
  useLayoutEffect(() => {
    if (out) return
    const el = para.current
    const box = scroller.current
    const it = item.current
    const cap = it?.parentElement
    const wrap = cap?.parentElement
    if (!el || !box || !it || !cap || !wrap) return
    const fit = () => {
      if (layout !== 'wide') {
        el.style.fontSize = ''
        box.style.maxHeight = ''
        box.dataset.scroll = '0'
        cap.dataset.scroll = cap.scrollHeight > cap.clientHeight + 2 ? '1' : '0'
        return
      }
      const max = wrap.clientHeight * 0.37
      if (max < 40) return
      for (const s of [1, 0.9, 0.82]) {
        el.style.fontSize = s === 1 ? '' : `max(${MIN_PX}px, calc(var(--bk-fs) * ${s}))`
        if (el.offsetHeight <= max) break
      }
      const over = el.offsetHeight > max + 1
      box.style.maxHeight = over ? `${Math.floor(max)}px` : ''
      box.dataset.scroll = over ? '1' : '0'
      if (grad?.current) grad.current.style.setProperty('--g', Math.min(1, it.offsetHeight / Math.max(1, wrap.clientHeight)).toFixed(4))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    ro.observe(cap)
    let alive = true
    void document.fonts?.ready.then(() => alive && fit())
    return () => {
      alive = false
      ro.disconnect()
    }
  }, [text, layout, out, grad])

  return (
    <div ref={item} className={cn('bk-cap-item', out && 'is-out')} aria-hidden={out || undefined}>
      <div className="bk-cap-meta">
        <span className="bk-cap-title">{story.scenes[scene].title[locale]}</span>
        {all.length > 1 && (
          <span className="bk-ticks" aria-hidden>
            {all.map((_, i) => (
              <i key={i} data-on={i === step || undefined} data-seen={i < step || undefined} />
            ))}
          </span>
        )}
      </div>
      <div className="bk-cap-scroll" ref={scroller}>
        <p ref={para} className="bk-text font-story" data-short={text.length < 72 || undefined} data-testid={out ? undefined : 'bk-text'}>
          {text}
        </p>
      </div>
    </div>
  )
}

/**
 * One paragraph of the author's text at a time; paragraphs cross-fade, and the pool behind them follows.
 * The text is visible at rest (its entrance is a CSS animation that only fills backwards). `wait` is true while a
 * leaf is still in the air: the text steps aside until the page has landed (on phones the scene title stays).
 */
export function Caption({ scene, step, wait, layout, hide }: { scene: number; step: number; wait: boolean; layout: CapLayout; hide?: boolean }) {
  const lag = useLagged({ scene, step }, `${scene}-${step}`, 260)
  const gradLag = useLagged(scene, `g${scene}`, 260)
  const grad = useRef<HTMLDivElement>(null)
  const cap = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (cap.current) cap.current.scrollTop = 0
  }, [scene, step])
  return (
    <div className="bk-cap" ref={cap} aria-live="polite" data-layout={layout} data-wait={wait || undefined} data-hide={hide || undefined}>
      {layout === 'wide' && gradLag.prev && <Grad key={gradLag.prev.k} out />}
      {layout === 'wide' && <Grad key={gradLag.cur.k} gref={grad} />}
      {lag.prev && <Item key={lag.prev.k} scene={lag.prev.v.scene} step={lag.prev.v.step} out layout={layout} />}
      <Item key={lag.cur.k} scene={scene} step={step} layout={layout} grad={grad} />
    </div>
  )
}
