import * as THREE from 'three'
import { mulberry32 } from '@/lib/seeded'

export interface Flyer {
  curve: THREE.CatmullRomCurve3 // in normalized units: x,y ∈ [-1,1] of the half viewport, z ∈ world units
  phase: number
  speed: number // loops per second
  scale: number
  far: boolean
  variant: number
  flapSpeed: number
  flapPhase: number
  glideT: number
  glideLen: number
  amp: number
}

/** Seeded closed flight loops, biased to the sky/valley (right-centre) and away from the headline (left-top). */
export function makeFlyers(count: number, far: boolean, seed: number): Flyer[] {
  const r = mulberry32(seed)
  const flyers: Flyer[] = []
  for (let i = 0; i < count; i++) {
    const n = 6 + Math.floor(r() * 3)
    // centre/radius (normalized): keep near flyers right of the copy column (x > ~0.1 of the half width)
    const rx = far ? 0.25 + r() * 0.35 : 0.18 + r() * 0.22
    const ry = 0.12 + r() * 0.25
    const cx = far ? -0.2 + r() * 1.1 : 0.25 + rx + r() * (0.9 - rx)
    const cy = -0.2 + r() * 0.95
    const pts: THREE.Vector3[] = []
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2
      const jitter = 0.6 + r() * 0.8
      pts.push(new THREE.Vector3(cx + Math.cos(a) * rx * jitter, cy + Math.sin(a) * ry * jitter, far ? -1.6 - r() * 1.2 : -0.6 + r() * 1.2))
    }
    flyers.push({
      curve: new THREE.CatmullRomCurve3(pts, true, 'centripetal'),
      phase: r(),
      speed: (far ? 0.012 : 0.018) + r() * 0.012,
      scale: far ? 0.035 + r() * 0.015 : 0.065 + r() * 0.03, // × viewport height
      far,
      variant: r() < 0.5 ? 0 : 1,
      flapSpeed: 9 + r() * 4,
      flapPhase: r() * Math.PI * 2,
      glideT: r() * 3,
      glideLen: 1.5 + r() * 2.5,
      amp: 1,
    })
  }
  return flyers
}
