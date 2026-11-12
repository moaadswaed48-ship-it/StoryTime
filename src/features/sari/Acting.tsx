import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { asset } from '@/lib/asset'
import { SIDE, wrapAngle, type Runtime } from './runtime'

const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)
const _e = new THREE.Euler()
const _q = new THREE.Quaternion()
const _v = new THREE.Vector3()

type Turn = [x: number, y: number, z: number]
/**
 * Joint turns on top of the bind pose (rad), written for his RIGHT arm; the left arm mirrors them (y and z flip).
 * Applied in the order z, x, y: z lowers or raises the arm in his own plane, x swings it forward or back,
 * y twists it about its length. Found by test renders of this rig.
 */
const HANG: Record<'Arm' | 'ForeArm' | 'Hand', Turn> = { Arm: [-0.1, -0.45, 0.6], ForeArm: [0.14, -0.55, 0.08], Hand: [0, 0, 0] }
const HELLO: Record<'Arm' | 'ForeArm' | 'Hand', Turn> = { Arm: [0.2, 0, -0.78], ForeArm: [0.1, 0, -1.45], Hand: [0, 0, 0] }
/** The arm that waves is the one on the open side of the stage, away from the words. */
const WAVER = SIDE > 0 ? 'Right' : 'Left'
const JOINTS = ['Arm', 'ForeArm', 'Hand'] as const
/** Bones <SariModel> itself puts back every frame: here they only receive a little extra. Every other bone is set from the bind pose. */
const THEIRS = new Set(['LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'Spine01', 'Head', 'RightHand'])

interface Channel {
  bone: THREE.Object3D
  /** Samples the run clip for this bone at a time (s). */
  at: THREE.Interpolant
  move: boolean
}

/** QA only (while the pose is being tuned): extra turns per bone, and whole-pose overrides. */
export const TUNE: { hang?: typeof HANG; hello?: typeof HELLO; freeze?: number; phase?: number } = {}

/**
 * Sari's acting, layered on <SariModel> (which draws him and breathes). Runs after it in the frame and adds:
 *  - a relaxed stand: arms hanging with the palms toward the legs, one a little further out, a slow sway of his
 *    weight above planted feet, shoulders that rise with the breath;
 *  - the hello: elbow bent, hand up by his curls, forearm and hand swinging, body and head leaning into it;
 *  - the run: the baked cycle from the same file, blended over the stand;
 *  - the look: his head follows the pointer and keeps looking at you over his shoulder when he is turned.
 * Everything is set from the bind pose each frame (nothing accumulates), so it gives the same result whether or
 * not SariModel's own mixer is alive (in development React's effect replay can stop it; see REQUESTS in the report).
 */
export function Acting({ rt, turntable }: { rt: Runtime; turntable: React.RefObject<THREE.Group | null> }) {
  const gltf = useGLTF(asset('models/sari.glb')) // already in memory: SariModel loaded it
  const clip = useMemo(() => gltf.animations.find((a) => a.name === 'run') ?? gltf.animations[0], [gltf.animations])
  const rig = useRef<{
    bones: Record<string, THREE.Object3D>
    /** Bind pose, read from the untouched file (SariModel animates its own copy). */
    bindQ: Record<string, THREE.Quaternion>
    hipsP: THREE.Vector3
    channels: Channel[]
    /** Bones nobody else resets: put back to the bind pose at the start of every frame. */
    mine: string[]
  } | null>(null)
  const s = useRef({ t: 0, wave: 0, waveT: 0, run: 0, runT: 0, lookYaw: 0, lookPitch: 0, was: 'idle' })

  useEffect(() => {
    const root = turntable.current
    if (!root || !clip) return
    const bones: Record<string, THREE.Object3D> = {}
    const bindQ: Record<string, THREE.Quaternion> = {}
    const missing: string[] = []
    const want = (name: string) => {
      if (bones[name]) return bones[name]
      const live = root.getObjectByName(name)
      const bind = gltf.scene.getObjectByName(name)
      if (!live || !bind) return void (missing.includes(name) || missing.push(name))
      bones[name] = live
      bindQ[name] = bind.quaternion.clone()
      return live
    }
    for (const side of ['Left', 'Right']) for (const j of [...JOINTS, 'Shoulder']) want(side + j)
    for (const name of ['Hips', 'Spine', 'Spine01', 'Spine02', 'neck', 'Head']) want(name)
    const channels = clip.tracks.flatMap((track): Channel[] => {
      const { nodeName, propertyName } = THREE.PropertyBinding.parseTrackName(track.name)
      // rotations for every bone; movement only for the hips (the bob of the run; its travel was removed at build time)
      const move = propertyName === 'position' && nodeName === 'Hips'
      if (!(propertyName === 'quaternion' || move)) return []
      const bone = want(nodeName)
      if (!bone) return []
      // KeyframeTrack.createInterpolant() is public three.js API (it honours the track's own interpolation) but is missing from its typings
      return [{ bone, move, at: (track as unknown as { createInterpolant(): THREE.Interpolant }).createInterpolant() }]
    })
    // a renamed bone must not fail silently: without these he neither runs nor looks at anyone
    if (import.meta.env.DEV && (missing.length || !channels.length)) console.warn('[sari] rig bones not found, acting is partly off:', missing.join(', ') || 'no run tracks')
    const hips = gltf.scene.getObjectByName('Hips')
    rig.current = { bones, bindQ, channels, hipsP: hips ? hips.position.clone() : new THREE.Vector3(), mine: Object.keys(bones).filter((n) => !THEIRS.has(n)) }
    return () => {
      // leave the rig as it was found
      const r = rig.current
      if (r) for (const n of r.mine) r.bones[n].quaternion.copy(r.bindQ[n])
      if (r?.bones.Hips) r.bones.Hips.position.copy(r.hipsP)
      rig.current = null
    }
  }, [clip, gltf.scene, turntable])

  useFrame((_, delta) => {
    const r = rig.current
    if (!r) return
    const dt = Math.min(delta, 1 / 20)
    const v = s.current
    const { bones, bindQ } = r
    /** Sets a bone from the bind pose plus a turn (order z, x, y). */
    const pose = (name: string, x: number, y: number, z: number) => {
      const b = bones[name]
      if (b) b.quaternion.copy(bindQ[name]).multiply(_q.setFromEuler(_e.set(x, y, z, 'ZXY')))
    }
    /** Adds a turn to a bone that was already set this frame. */
    const add = (name: string, x: number, y: number, z: number) => bones[name]?.quaternion.multiply(_q.setFromEuler(_e.set(x, y, z, 'XYZ')))

    v.t += dt
    if (TUNE.freeze !== undefined) v.t = TUNE.freeze
    const waving = rt.action === 'wave'
    if (waving && v.was !== 'wave') v.waveT = 0 // every hello opens the same way
    v.was = rt.action
    v.waveT += dt
    if (TUNE.phase !== undefined) v.waveT = TUNE.phase
    v.wave += ((waving ? 1 : 0) - v.wave) * damp(waving ? 10 : 7, dt)
    v.run += ((rt.action === 'run' ? 1 : 0) - v.run) * damp(9, dt)
    if (v.run < 0.002 && rt.action !== 'run') v.run = 0
    const w = v.wave
    const stand = 1 - v.run

    for (const n of r.mine) bones[n].quaternion.copy(bindQ[n])
    bones.Hips?.position.copy(r.hipsP)

    // the stand: breath and a slow shift of weight from one leg to the other
    const breath = Math.sin(v.t * 1.7)
    const shift = Math.sin(v.t * 0.55)
    const hang = TUNE.hang ?? HANG
    const hello = TUNE.hello ?? HELLO
    // the hello: the forearm swings from the elbow, the hand follows a beat behind
    const beat = Math.sin(v.waveT * 8.6 - 0.6)
    const lag = Math.sin(v.waveT * 8.6 - 1.5)
    for (const side of ['Right', 'Left'] as const) {
      const m = side === 'Right' ? 1 : -1
      const k = side === WAVER ? w : 0
      for (const j of JOINTS) {
        const a = hang[j]
        const b = hello[j]
        let x = a[0] + (b[0] - a[0]) * k
        let y = a[1] + (b[1] - a[1]) * k
        let z = a[2] + (b[2] - a[2]) * k
        if (j === 'Arm') {
          // the free arm hangs a little further out, swings with the breath and lifts slightly as he waves
          z += side === WAVER ? breath * 0.02 * (1 - k) + Math.sin(v.waveT * 8.6 - 0.2) * 0.05 * k : -0.07 + breath * 0.02 - w * 0.1
          x += shift * 0.03 * m
        } else if (j === 'ForeArm') z += beat * 0.3 * k
        else z += lag * 0.34 * k
        pose(side + j, x, y * m, z * m)
      }
      // shoulders rise with the breath; the waving one comes up with the arm
      add(side + 'Shoulder', 0, 0, (-breath * 0.014 - (side === WAVER ? w * 0.16 : 0)) * m)
    }
    const lean = SIDE > 0 ? 1 : -1
    // his weight drifts from one leg to the other above planted feet: the body sways from the waist, the shoulders
    // answer the other way and the head stays level; a hello leans the whole of him into the raised arm
    add('Spine02', 0, w * 0.06 * lean * stand, (shift * 0.024 + w * 0.03 * lean) * stand)
    add('Spine01', breath * 0.014 * stand, 0, w * 0.05 * lean * stand)
    add('Spine', 0, 0, -shift * 0.013 * stand)
    add('Head', 0, 0, (-shift * 0.009 + w * -0.1 * lean + Math.sin(v.waveT * 8.6 - 2.2) * 0.018 * w) * stand)

    // the run: the baked cycle blended over whatever he was doing
    if (v.run > 0) {
      v.runT = (v.runT + dt * 0.95) % clip.duration
      for (const c of r.channels) {
        const run = c.at.evaluate(v.runT)
        if (c.move) c.bone.position.lerp(_v.fromArray(run), v.run)
        else c.bone.quaternion.slerp(_q.fromArray(run), v.run)
      }
    }

    // the look: full when he faces us, none past a three-quarter back view
    const facing = wrapAngle(rt.shown)
    const can = THREE.MathUtils.clamp(1.25 - Math.abs(facing) / 1.3, 0, 1) * (1 - rt.run * 0.75)
    const px = rt.reduced ? 0 : rt.px
    const py = rt.reduced ? 0 : rt.py
    const yaw = THREE.MathUtils.clamp(px * 0.5 - facing * 0.62, -0.56, 0.56) * can
    const pitch = THREE.MathUtils.clamp(-py * 0.2, -0.16, 0.2) * can
    v.lookYaw += (yaw - v.lookYaw) * damp(5, dt)
    v.lookPitch += (pitch - v.lookPitch) * damp(5, dt)
    // the neck takes a third of the turn, so the head does not swivel like a lamp
    add('Spine02', 0, v.lookYaw * 0.18, 0)
    bones.Head?.quaternion.multiply(_q.setFromEuler(_e.set(v.lookPitch, v.lookYaw * 0.82, 0, 'YXZ')))
  })
  return null
}
