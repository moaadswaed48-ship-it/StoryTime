/**
 * buildFigure(sheet): a complete code-built character. One skinned mesh on the standard skeleton, a face, an
 * outline and a contact shadow; `play(gesture)` blends a gesture in and out of a living idle.
 * No React here, so the same figure can stand in the landing hero or in a game.
 */
import * as THREE from 'three'
import { BONES, type Bone, type Gesture, type Sheet } from '../cast/sheet.ts'
import { buildBody, palette } from './body.ts'
import { buildFace, type Face } from './face.ts'
import { GESTURE_DEFS, gesturePose, idlePose, type Act } from './gestures.ts'
import { contactShadow, outlineMaterial, toonMaterial } from './materials.ts'
import { CHANNELS, REST, copyPose, lerpPose, wrapAngle, type Pose } from './pose.ts'
import { makeBones, makeRig, type Rig } from './rig.ts'
import { newSolved, solve, type Solved } from './solver.ts'

const BLEND_OUT = 0.34
/** How fast a carried-over pose dies away (per second) and when it is fully gone (seconds). */
const CARRY_RATE = 9
const CARRY_FOR = 0.7
const io = (t: number) => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}

export type Look = { /** −1 (viewer's left) … 1 (viewer's right). */ x: number; /** −1 (down) … 1 (up). */ y: number }

export class Figure {
  readonly sheet: Sheet
  readonly rig: Rig
  readonly root = new THREE.Group()
  readonly bones: Record<Bone, THREE.Bone>
  readonly skeleton: THREE.Skeleton
  readonly body: THREE.SkinnedMesh
  readonly outline: THREE.SkinnedMesh
  readonly shadow: THREE.Mesh
  readonly face: Face
  /** A loosely held walking stick, if the sheet has one. */
  cane: THREE.Group | null = null
  /** The pose shown now. */
  readonly pose: Pose = copyPose(REST)
  readonly solved: Solved = newSolved()

  private act: Act | null = null
  private actT = 0
  private clock = 0
  private idle: Pose = copyPose(REST)
  private tmp: Pose = copyPose(REST)
  private base: Pose = copyPose(REST)
  private before: Pose = copyPose(REST)
  private carry: Pose = copyPose(REST)
  private carrySpeed: Pose = copyPose(REST)
  private carryT = 99
  private rebase = false
  private lastStep = 1 / 60
  private nextBlink = 1.2
  private blinkT = -1
  private lookX = 0
  private lookY = 0
  private glanceAt = 3
  private glance = { x: 0, y: 0, until: 0 }

  constructor(sheet: Sheet) {
    this.sheet = sheet
    this.rig = makeRig(sheet)
    const pal = palette(sheet)
    const { bones, byName } = makeBones(this.rig)
    this.bones = byName
    this.root.name = sheet.id
    this.root.add(byName.hips)
    this.root.updateMatrixWorld(true)
    this.skeleton = new THREE.Skeleton(bones)

    const { geometry, cane } = buildBody(sheet, this.rig, pal)
    const toon = toonMaterial()
    this.body = new THREE.SkinnedMesh(geometry, toon)
    this.body.name = 'body'
    this.body.bind(this.skeleton, new THREE.Matrix4())
    this.body.frustumCulled = false
    this.outline = new THREE.SkinnedMesh(geometry, outlineMaterial(this.rig.line))
    this.outline.name = 'outline'
    this.outline.bind(this.skeleton, new THREE.Matrix4())
    this.outline.frustumCulled = false
    this.outline.userData.helper = true
    this.shadow = contactShadow(Math.max(this.rig.pelvisX * 2.3, this.rig.footLen * 1.5))
    this.shadow.userData.helper = true
    this.face = buildFace(sheet, this.rig, pal, toon)
    byName.head.add(this.face.group)
    if (cane) {
      // a walking stick hangs loosely from the left hand: it stays upright whatever the arm does
      this.cane = new THREE.Group()
      this.cane.name = 'cane'
      this.cane.position.copy(cane.grip).sub(this.rig.joint.leftHand)
      const stick = new THREE.Mesh(cane.geometry, toon)
      stick.name = 'caneStick'
      const line = new THREE.Mesh(cane.geometry, this.outline.material)
      line.name = 'caneOutline'
      line.userData.helper = true
      this.cane.add(stick, line)
      byName.leftHand.add(this.cane)
    }
    this.root.add(this.body, this.outline, this.shadow)
    this.show(this.pose)
  }

  /** Which gesture is playing (or 'idle'). */
  get playing(): Gesture {
    return this.act ?? 'idle'
  }

  /** Starts a gesture; it takes over smoothly from whatever is shown now and blends back to idle at its end. */
  play(gesture: Gesture) {
    this.act = gesture === 'idle' ? null : gesture
    this.actT = 0
    this.rebase = true
  }

