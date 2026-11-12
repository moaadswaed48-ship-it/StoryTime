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
  const geo = useMemo(() => new THREE.PlaneGeometry(0.6, 0.79, 6, 1), [])
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
  const s = useRef({ t: index * 1.7, fly: 0, lay: 0 })

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
    root.current.position.set(p.x, 0, p.z)
    // a phone held upright sees the yard from further away: bigger sheets, so the names can still be read
    const tall = state.size.width / state.size.height < 0.9
    const big = tall ? 1.3 : 1

    // a paper standing between the camera and Sari would hide him: there it lies down on the ground instead,
    // face up (the name can still be read from above) and stands up again once he has passed
    const inFront = !picked && p.z > rt.sari.z + 0.45 && Math.abs(p.x - rt.sari.x) < 1.25
    st.lay += ((inFront ? 1 : 0) - st.lay) * (1 - Math.exp(-8 * dt))
    const lay = st.lay

    // the sheet: hovering, rocking; when picked it flies up toward the camera, turning once
    const m = sheet.current
    const hover = THREE.MathUtils.lerp((tall ? 0.76 : 0.66) + Math.sin(st.t * 1.9) * 0.06, 0.2 * big + Math.sin(st.t * 1.9) * 0.015, lay)
    _v.copy(state.camera.position).sub(root.current.position)
    m.position.set(_v.x * 0.5 * k, hover + (_v.y - 0.5 - hover) * k, _v.z * 0.5 * k)
    m.rotation.set(
      THREE.MathUtils.lerp(-0.3 + Math.sin(st.t * 1.6) * 0.12 * (1 + gust), -1.25, lay * (1 - k)),
      Math.sin(st.t * 0.8) * 0.55 * (1 - k) * (1 - lay * 0.75) + k * Math.PI * 2,
      Math.sin(st.t * 2.2) * 0.15 * (1 + gust * 2) * (1 - k) * (1 - lay * 0.6),
    )
    m.scale.setScalar(big * (1 - k) + k * 2.3)
    // a paper right under the lens would fill the screen: it fades (with its ring and marker) as the camera passes over it
    const lens = Math.hypot(_v.x, _v.y - 1.1, _v.z)
    const close = picked ? 1 : smooth(1.9, 3.4, lens)
    const high = picked ? 1 : smooth(2.6, 4.6, lens) // the marker floats at eye level: it leaves earlier
    root.current.visible = st.fly < 1 && close > 0.05
    mats.sheet.opacity = (1 - smooth(0.62, 1, st.fly)) * close
    // a travelling wave makes it flutter (calmer when it lies on the ground)
    const arr = geo.attributes.position.array as Float32Array
    const wave = 1 - lay * 0.7
    for (let i = 0; i < arr.length; i += 3) {
      const x = rest[i]
      arr[i + 2] = Math.sin(x * 8 + st.t * (5 + gust * 7)) * (0.022 + gust * 0.05) * (0.3 + Math.abs(x) * 3.2) * wave
    }
    geo.attributes.position.needsUpdate = true

    const pulse = 0.5 + 0.5 * Math.sin(st.t * 2.4)
    ring.current.scale.setScalar((1.45 + pulse * 0.2) * (tall ? 1.2 : 1))
    mats.ring.opacity = (0.6 + pulse * 0.3) * (1 - k) * close * close
    marker.current.position.y = (tall ? 2.05 : 1.7) - lay * 0.35 + Math.sin(st.t * 3) * 0.09
    marker.current.scale.setScalar(0.42 * big)
    // the arrow belongs to a standing paper; over one lying at Sari's feet it would float in front of his face
    mats.marker.opacity = (1 - k) * high * (1 - lay)
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
  const s = useRef({ next: 5.5, rnd: mulberry32(99), targets: [] as (Point | null)[], hidden: [] as { i: number; px: number; py: number; d: number }[], shown: [] as number[] })

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

    // edge arrows (DOM): for the two nearest papers the camera cannot see (more would be clutter)
    const { width, height } = state.size
    const playing = game.phase === 'playing'
    const hidden = st.hidden
    const shown = st.shown // screen places (x, y pairs) of the papers in view: a chip never sits on one of them
    hidden.length = 0
    shown.length = 0
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
      const cam = state.camera.position
      const underLens = Math.hypot(p.x - cam.x, cam.y, p.z - cam.z) < 2.6 // faded out there, see PaperItem
      // a paper half inside the picture is seen well enough: no chip on top of it
      const seen = !behind && !underLens && px > -24 && px < width + 24 && py > 56 && py < height + 10
      if (underLens) py = height * 2
      if (seen) {
        el.style.opacity = '0'
        shown.push(px, py)
        continue
      }
      hidden.push({ i, px, py, d: Math.hypot(p.x - rt.sari.x, p.z - rt.sari.z) })
    }
    hidden.sort((a, b) => a.d - b.d)
    hidden.forEach(({ i, px, py }, rank) => {
      const el = rt.arrows[i]
      if (!el) return
      if (rank > 1) {
        el.style.opacity = '0'
        return
      }
      const side = 40
      const top = 118
      const bottom = height - (width < 640 ? 196 : 96)
      const cx = THREE.MathUtils.clamp(px, side, width - side)
      let cy = THREE.MathUtils.clamp(py, top, bottom)
      for (let n = 0; n < shown.length; n += 2) {
        if (Math.abs(shown[n] - cx) < 96 && Math.abs(shown[n + 1] - 30 - cy) < 110) {
          const up = shown[n + 1] - 150
          cy = up > top ? up : Math.min(bottom, shown[n + 1] + 90)
        }
      }
      el.style.opacity = '1'
      el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`
      el.style.setProperty('--a', `${Math.atan2(py - cy, px - cx).toFixed(3)}rad`)
    })
  })

  return (
    <>
      {papers.map((p) => (
        <PaperItem key={p.id + ':' + p.name} index={p.id} name={p.name} />
      ))}
    </>
  )
}
