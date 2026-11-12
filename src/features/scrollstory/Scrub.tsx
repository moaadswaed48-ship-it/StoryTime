import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowUpRight } from 'lucide-react'
import { Pill } from '@/design/ui'
import { useSiteStore } from '@/store/useSiteStore'
import { t } from '@/i18n/copy'
import { num, rtl } from '@/i18n/locale'
import { clamp, lerp } from '@/lib/clamp'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { beats, LQIP } from './beats'
import { frameStore, loadMeta, restFrame, SharpFrames, type FrameStore } from './frames'

/** Where each beat rests on the scrub runway (0 → 1). */
const REST = [1 / 6, 1 / 2, 5 / 6]
const LERP = 0.12
/** The scroll has to be still this long before the playhead settles on a clean frame and sharpens. */
const REST_MS = 160
/** How long the full-size frame takes to dissolve in over the light one. */
const SHARPEN_MS = 180
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
const smooth = (a: number, b: number, x: number) => {
  const v = clamp((x - a) / (b - a), 0, 1)
  return v * v * (3 - 2 * v)
}
const pad3 = (n: number) => num(n).padStart(3, num(0))

interface Hooks {
  frame: () => number
  beat: () => number
  loaded: () => number
  total: () => number
  sharp: () => number
  progress: () => number
  y: (p: number) => number
  goTo: (i: number, immediate?: boolean) => void
}

/**
 * The scrubbed stage. A tall section holds a sticky 100svh stage; a canvas draws the wind scene
 * frame by frame as the visitor scrolls, and three giant words roll past like a counter on a film reel.
 */
