import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, type CSSProperties } from 'react'
import gsap from 'gsap'
import { prefersReducedNow } from '@/app/useMotionTier'
import { story } from '@/content/story'
import { useInView, useOnScreen } from '@/design/ui'
import { t } from '@/i18n/copy'
import { locale, rtl } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { clamp, lerp } from '@/lib/clamp'
import { useSiteStore } from '@/store/useSiteStore'

/** +1 for an Arabic book (spine on the right, pages on the left), −1 for a left-bound one. Mirrors every turn. */
const D = rtl ? 1 : -1
/** How the book lies when nothing moves it (degrees). Keep in step with `.au-book` in author.css. */
const REST = { rx: 24, ry: 19, rz: 5 }

/** The story's title, broken the way the copy already breaks it; any other title falls back to one line. */
const TITLE = story.title[locale]
const LINES = TITLE === `${t.hero.titleA} ${t.hero.titleB}` ? [t.hero.titleA, t.hero.titleB] : [TITLE]

export interface BookHandle {
  /** The book has come to rest on the paper. */
  landed: () => boolean
  /** Current tilt in degrees (rest pose plus pointer and scroll). */
  pose: () => { rx: number; ry: number; rz: number }
  /** Pretend the pointer is at (x, y) in −1…1 around the book (tests). */
  point: (x: number, y: number) => void
}

/**
 * The printed book lying on the paper: a real box in CSS 3D (hard cover with its own thickness, the page block set
 * back from the boards, a ribbon) over three layers of shadow that lie on the paper's plane.
 * It lands once when it scrolls into view, turns a few degrees as the page moves, leans toward the pointer on desktop
 * (lerped; the whole table tilts, so the shadow stays honest) and lifts its cover under the pointer. Clicking opens it.
 * Reduced motion: the rest pose from CSS, nothing runs.
 */
