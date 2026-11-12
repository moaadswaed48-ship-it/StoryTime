/**
 * The shelf's imperative half: one object that owns the numbers (position, presence, entrance, detail
 * flight, light) and writes transforms / opacities straight to the DOM on the shared GSAP ticker.
 * React renders the books once and only hears about discrete changes (selection, detail, landed).
 */
import gsap from 'gsap'
import { library, type Season } from '@/content/library'
import { sfx } from '@/audio/synth'
import { dirSign } from '@/i18n/locale'
import { clamp, lerp } from '@/lib/clamp'
import { useSiteStore } from '@/store/useSiteStore'
import { DETAIL_DEG, computeGeoms, layout, nearest, newLive, newPose, ranks, smooth, stepSize, type Geom, type Live, type Metrics, type Pose } from './engine'

export type Filter = 'all' | Season
export const READY = Math.max(0, library.findIndex((b) => b.ready))
const N = library.length
const RAD = Math.PI / 180

export interface ShelfEls {
  stage: HTMLElement
  scene: HTMLElement
  plank: HTMLElement
  lip: HTMLElement
  /** Where the opened book comes to rest, and the block that must be on screen when it does. */
  slot: HTMLElement
  panel: HTMLElement
  books: (HTMLElement | null)[]
  shadows: (HTMLElement | null)[]
}
export interface ShelfEvents {
  onSel: (i: number) => void
  onDetail: (i: number | null) => void
  onLanded: () => void
  onFilter: (f: Filter) => void
  /** The opened cover was clicked. */
  onCover: (i: number) => void
}

interface Drag {
  id: number
  x0: number
  u0: number
  step: number
  active: boolean
  lx: number
  lt: number
  v: number
}
interface Written {
  t: string
  o: number
  f: number
  s: number
  e: number
  sx: number
  vis: boolean
  so: number
  st: string
}

export class Shelf {
  m: Metrics
  geoms: Geom[]
  live: Live[] = library.map(newLive)
  visible: boolean[] = library.map(() => true)
  filter: Filter = 'all'
  /** The book the shelf is heading to, and how far (in ranks) it still is from it. */
  sel = READY
  delta = 0
  /** Entrance channels (see `build`). */
  focusGain = 1
  spread = 0
  plank = 1
  clock = 0
  landed = true
  /** Detail: 0 on the shelf … 1 opened; `detail` is the book in flight (−1 none). */
  dp = 0
  detail = -1
  closing = false
  reduced = false
  onScreen = false

  private ev: ShelfEvents
  private els: ShelfEls | null = null
  private poses: Pose[] = library.map(newPose)
  private rk: number[] = []
  private kTilt: number[] = library.map(() => 0)
  private wrote: Written[] = library.map(() => ({ t: '', o: -1, f: -1, s: -1, e: -1, sx: 1e9, vis: true, so: -1, st: '' }))
  private slot = { x: 0, y: 0, s: 1 }
  /** Pointer parallax of the whole scene (deg) and tilt of the opened book (−1…1). */
  private px = 0
  private py = 0
  private tpx = 0
  private tpy = 0
  private tx = 0
  private ty = 0
  private ttx = 0
  private tty = 0
  /** Where the bar of light rests on the opened cover (−1…1 across it; beyond ±1 = off the cover). */
  private lx = 1.5
  private tlx = 1.5
  private hover = -1
  private awake = 0
  private snap: gsap.core.Tween | null = null
  private fly: gsap.core.Tween | null = null
  private pres: gsap.core.Tween[] = []
  private tl: gsap.core.Timeline | null = null
  private order: number[] = []
  private hits: number[] = []
  private drag: Drag | null = null
  private draggedAt = 0
  private wheelTimer = 0
  private fine = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

  constructor(m: Metrics, ev: ShelfEvents) {
    this.m = m
    this.geoms = computeGeoms(library, m)
    this.ev = ev
  }