export function ScrubStory() {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const plate = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const words = useRef<(HTMLElement | null)[]>([])
  const counter = useRef<HTMLSpanElement>(null)
  const hooks = useRef<Hooks | null>(null)
  /** Fast values live here, never in React state (the ticker reads and writes them every frame). */
  const fast = useRef({
    first: true,
    dirty: true,
    settled: false,
    v: -1, // last scroll value seen
    t: -1, // last runway target seen
    idle: 0, // ms since the scroll last moved
    p: 0, // smoothed runway progress
    pos: 0, // smoothed frame position (float)
    reel: -1, // word reel position: -1 hidden below, 0…2 the beats
    beat: 0,
    on: false,
    open: -1,
    out: -1,
    fill: -1,
    // last painted
    a: -1,
    b: -1,
    mix: -1,
    zoom: 0,
    pan: 0,
    shown: 1,
    sharpAt: -1, // frame whose full-size twin is (being) shown
    sharpMix: 0,
    sharpDrawn: 0,
    warmed: -1,
    reelDrawn: NaN,
    counted: -1,
    filmed: false,
  })

  const [beat, setBeat] = useState(0)
  /** The stage has (nearly) locked into place: the copy may enter. */
  const [on, setOn] = useState(false)
  /** Scripts are running: hidden "before" states may apply. Until then everything is simply visible. */
  const [live, setLive] = useState(false)
  /** The next section is a sheet: let it slide over the pinned film. */
  const [covered, setCovered] = useState(false)

  useLayoutEffect(() => {
    const sec = section.current
    const parent = sec?.parentElement
    if (!sec || !parent) return
    setLive(true)
    // A following `.sheet` section (the library) is allowed to slide over the pinned film.
    // Watch for it: it may mount, or get its height, after this section does.
    let watched: Element | null = null
    const ro = new ResizeObserver(() => check())
    const check = () => {
      const next = sec.nextElementSibling
      if (next !== watched) {
        if (watched) ro.unobserve(watched)
        watched = next
        if (next) ro.observe(next)
      }
      setCovered(next instanceof HTMLElement && next.classList.contains('sheet') && next.offsetHeight > 0)
    }
    const mo = new MutationObserver(check)
    mo.observe(parent, { childList: true })
    check()
    return () => {
      mo.disconnect()
      ro.disconnect()
    }
  }, [])

  useGSAP(
    () => {
      const sec = section.current
      const stg = stage.current
      const plt = plate.current
      const cv = canvas.current
      const ctx = cv?.getContext('2d')
      if (!sec || !stg || !plt || !cv || !ctx) return

      // ── measurements (refreshed with ScrollTrigger) ──
      const m = { top: 0, runway: 1, stage: 1, view: 1 }
      const measure = () => {
        let top = 0
        for (let el: HTMLElement | null = sec; el; el = el.offsetParent as HTMLElement | null) top += el.offsetTop
        m.top = top
        m.stage = Math.max(1, stg.offsetHeight)
        m.view = Math.max(1, window.innerHeight)
        m.runway = Math.max(1, sec.offsetHeight - m.stage * (covered ? 2 : 1))
        s.dirty = true
      }

      // Fast state survives a rebuild of this engine; only "what is on screen" is forgotten.
      const s = fast.current
      Object.assign(s, { first: true, dirty: true, settled: false, v: -1, t: -1, idle: 0, open: -1, out: -1, fill: -1, a: -1, b: -1, mix: -1, sharpAt: -1, sharpMix: 0, sharpDrawn: 0, reelDrawn: NaN, counted: -1 })

      // ── frames ──
      let store: FrameStore | null = null
      let older: FrameStore | null = null
      let sharp: SharpFrames | null = null
      let dead = false
      let wanted = false
      let released = false
      const saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
      const pick = () => {
        loadMeta().then((meta) => {
          if (dead) return
          // Small screens scrub the light set; the frame the visitor rests on is then swapped for its full-size twin.
          const set = stg.clientWidth < 768 && meta.sets.m ? 'm' : 'd'
          const next = frameStore(set, meta)
          if (next === store) return
          if (store) {
            store.onFrame = null
            older = store
          }
          store = next
          sharp = set === 'm' && meta.sets.d && !saveData ? new SharpFrames(frameStore('d', meta)) : null
          store.onFrame = () => (s.dirty = true)
          store.start()
          if (released) store.release()
          s.dirty = true
        })
      }
      // The first frame is fetched when the section is about two viewports away…
      const near = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          wanted = true
          near.disconnect()
          pick()
        },
        { rootMargin: '200% 0px 200% 0px' },
      )
      near.observe(sec)
      // …and the rest of the film once the page itself has loaded and gone quiet (on the landing page it would
      // otherwise compete with the hero film for the first seconds), or at once if the visitor is already here.
      const release = () => {
        if (released || dead) return
        released = true
        store?.release()
      }
      const here = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          here.disconnect()
          release()
        },
        { rootMargin: '15% 0px 15% 0px' },
      )
      here.observe(sec)
      let idleId = 0
      let idleTimer = 0
      const whenQuiet = () => {
        if (typeof window.requestIdleCallback === 'function') idleId = window.requestIdleCallback(release, { timeout: 1500 })
        else idleTimer = window.setTimeout(release, 600)
      }
      if (document.readyState === 'complete') whenQuiet()
      else window.addEventListener('load', whenQuiet, { once: true })

      // ── canvas ──
      let cw = 0
      let ch = 0
      const size = () => {
        const w = cv.clientWidth
        const h = cv.clientHeight
        if (!w || !h) return
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.4e6 / (w * h)))
        const nw = Math.round(w * ratio)
        const nh = Math.round(h * ratio)
        if (nw !== cv.width || nh !== cv.height) {
          // Resizing wipes the bitmap, so only do it when the size really changed (the next tick repaints).
          cv.width = nw
          cv.height = nh
        } else if (nw === cw && nh === ch) return
        cw = nw
        ch = nh
        // In left-to-right layouts the film is mirrored, so its calm side (the house) is always under the type.
        ctx.setTransform(rtl ? 1 : -1, 0, 0, 1, rtl ? 0 : cw, 0)
        ctx.imageSmoothingQuality = 'high'
        s.a = -1
        s.dirty = true
        if (wanted) pick()
      }
      const ro = new ResizeObserver(size)
      ro.observe(cv)
      size()

      const paint = (img: HTMLImageElement, alpha: number, zoom: number, pan: number) => {
        const iw = img.naturalWidth
        const ih = img.naturalHeight
        const cover = Math.max(cw / iw, ch / ih)
        // The portrait band has no width to spare: there the camera barely pulls back.
        const k = cover * (cw / (iw * cover) < 0.6 ? 1 + (zoom - 1) * 0.2 : zoom)
        const dw = iw * k
        const dh = ih * k
        const w = cw / dw // share of the frame's width that fits on the stage
        // Wide stages show the calm (house) side in full; narrower ones keep Sari's face in frame;
        // the portrait band follows both children with a slow pan.
        const x0 = w >= 0.6 ? Math.min(1 - w, 0.18) : clamp(pan - w / 2, 0, 1 - w)
        ctx.globalAlpha = alpha
        ctx.drawImage(img, -x0 * dw, (ch - dh) / 2, dw, dh)
      }

      // ── scroll link: one scrubbed proxy, no pin ──
      const proxy = { v: 0 }
      const tween = gsap.to(proxy, {
        v: 1,
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom bottom', scrub: true, onRefresh: measure },
      })
      const trig = tween.scrollTrigger
      if (!trig) return
      measure()

      const tick = (_time: number, delta: number) => {
        if (!s.first && s.settled && !s.dirty && proxy.v === s.v) return // at rest: do nothing at all
        s.v = proxy.v
        // Time-based smoothing: on a slow device the film still follows the thumb in real time.
        const dt = Math.min(delta, 240)
        const steps = dt / 16.667
        const k = s.first ? 1 : 1 - Math.pow(1 - LERP, steps)
        const kReel = s.first ? 0 : 1 - Math.pow(1 - 0.14, steps)
        s.first = false
        s.dirty = false

        // Where the page is, in pixels past the moment the stage locks.
        const px = trig.start + proxy.v * (trig.end - trig.start) - m.top
        if (!Number.isFinite(px)) return
        const enter = clamp(1 + px / m.view, 0, 1)
        const target = clamp(px / m.runway, 0, 1)
        const out = covered ? clamp((px - m.runway) / m.stage, 0, 1) : 0

        // The film follows the scroll frame for frame; only once the scroll is still does it settle.
        if (target !== s.t) {
          s.t = target
          s.idle = 0
        } else s.idle += dt
        const resting = s.idle > REST_MS

        s.p += (target - s.p) * k
        if (Math.abs(target - s.p) < 0.0002) s.p = target

        // Entrance: the film opens from a rounded card to full bleed as the stage rises into place.
        const open = easeOut(clamp((enter - 0.08) / 0.92, 0, 1))
        if (open !== s.open) {
          s.open = open
          const c = 1 - open
          plt.style.clipPath = c < 0.001 ? '' : `inset(${(c * 7).toFixed(2)}% ${(c * 5.5).toFixed(2)}% 0 round ${(c * 48).toFixed(1)}px ${(c * 48).toFixed(1)}px 0 0)`
        }
        if (out !== s.out) {
          s.out = out
          stg.style.setProperty('--ss-out', out.toFixed(4))
        }
        const fill = clamp(s.p + 1 / 6, 0, 1)
        if (Math.abs(fill - s.fill) > 0.0005) {
          s.fill = fill
          stg.style.setProperty('--ss-fill', fill.toFixed(4))
        }

        // Copy enters once the stage is nearly in place (and leaves again if the visitor scrolls back up).
        const wantOn = s.on ? enter > 0.5 : enter > 0.72
        if (wantOn !== s.on) {
          s.on = wantOn
          setOn(wantOn)
        }

        // Beats, with a little hysteresis so a resting scroll never flickers between two words.
        const third = s.p * 3
        let b = s.beat
        if (third > b + 1.03) b = Math.min(2, Math.floor(third))
        else if (third < b - 0.03) b = Math.max(0, Math.floor(third))
        if (b !== s.beat) {
          s.beat = b
          setBeat(b)
        }

        // The word reel: each word rolls through its own masked window like a digit on a film counter
        // (no fade: at every moment a word is fully legible or cleanly out of the window).
        const lowTier = useSiteStore.getState().tier === 'low'
        const reelTo = s.on ? s.beat : -1
        s.reel += (reelTo - s.reel) * kReel
        if (Math.abs(reelTo - s.reel) < 0.0015) s.reel = reelTo
        const creep = (0.5 - clamp(third - s.beat, 0, 1)) * 0.05 // em: drifts up a touch as the beat plays
        const reelKey = s.reel * 8 + creep
        if (reelKey !== s.reelDrawn) {
          s.reelDrawn = reelKey
          for (let i = 0; i < words.current.length; i++) {
            const el = words.current[i]
            if (!el) continue
            const d = i - s.reel
            const far = Math.abs(d)
            if (far >= 1) {
              el.style.opacity = '0'
              el.style.transform = `translate3d(0, ${d > 0 ? 1.6 : -1.6}em, 0)`
              el.style.filter = 'none'
              continue
            }
            el.style.opacity = '1'
            el.style.transform = `translate3d(0, ${(d * 1.6 + creep * (1 - far)).toFixed(4)}em, 0)`
            el.style.filter = far > 0.02 && !lowTier ? `blur(${(Math.sin(far * Math.PI) * 5).toFixed(1)}px)` : 'none'
          }
        }

        // The film.
        const src = store && store.loaded ? store : older && older.loaded ? older : store
        let moving = !resting || Math.abs(target - s.p) > 0.0002 || s.reel !== reelTo
        if (src) {
          const last = src.count - 1
          // While the scroll moves the playhead is exactly where the thumb is, smeared frames included
          // (that is what motion blur is for); at rest it eases, a little slower, onto the nearest clean frame.
          const raw = Math.round(target * last)
          const want = resting ? restFrame(raw, src.count) : raw
          src.playhead = want
          const goal = src.loaded ? src.nearest(want) : want
          s.pos += (goal - s.pos) * (resting && want !== raw ? k * 0.5 : k)
          if (Math.abs(goal - s.pos) < 0.004) s.pos = goal
          if (s.pos !== goal) moving = true

          const lo = src.below(Math.floor(s.pos))
          const hi = src.above(Math.ceil(s.pos))
          let a = lo
          let bb = -1
          let mix = 0
          if (lo < 0) a = hi
          else if (hi >= 0 && hi !== lo) {
            // Between two frames each one is held crisp, with a short dissolve across the cut:
            // a slow drag feels like film sliding through a gate, not like steps (and never like a ghost).
            mix = smooth(0.3, 0.7, (s.pos - lo) / (hi - lo))
            if (mix > 0.98) a = hi
            else if (mix >= 0.02 && !lowTier) bb = hi
            else if (mix >= 0.5) a = hi
            mix = bb < 0 ? 0 : Math.round(mix * 64) / 64
          }
          const zoom = 1.02 - 0.02 * s.p + (1 - open) * 0.05
          const pan = lerp(0.405, 0.452, smooth(0, 0.5, s.p))
          const imgA = a >= 0 ? src.images[a] : undefined
          const imgB = bb >= 0 ? src.images[bb] : undefined
          // At rest on a small screen: fetch the full-size twin of this one frame and dissolve it in.
          // It stays up for as long as that frame does, so a nudge of the scroll never makes it pop back.
          let imgS: HTMLImageElement | undefined
          if (sharp && src === store && imgA && bb < 0 && !lowTier && (a === s.sharpAt || (resting && s.pos === goal)) && Math.max(cw / imgA.naturalWidth, ch / imgA.naturalHeight) > 1.05) {
            if (a !== s.sharpAt) {
              s.sharpAt = a
              s.sharpMix = 0
            }
            imgS = sharp.get(a)
            if (!imgS) {
              if (resting) sharp.request(a, () => (s.dirty = true))
            } else if (s.sharpMix < 1) {
              s.sharpMix = Math.min(1, s.sharpMix + dt / SHARPEN_MS)
              if (s.sharpMix < 1) moving = true
            }
          } else {
            s.sharpAt = -1
            s.sharpMix = 0
          }
          const sharpMix = imgS ? Math.round(s.sharpMix * 32) / 32 : 0
          if (imgA && cw > 0 && (a !== s.a || bb !== s.b || mix !== s.mix || sharpMix !== s.sharpDrawn || Math.abs(zoom - s.zoom) > 0.0004 || Math.abs(pan - s.pan) > 0.0004)) {
            if (sharpMix < 1 || !imgS) paint(imgA, 1, zoom, pan)
            if (imgB) paint(imgB, mix, zoom, pan)
            if (imgS && sharpMix > 0) paint(imgS, sharpMix, zoom, pan)
            s.a = a
            s.b = bb
            s.mix = mix
            s.sharpDrawn = sharpMix
            s.zoom = zoom
            s.pan = pan
            s.shown = (imgB && mix >= 0.5 ? bb : a) + 1
            if (!s.filmed) {
              // First picture: fade the canvas in over the blurred placeholder, then drop the placeholder.
              s.filmed = true
              stg.classList.add('has-film')
              window.setTimeout(() => stg.classList.add('film-set'), 900)
            }
          }
          // Decode the next frames in the direction of travel before the playhead gets there.
          const at = Math.round(s.pos)
          if (at !== s.warmed && s.pos !== goal) {
            const dir = goal > s.pos ? 1 : -1
            src.warm(at + dir * 2)
            src.warm(at + dir * 3)
            s.warmed = at
          }
          if (s.shown !== s.counted && counter.current) {
            s.counted = s.shown
            counter.current.textContent = `${pad3(s.shown)} / ${num(src.count)}`
          }
        }
        s.settled = !moving
      }
      gsap.ticker.add(tick)
      tick(0, 16.667) // correct state before the first paint

      hooks.current = {
        frame: () => s.shown,
        beat: () => s.beat,
        loaded: () => store?.loaded ?? 0,
        total: () => store?.count ?? 0,
        sharp: () => s.sharpDrawn,
        progress: () => s.p,
        y: (p) => m.top + m.runway * clamp(p, 0, 1),
        goTo: (i, immediate) => {
          const y = m.top + m.runway * REST[clamp(Math.round(i), 0, 2)]
          const lenis = useSiteStore.getState().lenis
          if (lenis) lenis.scrollTo(y, immediate ? { immediate: true, force: true } : { duration: 1.1 })
          else window.scrollTo(0, y)
        },
      }

      return () => {
        dead = true
        gsap.ticker.remove(tick)
        ro.disconnect()
        near.disconnect()
        here.disconnect()
        window.removeEventListener('load', whenQuiet)
        if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId)
        window.clearTimeout(idleTimer)
        if (store) store.onFrame = null
        hooks.current = null
      }
    },
    { scope: section, dependencies: [covered], revertOnUpdate: true },
  )

  useEffect(() => {
    exposeQA({
      scrollstory: {
        mode: () => 'scrub',
        frame: () => hooks.current?.frame() ?? 0,
        beat: () => hooks.current?.beat() ?? 0,
        loaded: () => hooks.current?.loaded() ?? 0,
        total: () => hooks.current?.total() ?? 0,
        sharp: () => hooks.current?.sharp() ?? 0,
        progress: () => hooks.current?.progress() ?? 0,
        y: (p: number) => hooks.current?.y(p) ?? 0,
        goTo: (i: number, immediate = true) => hooks.current?.goTo(i, immediate),
      },
    })
  }, [])

  const goTo = (i: number) => hooks.current?.goTo(i)

  return (
    <section id="ways" ref={section} className={cn('ss', covered && 'is-covered', live && 'is-live')} data-on={on ? '1' : '0'} aria-labelledby="ways-title">
      <div ref={stage} className="ss-stage">
        <div ref={plate} className="ss-plate grain">
          <div className="ss-film">
            <div className="ss-lqip" style={{ backgroundImage: `url(${LQIP})` }} aria-hidden />
            <canvas ref={canvas} aria-hidden />
          </div>
          <div className="ss-scrim" aria-hidden />
          <div className="ss-dim" aria-hidden />
        </div>

        <div className="ss-ui">
          <div className="ss-copy">
            <h2 id="ways-title" className="ss-kicker glass t-label inline-flex h-9 items-center gap-2.5 rounded-full px-4 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-maple-soft" aria-hidden />
              {t.scroll.kicker}
            </h2>
            <ol className="ss-beats">
              {beats.map((b, i) => (
                <li key={i} className="ss-beat" data-beat={i} data-state={on && i === beat ? 'on' : i < beat ? 'past' : 'next'}>
                  <h3 className="ss-word t-mega">
                    <span
                      ref={(el) => {
                        words.current[i] = el
                      }}
                      className="ss-word-in display-on-film"
                      style={i === 0 ? undefined : { opacity: 0 }}
                    >
                      {b.word}
                    </span>
                  </h3>
                  <div className="ss-detail">
                    <p className="ss-line t-lede text-on-film" style={{ '--i': 0 } as CSSProperties}>
                      <span className="ss-idx" aria-hidden>
                        {num(i + 1).padStart(2, num(0))}
                      </span>
                      <span>{b.line}</span>
                    </p>
                    <div className="ss-cta" style={{ '--i': 1 } as CSSProperties}>
                      <Pill variant="solid" size="md" className="ss-pill shadow-lift" onClick={b.run} onFocus={() => i !== fast.current.beat && goTo(i)}>
                        <b.Icon size={18} strokeWidth={2.2} aria-hidden />
                        {b.cta}
                        <span className="ss-pill-arrow" aria-hidden>
                          <ArrowUpRight size={15} strokeWidth={2.4} className="flip-rtl" />
                        </span>
                      </Pill>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <nav className="ss-rail" aria-label={t.scroll.kicker}>
            <span className="ss-rail-glass glass-ink" aria-hidden />
            <div className="ss-rail-ticks">
              <span className="ss-rail-track" aria-hidden />
              <span className="ss-rail-fill" aria-hidden />
              {beats.map((b, i) => (
                <button key={i} type="button" className="ss-tick" data-on={i === beat ? '1' : '0'} data-done={i < beat ? '1' : '0'} aria-current={i === beat ? 'step' : undefined} onClick={() => goTo(i)}>
                  <span className="ss-tick-label">{b.word}</span>
                  <span className="ss-tick-dot" aria-hidden />
                </button>
              ))}
            </div>
            <span ref={counter} className="ss-count" aria-hidden />
          </nav>
        </div>
      </div>
    </section>
  )
}
