/**
 * Pose → bones. The trunk is turned joint by joint; arms and legs are solved with two-bone IK so hands reach their
 * targets and feet stay planted on every body, whatever its proportions. Works on plain numbers (no scene graph),
 * so the same code drives the live figure, the baked clips and the button pictograms.
 */
import * as THREE from 'three'
import { BONES, type Bone } from '../cast/sheet.ts'
import type { Pose } from './pose.ts'
import type { Rig } from './rig.ts'

export type Solved = {
  /** Local rotation of every bone. */
  q: Record<Bone, THREE.Quaternion>
  /** Hips position (figure space) and scale (squash and stretch). */
  hipsP: THREE.Vector3
  hipsS: THREE.Vector3
  /** Joint positions in figure space, plus fingertips, toes and the head centre (for pictograms and the shadow). */
  at: Record<Bone | 'leftTip' | 'rightTip' | 'leftToe' | 'rightToe' | 'crown', THREE.Vector3>
  /** Hand orientations in figure space (for things held loosely). */
  handQ: { left: THREE.Quaternion; right: THREE.Quaternion }
}

export function newSolved(): Solved {
  const q = {} as Solved['q']
  const at = {} as Solved['at']
  for (const b of BONES) {
    q[b] = new THREE.Quaternion()
    at[b] = new THREE.Vector3()
  }
  for (const k of ['leftTip', 'rightTip', 'leftToe', 'rightToe', 'crown'] as const) at[k] = new THREE.Vector3()
  return { q, hipsP: new THREE.Vector3(), hipsS: new THREE.Vector3(1, 1, 1), at, handQ: { left: new THREE.Quaternion(), right: new THREE.Quaternion() } }
}

const V = () => new THREE.Vector3()
const Q = () => new THREE.Quaternion()
const _e = new THREE.Euler()
const _m = new THREE.Matrix4()
const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const Z = new THREE.Vector3(0, 0, 1)

// scratch
const rootQ = Q()
const hipsQ = Q()
const hipsQi = Q()
const lq = { spine: Q(), chest: Q(), neck: Q(), head: Q() }
const lp = { spine: V(), chest: V(), neck: V(), head: V() }
const t0 = V()
const t1 = V()
const t2 = V()
const t3 = V()
const headCv = V()
const tgt = V()
const pole = V()
const J = V()
const E = V()
const Wp = V()
const u = V()
const f = V()
const h = V()
const bx = V()
const by = V()
const bz = V()
const qa = Q()
const qb = Q()
const qc = Q()
const qd = Q()
const sq = Q()

const euler = (out: THREE.Quaternion, x: number, y: number, z: number) => out.setFromEuler(_e.set(x, y, z, 'YXZ'))
const basis = (out: THREE.Quaternion, x: THREE.Vector3, y: THREE.Vector3) => {
  bz.crossVectors(x, y).normalize()
  by.crossVectors(bz, x).normalize()
  return out.setFromRotationMatrix(_m.makeBasis(x, by, bz))
}

/**
 * Two-bone IK. From joint `j` toward `target` with lengths l1, l2; the middle joint bends toward `poleDir`.
 * Writes the middle joint to E, the (reachable) end to Wp, bone directions to u and f, the hinge axis to h.
 */
function twoBone(j: THREE.Vector3, target: THREE.Vector3, l1: number, l2: number, poleDir: THREE.Vector3, soft = false) {
  t0.subVectors(target, j)
  let d = t0.length()
  if (d < 1e-6) {
    t0.set(0, -1, 0)
    d = 1e-6
  }
  t0.divideScalar(d)
  const full = l1 + l2
  let reach = Math.min(Math.max(d, Math.abs(l1 - l2) + 1e-4), full * 0.998)
  // arms straighten softly: close to full stretch the reach eases off, so an elbow never snaps straight
  if (soft && d > full * 0.92) reach = full * (0.92 + 0.076 * (1 - Math.exp(-(d / full - 0.92) / 0.076)))
  const cos = Math.min(1, Math.max(-1, (l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach)))
  const sin = Math.sqrt(1 - cos * cos)
  t1.copy(poleDir).addScaledVector(t0, -poleDir.dot(t0))
  if (t1.lengthSq() < 1e-8) t1.set(t0.y, t0.z, t0.x).addScaledVector(t0, -t0.dot(t1))
  t1.normalize()
  E.copy(j).addScaledVector(t0, l1 * cos).addScaledVector(t1, l1 * sin)
  Wp.copy(j).addScaledVector(t0, reach)
  u.subVectors(E, j).normalize()
  f.subVectors(Wp, E).normalize()
  h.crossVectors(t1, t0).normalize()
}

