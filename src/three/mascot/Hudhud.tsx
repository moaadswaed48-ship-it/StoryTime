import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/** Mutable controls read every frame (never React state). */
export interface HudhudCtrl {
  crest: number // 0 folded … 1 fanned (target)
  wave: number // seconds left
  hop: number // seconds left
  fly: boolean
  yaw: number // target yaw
  look: { x: number; y: number }
}
export const makeCtrl = (): HudhudCtrl => ({ crest: 0.8, wave: 0, hop: 0, fly: false, yaw: 0, look: { x: 0, y: 0 } })

const C = { body: '#e9a467', belly: '#f6d3a8', dark: '#2a2420', white: '#fff7ea', beak: '#5a4034', cheek: '#f08a7a', leg: '#8a7a70' }

/**
 * Hudhud the hoopoe — built from primitives so he can blink, look around, fan his crest, flap and hop,
 * and is identical everywhere he appears (hero-free: showcase + game).
 */
export function Hudhud({ ctrl, scarf = '#2f7d6d', visible }: { ctrl: RefObject<HudhudCtrl>; scarf?: string; visible?: RefObject<boolean> }) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const crest = useRef<THREE.Group>(null)
  const wingL = useRef<THREE.Group>(null)
  const wingR = useRef<THREE.Group>(null)
  const lids = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const s = useRef({ crest: 0.8, t: 0, blink: 2, yaw: 0 })
  const mats = useMemo(() => {
    const m = (color: string, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.62, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color('#fff1dc'), ...o })
    return { body: m(C.body), belly: m(C.belly), dark: m(C.dark, { roughness: 0.5 }), white: m(C.white), beak: m(C.beak, { roughness: 0.35, sheen: 0 }), cheek: m(C.cheek, { transparent: true, opacity: 0.75 }), leg: m(C.leg), eye: new THREE.MeshPhysicalMaterial({ color: '#15110f', roughness: 0.08, clearcoat: 1 }), glint: new THREE.MeshBasicMaterial({ color: '#ffffff' }) }
  }, [])
  const feathers = 7

  useFrame((_, delta) => {
    if (visible && !visible.current) return
    const c = ctrl.current
    const dt = Math.min(delta, 1 / 30)
    const st = s.current
    st.t += dt
    const t = st.t
    const k = 1 - Math.exp(-8 * dt)
    st.crest += ((c.wave > 0 || c.hop > 0 ? 1 : c.crest) - st.crest) * k
    st.yaw += (c.yaw - st.yaw) * k
    const g = root.current!
    // hop arc / fly bob
    let y = 0
    if (c.hop > 0) {
      const p = 1 - c.hop / 0.6
      y = Math.sin(Math.PI * p) * 0.45
      c.hop = Math.max(0, c.hop - dt)
    }
    if (c.fly) y += Math.sin(t * 5) * 0.03
    else y += Math.sin(t * 1.8) * 0.012
    g.position.y = y
    g.rotation.y = st.yaw
    g.scale.setScalar(1 + (c.hop > 0 ? Math.sin((1 - c.hop / 0.6) * Math.PI * 2) * 0.05 : 0))
    // head follows the pointer a little
    const h = head.current!
    h.rotation.y += (c.look.x * 0.5 - h.rotation.y) * k
    h.rotation.x += (-c.look.y * 0.3 + (c.fly ? 0.15 : 0) - h.rotation.x) * k
    h.rotation.z = Math.sin(t * 0.9) * 0.04
    // crest fan
    const cr = crest.current!
    cr.rotation.x = THREE.MathUtils.lerp(-1.15, -0.18, st.crest)
    cr.children.forEach((f, i) => {
      f.rotation.z = (i - (feathers - 1) / 2) * THREE.MathUtils.lerp(0.04, 0.3, st.crest)
    })
    // wings
    const flap = c.fly ? Math.sin(t * 16) * 0.95 + 0.35 : 0.06 + Math.sin(t * 1.8) * 0.03
    const wave = c.wave > 0 ? 1.1 + Math.sin(t * 14) * 0.5 : 0
    if (c.wave > 0) c.wave = Math.max(0, c.wave - dt)
    wingL.current!.rotation.z = -(c.fly ? flap : 0.06) - 0.02
    wingR.current!.rotation.z = (c.fly ? flap : Math.max(0.06, wave)) + 0.02
    tail.current!.rotation.x = 0.5 + Math.sin(t * 2.2) * 0.06 + (c.fly ? 0.5 : 0)
    // blink
    st.blink -= dt
    const closed = st.blink < 0.12
    if (st.blink < 0) st.blink = 2.2 + Math.random() * 2.5
    lids.current!.scale.y += ((closed ? 1 : 0.02) - lids.current!.scale.y) * (1 - Math.exp(-30 * dt))
  })

  return (
    <group ref={root}>
      {/* body */}
      <mesh material={mats.body} scale={[0.42, 0.44, 0.42]} position={[0, 0.02, 0]} castShadow>
        <sphereGeometry args={[1, 40, 32]} />
      </mesh>
      <mesh material={mats.belly} scale={[0.3, 0.32, 0.2]} position={[0, -0.03, 0.26]}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      {/* scarf */}
      <mesh position={[0, 0.33, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.8]}>
        <torusGeometry args={[0.29, 0.07, 14, 32]} />
        <meshPhysicalMaterial color={scarf} roughness={0.8} sheen={1} sheenRoughness={0.4} />
      </mesh>
      <mesh position={[0.2, 0.19, 0.3]} rotation={[0.2, 0, -0.25]} scale={[0.07, 0.17, 0.04]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshPhysicalMaterial color={scarf} roughness={0.8} sheen={1} />
      </mesh>
      {/* head */}
      <group ref={head} position={[0, 0.66, 0.03]}>
        <mesh material={mats.body} scale={[0.44, 0.4, 0.42]} castShadow>
          <sphereGeometry args={[1, 36, 28]} />
        </mesh>
        {[-1, 1].map((sx) => (
          <group key={sx} position={[0.17 * sx, 0.03, 0.33]}>
            <mesh material={mats.eye}>
              <sphereGeometry args={[0.1, 24, 18]} />
            </mesh>
            <mesh material={mats.glint} position={[0.03, 0.04, 0.078]}>
              <sphereGeometry args={[0.03, 10, 8]} />
            </mesh>
          </group>
        ))}
        <group ref={lids} position={[0, 0.03, 0.335]} scale={[1, 0.02, 1]}>
          {[-1, 1].map((sx) => (
            <mesh key={sx} material={mats.body} position={[0.17 * sx, 0, 0]}>
              <sphereGeometry args={[0.108, 16, 12]} />
            </mesh>
          ))}
        </group>
        {[-1, 1].map((sx) => (
          <mesh key={sx} material={mats.cheek} position={[0.29 * sx, -0.1, 0.27]} scale={[0.075, 0.05, 0.02]}>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
        ))}
        {/* long slender beak */}
        <mesh material={mats.beak} position={[0, -0.09, 0.62]} rotation={[Math.PI / 2 + 0.16, 0, 0]}>
          <coneGeometry args={[0.055, 0.46, 14]} />
        </mesh>
        {/* crest: fan of black-tipped feathers */}
        <group ref={crest} position={[0, 0.3, -0.06]}>
          {Array.from({ length: feathers }, (_, i) => (
            <group key={i}>
              <mesh material={mats.body} position={[0, 0.22, 0]} scale={[0.05, 0.25, 0.024]}>
                <sphereGeometry args={[1, 12, 10]} />
              </mesh>
              <mesh material={mats.white} position={[0, 0.4, 0]} scale={[0.045, 0.04, 0.026]}>
                <sphereGeometry args={[1, 10, 8]} />
              </mesh>
              <mesh material={mats.dark} position={[0, 0.46, 0]} scale={[0.046, 0.055, 0.028]}>
                <sphereGeometry args={[1, 10, 8]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      {/* wings: black & white bars */}
      {[
        { ref: wingL, sx: -1 },
        { ref: wingR, sx: 1 },
      ].map(({ ref, sx }) => (
        <group key={sx} ref={ref} position={[0.36 * sx, 0.2, -0.02]}>
          <group rotation={[0.25, 0, 0.12 * sx]}>
            {[0, 1, 2, 3, 4].map((b) => (
              <mesh key={b} material={b % 2 ? mats.white : mats.dark} position={[0.06 * sx, -0.07 - b * 0.075, -0.02 - b * 0.012]} scale={[0.08, 0.045, 0.21 - b * 0.026]} castShadow>
                <sphereGeometry args={[1, 14, 10]} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      {/* tail */}
      <group ref={tail} position={[0, -0.12, -0.36]} rotation={[0.5, 0, 0]}>
        {[0, 1, 2].map((b) => (
          <mesh key={b} material={b === 1 ? mats.white : mats.dark} position={[0, -0.04, -0.07 - b * 0.1]} scale={[0.16 - b * 0.02, 0.025, 0.07]}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ))}
      </group>
      {/* legs */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[0.13 * sx, -0.4, 0.05]}>
          <mesh material={mats.leg} position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
          </mesh>
          <mesh material={mats.leg} position={[0, -0.155, 0.045]} scale={[0.05, 0.016, 0.085]}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
