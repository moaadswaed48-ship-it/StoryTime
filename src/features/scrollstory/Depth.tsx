import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowUpRight } from 'lucide-react'
import { LazyCanvas } from '@/design/LazyCanvas'
import { Pill } from '@/design/ui'
import { story } from '@/content/story'
import { useSiteStore } from '@/store/useSiteStore'
import { t } from '@/i18n/copy'
import { dirSign, locale, num } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { clamp } from '@/lib/clamp'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { beats } from './beats'
import { beatOf, CARDS, layout, PER_BEAT, smooth } from './layout'
import { newRig, Scene } from './Scene'

/** Seconds the cards take to catch up with the scroll (critically damped: no overshoot, no lag at rest). */
const FOLLOW = 0.26
const LAST = CARDS - 1
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
const pad2 = (n: number) => num(n).padStart(2, num(0))

interface Hooks {
  progress: () => number
  y: (p: number) => number
  goTo: (beat: number, immediate?: boolean) => void
  goToCard: (card: number, immediate?: boolean) => void
}

/** Rendered in place of the canvas when WebGL is missing or its context was lost: the DOM painting takes over. */
function Lost({ onLost }: { onLost: () => void }) {
  useEffect(onLost, [onLost])
  return null
}

/**
 * The stage in depth. A tall section holds a sticky 100svh stage; the story's twelve paintings hang in a warm
 * dark as cards and every scroll step brings the next one to the front, while three giant words roll past like
 * a counter on a film reel: read (cards 1–4), watch (5–8), play (9–12).
 */
