/**
 * Proportions and the standard skeleton, worked out from a character sheet.
 *
 * Space: metres-ish (an adult is about 1.7 tall), y up, the figure faces +z, its left side is +x.
 * The bind pose is a T-pose with every bone unrotated, the convention game engines expect.
 */
import * as THREE from 'three'
import { BONES, BUILDS, type Bone, type Sheet, type Stage } from '../cast/sheet.ts'

export const PARENT: Record<Bone, Bone | null> = {
  hips: null,
  spine: 'hips',
  chest: 'spine',
  neck: 'chest',
  head: 'neck',
  leftShoulder: 'chest',
  leftUpperArm: 'leftShoulder',
  leftLowerArm: 'leftUpperArm',
  leftHand: 'leftLowerArm',
  rightShoulder: 'chest',
  rightUpperArm: 'rightShoulder',
  rightLowerArm: 'rightUpperArm',
  rightHand: 'rightLowerArm',
  leftUpperLeg: 'hips',
  leftLowerLeg: 'leftUpperLeg',
  leftFoot: 'leftLowerLeg',
  rightUpperLeg: 'hips',
  rightLowerLeg: 'rightUpperLeg',
  rightFoot: 'rightLowerLeg',
}

export const BONE_INDEX = Object.fromEntries(BONES.map((b, i) => [b, i])) as Record<Bone, number>

const BY_STAGE: Record<Stage, { headW: number; headD: number; neck: number; legs: number; chunk: number; eyeY: number }> = {
  toddler: { headW: 0.97, headD: 0.93, neck: 0.03, legs: 0.4, chunk: 1.18, eyeY: -0.12 },
  child: { headW: 0.94, headD: 0.91, neck: 0.06, legs: 0.455, chunk: 1.08, eyeY: -0.08 },
  teen: { headW: 0.9, headD: 0.89, neck: 0.1, legs: 0.5, chunk: 1, eyeY: -0.04 },
  adult: { headW: 0.87, headD: 0.88, neck: 0.13, legs: 0.52, chunk: 0.96, eyeY: -0.02 },
  elder: { headW: 0.88, headD: 0.88, neck: 0.11, legs: 0.5, chunk: 0.98, eyeY: -0.02 },
}

export type Rig = {
  stage: Stage
  /** Standing height. */
  H: number
  girth: number
  headH: number
  /** Head centre and half-sizes. */
  headC: THREE.Vector3
  head: THREE.Vector3
  /** Where the eyes sit on the face, in face units (−1 … 1 down-up). */
  eyeY: number
  chinY: number
  neckR: number
  shoulderY: number
  hipY: number
  kneeY: number
  ankleY: number
  /** Joint positions in the bind pose, figure space. */
  joint: Record<Bone, THREE.Vector3>
  /** Bone offsets from their parent (bind). */
  offset: Record<Bone, THREE.Vector3>
  /** Shoulder to wrist; upper and lower lengths. */
  arm: number
  armU: number
  armL: number
  /** Hip to ankle; upper and lower lengths. */
  leg: number
  legU: number
  legL: number
  armR: number
  wristR: number
  thighR: number
  ankleR: number
  /** Torso half-widths (x) at chest, waist, pelvis, and half-depth factor (z over x). */
  chestX: number
  waistX: number
  pelvisX: number
  depth: number
  torso: number
  handR: number
  footLen: number
  footW: number
  footH: number
  /** Outline thickness and general small-detail unit. */
  line: number
}

