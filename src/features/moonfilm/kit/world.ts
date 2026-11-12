/**
 * The Moon set: black sunlit sky, the half Earth, the close curved horizon, dust in three tones, craters, rocks,
 * the hard line between day and night, dust grains that fly their own little arcs, and the paper rocket.
 * The Sun is always low and off-frame to screen right: lit sides face right, shadows fall left.
 */
import { C, Painter, STAGE_H, STAGE_W, TAU, blob, circle, ellipse, mixHex, poly, rrect, seededList, type Light } from './core'

// ── sky and Earth ─────────────────────────────────────────────────────────────
export function drawSky(P: Painter) {
  P.screen()
  P.ctx.fillStyle = C.space
  P.ctx.fillRect(-2, -2, STAGE_W + 4, STAGE_H + 4)
}

const LANDS = seededList(77, 60)
/**
 * The Earth: a turning sea-and-cloud disc under a fixed half-shadow (lit half on the right, toward the Sun).
 * Drawn in whatever transform is active. `lights` adds the gold towns on the night half.
 */
export function drawEarth(P: Painter, x: number, y: number, r: number, time: number, lights = false) {
  const c = P.ctx
  const disc = circle(x, y, r)
  c.save()
  c.clip(disc)
  c.fillStyle = C.sea
  c.fill(disc)
  const spin = time * 0.035
  const towns: [number, number][] = []
  // continents: soft green papers riding round the globe
  for (let i = 0; i < 9; i++) {
    const lon = LANDS[i * 5] * TAU + spin
    const lat = (LANDS[i * 5 + 1] - 0.5) * 1.9
    const size = 0.2 + LANDS[i * 5 + 2] * 0.26
    const cz = Math.cos(lon)
    if (cz < -0.2) continue
    const px = x + Math.sin(lon) * Math.cos(lat) * r
    const py = y + Math.sin(lat) * r * 0.92
    const w = size * r * Math.max(0.12, cz)
    const h = size * r * (0.7 + LANDS[i * 5 + 3] * 0.6)
    c.fillStyle = C.land
    c.fill(blob([px - w, py - h * 0.2, px - w * 0.2, py - h, px + w, py - h * 0.5, px + w * 0.7, py + h * 0.6, px - w * 0.3, py + h, px - w * 0.9, py + h * 0.4]))
    if (lights && cz > 0.1) {
      towns.push([px - w * 0.3, py - h * 0.3], [px + w * 0.35, py + h * 0.2])
      if (LANDS[i * 5 + 4] > 0.4) towns.push([px, py + h * 0.55])
    }
  }
  // cloud bands
  c.fillStyle = C.cream
  for (let i = 0; i < 8; i++) {
    const lon = LANDS[30 + i * 3] * TAU + spin * 1.6
    const cz = Math.cos(lon)
    if (cz < 0) continue
    const lat = (LANDS[31 + i * 3] - 0.5) * 1.7
    const px = x + Math.sin(lon) * Math.cos(lat) * r
    const py = y + Math.sin(lat) * r * 0.92
    const w = r * (0.2 + LANDS[32 + i * 3] * 0.26) * Math.max(0.15, cz)
    c.fill(rrect(px - w, py - r * 0.035, w * 2, r * 0.07, r * 0.035))
    c.fill(rrect(px - w * 0.5, py + r * 0.03, w * 1.3, r * 0.055, r * 0.03))
  }
  // polar caps
  c.fill(ellipse(x, y - r * 0.98, r * 0.5, r * 0.12))
  c.fill(ellipse(x, y + r * 0.99, r * 0.42, r * 0.1))
  // the night half: one flat paper with a straight edge
  c.translate(x, y)
  c.rotate(-0.1)
  c.fillStyle = C.earthNight
  c.fillRect(-r * 1.2, -r * 1.2, r * 1.2, r * 2.4)
  c.rotate(0.1)
  c.translate(-x, -y)
  if (lights) {
    c.fillStyle = C.gold
    for (const [tx, ty] of towns) {
      const lx = (tx - x) * Math.cos(0.1) - (ty - y) * Math.sin(0.1)
      if (lx < -r * 0.06) c.fill(circle(tx, ty, Math.max(1.6, r * 0.014)))
    }
  }
  c.restore()
  // a thin bright limb on the sunward side
  c.strokeStyle = 'rgba(243,236,223,0.85)'
  c.lineWidth = Math.max(1.2, r * 0.022)
  c.lineCap = 'round'
  c.beginPath()
  c.arc(x, y, r, -1.35, 1.35)
  c.stroke()
}