  /* ── lifecycle ─────────────────────────────────────────────────────────── */
  attach(els: ShelfEls) {
    this.els = els
    const s = els.stage
    s.addEventListener('pointerdown', this.down)
    s.addEventListener('pointermove', this.move)
    s.addEventListener('pointerup', this.up)
    s.addEventListener('pointercancel', this.up)
    s.addEventListener('pointerleave', this.leave)
    s.addEventListener('click', this.click)
    s.addEventListener('keydown', this.key)
    s.addEventListener('wheel', this.wheel, { passive: false })
    gsap.ticker.add(this.tick)
    this.wake(4)
  }
  detach() {
    const s = this.els?.stage
    if (s) {
      s.removeEventListener('pointerdown', this.down)
      s.removeEventListener('pointermove', this.move)
      s.removeEventListener('pointerup', this.up)
      s.removeEventListener('pointercancel', this.up)
      s.removeEventListener('pointerleave', this.leave)
      s.removeEventListener('click', this.click)
      s.removeEventListener('keydown', this.key)
      s.removeEventListener('wheel', this.wheel)
    }
    gsap.ticker.remove(this.tick)
    window.clearTimeout(this.wheelTimer)
    this.snap?.kill()
    this.fly?.kill()
    this.tl?.kill()
    this.tl = null
    this.pres.forEach((t) => t.kill())
    this.drag = null
    this.els = null
  }
  setMetrics(m: Metrics, geoms: Geom[]) {
    this.m = m
    this.geoms = geoms
    this.wrote.forEach((w) => (w.t = ''))
    if (!this.landed && !this.tl) this.arm()
    if (this.detail >= 0) this.measureSlot()
    this.wake(4)
  }
  setReduced(on: boolean) {
    this.reduced = on
    if (on) {
      this.tpx = this.tpy = this.px = this.py = 0
      if (!this.landed) this.finish()
    }
    this.wake()
  }
  setOnScreen(on: boolean) {
    this.onScreen = on
    if (on) this.wake(4)
  }

  wake = (frames = 3) => {
    if (this.awake < frames) this.awake = frames
  }
  private tick = () => {
    if (!this.els || !this.onScreen || this.awake <= 0) return
    this.awake--
    this.render()
  }

  /* ── queries ───────────────────────────────────────────────────────────── */
  u() {
    ranks(this.live, this.rk)
    return this.rk[this.sel] + this.delta
  }
  private list() {
    const out: number[] = []
    for (let i = 0; i < N; i++) if (this.visible[i]) out.push(i)
    return out
  }
  count() {
    return this.list().length
  }
  index() {
    return this.list().indexOf(this.sel)
  }
  state() {
    const b = library[this.sel]
    return {
      index: this.index(),
      count: this.count(),
      id: b.id,
      ready: b.ready,
      filter: this.filter,
      detail: this.detail >= 0 && !this.closing,
      landed: this.landed,
      settled: Math.abs(this.delta) < 0.002 && !this.drag?.active && (this.dp === 0 || this.dp === 1),
    }
  }

  /* ── moving along the shelf ────────────────────────────────────────────── */
  go(i: number, duration = 0.8) {
    if (i < 0 || i >= N || !this.visible[i]) return
    const uNow = this.u()
    const changed = i !== this.sel
    this.sel = i
    this.delta = uNow - this.rk[i]
    if (changed) {
      this.ev.onSel(i)
      sfx.flip()
    }
    this.snap?.kill()
    if (this.reduced) this.delta = 0
    else this.snap = gsap.to(this, { delta: 0, duration, ease: 'power3.out', onUpdate: this.wake })
    this.wake()
  }
  step(d: number) {
    for (let j = this.sel + d; j >= 0 && j < N; j += d) {
      if (this.visible[j]) {
        this.go(j)
        return
      }
    }
  }
  /** Select by position among the visible books (what the QA hook and Home/End use). */
  select(rank: number) {
    const l = this.list()
    if (l.length) this.go(l[clamp(Math.round(rank), 0, l.length - 1)])
  }
  private settle() {
    if (Math.abs(this.delta) > 0.001) this.go(this.sel, 0.5)
  }
  /** Follow a free position (drag / wheel): the nearest book becomes the selection as it passes the centre. */
  private setU(u: number) {
    const i = nearest(this.live, this.visible, u)
    if (i < 0) return
    this.delta = u - this.rk[i]
    if (i !== this.sel) {
      this.sel = i
      this.ev.onSel(i)
    }
    this.wake()
  }

