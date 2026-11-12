/**
 * The geometry of a page curl, with no rendering in it.
 *
 * Everything is in the "canonical" frame of one leaf: the spine is the line x = 0, the leaf lies on
 * 0 ≤ x ≤ w, 0 ≤ y ≤ h (y down), its free edge is x = w. A forward turn carries the free edge towards −x.
 * Right-to-left books, and turning back, are the same picture mirrored or played in reverse.
 *
 * The leaf wraps around a cylinder that rolls over the page (the model XBPageCurl uses to imitate
 * Apple Books): paper before the cylinder's axis lies flat, paper past it climbs the cylinder, and
 * whatever is left after half a turn continues flat on top, face down.
 *
 * The whole pose is described by ONE point: P, the place where a chosen point A of the free edge
 * currently is. `solve()` turns (A, P) into the cylinder; `constrain()` keeps P where bound paper can go.
 */

export interface Vec {
  x: number
  y: number
}

/** The cylinder: a point on its axis, the unit normal of the axis pointing at the curled side, its radius. */
export interface Cylinder {
  ox: number
  oy: number
  nx: number
  ny: number
  r: number
}

export const FLAT: Cylinder = { ox: 1e6, oy: 0, nx: 1, ny: 0, r: 0 }

/** Radius the curl would like to have for a page of this width (px). */
export const baseRadius = (w: number) => Math.min(84, Math.max(26, w * 0.105))

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** The radius the roll wants when the edge point is `dist` away from where it started: small as the page lifts, full once it is over. */
const wishRadius = (radius: number, dist: number) => radius * (0.5 + 0.5 * smooth(0, radius * 2.4, dist))

/**
 * Bound paper cannot stretch: the image of A stays within its own distance from both ends of the spine
 * (equivalently, the fold never crosses the spine, so the binding never lifts).
 *
 * With `radius` given, the fold also keeps enough clearance from the spine for the roll to stay round:
 * pulling a corner hard across the page tilts the curl, but never flattens it into a crease. The clearance
 * tapers away as the turn completes, so the leaf can still land flat against the binding.
 */
export function constrain(p: Vec, ay: number, w: number, h: number, radius = 0): Vec {
  let { x, y } = p
  const top2 = w * w + ay * ay
  const bot2 = w * w + (h - ay) * (h - ay)
  const progress = Math.min(1, Math.max(0, (w - x) / (2 * w)))
  for (let i = 0; i < 5; i++) {
    const dist = Math.hypot(w - x, ay - y)
    // room ≥ ρ  ⇔  |S − P|² ≤ |S − A|² − 2ρ·|A − P|   (ρ: a quarter-turn of the roll, tapering to nothing at the end)
    const rho = radius > 0 ? (Math.PI / 2) * wishRadius(radius, dist) * 0.92 * Math.min(1, (1 - progress) / 0.22) : 0
    const rTop = Math.sqrt(Math.max(0, top2 - 2 * rho * dist))
    const rBot = Math.sqrt(Math.max(0, bot2 - 2 * rho * dist))
    const dTop = Math.hypot(x, y)
    if (dTop > rTop && dTop > 0) {
      x *= rTop / dTop
      y *= rTop / dTop
    }
    const dBot = Math.hypot(x, y - h)
    if (dBot > rBot && dBot > 0) {
      x *= rBot / dBot
      y = h + (y - h) * (rBot / dBot)
    }
  }
  return { x, y }
}

/** Solves φ − sin φ = k for φ in [0, π] (how far round the cylinder the free edge has climbed). */
export function edgeAngle(k: number): number {
  if (k <= 0) return 0
  if (k >= Math.PI) return Math.PI
  let phi = Math.min(Math.PI, Math.cbrt(6 * k))
  for (let i = 0; i < 6; i++) {
    const f = phi - Math.sin(phi) - k
    const d = 1 - Math.cos(phi)
    if (d < 1e-6) break
    phi = Math.min(Math.PI, Math.max(0, phi - f / d))
  }
  return phi
}

