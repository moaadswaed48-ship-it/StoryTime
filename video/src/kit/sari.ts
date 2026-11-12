import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'

/**
 * Sari, the story's hero, as the site uses him (src/design/SariModel.tsx): a rigged model 1.1 units tall,
 * feet on y = 0, facing +Z, with one baked clip ("run", in place). Standing and waving are layered on the
 * bind pose with the same bone offsets the site found. Here the pose is a pure function of time.
 */
const IDLE: Record<string, number> = { LeftArm: -0.62, RightArm: 0.62, LeftForeArm: -0.15, RightForeArm: 0.15 }
const WAVE: Record<string, number> = { LeftArm: -0.62, LeftForeArm: -0.15, RightArm: -1.0, RightForeArm: -1.0 }
const LAYERED = ['LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'Spine01', 'Head', 'RightHand']

let cached: Promise<{ scene: THREE.Object3D; animations: THREE.AnimationClip[] }> | null = null
function load() {
  if (!cached) {
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    cached = loader.loadAsync('/site/models/sari.glb').then((g) => ({ scene: g.scene, animations: g.animations }))
  }
  return cached
}

export interface SariPose {
  /** 0 = standing, 1 = running. */
  run: number
  /** 0…1 raised, waving hand. */
  wave?: number
  /** Seconds of run cycle elapsed (drives the stride). */
  runTime?: number
  /** Clock for breathing and the wave. */
  t: number
  /** Extra head turn (radians, + = toward his left). */
  look?: number
  /** Extra head tilt up (radians). */
  lookUp?: number
}

export class Sari {
  group = new THREE.Group()
  private bones: Record<string, THREE.Bone> = {}
  private rest: Record<string, THREE.Quaternion> = {}
  private mixer!: THREE.AnimationMixer
  private action!: THREE.AnimationAction
  private e = new THREE.Euler()
  private q = new THREE.Quaternion()
  runDuration = 1

  static async create(envIntensity = 1): Promise<Sari> {
    const src = await load()
    const s = new Sari()
    const scene = cloneSkinned(src.scene)
    scene.traverse((o) => {
      const m = o as THREE.SkinnedMesh
      if (m.isMesh) {
        m.frustumCulled = false
        const mat = (m.material as THREE.MeshStandardMaterial).clone()
        if (mat.map) mat.map.anisotropy = 8
        mat.envMapIntensity = envIntensity
        mat.roughness = 1
        mat.metalness = 0
        m.material = mat
      }
      if ((o as THREE.Bone).isBone) s.bones[o.name] = o as THREE.Bone
    })
    for (const name of LAYERED) if (s.bones[name]) s.rest[name] = s.bones[name].quaternion.clone()
    s.mixer = new THREE.AnimationMixer(scene)
    const clip = src.animations.find((a) => a.name === 'run') ?? src.animations[0]
    s.runDuration = clip.duration
    s.action = s.mixer.clipAction(clip)
    s.action.play()
    s.group.add(scene)
    return s
  }

  pose(p: SariPose) {
    const run = Math.min(1, Math.max(0, p.run))
    const wave = p.wave ?? 0
    for (const name of LAYERED) this.bones[name]?.quaternion.copy(this.rest[name])
    this.action.setEffectiveWeight(run < 0.002 ? 0 : run)
    this.mixer.setTime((((p.runTime ?? p.t) % this.runDuration) + this.runDuration) % this.runDuration)
    const stand = 1 - run
    const apply = (name: string, x: number, y: number, z: number, w = stand) => {
      const b = this.bones[name]
      if (!b || w <= 0.001) return
      this.q.setFromEuler(this.e.set(x * w, y * w, z * w))
      b.quaternion.multiply(this.q)
    }
    if (stand > 0.001) {
      const breathe = Math.sin(p.t * 1.7)
      const sway = Math.sin(p.t * 0.9)
      for (const name of ['LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm']) {
        let z = IDLE[name] + (WAVE[name] - IDLE[name]) * wave
        if (name === 'RightForeArm') z += Math.sin(p.t * 9) * 0.34 * wave
        if (name === 'LeftArm') z += breathe * 0.025
        if (name === 'RightArm') z -= breathe * 0.025 * (1 - wave)
        apply(name, 0, 0, z)
      }
      apply('Spine01', breathe * 0.018, sway * 0.03, 0)
      apply('RightHand', 0, 0, Math.sin(p.t * 9 + 0.6) * 0.25 * wave)
      apply('Head', -0.02 + breathe * 0.012, sway * 0.09 + wave * 0.12, wave * -0.08)
    }
    if (p.look || p.lookUp) apply('Head', -(p.lookUp ?? 0), p.look ?? 0, 0, 1)
  }
}

/** Lights that sit Sari in the film's low autumn sun: warm key, cool-ish sky fill, strong warm rim. */
export function sariLights(): THREE.Group {
  const g = new THREE.Group()
  const hemi = new THREE.HemisphereLight(0xffeedd, 0x8a5a36, 2.1)
  const key = new THREE.DirectionalLight(0xffdcb0, 3.3)
  key.position.set(-2.2, 3.2, 2.6)
  const rim = new THREE.DirectionalLight(0xffa860, 3.0)
  rim.position.set(2.4, 2.2, -3)
  const fill = new THREE.DirectionalLight(0xffe2c8, 1.1)
  fill.position.set(2.5, 1.0, 3)
  g.add(hemi, key, rim, fill)
  return g
}
