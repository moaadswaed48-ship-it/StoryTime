import gsap from 'gsap'
import { blit } from './paint'

/**
 * The page turn: a real two-sided leaf hinged on the centre spine.
 *
 * Each leaf is a chain of narrow strips (nested 3D transforms). The free edge leads and the spine side trails, so the
 * sheet bends like paper instead of swinging like a board. The front faces carry the outgoing page, the back faces
 * the incoming one, and every face gets its own moving shade and sheen from its angle to the light. The leaf also
 * drops a shadow on the page it leaves and on the page it lands on.
 *
 * Jumps of several scenes riffle up to three leaves.
 */
const N = 6 // strips per leaf
const LAG = 0.26 // how far the spine side trails the free edge (share of the turn)
const STAGGER = 0.12 // seconds between the leaves of a riffle
export const TURN_SECONDS = 0.96
export const turnSeconds = (leaves: number) => TURN_SECONDS + Math.max(0, leaves - 1) * STAGGER

const RAD = Math.PI / 180
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
  onDone: () => void
}
export interface TurnHandle {
  kill(): void
  /** Freeze the turn at a fraction of its length (screenshots and tests). */
  seek(p: number): void
  /** Repaint the incoming page (its picture arrived after the turn began). */
  repaintLast(page: HTMLCanvasElement): void
}

interface Face {
  cv: HTMLCanvasElement
  x0: number
  x1: number
}
interface Strip {
  el: HTMLDivElement
  fShade: HTMLDivElement
  bShade: HTMLDivElement
  back: Face
}
interface Leaf {
  strips: Strip[]
  z0: number
  z1: number
}

function box(css: Partial<CSSStyleDeclaration>, tag: 'div' | 'canvas' = 'div') {
  const e = document.createElement(tag)
  Object.assign(e.style, { position: 'absolute', top: '0', pointerEvents: 'none' } satisfies Partial<CSSStyleDeclaration>, css)
  return e
}

// Light comes from the reader's side: a face is brightest flat on the table and darkest edge-on.
const dark = (t: number) => (t <= 90 ? 0.6 * (1 - Math.cos(t * RAD)) : 0.64 * (1 + Math.cos(t * RAD)))
const glint = (t: number) => (t <= 90 ? 0.2 * Math.exp(-(((t - 24) / 13) ** 2)) : 0.15 * Math.exp(-(((t - 152) / 14) ** 2)))
const shade = (dir: string, t0: number, t1: number) =>
  `linear-gradient(${dir}, rgba(255,244,226,${glint(t0).toFixed(3)}), rgba(255,244,226,${glint(t1).toFixed(3)})), linear-gradient(${dir}, rgba(24,12,5,${dark(t0).toFixed(3)}), rgba(24,12,5,${dark(t1).toFixed(3)}))`