export const LyingBook = forwardRef<BookHandle>(function LyingBook(_, ref) {
  const scene = useRef<HTMLDivElement>(null)
  const book = useRef<HTMLDivElement>(null)
  const ground = useRef<HTMLDivElement>(null)
  const sheen = useRef<HTMLSpanElement>(null)
  const st = useRef({ enter: 1, px: 0, py: 0, tx: 0, ty: 0, sp: 0.5, rx: REST.rx, ry: D * REST.ry, rz: D * REST.rz, landed: true })
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const openBook = useSiteStore((s) => s.openBook)
  const seen = useInView(scene, '0px 0px -18% 0px')
  const on = useOnScreen(scene, '10% 0px')

  const write = () => {
    const s = st.current
    const b = book.current
    const g = ground.current
    if (!b || !g) return
    const e = s.enter
    s.rx = REST.rx - s.py * 3.5 + (1 - e) * 10
    s.ry = D * (REST.ry + (1 - e) * 7) + s.px * 6
    s.rz = D * (REST.rz - (s.sp - 0.5) * 5 - (1 - e) * 10)
    const turn = `rotateX(${s.rx.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg) rotateZ(${s.rz.toFixed(3)}deg)`
    b.style.transform = `translate3d(0, ${(-(1 - e) * 26).toFixed(2)}px, ${((1 - e) * 170).toFixed(2)}px) ${turn}`
    g.style.transform = `${turn} scale(${(1 + (1 - e) * 0.14).toFixed(4)})`
    g.style.opacity = (e * e).toFixed(3)
    if (scene.current) scene.current.style.opacity = clamp(e * 3.2, 0, 1).toFixed(3)
    // the gloss on the cover slides as the angle of view changes
    if (sheen.current) sheen.current.style.transform = `translate3d(${((s.px * 0.55 + (s.sp - 0.5) * 1.5 - (1 - e) * 1.2) * 70).toFixed(2)}%, 0, 0) skewX(-16deg)`
  }

  // Before first paint: lift the book off the paper so it can land (only when motion is allowed).
  useLayoutEffect(() => {
    if (prefersReducedNow()) return
    st.current.enter = 0
    st.current.landed = false
    write()
  }, [])

  // It lands once.
  useEffect(() => {
    if (!seen || st.current.landed || reduced) return
    const tw = gsap.to(st.current, { enter: 1, duration: 1.35, ease: 'power3.out', onUpdate: write, onComplete: () => void (st.current.landed = true) })
    return () => void tw.kill()
  }, [seen, reduced])

  // Scroll turn + pointer lean, on screen only.
  useEffect(() => {
    const el = scene.current
    const s = st.current
    if (!el) return
    if (reduced) {
      // rest pose from the stylesheet
      Object.assign(s, { enter: 1, px: 0, py: 0, tx: 0, ty: 0, sp: 0.5, landed: true })
      for (const n of [book.current, ground.current, sheen.current, el]) if (n) (n.style.transform = ''), (n.style.opacity = '')
      el.parentElement?.style.removeProperty('--sp')
      return
    }
    if (!on) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let cx = 0
    let cy = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      s.tx = clamp((e.clientX - cx) / (window.innerWidth * 0.5), -1, 1)
      s.ty = clamp((e.clientY - cy) / (window.innerHeight * 0.5), -1, 1)
    }
    const onLeave = () => {
      s.tx = 0
      s.ty = 0
    }
    const tick = () => {
      const r = el.getBoundingClientRect()
      cx = r.left + r.width / 2
      cy = r.top + r.height / 2
      const sp = clamp(1 - cy / window.innerHeight, 0, 1)
      if (Math.abs(sp - s.sp) > 0.001) {
        s.sp = sp
        // the word standing behind the book reads this to drift against the page
        el.parentElement?.style.setProperty('--sp', sp.toFixed(3))
      }
      s.px = lerp(s.px, s.tx, 0.1)
      s.py = lerp(s.py, s.ty, 0.1)
      write()
    }
    if (fine) {
      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [on, reduced])

  useImperativeHandle(ref, () => ({
    landed: () => st.current.landed,
    pose: () => ({ rx: st.current.rx, ry: st.current.ry, rz: st.current.rz }),
    point: (x, y) => {
      st.current.tx = clamp(x, -1, 1)
      st.current.ty = clamp(y, -1, 1)
    },
  }))

  return (
    <div ref={scene} className="au-scene" data-fore={rtl ? 'left' : 'right'} style={{ '--d': D } as CSSProperties}>
      {/* the paper's plane: shadows and the ribbon lie on it */}
      <div ref={ground} className="au-ground" aria-hidden>
        <span className="au-sh au-sh--wide" />
        <span className="au-sh au-sh--mid" />
        <span className="au-sh au-sh--contact" />
        <span className="au-ribbon">
          <i />
        </span>
      </div>

      <div ref={book} className="au-book">
        {/* back board, the page block set back from it, then the hinged front board */}
        <span className="au-face au-end" aria-hidden />
        <span className="au-face au-strip au-strip--fore au-board" aria-hidden />
        <span className="au-face au-strip au-strip--tail au-board" aria-hidden />
        <span className="au-face au-strip au-strip--fore au-pages" aria-hidden />
        <span className="au-face au-strip au-strip--tail au-pages" aria-hidden />
        <span className="au-face au-leaf" aria-hidden />
        <div className="au-cover">
          <span className="au-face au-strip au-strip--fore au-board" aria-hidden />
          <span className="au-face au-strip au-strip--tail au-board" aria-hidden />
          <div className="au-face au-front">
            <img src={asset(story.cover)} srcSet={`${asset(story.coverThumb)} 450w, ${asset(story.cover)} 900w`} sizes="(min-width: 1024px) 400px, 62vw" alt="" width={900} height={1200} decoding="async" draggable={false} />
            <div className="au-lockup" aria-hidden>
              <span className="au-lockup__a">{LINES[0]}</span>
              {LINES[1] && <span className="au-lockup__b">{LINES[1]}</span>}
            </div>
            <span className="au-mark" aria-hidden>
              {t.brand}
            </span>
            <span className="au-joint" aria-hidden />
            <span className="au-gloss" aria-hidden>
              <span ref={sheen} />
            </span>
            <button type="button" className="au-open" onClick={() => openBook(0)} aria-label={`${t.author.ctaRead} — ${TITLE}`} />
          </div>
        </div>
      </div>
    </div>
  )
})
