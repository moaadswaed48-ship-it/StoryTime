import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { LazyCanvas } from '@/design/LazyCanvas'
import { SariModel } from '@/design/SariModel'
import { asset } from '@/lib/asset'
import { rtl } from '@/i18n/locale'
import { MAPLE } from './art'

/** The crown is made of the three leaves the child collected: gold, orange, red. */
const CROWN = ['#f1b62c', '#e2711d', '#c9401c', '#f1b62c', '#e2711d', '#c9401c', '#f1b62c', '#e2711d', '#c9401c']

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
  const mats = useMemo(() => CROWN.map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.16, roughness: 0.85, side: THREE.DoubleSide })), [])
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
        const size = i % 2 === 0 ? 0.23 : 0.185
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

/**
 * Sari's picture stands on a flat studio grey. Without WebGL we lift him off it in a small 2D canvas
 * (flood from the edges, so greys inside the figure stay) and he stands on the hill like the 3D one.
 */
function useCutout(src: string): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    let made: string | null = null
    const img = new Image()
    img.onload = () => {
      try {
        const w = 420
        const h = Math.round((w * img.naturalHeight) / img.naturalWidth)
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h)
        const px = data.data
        const [br, bg, bb] = [px[0], px[1], px[2]]
        const far = (p: number) => Math.max(Math.abs(px[p * 4] - br), Math.abs(px[p * 4 + 1] - bg), Math.abs(px[p * 4 + 2] - bb))
        const out = new Uint8Array(w * h)
        const stack: number[] = []
        for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
        for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
        while (stack.length) {
          const p = stack.pop()!
          if (out[p] || far(p) > 16) continue
          out[p] = 1
          const x = p % w
          if (x > 0) stack.push(p - 1)
          if (x < w - 1) stack.push(p + 1)
          if (p >= w) stack.push(p - w)
          if (p < w * (h - 1)) stack.push(p + w)
        }
        for (let p = 0; p < w * h; p++) {
          if (out[p]) px[p * 4 + 3] = 0
          else {
            // a soft edge: pixels touching the background keep only as much as they differ from it
            const x = p % w
            const edge = (x > 0 && out[p - 1]) || (x < w - 1 && out[p + 1]) || (p >= w && out[p - w]) || (p < w * (h - 1) && out[p + w])
            if (edge) px[p * 4 + 3] = Math.min(255, far(p) * 5)
          }
        }
        ctx.putImageData(data, 0, 0)
        c.toBlob((blob) => {
          if (!blob || !alive) return
          made = URL.createObjectURL(blob)
          setUrl(made)
        })
      } catch {
        /* the framed portrait below is shown instead */
      }
    }
    img.src = src
    return () => {
      alive = false
      if (made) URL.revokeObjectURL(made)
    }
  }, [src])
  return url
}

function PaperCrown({ className }: { className: string }) {
  return (
    <svg viewBox="-110 -60 220 100" className={className} aria-hidden>
      {CROWN.slice(0, 7).map((c, i) => {
        const x = (i - 3) * 27
        const y = Math.abs(i - 3) * 6
        return <path key={i} d={MAPLE} fill={c} stroke="rgba(90,40,0,.4)" strokeWidth="2" transform={`translate(${x} ${y - 6}) rotate(${(i - 3) * 13}) scale(${i % 2 ? 0.6 : 0.76})`} />
      })}
    </svg>
  )
}

/** Without WebGL: Sari's picture, standing where the 3D Sari would, with the same crown drawn over it. */
function Picture({ onShown }: { onShown: () => void }) {
  useEffect(onShown, [onShown])
  const src = asset('story/sari.webp')
  const cut = useCutout(src)
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-[11%]" data-tree-sari="picture">
      {cut ? (
        <>
          {/* one front-view picture is all there is, so he looks over a rise in the hill: head, shoulders and crown */}
          <div className="absolute inset-x-0 bottom-[27%] top-0 overflow-hidden">
            <div className="absolute bottom-0 start-1/2 w-[94%] -translate-x-1/2 rtl:translate-x-1/2" style={{ aspectRatio: '700 / 929' }}>
              <div className="h-full w-full translate-y-[55%]">
                <img src={cut} alt="" className="tree-cut h-full w-full" draggable={false} />
                <PaperCrown className="absolute inset-x-[25%] top-[-5%] w-[50%]" />
              </div>
            </div>
          </div>
          {/* the rise is a closed curve that lands on the hill at both ends, in the hill's own colours */}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-x-[-6%] bottom-[1%] h-[31%] w-[112%]" aria-hidden>
            <defs>
              <linearGradient id="tree-mound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#b0601e" />
                <stop offset="0.5" stopColor="#84421a" />
                <stop offset="1" stopColor="#6a3515" />
              </linearGradient>
            </defs>
            <path d="M0,40 C16,40 26,4 50,4 C74,4 84,40 100,40 Z" fill="url(#tree-mound)" />
            <path d="M12,32 C24,20 32,4 50,4 C68,4 76,20 88,32" fill="none" stroke="#ffc27a" strokeOpacity="0.6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {[[22, 82, 30], [38, 76, 200], [55, 80, 120], [70, 86, 310], [47, 90, 60]].map(([x, y, r], i) => (
            <svg key={i} viewBox="-56 -56 112 112" className="absolute h-[16px] w-[16px]" style={{ left: `${x}%`, top: `${y}%`, transform: `scaleY(0.5) rotate(${r}deg)` }} aria-hidden>
              <path d={MAPLE} fill={CROWN[i % 3]} fillOpacity="0.85" />
            </svg>
          ))}
        </>
      ) : (
        <div className="relative mb-[9%] aspect-square w-[min(64%,160px)]">
          <div className="absolute inset-0 overflow-hidden rounded-full bg-paper shadow-[0_0_0_5px_var(--color-paper),0_18px_40px_rgba(40,14,0,.4)]">
            <img src={src} alt="" className="h-full w-full origin-top scale-[1.3] object-cover object-top [filter:sepia(.32)_saturate(1.2)_brightness(1.05)]" draggable={false} />
          </div>
          <PaperCrown className="absolute inset-x-[16%] top-[-9%] w-[68%]" />
        </div>
      )}
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
