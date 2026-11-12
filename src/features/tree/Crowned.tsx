import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { LazyCanvas } from '@/design/LazyCanvas'
import { SariModel } from '@/design/SariModel'
import { asset } from '@/lib/asset'
import { rtl } from '@/i18n/locale'
import { MAPLE } from './art'

const CROWN = ['#f2c14e', '#e2711d', '#f4a72c', '#c8421f', '#f7c24a', '#d9541e', '#eeb23a', '#e4582a', '#f4a72c']

/** The maple outline (only M/Q/L commands) as a three.js shape, stem at the origin, tip up, 1 unit tall. */
function mapleShape(): THREE.Shape {
  const s = new THREE.Shape()
  const k = 1 / 92
  const X = (x: number) => x * k
  const Y = (y: number) => (45 - y) * k
  const re = /([MQL])([^MQLZ]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(MAPLE))) {
    const n = m[2].trim().split(/[ ,]+/).map(Number)
    if (m[1] === 'M') s.moveTo(X(n[0]), Y(n[1]))
    else if (m[1] === 'L') s.lineTo(X(n[0]), Y(n[1]))
    else s.quadraticCurveTo(X(n[0]), Y(n[1]), X(n[2]), Y(n[3]))
  }
  s.closePath()
  return s
}

/** A crown of autumn leaves, as the children make in the story. It rides on Sari's head bone, so it sways with him. */
function Crown({ root }: { root: React.RefObject<THREE.Group | null> }) {
  const crown = useRef<THREE.Group>(null)
  const geo = useMemo(() => new THREE.ShapeGeometry(mapleShape(), 6), [])
  const mats = useMemo(() => CROWN.map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.38, roughness: 0.78, side: THREE.DoubleSide })), [])
  useEffect(() => () => (geo.dispose(), mats.forEach((m) => m.dispose())), [geo, mats])
  const bone = useRef<THREE.Object3D | null>(null)
  const rest = useRef<THREE.Quaternion | null>(null)
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), q: new THREE.Quaternion(), up: new THREE.Vector3() }), [])
  useFrame(() => {
    const g = root.current
    const c = crown.current
    if (!g || !c) return
    if (!bone.current) bone.current = g.getObjectByName('Head') ?? null
    const b = bone.current
    if (!b) return
    b.getWorldQuaternion(tmp.q)
    if (!rest.current) rest.current = tmp.q.clone().invert()
    tmp.q.multiply(rest.current) // how far the head has turned from where it started
    b.getWorldPosition(tmp.p)
    c.parent!.worldToLocal(tmp.p)
    tmp.up.set(0, HEAD_UP, 0.012).applyQuaternion(tmp.q)
    c.position.copy(tmp.p).add(tmp.up)
    c.quaternion.copy(tmp.q)
    c.visible = true
  })
  const N = CROWN.length
  return (
    <group ref={crown} visible={false}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RADIUS, 0.011, 8, 40]} />
        <meshStandardMaterial color="#9a6a34" roughness={0.9} />
      </mesh>
      {CROWN.map((_, i) => {
        const a = (i / N) * Math.PI * 2 + 0.2
        const size = i % 2 === 0 ? 0.19 : 0.15
        return (
          <group key={i} position={[Math.sin(a) * RADIUS, -0.012, Math.cos(a) * RADIUS]} rotation={[0, a, 0]}>
            <mesh geometry={geo} material={mats[i]} rotation={[0.42, 0, (i % 3 - 1) * 0.16]} scale={size} />
          </group>
        )
      })}
    </group>
  )
}
/** Found by test renders of this rig: the hair's crown line sits this far above the head bone, at this radius. */
const HEAD_UP = 0.228
const RADIUS = 0.148

function Figure({ onReady }: { onReady: () => void }) {
  const root = useRef<THREE.Group>(null)
  const grow = useRef(0.72)
  useEffect(onReady, [onReady])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    grow.current += (1 - grow.current) * (1 - Math.exp(-5 * dt))
    root.current?.scale.setScalar(grow.current)
  })
  return (
    <group ref={root} rotation={[0, rtl ? 0.34 : -0.34, 0]}>
      <SariModel action="wave" />
      <Crown root={root} />
    </group>
  )
}

/** Without WebGL: Sari's portrait as a round medallion, with the same crown drawn over it. */
function Picture({ onShown }: { onShown: () => void }) {
  useEffect(onShown, [onShown])
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-[20%]" data-tree-sari="picture">
      <div className="relative aspect-square w-[min(78%,190px)]">
        <div className="absolute inset-0 overflow-hidden rounded-full bg-paper shadow-[0_0_0_5px_var(--color-paper),0_18px_40px_rgba(40,14,0,.4)]">
          <img
            src={asset('story/sari.webp')}
            alt=""
            className="h-full w-full origin-top scale-[1.3] object-cover object-top [filter:sepia(.32)_saturate(1.2)_brightness(1.05)]"
            draggable={false}
          />
        </div>
        <svg viewBox="-110 -60 220 100" className="absolute inset-x-[16%] top-[-9%] w-[68%]" aria-hidden>
          {CROWN.slice(0, 7).map((c, i) => {
            const x = (i - 3) * 27
            const y = Math.abs(i - 3) * 6
            return <path key={i} d={MAPLE} fill={c} stroke="rgba(90,40,0,.4)" strokeWidth="2" transform={`translate(${x} ${y - 6}) rotate(${(i - 3) * 13}) scale(${i % 2 ? 0.6 : 0.76})`} />
          })}
        </svg>
      </div>
    </div>
  )
}

/** Sari beside the tree, waving, wearing the crown: the reward for collecting every leaf of the story. */
export function Crowned({ onMode }: { onMode: (mode: '3d' | 'picture') => void }) {
  const picture = useMemo(() => () => onMode('picture'), [onMode])
  const three = useMemo(() => () => onMode('3d'), [onMode])
  return (
    <LazyCanvas camera={{ position: [0, 0.66, 4.1], fov: 25 }} onCreated={({ camera }) => camera.lookAt(0, 0.66, 0)} fallback={<Picture onShown={picture} />}>
      <hemisphereLight args={['#fff1d8', '#9a5a2a', 1.25]} />
      <directionalLight position={[2.2, 3.4, 3]} intensity={2.3} color="#fff0d6" />
      {/* the low sun behind him */}
      <directionalLight position={[rtl ? 2.5 : -2.5, 1.6, -2.4]} intensity={2.6} color="#ffb070" />
      <Suspense fallback={null}>
        <Figure onReady={three} />
      </Suspense>
    </LazyCanvas>
  )
}
