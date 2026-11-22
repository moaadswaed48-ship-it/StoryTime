/** The head's surface as a function, shared by the skull, the hair shells and the face so they always fit. */
import * as THREE from 'three'
import type { Rig } from './rig.ts'

export type HeadSurface = {
  /** Point at a latitude and longitude (0 = face, +90° = the figure's left), pushed out by `add`. */
  onHead: (lat: number, lon: number, add: number, out: THREE.Vector3) => THREE.Vector3
  /** Point on the face from flat face units (x −1 … 1 across, y −1 … 1 chin to crown), pushed out by `add`. */
  onFace: (fx: number, fy: number, add: number, out: THREE.Vector3) => THREE.Vector3
  /** Surface normal at a point on (or near) the head. */
  normalAt: (p: THREE.Vector3, out: THREE.Vector3) => THREE.Vector3
}

export function headSurface(rig: Rig): HeadSurface {
  const C = rig.headC
  const hr = rig.head
  const cheek = rig.stage === 'toddler' ? 0.05 : rig.stage === 'child' ? 0.035 : 0.012
  const radius = (dx: number, dy: number, dz: number) => {
    const base = 1 / Math.sqrt((dx / hr.x) ** 2 + (dy / hr.y) ** 2 + (dz / hr.z) ** 2)
    const low = Math.exp(-(((dy + 0.42) / 0.3) ** 2))
    return base * (1 + cheek * low * (0.6 + 0.4 * Math.abs(dx)))
  }
  const along = (dx: number, dy: number, dz: number, add: number, out: THREE.Vector3) => {
    const r = radius(dx, dy, dz) + add
    return out.set(C.x + dx * r, C.y + dy * r, C.z + dz * r)
  }
  return {
    onHead: (lat, lon, add, out) => along(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon), add, out),
    onFace: (fx, fy, add, out) => {
      const x = fx * hr.x
      const y = fy * hr.y
      const z = hr.z * Math.sqrt(Math.max(0.04, 1 - fx * fx - fy * fy))
      const l = Math.hypot(x, y, z)
      return along(x / l, y / l, z / l, add, out)
    },
    normalAt: (p, out) => out.set((p.x - C.x) / (hr.x * hr.x), (p.y - C.y) / (hr.y * hr.y), (p.z - C.z) / (hr.z * hr.z)).normalize(),
  }
}
