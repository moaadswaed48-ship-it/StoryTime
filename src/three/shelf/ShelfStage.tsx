import { Suspense } from 'react'
import { asset } from '@/lib/asset'
import * as THREE from 'three'
import { useTexture, Environment, Lightformer, ContactShadows } from '@react-three/drei'
import { useSiteStore } from '@/store/useSiteStore'

const PLANK = { W: 14, T: 0.06, D: 1.15 }

function Plank() {
  const [diff, nor, arm] = useTexture([
    asset('textures/wood_table_001_diff_1k.jpg'),
    asset('textures/wood_table_001_nor_gl_1k.jpg'),
    asset('textures/wood_table_001_arm_1k.jpg'),
  ])
  for (const t of [diff, nor, arm]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3.5, 0.35)
    t.anisotropy = 8
  }
  diff.colorSpace = THREE.SRGBColorSpace
  return (
    <group>
      <mesh position={[0, -PLANK.T / 2, 0]} receiveShadow>
        <boxGeometry args={[PLANK.W, PLANK.T, PLANK.D]} />
        <meshStandardMaterial map={diff} normalMap={nor} roughnessMap={arm} roughness={1} metalness={0} color="#f0dcc0" />
      </mesh>
      {/* back lip */}
      <mesh position={[0, 0.09, -PLANK.D / 2 + 0.02]}>
        <boxGeometry args={[PLANK.W, 0.24, 0.04]} />
        <meshStandardMaterial map={diff} normalMap={nor} roughness={0.9} color="#c9ae8c" />
      </mesh>
    </group>
  )
}

const HDR_AVAILABLE = !import.meta.env.VITE_NO_HDR // previews on hosts that cannot serve .hdr use the light-former rig

function Lights() {
  const tier = useSiteStore((s) => s.tier)
  return (
    <>
      <hemisphereLight args={['#dfe9f3', '#6b7a4a', 0.5]} />
      <directionalLight position={[-3, 4, 3.5]} intensity={2.1} color="#ffe8c8" />
      {tier === 'full' && HDR_AVAILABLE ? (
        <Suspense fallback={null}>
          <Environment files={asset('env/kloofendal_misty_morning_1k.hdr')} environmentIntensity={0.85} />
        </Suspense>
      ) : (
        <Environment frames={1} resolution={128}>
          <Lightformer intensity={2} color="#fff1dc" position={[-4, 4, 3]} scale={[6, 4, 1]} />
          <Lightformer intensity={0.8} color="#cfe0ee" position={[5, 2, -2]} scale={[4, 4, 1]} />
        </Environment>
      )}
    </>
  )
}

/** Plank, lights, environment and contact shadows for the shelf View (all inside the View's own scene). */
export function ShelfStage() {
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  return (
    <>
      <Lights />
      <Suspense fallback={null}>
        <Plank />
      </Suspense>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.5} scale={[PLANK.W, 2.2]} blur={2.2} far={1.6} resolution={coarse ? 256 : 512} color="#2a2416" />
      <fog attach="fog" args={['#dfe8ee', 7, 13]} />
    </>
  )
}