function cast(el: HTMLElement, dir: string, reach: number, alpha: number, height: number) {
  if (alpha < 0.004) {
    el.style.background = 'none'
    return
  }
  const p1 = Math.min(100, reach * 100)
  const p2 = Math.min(100, (reach + 0.1 + 0.42 * height) * 100)
  el.style.background = `linear-gradient(${dir}, rgba(18,9,3,${(alpha * 0.82).toFixed(3)}) 0%, rgba(18,9,3,${alpha.toFixed(3)}) ${p1.toFixed(1)}%, rgba(18,9,3,0) ${p2.toFixed(1)}%)`
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
  const ease = gsap.parseEase('power2.inOut')
  const total = turnSeconds(m)
  const nodes: HTMLElement[] = []
  const r = `${radius}px`
  const OV = 0.5 // faces overlap by half a pixel so no seam shows between strips

  // The half that stays put keeps showing the page we are leaving until the leaf lands on it.
  const stay = box({ left: right ? '0' : `${c}px`, width: `${c}px`, height: `${H}px`, transform: 'translateZ(0.2px)' }, 'canvas') as HTMLCanvasElement
  stay.width = Math.round(c * kx)
  stay.height = Math.round(H * ky)
  Object.assign(stay.style, right ? { borderTopLeftRadius: r, borderBottomLeftRadius: r } : { borderTopRightRadius: r, borderBottomRightRadius: r })
  blit(stay, pages[0], right ? 0 : c, right ? c : W, W)
  const liftShade = box({ left: right ? `${c}px` : '0', width: `${c}px`, height: `${H}px`, transform: 'translateZ(0.3px)' })
  const landShade = box({ left: right ? '0' : `${c}px`, width: `${c}px`, height: `${H}px`, transform: 'translateZ(0.3px)' })
  Object.assign(liftShade.style, right ? { borderTopRightRadius: r, borderBottomRightRadius: r } : { borderTopLeftRadius: r, borderBottomLeftRadius: r })
  Object.assign(landShade.style, right ? { borderTopLeftRadius: r, borderBottomLeftRadius: r } : { borderTopRightRadius: r, borderBottomRightRadius: r })
  nodes.push(stay, liftShade, landShade)

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
        const cv = box({ ...faceCss, transform: flip ? 'rotateY(180deg)' : 'none' }, 'canvas') as HTMLCanvasElement
        cv.width = Math.max(1, Math.round((x1 - x0) * kx))
        cv.height = Math.round(H * ky)
        const sh = box({ ...faceCss, transform: flip ? 'rotateY(180deg) translateZ(0.05px)' : 'translateZ(0.05px)' }) as HTMLDivElement
        if (tip) {
          // The outer corners follow the rounded page. On the back face the box is mirrored.
          const outerRight = right !== flip
          const css = outerRight ? { borderTopRightRadius: r, borderBottomRightRadius: r } : { borderTopLeftRadius: r, borderBottomLeftRadius: r }
          Object.assign(cv.style, css)
          Object.assign(sh.style, css)
        }
        return { cv, sh }
      }
      const front = mk(false)
      const back = mk(true)
      blit(front.cv, pages[j], x0, x1, W)
      // After the turn this strip lies mirrored about the spine, showing the next page there.
      const bx0 = 2 * c - x1
      const bx1 = 2 * c - x0
      blit(back.cv, pages[j + 1], bx0, bx1, W)
      el.append(front.cv, front.sh, back.cv, back.sh)
      parent.appendChild(el)
      if (i === 0) nodes.push(el)
      parent = el
      strips.push({ el, fShade: front.sh, bShade: back.sh, back: { cv: back.cv, x0: bx0, x1: bx1 } })
    }
    // The first leaf to lift starts on top of the pile and lands at the bottom of the other pile.
    leaves.push({ strips, z0: 0.6 + (m - 1 - j) * 0.5, z1: 0.6 + j * 0.5 })
  }
  host.append(stay, liftShade, landShade)

  const fDir = right ? 'to right' : 'to left'
  const bDir = right ? 'to left' : 'to right'
  const th = new Array<number>(N + 1)

  function apply(T: number) {
    const time = T * total
    let liftA = 0
    let liftE = 0
    let liftZ = 0
    let landA = 0
    let landE = 0
    let landZ = 0
    for (let j = 0; j < m; j++) {
      const L = leaves[j]
      const tj = clamp01((time - j * STAGGER) / TURN_SECONDS)
      for (let e = 0; e <= N; e++) th[e] = 180 * ease(clamp01(tj * (1 + LAG) - LAG * (1 - e / N)))
      let prev = 0
      let x = 0
      let z = 0
      for (let i = 0; i < N; i++) {
        const mid = (th[i] + th[i + 1]) / 2
        const s = L.strips[i]
        s.el.style.transform = i === 0 ? `translateZ(${(L.z0 + (L.z1 - L.z0) * tj).toFixed(2)}px) rotateY(${(sgn * mid).toFixed(3)}deg)` : `rotateY(${(sgn * (mid - prev)).toFixed(3)}deg)`
        prev = mid
        x += w * Math.cos(mid * RAD)
        z += w * Math.sin(mid * RAD)
        if (mid < 90) s.fShade.style.background = shade(fDir, th[i], th[i + 1])
        else s.bShade.style.background = shade(bDir, th[i], th[i + 1])
      }
      // Shadow of this leaf: it falls on the side the free edge is over, and stretches as the leaf rises.
      const zn = z / c
      const xn = x / c
      const over = smooth((xn + 0.3) / 0.6)
      const a = 0.52 * Math.min(1, zn * 2.2)
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

  let dead = false
  const cleanup = () => {
    if (dead) return
    dead = true
    for (const n of nodes) n.remove()
  }
  const proxy = { T: 0 }
  apply(0)
  const tween = gsap.to(proxy, {
    T: 1,
    duration: total,
    ease: 'none',
    onUpdate: () => apply(proxy.T),
    onComplete: () => {
      cleanup()
      o.onDone()
    },
  })

  return {
    kill() {
      tween.kill()
      cleanup()
    },
    seek(p) {
      tween.pause()
      proxy.T = clamp01(p)
      apply(proxy.T)
    },
    repaintLast(page) {
      if (dead) return
      for (const s of leaves[m - 1].strips) blit(s.back.cv, page, s.back.x0, s.back.x1, W)
    },
  }
}