// ── ground ────────────────────────────────────────────────────────────────────
export type Ground = {
  /** Height of the horizon at its highest point `cx`, and how tightly it curves (bigger = flatter). */
  horizon: number
  cx: number
  curve: number
  /** Far hills on the horizon: [x, width, height]. */
  hills: [number, number, number][]
  /** Craters: [x, y, radius]. */
  craters: [number, number, number][]
  /** Small stones: [x, y, size]. */
  pebbles: [number, number, number][]
}

const TONES: Record<Exclude<Light, 'sil'>, { near: string; mid: string; far: string; shade: string; hi: string; pit: string }> = {
  day: { near: C.dustNear, mid: C.dustMid, far: C.dustFar, shade: C.navy, hi: C.cream, pit: '#c3beb2' },
  night: { near: C.navy, mid: C.nightMid, far: C.nightFar, shade: '#151b3b', hi: '#2c3668', pit: '#19203f' },
  lamp: { near: '#d9c98f', mid: '#bdac77', far: '#978a62', shade: '#3b3552', hi: '#f6e9b6', pit: '#bfae7a' },
}
export const tones = (P: Painter) => TONES[P.light === 'sil' ? 'day' : P.light]

export const horizonAt = (g: Ground, x: number) => g.horizon + ((x - g.cx) * (x - g.cx)) / (2 * g.curve)

export function drawGround(P: Painter, g: Ground, x0: number, x1: number) {
  const T = tones(P)
  const c = P.ctx
  // far hills: as crisp as the near ground (no air, so no haze)
  c.fillStyle = T.far
  for (const [x, w, h] of g.hills) {
    const y = horizonAt(g, x) + 6
    c.fill(blob([x - w, y, x - w * 0.5, y - h * 0.8, x, y - h, x + w * 0.55, y - h * 0.6, x + w, y]))
  }
  const band = (dy: number, wob: number, color: string) => {
    const p = new Path2D()
    p.moveTo(x0, 4000)
    for (let x = x0; x <= x1 + 80; x += 80) p.lineTo(x, horizonAt(g, x) + dy + Math.sin(x * 0.0061 + dy) * wob)
    p.lineTo(x1 + 80, 4000)
    p.closePath()
    c.fillStyle = color
    c.fill(p)
  }
  band(0, 0, T.mid)
  band(34, 7, T.near)
  for (const [x, y, r] of g.craters) {
    if (x + r < x0 || x - r > x1) continue
    const ry = r * 0.24
    const e = ellipse(x, y, r, ry)
    c.fillStyle = T.pit
    c.fill(e)
    c.save()
    c.clip(e)
    // the sunward rim shades its own inner wall
    c.fillStyle = T.shade
    c.beginPath()
    c.rect(x - r * 2, y - ry * 2, r * 4, ry * 4)
    c.ellipse(x - r * 0.42, y - ry * 0.1, r, ry, 0, 0, TAU, true)
    c.fill('evenodd')
    c.restore()
    c.strokeStyle = T.hi
    c.lineWidth = Math.max(2, r * 0.05)
    c.lineCap = 'round'
    c.beginPath()
    c.ellipse(x, y, r, ry, 0, Math.PI * 0.62, Math.PI * 1.42)
    c.stroke()
  }
  for (const [x, y, s] of g.pebbles) {
    if (x < x0 || x > x1) continue
    if (P.light === 'day') {
      c.fillStyle = T.shade
      c.fill(poly([x, y - s * 0.3, x - s * 5, y - s * 0.1, x - s * 5, y + s * 0.25, x, y + s * 0.35]))
    }
    c.fillStyle = T.far
    c.fill(ellipse(x, y, s, s * 0.6))
    c.fillStyle = T.hi
    c.fill(ellipse(x + s * 0.25, y - s * 0.18, s * 0.6, s * 0.3))
  }
}

