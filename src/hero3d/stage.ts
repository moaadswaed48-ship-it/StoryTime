/**
 * The little stage the hero figures stand on: one figure at a time, a pop when they change places, the camera that
 * frames each of them, and the key light. Plain three.js (no React), driven by `tick`.
 */
import * as THREE from 'three'
import type { Gesture, Sheet } from '../cast/sheet.ts'
import { buildFigure, type Figure, type Look } from './figure.ts'
import { addStageLight } from './materials.ts'

const FOV = 28
const back = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2

export class StageRuntime {
  readonly group = new THREE.Group()
  current: Figure | null = null
  /** The visitor's own turn of the figure (radians); eases back to the front when let go. */
  turn = 0
  holding = false
  private figures = new Map<string, Figure>()
  private leaving: Figure | null = null
  private waiting: Figure | null = null
  private enter = 1
  private leave = 1
  private frame = 0
  private frameTo = 0
  private shownTurn = 0
  private idleFor = 0

  constructor() {
    addStageLight(this.group)
  }

  figure(sheet: Sheet): Figure {
    let f = this.figures.get(sheet.id)
    if (!f) {
      f = buildFigure(sheet)
      this.figures.set(sheet.id, f)
    }
    return f
  }

  /** Shows this character. `instant` skips the pop (still pictures, reduced motion). */
  select(sheet: Sheet, instant = false) {
    const next = this.figure(sheet)
    if (next === this.current || next === this.waiting) return
    this.frameTo = frameHeight(next)
    if (instant || !this.current) {
      if (this.current) this.group.remove(this.current.root)
      if (this.leaving) this.group.remove(this.leaving.root)
      this.leaving = this.waiting = null
      this.current = next
      next.root.scale.setScalar(1)
      this.group.add(next.root)
      this.enter = instant ? 1 : 0
      if (instant || !this.frame) this.frame = this.frameTo
      return
    }
    this.current.rest()
    this.leaving = this.current
    this.leave = 0
    this.waiting = next
    this.current = null
  }

  play(g: Gesture) {
    this.current?.play(g)
    this.idleFor = 0
  }

  /** One step of time. With `frozen`, nothing moves by itself: the figure shows exactly that moment. */
  tick(dt: number, look: Look | null, frozen?: { gesture: Gesture; t?: number } | null) {
    const step = Math.min(dt, 0.1)
    if (this.leaving) {
      this.leave = Math.min(1, this.leave + step / 0.16)
      this.leaving.root.scale.setScalar(Math.max(0.001, 1 - this.leave * this.leave))
      this.leaving.update(step, look)
      if (this.leave >= 1) {
        this.group.remove(this.leaving.root)
        this.leaving = null
        if (this.waiting) {
          this.current = this.waiting
          this.waiting = null
          this.enter = 0
          this.group.add(this.current.root)
        }
      }
    }
    const f = this.current
    if (f) {
      if (frozen) {
        f.still(frozen.gesture, frozen.t)
        f.root.scale.setScalar(1)
        this.enter = 1
      } else {
        this.enter = Math.min(1, this.enter + step / 0.42)
        const s = back(this.enter)
        f.root.scale.set(s, Math.max(0.001, s * (1 + 0.25 * (1 - this.enter))), s)
        f.update(step, look)
      }
      // the visitor's turn eases home once they let go
      if (!this.holding) {
        this.idleFor += step
        if (this.idleFor > 1.1) this.turn *= Math.exp(-step * 3.2)
      } else this.idleFor = 0
      this.shownTurn = frozen ? this.turn : this.shownTurn + (this.turn - this.shownTurn) * (1 - Math.exp(-step * 14))
      f.root.rotation.y = this.shownTurn
    }
    this.frame = frozen || !this.frame ? this.frameTo : this.frame + (this.frameTo - this.frame) * (1 - Math.exp(-step * 6))
  }

  /** Is anything still easing (so a paused, on-demand canvas knows to draw another frame)? */
  get settling() {
    return !!this.leaving || this.enter < 1 || Math.abs(this.frame - this.frameTo) > 1e-3
  }

  /** Frames the current figure: feet near the bottom, room above for a jump with raised arms. */
  placeCamera(camera: THREE.PerspectiveCamera, aspect: number) {
    const H = this.current?.rig.H ?? this.waiting?.rig.H ?? 1.7
    const view = Math.max(this.frame || frameHeight(null), (1.3 * H) / Math.max(0.2, aspect))
    // the camera rides up a little with a jump
    const f = this.current
    const cy = view * 0.42 + (f ? Math.max(0, f.pose.lift) * f.rig.leg * 0.7 : 0)
    const d = view / 2 / Math.tan((FOV * Math.PI) / 360)
    camera.fov = FOV
    camera.aspect = aspect
    camera.near = d * 0.3
    camera.far = d * 3
    camera.position.set(0, cy + view * 0.1, d)
    camera.lookAt(0, cy, 0)
    camera.updateProjectionMatrix()
  }

  dispose() {
    for (const f of this.figures.values()) {
      this.group.remove(f.root)
      f.dispose()
    }
    this.figures.clear()
    this.current = this.leaving = this.waiting = null
  }
}

/** How tall a slice of world the camera shows for a figure. Small characters are shown a little larger, not full size. */
function frameHeight(f: Figure | null) {
  const H = f?.rig.H ?? 1.7
  return (H * 0.72 + 1.7 * 0.28) * 1.45
}
