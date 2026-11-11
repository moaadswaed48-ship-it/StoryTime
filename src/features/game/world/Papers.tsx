import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mulberry32 } from '@/lib/seeded'
import { useSiteStore } from '@/store/useSiteStore'
import { gustTarget, type Point } from '../logic'
import { rt } from '../runtime'
import { useGame } from '../store'
import { markerTexture, paperTexture, ringTexture } from './textures'

const _v = new THREE.Vector3()
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** One name paper: a white sheet fluttering just above the ground, a soft ring under it, a little arrow above. */
function PaperItem({ index, name }: { index: number; name: string }) {
  const root = useRef<THREE.Group>(null!)
  const sheet = useRef<THREE.Mesh>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const marker = useRef<THREE.Sprite>(null!)
  const geo = useMemo(() => new THREE.PlaneGeometry(0.56, 0.735, 6, 1), [])
  const rest = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo])
  const mats = useMemo(
    () => ({
      sheet: new THREE.MeshBasicMaterial({ map: paperTexture(name), side: THREE.DoubleSide, transparent: true, fog: false }),
      ring: new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, depthWrite: false, fog: false, color: '#fffaf0' }),
      marker: new THREE.SpriteMaterial({ map: markerTexture(), transparent: true, depthWrite: false, fog: false }),
    }),
    [name],
  )
  useEffect(
    () => () => {
      mats.sheet.map?.dispose()
      mats.sheet.dispose()
      mats.ring.dispose()
      mats.marker.dispose()
    },
    [mats],
  )
  useEffect(() => () => geo.dispose(), [geo])
  const s = useRef({ t: index * 1.7, fly: 0 })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const st = s.current
    const game = useGame.getState()
    const p = rt.papers[index]
    const picked = game.current === index && (game.phase === 'asking' || game.phase === 'right')
    if (!p || (game.collected[index] && !picked)) {
      root.current.visible = false
      st.fly = 0
      return
    }
    st.t += dt
    st.fly = picked ? Math.min(1, st.fly + dt / 0.5) : 0
    const k = smooth(0, 1, st.fly)
    const gust = rt.wind.power
    root.current.visible = st.fly < 1
    root.current.position.set(p.x, 0, p.z)

    // the sheet: hovering, rocking; when picked it flies up toward the camera, turning once
    const m = sheet.current
    const hover = 0.66 + Math.sin(st.t * 1.9) * 0.06
    _v.copy(state.camera.position).sub(root.current.position)
    m.position.set(_v.x * 0.5 * k, hover + (_v.y - 0.5 - hover) * k, _v.z * 0.5 * k)
    m.rotation.set(-0.3 + Math.sin(st.t * 1.6) * 0.12 * (1 + gust), Math.sin(st.t * 0.8) * 0.55 * (1 - k) + k * Math.PI * 2, Math.sin(st.t * 2.2) * 0.15 * (1 + gust * 2) * (1 - k))
    m.scale.setScalar(1 + k * 1.3)
    mats.sheet.opacity = 1 - smooth(0.62, 1, st.fly)
    // a travelling wave makes it flutter
    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      const x = rest[i]
      arr[i + 2] = Math.sin(x * 8 + st.t * (5 + gust * 7)) * (0.022 + gust * 0.05) * (0.3 + Math.abs(x) * 3.2)
    }
    geo.attributes.position.needsUpdate = true

    const pulse = 0.5 + 0.5 * Math.sin(st.t * 2.4)
    ring.current.scale.setScalar(1.45 + pulse * 0.2)
    mats.ring.opacity = (0.6 + pulse * 0.3) * (1 - k)
    marker.current.position.y = 1.7 + Math.sin(st.t * 3) * 0.09
    mats.marker.opacity = 1 - k
  })

  return (
    <group ref={root}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.09} material={mats.ring} renderOrder={5}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={sheet} geometry={geo} material={mats.sheet} renderOrder={6} />
      <sprite ref={marker} material={mats.marker} scale={[0.42, 0.42, 0.42]} renderOrder={7} />
    </group>
  )
}

/** All the papers, the gusts that slide them about, and the edge arrows that point at papers outside the screen. */
export function Papers() {
  const papers = useGame((g) => g.papers)
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const s = useRef({ next: 5.5, rnd: mulberry32(99), targets: [] as (Point | null)[] })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const st = s.current
    const game = useGame.getState()
    rt.wind.power = Math.max(0, rt.wind.power - dt * 0.42)

    // every so often the wind picks up and nudges the papers
    if (game.phase === 'playing' && !reduced) {
      st.next -= dt
      if (st.next <= 0) {
        st.next = 7 + st.rnd() * 4
        const a = st.rnd() * Math.PI * 2
        rt.wind.x = Math.cos(a)
        rt.wind.z = Math.sin(a)
        rt.wind.power = 1
        st.targets = rt.papers.map((p, i) => (game.collected[i] ? null : gustTarget(p, rt.wind, 0.6 + st.rnd() * 0.7, rt.sari)))
      }
      const ease = 1 - Math.exp(-2.4 * dt)
      st.targets.forEach((tg, i) => {
        const p = rt.papers[i]
        if (!tg || !p || game.collected[i]) return
        p.x += (tg.x - p.x) * ease
        p.z += (tg.z - p.z) * ease
      })
    } else st.targets = []

    // edge arrows (DOM): only for papers the camera cannot see
    const { width, height } = state.size
    const playing = game.phase === 'playing'
    for (let i = 0; i < rt.arrows.length; i++) {
      const el = rt.arrows[i]
      if (!el) continue
      const p = rt.papers[i]
      if (!playing || !p || game.collected[i]) {
        el.style.opacity = '0'
        continue
      }
      _v.set(p.x, 0.7, p.z).project(state.camera)
      const behind = _v.z > 1
      let px = (_v.x * 0.5 + 0.5) * width
      let py = (-_v.y * 0.5 + 0.5) * height
      if (behind) {
        // behind the camera: point straight down, on the side it lies
        px = width / 2 + THREE.MathUtils.clamp((p.x - state.camera.position.x) / 6, -1, 1) * (width / 2)
        py = height * 2
      }
      const seen = !behind && px > 18 && px < width - 18 && py > 70 && py < height - 28
      if (seen) {
        el.style.opacity = '0'
        continue
      }
      const side = 40
      const cx = THREE.MathUtils.clamp(px, side, width - side)
      const cy = THREE.MathUtils.clamp(py, 118, height - (width < 640 ? 196 : 96))
      el.style.opacity = '1'
      el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`
      el.style.setProperty('--a', `${Math.atan2(py - cy, px - cx).toFixed(3)}rad`)
    }
  })

  return (
    <>
      {papers.map((p) => (
        <PaperItem key={p.id + ':' + p.name} index={p.id} name={p.name} />
      ))}
    </>
  )
}