  /* ── filter ────────────────────────────────────────────────────────────── */
  setFilter(f: Filter) {
    if (f === this.filter) return
    const vis = library.map((b) => f === 'all' || b.season === f)
    if (!vis.some(Boolean)) return
    if (this.detail >= 0) this.close()
    const uNow = this.u()
    let target = this.sel
    if (!vis[target]) {
      // Prefer the real book when it survives the filter, otherwise the closest survivor.
      target = vis[READY] ? READY : vis.reduce((best, ok, i) => (ok && (best < 0 || Math.abs(i - this.sel) < Math.abs(best - this.sel)) ? i : best), -1)
    }
    this.filter = f
    this.visible = vis
    this.pres.forEach((t) => t.kill())
    this.pres = this.live.map((l, i) => {
      const p = vis[i] ? 1 : 0
      if (this.reduced) {
        l.p = p
        return gsap.set(l, { p })
      }
      return gsap.to(l, { p, duration: 0.75, ease: 'power3.inOut', onUpdate: this.wake })
    })
    const changed = target !== this.sel
    this.sel = target
    this.delta = this.reduced ? 0 : uNow - this.rk[target]
    this.snap?.kill()
    if (!this.reduced) this.snap = gsap.to(this, { delta: 0, duration: 0.75, ease: 'power3.inOut', onUpdate: this.wake })
    if (changed) this.ev.onSel(target)
    this.ev.onFilter(f)
    this.wake()
  }

  /* ── detail ────────────────────────────────────────────────────────────── */
  private measureSlot() {
    const els = this.els
    if (!els || this.detail < 0) return
    const sr = els.stage.getBoundingClientRect()
    const r = els.slot.getBoundingClientRect()
    this.slot.x = r.left + r.width / 2 - (sr.left + sr.width / 2)
    this.slot.y = r.bottom - sr.top - this.m.floorY
    this.slot.s = r.height / this.geoms[this.detail].H
  }
  private markOpen(i: number) {
    this.els?.books.forEach((b, j) => b?.classList.toggle('is-open', j === i))
  }
  open(i = this.sel) {
    if (!this.els || !this.visible[i]) return
    if (this.detail >= 0) {
      if (!this.closing) return
      if (i !== this.detail) {
        this.fly?.kill()
        this.dp = 0
      }
    }
    if (i !== this.sel) this.go(i)
    this.closing = false
    this.detail = i
    this.hover = -1
    this.tx = this.ty = this.ttx = this.tty = 0
    this.lx = this.tlx = 1.5
    this.measureSlot()
    this.markOpen(i)
    this.fly?.kill()
    if (this.reduced) this.dp = 1
    else this.fly = gsap.to(this, { dp: 1, duration: 1.05, ease: 'power3.inOut', onUpdate: this.wake })
    this.ev.onDetail(i)
    sfx.flip()
    this.reveal()
    this.wake()
  }
  close() {
    if (this.detail < 0 || this.closing) return
    this.closing = true
    const done = () => {
      this.closing = false
      this.detail = -1
      this.markOpen(-1)
      this.wake()
    }
    this.ev.onDetail(null)
    this.fly?.kill()
    if (this.reduced) {
      this.dp = 0
      done()
    } else this.fly = gsap.to(this, { dp: 0, duration: 0.85, ease: 'power3.inOut', onUpdate: this.wake, onComplete: done })
    this.wake()
  }
  /** Brings the opened book's panel fully into the viewport (only if it is not already). */
  private reveal() {
    const panel = this.els?.panel
    if (!panel) return
    const r = panel.getBoundingClientRect()
    const vh = window.innerHeight
    if (r.top >= 64 && r.bottom <= vh - 12) return
    const y = Math.max(0, window.scrollY + r.top - Math.max(76, (vh - r.height) / 2))
    const lenis = useSiteStore.getState().lenis
    if (lenis) lenis.scrollTo(y, this.reduced ? { immediate: true } : { duration: 1.1 })
    else window.scrollTo(0, y)
  }
  /** Pointer over the page while a book is open: the book turns a little toward it, and the light follows. */
  tilt(clientX: number, clientY: number) {
    if (this.detail < 0 || this.closing || this.reduced || !this.fine || !this.els) return
    const r = this.els.slot.getBoundingClientRect()
    const nx = (clientX - (r.left + r.width / 2)) / r.width
    this.ttx = clamp(nx / 1.2, -1, 1)
    this.tty = clamp((clientY - (r.top + r.height / 2)) / r.height, -1, 1)
    this.tlx = clamp(nx * 2, -1.5, 1.5) // the light sits under the pointer while it is over the cover
    this.wake()
  }

