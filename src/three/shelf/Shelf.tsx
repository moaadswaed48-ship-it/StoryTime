import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { easing } from 'maath'
import { books as catalog } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { mulberry32 } from '@/lib/seeded'
import { exposeQA } from '@/three/shared/qa'
import { makeBookGeometry, BOOK } from './bookGeometry'
import { BookMesh } from './Book'
import { makeRailBooks, startLanding, nudge, advance, isSettled, type RailBook } from './rail'

export interface ShelfSignals {
  enters: number // incremented every time the shelf section enters the viewport
  visible: boolean
}

type Mode = 'dormant' | 'landing' | 'settling' | 'browsing'

/** The row of books: deterministic landing shuffle → settle → (M3) browse. */
export function Shelf({ signals }: { signals: ShelfSignals }) {
  const tier = useSiteStore((s) => s.tier)
  const setPhase = useSiteStore((s) => s.setPhase)
  const geometry = useMemo(() => makeBookGeometry(), [])
  const normalMap = useTexture('/textures/book_hardcover_01_nor_gl_1k.jpg')
  const groupRef = useRef<THREE.Group>(null)
  const meshRefs = useRef<(THREE.Group | null)[]>([])

  const rail = useMemo<RailBook[]>(() => makeRailBooks(catalog.map((b) => b.id), catalog.map(() => BOOK.W), BOOK.PITCH), [])
  const jitter = useMemo(() => {
    const r = mulberry32(2024)
    return catalog.map(() => ({ yaw: (r() - 0.5) * 0.12, lean: -0.14 + (r() - 0.5) * 0.05 }))
  }, [])

  const sim = useRef({ mode: 'dormant' as Mode, acc: 0, clock: { t: 0 }, settledFor: 0, landedOnce: false, seenEnters: 0, seed: 1337 })
  const atlasSize = typeof window !== 'undefined' && (window.innerWidth < 768 || window.devicePixelRatio <= 1.5) ? 768 : 1024

  const begin = (kind: 'landing' | 'nudge', seed = sim.current.seed) => {
    const s = sim.current
    if (tier === 'reduced' && kind === 'landing') {
      s.mode = 'browsing'
      setPhase('browsing')
      return
    }
    if (kind === 'landing') startLanding(rail, seed)
    else nudge(rail, seed + s.seenEnters, 0.15)
    s.clock.t = 0
    s.acc = 0
    s.settledFor = 0
    s.mode = kind === 'landing' ? 'landing' : 'settling'
    setPhase(kind === 'landing' ? 'landing' : 'settling')
  }

  useEffect(() => {
    exposeQA({
      shelf: {
        phase: () => sim.current.mode,
        positions: () => rail.map((b) => [b.x, b.y]),
        settleNow: () => {
          for (const b of rail) {
            b.x = b.slot; b.v = 0; b.y = 0; b.vy = 0; b.landed = true; b.rotZ = 0; b.tilt = 0
          }
          sim.current.mode = 'browsing'
          setPhase('browsing')
        },
        relaunch: (seed = 1337) => begin('landing', seed),
        time: () => sim.current.clock.t,
        visible: () => signals.visible,
        debug: () => {
          let dx = 0, v = 0, y = 0, tilt = 0, unlanded = 0
          for (const b of rail) {
            dx = Math.max(dx, Math.abs(b.x - b.slot)); v = Math.max(v, Math.abs(b.v)); y = Math.max(y, Math.abs(b.y)); tilt = Math.max(tilt, Math.abs(b.tilt))
            if (!b.landed) unlanded++
          }
          return { dx, v, y, tilt, unlanded, settledFor: sim.current.settledFor, enters: signals.enters }
        },
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, delta) => {
    const s = sim.current
    const dt = Math.min(delta, 1 / 30)
    // section entered?
    if (signals.enters !== s.seenEnters) {
      s.seenEnters = signals.enters
      if (!s.landedOnce) {
        s.landedOnce = true
        begin('landing')
      } else if (tier !== 'reduced' && s.mode === 'browsing') begin('nudge')
    }
    if (!signals.visible) return

    if (s.mode === 'landing' || s.mode === 'settling') {
      s.acc = advance(rail, s.acc, dt, s.clock)
      if (isSettled(rail)) {
        s.settledFor += dt
        if (s.settledFor > 0.3 || s.clock.t > 2.5) {
          s.mode = 'browsing'
          setPhase('browsing')
        }
      } else s.settledFor = 0
    }

    // write sim → meshes
    for (let i = 0; i < rail.length; i++) {
      const g = meshRefs.current[i]
      const b = rail[i]
      if (!g) continue
      g.position.x = b.x
      g.position.y = b.y
      const tiltTarget = b.landed ? THREE.MathUtils.clamp(-b.v * 0.45, -0.3, 0.3) + b.tilt : b.rotZ
      easing.dampAngle(g.rotation, 'z', tiltTarget, 0.12, dt)
    }
  })

  return (
    <group ref={groupRef}>
      {catalog.map((book, i) => (
        <BookMesh
          key={book.id}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
          book={book}
          geometry={geometry}
          normalMap={normalMap}
          yaw={jitter[i].yaw}
          lean={jitter[i].lean}
          atlasSize={atlasSize}
        />
      ))}
    </group>
  )
}
