import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { SariModel, type SariAction } from '@/design/SariModel'
import { useSiteStore } from '@/store/useSiteStore'
import { sfx } from '@/audio/synth'
import { REACH, START, angleDelta, headingOf, stepWalker, touching } from '../logic'
import { rt } from '../runtime'
import { useGame, type Phase } from '../store'
import { ringTexture } from './textures'
import { shadowMaterial } from './Yard'

/** Where the camera sits relative to Sari, and what it looks at. Portrait phones get a higher, wider view. */
function rig(aspect: number, phase: Phase) {
  const portrait = aspect < 0.9
  if (phase === 'done') return portrait ? { ox: 0, oy: 1.55, oz: 4.9, ly: 1.02, lz: 0, fov: 50 } : { ox: 0, oy: 1.3, oz: 3.8, ly: 0.95, lz: 0, fov: 42 }
  if (portrait) return { ox: 0, oy: 3.5, oz: 7.3, ly: 1.3, lz: -0.6, fov: 66 }
  return { ox: 0, oy: 2.35, oz: 5.5, ly: 1.2, lz: -0.4, fov: 50 }
}

const _look = new THREE.Vector3()
const _pos = new THREE.Vector3()

/**
 * Sari and the camera that follows him.
 * A plain kinematic walker: stick/keys (screen space) or a tapped spot give a direction; he turns toward it,
 * runs, stays inside the fence and walks round the tree. Reaching a paper opens its question.
 */
export function Player() {
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const body = useRef<THREE.Group>(null!)
  const shadow = useRef<THREE.Mesh>(null!)
  const mark = useRef<THREE.Mesh>(null!)
  const [action, setAction] = useState<SariAction>('wave')
  const s = useRef({ action: 'wave' as SariAction, hello: 1.9, look: new THREE.Vector3(START.x, 1.2, START.z), first: true, fov: 50, markA: 0 })
  const shadowMat = useMemo(() => shadowMaterial(0.5), [])
  const markMat = useMemo(() => new THREE.MeshBasicMaterial({ map: ringTexture(), color: '#fff3e0', transparent: true, opacity: 0, depthWrite: false, fog: false }), [])
  useEffect(
    () => () => {
      shadowMat.dispose()
      markMat.dispose()
    },
    [shadowMat, markMat],
  )
  const round = useGame((g) => g.round)
  useEffect(() => {
    // a new round: wave hello again and let the camera jump to the start
    s.current.hello = 1.9
    s.current.first = true
  }, [round])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const st = s.current
    const game = useGame.getState()
    const phase = game.phase
    const me = rt.sari

    // ── input → direction on the ground (x right, z toward the camera)
    let dx = 0
    let dz = 0
    if (phase === 'playing') {
      dx = rt.keys.x + rt.stick.x
      dz = -(rt.keys.y + rt.stick.y)
      const pushed = Math.hypot(dx, dz)
      if (pushed > 0.14) rt.target = null
      else {
        dx = dz = 0
        if (rt.target) {
          const tx = rt.target.x - me.x
          const tz = rt.target.z - me.z
          const d = Math.hypot(tx, tz)
          if (d < 0.14) rt.target = null
          else {
            const pace = Math.min(1, 0.45 + d / 1.2)
            dx = (tx / d) * pace
            dz = (tz / d) * pace
          }
        }
      }
    } else rt.target = null
    const len = Math.hypot(dx, dz)
    const moving = len > 0.14
    if (moving) {
      const before = { x: me.x, z: me.z }
      const next = stepWalker(before, { x: dx, z: dz }, dt)
      me.x = next.x
      me.z = next.z
      me.heading += angleDelta(me.heading, headingOf({ x: dx, z: dz })) * (1 - Math.exp(-13 * dt))
      if (st.hello > 0) st.hello = 0
      game.setMoved()
      // blocked by the fence while walking to a tapped spot: stop there
      if (rt.target && Math.hypot(next.x - before.x, next.z - before.z) < 0.2 * dt) rt.target = null
    } else if (phase === 'done' || st.hello > 0) {
      me.heading += angleDelta(me.heading, 0) * (1 - Math.exp(-6 * dt)) // face the camera
    }
    me.moving = moving
    if (st.hello > 0) st.hello -= dt

    // ── reaching a paper
    if (phase === 'playing') {
      for (let i = 0; i < rt.papers.length; i++) {
        if (!game.collected[i] && touching(me, rt.papers[i], REACH)) {
          rt.target = null
          me.moving = false
          sfx.pop()
          game.touch(i)
          break
        }
      }
    }

    // ── pose
    const want: SariAction = phase === 'done' ? 'wave' : moving ? 'run' : st.hello > 0 ? 'wave' : 'idle'
    if (want !== st.action) {
      st.action = want
      setAction(want)
    }
    body.current.position.set(me.x, 0, me.z)
    body.current.rotation.y = me.heading
    shadow.current.position.set(me.x + 0.14, 0.085, me.z + 0.1)

    // ── tapped spot
    st.markA += ((rt.target ? 0.9 : 0) - st.markA) * (1 - Math.exp(-10 * dt))
    markMat.opacity = st.markA
    mark.current.visible = st.markA > 0.02
    if (rt.target) mark.current.position.set(rt.target.x, 0.09, rt.target.z)

    // ── camera: behind and above, a little late
    const cam = state.camera as THREE.PerspectiveCamera
    const r = rig(state.size.width / state.size.height, phase)
    _pos.set(me.x + r.ox, r.oy, me.z + r.oz)
    _look.set(me.x, r.ly, me.z + r.lz)
    const far = cam.position.distanceTo(_pos) > 9
    if (st.first || reduced || far) {
      cam.position.copy(_pos)
      st.look.copy(_look)
      st.fov = r.fov
      st.first = false
    } else {
      const k = 1 - Math.exp(-(phase === 'done' ? 2.2 : 3.6) * dt)
      cam.position.lerp(_pos, k)
      st.look.lerp(_look, 1 - Math.exp(-5 * dt))
      st.fov += (r.fov - st.fov) * k
    }
    if (Math.abs(cam.fov - st.fov) > 0.01) {
      cam.fov = st.fov
      cam.updateProjectionMatrix()
    }
    cam.lookAt(st.look)
  })

  return (
    <>
      <group ref={body} position={[START.x, 0, START.z]}>
        <Suspense fallback={null}>
          <SariModel action={action} speed={1.12} />
          <Ready />
        </Suspense>
      </group>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} scale={[1.25, 0.95, 1]} material={shadowMat} renderOrder={4}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={mark} rotation-x={-Math.PI / 2} material={markMat} renderOrder={5} visible={false}>
        <planeGeometry args={[0.9, 0.9]} />
      </mesh>
    </>
  )
}

/** Mounted once the model has loaded: two frames later the world reports that it is ready to be shown. */
function Ready() {
  const frames = useRef(0)
  useFrame(() => {
    if (frames.current < 0) return
    if (++frames.current >= 2) {
      frames.current = -1
      useGame.getState().setReady(true)
    }
  })
  return null
}