  /* ── entrance: land and shuffle ────────────────────────────────────────── */
  /** Hide the row above the ledge, ready to drop. */
  arm() {
    if (this.reduced) return
    this.landed = false
    this.focusGain = 0
    this.spread = 1
    this.plank = 0
    this.clock = 0
    this.live.forEach((l, i) => {
      l.alpha = 0
      l.dropY = -this.geoms[i].dropFrom
      l.tilt = this.geoms[i].dropTilt
    })
    this.wake(4)
  }
  private build() {
    this.tl?.kill()
    const order = this.list()
    const tl = gsap.timeline({ paused: true, onUpdate: this.wake, onComplete: () => this.finish() })
    tl.fromTo(this, { plank: 0 }, { plank: 1, duration: 0.5, ease: 'power2.out' }, 0)
    let last = 0
    order.forEach((i, k) => {
      const l = this.live[i]
      const g = this.geoms[i]
      const at = 0.1 + k * 0.056
      const fall = 0.36 + 0.18 * (g.dropFrom / (this.m.S * 0.5)) // higher drops take a little longer
      const hit = at + fall
      const hop = 6 + (g.dropFrom / this.m.S) * 13
      this.hits[i] = hit
      tl.fromTo(l, { alpha: 0 }, { alpha: 1, duration: 0.2, ease: 'none' }, at)
      tl.fromTo(l, { dropY: -g.dropFrom }, { dropY: 0, duration: fall, ease: 'power2.in' }, at) // gravity
      tl.fromTo(l, { tilt: g.dropTilt }, { tilt: -g.dropTilt * 0.3, duration: fall, ease: 'power1.in' }, at)
      tl.to(l, { dropY: -hop, duration: 0.1, ease: 'power2.out' }, hit) // one small bounce
      tl.to(l, { dropY: 0, duration: 0.13, ease: 'power2.in' }, hit + 0.1)
      tl.to(l, { tilt: 0, duration: 0.6, ease: 'elastic.out(1.15, 0.4)' }, hit) // rocks upright
      last = Math.max(last, hit)
    })
    // Shuffle: the loose, crooked row slides together and straightens, then the centre book steps out.
    tl.fromTo(this, { spread: 1 }, { spread: 0, duration: 0.75, ease: 'power3.inOut' }, last - 0.08)
    tl.fromTo(this, { focusGain: 0 }, { focusGain: 1, duration: 1, ease: 'power3.inOut' }, last + 0.06)
    tl.call(() => this.ev.onLanded(), undefined, last + 0.5)
    const total = tl.duration()
    tl.fromTo(this, { clock: 0 }, { clock: total, duration: total, ease: 'none' }, 0)
    this.order = order
    this.tl = tl
    return tl
  }
  /** Neighbours already standing get knocked by each landing: a damped lean and nudge, summed analytically so it can be scrubbed. */
  private knocks() {
    const kt = this.kTilt
    for (let i = 0; i < N; i++) {
      kt[i] = 0
      this.live[i].nudge = 0
    }
    if (this.landed || !this.tl) return
    const t = this.clock
    const order = this.order
    for (let k = 0; k < order.length; k++) {
      const i = order[k]
      for (let j = 1; j <= 3; j++) {
        const nb = order[k + j]
        if (nb === undefined) break
        const tau = t - this.hits[nb] - (j - 1) * 0.028
        if (tau <= 0) continue
        const imp = Math.exp(-tau / 0.15) * Math.sin(tau * 15.5)
        kt[i] += -dirSign * (2.9 / j) * imp
        this.live[i].nudge -= (5 / j) * imp
      }
    }
  }
  private finish() {
    this.landed = true
    this.focusGain = 1
    this.spread = 0
    this.plank = 1
    this.live.forEach((l) => {
      l.alpha = 1
      l.dropY = 0
      l.tilt = 0
      l.nudge = 0
    })
    this.tl?.kill()
    this.tl = null
    this.ev.onLanded()
    this.wake(4)
  }
  play() {
    if (this.landed || this.reduced) return
    if (this.tl?.isActive()) return
    this.build().play(0)
  }
  replay() {
    if (this.reduced) return
    this.tl?.kill()
    this.tl = null
    this.arm()
    this.build().play(0)
  }
  /** QA: freeze the entrance at a fraction of its length (deterministic screenshots). */
  seek(p: number) {
    if (this.reduced) return
    if (!this.tl) {
      this.arm()
      this.build()
    }
    this.landed = false
    this.tl!.pause().progress(clamp(p, 0, 0.999))
    this.renderNow()
  }

