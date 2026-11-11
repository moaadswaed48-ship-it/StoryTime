/**
 * Pure rules of "The Paper Yard": no DOM, no three.js, no copy imports — so they can be unit-tested (tests/game.test.ts).
 * The yard lies on the XZ plane (x → screen right, z → toward the camera), units ≈ metres, Sari is 1.1 tall.
 */

export interface Point {
  x: number
  z: number
}
export interface Circle extends Point {
  r: number
}
export interface Bounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** Where Sari may walk (the fence stands just outside). */
export const YARD: Bounds = { minX: -7.3, maxX: 7.3, minZ: -4.8, maxZ: 5.2 }
/** Sari starts here, facing the camera. */
export const START: Point = { x: 0, z: 3.1 }
/** Things Sari walks around: the big tree, the leaf pile is soft (not listed). */
export const OBSTACLES: Circle[] = [{ x: -5.3, z: -3.5, r: 1.05 }]
export const SARI_RADIUS = 0.34
/** Walking this close to a paper picks it up. */
export const REACH = 0.9
/** Jogging speed in units per second. */
export const SPEED = 3.3

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z)

/* ── Letters ────────────────────────────────────────────────────────────────── */

/** One comparable form for a letter: composed (أ stays one character) and upper-case for Latin. */
export const normLetter = (s: string) => s.normalize('NFC').trim().toLocaleUpperCase('en-US')

/**
 * The first letter of a name, as a child would say it.
 * Arabic: حسن→ح, أحمد→أ (the hamza seat stays with its alef), ساري→س, أمير→أ, ليلى→ل. Latin: Hasan→H.
 */
export function firstLetter(name: string): string {
  const s = name.normalize('NFC').trim()
  // skip anything that is not a letter (quotes, tatweel, marks) before the first real letter
  for (const ch of s) {
    if (ch === 'ـ') continue
    if (/\p{L}/u.test(ch)) return normLetter(ch)
  }
  return ''
}

export const sameLetter = (a: string, b: string) => normLetter(a) === normLetter(b)

/** Fisher–Yates with a seeded generator (the input is not changed). */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** The answer buttons for a name: its first letter plus decoys from the letter pool, in a seeded order. */
export function buildOptions(name: string, letters: readonly string[], rng: () => number, size = 3): string[] {
  const right = firstLetter(name)
  const pool = [...new Set(letters.map(normLetter))].filter((l) => l && l !== right)
  const decoys = shuffle(pool, rng).slice(0, Math.max(0, size - 1))
  return shuffle([right, ...decoys], rng)
}

/* ── The round ──────────────────────────────────────────────────────────────── */

export interface Paper extends Point {
  id: number
  name: string
  letter: string
  options: string[]
}

/**
 * Seeded places for the papers: inside the yard, away from the tree and from each other.
 * The first one always lands a few steps in front of Sari, so a child sees a paper as soon as the game starts.
 */
export function scatter(count: number, rng: () => number, bounds: Bounds = YARD, avoid: readonly Circle[] = OBSTACLES, start: Point = START, minGap = 3.1): Point[] {
  const inset = 1
  const pts: Point[] = []
  const ok = (p: Point, gap: number) => !avoid.some((c) => dist(p, c) < c.r + 0.9) && !pts.some((q) => dist(p, q) < gap) && dist(p, start) > 2.2
  if (count > 0) {
    // near box: ahead of the start point, well inside a phone's narrow view
    for (let i = 0; i < 60 && !pts.length; i++) {
      const p = { x: start.x + (rng() * 2 - 1) * 1.5, z: start.z - 2.6 - rng() * 1.6 }
      if (ok(p, 0)) pts.push(p)
    }
    if (!pts.length) pts.push({ x: clamp(start.x, bounds.minX + inset, bounds.maxX - inset), z: clamp(start.z - 3, bounds.minZ + inset, bounds.maxZ - inset) })
  }
  let gap = minGap
  for (let tries = 1; pts.length < count && tries < 6000; tries++) {
    if (tries % 300 === 0) gap *= 0.85 // crowded: accept a little less space
    const p = {
      x: bounds.minX + inset + rng() * (bounds.maxX - bounds.minX - inset * 2),
      z: bounds.minZ + inset + rng() * (bounds.maxZ - bounds.minZ - inset * 2),
    }
    if (ok(p, gap)) pts.push(p)
  }
  // never reached with the real yard; keeps the contract (always `count` points) for tiny test bounds
  while (pts.length < count) pts.push({ x: (bounds.minX + bounds.maxX) / 2, z: (bounds.minZ + bounds.maxZ) / 2 })
  return pts
}