export function solve(rig: Rig, p: Pose, out: Solved): Solved {
  const { offset: o, joint } = rig
  const stretch = 1 + p.squash
  const wide = 1 / Math.sqrt(stretch)
  out.hipsS.set(wide, stretch, wide)

  rootQ.setFromAxisAngle(Y, p.yaw)
  const lift = p.lift * rig.leg
  // the stand keeps a trace of bend in the knees, so a small rise of the hips never lifts the feet
  out.hipsP.set(joint.hips.x + p.hipX * rig.leg, joint.hips.y + (p.hipY - 0.016) * rig.leg, joint.hips.z + p.hipZ * rig.leg).applyQuaternion(rootQ)
  // squash and stretch act from the ground up: the hips sink or rise with the scaled legs, so the feet stay put
  out.hipsP.y = rig.ankleY + (out.hipsP.y - rig.ankleY) * stretch
  // standing on tiptoe lifts the body by as much as the lower heel rises, so the knees stay straight
  const rise = (fp: number) => rig.footLen * 0.5 * Math.sin(fp) - rig.ankleY * (1 - Math.cos(fp))
  out.hipsP.y += lift + Math.max(0, Math.min(rise(p.fpL) + p.fyL * rig.leg, rise(p.fpR) + p.fyR * rig.leg)) * 0.92
  hipsQ.copy(rootQ).multiply(euler(qa, p.hipRx, p.hipRy, p.hipRz))
  hipsQi.copy(hipsQ).invert()
  out.q.hips.copy(hipsQ)

  /** Hips-local point → figure space. */
  const place = (local: THREE.Vector3, to: THREE.Vector3) => to.copy(local).multiply(out.hipsS).applyQuaternion(hipsQ).add(out.hipsP)

  // trunk
  euler(out.q.spine, p.spineRx, p.spineRy, p.spineRz)
  euler(out.q.chest, p.chestRx, p.chestRy, p.chestRz)
  euler(out.q.neck, p.neckRx, p.neckRy, p.neckRz)
  euler(out.q.head, p.headRx, p.headRy, p.headRz)
  lp.spine.copy(o.spine)
  lq.spine.copy(out.q.spine)
  lp.chest.copy(o.chest).applyQuaternion(lq.spine).add(lp.spine)
  lq.chest.copy(lq.spine).multiply(out.q.chest)
  lp.neck.copy(o.neck).applyQuaternion(lq.chest).add(lp.chest)
  lq.neck.copy(lq.chest).multiply(out.q.neck)
  lp.head.copy(o.head).applyQuaternion(lq.neck).add(lp.neck)
  lq.head.copy(lq.neck).multiply(out.q.head)
  place(t2.set(0, 0, 0), out.at.hips)
  place(lp.spine, out.at.spine)
  place(lp.chest, out.at.chest)
  place(lp.neck, out.at.neck)
  place(lp.head, out.at.head)
  // head centre (hips-local) and crown
  const headC = headCv.copy(rig.headC).sub(joint.head).applyQuaternion(lq.head).add(lp.head)
  place(t2.set(0, rig.headH / 2, 0).applyQuaternion(lq.head).add(headC), out.at.crown)

  for (const side of ['left', 'right'] as const) {
    const s = side === 'left' ? 1 : -1
    const c = side === 'left' ? 'L' : 'R'
    const shoulder = `${side}Shoulder` as const
    const upper = `${side}UpperArm` as const
    const lower = `${side}LowerArm` as const
    const hand = `${side}Hand` as const

    // ── arm ──
    const sj = t2.copy(o[shoulder]).add(o[upper]) // chest → arm joint (bind)
    // target relative to the shoulder
    tgt.set(sj.x + s * p[`ax${c}`] * rig.arm, sj.y + p[`ay${c}`] * rig.arm, sj.z + p[`az${c}`] * rig.arm).applyQuaternion(lq.chest).add(lp.chest)
    const am = p[`am${c}`]
    if (am > 0) {
      t0.set(s * (p[`amx${c}`] * rig.arm + rig.handR * 0.5), sj.y + p[`amy${c}`] * rig.arm, sj.z + p[`amz${c}`] * rig.arm).applyQuaternion(lq.chest).add(lp.chest)
      tgt.lerp(t0, am)
    }
    const ah = p[`ah${c}`]
    if (ah > 0) {
      t0.set(s * p[`ahx${c}`], p[`ahy${c}`], p[`ahz${c}`]).multiplyScalar(rig.headH).applyQuaternion(lq.head).add(headC)
      tgt.lerp(t0, ah)
    }
    // the shoulder rises with a raised arm
    J.copy(sj).applyQuaternion(lq.chest).add(lp.chest)
    t0.subVectors(tgt, J).applyQuaternion(qa.copy(lq.chest).invert()).normalize()
    const up = Math.min(1, Math.max(0, (t0.y + 0.25) / 1.1))
    const raise = p[`sh${c}`] + 0.32 * up * up * (3 - 2 * up)
    out.q[shoulder].setFromAxisAngle(Z, s * raise)
    sq.copy(lq.chest).multiply(out.q[shoulder])
    t0.copy(o[shoulder]).applyQuaternion(lq.chest).add(lp.chest)
    place(t0, out.at[shoulder])
    J.copy(o[upper]).applyQuaternion(sq).add(t0)
    pole.set(s * p[`ex${c}`], p[`ey${c}`], p[`ez${c}`]).applyQuaternion(lq.chest)
    twoBone(J, tgt, rig.armU, rig.armL, pole, true)
    // upper arm: local x runs along the arm (left) or against it (right); the elbow hinges about local y
    basis(qa, bx.copy(u).multiplyScalar(s), by.copy(h).multiplyScalar(-s))
    basis(qb, bx.copy(f).multiplyScalar(s), by.copy(h).multiplyScalar(-s))
    qb.multiply(qc.setFromAxisAngle(X, p[`tw${c}`]))
    out.q[upper].copy(qd.copy(sq).invert()).multiply(qa)
    out.q[lower].copy(qd.copy(qa).invert()).multiply(qb)
    out.q[hand].setFromAxisAngle(Z, -s * p[`wr${c}`]).multiply(qc.setFromAxisAngle(Y, -s * p[`ws${c}`]))
    place(J, out.at[upper])
    place(E, out.at[lower])
    place(Wp, out.at[hand])
    qd.copy(qb).multiply(out.q[hand])
    out.handQ[side].copy(hipsQ).multiply(qd)
    place(t0.set(s * rig.handR * 2.3, 0, 0).applyQuaternion(qd).add(Wp), out.at[`${side}Tip`])

    // ── leg ──
    const thigh = `${side}UpperLeg` as const
    const shin = `${side}LowerLeg` as const
    const foot = `${side}Foot` as const
    const fp = p[`fp${c}`]
    const footYaw = s * p[`fyaw${c}`]
    // ankle target in figure space: where the foot stands, plus its offset, plus the heel raise about the ball
    const ball = t2.set(0, -rig.ankleY, rig.footLen * 0.5)
    t0.copy(ball).applyAxisAngle(X, fp)
    t1.subVectors(ball, t0).applyAxisAngle(Y, footYaw)
    tgt.set(joint[foot].x + s * p[`fx${c}`] * rig.leg, joint[foot].y + p[`fy${c}`] * rig.leg, joint[foot].z + p[`fz${c}`] * rig.leg).add(t1).applyQuaternion(rootQ)
    tgt.y += lift
    // into hips-local space
    tgt.sub(out.hipsP).applyQuaternion(hipsQi).divide(out.hipsS)
    // foot orientation: flat to the ground (figure space), turned out, heel raised
    qa.copy(rootQ).multiply(qc.setFromAxisAngle(Y, footYaw)).multiply(qd.setFromAxisAngle(X, fp))
    qa.premultiply(hipsQi) // hips-local
    pole.set(s * p[`kx${c}`], 0.15, 1).applyQuaternion(qc.copy(rootQ).multiply(qd.setFromAxisAngle(Y, footYaw)).premultiply(hipsQi))
    J.copy(o[thigh])
    twoBone(J, tgt, rig.legU, rig.legL, pole)
    basis(qb, bx.copy(h), by.copy(u).negate())
    basis(qc, bx.copy(h), by.copy(f).negate())
    out.q[thigh].copy(qb)
    out.q[shin].copy(qd.copy(qb).invert()).multiply(qc)
    out.q[foot].copy(qd.copy(qc).invert()).multiply(qa)
    place(J, out.at[thigh])
    place(E, out.at[shin])
    place(Wp, out.at[foot])
    place(t0.set(0, -rig.ankleY * 0.6, rig.footLen * 0.7).applyQuaternion(qa).add(Wp), out.at[`${side}Toe`])
  }
  return out
}