  /* ── input ─────────────────────────────────────────────────────────────── */
  private down = (e: PointerEvent) => {
    if (this.detail >= 0 || (e.pointerType === 'mouse' && e.button !== 0)) return
    this.snap?.kill()
    this.drag = { id: e.pointerId, x0: e.clientX, u0: this.u(), step: stepSize(this.geoms, this.live, this.m.gap), active: false, lx: e.clientX, lt: e.timeStamp, v: 0 }
  }
  private move = (e: PointerEvent) => {
    const d = this.drag
    if (!d || d.id !== e.pointerId) {
      if (e.pointerType === 'mouse') this.hoverAt(e)
      return
    }
    if (!d.active) {
      const dx = e.clientX - d.x0
      if (Math.abs(dx) < 6) return
      d.active = true
      d.x0 += Math.sign(dx) * 6 // no jump when the drag takes over
      try {
        this.els?.stage.setPointerCapture(d.id)
      } catch {
        /* pointer already gone */
      }
      this.els?.stage.classList.add('is-drag')
      this.hover = -1
    }
    const max = this.count() - 1
    this.setU(clamp(d.u0 - (dirSign * (e.clientX - d.x0)) / d.step, -1.6, max + 1.6))
    const dt = Math.max(1, e.timeStamp - d.lt)
    d.v = lerp(d.v, (-dirSign * (e.clientX - d.lx)) / d.step / (dt / 1000), 0.5)
    d.lx = e.clientX
    d.lt = e.timeStamp
  }
  private up = (e: PointerEvent) => {
    const d = this.drag
    if (!d || d.id !== e.pointerId) return
    this.drag = null
    if (!d.active) {
      this.settle()
      return
    }
    try {
      this.els?.stage.releasePointerCapture(d.id)
    } catch {
      /* already released */
    }
    this.els?.stage.classList.remove('is-drag')
    this.draggedAt = performance.now()
    // Inertia: throw the row as far as its release speed carries it, then land on a book.
    const v = e.timeStamp - d.lt > 90 ? 0 : clamp(d.v, -45, 45)
    const max = this.count() - 1
    const uNow = this.u()
    const target = nearest(this.live, this.visible, clamp(uNow + v * 0.2, 0, max))
    this.go(target, clamp(0.5 + Math.abs(this.rk[target] - uNow) * 0.085, 0.5, 1.15))
  }
  private leave = () => {
    this.tpx = this.tpy = 0
    this.hover = -1
    this.wake()
  }
  private hoverAt(e: PointerEvent) {
    if (!this.fine || this.reduced || this.detail >= 0 || !this.els) return
    const r = this.els.stage.getBoundingClientRect()
    this.tpx = ((e.clientX - r.left) / r.width - 0.5) * 5
    this.tpy = ((e.clientY - r.top) / r.height - 0.5) * -2.2
    const el = (e.target as Element | null)?.closest?.<HTMLElement>('.lib-book')
    this.hover = el ? Number(el.dataset.i) : -1
    this.wake()
  }
  private click = (e: MouseEvent) => {
    if (performance.now() - this.draggedAt < 350) return
    const el = (e.target as Element | null)?.closest?.<HTMLElement>('.lib-book')
    if (!el) return
    const i = Number(el.dataset.i)
    if (this.detail >= 0) {
      if (i === this.detail && !this.closing) this.ev.onCover(i)
      return
    }
    if (i === this.sel && Math.abs(this.delta) < 0.35) this.open(i)
    else this.go(i)
  }
  private key = (e: KeyboardEvent) => {
    if (this.detail >= 0 || e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === 'ArrowRight') this.step(dirSign)
    else if (e.key === 'ArrowLeft') this.step(-dirSign)
    else if (e.key === 'Home') this.select(0)
    else if (e.key === 'End') this.select(N)
    else if (e.key === 'Enter' || e.key === ' ') this.open()
    else return
    e.preventDefault()
  }
  /** Sideways wheel / trackpad swipes move the shelf; vertical scrolling is left to the page. */
  private wheel = (e: WheelEvent) => {
    if (this.detail >= 0 || Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 1) return
    e.preventDefault()
    this.snap?.kill()
    const px = e.deltaMode === 1 ? e.deltaX * 32 : e.deltaX
    const max = this.count() - 1
    this.setU(clamp(this.u() + (dirSign * px) / stepSize(this.geoms, this.live, this.m.gap), -0.4, max + 0.4))
    window.clearTimeout(this.wheelTimer)
    this.wheelTimer = window.setTimeout(() => this.settle(), 140)
  }

