import { forwardRef, useEffect, useImperativeHandle, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { blurPixels } from './blur'

/**
 * The story's wind. A layer of maple leaves that falls in FRONT of the title, the pills and the scene cards:
 * a few large, out-of-focus, backlit leaves close to the lens and some smaller sunlit ones behind them. It puts
 * the type inside the scene instead of on top of it, and it is the one thing in the hero that answers the visitor:
 *   – it sweeps in from the tree with the title,
 *   – a touch or a click scatters leaves from the finger,
 *   – the mouse drags a wake through them,
 *   – on scroll the layer travels a little faster than the page (it is nearer to the lens) and leans into the wind.
 * One 2D canvas, sprites drawn once, no filters at run time. The hero does not mount it for reduced motion or weak phones.
 */
export interface WindHandle {
  /** Scatter leaves from a point (hero coordinates, CSS px). */
  burst: (x: number, y: number, n?: number) => void
  count: () => number
  running: () => boolean
}

/* ── Sprites ────────────────────────────────────────────────────────────────── */
/** Right half of a maple leaf on a 100 × 100 grid (tip up, stem down); the left half is its mirror. */
const HALF = [
  [50, 2],
  [56.5, 17],
  [64, 13],
  [60.5, 37],
  [72.5, 25],
  [75, 32.5],
  [88.5, 29.5],
  [84.5, 43],
  [93, 47.5],
  [73.5, 63],
  [77, 71.5],
  [53.2, 67.5],
] as const
const VEINS = [
  [71, 28],
  [89, 46],
  [75, 69],
] as const
/** tip → middle → stem. Sunlit leaves in the middle distance; darker, backlit ones close to the lens. */
const MID_TONES = [
  ['#ffe07a', '#f8ac2e', '#e27a17'],
  ['#ffbb52', '#f0731d', '#c4441a'],
  ['#ff9152', '#dc4519', '#a2260f'],
] as const
const NEAR_TONES = [
  ['#ee8f33', '#bd4616', '#7c1e08'],
  ['#e06a26', '#a53412', '#6a1508'],
  ['#f3ab42', '#c9621a', '#8c2c0c'],
] as const

interface Sprite {
  img: HTMLCanvasElement
  /** Canvas size divided by the size of the leaf inside it (the blur needs a margin). */
  box: number
}

function outline(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.moveTo(HALF[0][0], HALF[0][1])
  for (let i = 1; i < HALF.length; i++) ctx.lineTo(HALF[i][0], HALF[i][1])
  ctx.lineTo(51.6, 97)
  ctx.lineTo(48.4, 97)
  for (let i = HALF.length - 1; i >= 1; i--) ctx.lineTo(100 - HALF[i][0], HALF[i][1])
  ctx.closePath()
}

/** One leaf, lit from the upper left like the film: gradient body, a soft highlight, a shaded half, veins. */
function drawLeaf(px: number, tone: readonly string[]): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const x = c.getContext('2d')
  if (!x) return c
  x.scale(px / 100, px / 100)
  x.lineJoin = 'round'
  x.lineCap = 'round'
  const body = x.createLinearGradient(28, 8, 74, 92)
  body.addColorStop(0, tone[0])
  body.addColorStop(0.48, tone[1])
  body.addColorStop(1, tone[2])
  outline(x)
  x.fillStyle = body
  x.fill()
  x.save()
  x.clip()
  const light = x.createRadialGradient(36, 30, 2, 36, 30, 46)
  light.addColorStop(0, 'rgba(255,244,200,.5)')
  light.addColorStop(1, 'rgba(255,244,200,0)')
  x.fillStyle = light
  x.fillRect(0, 0, 100, 100)
  const fold = x.createLinearGradient(50, 0, 100, 0)
  fold.addColorStop(0, 'rgba(120,30,0,.24)')
  fold.addColorStop(0.14, 'rgba(120,30,0,0)')
  x.fillStyle = fold
  x.fillRect(50, 0, 50, 100)
  x.restore()
  x.strokeStyle = 'rgba(118,36,4,.42)'
  x.lineWidth = 1.5
  x.beginPath()
  x.moveTo(50, 96)
  x.lineTo(50, 8)
  for (const [vx, vy] of VEINS) {
    x.moveTo(50, 66)
    x.lineTo(vx, vy)
    x.moveTo(50, 66)
    x.lineTo(100 - vx, vy)
  }
  x.stroke()
  x.strokeStyle = 'rgba(110,30,0,.3)'
  x.lineWidth = 1
  outline(x)
  x.stroke()
  return c
}

/** The same leaf out of focus (blurred once, here; nothing is filtered while it flies). */
function defocus(src: HTMLCanvasElement, sigma: number): Sprite {
  const half = Math.max(1, Math.round(sigma - 0.5))
  const pad = half * 3 + 2
  const size = src.width + pad * 2
  const work = document.createElement('canvas')
  work.width = work.height = size
  const wx = work.getContext('2d', { willReadFrequently: true })
  if (!wx) return { img: src, box: 1 }
  wx.drawImage(src, pad, pad)
  try {
    const im = wx.getImageData(0, 0, size, size)
    blurPixels(im.data, size, size, half)
    wx.putImageData(im, 0, 0)
  } catch {
    return { img: src, box: 1 }
  }
  // a plain canvas draws faster every frame than one kept readable for getImageData
  const out = document.createElement('canvas')
  out.width = out.height = size
  out.getContext('2d')?.drawImage(work, 0, 0)
  return { img: out, box: size / src.width }
}

