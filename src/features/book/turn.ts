import gsap from 'gsap'
import { blit } from './paint'

/**
 * The page turn: a real two-sided leaf hinged on the centre spine.
 *
 * The leaf bends, it does not hinge. It is a chain of twelve narrow strips (nested 3D transforms): the spine side
 * turns by `θ = π·q` and every strip further out lags a little more, up to `FLEX·sin(π·q)` at the free edge, so the
 * sheet bows like paper and lies flat again at both ends of the turn. The front faces carry the page being left, the
 * back faces the page being reached; every face gets its own shade and sheen from its angle to the light, and the
 * leaf drops a moving shadow on the page it leaves and on the page it lands on.
 *
 * A turn runs on its own (≈ 1 s, cubic in-out), or follows a finger (`manual`) and then settles forward or back.
 * Jumps of several scenes riffle up to three leaves.
 */
const N = 12 // strips per leaf
const FLEX = 0.42 // radians the free edge trails the spine side at the top of the arc
const STAGGER = 0.13 // seconds between the leaves of a riffle
export const TURN_SECONDS = 1.05
export const turnSeconds = (leaves: number) => TURN_SECONDS + Math.max(0, leaves - 1) * STAGGER

const DEG = 180 / Math.PI
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smooth = (v: number) => {
  const x = clamp01(v)
  return x * x * (3 - 2 * x)
}

export interface TurnOpts {
  /** A `transform-style: preserve-3d` box that covers the spread. */
  host: HTMLElement
  W: number
  H: number
  /** Which half lifts: the leaf turns from this half over the spine to the other one. */
  side: 'left' | 'right'
  /** pages[0] is the page being left, pages[last] the page being reached; anything between is riffled past. */
  pages: HTMLCanvasElement[]
  radius: number
  /** The leaf waits for `drag()` / `release()` instead of running by itself. */
  manual?: boolean
  /** `landed` is false when a dragged leaf was let go early and fell back. */
  onDone: (landed: boolean) => void
}
export interface TurnHandle {
  kill(): void
  /** Freeze the turn at a fraction of its length (screenshots and tests). */
  seek(p: number): void
  /** Manual turns: how far the leaf is turned, 0…1. */
  drag(q: number): void
  /** Manual turns: let go. The leaf finishes the turn, or falls back. */
  release(land: boolean): void
  /** Repaint the incoming page (its picture arrived after the turn began). */
  repaintLast(page: HTMLCanvasElement): void
}

interface Face {
  cv: HTMLCanvasElement
  /** The page this face is cut from, and where (CSS pixels across the spread). */
  page: HTMLCanvasElement
  x0: number
  x1: number
  /** The shade currently painted on it. */
  shade: number
}
interface Strip {
  el: HTMLDivElement
  /** The front and the back face; only the one facing the reader is kept in the tree. */
  front: Face
  rear: Face
  facing: 'front' | 'rear' | ''
}
interface Leaf {
  strips: Strip[]
  z0: number
  z1: number
}

function box(css: Partial<CSSStyleDeclaration>): HTMLDivElement
function box(css: Partial<CSSStyleDeclaration>, tag: 'canvas'): HTMLCanvasElement
function box(css: Partial<CSSStyleDeclaration>, tag: 'div' | 'canvas' = 'div') {
  const e = document.createElement(tag)
  Object.assign(e.style, { position: 'absolute', top: '0', pointerEvents: 'none' } satisfies Partial<CSSStyleDeclaration>, css)
  return e
}

// Light comes from the reader's side: a face is brightest flat on the table and darkest edge-on, with a band of
// sheen where the paper catches the light. The shade is painted into each strip's own little canvas (no overlay
// layers, no filters); twelve strips are fine enough to read as a smooth falloff. Angle in degrees.
const dark = (t: number) => (t <= 90 ? 0.6 * (1 - Math.cos(t / DEG)) : 0.64 * (1 + Math.cos(t / DEG)))
const glint = (t: number) => (t <= 90 ? 0.2 * Math.exp(-(((t - 26) / 14) ** 2)) : 0.15 * Math.exp(-(((t - 150) / 15) ** 2)))
/** Positive: how dark the face is. Negative: how much sheen it carries. */
const shadeOf = (t: number) => dark(t) - glint(t) * 1.25

function cast(el: HTMLElement, dir: string, reach: number, alpha: number, height: number) {
  if (alpha < 0.004) {
    el.style.background = 'none'
    return
  }
  const p1 = Math.min(100, reach * 100 + 2)
  const p2 = Math.min(100, p1 + 12 + 34 * height)
  el.style.background = `linear-gradient(${dir}, rgba(18,9,3,${(alpha * 0.8).toFixed(3)}) 0%, rgba(18,9,3,${alpha.toFixed(3)}) ${p1.toFixed(1)}%, rgba(18,9,3,${(alpha * 0.42).toFixed(3)}) ${(p1 + (p2 - p1) * 0.38).toFixed(1)}%, rgba(18,9,3,0) ${p2.toFixed(1)}%)`
}

