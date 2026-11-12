import * as THREE from 'three'
import type { ReactNode } from 'react'
import { LazyCanvas } from '@/design/LazyCanvas'
import { FOV, Scene } from './Scene'
import type { Runtime } from './runtime'

/** Colours stay as painted (the hoodie's mustard, the jeans' teal): highlights roll off softly instead of clipping. */
const GL = { antialias: true, powerPreference: 'high-performance' as const, alpha: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 0.99 }
/** Up to 2 device pixels per CSS pixel, on phones too: his outline sits beside razor-sharp type, and the scene is nine draw calls. */
const DPR: [number, number] = [1, 2]
const CAMERA = { fov: FOV, near: 0.1, far: 40, position: [0, 0.95, 5] as [number, number, number] }

/**
 * Everything of the Sari stage that needs three.js, in its own file so the stage can load it on demand:
 * the landing page's first paint must not wait for a 3D engine that lives far below the fold.
 */
export default function Canvas3D({ rt, onReady, frameloop, fallback }: { rt: Runtime; onReady: () => void; frameloop: 'never' | 'demand' | 'always'; fallback: ReactNode }) {
  return (
    <LazyCanvas camera={CAMERA} gl={GL} dpr={DPR} frameloop={frameloop} fallback={fallback}>
      <Scene rt={rt} onReady={onReady} />
    </LazyCanvas>
  )
}
