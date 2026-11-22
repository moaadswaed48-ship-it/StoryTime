/**
 * The generic parts of the old Moon set: a hard line between day and night (and the clip regions either side),
 * dust grains that fly their own little arcs, footprints that stay, and a steady star field.
 * The Moon-only pieces (black sky, Earth, cratered ground, rocks, paper rocket, picnic props, flame) were left behind.
 */
import { C, Painter, circle, ellipse, mixHex, poly, seededList } from './core'

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
/** Gravity the old Moon film used for dust (stage units / s²): low, so grains hang a little. */
export const MOON_G = 300
/** Each grain flies its own little arc and drops; nothing hangs in the air. `gravity` defaults to the old Moon value. */
export function drawBursts(P: Painter, bursts: Burst[], t: number, gravity = MOON_G) {
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
      const dy = vy * s - 0.5 * gravity * s * s
      if (dy < 0) continue // landed: gone
      const x = b.x + Math.cos(a) * v * s
      const r = 2 + rnd[i * 4 + 2] * 3
      c.fillStyle = P.light === 'night' ? '#3b4576' : P.light === 'lamp' ? '#efe0a8' : P.light === 'glow' ? '#a9a184' : rnd[i * 4 + 3] > 0.5 ? C.cream : '#a39e93'
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
    c.fillStyle = '#a19c91'
    c.fill(ellipse(p.x, p.y, w, 5))
    c.fillStyle = mixHex(C.navy, '#a19c91', 0.3)
    c.fill(ellipse(p.x + w * 0.42, p.y, w * 0.52, 4))
    c.fillStyle = '#a19c91'
    c.fill(ellipse(p.x + w * 0.16, p.y + 0.7, w * 0.56, 3.6))
  }
}

const STARS = seededList(4242, 240)
/** Stars: only ever seen from inside the night, and perfectly steady (no air to make them twinkle). */
export function drawStars(P: Painter, drift = 0, maxX = Infinity, bottom = 620) {
  P.screen()
  const c = P.ctx
  for (let i = 0; i < 80; i++) {
    const x = (((STARS[i * 3] * 2100 - drift) % 2100) + 2100) % 2100 - 90
    if (x > maxX) continue // never over sunlit ground
    const y = STARS[i * 3 + 1] * bottom
    const big = STARS[i * 3 + 2] > 0.86
    c.fillStyle = big ? 'rgba(243,236,223,0.9)' : 'rgba(243,236,223,0.5)'
    c.fill(circle(x, y, big ? 2.6 : 1.5))
  }
}