  /** Advances time and shows the new pose. `look` is where the viewer's pointer is, if anywhere. */
  update(dt: number, look?: Look | null) {
    const step = Math.min(dt, 0.1)
    this.clock += step
    const idle = idlePose(this.clock, this.idle)
    this.life(step, look, idle)
    let pose = idle
    if (this.act) {
      this.actT += step
      const def = GESTURE_DEFS[this.act]
      if (this.actT >= def.duration) this.act = null
      else {
        const g = gesturePose(this.act, this.actT, this.tmp)
        const out = 1 - io((this.actT - (def.duration - BLEND_OUT)) / BLEND_OUT)
        if (out < 1) g.yaw = wrapAngle(g.yaw)
        lerpPose(idle, g, out, g)
        g.blink = Math.max(g.blink, idle.blink * (g.happy > 0.5 ? 0 : 1))
        pose = g
      }
    }
    // A change of gesture carries the old pose and its speed over and lets them die away (an inertial blend),
    // so nothing jumps and nothing stops dead, whenever a button is pressed.
    if (this.rebase) {
      this.rebase = false
      this.carryT = 0
      for (const k of CHANNELS) {
        const speed = (this.base[k] - this.before[k]) / this.lastStep
        this.carry[k] = this.base[k] + speed * step - pose[k]
        this.carrySpeed[k] = speed
      }
      this.carry.yaw = wrapAngle(this.carry.yaw)
      this.carry.blink = this.carrySpeed.blink = 0
    }
    copyPose(this.base, this.before)
    this.lastStep = step
    if (this.carryT < CARRY_FOR) {
      const fade = Math.exp(-CARRY_RATE * this.carryT) * (1 - io((this.carryT - CARRY_FOR * 0.6) / (CARRY_FOR * 0.4)))
      for (const k of CHANNELS) pose[k] += (this.carry[k] + (this.carrySpeed[k] + CARRY_RATE * this.carry[k]) * this.carryT) * fade
      this.carryT += step
    }
    // remember the pose before the glance is added: the next gesture blends in from here
    copyPose(pose, this.base)
    // the pointer steers the head and eyes only as far as the pose allows
    const attend = Math.min(1, Math.max(0, pose.attend))
    pose.headRy += this.lookX * 0.42 * attend
    pose.headRx += -this.lookY * 0.22 * attend
    pose.lookX += this.lookX * 0.8 * attend
    pose.lookY += this.lookY * 0.7 * attend
    this.show(pose)
  }

  /** Stops any gesture and eases back to idle. */
  rest() {
    if (this.act) this.play('idle')
  }

  /** Shows one exact moment of a gesture (still pictures, tests). No time passes. */
  still(gesture: Gesture, t?: number) {
    if (gesture === 'idle') idlePose(t ?? 0, this.tmp)
    else gesturePose(gesture, t ?? GESTURE_DEFS[gesture].apex, this.tmp)
    this.show(this.tmp)
  }

  /** Blinks and glances: the small life that runs under everything. Writes blink into the idle pose. */
  private life(dt: number, look: Look | null | undefined, idle: Pose) {
    // blink
    this.nextBlink -= dt
    if (this.nextBlink <= 0 && this.blinkT < 0) {
      this.blinkT = 0
      this.nextBlink = 2.2 + Math.random() * 3.2
      if (Math.random() < 0.18) this.nextBlink = 0.32
    }
    if (this.blinkT >= 0) {
      this.blinkT += dt
      const u = this.blinkT / 0.17
      idle.blink = u >= 1 ? 0 : Math.sin(u * Math.PI)
      if (u >= 1) this.blinkT = -1
    }
    // gaze: follow the pointer; with none, look at the viewer and now and then glance aside
    let tx = 0
    let ty = 0
    if (look) {
      tx = Math.max(-1, Math.min(1, look.x))
      ty = Math.max(-1, Math.min(1, look.y))
      this.glanceAt = this.clock + 2.5
    } else {
      if (this.clock > this.glanceAt) {
        this.glance = { x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.3) * 0.5, until: this.clock + 0.9 + Math.random() * 0.8 }
        this.glanceAt = this.clock + 3.5 + Math.random() * 4
      }
      if (this.clock < this.glance.until) {
        tx = this.glance.x
        ty = this.glance.y
      }
    }
    const k = 1 - Math.exp(-dt * 7)
    this.lookX += (tx - this.lookX) * k
    this.lookY += (ty - this.lookY) * k
  }

  /** Solves a pose onto the skeleton and the face. */
  private show(p: Pose) {
    if (p !== this.pose) copyPose(p, this.pose)
    const s = solve(this.rig, p, this.solved)
    for (const name of BONES) this.bones[name].quaternion.copy(s.q[name])
    this.bones.hips.position.copy(s.hipsP)
    this.bones.hips.scale.copy(s.hipsS)
    this.face.apply(p)
    if (this.cane) caneTurn(s, p.yaw, this.cane.quaternion)
    // the shadow stays under the body and thins as the figure leaves the ground
    const lift = Math.max(0, p.lift)
    this.shadow.position.x = s.hipsP.x * 0.8
    this.shadow.position.z = s.hipsP.z * 0.8
    const k = 1 / (1 + lift * 1.6)
    this.shadow.scale.setScalar(Math.max(this.rig.pelvisX * 2.3, this.rig.footLen * 1.5) * k)
    ;(this.shadow.material as THREE.MeshBasicMaterial).opacity = k
  }

  dispose() {
    this.body.geometry.dispose()
    this.cane?.children.forEach((c) => (c as THREE.Mesh).geometry.dispose())
    ;(this.body.material as THREE.Material).dispose()
    ;(this.outline.material as THREE.Material).dispose()
    this.shadow.geometry.dispose()
    ;(this.shadow.material as THREE.Material).dispose()
    this.face.dispose()
    this.skeleton.dispose()
  }
}

const _q = new THREE.Quaternion()
const _yaw = new THREE.Quaternion()
const UP = new THREE.Vector3(0, 1, 0)
/** Local turn that keeps a stick hanging from the left hand upright (it only follows the body's turn). */
export function caneTurn(s: Solved, yaw: number, out: THREE.Quaternion) {
  return out.copy(_q.copy(s.handQ.left).invert()).multiply(_yaw.setFromAxisAngle(UP, yaw))
}

/** The one call other code needs. */
export function buildFigure(sheet: Sheet): Figure {
  return new Figure(sheet)
}
