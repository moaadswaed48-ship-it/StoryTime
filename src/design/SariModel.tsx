import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { asset } from '@/lib/asset'

export type SariAction = 'idle' | 'run' | 'wave'
const URL = asset('models/sari.glb')

/** Extra bone rotations (Euler XYZ, radians) layered on the bind pose. Found by test renders of this rig. */
const IDLE: Record<string, [number, number, number]> = { LeftArm: [0, 0, -0.62], RightArm: [0, 0, 0.62], LeftForeArm: [0, 0, -0.15], RightForeArm: [0, 0, 0.15] }
const WAVE: Record<string, [number, number, number]> = { LeftArm: [0, 0, -0.62], LeftForeArm: [0, 0, -0.15], RightArm: [0, 0, -1.0], RightForeArm: [0, 0, -1.0] }
const LAYERED = ['LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'Spine01', 'Head', 'RightHand']
const _e = new THREE.Euler()
const _q = new THREE.Quaternion()

/**
 * Sari, the story's hero: a rigged 3D character (1.1 units tall, feet on y=0, facing +Z).
 *  - action "run": the baked run cycle (in place — move the parent group yourself)
 *  - action "idle": relaxed standing pose with breathing and a little head sway
 *  - action "wave": idle, with the right arm raised and waving
 * Actions cross-fade. `speed` scales the run cycle (1 ≈ a child's jog). Safe to mount several times.
 */
export function SariModel({ action = 'idle', speed = 1, ...props }: { action?: SariAction; speed?: number } & Omit<React.ComponentProps<'group'>, 'children'>) {
  const gltf = useGLTF(URL)
  const scene = useMemo(() => {
    const s = cloneSkinned(gltf.scene)
    s.traverse((o) => {
      const m = o as THREE.SkinnedMesh
      if (m.isMesh) {
        m.frustumCulled = false
        const mat = m.material as THREE.MeshStandardMaterial
        if (mat.map) mat.map.anisotropy = 4
        mat.envMapIntensity = 0.9
      }
    })
    return s
  }, [gltf.scene])
  const bones = useMemo(() => {
    const map: Record<string, THREE.Bone> = {}
    scene.traverse((o) => {
      if ((o as THREE.Bone).isBone) map[o.name] = o as THREE.Bone
    })
    return map
  }, [scene])
  // bind-pose rotations of the bones the standing layer touches (restored every frame, so nothing accumulates)
  const rest = useMemo(() => {
    const map: Record<string, THREE.Quaternion> = {}
    for (const name of LAYERED) if (bones[name]) map[name] = bones[name].quaternion.clone()
    return map
  }, [bones])
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene])
  const run = useMemo(() => {
    const clip = gltf.animations.find((a) => a.name === 'run') ?? gltf.animations[0]
    return mixer.clipAction(clip)
  }, [gltf.animations, mixer])
  const w = useRef({ run: 0, wave: 0, t: Math.random() * 10 })
  const actionRef = useRef(action)
  actionRef.current = action
  const speedRef = useRef(speed)
  speedRef.current = speed
  // started in an effect (not in useMemo) so it survives React's development effect replay
  useEffect(() => {
    run.reset().play()
    run.setEffectiveWeight(0)
    return () => void mixer.stopAllAction()
  }, [mixer, run])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const s = w.current
    s.t += dt
    const k = 1 - Math.exp(-9 * dt)
    s.run += ((actionRef.current === 'run' ? 1 : 0) - s.run) * k
    s.wave += ((actionRef.current === 'wave' ? 1 : 0) - s.wave) * k
    for (const name of LAYERED) bones[name]?.quaternion.copy(rest[name])
    run.setEffectiveWeight(s.run < 0.002 ? 0 : s.run)
    run.timeScale = 0.95 * speedRef.current
    mixer.update(dt)
    // procedural standing layer, faded out while running
    const stand = 1 - s.run
    if (stand > 0.001) {
      const breathe = Math.sin(s.t * 1.7)
      const sway = Math.sin(s.t * 0.9)
      const apply = (name: string, x: number, y: number, z: number) => {
        const b = bones[name]
        if (!b) return
        _q.setFromEuler(_e.set(x * stand, y * stand, z * stand))
        b.quaternion.multiply(_q)
      }
      for (const name of ['LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm']) {
        const a = IDLE[name]
        const v = WAVE[name]
        let z = a[2] + (v[2] - a[2]) * s.wave
        if (name === 'RightForeArm') z += Math.sin(s.t * 9) * 0.34 * s.wave
        if (name === 'LeftArm') z += breathe * 0.025
        if (name === 'RightArm') z -= breathe * 0.025 * (1 - s.wave)
        apply(name, 0, 0, z)
      }
      apply('Spine01', breathe * 0.018, sway * 0.03, 0)
      apply('Head', -0.02 + breathe * 0.012, sway * 0.09 + s.wave * 0.12, s.wave * -0.08)
      apply('RightHand', 0, 0, Math.sin(s.t * 9 + 0.6) * 0.25 * s.wave)
    }
  })

  return (
    <group {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}
useGLTF.preload(URL)
