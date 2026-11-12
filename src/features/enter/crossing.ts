import { mulberry32 } from '@/lib/seeded'
import { MAPLE } from './Avatar'

/**
 * The crossing into the library: autumn leaves blow in from both sides until they cover the screen,
 * the view changes behind them, and they part like a curtain. One canvas, one rAF loop, ≈ 1.15 s, driven by
 * wall-clock time (so a slow device finishes on time instead of in slow motion). `finish()` skips to the end.
 */
export const CROSS_MS = 1150
/** Moment (ms) at which the screen is fully covered and the view can change unseen. */
export const COVER_MS = 520
const HOLD_MS = 70
const IN_MS = 320
const OUT_MS = 400

const BRIGHT = ['#e2711d', '#f4a72c', '#c8421f', '#f2c14e', '#b9501c', '#d9902f']
const DEEP = ['#3d1d0b', '#4f260f', '#32170a']

interface Leaf {
  tx: number
  ty: number
  sx: number
  sy: number
  ex: number
  ey: number
  size: number
  rot: number
  spin: number
  tIn: number
  tOut: number
  sprite: number
  deep: number
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIn = (t: number) => t * t * t
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Pre-draws one maple leaf (fill, soft shade, veins) so the loop only blits. */
function sprite(color: string, px: number, veins: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  const k = px / 24
  g.scale(k, k)
  const path = new Path2D(MAPLE)
  g.fillStyle = color
  g.fill(path)
  if (veins) {
    const shade = g.createLinearGradient(4, 2, 20, 22)
    shade.addColorStop(0, 'rgba(255,236,190,.32)')
    shade.addColorStop(0.55, 'rgba(255,236,190,0)')
    shade.addColorStop(1, 'rgba(70,20,0,.34)')
    g.fillStyle = shade
    g.fill(path)
    g.strokeStyle = 'rgba(255,240,205,.34)'
    g.lineWidth = 0.26
    g.lineCap = 'round'
    g.stroke(new Path2D('M12 16V4.4M12 13 7.2 6.4M12 13l4.8-6.6M12 14.4 4.4 9.6M12 14.4l7.6-4.8M12 15.4l-5.2.5M12 15.4l5.2.5'))
  }
  return c
}

export function runCrossing(canvas: HTMLCanvasElement, opts: { onCovered: () => void; onDone: () => void }) {
  const ctx = canvas.getContext('2d')
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, w < 720 ? 1.5 : 1.25)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)

  const S = Math.min(190, Math.max(104, Math.max(w, h) * 0.16))
  const step = S * 0.52
  const rnd = mulberry32(20261112)
  const bright = BRIGHT.map((c) => sprite(c, 160, true))
  const deep = DEEP.map((c) => sprite(c, 96, false))
  const leaves: Leaf[] = []
  const half = w / 2
  for (let y = -step * 0.5; y < h + step; y += step) {
    for (let x = -step * 0.5; x < w + step; x += step) {
      const tx = x + (rnd() - 0.5) * step * 0.7
      const ty = y + (rnd() - 0.5) * step * 0.7
      const side = tx < half ? -1 : 1
      const edge = clamp01(Math.abs(tx - half) / half) // 0 at the centre line, 1 at the screen edge
      const far = S * 1.4 + rnd() * w * 0.35
      leaves.push({
        tx,
        ty,
        sx: side < 0 ? -far : w + far,
        sy: ty - h * (0.08 + rnd() * 0.2),
        ex: side < 0 ? -far * 1.1 : w + far * 1.1,
        ey: ty + h * (rnd() - 0.35) * 0.3,
        size: S * (0.78 + rnd() * 0.5),
        rot: rnd() * Math.PI * 2,
        spin: (rnd() - 0.5) * 3.2,
        // the edges fill first and the middle closes last; then the middle opens first
        tIn: (1 - edge) * (COVER_MS - IN_MS) * (0.82 + rnd() * 0.18),
        tOut: COVER_MS + HOLD_MS + edge * (CROSS_MS - COVER_MS - HOLD_MS - OUT_MS) * (0.8 + rnd() * 0.2),
        sprite: Math.floor(rnd() * bright.length),
        deep: Math.floor(rnd() * deep.length),
      })
    }
  }

  let raf = 0
  let covered = false
  let done = false
  const t0 = performance.now()

  const end = () => {
    if (done) return
    done = true
    cancelAnimationFrame(raf)
    if (!covered) {
      covered = true
      opts.onCovered()
    }
    opts.onDone()
  }

  const place = (l: Leaf, t: number) => {
    if (t <= l.tOut) {
      const p = easeOut(clamp01((t - l.tIn) / IN_MS))
      return { x: l.sx + (l.tx - l.sx) * p, y: l.sy + (l.ty - l.sy) * p, a: l.rot + l.spin * (1 - p), on: t >= l.tIn }
    }
    const p = easeIn(clamp01((t - l.tOut) / OUT_MS))
    return { x: l.tx + (l.ex - l.tx) * p, y: l.ty + (l.ey - l.ty) * p, a: l.rot - l.spin * p * 1.4, on: p < 1 }
  }

  const frame = (now: number) => {
    const t = now - t0
    if (!covered && t >= COVER_MS) {
      covered = true
      opts.onCovered()
    }
    if (t >= CROSS_MS || !ctx) return end()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    // two passes: a bed of large dark leaves (so nothing shows through), then the bright ones on top
    for (let pass = 0; pass < 2; pass++) {
      for (const l of leaves) {
        const s = place(l, t)
        if (!s.on) continue
        const size = pass === 0 ? l.size * 1.75 : l.size
        ctx.setTransform(dpr, 0, 0, dpr, s.x * dpr, s.y * dpr)
        ctx.rotate(pass === 0 ? s.a + 0.6 : s.a)
        ctx.drawImage(pass === 0 ? deep[l.deep] : bright[l.sprite], -size / 2, -size / 2, size, size)
      }
    }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return { finish: end }
}
