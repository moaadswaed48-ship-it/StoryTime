/**
 * The curl engine: a book of pages on one WebGL canvas, whose pages turn by curling.
 *
 * It knows nothing about React, the story or the DOM around it. The host gives it
 *   - a layout (where the page or the two-page spread sits on the canvas, and the reading direction),
 *   - a book (how many pages, and a function that paints page i onto a canvas),
 * tells it where the finger is (`press` / `move` / `release`) or asks for a turn (`turn`, `jump`),
 * and hears back when a leaf lifts, when the position changes and when the paper is at rest again.
 * Nothing is drawn while nothing moves.
 */
import { FLAT, baseRadius, constrain, follow, gripY, progressOf, solve, type Cylinder, type Vec } from './geometry'
import { FRAG, VERT } from './shader'

export interface CurlLayout {
  /** Canvas size in CSS px, and device px per CSS px. */
  width: number
  height: number
  scale: number
  /** Two pages side by side (an open book) or one page. */
  spread: boolean
  /** Right-to-left book: bound on the right, pages turn the other way. */
  rtl: boolean
  /** One page, CSS px. */
  pageW: number
  pageH: number
  /** The top end of the spine, CSS px from the canvas's top-left corner. */
  spineX: number
  top: number
}

export interface CurlBook {
  /** Number of pages. Two-page books show pages (0,1), (2,3)… */
  count: number
  /** Paints page `index` at exactly `engine.pagePixels()` and returns it. Called ahead of time, never during a turn if it can be helped. */
  paint(index: number): TexImageSource | null
}

export interface CurlEvents {
  /** A leaf is about to leave the page (drag, arrow or jump). */
  onLift?(): void
  /** The reader is now at another position. */
  onChange?(position: number): void
  /** The paper is flat again, after a turn or after falling back. */
  onRest?(position: number): void
  /** A turn was asked for where the book ends or is locked. */
  onBlocked?(dir: 1 | -1): void
}

export interface CurlStats {
  frames: number
  /** Average and worst JS time spent per drawn frame, ms. */
  cpuAvg: number
  cpuMax: number
  /** Average and worst time between drawn frames while moving, ms. */
  gapAvg: number
  gapMax: number
}

interface Turn {
  lo: number
  hi: number
  /** Which point of the free edge is being carried (y, leaf px). */
  ay: number
  p: Vec
  mode: 'drag' | 'auto' | 'held'
  /** A leaf that cannot leave (end of the book, or locked): it lifts a little and falls back. */
  resist: boolean
  // drag
  off: Vec
  // auto
  from: Vec
  vel: Vec
  to: Vec
  t: number
  dur: number
  arc: number
  toHi: boolean
}

interface Tex {
  tex: WebGLTexture
  dirty: boolean
}

const TAP_SLOP = 9
const CATCH_UP = 0.065 // seconds: how fast the page comes to a finger that landed away from its edge
const FLICK = 320 // px/s of finger speed that decides a release on its own

export class CurlEngine {
  private gl: WebGLRenderingContext | WebGL2RenderingContext
  private gl2: boolean
  private prog!: WebGLProgram
  private uni: Record<string, WebGLUniformLocation | null> = {}
  private blank!: WebGLTexture
  private texs = new Map<number, Tex>()
  private layout: CurlLayout | null = null
  private book: CurlBook = { count: 0, paint: () => null }
  private pos = 0
  private limit = Infinity
  private turnState: Turn | null = null
  private raf = 0
  private last = 0
  private needsDraw = false
  private lost = false
  private dead = false
  private warmTimer = 0
  private paper: [number, number, number] = [0.965, 0.94, 0.89]
  // pointer
  private down: { x: number; y: number; t: number; moved: boolean } | null = null
  private finger: Vec = { x: 0, y: 0 }
  private trail: { t: number; x: number; px: number; py: number }[] = []
  // film windows
  private live = new Map<number, { box: [number, number, number, number]; mix: number; target: number }>()
  // stats
  private st = { frames: 0, cpu: 0, cpuMax: 0, gap: 0, gapMax: 0, gaps: 0 }
  private chained = false