export function runTurn(o: TurnOpts): TurnHandle {
  const { host, W, H, side, pages, radius } = o
  const m = pages.length - 1
  const c = W / 2
  const w = c / N
  const right = side === 'right'
  const sgn = right ? -1 : 1
  const kx = pages[0].width / W
  const ky = pages[0].height / H
  const ease = gsap.parseEase('power3.inOut')
  const total = turnSeconds(m)
  const persp = W * 2.1 // keep in step with `.bk-scene { perspective }`
  const nodes: HTMLElement[] = []
  const r = `${radius}px`
  const OV = 1.5 // faces overlap their neighbours a little, so no seam shows between the strips
  const outer = (onRight: boolean) => (onRight ? { borderTopRightRadius: r, borderBottomRightRadius: r } : { borderTopLeftRadius: r, borderBottomLeftRadius: r })
  const half = (onRight: boolean, z: string, tag?: 'canvas') => {
    const css = { left: onRight ? `${c}px` : '0', width: `${c}px`, height: `${H}px`, transform: `translateZ(${z})` }
    const e = tag ? box(css, tag) : box(css)
    Object.assign(e.style, outer(onRight))
    if (e instanceof HTMLCanvasElement) {
      e.width = Math.round(c * kx)
      e.height = Math.round(H * ky)
    }
    return e
  }

  // The leaf brings its own table: the half that stays keeps the page being left, the half under the leaf shows the
  // page being reached. So it looks right whatever the spread underneath is showing at that moment.
  const stay = half(!right, '0.2px', 'canvas') as HTMLCanvasElement
  blit(stay, pages[0], right ? 0 : c, right ? c : W, W)
  const under = half(right, '0.15px', 'canvas') as HTMLCanvasElement
  blit(under, pages[m], right ? c : 0, right ? W : c, W)
  const liftShade = half(right, '0.3px')
  const landShade = half(!right, '0.3px')
  nodes.push(under, stay, liftShade, landShade)

  const leaves: Leaf[] = []
  for (let j = 0; j < m; j++) {
    const strips: Strip[] = []
    let parent: HTMLElement = host
    for (let i = 0; i < N; i++) {
      const el = box({
        left: i === 0 ? `${right ? c : c - w}px` : `${right ? w : -w}px`,
        width: `${w}px`,
        height: `${H}px`,
        transformStyle: 'preserve-3d',
        transformOrigin: right ? '0 50%' : '100% 50%',
        willChange: 'transform',
      })
      // Where this strip lies on the page it lifts from, with the overlap on both sides (none past the outer edge).
      const tip = i === N - 1
      const ovL = right ? OV : tip ? 0 : OV
      const ovR = right ? (tip ? 0 : OV) : OV
      const x0 = (right ? c + i * w : c - (i + 1) * w) - ovL
      const x1 = (right ? c + (i + 1) * w : c - i * w) + ovR
      const faceCss: Partial<CSSStyleDeclaration> = { left: `${-ovL}px`, width: `${x1 - x0}px`, height: `${H}px`, backfaceVisibility: 'hidden' }
      ;(faceCss as unknown as Record<string, string>).webkitBackfaceVisibility = 'hidden'
      const mk = (flip: boolean) => {
        const cv = box({ ...faceCss, transform: flip ? 'rotateY(180deg)' : 'none' }, 'canvas')
        cv.width = Math.max(1, Math.round((x1 - x0) * kx))
        cv.height = Math.round(H * ky)
        // The outer corners follow the rounded page. On the back face the box is mirrored.
        if (tip) Object.assign(cv.style, outer(right !== flip))
        return cv
      }
      // After the turn this strip lies mirrored about the spine, showing the next page there.
      const front: Face = { cv: mk(false), page: pages[j], x0, x1, shade: NaN }
      const rear: Face = { cv: mk(true), page: pages[j + 1], x0: 2 * c - x1, x1: 2 * c - x0, shade: NaN }
      el.append(front.cv, rear.cv)
      parent.appendChild(el)
      if (i === 0) nodes.push(el)
      parent = el
      strips.push({ el, front, rear, facing: '' })
    }
    // The first leaf to lift starts on top of the pile and lands at the bottom of the other pile.
    leaves.push({ strips, z0: 0.6 + (m - 1 - j) * 0.5, z1: 0.6 + j * 0.5 })
  }
  host.append(under, stay, liftShade, landShade)

  const fDir = right ? 'to right' : 'to left'
  const bDir = right ? 'to left' : 'to right'
  const qs = new Array<number>(m).fill(0)

  /** Paints a face: its slice of the page, then the light it stands in. Skipped while the shade barely changes. */
  function paintFace(f: Face, v: number) {
    if (Math.abs(v - f.shade) < 0.006) return
    f.shade = v
    blit(f.cv, f.page, f.x0, f.x1, W)
    if (Math.abs(v) < 0.004) return
    const ctx = f.cv.getContext('2d')!
    ctx.fillStyle = v > 0 ? `rgba(24,12,5,${v.toFixed(3)})` : `rgba(255,244,226,${(-v * 0.8).toFixed(3)})`
    ctx.fillRect(0, 0, f.cv.width, f.cv.height)
  }

  /** Draws every leaf at its own turn progress `qs[j]` (0 = lying on the page it leaves, 1 = landed). */
  function render() {
    let liftA = 0
    let liftE = 0
    let liftZ = 0
    let landA = 0
    let landE = 0
    let landZ = 0
    for (let j = 0; j < m; j++) {
      const L = leaves[j]
      const q = qs[j]
      const theta = 180 * q
      const arc = Math.sin(Math.PI * q)
      const flex = FLEX * DEG * arc // degrees the free edge trails
      const bend = flex / N
      let x = 0
      let z = 0
      for (let i = 0; i < N; i++) {
        const mid = theta - bend * (i + 0.5)
        const s = L.strips[i]
        // The hinge rises a few pixels at the top of the arc, like a sheet lifted off the gutter.
        s.el.style.transform = i === 0 ? `translateZ(${(L.z0 + (L.z1 - L.z0) * q + arc * 5).toFixed(2)}px) rotateY(${(sgn * mid).toFixed(3)}deg)` : `rotateY(${(-sgn * bend).toFixed(3)}deg)`
        x += w * Math.cos(mid / DEG)
        z += w * Math.sin(mid / DEG)
        const facing = mid < 90 ? 'front' : 'rear'
        if (facing !== s.facing) {
          s.facing = facing
          s.front.cv.style.display = facing === 'front' ? '' : 'none'
          s.rear.cv.style.display = facing === 'rear' ? '' : 'none'
        }
        paintFace(facing === 'front' ? s.front : s.rear, shadeOf(mid))
      }
      // Shadow of this leaf: it falls on the side the free edge is over, and stretches as the leaf rises.
      // The reach is taken where the raised edge appears on screen (perspective pushes it outwards).
      const zn = z / c
      const xn = (x / c) * (persp / Math.max(1, persp - z))
      const over = smooth((xn + 0.3) / 0.6)
      const a = 0.62 * Math.min(1, zn * 2.2)
      if (a * over > liftA) {
        liftA = a * over
        liftE = Math.max(0, xn)
        liftZ = zn
      }
      if (a * (1 - over) > landA) {
        landA = a * (1 - over)
        landE = Math.max(0, -xn)
        landZ = zn
      }
    }
    cast(liftShade, fDir, liftE, liftA, liftZ)
    cast(landShade, bDir, landE, landA, landZ)
  }
  const at = (T: number) => {
    const time = T * total
    for (let j = 0; j < m; j++) qs[j] = ease(clamp01((time - j * STAGGER) / TURN_SECONDS))
    render()
  }

  let dead = false
  let tween: gsap.core.Tween | null = null
  let raf = 0
  const cleanup = () => {
    if (dead) return
    dead = true
    cancelAnimationFrame(raf)
    for (const n of nodes) n.remove()
  }
  const finish = (landed: boolean) => {
    cleanup()
    o.onDone(landed)
  }
  const proxy = { T: 0, q: 0 }
  render()
  if (!o.manual) tween = gsap.to(proxy, { T: 1, duration: total, ease: 'none', onUpdate: () => at(proxy.T), onComplete: () => finish(true) })

  // Manual: the leaf chases the finger a little softly, so a jittery drag still looks like paper.
  let want = 0
  let held = !!o.manual
  const chase = () => {
    raf = 0
    if (dead || !held) return
    proxy.q += (want - proxy.q) * 0.34
    qs[0] = proxy.q
    render()
    if (Math.abs(want - proxy.q) > 0.0015) raf = requestAnimationFrame(chase)
  }

  return {
    kill() {
      tween?.kill()
      cleanup()
    },
    seek(p) {
      tween?.pause()
      held = false
      if (o.manual) {
        proxy.q = qs[0] = clamp01(p)
        render()
      } else {
        proxy.T = clamp01(p)
        at(proxy.T)
      }
    },
    drag(q) {
      if (dead || !held) return
      want = clamp01(q)
      if (!raf) raf = requestAnimationFrame(chase)
    },
    release(land) {
      if (dead || !o.manual || !held) return
      held = false
      cancelAnimationFrame(raf)
      const to = land ? 1 : 0
      const far = Math.abs(to - proxy.q)
      tween = gsap.to(proxy, {
        q: to,
        duration: 0.18 + 0.62 * far,
        ease: 'power2.out',
        onUpdate: () => {
          qs[0] = proxy.q
          render()
        },
        onComplete: () => finish(land),
      })
    },
    repaintLast(page) {
      if (dead) return
      for (const s of leaves[m - 1].strips) {
        s.rear.page = page
        s.rear.shade = NaN
      }
      blit(under, page, right ? c : 0, right ? W : c, W)
      render()
    },
  }
}