/** A rounded Moon rock standing at (x, y). In daylight it throws a long shadow to the left. */
export function drawRock(P: Painter, x: number, y: number, w: number, h: number, lean = 0) {
  const T = tones(P)
  const c = P.ctx
  const shape = (ox = 0, oy = 0) => blob([ox - w, oy, ox - w * 0.82, oy - h * 0.7, ox - w * 0.2 + lean, oy - h, ox + w * 0.6 + lean, oy - h * 0.8, ox + w, oy - h * 0.1, ox + w * 0.8, oy + h * 0.08, ox - w * 0.7, oy + h * 0.08])
  if (P.light === 'day') P.shadow(x, y, () => c.fill(shape()), 0)
  c.save()
  c.translate(x, y)
  const s = shape()
  P.fill(s, T.mid, 3)
  c.clip(s)
  // shade side (away from the Sun) and a lit cap
  c.fillStyle = T.shade
  c.fill(blob([-w * 1.2, h * 0.2, -w * 1.2, -h * 1.1, -w * 0.25 + lean, -h * 1.1, -w * 0.4, -h * 0.3, -w * 0.15, h * 0.2]))
  c.fillStyle = T.hi
  c.fill(blob([-w * 0.2 + lean, -h * 1.1, w * 0.9, -h * 1.0, w * 1.1, -h * 0.3, w * 0.5, -h * 0.62, w * 0.1 + lean, -h * 0.78]))
  c.restore()
}

// ── the line between day and night ────────────────────────────────────────────
export type Terminator = { x: number; y: number; slope: number }
/** Screen-space x of the line at height y (it runs from the foreground toward the horizon, leaning left). */
export const lineX = (L: Terminator, y: number) => L.x + (y - L.y) * L.slope
export function dayRegion(L: Terminator): Path2D {
  return poly([lineX(L, -6000), -6000, 30000, -6000, 30000, 6000, lineX(L, 6000), 6000])
}
export function nightRegion(L: Terminator): Path2D {
  return poly([lineX(L, -6000), -6000, -30000, -6000, -30000, 6000, lineX(L, 6000), 6000])
}

// ── dust ──────────────────────────────────────────────────────────────────────
export type Burst = { t: number; x: number; y: number; seed: number; n?: number; dir?: number; power?: number; spread?: number; night?: boolean }
const MOON_G = 300
/** Each grain flies its own little arc and drops; nothing hangs in the air (there is none). */
export function drawBursts(P: Painter, bursts: Burst[], t: number) {
  const c = P.ctx
  for (const b of bursts) {
    const s = t - b.t
    if (s <= 0 || s > 3.2) continue
    const n = b.n ?? 11
    const rnd = seededList(b.seed, n * 4)
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (b.dir ?? 0) * 0.6 + (rnd[i * 4] - 0.5) * (b.spread ?? 2.2)
      const v = (b.power ?? 150) * (0.4 + 0.8 * rnd[i * 4 + 1])
      const vy = -Math.sin(a) * v
      const dy = vy * s - 0.5 * MOON_G * s * s
      if (dy < 0) continue // landed: gone
      const x = b.x + Math.cos(a) * v * s
      const r = 2 + rnd[i * 4 + 2] * 3
      c.fillStyle = P.light === 'night' ? '#3b4576' : P.light === 'lamp' ? '#efe0a8' : rnd[i * 4 + 3] > 0.5 ? C.cream : '#a39e93'
      c.fill(circle(x, b.y - dy, r))
    }
  }
}

export type Print = { t: number; x: number; y: number; who: 'sari' | 'amir' | 'layla'; dir?: number }
/** Footprints stay: every print made is still there afterwards (no wind, no rain). Only seen in daylight. */
export function drawPrints(P: Painter, prints: Print[], t: number) {
  if (P.light !== 'day') return
  const c = P.ctx
  for (const p of prints) {
    if (t < p.t) continue
    const w = p.who === 'layla' ? 11 : 15
    c.fillStyle = '#aaa59a'
    c.fill(ellipse(p.x, p.y, w, 4.6))
    c.fillStyle = mixHex(C.navy, '#aaa59a', 0.35)
    c.fill(ellipse(p.x + w * 0.42, p.y, w * 0.5, 3.6))
    c.fillStyle = '#aaa59a'
    c.fill(ellipse(p.x + w * 0.2, p.y + 0.6, w * 0.56, 3.4))
  }
}

