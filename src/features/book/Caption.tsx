import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { story } from '@/content/story'
import { locale } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { paragraphs } from './logic'
import { useLagged } from './hooks'

/** Adds `is-in` one frame after mount, so the entrance is a transition (it can be interrupted without a flash). */
function useEntered() {
  const [inn, setInn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setInn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return inn
}

/** The soft dark band behind the text on the wide spread. It stretches to the height of the paragraph. */
function Grad({ go, out, gref }: { go: boolean; out?: boolean; gref?: RefObject<HTMLDivElement | null> }) {
  const inn = useEntered()
  return <div ref={gref} className={cn('bk-cap-grad', inn && go && !out && 'is-in', out && 'is-out')} aria-hidden />
}

function Item({ scene, step, go, out, stack, grad }: { scene: number; step: number; go: boolean; out?: boolean; stack: boolean; grad?: RefObject<HTMLDivElement | null> }) {
  const inn = useEntered()
  const item = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const para = useRef<HTMLParagraphElement>(null)
  const all = paragraphs(scene)
  const text = all[step] ?? ''

  // The author's paragraph is never cut: first try a slightly smaller size, then let the text area scroll.
  useLayoutEffect(() => {
    if (out) return
    const el = para.current
    const box = scroller.current
    const it = item.current
    const cap = it?.parentElement
    const wrap = cap?.parentElement
    if (!el || !box || !it || !cap || !wrap) return
    const fit = () => {
      const max = stack ? cap.clientHeight - el.offsetTop - it.offsetTop - 8 : wrap.clientHeight * 0.37
      if (max < 40) return
      const sizes = stack ? [1, 0.94] : [1, 0.9, 0.82]
      for (const s of sizes) {
        el.style.fontSize = s === 1 ? '' : `calc(var(--bk-fs) * ${s})`
        if (el.offsetHeight <= max) break
      }
      const over = !stack && el.offsetHeight > max + 1
      box.style.maxHeight = over ? `${Math.floor(max)}px` : ''
      box.dataset.scroll = over ? '1' : '0'
      if (grad?.current) grad.current.style.setProperty('--g', Math.min(1, it.offsetHeight / Math.max(1, wrap.clientHeight)).toFixed(4))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    let alive = true
    void document.fonts?.ready.then(() => alive && fit())
    return () => {
      alive = false
      ro.disconnect()
    }
  }, [text, stack, out, grad])

  return (
    <div ref={item} className={cn('bk-cap-item', inn && go && !out && 'is-in', out && 'is-out')} aria-hidden={out || undefined}>
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
        <p ref={para} className="bk-text font-story" data-testid={out ? undefined : 'bk-text'}>
          {text}
        </p>
      </div>
    </div>
  )
}

/**
 * One paragraph of the author's text at a time; paragraphs cross-fade, and the band behind them follows.
 * `go` is false while a leaf is still in the air: the new text waits until the page has landed.
 */
export function Caption({ scene, step, go, stack, hide }: { scene: number; step: number; go: boolean; stack: boolean; hide?: boolean }) {
  const lag = useLagged({ scene, step }, `${scene}-${step}`, 260)
  const gradLag = useLagged(scene, `g${scene}`, 260)
  const grad = useRef<HTMLDivElement>(null)
  const cap = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (cap.current) cap.current.scrollTop = 0
  }, [scene, step])
  return (
    <div className="bk-cap" ref={cap} aria-live="polite" data-hide={hide || undefined}>
      {gradLag.prev && <Grad key={gradLag.prev.k} go={false} out />}
      <Grad key={gradLag.cur.k} go={go} gref={grad} />
      {lag.prev && <Item key={lag.prev.k} scene={lag.prev.v.scene} step={lag.prev.v.step} go={false} out stack={stack} />}
      <Item key={lag.cur.k} scene={scene} step={step} go={go} stack={stack} grad={grad} />
    </div>
  )
}