  /* ── drawing ───────────────────────────────────────────────────────────── */
  renderNow() {
    if (this.els) this.render()
  }
  private render() {
    const els = this.els!
    const { m, geoms, live, poses, wrote } = this
    const k = this.reduced ? 1 : 1 - Math.pow(0.88, gsap.ticker.deltaRatio(60))
    let moving = false
    const ease = (cur: number, to: number, kk = k) => {
      const d = to - cur
      if (Math.abs(d) < 0.0008) return to
      moving = true
      return cur + d * kk
    }
    this.px = ease(this.px, this.tpx)
    this.py = ease(this.py, this.tpy)
    this.tx = ease(this.tx, this.ttx)
    this.ty = ease(this.ty, this.tty)
    this.lx = ease(this.lx, this.tlx)
    for (let i = 0; i < N; i++) live[i].hover = ease(live[i].hover, i === this.hover && !this.drag?.active && this.detail < 0 ? 1 : 0, Math.min(1, k * 1.6))

    this.knocks()
    const u = this.u()
    layout({ geoms, live, u, dir: dirSign, gap: m.gap, focusGain: this.focusGain, spread: this.spread, step: stepSize(geoms, live, m.gap) }, poses)

    const e = this.dp
    const yaw = this.px * (1 - e)
    const pitch = this.py * (1 - e)
    els.scene.style.transform = `rotateX(${pitch.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg)`
    const ledge = (this.plank * (1 - clamp(e * 1.5, 0, 1))).toFixed(3)
    els.plank.style.opacity = ledge
    els.lip.style.opacity = ledge

    for (let i = 0; i < N; i++) {
      const el = els.books[i]
      if (!el) continue
      const p = poses[i]
      const g = geoms[i]
      const w = wrote[i]
      let { x, y, z, ry } = p
      let rx = 0
      let s = 1
      let o = p.o
      const rz = p.rz + this.kTilt[i]
      // Where the bar of light sits on the cover, in cover widths ×1.5 (0 = centre). It crosses as the book turns,
      // comes to rest just past the edge, and slides back over the foil on hover.
      let light = (dirSign * p.ry + dirSign * yaw * 3 - 50) / 68 + live[i].hover * p.f * 0.55
      if (e > 0 && this.detail >= 0) {
        if (i === this.detail) {
          x = lerp(x, this.slot.x, e)
          y = lerp(y, this.slot.y, e)
          z = lerp(z, 0, e) + Math.sin(Math.PI * e) * m.S * 0.26 // swoops toward the eye on the way
          ry = lerp(ry, dirSign * DETAIL_DEG + this.tx * 10, e)
          rx = -this.ty * 7 * e
          s = lerp(1, this.slot.s, e)
          light = lerp(light, (dirSign * this.lx) / 3, e) - 2.2 * e // one full sweep during the flight, then it follows the pointer
        } else {
          const ee = smooth(clamp(e * 1.7 - Math.abs(i - this.detail) * 0.035, 0, 1))
          o *= 1 - ee
          z -= ee * m.S * 0.32
          y += ee * m.S * 0.04
        }
      }
      const vis = o > 0.004
      if (vis !== w.vis) {
        el.style.visibility = vis ? 'visible' : 'hidden'
        w.vis = vis
      }
      const sd = els.shadows[i]
      if (vis) {
        const k3 = (s / m.K).toFixed(4)
        const t = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateZ(${rz.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale3d(${k3},${k3},${k3})`
        if (t !== w.t) {
          el.style.transform = t
          w.t = t
        }
        const th = (dirSign * ry + (i === this.detail ? 0 : dirSign * yaw)) * RAD
        const cs = Math.cos(th)
        const sn = Math.sin(th)
        const shF = 0.5 * Math.pow(clamp(1 - cs, 0, 1), 1.35)
        const shS = 0.52 * Math.pow(clamp(1 - sn, 0, 1), 1.3)
        const shE = 0.08 + 0.3 * clamp(1 + sn, 0, 1)
        const sx = dirSign * g.W * m.K * 1.5 * light
        if (Math.abs(o - w.o) > 0.003) el.style.setProperty('--o', (w.o = o).toFixed(3))
        if (Math.abs(shF - w.f) > 0.004) el.style.setProperty('--sh-f', (w.f = shF).toFixed(3))
        if (Math.abs(shS - w.s) > 0.004) el.style.setProperty('--sh-s', (w.s = shS).toFixed(3))
        if (Math.abs(shE - w.e) > 0.004) el.style.setProperty('--sh-e', (w.e = shE).toFixed(3))
        if (Math.abs(sx - w.sx) > 0.25) el.style.setProperty('--sx', `${(w.sx = sx).toFixed(1)}px`)
      }
      if (sd) {
        // The shadow fades as the book leaves the ledge (dropping in, sinking out, or flying to the detail view).
        const so = vis ? o * clamp(1 + (live[i].dropY / (m.S * 0.3)), 0, 1) * (1 - clamp(e * 2.2, 0, 1)) : 0
        if (Math.abs(so - w.so) > 0.004) sd.style.opacity = (w.so = so).toFixed(3)
        if (so > 0) {
          const st = `translate(${(m.plankW / 2 + x - g.W / 2).toFixed(1)}px,${(m.plankBack + z - g.T / 2).toFixed(1)}px) rotate(${(-ry).toFixed(2)}deg)`
          if (st !== w.st) {
            sd.style.transform = st
            w.st = st
          }
        }
      }
    }
    if (moving) this.wake(2)
  }
}