let sprites: { mid: Sprite[]; near: Sprite[] } | null = null
const getSprites = () => (sprites ??= { mid: MID_TONES.map((t) => defocus(drawLeaf(104, t), 1.5)), near: NEAR_TONES.map((t) => defocus(drawLeaf(132, t), 6.5)) })

/* ── Simulation ─────────────────────────────────────────────────────────────── */
interface Leaf {
  x: number
  y: number
  /** Own fall (px/s). */
  vx: number
  vy: number
  /** What the wind, a touch or the mouse added; fades by itself. */
  ix: number
  iy: number
  /** Size of the leaf on screen (CSS px). */
  size: number
  near: boolean
  sprite: Sprite
  rot: number
  spin: number
  /** Tumble: the leaf turns over as it falls (drawn as a squash along its own axis). */
  flip: number
  flipV: number
  swayA: number
  swayF: number
  phase: number
  /** Seconds left for a scattered leaf; Infinity for the ones that always fall. */
  life: number
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]
const MAX_LEAVES = 46

export const Wind = forwardRef<WindHandle, { host: RefObject<HTMLElement | null>; active: boolean }>(function Wind({ host, active }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const api = useRef<{ start: () => void; stop: () => void; burst: WindHandle['burst']; count: () => number; running: () => boolean } | null>(null)

  useImperativeHandle(ref, () => ({
    burst: (x, y, n) => api.current?.burst(x, y, n),
    count: () => api.current?.count() ?? 0,
    running: () => !!api.current?.running(),
  }))

  useEffect(() => {
    const cv = canvas.current
    const el = host.current
    const ctx = cv?.getContext('2d')
    if (!cv || !el || !ctx) return
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2) // the big leaves are out of focus anyway
    const art = getSprites()
    const leaves: Leaf[] = []
    let W = 0
    let H = 0
    let small = false
    let time = 0
    let running = false
    let first = true
    // wind
    let gustX = 0
    let gustY = 0
    let scrollV = 0
    let lastScroll = window.scrollY
    // mouse wake
    let px = -1e4
    let py = -1e4
    let pvx = 0
    let pvy = 0
    let pt = 0
    let lastBurst = 0

    const make = (near: boolean, scattered = false): Leaf => {
      const size = near ? (small ? rnd(58, 92) : rnd(92, 148)) : scattered ? (small ? rnd(18, 34) : rnd(22, 44)) : small ? rnd(22, 40) : rnd(28, 54)
      return {
        x: 0,
        y: 0,
        vx: near ? rnd(-64, -26) : rnd(-34, -6),
        vy: near ? rnd(92, 150) : scattered ? rnd(80, 150) : rnd(44, 86),
        ix: 0,
        iy: 0,
        size,
        near,
        sprite: pick(near ? art.near : art.mid),
        rot: rnd(0, Math.PI * 2),
        spin: rnd(0.25, 0.9) * (Math.random() < 0.5 ? -1 : 1),
        flip: rnd(0, Math.PI * 2),
        flipV: near ? rnd(0.5, 1) : rnd(0.8, 1.9),
        swayA: near ? rnd(26, 46) : rnd(14, 30),
        swayF: rnd(0.6, 1.3),
        phase: rnd(0, 6.28),
        life: scattered ? rnd(2.1, 3.3) : Infinity,
      }
    }

    /** Keeps the number of falling leaves right for the size of the hero. */
    const populate = () => {
      const wantNear = small ? 2 : W >= 1600 ? 4 : 3
      const wantMid = Math.max(4, Math.min(9, Math.round((W * H) / 165000)))
      for (const near of [true, false]) {
        const have = leaves.filter((l) => l.life === Infinity && l.near === near)
        const want = near ? wantNear : wantMid
        for (let i = have.length; i < want; i++) {
          const l = make(near)
          if (first) {
            // the entrance: they start up-wind (towards the tree) and are carried across the title
            l.x = rnd(0.25, 1.3) * W
            l.y = rnd(-0.3, 0.7) * H
          } else {
            l.x = rnd(0, 1.1) * W
            l.y = -l.size
          }
          leaves.push(l)
        }
        for (let i = have.length - 1; i >= want; i--) leaves.splice(leaves.indexOf(have[i]), 1)
      }
      if (first) {
        gustX = -Math.max(170, Math.min(420, W * 0.26))
        gustY = H * 0.045
        first = false
      }
    }

    const resize = () => {
      W = cv.clientWidth
      H = cv.clientHeight
      small = W < 640
      const w = Math.max(1, Math.round(W * dpr))
      const h = Math.max(1, Math.round(H * dpr))
      if (cv.width !== w || cv.height !== h) {
        cv.width = w
        cv.height = h
      }
      if (W && H) populate()
    }

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(Math.max(deltaMs, 1), 34) / 1000
      time += dt
      // The layer is nearer to the lens than the page, so on scroll it travels a little faster than the page and leans into the wind.
      const sy = window.scrollY
      const sv = Math.max(-3000, Math.min(3000, (sy - lastScroll) / dt))
      lastScroll = sy
      scrollV += (sv - scrollV) * Math.min(1, dt * 9)
      const calm = Math.exp(-dt * 0.85)
      gustX *= calm
      gustY *= calm
      const still = Math.exp(-dt * 5)
      pvx *= still
      pvy *= still
      const windX = gustX - Math.abs(scrollV) * 0.085
      const drag = Math.exp(-dt * 1.7)
      const reach = small ? 120 : 170

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      for (let i = leaves.length - 1; i >= 0; i--) {
        const l = leaves[i]
        const depth = l.near ? 1.45 : 1
        const dx = l.x - px
        const dy = l.y - py
        const d2 = dx * dx + dy * dy
        if (d2 < reach * reach) {
          const f = (1 - Math.sqrt(d2) / reach) ** 2
          l.ix += pvx * f * dt * 3.2
          l.iy += pvy * f * dt * 3.2
        }
        l.ix *= drag
        l.iy *= drag
        l.x += (l.vx + Math.sin(time * l.swayF + l.phase) * l.swayA + l.ix + windX * depth) * dt
        l.y += (l.vy + l.iy + gustY * depth - scrollV * (l.near ? 0.22 : 0.07)) * dt
        l.rot += (l.spin + (l.ix + windX) * 0.0035) * dt
        l.flip += l.flipV * dt

        const m = l.size
        let alpha = l.near ? 0.94 : 0.97
        if (l.life !== Infinity) {
          l.life -= dt
          if (l.life <= 0 || l.y > H + m) {
            leaves.splice(i, 1)
            continue
          }
          alpha *= Math.min(1, l.life / 0.6)
        } else if (l.y > H + m) {
          Object.assign(l, make(l.near), { x: rnd(0.05, 1.15) * W, y: -m })
        } else if (l.x < -m) l.x = W + m
        else if (l.x > W + m * 1.2) l.x = -m

        let f = Math.cos(l.flip)
        if (Math.abs(f) < 0.14) f = f < 0 ? -0.14 : 0.14 // never quite edge-on: a hairline would flicker
        const c = Math.cos(l.rot) * dpr
        const s = Math.sin(l.rot) * dpr
        const b = l.size * l.sprite.box
        ctx.setTransform(c, s, -s * f, c * f, l.x * dpr, l.y * dpr)
        ctx.globalAlpha = alpha
        ctx.drawImage(l.sprite.img, -b / 2, -b / 2, b, b)
      }
    }

    const burst: WindHandle['burst'] = (x, y, n = small ? 8 : 11) => {
      const now = performance.now()
      if (now - lastBurst < 160) return
      lastBurst = now
      for (const l of leaves) {
        const dx = l.x - x
        const dy = l.y - y
        const d = Math.hypot(dx, dy)
        if (d > 260) continue
        const f = (1 - d / 260) ** 2
        l.ix += (dx / Math.max(d, 1)) * f * 560
        l.iy += (dy / Math.max(d, 1)) * f * 560 - f * 120
        l.spin += rnd(-2.5, 2.5) * f
      }
      for (let i = Math.min(n, MAX_LEAVES - leaves.length); i > 0; i--) {
        const a = rnd(0, Math.PI * 2)
        const speed = rnd(150, 560)
        leaves.push(Object.assign(make(false, true), { x, y, ix: Math.cos(a) * speed, iy: Math.sin(a) * speed - 170, spin: rnd(-3.2, 3.2) }))
      }
    }

    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top] as const
    }
    const onDown = (e: PointerEvent) => {
      if (!running) return
      const [x, y] = local(e)
      burst(x, y)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const [x, y] = local(e)
      const now = performance.now()
      const gap = Math.min(0.12, Math.max(0.008, (now - pt) / 1000))
      if (px > -1e3) {
        pvx += ((x - px) / gap - pvx) * 0.5
        pvy += ((y - py) / gap - pvy) * 0.5
      }
      px = x
      py = y
      pt = now
    }
    const onLeave = () => {
      px = py = -1e4
      pvx = pvy = 0
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    el.addEventListener('pointerdown', onDown, { passive: true })
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)

    api.current = {
      start: () => {
        if (running) return
        running = true
        lastScroll = window.scrollY
        gsap.ticker.add(tick)
      },
      stop: () => {
        if (!running) return
        running = false
        gsap.ticker.remove(tick)
      },
      burst,
      count: () => leaves.length,
      running: () => running,
    }
    return () => {
      api.current?.stop()
      api.current = null
      ro.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [host])

  // Fall only while the hero can be seen.
  useEffect(() => {
    if (active) api.current?.start()
    else api.current?.stop()
  }, [active])

  return <canvas ref={canvas} className="hero-wind" aria-hidden />
})