export function makeRig(sheet: Sheet): Rig {
  const b = { ...BUILDS[sheet.stage], ...sheet.build }
  const s = BY_STAGE[sheet.stage]
  const H = b.height * 1.7
  // a toy carries a slightly bigger head than the flat drawing: it keeps the face readable at hero size
  const headH = H / (b.heads * 0.92)
  const headW = headH * s.headW
  const head = new THREE.Vector3(headW / 2, headH / 2, (headH * s.headD) / 2)
  const headC = new THREE.Vector3(0, H - headH / 2, 0)
  const chinY = H - headH
  const neckBase = chinY - headH * s.neck
  const shoulderY = neckBase - headH * 0.1
  const hipY = shoulderY * s.legs
  const torso = shoulderY - hipY
  const girth = Math.min(1, Math.max(0, b.girth))

  const width = b.shoulders * headW
  const armR = width * 0.145 * s.chunk * (0.9 + 0.25 * girth)
  const shoulderX = width / 2 - armR * 0.9
  const chestX = shoulderX + armR * 0.15
  const waistX = chestX * (0.86 + 0.3 * girth)
  const pelvisX = chestX * (0.93 + 0.22 * girth)
  const depth = 0.66 + 0.2 * girth
  const thighR = pelvisX * 0.49
  const hipX = pelvisX * 0.5
  const ankleY = H * 0.042 + 0.012
  const leg = hipY - ankleY
  const kneeY = ankleY + leg * 0.49
  const arm = torso * 1.0
  const armU = arm * 0.52
  const armL = arm - armU
  const wristR = armR * 0.8
  const neckR = Math.min(headW * 0.24, chestX * 0.5)

  const j = {} as Record<Bone, THREE.Vector3>
  const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z)
  j.hips = v(0, hipY + torso * 0.08)
  j.spine = v(0, hipY + torso * 0.32)
  j.chest = v(0, hipY + torso * 0.6)
  j.neck = v(0, neckBase - headH * 0.02)
  j.head = v(0, chinY + headH * 0.1, -headH * 0.03)
  for (const [side, sx] of [['left', 1], ['right', -1]] as const) {
    j[`${side}Shoulder`] = v(sx * shoulderX * 0.35, shoulderY + armR * 0.2)
    j[`${side}UpperArm`] = v(sx * shoulderX, shoulderY)
    j[`${side}LowerArm`] = v(sx * (shoulderX + armU), shoulderY)
    j[`${side}Hand`] = v(sx * (shoulderX + arm), shoulderY)
    j[`${side}UpperLeg`] = v(sx * hipX, hipY)
    j[`${side}LowerLeg`] = v(sx * hipX, kneeY)
    j[`${side}Foot`] = v(sx * hipX, ankleY)
  }
  const offset = {} as Record<Bone, THREE.Vector3>
  for (const name of BONES) {
    const p = PARENT[name]
    offset[name] = p ? j[name].clone().sub(j[p]) : j[name].clone()
  }

  return {
    stage: sheet.stage,
    H,
    girth,
    headH,
    headC,
    head,
    eyeY: s.eyeY,
    chinY,
    neckR,
    shoulderY,
    hipY,
    kneeY,
    ankleY,
    joint: j,
    offset,
    arm,
    armU,
    armL,
    leg,
    legU: hipY - kneeY,
    legL: kneeY - ankleY,
    armR,
    wristR,
    thighR,
    ankleR: thighR * 0.72,
    chestX,
    waistX,
    pelvisX,
    depth,
    torso,
    handR: wristR * 1.5,
    footLen: H * 0.105 + headH * 0.2,
    footW: thighR * 1.05,
    footH: ankleY * 1.25,
    line: 0.0026 + H * 0.0016,
  }
}

/** Creates the bones (unrotated, at their bind offsets) and returns them in `BONES` order. */
export function makeBones(rig: Rig): { bones: THREE.Bone[]; byName: Record<Bone, THREE.Bone> } {
  const byName = {} as Record<Bone, THREE.Bone>
  const bones = BONES.map((name) => {
    const bone = new THREE.Bone()
    bone.name = name
    bone.position.copy(rig.offset[name])
    byName[name] = bone
    return bone
  })
  for (const name of BONES) {
    const p = PARENT[name]
    if (p) byName[p].add(byName[name])
  }
  return { bones, byName }
}