// ── the paper rocket ──────────────────────────────────────────────────────────
/**
 * The class's rocket, standing on (x, y): cardboard tube with tape strips, paper cone, three stubby fins, one round
 * porthole, a hatch with a short paper ladder; painted in stripes, dots and handprints (never writing).
 * `scale` 1 = about three children tall.
 */
export function drawRocket(P: Painter, x: number, y: number, scale = 1, hatchOpen = true) {
  const c = P.ctx
  c.save()
  c.translate(x, y)
  c.scale(scale, scale)
  const sil = P.light === 'sil'
  // fins
  P.fill(blob([-96, 0, -150, 6, -168, -70, -110, -190, -92, -150]), C.skirt, 4)
  P.fill(blob([96, 0, 150, 6, 168, -70, 110, -190, 92, -150]), C.skirt, 4)
  P.fill(blob([-22, 10, 22, 10, 16, -130, -16, -130]), '#333d73', 3)
  // tube
  const tube = blob([-104, -40, -112, -620, 0, -640, 112, -620, 104, -40, 0, -24])
  P.fill(tube, '#e8dfcd', 5)
  // cone
  P.fill(blob([-118, -604, -70, -760, 0, -900, 70, -760, 118, -604, 0, -588]), C.cream, 5)
  if (!sil) {
    c.save()
    c.clip(tube)
    // shade side, away from the Sun
    c.fillStyle = 'rgba(29,36,71,0.16)'
    c.fillRect(-130, -700, 78, 720)
    // painted stripes and tape
    P.flat(rrect(-130, -560, 260, 34, 0), C.jeans)
    P.flat(rrect(-130, -512, 260, 14, 0), C.sea)
    P.flat(rrect(-130, -120, 260, 30, 0), C.jeans)
    for (const [tx, ty, a] of [[-70, -430, 0.2], [58, -250, -0.25], [-30, -180, 0.1]] as const) {
      c.save()
      c.translate(tx, ty)
      c.rotate(a)
      P.flat(rrect(-34, -8, 68, 16, 2), C.dustNear)
      c.restore()
    }
    // dots and two little handprints
    for (const [dx, dy, r, col] of [[-62, -330, 13, C.sea], [-20, -372, 9, C.land], [70, -470, 11, C.sea], [48, -150, 8, C.land], [-78, -230, 8, C.sea]] as const) P.flat(circle(dx, dy, r), col)
    for (const [hx, hy, a] of [[62, -372, 0.3], [-58, -470, -0.4]] as const) {
      c.save()
      c.translate(hx, hy)
      c.rotate(a)
      P.flat(ellipse(0, 0, 12, 14), C.skirt)
      for (let f = -2; f <= 2; f++) P.flat(rrect(f * 6 - 2.5, -30 + Math.abs(f) * 4, 5, 20, 2.5), C.skirt)
      c.restore()
    }
    c.restore()
    // porthole
    P.fill(circle(0, -500 + 60, 46), C.dustMid, 3)
    P.flat(circle(0, -440, 35), '#16204a')
    P.flat(circle(-10, -450, 8), '#3b78c2')
  }
  // hatch and the short paper ladder
  if (hatchOpen) {
    P.flat(rrect(-52, -330, 104, 150, 44), sil ? P.silColor : '#2b2440')
    P.fill(blob([52, -326, 118, -340, 124, -196, 52, -184]), '#d8cdb8', 3)
    const lad = new Path2D()
    lad.moveTo(-36, -184)
    lad.lineTo(-44, 0)
    lad.moveTo(36, -184)
    lad.lineTo(44, 0)
    for (let i = 0; i < 4; i++) {
      lad.moveTo(-38 - i * 1.6, -150 + i * 42)
      lad.lineTo(38 + i * 1.6, -150 + i * 42)
    }
    P.line(lad, C.cream, 9, 2)
  }
  c.restore()
}