/** Everything a round needs: one paper per name with its letter, its three buttons and its place in the yard. */
export function buildRound(names: readonly string[], letters: readonly string[], rng: () => number): Paper[] {
  const spots = shuffleTail(scatter(names.length, rng), rng)
  return names.map((name, id) => ({ id, name, letter: firstLetter(name), options: buildOptions(name, letters, rng), ...spots[id] }))
}
/** Keeps the near spot first (paper 0) and shuffles the rest, so the far papers are not always the same names. */
function shuffleTail(spots: Point[], rng: () => number): Point[] {
  return spots.length < 3 ? spots : [spots[0], ...shuffle(spots.slice(1), rng)]
}

export const isCorrect = (paper: Pick<Paper, 'letter'>, letter: string) => sameLetter(paper.letter, letter)

/* ── Progress (nobody loses: a paper is either collected or still waiting) ───── */

export const newProgress = (n: number): boolean[] => Array.from({ length: n }, () => false)
export const collect = (collected: readonly boolean[], i: number): boolean[] => collected.map((v, k) => v || k === i)
export const countCollected = (collected: readonly boolean[]) => collected.filter(Boolean).length
export const allCollected = (collected: readonly boolean[]) => collected.length > 0 && collected.every(Boolean)
/** Index of the closest paper that is still lying in the yard, or −1. */
export function nearestOpen(from: Point, papers: readonly Point[], collected: readonly boolean[]): number {
  let best = -1
  let bestD = Infinity
  papers.forEach((p, i) => {
    const d = dist(from, p)
    if (!collected[i] && d < bestD) {
      best = i
      bestD = d
    }
  })
  return best
}

/* ── Moving about ───────────────────────────────────────────────────────────── */

export const clampToYard = (p: Point, b: Bounds = YARD): Point => ({ x: clamp(p.x, b.minX, b.maxX), z: clamp(p.z, b.minZ, b.maxZ) })

/** Slides a walker out of round obstacles. */
export function pushOut(p: Point, obstacles: readonly Circle[] = OBSTACLES, radius = SARI_RADIUS): Point {
  let { x, z } = p
  for (const c of obstacles) {
    const dx = x - c.x
    const dz = z - c.z
    const d = Math.hypot(dx, dz)
    const min = c.r + radius
    if (d < min) {
      const k = d < 1e-4 ? 0 : min / d
      x = d < 1e-4 ? c.x + min : c.x + dx * k
      z = d < 1e-4 ? c.z : c.z + dz * k
    }
  }
  return { x, z }
}

/** One kinematic step: `dir` is the stick (length ≤ 1 = how hard it is pushed), the result stays in the yard and out of obstacles. */
export function stepWalker(pos: Point, dir: Point, dt: number, speed = SPEED, bounds: Bounds = YARD, obstacles: readonly Circle[] = OBSTACLES): Point {
  const len = Math.hypot(dir.x, dir.z)
  if (len < 1e-4) return pos
  const k = (Math.min(1, len) / len) * speed * dt
  return clampToYard(pushOut({ x: pos.x + dir.x * k, z: pos.z + dir.z * k }, obstacles), bounds)
}

export const touching = (walker: Point, paper: Point, reach = REACH) => dist(walker, paper) <= reach

/** A place to stand `gap` away from a paper, on the side the walker comes from (used by QA hooks and tap-to-walk). */
export function standPoint(paper: Point, from: Point, gap: number, bounds: Bounds = YARD): Point {
  let dx = from.x - paper.x
  let dz = from.z - paper.z
  const d = Math.hypot(dx, dz)
  if (d < 1e-3) {
    dx = 0
    dz = 1
  } else {
    dx /= d
    dz /= d
  }
  return clampToYard({ x: paper.x + dx * gap, z: paper.z + dz * gap }, bounds)
}

/** Heading (rotation about Y) that makes a model facing +Z look along `dir`. */
export const headingOf = (dir: Point) => Math.atan2(dir.x, dir.z)

/** Shortest signed difference between two angles. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

/** A gust slides a paper a little; it stays inside the yard, out of obstacles, and never onto the walker. */
export function gustTarget(paper: Point, wind: Point, strength: number, walker: Point, bounds: Bounds = YARD, obstacles: readonly Circle[] = OBSTACLES): Point {
  const inset = 0.9
  const b = { minX: bounds.minX + inset, maxX: bounds.maxX - inset, minZ: bounds.minZ + inset, maxZ: bounds.maxZ - inset }
  const next = clampToYard(pushOut({ x: paper.x + wind.x * strength, z: paper.z + wind.z * strength }, obstacles, 0.9), b)
  // the fence can push it back against the tree: then the paper simply stays where it is
  if (obstacles.some((c) => dist(next, c) < c.r + 0.9 - 1e-6)) return paper
  return dist(next, walker) < 1.6 ? paper : next
}
