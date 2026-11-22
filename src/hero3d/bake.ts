/**
 * Bakes the gestures into ordinary animation clips for one figure: a rotation track per bone, the hips' position
 * and scale, and the face (morph weights and the eyes' glance). Rotations are the same for every character; only
 * the hips' travel is scaled to the body. A game engine plays these as they are.
 */
import * as THREE from 'three'
import { BONES, GESTURES, type Gesture } from '../cast/sheet.ts'
import { caneTurn, type Figure } from './figure.ts'
import { GESTURE_DEFS, IDLE_LOOP, gesturePose, idlePose } from './gestures.ts'
import { REST, copyPose } from './pose.ts'
import { newSolved, solve } from './solver.ts'

export const CLIP_FPS = 30

export function bakeClip(figure: Figure, gesture: Gesture, fps = CLIP_FPS): THREE.AnimationClip {
  const duration = gesture === 'idle' ? IDLE_LOOP : GESTURE_DEFS[gesture].duration
  const frames = Math.round(duration * fps)
  const times = new Float32Array(frames + 1)
  const rot = BONES.map(() => new Float32Array((frames + 1) * 4))
  const pos = new Float32Array((frames + 1) * 3)
  const scl = new Float32Array((frames + 1) * 3)
  const faceKeys = ['lids', 'lashes', 'brows', 'mouth', 'irisLeft', 'irisRight'] as const
  const face = faceKeys.map(() => [] as number[])
  const pose = copyPose(REST)
  const solved = newSolved()
  const cane = figure.cane ? new Float32Array((frames + 1) * 4) : null
  const cq = new THREE.Quaternion()
  for (let f = 0; f <= frames; f++) {
    const t = (f / frames) * duration
    times[f] = t
    if (gesture === 'idle') idlePose(t, pose)
    else gesturePose(gesture, t, pose)
    solve(figure.rig, pose, solved)
    BONES.forEach((b, i) => solved.q[b].toArray(rot[i], f * 4))
    solved.hipsP.toArray(pos, f * 3)
    solved.hipsS.toArray(scl, f * 3)
    if (cane) caneTurn(solved, pose.yaw, cq).toArray(cane, f * 4)
    const v = figure.face.sample(pose)
    faceKeys.forEach((k, i) => face[i].push(...v[k]))
  }
  // keep neighbouring quaternions on the same side, so players interpolate the short way
  for (const r of cane ? [...rot, cane] : rot) {
    for (let f = 1; f <= frames; f++) {
      const a = (f - 1) * 4
      const b = f * 4
      if (r[a] * r[b] + r[a + 1] * r[b + 1] + r[a + 2] * r[b + 2] + r[a + 3] * r[b + 3] < 0) for (let k = 0; k < 4; k++) r[b + k] = -r[b + k]
    }
  }
  const tracks: THREE.KeyframeTrack[] = BONES.map((b, i) => new THREE.QuaternionKeyframeTrack(`${b}.quaternion`, times, rot[i]))
  tracks.push(new THREE.VectorKeyframeTrack('hips.position', times, pos))
  tracks.push(new THREE.VectorKeyframeTrack('hips.scale', times, scl))
  if (cane) tracks.push(new THREE.QuaternionKeyframeTrack('cane.quaternion', times, cane))
  faceKeys.forEach((k, i) => {
    if (k === 'irisLeft' || k === 'irisRight') tracks.push(new THREE.VectorKeyframeTrack(`${k}.position`, times, face[i]))
    else tracks.push(new THREE.NumberKeyframeTrack(`${k}.morphTargetInfluences`, times, face[i]))
  })
  return new THREE.AnimationClip(gesture, duration, tracks)
}

/** Every gesture in the contract, idle included, as clips named after the gesture. */
export function bakeClips(figure: Figure, fps = CLIP_FPS): THREE.AnimationClip[] {
  return GESTURES.map((g) => bakeClip(figure, g, fps))
}
