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
  /** A page canvas was repainted in place (its picture arrived after the turn began): redraw what is cut from it. */
  refresh(): void
}

interface Face {
  cv: HTMLCanvasElement
  /** The page this face is cut from, and where (CSS pixels across the spread). */
  page: HTMLCanvasElement
  x0: number
  x1: number
  /** The shade currently painted at its spine-side and outer edges. */
  sIn: number
  sOut: number
  /** Where the spine side of the strip lies in the face canvas. */
  spineLeft: boolean
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

// Light comes from the reader's side: a face is brightest flat on the table and darkest edge-on. Each strip is
// painted with a gradient from the shade at its spine-side edge to the shade at its outer edge, so the light falls
// off continuously across the curl instead of in twelve flat steps. A narrow band of sheen runs where the paper
// rolls over (≈ 55–80°), the way a sheet catches the light at its shoulder. Angle in degrees.
const dark = (t: number) => (t <= 90 ? 0.75 * (1 - Math.cos(t / DEG)) : 0.7 * (1 + Math.cos(t / DEG)))
const glint = (t: number) => (t <= 90 ? 0.26 * Math.exp(-(((t - 66) / 11) ** 2)) + 0.08 * Math.exp(-(((t - 24) / 16) ** 2)) : 0.16 * Math.exp(-(((t - 148) / 14) ** 2)))

function cast(el: HTMLElement, dir: string, reach: number, alpha: number, height: number, core: number) {
  const layers: string[] = []
  // A soft dark core in the gutter while a leaf is in the air: the pages there are pressed into the binding.
  if (core > 0.004) layers.push(`linear-gradient(${dir}, rgba(18,9,3,${core.toFixed(3)}) 0%, rgba(18,9,3,${(core * 0.45).toFixed(3)}) 1.6%, rgba(18,9,3,0) 4%)`)
  if (alpha >= 0.004) {
    const p1 = Math.min(100, reach * 100 + 2)
    const p2 = Math.min(100, p1 + 18 + 50 * height)
    layers.push(
      `linear-gradient(${dir}, rgba(18,9,3,${(alpha * 0.8).toFixed(3)}) 0%, rgba(18,9,3,${alpha.toFixed(3)}) ${p1.toFixed(1)}%, rgba(18,9,3,${(alpha * 0.42).toFixed(3)}) ${(p1 + (p2 - p1) * 0.38).toFixed(1)}%, rgba(18,9,3,0) ${p2.toFixed(1)}%)`,
    )
  }
  el.style.background = layers.length ? layers.join(', ') : 'none'
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
  const persp = W * 2.6 // keep in step with `.bk-scene { perspective }`
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
      const front: Face = { cv: mk(false), page: pages[j], x0, x1, sIn: NaN, sOut: NaN, spineLeft: right }
      const rear: Face = { cv: mk(true), page: pages[j + 1], x0: 2 * c - x1, x1: 2 * c - x0, sIn: NaN, sOut: NaN, spineLeft: !right }
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

  /** Paints a face: its slice of the page, then the light it stands in (a gradient across the strip, edge to edge). */
  function paintFace(f: Face, tIn: number, tOut: number) {
    const dIn = dark(tIn)
    const dOut = dark(tOut)
    if (Math.abs(dIn - f.sIn) < 0.005 && Math.abs(dOut - f.sOut) < 0.005) return
    f.sIn = dIn
    f.sOut = dOut
    blit(f.cv, f.page, f.x0, f.x1, W)
    const ctx = f.cv.getContext('2d')!
    const wd = f.cv.width
    const a = f.spineLeft ? 0 : wd
    const g = ctx.createLinearGradient(a, 0, wd - a, 0)
    g.addColorStop(0, `rgba(24,12,5,${dIn.toFixed(3)})`)
    g.addColorStop(1, `rgba(24,12,5,${dOut.toFixed(3)})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, wd, f.cv.height)
    const gIn = glint(tIn)
    const gOut = glint(tOut)
    if (gIn > 0.01 || gOut > 0.01) {
      const l = ctx.createLinearGradient(a, 0, wd - a, 0)
      l.addColorStop(0, `rgba(255,244,226,${gIn.toFixed(3)})`)
      l.addColorStop(1, `rgba(255,244,226,${gOut.toFixed(3)})`)
      ctx.fillStyle = l
      ctx.fillRect(0, 0, wd, f.cv.height)
    }
  }

  /** Draws every leaf at its own turn progress `qs[j]` (0 = lying on the page it leaves, 1 = landed). */
  function render() {
    let liftA = 0
    let liftE = 0
    let liftZ = 0
    let landA = 0
    let landE = 0
    let landZ = 0
    let lifted = 0
    for (let j = 0; j < m; j++) {
      const L = leaves[j]
      const q = qs[j]
      const theta = 180 * q
      const arc = Math.sin(Math.PI * q)
      lifted = Math.max(lifted, arc)
      const flex = FLEX * DEG * arc // degrees the free edge trails
      const bend = flex / N
      let x = 0
      let z = 0
      for (let i = 0; i < N; i++) {
        const mid = theta - bend * (i + 0.5)
        const s = L.strips[i]
        // The hinge rises a few pixels at the top of the arc, like a sheet lifted off the gutter.
        s.el.style.transform = i === 0 ? `translateZ(${(L.z0 + (L.z1 - L.z0) * q + arc * 3).toFixed(2)}px) rotateY(${(sgn * mid).toFixed(3)}deg)` : `rotateY(${(-sgn * bend).toFixed(3)}deg)`
        x += w * Math.cos(mid / DEG)
        z += w * Math.sin(mid / DEG)
        const facing = mid < 90 ? 'front' : 'rear'
        if (facing !== s.facing) {
          s.facing = facing
          s.front.cv.style.display = facing === 'front' ? '' : 'none'
          s.rear.cv.style.display = facing === 'rear' ? '' : 'none'
        }
        const tIn = theta - bend * i
        const tOut = theta - bend * (i + 1)
        // A back face sees the angle from the other side of the sheet.
        if (facing === 'front') paintFace(s.front, Math.min(90, tIn), Math.min(90, tOut))
        else paintFace(s.rear, Math.max(90, tIn), Math.max(90, tOut))
      }
      // Shadow of this leaf: it falls on the side the free edge is over, and stretches as the leaf rises.
      // The reach is taken where the raised edge appears on screen (perspective pushes it outwards).
      const zn = z / c
      const xn = (x / c) * (persp / Math.max(1, persp - z))
      const over = smooth((xn + 0.3) / 0.6)
      const a = 0.85 * Math.min(1, zn * 2.2)
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
    cast(liftShade, fDir, liftE, liftA, liftZ, 0.22 * lifted)
    cast(landShade, bDir, landE, landA, landZ, 0.35 * lifted)
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
    refresh() {
      if (dead) return
      for (const L of leaves)
        for (const s of L.strips) {
          s.front.sIn = s.rear.sIn = NaN
        }
      blit(under, pages[m], right ? c : 0, right ? W : c, W)
      render()
    },
  }
}