export function DepthStory() {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const words = useRef<(HTMLElement | null)[]>([])
  const counter = useRef<HTMLSpanElement>(null)
  const hooks = useRef<Hooks | null>(null)
  /** Shared with the WebGL scene; fast values live here, never in React state. */
  const rig = useRef(newRig())
  const fast = useRef({
    first: true,
    settled: false,
    v: -1, // last scroll value seen
    reel: -1, // word reel position: -1 hidden below, 0…2 the beats
    beat: 0,
    card: 0,
    on: false,
    out: -1,
    fill: -1,
    reelDrawn: NaN,
    counted: -1,
  })

  const tier = useSiteStore((s) => s.tier)
  const [beat, setBeat] = useState(0)
  const [card, setCard] = useState(0)
  /** The stage has (nearly) locked into place: the copy may enter. */
  const [on, setOn] = useState(false)
  /** Scripts are running: hidden "before" states may apply. Until then everything is simply visible. */
  const [live, setLive] = useState(false)
  /** The next section is a sheet: let it slide over the pinned stage. */
  const [covered, setCovered] = useState(false)
  /** The scene has its first painting: fade the canvas in over the DOM one. */
  const [ready, setReady] = useState(false)
  /** No WebGL (or the context was lost): the DOM painting stays and follows the scroll. */
  const [lost, setLost] = useState(false)
  /** The DOM painting has faded out under the canvas and can go. */
  const [set, setSet] = useState(false)

  rig.current.low = tier === 'low'

  useLayoutEffect(() => {
    const sec = section.current
    const parent = sec?.parentElement
    if (!sec || !parent) return
    setLive(true)
    // A following `.sheet` section (the library) is allowed to slide over the pinned stage.
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

  useEffect(() => {
    rig.current.onReady = () => setReady(true)
    return () => {
      rig.current.onReady = null
    }
  }, [])
  useEffect(() => {
    if (!ready || lost) return setSet(false)
    const id = window.setTimeout(() => setSet(true), 900)
    return () => window.clearTimeout(id)
  }, [ready, lost])
  const onLost = useCallback(() => setLost(true), [])

  useGSAP(
    () => {
      const sec = section.current
      const stg = stage.current
      if (!sec || !stg) return
      const r = rig.current

      // ── measurements (refreshed with ScrollTrigger) ──
      const m = { top: 0, runway: 1, stage: 1, view: 1 }
      const place = () => {
        // The DOM painting (shown until the scene is ready, and instead of it without WebGL) sits exactly where the front card does.
        const L = layout(stg.clientWidth, stg.clientHeight, dirSign)
        stg.style.setProperty('--ss-card-w', `${L.W}px`)
        stg.style.setProperty('--ss-card-x', `${(L.w / 2 + L.fx).toFixed(1)}px`)
        stg.style.setProperty('--ss-card-y', `${(L.h / 2 - L.fy).toFixed(1)}px`)
        stg.style.setProperty('--ss-card-b', `${L.border}px`)
        stg.style.setProperty('--ss-card-r', `${L.radius + L.border}px`)
      }
      const measure = () => {
        let top = 0
        for (let el: HTMLElement | null = sec; el; el = el.offsetParent as HTMLElement | null) top += el.offsetTop
        m.top = top
        m.stage = Math.max(1, stg.offsetHeight)
        m.view = Math.max(1, window.innerHeight)
        m.runway = Math.max(1, sec.offsetHeight - m.stage * (covered ? 2 : 1))
        s.settled = false
        place()
      }
      const ro = new ResizeObserver(place)
      ro.observe(stg)

      // Fast state survives a rebuild of this engine; only "what is on screen" is forgotten.
      const s = fast.current
      Object.assign(s, { first: true, settled: false, v: -1, out: -1, fill: -1, reelDrawn: NaN, counted: -1 })

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
        if (!s.first && s.settled && proxy.v === s.v) return // at rest: do nothing at all
        s.v = proxy.v
        const ms = Math.min(delta, 240)
        const dt = ms / 1000
        const kReel = s.first ? 0 : 1 - Math.pow(1 - 0.14, ms / 16.667)

        // Where the page is, in pixels past the moment the stage locks.
        const px = trig.start + proxy.v * (trig.end - trig.start) - m.top
        if (!Number.isFinite(px)) return
        const enter = clamp(1 + px / m.view, 0, 1)
        const target = clamp(px / m.runway, 0, 1)
        const out = covered ? clamp((px - m.runway) / m.stage, 0, 1) : 0

        // One scroll step, one card: between two cards the rail lingers on each (a soft detent), and the cards
        // follow the scroll through a critically damped spring, so they glide in and settle without a bounce.
        const raw = target * LAST
        const whole = Math.min(LAST - 1, Math.floor(raw))
        const goal = whole + smooth(0.1, 0.9, raw - whole)
        if (s.first) {
          r.pos = goal
          r.vel = 0
        } else {
          const omega = 2 / FOLLOW
          const x = omega * dt
          const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
          const change = r.pos - goal
          const temp = (r.vel + omega * change) * dt
          r.vel = (r.vel - omega * temp) * decay
          r.pos = goal + (change + temp) * decay
          if (Math.abs(goal - r.pos) < 0.0004 && Math.abs(r.vel) < 0.004) {
            r.pos = goal
            r.vel = 0
          }
        }
        s.first = false

        // Entrance: the cards come forward out of the dark as the stage rises into place.
        r.intro = 1 - easeOut(clamp((enter - 0.08) / 0.92, 0, 1))
        if (out !== s.out) {
          s.out = out
          stg.style.setProperty('--ss-out', out.toFixed(4))
        }
        const fill = clamp(r.pos / CARDS + 1 / 6, 0, 1)
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

        // The card in front, with a little hysteresis so a resting scroll never flickers between two.
        if (Math.abs(r.pos - s.card) > 0.56) s.card = clamp(Math.round(r.pos), 0, LAST)
        r.card = s.card
        if (s.card !== s.counted) {
          s.counted = s.card
          setCard(s.card)
          if (counter.current) counter.current.textContent = `${pad2(s.card + 1)} / ${num(CARDS)}`
        }
        const b = beatOf(s.card)
        if (b !== s.beat) {
          s.beat = b
          setBeat(b)
        }

        // The word reel: each word rolls through its own masked window like a digit on a film counter
        // (no fade; one word's height is exactly the window's, so the outgoing word hands over to the incoming one).
        const lowTier = useSiteStore.getState().tier === 'low'
        const reelTo = s.on ? s.beat : -1
        s.reel += (reelTo - s.reel) * kReel
        if (Math.abs(reelTo - s.reel) < 0.0015) s.reel = reelTo
        const creep = (0.5 - clamp((r.pos - s.beat * PER_BEAT) / PER_BEAT, 0, 1)) * 0.05 // em: drifts up a touch as the beat plays
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
              el.style.transform = `translate3d(0, ${d > 0 ? 100 : -100}%, 0)`
              el.style.filter = 'none'
              continue
            }
            el.style.opacity = '1'
            el.style.transform = `translate3d(0, calc(${(d * 100).toFixed(2)}% + ${(creep * (1 - far)).toFixed(4)}em), 0)`
            el.style.filter = far > 0.02 && !lowTier ? `blur(${(Math.sin(far * Math.PI) * 3).toFixed(1)}px)` : 'none'
          }
        }
        s.settled = r.pos === goal && s.reel === reelTo
      }
      gsap.ticker.add(tick)
      tick(0, 16.667) // correct state before the first paint

      const scrollTo = (y: number, immediate?: boolean) => {
        const lenis = useSiteStore.getState().lenis
        if (lenis) lenis.scrollTo(y, immediate ? { immediate: true, force: true } : { duration: 1.1 })
        else window.scrollTo(0, y)
      }
      const yOfCard = (i: number) => m.top + (m.runway * clamp(i, 0, LAST)) / LAST
      hooks.current = {
        progress: () => r.pos / LAST,
        y: (p) => m.top + m.runway * clamp(p, 0, 1),
        goTo: (i, immediate) => scrollTo(yOfCard(clamp(Math.round(i), 0, 2) * PER_BEAT), immediate),
        goToCard: (i, immediate) => scrollTo(yOfCard(Math.round(i)), immediate),
      }

      return () => {
        gsap.ticker.remove(tick)
        ro.disconnect()
        hooks.current = null
      }
    },
    { scope: section, dependencies: [covered], revertOnUpdate: true },
  )

  useEffect(() => {
    exposeQA({
      scrollstory: {
        mode: () => 'depth',
        state: () => ({ beat: fast.current.beat, card: fast.current.card, cards: CARDS, ready: !!stage.current?.classList.contains('has-scene') }),
        beat: () => fast.current.beat,
        card: () => fast.current.card,
        progress: () => hooks.current?.progress() ?? 0,
        y: (p: number) => hooks.current?.y(p) ?? 0,
        /** Jumps to a beat (0 read, 1 watch, 2 play): the first card of its four. */
        goTo: (i: number, immediate = true) => hooks.current?.goTo(i, immediate),
        goToCard: (i: number, immediate = true) => hooks.current?.goToCard(i, immediate),
        /** Draw calls and textures of the last frame. */
        stats: () => ({ ...rig.current.stats }),
      },
    })
  }, [])

  const goTo = (i: number) => hooks.current?.goTo(i)

  // The finger or the mouse leans the whole scene a few degrees. `touch-action: pan-y` (CSS) keeps vertical
  // scrolling with the browser: a touch that turns into a scroll is cancelled and the scene swings back.
  const origin = useRef<{ x: number; y: number } | null>(null)
  const lean = (e: ReactPointerEvent) => {
    const box = stage.current?.getBoundingClientRect()
    if (!box || !box.width || !box.height) return
    if (e.pointerType === 'mouse') {
      rig.current.tx = clamp(((e.clientX - box.left) / box.width) * 2 - 1, -1, 1)
      rig.current.ty = clamp(((e.clientY - box.top) / box.height) * 2 - 1, -1, 1)
      return
    }
    // A finger leans the scene by how far it has moved since it landed, so a tap or the start of a scroll never jolts it.
    if (e.type === 'pointerdown' || !origin.current) origin.current = { x: e.clientX, y: e.clientY }
    rig.current.tx = clamp((e.clientX - origin.current.x) / (box.width * 0.4), -1, 1)
    rig.current.ty = clamp((e.clientY - origin.current.y) / (box.height * 0.4), -1, 1)
  }
  const rest = (e: ReactPointerEvent) => {
    if (e.type !== 'pointerleave' && e.pointerType === 'mouse') return
    origin.current = null
    rig.current.tx = 0
    rig.current.ty = 0
  }

  const scene = story.scenes[card]
  const shown = ready && !lost
  return (
    <section id="ways" ref={section} className={cn('ss', covered && 'is-covered', live && 'is-live')} data-on={on ? '1' : '0'} aria-labelledby="ways-title">
      <div ref={stage} className={cn('ss-stage', shown && 'has-scene')} onPointerDown={lean} onPointerMove={lean} onPointerUp={rest} onPointerCancel={rest} onPointerLeave={rest}>
        <div className="ss-plate grain">
          <div className="ss-glow" aria-hidden />
          <div className="ss-scene" role="img" aria-label={scene.title[locale]}>
            {!(shown && set) && <img key={card} className="ss-poster" src={asset(scene.img)} alt="" width={1344} height={752} decoding="async" draggable={false} />}
            {!lost && (
              <LazyCanvas className="ss-canvas" fallback={<Lost onLost={onLost} />} flat dpr={[1, tier === 'low' ? 1.25 : 2]} camera={{ fov: 30, near: 50, far: 8000, position: [0, 0, 1600] }} style={{ pointerEvents: 'none' }} aria-hidden>
                <Scene rig={rig} />
              </LazyCanvas>
            )}
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
                        {pad2(i + 1)}
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
