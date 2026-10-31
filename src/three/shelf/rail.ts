/**
 * The shelf "rail model": a deterministic, physics-engine-free 1-D simulation of books on a plank.
 * Books spring toward their slots, bump neighbours (never interpenetrate), drop in with light gravity
 * on the first landing, and settle. Pure functions over plain objects so it is unit-testable and seed-stable.
 */
import { mulberry32 } from '@/lib/seeded'

export interface RailBook {
  id: string
  w: number // width (metres)
  slot: number // target x
  x: number
  v: number
  y: number // height above the plank
  vy: number
  rotZ: number // airborne tumble (radians)
  tilt: number // residual sideways tilt from a nudge
  landed: boolean
  delay: number // seconds before this book starts moving (landing stagger)
  hidden: boolean // filtered out → ignored by contacts
  heroOrder: number // books shown in the hero land first
}

export const RAIL = {
  GAP: 0.012,
  K: 60,
  ZETA: 0.9,
  E: 0.25, // pair restitution
  G: -9.81 * 0.35, // storybook-light gravity
  E_FLOOR: 0.18,
  SUB: 1 / 120,
  SETTLE_EPS: 1e-3,
}
const C = 2 * RAIL.ZETA * Math.sqrt(RAIL.K)

export function makeRailBooks(ids: string[], widths: number[], pitch: number): RailBook[] {
  const n = ids.length
  return ids.map((id, i) => ({
    id,
    w: widths[i],
    slot: (i - (n - 1) / 2) * pitch,
    x: (i - (n - 1) / 2) * pitch,
    v: 0,
    y: 0,
    vy: 0,
    rotZ: 0,
    tilt: 0,
    landed: true,
    delay: 0,
    hidden: false,
    heroOrder: i,
  }))
}

/** Recompute contiguous slots for the visible books (filtering re-pack). Hidden books keep their slot. */
export function layoutSlots(books: RailBook[], pitch: number) {
  const visible = books.filter((b) => !b.hidden)
  const n = visible.length
  visible.forEach((b, i) => {
    b.slot = (i - (n - 1) / 2) * pitch
  })
}

/** Full landing choreography: books drop from above with sideways impulses, staggered by heroOrder. */
export function startLanding(books: RailBook[], seed = 1337) {
  const r = mulberry32(seed)
  const order = [...books].sort((a, b) => a.heroOrder - b.heroOrder)
  order.forEach((b, i) => {
    b.x = b.slot + (r() - 0.5) * 0.35
    b.v = (r() - 0.5) * 1.2
    b.y = 0.9 + r() * 0.3
    b.vy = 0
    b.landed = false
    b.delay = i * 0.055 + r() * 0.02
    b.rotZ = (r() - 0.5) * 0.6
    b.tilt = 0
  })
}

/** Light re-entry jostle: sideways kicks and a small hop, no drop. */
export function nudge(books: RailBook[], seed = 1337, strength = 0.15) {
  const r = mulberry32(seed)
  books.forEach((b, i) => {
    if (b.hidden) return
    const sign = i % 2 === 0 ? 1 : -1
    b.v += sign * (0.6 + r() * 0.4) * strength * 1.2
    b.vy += (0.35 + r() * 0.5) * strength * 1.5
    b.landed = false
    b.tilt += (r() - 0.5) * 0.35 * strength * 2
    b.delay = 0
  })
}

/** One fixed sub-step. `t` is the simulation time since the choreography started (for delays). */
export function step(books: RailBook[], dt: number, t: number) {
  for (const b of books) {
    if (b.hidden || t < b.delay) continue
    const ax = -RAIL.K * (b.x - b.slot) - C * b.v
    b.v += ax * dt
    b.x += b.v * dt
    if (!b.landed) {
      b.vy += RAIL.G * dt
      b.y += b.vy * dt
      if (b.y <= 0) {
        b.y = 0
        if (Math.abs(b.vy) > 0.6) b.vy = -b.vy * RAIL.E_FLOOR
        else {
          b.vy = 0
          b.landed = true
        }
      }
      // tumble decays as the book approaches the plank
      b.rotZ *= Math.exp(-6 * dt)
    } else {
      b.tilt *= Math.exp(-6 * dt)
    }
  }
  // adjacent-pair contact: books bump, exchange momentum, never interpenetrate
  const active = books.filter((b) => !b.hidden && t >= b.delay).sort((a, c) => a.x - c.x)
  for (let pass = 0; pass < 24; pass++) {
    let any = false
    for (let i = 0; i < active.length - 1; i++) {
      const A = active[i]
      const B = active[i + 1]
      const overlap = A.x + A.w / 2 + RAIL.GAP - (B.x - B.w / 2)
      if (overlap > 0) {
        A.x -= overlap / 2
        B.x += overlap / 2
        const m = (A.v + B.v) / 2
        const d = (A.v - B.v) / 2
        A.v = m - RAIL.E * d
        B.v = m + RAIL.E * d
        any = true
      }
    }
    if (!any) break
  }
}

export function isSettled(books: RailBook[]): boolean {
  const eps = RAIL.SETTLE_EPS
  for (const b of books) {
    if (b.hidden) continue
    if (!b.landed || Math.abs(b.v) > eps || Math.abs(b.x - b.slot) > eps || Math.abs(b.y) > eps || Math.abs(b.tilt) > eps) return false
  }
  return true
}

/** Advance the simulation by a frame delta using fixed sub-steps. Returns the new accumulator. */
export function advance(books: RailBook[], acc: number, delta: number, clock: { t: number }): number {
  acc += Math.min(delta, 1 / 20)
  while (acc >= RAIL.SUB) {
    step(books, RAIL.SUB, clock.t)
    clock.t += RAIL.SUB
    acc -= RAIL.SUB
  }
  return acc
}