  constructor(
    private canvas: HTMLCanvasElement,
    private events: CurlEvents = {},
  ) {
    const opts: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }
    const gl2 = canvas.getContext('webgl2', opts) as WebGL2RenderingContext | null
    const gl = gl2 ?? (canvas.getContext('webgl', opts) as WebGLRenderingContext | null)
    if (!gl) throw new Error('WebGL is not available')
    this.gl = gl
    this.gl2 = !!gl2
    this.init()
    canvas.addEventListener('webglcontextlost', this.onLost)
    canvas.addEventListener('webglcontextrestored', this.onRestored)
  }

  /* ── Set-up ─────────────────────────────────────────────────────────────── */

  private init() {
    const gl = this.gl
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('curl shader: ' + gl.getShaderInfoLog(s))
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.bindAttribLocation(prog, 0, 'aPos')
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('curl program: ' + gl.getProgramInfoLog(prog))
    this.prog = prog
    gl.useProgram(prog)
    for (const name of ['uRes', 'uPage', 'uSpine', 'uFlip', 'uSpread', 'uOn', 'uCyl', 'uN', 'uFront', 'uBack', 'uUnder', 'uFar', 'uHas', 'uGhost', 'uPaper', 'uHoleNear', 'uHoleFar', 'uHoleMix'])
      this.uni[name] = gl.getUniformLocation(prog, name)
    gl.uniform1i(this.uni.uFront, 0)
    gl.uniform1i(this.uni.uBack, 1)
    gl.uniform1i(this.uni.uUnder, 2)
    gl.uniform1i(this.uni.uFar, 3)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    gl.clearColor(0, 0, 0, 0)
    this.blank = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.blank)
    const [r, g, b] = this.paper
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([r * 255, g * 255, b * 255, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  private onLost = (e: Event) => {
    e.preventDefault()
    this.lost = true
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }
  private onRestored = () => {
    this.lost = false
    this.texs.clear()
    this.init()
    this.warm()
    this.draw()
  }

  /** Paper colour (0–1 rgb) used for the back of a single page and for pages that are not painted yet. */
  setPaper(rgb: [number, number, number]) {
    this.paper = rgb
  }

  setLayout(layout: CurlLayout) {
    const prev = this.layout
    this.layout = layout
    const w = Math.round(layout.width * layout.scale)
    const h = Math.round(layout.height * layout.scale)
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    if (!prev || prev.pageW !== layout.pageW || prev.pageH !== layout.pageH || prev.scale !== layout.scale || prev.spread !== layout.spread) this.dropAll()
    this.settleNow()
    this.requestDraw()
  }

  /** Size, in device px, that `book.paint` must return. */
  pagePixels(): { w: number; h: number } {
    const l = this.layout
    return l ? { w: Math.round(l.pageW * l.scale), h: Math.round(l.pageH * l.scale) } : { w: 0, h: 0 }
  }

  setBook(book: CurlBook, position = this.pos) {
    this.book = book
    this.dropAll()
    this.settleNow()
    this.pos = Math.min(this.positions() - 1, Math.max(0, position))
    this.warm()
    this.requestDraw()
  }

  /** Last position the reader may turn to (pages after it are locked). */
  setLimit(position: number) {
    this.limit = position
  }

  /** Page `index` (or every page) has changed and must be painted again. */
  invalidate(index?: number) {
    if (index === undefined) for (const t of this.texs.values()) t.dirty = true
    else {
      const t = this.texs.get(index)
      if (t) t.dirty = true
    }
    this.warm()
    this.requestDraw()
  }

  /** Replaces a rectangle of a page that is already on the GPU (x, y in page px), e.g. with the film's current frame. */
  patch(index: number, source: TexImageSource, x: number, y: number) {
    const t = this.texs.get(index)
    if (!t || this.lost) return
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, t.tex)
    try {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, source)
    } catch {
      /* a frame that cannot be read (cross-origin, not decoded yet): keep the still */
    }
    this.requestDraw()
  }

  /**
   * Opens (or closes, with `null`) a window in page `index` through which whatever lies under the canvas shows:
   * the host plays the film there. `box` is in page fractions (x0, y0, x1, y1). The window cross-fades.
   */
  setLive(index: number, box: [number, number, number, number] | null, instant = false) {
    const cur = this.live.get(index)
    if (!box) {
      if (!cur) return
      if (instant) this.live.delete(index)
      else cur.target = 0
    } else if (cur) {
      cur.box = box
      cur.target = 1
      if (instant) cur.mix = 1
    } else this.live.set(index, { box, mix: instant ? 1 : 0, target: 1 })
    this.requestDraw()
  }

  /* ── Where things are ───────────────────────────────────────────────────── */

  positions() {
    const l = this.layout
    return Math.max(1, l?.spread ? Math.ceil(this.book.count / 2) : this.book.count)
  }
  position() {
    return this.pos
  }
  /** Pages showing at a position: one, or the pair of a spread in reading order. */
  pagesAt(position = this.pos): number[] {
    if (!this.layout?.spread) return [position]
    return [position * 2, position * 2 + 1].filter((i) => i < this.book.count)
  }
  turning() {
    return !!this.turnState
  }
  /** 0…1 while a leaf is in the air (0 = lying on the earlier position). */
  progress() {
    const t = this.turnState
    return t && this.layout ? progressOf(t.p, this.px(this.layout.pageW)) : 0
  }

  private px(v: number) {
    return v * (this.layout?.scale ?? 1)
  }
  /** Canvas CSS px → the leaf's frame (device px, spine at x = 0, free edge at +x). */
  private toLeaf(x: number, y: number): Vec {
    const l = this.layout!
    return { x: (x - l.spineX) * (l.rtl ? -1 : 1) * l.scale, y: (y - l.top) * l.scale }
  }
  // Which page plays which part in a turn between two positions (lo < hi).
  private front(lo: number) {
    return this.layout?.spread ? lo * 2 + 1 : lo
  }
  private back(hi: number) {
    return this.layout?.spread ? hi * 2 : -1
  }
  private under(hi: number) {
    return this.layout?.spread ? hi * 2 + 1 : hi
  }
  private far(lo: number) {
    return this.layout?.spread ? lo * 2 : -1
  }

  /* ── Pages on the GPU ───────────────────────────────────────────────────── */

  private dropAll() {
    for (const t of this.texs.values()) this.gl.deleteTexture(t.tex)
    this.texs.clear()
  }

  /** Makes sure page `index` is painted and uploaded. Returns its texture, or null when there is no such page. */
  private ensure(index: number): WebGLTexture | null {
    if (index < 0 || index >= this.book.count || this.lost) return null
    const have = this.texs.get(index)
    if (have && !have.dirty) return have.tex
    const src = this.book.paint(index)
    if (!src) return have?.tex ?? null
    const gl = this.gl
    const tex = have?.tex ?? gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    if (this.gl2) {
      // Mip-maps keep the print calm where the paper turns edge-on at the roll.
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    this.texs.set(index, { tex, dirty: false })
    return tex
  }

  /** Pages that a turn from `position`, either way, would show. */
  private around(position: number, reach: number): number[] {
    const out: number[] = []
    const per = this.layout?.spread ? 2 : 1
    for (let d = 0; d <= reach; d++)
      for (const p of d ? [position + d, position - d] : [position])
        for (let k = 0; k < per; k++) {
          const i = p * per + k
          if (i >= 0 && i < this.book.count) out.push(i)
        }
    return out
  }

  /** Paints the pages around the reader one at a time, between frames, so a turn never waits for paper. */
  private warm() {
    if (this.warmTimer || this.dead) return
    const step = () => {
      this.warmTimer = 0
      if (this.dead || !this.layout || this.lost) return
      if (this.turnState) {
        // Never upload in the middle of a turn; come back when the paper is down.
        this.warmTimer = window.setTimeout(step, 140)
        return
      }
      const want = this.around(this.pos, 2)
      const next = want.find((i) => !this.texs.get(i) || this.texs.get(i)!.dirty)
      if (next === undefined) {
        // Keep the neighbourhood, let go of pages far behind.
        if (this.texs.size > 16) {
          const keep = new Set(this.around(this.pos, 3))
          for (const [i, t] of this.texs)
            if (!keep.has(i)) {
              this.gl.deleteTexture(t.tex)
              this.texs.delete(i)
            }
        }
        return
      }
      const shown = this.pagesAt().includes(next)
      this.ensure(next)
      if (shown) this.requestDraw()
      this.warmTimer = window.setTimeout(step, 24)
    }
    this.warmTimer = window.setTimeout(step, 0)
  }

  /** True when every page a single turn (either way) needs is already on the GPU. */
  ready(): boolean {
    return this.around(this.pos, 1).every((i) => this.texs.has(i) && !this.texs.get(i)!.dirty)
  }

  /* ── The finger ─────────────────────────────────────────────────────────── */

  /** Finger (or mouse) down at canvas CSS px. */
  press(x: number, y: number, time = performance.now()) {
    if (!this.layout) return
    if (this.turnState?.mode === 'auto') this.finish()
    if (this.turnState) return
    this.down = { x, y, t: time, moved: false }
    this.finger = this.toLeaf(x, y)
    this.trail = []
  }

  /** Finger moved. Returns true once this has become a page drag (as opposed to a tap). */
  move(x: number, y: number, time = performance.now()): boolean {
    const d = this.down
    const l = this.layout
    if (!d || !l) return false
    const f = this.toLeaf(x, y)
    this.finger = f
    if (!d.moved) {
      const dx = x - d.x
      const dy = y - d.y
      if (Math.hypot(dx, dy) < TAP_SLOP) return false
      if (Math.abs(dx) < Math.abs(dy) * 0.7) {
        // A vertical stroke is not a page turn.
        this.down = null
        return false
      }
      d.moved = true
      const forward = dx * (l.rtl ? -1 : 1) < 0
      if (!this.begin(forward ? 1 : -1, this.toLeaf(d.x, d.y), 'drag')) {
        this.down = null
        return false
      }
    }
    const t = this.turnState
    if (t?.mode === 'drag') {
      this.trail.push({ t: time, x: f.x, px: t.p.x, py: t.p.y })
      if (this.trail.length > 12) this.trail.shift()
      this.run()
    }
    return true
  }

  /** Finger up. Returns 'tap' when it never became a drag. */
  release(time = performance.now()): 'tap' | 'drag' | 'none' {
    const d = this.down
    this.down = null
    if (!d) return 'none'
    const t = this.turnState
    if (!d.moved || !t || t.mode !== 'drag') return d.moved ? 'none' : 'tap'
    const w = this.px(this.layout!.pageW)
    // Finger speed over the last moments decides a flick; otherwise the middle of the turn does.
    const recent = this.trail.filter((s) => time - s.t < 110)
    let vx = 0
    let pv: Vec = { x: 0, y: 0 }
    if (recent.length >= 2) {
      const a = recent[0]
      const b = recent[recent.length - 1]
      const dt = Math.max(0.016, (b.t - a.t) / 1000)
      vx = (b.x - a.x) / dt / this.layout!.scale
      pv = { x: (b.px - a.px) / dt, y: (b.py - a.py) / dt }
    }
    // "Past the middle" is where the reader sees the page: on one page the roll under the finger has crossed
    // the middle of the page; on a spread the leaf's edge has crossed the spine.
    const half = this.layout!.spread ? 0.5 : 0.5 - (Math.PI * baseRadius(this.layout!.pageW)) / (2 * this.layout!.pageW)
    const toHi = t.resist ? false : vx < -FLICK ? true : vx > FLICK ? false : progressOf(t.p, w) > half
    this.settle(toHi, pv)
    return 'drag'
  }

  /** The gesture was taken away (e.g. by the browser): let the page fall back where it came from. */
  cancel() {
    const t = this.turnState
    this.down = null
    if (t?.mode === 'drag') this.settle(t.from.x < 0, { x: 0, y: 0 })
  }

  /* ── Turns ──────────────────────────────────────────────────────────────── */

  private canGo(dir: 1 | -1) {
    const to = this.pos + dir
    return to >= 0 && to < this.positions() && to <= this.limit
  }

  /** Lifts the leaf for a turn in `dir`. `grip` is where the hand took the page (leaf px). */
  private begin(dir: 1 | -1, grip: Vec, mode: Turn['mode'], target = this.pos + dir): boolean {
    const l = this.layout!
    const w = this.px(l.pageW)
    const h = this.px(l.pageH)
    let resist = false
    if (target === this.pos + dir && !this.canGo(dir)) {
      this.events.onBlocked?.(dir)
      // At the end of the book (or at a locked page) the leaf still answers the hand, then falls back.
      if (dir < 0 || mode !== 'drag') return false
      resist = true
    }
    const lo = dir > 0 ? this.pos : target
    const hi = dir > 0 ? (resist ? this.pos + 1 : target) : this.pos
    const ay = gripY(grip.y, h)
    const start: Vec = dir > 0 ? { x: w, y: ay } : { x: -w, y: ay }
    this.events.onLift?.()
    // The pages this turn shows are normally waiting already; if not, paint them now rather than show a blank.
    for (const i of [this.front(lo), this.back(hi), this.under(hi), this.far(lo)]) if (!resist || i === this.front(lo) || i === this.far(lo)) this.ensure(i)
    this.turnState = {
      lo,
      hi,
      ay,
      p: start,
      mode,
      resist,
      off: { x: 0, y: 0 },
      from: start,
      vel: { x: 0, y: 0 },
      to: start,
      t: 0,
      dur: 0,
      arc: 0,
      toHi: dir > 0,
    }
    if (mode === 'drag') {
      const goal = this.goal(this.turnState)
      this.turnState.off = { x: start.x - goal.x, y: start.y - goal.y }
    }
    this.last = 0
    return true
  }

  /** Where the carried edge point should be for the finger's current place. */
  private goal(t: Turn): Vec {
    const l = this.layout!
    const w = this.px(l.pageW)
    const h = this.px(l.pageH)
    const radius = this.px(baseRadius(l.pageW))
    if (t.resist) {
      // A page that cannot leave only gives a little.
      const dx = Math.min(0, this.finger.x - w)
      const give = -w * 0.16 * (1 - Math.exp(dx / (w * 0.5)))
      return constrain({ x: w + give, y: t.ay + (this.finger.y - t.ay) * 0.12 }, t.ay, w, h, radius)
    }
    return follow(this.finger, t.ay, w, h, !l.spread, radius)
  }

  /** Lets go of the leaf: it carries on with the hand's speed and lands turned (`toHi`) or back where it was. */
  private settle(toHi: boolean, vel: Vec, arc = 0, dur?: number) {
    const t = this.turnState
    const l = this.layout
    if (!t || !l) return
    const w = this.px(l.pageW)
    t.mode = 'auto'
    t.toHi = toHi
    t.from = { ...t.p }
    t.to = { x: toHi ? -w : w, y: t.ay }
    const dist = Math.hypot(t.to.x - t.from.x, t.to.y - t.from.y)
    const speed = Math.hypot(vel.x, vel.y)
    // Longer journeys take longer; a thrown page arrives sooner, and never overshoots.
    let d = dur ?? 0.2 + 0.36 * Math.min(1, dist / (2 * w))
    if (speed > 1) d = Math.min(d, (2.6 * dist) / speed)
    t.dur = Math.max(0.09, d)
    t.vel = vel
    t.t = 0
    t.arc = arc
    this.last = 0
    this.run()
  }

  /** Turns one position forward (1) or back (−1) with the same curl a finger makes. */
  turn(dir: 1 | -1): boolean {
    const l = this.layout
    if (!l) return false
    if (this.turnState?.mode === 'auto') this.finish()
    if (this.turnState) return false
    return this.fly(dir, this.pos + dir)
  }

  /** Goes to any position: one leaf turns and the destination is underneath it. `animate: false` simply shows it. */
  jump(position: number, animate = true): boolean {
    const l = this.layout
    if (!l) return false
    const to = Math.min(this.positions() - 1, Math.max(0, Math.min(position, this.limit)))
    if (this.turnState?.mode === 'auto') this.finish()
    if (this.turnState) return false
    if (to === this.pos) return false
    if (!animate) {
      this.pos = to
      this.events.onChange?.(to)
      this.draw()
      this.events.onRest?.(to)
      this.warm()
      return true
    }
    return this.fly(to > this.pos ? 1 : -1, to)
  }

  private fly(dir: 1 | -1, target: number): boolean {
    const l = this.layout!
    const h = this.px(l.pageH)
    const w = this.px(l.pageW)
    // An unseen hand takes the page low on its edge, so the corner leads and the curl straightens as it lands.
    if (!this.begin(dir, { x: w, y: h * 0.7 }, 'auto', target)) return false
    const t = this.turnState!
    t.p = dir > 0 ? { x: w, y: t.ay } : { x: -w, y: t.ay }
    this.settle(dir > 0, { x: 0, y: 0 }, -0.2 * h, l.spread ? 0.82 : 0.66)
    return true
  }

  /** Ends the turn in the air at once, where it was heading. */
  finish() {
    const t = this.turnState
    if (!t) return
    this.land(t.mode === 'auto' ? t.toHi : t.from.x < 0)
  }

  private settleNow() {
    if (this.turnState) this.finish()
    this.down = null
  }

  private land(toHi: boolean) {
    const t = this.turnState
    if (!t) return
    this.turnState = null
    const next = t.resist ? this.pos : toHi ? t.hi : t.lo
    const changed = next !== this.pos
    this.pos = next
    this.draw()
    if (changed) this.events.onChange?.(next)
    this.events.onRest?.(next)
    this.warm()
  }

  /**
   * For checks and screenshots: holds the leaf of a forward turn at `progress` (0…1), taken at height
   * `grip` (0 top … 1 bottom) and pulled `rise` page-heights up or down on the way. `null` lets it fall back.
   */
  hold(progress: number | null, grip = 0.5, rise = 0): boolean {
    const l = this.layout
    if (!l) return false
    if (progress === null) {
      if (this.turnState?.mode === 'held') this.settle(false, { x: 0, y: 0 })
      return true
    }
    if (this.turnState && this.turnState.mode !== 'held') this.finish()
    const w = this.px(l.pageW)
    const h = this.px(l.pageH)
    if (!this.turnState && !this.begin(1, { x: w, y: grip * h }, 'held')) return false
    const t = this.turnState!
    t.p = constrain({ x: w - progress * 2 * w, y: t.ay + rise * h * Math.sin(Math.PI * Math.min(1, progress)) }, t.ay, w, h, this.px(baseRadius(l.pageW)))
    this.draw()
    return true
  }

  /* ── The frame ──────────────────────────────────────────────────────────── */

  private requestDraw() {
    this.needsDraw = true
    this.run()
  }

  private run() {
    if (this.raf || this.dead || this.lost) return
    this.raf = requestAnimationFrame(this.frame)
  }

  private frame = (now: number) => {
    this.raf = 0
    if (this.dead || !this.layout) return
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60
    // Only frames that follow one another count towards the smoothness figures.
    if (this.chained && this.last) {
      const gap = now - this.last
      this.st.gap += gap
      this.st.gaps++
      this.st.gapMax = Math.max(this.st.gapMax, gap)
    }
    this.last = now
    const t0 = performance.now()
    let again = false
    let changed = this.needsDraw
    this.needsDraw = false

    const t = this.turnState
    if (t?.mode === 'drag') {
      // The page comes to the finger quickly, then stays with it exactly.
      const k = Math.exp(-dt / CATCH_UP)
      t.off.x *= k
      t.off.y *= k
      const g = this.goal(t)
      const far = Math.abs(t.off.x) + Math.abs(t.off.y) > 0.3
      if (!far) t.off.x = t.off.y = 0
      const l = this.layout
      const p = constrain({ x: g.x + t.off.x, y: g.y + t.off.y }, t.ay, this.px(l.pageW), this.px(l.pageH), this.px(baseRadius(l.pageW)))
      if (Math.abs(p.x - t.p.x) + Math.abs(p.y - t.p.y) > 0.01) {
        t.p = p
        changed = true
      }
      again = far
    } else if (t?.mode === 'auto') {
      t.t += dt
      const s = Math.min(1, t.t / t.dur)
      // Cubic Hermite: leaves with the hand's velocity, arrives at rest.
      const s2 = s * s
      const s3 = s2 * s
      const h00 = 2 * s3 - 3 * s2 + 1
      const h10 = s3 - 2 * s2 + s
      const h01 = -2 * s3 + 3 * s2
      const l = this.layout
      const lift = t.arc * Math.sin(Math.PI * s)
      t.p = constrain(
        { x: h00 * t.from.x + h10 * t.dur * t.vel.x + h01 * t.to.x, y: h00 * t.from.y + h10 * t.dur * t.vel.y + h01 * t.to.y + lift },
        t.ay,
        this.px(l.pageW),
        this.px(l.pageH),
        this.px(baseRadius(l.pageW)),
      )
      changed = true
      if (s >= 1) {
        this.land(t.toHi)
        this.last = 0
        this.chained = false
        this.count(t0)
        return
      }
      again = true
    }

    // Film windows fade open and shut.
    for (const [i, w] of this.live) {
      if (w.mix !== w.target) {
        const step = dt / 0.45
        w.mix = w.target > w.mix ? Math.min(w.target, w.mix + step) : Math.max(w.target, w.mix - step * 3)
        changed = true
        again = true
      }
      if (w.target === 0 && w.mix === 0) this.live.delete(i)
    }

    if (changed) {
      this.draw()
      this.count(t0)
    }
    this.chained = again
    if (again) this.run()
    else if (!this.turnState || this.turnState.mode !== 'drag') this.last = 0
  }

  private count(t0: number) {
    const cpu = performance.now() - t0
    this.st.frames++
    this.st.cpu += cpu
    this.st.cpuMax = Math.max(this.st.cpuMax, cpu)
  }

  stats(reset = false): CurlStats {
    const s = this.st
    const out = { frames: s.frames, cpuAvg: s.frames ? s.cpu / s.frames : 0, cpuMax: s.cpuMax, gapAvg: s.gaps ? s.gap / s.gaps : 0, gapMax: s.gapMax }
    if (reset) this.st = { frames: 0, cpu: 0, cpuMax: 0, gap: 0, gapMax: 0, gaps: 0 }
    return out
  }

  private bind(unit: number, index: number): number {
    const gl = this.gl
    const tex = index >= 0 ? (this.texs.get(index)?.tex ?? this.ensure(index)) : null
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex ?? this.blank)
    return tex ? 1 : 0
  }

  /** Draws the book as it is right now. */
  draw() {
    const l = this.layout
    if (!l || this.lost || this.dead) return
    const gl = this.gl
    const u = this.uni
    const t = this.turnState
    const w = this.px(l.pageW)
    const h = this.px(l.pageH)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.prog)

    const lo = t ? t.lo : this.pos
    const hi = t ? t.hi : this.pos
    const frontI = this.front(lo)
    const farI = this.far(lo)
    const hasFront = this.bind(0, frontI)
    const hasBack = t && !t.resist ? this.bind(1, l.spread ? this.back(hi) : frontI) : this.bind(1, l.spread ? -1 : frontI)
    const hasUnder = t && !t.resist ? this.bind(2, this.under(hi)) : this.bind(2, -1)
    const hasFar = this.bind(3, farI)

    let cyl: Cylinder = FLAT
    if (t) cyl = solve(t.p, t.ay, w, h, this.px(baseRadius(l.pageW)))
    const on = t && cyl !== FLAT ? 1 : 0

    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height)
    gl.uniform2f(u.uPage, Math.round(w), Math.round(h))
    gl.uniform2f(u.uSpine, Math.round(l.spineX * l.scale), Math.round(l.top * l.scale))
    gl.uniform1f(u.uFlip, l.rtl ? -1 : 1)
    gl.uniform1f(u.uSpread, l.spread ? 1 : 0)
    gl.uniform1f(u.uOn, on)
    gl.uniform3f(u.uCyl, cyl.ox, cyl.oy, cyl.r)
    gl.uniform2f(u.uN, cyl.nx, cyl.ny)
    gl.uniform4f(u.uHas, hasFront, hasBack, hasUnder, hasFar)
    gl.uniform1f(u.uGhost, l.spread ? 0 : 1)
    gl.uniform3f(u.uPaper, this.paper[0], this.paper[1], this.paper[2])
    const near = on ? undefined : this.live.get(frontI)
    const farW = on ? undefined : this.live.get(farI)
    gl.uniform4f(u.uHoleNear, ...(near?.box ?? [2, 2, 2, 2]))
    gl.uniform4f(u.uHoleFar, ...(farW?.box ?? [2, 2, 2, 2]))
    gl.uniform2f(u.uHoleMix, near?.mix ?? 0, farW?.mix ?? 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  destroy() {
    this.dead = true
    cancelAnimationFrame(this.raf)
    clearTimeout(this.warmTimer)
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored)
    this.dropAll()
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
