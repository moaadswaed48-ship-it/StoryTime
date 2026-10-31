import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { View, PerformanceMonitor, Preload } from '@react-three/drei'
import { useSiteStore } from '@/store/useSiteStore'
import { exposeQA } from './shared/qa'

const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const maxDpr = coarse ? 1.5 : 1.75

/**
 * The ONE WebGL context for the whole page: fixed, transparent, pointer-events none.
 * Every 3D moment is a drei <View> elsewhere in the DOM that renders through <View.Port/>.
 */
export default function Scene() {
  const pageEl = useSiteStore((s) => s.pageEl)
  const setWebgl = useSiteStore((s) => s.setWebgl)
  const setPerfLow = useSiteStore((s) => s.setPerfLow)
  const lenis = useSiteStore((s) => s.lenis)
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, maxDpr))

  useEffect(() => {
    exposeQA({ lenis })
  }, [lenis])

  if (!pageEl) return null
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
      eventSource={pageEl}
      eventPrefix="client"
      frameloop="always"
      dpr={dpr}
      gl={{ antialias: !coarse, alpha: true, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.setClearColor(0x000000, 0)
        gl.domElement.setAttribute('aria-hidden', 'true')
        setWebgl('ok')
        exposeQA({ gl })
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          setWebgl('failed')
        })
      }}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          setDpr(1)
          setPerfLow(true)
        }}
        onIncline={() => setDpr(Math.min(window.devicePixelRatio || 1, maxDpr))}
        onFallback={() => {
          setDpr(1)
          setPerfLow(true)
        }}
      />
      <View.Port />
      <Preload all />
    </Canvas>
  )
}
