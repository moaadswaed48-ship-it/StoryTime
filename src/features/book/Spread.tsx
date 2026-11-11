import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import gsap from 'gsap'
import { story, SCENES } from '@/content/story'
import { asset } from '@/lib/asset'
import { locale, rtl } from '@/i18n/locale'
import { t } from '@/i18n/copy'
import { sfx } from '@/audio/synth'
import { driftCss, driftOf } from './logic'
import { GUTTER_CSS, blit, pageCanvas, paintPaper, paintPicture, type Affine } from './paint'
import { runTurn, type TurnHandle } from './turn'
import { cachedScene, pageScale, preloadScene, ready } from './pictures'
import { NO_CLIP, type ClipInfo } from './qa'

export type BookPhase = 'closed' | 'opening' | 'open'

/** A request to turn from one scene to another. `snapshot` is the page we are leaving, exactly as it looked. */
export interface TurnReq {
  id: number
  from: number
  to: number
  step: number
  forward: boolean
  snapshot: HTMLCanvasElement
}
export interface SpreadHandle {
  capture(): HTMLCanvasElement | null
  toggleClip(): boolean | null
  clip(): ClipInfo
  /** Freeze the next (or running) opening / page turn at a fraction of its length; `null` lets it run again. */
  hold(p: number | null): void
}

const BLUR = 14 // px, the frosted picture behind the paywall card (keep in step with .bk-page[data-blur])
const COVER_T = 4 // px, thickness of the cover board
const RX0 = 7
const RY0 = rtl ? 24 : -24
const smooth = (v: number) => {
  const x = v < 0 ? 0 : v > 1 ? 1 : v
  return x * x * (3 - 2 * x)
}

/* ── One scene's picture: the still, and its clip when it has one ─────────────── */
interface PicApi {
  readonly img: HTMLImageElement | null
  readonly video: HTMLVideoElement | null
  readonly drift: HTMLDivElement | null
  readonly live: boolean
  toggle(): boolean | null
}

function Picture({ scene, step, clipOn, blurred, api, onClip }: { scene: number; step: number; clipOn: boolean; blurred: boolean; api: RefObject<PicApi | null>; onClip: (playing: boolean, live: boolean) => void }) {
  const s = story.scenes[scene]
  const img = useRef<HTMLImageElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const drift = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const liveRef = useRef(false)
  const userPaused = useRef(false)
  const report = useRef(onClip)
  report.current = onClip

  useLayoutEffect(() => {
    const me: PicApi = {
      get img() {
        return img.current
      },
      get video() {
        return video.current
      },
      get drift() {
        return drift.current
      },
      get live() {
        return liveRef.current
      },
      toggle() {
        const v = video.current
        if (!v) return null
        if (v.paused) {
          userPaused.current = false
          void v.play().catch(() => {})
          return true
        }
        userPaused.current = true
        v.pause()
        return false
      },
    }
    api.current = me
    return () => {
      if (api.current === me) api.current = null
      report.current(false, false)
    }
  }, [api])

  // The clip starts once the page has landed (and never on its own when motion is reduced).
  useEffect(() => {
    const v = video.current
    if (!v) return
    v.muted = true
    if (clipOn) {
      if (!userPaused.current) void v.play().catch(() => {})
    } else v.pause()
  }, [clipOn])

  return (
    <div className="bk-page grain" data-blur={blurred || undefined}>
      <div className="bk-drift" ref={drift} style={{ transform: driftCss(scene, step) }}>
        <img ref={img} src={asset(s.img)} alt={s.title[locale]} draggable={false} decoding="sync" />
        {s.clip && (
          <video
            ref={video}
            src={asset(s.clip)}
            muted
            loop
            playsInline
            preload="auto"
            disableRemotePlayback
            tabIndex={-1}
            aria-hidden
            data-live={live || undefined}
            onPlaying={() => {
              liveRef.current = true
              setLive(true)
              report.current(true, true)
            }}
            onPause={() => report.current(false, liveRef.current)}
          />
        )}
      </div>
    </div>
  )
}

interface Props {
  phase: BookPhase
  /** 0…SCENES − 1, or SCENES for the end page. */
  scene: number
  step: number
  turn: TurnReq | null
  blurred: boolean
  clipOn: boolean
  reduced: boolean
  /** Where the closed book floats (a plain box laid out by CSS). */
  ghost: RefObject<HTMLElement | null>
  onOpen: () => void
  onOpened: () => void
  onTurnEnd: (id: number) => void
  onClip: (playing: boolean, live: boolean) => void
  endPage: ReactNode
}