/**
 * The cylinder that puts the edge point A = (w, ay) at P.
 * While the edge is still climbing the cylinder (P close to A) the page lifts; once it is over the top
 * the page folds back and P is A mirrored in the line a quarter-turn (πr/2) past the axis.
 */
export function solve(p: Vec, ay: number, w: number, h: number, radius = baseRadius(w)): Cylinder {
  const dx = w - p.x
  const dy = ay - p.y
  const dist = Math.hypot(dx, dy)
  if (dist < 0.05) return FLAT
  const nx = dx / dist
  const ny = dy / dist
  // Signed distance of the spine's ends from the mirror line (negative = on the flat side).
  const mx = (w + p.x) / 2
  const my = (ay + p.y) / 2
  const mTop = (0 - mx) * nx + (0 - my) * ny
  const mBot = (0 - mx) * nx + (h - my) * ny
  // The axis sits πr/2 before the mirror line and must not reach the spine, so the roll tightens as the leaf lands.
  const room = Math.max(0, -Math.max(mTop, mBot))
  const wish = wishRadius(radius, dist)
  const r = Math.max(0.01, Math.min(wish, (2 / Math.PI) * room))
  const reach = dist >= Math.PI * r ? (dist + Math.PI * r) / 2 : r * edgeAngle(dist / r)
  return { ox: w - nx * reach, oy: ay - ny * reach, nx, ny, r }
}

/** Where a point of the flat leaf ends up (x, y on screen, z above the page). Used by tests and by the engine's checks. */
export function carry(q: Vec, c: Cylinder): { x: number; y: number; z: number; flipped: boolean } {
  const d = (q.x - c.ox) * c.nx + (q.y - c.oy) * c.ny
  if (d <= 0 || c.r <= 0) return { x: q.x, y: q.y, z: 0, flipped: false }
  const arc = d / c.r
  if (arc < Math.PI) {
    const s = c.r * Math.sin(arc) - d
    return { x: q.x + c.nx * s, y: q.y + c.ny * s, z: c.r * (1 - Math.cos(arc)), flipped: arc > Math.PI / 2 }
  }
  const s = Math.PI * c.r - 2 * d
  return { x: q.x + c.nx * s, y: q.y + c.ny * s, z: 2 * c.r, flipped: true }
}

/**
 * Which point of the free edge the hand has hold of. Taking the page near its top or bottom lifts that
 * corner first (the curl starts diagonal and straightens on the way); taking it at mid-height turns it straight.
 */
export function gripY(fingerY: number, h: number): number {
  const t = Math.min(1, Math.max(0, fingerY / h))
  const pull = t > 0.5 ? smooth(0.56, 0.9, t) : -smooth(0.44, 0.1, t)
  return Math.min(h, Math.max(0, fingerY + pull * 0.2 * h))
}

/**
 * Where the edge point should be for a finger at F.
 *  - two pages: the edge itself stays under the finger, right across the spread;
 *  - one page: the finger can only travel one page width, so past the first lift it holds the top of
 *    the roll instead (the fold follows the finger and the turned part slides off the screen).
 */
export function follow(f: Vec, ay: number, w: number, h: number, single: boolean, radius = baseRadius(w)): Vec {
  const dx = f.x - w
  const dy = f.y - ay
  const u = Math.hypot(dx, dy)
  if (u < 1e-3) return { x: w, y: ay }
  const travel = single ? u + Math.max(0, u - Math.PI * radius * 0.82) : u
  const k = travel / u
  return constrain({ x: w + dx * k, y: ay + dy * k }, ay, w, h, radius)
}

/** 0 when the leaf lies unturned, 1 when it lies turned. */
export const progressOf = (p: Vec, w: number) => Math.min(1, Math.max(0, (w - p.x) / (2 * w)))
