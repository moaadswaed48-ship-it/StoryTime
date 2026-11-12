import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mulberry32 } from '@/lib/seeded'
import { useSiteStore } from '@/store/useSiteStore'
import { rt } from '../runtime'
import { useGame } from '../store'
import { LEAF_COLORS, leafTexture } from './textures'
import { PILE, TREE } from './Yard'

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _c = new THREE.Color()
/** A leaf close to the lens would cover half the screen: it shrinks to nothing before it gets there. */
const NEAR0 = 1.7
const NEAR1 = 3.4
function away(cam: THREE.Vector3, x: number, y: number, z: number) {
  const t = Math.min(1, Math.max(0, (Math.hypot(x - cam.x, y - cam.y, z - cam.z) - NEAR0) / (NEAR1 - NEAR0)))
  return t * t * (3 - 2 * t)
}

function leafMesh(count: number) {
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: leafTexture(), alphaTest: 0.4, side: THREE.DoubleSide, fog: false }), count)
  mesh.frustumCulled = false
  return mesh
}

/** Leaves drifting down over the whole yard; a gust pushes them sideways. */
export function FallingLeaves({ count = 64 }: { count?: number }) {
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const mesh = useMemo(() => leafMesh(count), [count])
  const leaves = useMemo(() => {
    const rnd = mulberry32(61)
    return Array.from({ length: count }, (_, i) => {
      const fromTree = i % 3 === 0
      return {
        x: fromTree ? TREE.x + (rnd() - 0.3) * 7 : (rnd() * 2 - 1) * 10,
        y: rnd() * 6.5,
        z: fromTree ? TREE.z + (rnd() - 0.3) * 6 : -6.5 + rnd() * 15,
        fall: 0.45 + rnd() * 0.55,
        sway: 0.5 + rnd() * 0.9,
        ph: rnd() * 6.3,
        spin: (rnd() - 0.5) * 3,
        size: 0.2 + rnd() * 0.2,
        homeX: 0,
        homeZ: 0,
        fromTree,
      }
    })
  }, [count])
  useEffect(() => {
    const rnd = mulberry32(62)
    leaves.forEach((l, i) => {
      l.homeX = l.x
      l.homeZ = l.z
      mesh.setColorAt(i, _c.set(LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)]).multiplyScalar(0.95 + rnd() * 0.15))
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    return () => {
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    }
  }, [mesh, leaves])
  const clock = useRef(0)
  useFrame((state, delta) => {
    const dt = reduced ? 0 : Math.min(delta, 0.1)
    const cam = state.camera.position
    clock.current += dt
    const t = clock.current
    const wind = rt.wind.power
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i]
      l.y -= l.fall * dt * (1 - wind * 0.4)
      l.x += (Math.sin(t * l.sway + l.ph) * 0.35 + rt.wind.x * wind * 2.6) * dt
      l.z += (Math.cos(t * l.sway * 0.8 + l.ph) * 0.25 + rt.wind.z * wind * 2.6) * dt
      if (l.y < 0.04) {
        l.y = 5.5 + ((i * 37) % 20) / 10
        l.x = l.homeX
        l.z = l.homeZ
      }
      _e.set(t * l.spin * 0.7 + l.ph, t * l.spin + l.ph * 2, Math.sin(t * 1.3 + l.ph) * 0.8)
      mesh.setMatrixAt(i, _m.compose(_p.set(l.x, l.y, l.z), _q.setFromEuler(_e), _s.setScalar(l.size * away(cam, l.x, l.y, l.z))))
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return <primitive object={mesh} />
}

interface Kick {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  max: number
  spin: number
  ph: number
  size: number
}

/**
 * Leaves kicked up by Sari's feet, scattered when he runs through the heap, and thrown in the air when a name is won.
 * A small ring buffer of instances: nothing is allocated while playing.
 */
export function KickedLeaves({ count = 72 }: { count?: number }) {
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const mesh = useMemo(() => leafMesh(count), [count])
  const pool = useMemo<Kick[]>(() => Array.from({ length: count }, () => ({ x: 0, y: -1, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, spin: 0, ph: 0, size: 0.2 })), [count])
  const s = useRef({ next: 0, step: 0, pile: 0, burst: rt.burst, rnd: mulberry32(77) })
  useEffect(() => {
    const rnd = mulberry32(78)
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, _c.set(LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)]))
      mesh.setMatrixAt(i, _m.makeScale(0, 0, 0))
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    return () => {
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    }
  }, [mesh, count])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const cam = state.camera.position
    const st = s.current
    const rnd = st.rnd
    const emit = (n: number, x: number, z: number, spread: number, up: number, push: number, dirX = 0, dirZ = 0) => {
      for (let i = 0; i < n; i++) {
        const k = pool[st.next]
        st.next = (st.next + 1) % pool.length
        const a = rnd() * Math.PI * 2
        const v = push * (0.4 + rnd() * 0.8)
        k.x = x + Math.cos(a) * spread * rnd()
        k.z = z + Math.sin(a) * spread * rnd()
        k.y = 0.06 + rnd() * 0.2
        k.vx = Math.cos(a) * v + dirX
        k.vz = Math.sin(a) * v + dirZ
        k.vy = up * (0.6 + rnd() * 0.7)
        k.max = k.life = 1 + rnd() * 0.8
        k.spin = (rnd() - 0.5) * 9
        k.ph = rnd() * 6.3
        k.size = 0.2 + rnd() * 0.2
      }
    }
    if (!reduced) {
      const phase = useGame.getState().phase
      // a leaf or two from under his shoes while he runs
      if (rt.sari.moving && phase === 'playing') {
        st.step -= dt
        if (st.step <= 0) {
          st.step = 0.11
          const back = 0.9
          emit(1, rt.sari.x, rt.sari.z, 0.2, 1.5, 0.5, -Math.sin(rt.sari.heading) * back, -Math.cos(rt.sari.heading) * back)
        }
        // through the heap: a proper splash
        st.pile -= dt
        if (st.pile <= 0 && Math.hypot(rt.sari.x - PILE.x, rt.sari.z - PILE.z) < PILE.r) {
          st.pile = 0.28
          emit(9, rt.sari.x, rt.sari.z, 0.45, 3.4, 1.7)
        }
      }
      if (st.burst !== rt.burst) {
        st.burst = rt.burst
        emit(38, rt.sari.x, rt.sari.z, 0.5, 4.6, 2.2)
      }
    } else st.burst = rt.burst
    for (let i = 0; i < pool.length; i++) {
      const k = pool[i]
      if (k.life <= 0) continue
      k.life -= dt
      if (k.y > 0.05 || k.vy > 0) {
        k.vy -= 7.5 * dt
        k.vx *= 1 - 1.4 * dt
        k.vz *= 1 - 1.4 * dt
        k.x += k.vx * dt
        k.y += k.vy * dt
        k.z += k.vz * dt
        k.ph += k.spin * dt
        if (k.y < 0.05) k.y = 0.05
      }
      const fade = Math.min(1, k.life / 0.35)
      _e.set(k.ph, k.ph * 0.7, k.ph * 1.3)
      mesh.setMatrixAt(i, k.life <= 0 ? _m.makeScale(0, 0, 0) : _m.compose(_p.set(k.x, k.y, k.z), _q.setFromEuler(_e), _s.setScalar(k.size * fade * away(cam, k.x, k.y, k.z))))
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return <primitive object={mesh} />
}