/**
 * The book itself, in CSS 3D. Closed: a hard cover with a page block, floating and tilting. Opening: it squares up,
 * the cover swings over the spine and the pages widen into the 16:9 spread. Open: pictures, clips and turning leaves.
 * The open spread sits at its natural layout position; the closed pose is only a transform away from it.
 */
export const Spread = forwardRef<SpreadHandle, Props>(function Spread({ phase, scene, step, turn, blurred, clipOn, reduced, ghost, onOpen, onOpened, onTurnEnd, onClip, endPage }, ref) {
  const sceneEl = useRef<HTMLDivElement>(null)
  const book = useRef<HTMLDivElement>(null)
  const cover = useRef<HTMLDivElement>(null)
  const block = useRef<HTMLDivElement>(null)
  const dress = useRef<HTMLDivElement>(null)
  const fx = useRef<HTMLDivElement>(null)
  const inside = useRef<HTMLCanvasElement>(null)
  const frontShade = useRef<HTMLDivElement>(null)
  const backShade = useRef<HTMLDivElement>(null)
  const firstShade = useRef<HTMLDivElement>(null)
  const pic = useRef<PicApi | null>(null)
  const size = useRef({ W: 0, H: 0 })
  const now = useRef({ scene, step, blurred })
  now.current = { scene, step, blurred }
  const pose = useRef({ x: 0, y: 0, s: 1, rx: RX0, ry: RY0 })
  const hold = useRef<number | null>(null)
  const turnH = useRef<TurnHandle | null>(null)
  const turnNo = useRef(0)
  const openTl = useRef<gsap.core.Timeline | null>(null)
  const cb = useRef({ onOpened, onTurnEnd })
  cb.current = { onOpened, onTurnEnd }

  /** A full 16:9 page for a scene (or the paper end page), painted the way the spread will show it at rest. */
  const scenePage = (sc: number, st: number) => {
    const { W, H } = size.current
    const c = pageCanvas(W, H, pageScale(W))
    if (sc >= SCENES) {
      paintPaper(c)
      return { c, ok: true, im: null }
    }
    const im = preloadScene(sc)
    const d = driftOf(sc, st)
    const ok = paintPicture(c, ready(im), { a: d.s, d: d.s, e: (d.tx / 100) * W, f: (d.ty / 100) * H }, pageScale(W))
    return { c, ok, im }
  }

  const paintInside = () => {
    const cv = inside.current
    const { W, H } = size.current
    if (!cv || !W) return
    const k = pageScale(W)
    cv.width = Math.round((W / 2) * k)
    cv.height = Math.round(H * k)
    // The inside of the cover carries the first half of the first spread, so the book opens straight into the picture.
    blit(cv, scenePage(now.current.scene, now.current.step).c, rtl ? W / 2 : 0, rtl ? W : W / 2, W)
  }

  const dropTurn = () => {
    const h = turnH.current
    if (!h) return
    turnH.current = null
    h.kill()
    cb.current.onTurnEnd(turnNo.current)
  }

  useLayoutEffect(() => {
    const el = sceneEl.current!
    const read = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      if (W === size.current.W && H === size.current.H) return
      size.current = { W, H }
      // A resize in the middle of a turn: drop the leaf, the page underneath is already right.
      dropTurn()
      paintInside()
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    capture() {
      const { W, H } = size.current
      if (!W) return null
      const k = pageScale(W)
      const c = pageCanvas(W, H, k)
      const p = pic.current
      if (!p || now.current.scene >= SCENES) {
        paintPaper(c)
        return c
      }
      let m: Affine | null = null
      if (p.drift) {
        const tf = getComputedStyle(p.drift).transform
        if (tf && tf !== 'none') {
          const M = new DOMMatrixReadOnly(tf)
          m = { a: M.a, d: M.d, e: M.e, f: M.f }
        }
      }
      const v = p.video
      const cached = cachedScene(now.current.scene)
      const src = p.live && v && v.readyState >= 2 ? v : (ready(p.img) ?? ready(cached))
      paintPicture(c, src, m, k, now.current.blurred ? `blur(${BLUR * k}px) brightness(0.62) saturate(0.9)` : undefined)
      return c
    },
    toggleClip: () => pic.current?.toggle() ?? null,
    clip() {
      const v = pic.current?.video
      return v ? { has: true, playing: !v.paused && !v.ended, live: !!pic.current?.live, time: v.currentTime, ready: v.readyState } : NO_CLIP
    },
    hold(p) {
      hold.current = p
      if (p == null) {
        openTl.current?.play()
        dropTurn()
        return
      }
      turnH.current?.seek(p)
      openTl.current?.pause().progress(p)
    },
  }))

  /* ── Closed: float, tilt with the pointer (or sway on touch screens) ───────── */
  useLayoutEffect(() => {
    if (phase !== 'closed') return
    const b = book.current!
    const measure = () => {
      const g = ghost.current?.getBoundingClientRect()
      const sc = sceneEl.current!.getBoundingClientRect()
      if (!g || !g.height || !sc.height) return false
      pose.current.x = g.left + g.width / 2 - (sc.left + sc.width / 2 + (rtl ? -1 : 1) * 0.375 * sc.height)
      pose.current.y = g.top + g.height / 2 - (sc.top + sc.height / 2)
      pose.current.s = g.height / sc.height
      return true
    }
    const write = (dy = 0, ds = 1) => {
      const p = pose.current
      b.style.transform = `translate3d(${p.x.toFixed(2)}px, ${(p.y + dy).toFixed(2)}px, 0) scale(${(p.s * ds).toFixed(4)}) rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg)`
      b.style.setProperty('--sheen', `${(50 - (p.ry - RY0) * 2.6).toFixed(1)}%`)
    }
    pose.current.rx = RX0
    pose.current.ry = RY0
    measure()
    write()
    paintInside()
    if (reduced) {
      const again = () => {
        measure()
        write()
      }
      window.addEventListener('resize', again)
      const id = window.setTimeout(again, 60)
      return () => {
        window.removeEventListener('resize', again)
        window.clearTimeout(id)
      }
    }
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e: PointerEvent) => {
      ptr.tx = e.clientX / window.innerWidth - 0.5
      ptr.ty = e.clientY / window.innerHeight - 0.5
    }
    if (fine) window.addEventListener('pointermove', onMove, { passive: true })
    const t0 = performance.now()
    let last = t0
    let raf = 0
    const loop = (ts: number) => {
      const tt = (ts - t0) / 1000
      const dt = Math.min(0.05, (ts - last) / 1000)
      last = ts
      const tx = fine ? ptr.tx : Math.sin(tt * 0.6) * 0.2
      const ty = fine ? ptr.ty : Math.cos(tt * 0.45) * 0.12
      const f = 1 - Math.pow(1 - 0.12, dt * 60)
      ptr.x += (tx - ptr.x) * f
      ptr.y += (ty - ptr.y) * f
      measure()
      pose.current.rx = RX0 - ptr.y * 14
      pose.current.ry = RY0 + ptr.x * 22
      const intro = 1 - Math.pow(1 - Math.min(1, tt / 1.1), 3)
      const float = Math.sin(tt * 1.15) * 7 * pose.current.s
      const dy = float + (1 - intro) * 46
      // Keep the floated position as the pose, so the opening starts exactly where the book is.
      write(dy, 0.94 + 0.06 * intro)
      pose.current.y += dy
      pose.current.s *= 0.94 + 0.06 * intro
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced])

  // Repaint the inside of the cover once the first picture has arrived.
  useEffect(() => {
    if (phase === 'open') return
    let alive = true
    const im = preloadScene(scene)
    if (im && !ready(im))
      im.decode()
        .then(() => alive && paintInside())
        .catch(() => {})
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scene])

  /* ── Opening: square up, swing the cover over the spine, widen into the spread ── */
  useEffect(() => {
    if (phase !== 'opening') return
    const b = book.current!
    const cv = cover.current!
    const { W, H } = size.current
    paintInside()
    const from = { ...pose.current }
    const st = { pose: 1, cover: 0, widen: 0 }
    const sgn = rtl ? 1 : -1
    const RR = parseFloat(getComputedStyle(b).getPropertyValue('--rr')) || 18
    const apply = () => {
      const p = st.pose
      b.style.transform = `translate3d(${(from.x * p).toFixed(2)}px, ${(from.y * p).toFixed(2)}px, 0) scale(${(1 + (from.s - 1) * p).toFixed(4)}) rotateX(${(from.rx * p).toFixed(2)}deg) rotateY(${(from.ry * p).toFixed(2)}deg)`
      const c = st.cover
      // The hinge sinks by the board's thickness, so the opened cover ends up lying in the plane of the pages.
      cv.style.transform = `translateZ(${(5 + (0.6 - COVER_T - 5) * c).toFixed(2)}px) rotateY(${(sgn * 180 * c).toFixed(2)}deg)`
      if (frontShade.current) frontShade.current.style.opacity = (0.55 * smooth(c / 0.5)).toFixed(3)
      if (backShade.current) backShade.current.style.opacity = (0.66 * (1 - smooth((c - 0.5) / 0.5))).toFixed(3)
      if (firstShade.current) firstShade.current.style.opacity = (0.78 * Math.pow(1 - c, 1.5)).toFixed(3)
      b.style.setProperty('--bw', `${(H * 0.75 + (W / 2 - H * 0.75) * st.widen).toFixed(2)}px`)
      b.style.setProperty('--r', `${(6 + (RR - 6) * st.widen).toFixed(2)}px`)
      if (dress.current) dress.current.style.opacity = st.widen.toFixed(3)
      if (block.current) block.current.style.visibility = p < 0.004 ? 'hidden' : 'visible'
    }
    const tl = gsap.timeline({ onUpdate: apply, onComplete: () => cb.current.onOpened() })
    tl.to(st, { pose: 0, duration: 1.0, ease: 'power3.inOut' }, 0)
    tl.to(st, { cover: 1, duration: 1.12, ease: 'power2.inOut' }, 0.4)
    tl.to(st, { widen: 1, duration: 0.64, ease: 'power2.out' }, 1.06)
    openTl.current = tl
    if (hold.current != null) tl.pause().progress(hold.current)
    sfx.pop()
    return () => {
      tl.kill()
      openTl.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Open: the book rests at its layout position, with nothing left over from the closed pose.
  useLayoutEffect(() => {
    if (phase !== 'open') return
    const b = book.current!
    b.style.transform = ''
    b.style.removeProperty('--bw')
    b.style.removeProperty('--r')
    if (dress.current) dress.current.style.opacity = ''
  }, [phase])

  /* ── Page turns ─────────────────────────────────────────────────────────────── */
  const turnId = turn?.id
  useLayoutEffect(() => {
    if (!turn) return
    const { W, H } = size.current
    const host = fx.current
    if (!W || !host) {
      cb.current.onTurnEnd(turn.id)
      return
    }
    const leaves = Math.max(1, Math.min(3, Math.abs(turn.to - turn.from)))
    const pages = [turn.snapshot]
    for (let j = 1; j < leaves; j++) pages.push(scenePage(Math.round(turn.from + ((turn.to - turn.from) * j) / leaves), 0).c)
    const last = scenePage(turn.to, turn.step)
    pages.push(last.c)
    const RR = parseFloat(getComputedStyle(book.current!).getPropertyValue('--rr')) || 18
    // Forward: the page after the spine lifts and turns back over it (left to right in Arabic).
    const h = runTurn({
      host,
      W,
      H,
      side: turn.forward === rtl ? 'left' : 'right',
      pages,
      radius: RR,
      onDone: () => {
        if (turnH.current === h) turnH.current = null
        cb.current.onTurnEnd(turn.id)
      },
    })
    turnH.current = h
    turnNo.current = turn.id
    if (hold.current != null) h.seek(hold.current)
    sfx.flip()
    let alive = true
    if (!last.ok && last.im)
      last.im
        .decode()
        .then(() => alive && h.repaintLast(scenePage(turn.to, turn.step).c))
        .catch(() => {})
    return () => {
      alive = false
      h.kill()
      if (turnH.current === h) turnH.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnId])

  const shut = phase !== 'open'
  return (
    <div className="bk-scene" ref={sceneEl}>
      <div className="bk-book" ref={book} data-phase={phase} data-rtl={rtl ? '1' : '0'}>
        <div className="bk-dress" ref={dress} aria-hidden>
          <div className="bk-board" />
          <div className="bk-edges-s" />
          <div className="bk-edges-b" />
        </div>
        {shut && (
          <div className="bk-block" ref={block} aria-hidden>
            <div className="bk-b-back" />
            <div className="bk-b-fore" />
            <div className="bk-b-top" />
            <div className="bk-b-bottom" />
            <div className="bk-b-spine" />
          </div>
        )}
        <div className="bk-base bk-clip">{scene < SCENES ? <Picture key={scene} scene={scene} step={step} clipOn={clipOn} blurred={blurred} api={pic} onClip={onClip} /> : endPage}</div>
        <div className="bk-gutter bk-clip" style={{ background: GUTTER_CSS }} aria-hidden />
        {shut && <div className="bk-firstshade" ref={firstShade} aria-hidden />}
        <div className="bk-fx" ref={fx} aria-hidden />
        {shut && (
          <div className="bk-cover" ref={cover} onClick={phase === 'closed' ? onOpen : undefined} aria-hidden>
            <div className="bk-cover-front">
              <img src={asset(story.cover)} alt="" draggable={false} />
              <div className="bk-cover-title">
                <span className="a">{t.hero.titleA}</span>
                <span className="b">{t.hero.titleB}</span>
              </div>
              <span className="bk-cover-mark">{t.brand}</span>
              <div className="bk-cover-joint" />
              <div className="bk-cover-sheen" />
              <div className="bk-cover-shade" ref={frontShade} />
            </div>
            <div className="bk-cover-edge" />
            <div className="bk-cover-back">
              <canvas ref={inside} />
              <div className="bk-cover-shade" ref={backShade} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
