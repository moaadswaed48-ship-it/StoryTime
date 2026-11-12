import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { SariModel } from '@/design/SariModel'
import { mulberry32 } from '@/lib/seeded'
import { Acting } from './Acting'
import { REST_YAW, RUN_YAW, SCROLL_YAW, SIDE, wrapAngle, type Runtime } from './runtime'
import { LEAF_COLORS, leafTexture, ringTexture, softDisc } from './textures'

/** Lens: a long-ish portrait lens keeps a child's proportions honest. */
export const FOV = 24
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
/** His height with the curls (units). */
const TALL = 1.16
/** Wide layout: how far above the stage's bottom edge he stands (px), clear of the dock. */
const FEET = 172
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

const _e = new THREE.Euler(0, 0, 0, 'YXZ')
const _q = new THREE.Quaternion()
const _v = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _s = new THREE.Vector3()
const _c = new THREE.Color()

/**
 * Stage light, the way a character is lit for a poster:
 * a warm-white soft key from the upper side where the words are, an orange rim from behind on the far side
 * (the low autumn sun of the film), a gold kicker on the near shoulder, a slightly cool fill and a bounce from
 * the ground so the shadow side never goes muddy and the hoodie stays mustard, the jeans teal.
 * A small painted environment gives the soft wrap; nothing is fetched.
 */
function Lights() {
  return (
    <>
      <hemisphereLight args={['#fff4e6', '#8c6a52', 1.0]} />
      <directionalLight position={[SIDE * 2.6, 3.4, 3.2]} intensity={2.25} color="#fff1de" />
      <directionalLight position={[-SIDE * 2.6, 2.3, -3.1]} intensity={5.2} color="#ff8433" />
      <directionalLight position={[SIDE * 3.2, 1.6, -2.4]} intensity={1.3} color="#ffc27a" />
      <Environment resolution={128} frames={1}>
        <color attach="background" args={['#1d1814']} />
        <Lightformer form="rect" intensity={2.6} color="#fff3e2" position={[SIDE * 4, 4.5, 4]} scale={[7, 6, 1]} target={[0, 0.6, 0]} />
        {/* the fill is a touch cool, so the jeans keep their teal and the shadow side stays clean */}
        <Lightformer form="rect" intensity={1.15} color="#e4ecff" position={[-SIDE * 5, 1.5, 3]} scale={[5, 5, 1]} target={[0, 0.6, 0]} />
        <Lightformer form="rect" intensity={5} color="#ff8a3c" position={[-SIDE * 3.5, 3, -5]} scale={[4, 7, 1]} target={[0, 0.6, 0]} />
        <Lightformer form="circle" intensity={1.0} color="#c98a5a" position={[0, -3, 0]} scale={[12, 12, 1]} target={[0, 0.6, 0]} />
      </Environment>
    </>
  )
}

/**
 * The one clock of the stage. Every frame it settles the turn (throw, easing home, scroll, entrance, run),
 * frames him for the stage's shape, lets the camera lean with the pointer, and slides the giant word in the page behind.
 */
function Director({ rt, turntable }: { rt: Runtime; turntable: React.RefObject<THREE.Group | null> }) {
  const s = useRef({ scroll: 0, run: 0, px: 0, py: 0, wordX: 0, wordY: 0 })
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const now = performance.now()
    const v = s.current
    const calm = rt.reduced

    // the visitor's turn: a throw keeps going and slows; a few seconds later he eases back to the front
    if (!rt.dragging) {
      if (rt.vel) {
        rt.yaw += rt.vel * dt
        rt.vel *= Math.exp(-3.2 * dt)
        if (Math.abs(rt.vel) < 0.02 || calm) rt.vel = 0
      }
      if (!rt.hold && now - rt.lastInput > 2600) {
        rt.yaw = wrapAngle(rt.yaw)
        rt.yaw += (0 - rt.yaw) * (calm ? 1 : damp(2.3, dt))
        if (Math.abs(rt.yaw) < 0.0005) rt.yaw = 0
      }
    }

    // smoothed inputs
    rt.run += ((rt.action === 'run' ? 1 : 0) - rt.run) * damp(4.5, dt)
    if (rt.run < 0.001 && rt.action !== 'run') rt.run = 0
    v.run += ((rt.action === 'run' ? RUN_YAW : 0) - v.run) * damp(5, dt)
    v.scroll += ((calm ? 0 : rt.scroll) - v.scroll) * (calm ? 1 : damp(7, dt))
    v.px += ((calm ? 0 : rt.px) - v.px) * damp(6, dt)
    v.py += ((calm ? 0 : rt.py) - v.py) * damp(6, dt)

    // entrance: he turns in from the side and comes up to size
    const intro = calm ? 1 : rt.introAt ? easeOutExpo(Math.min(1, (now - rt.introAt) / 1700)) : 0
    const g = turntable.current
    if (g) {
      rt.shown = REST_YAW + rt.yaw + v.run + v.scroll * SCROLL_YAW * -SIDE + (1 - intro) * -1.25 * SIDE
      g.rotation.y = rt.shown
      // a tap lands at once: he bobs up like a nudged toy while the wave is still rising
      if (rt.pop > 0) rt.pop = rt.pop < 0.004 ? 0 : rt.pop * Math.exp(-6 * dt)
      const size = 0.93 + 0.07 * intro
      g.scale.set(size * (1 - 0.018 * rt.pop), size * (1 + 0.045 * rt.pop), size * (1 - 0.018 * rt.pop))
      // a runner leans into the run
      g.rotation.x = rt.run * 0.05
    }

    // framing. Wide layout: he stands between the nav (84px) and the dock that floats over the foot of the stage.
    // Stacked layout: he fills the stage, but a narrow stage never crops his arms.
    const { camera, size } = state
    const aspect = size.width / Math.max(1, size.height)
    // (short laptops keep more air above his curls, so they never touch the nav)
    const fill = rt.docked ? THREE.MathUtils.clamp((size.height - (size.height < 760 ? 270 : 250)) / size.height, 0.58, 0.79) : 0.8
    const feet = rt.docked ? FEET / size.height : 0.15
    const dist = Math.max(TALL / fill / (2 * TAN), (size.width < 560 ? 1.12 : rt.docked ? 1.25 : 1.42) / (2 * TAN * aspect))
    const viewH = 2 * dist * TAN
    const cy = viewH * (0.5 - feet)
    camera.position.set(v.px * 0.16, cy + 0.42 - v.py * 0.06, dist)
    camera.lookAt(v.px * 0.02, cy, 0)

    // the giant word behind him: slides away from the pointer, drifts with the scroll, and rushes past while he runs
    const word = rt.word
    if (word) {
      if (rt.run > 0 && !calm) rt.slide += -SIDE * rt.run * Math.min(520, size.width * 0.42) * dt
      if (rt.pitch > 0) {
        if (rt.action !== 'run') {
          // coming to rest: glide to the nearest whole word so one copy is centred again
          const home = Math.round(rt.slide / rt.pitch) * rt.pitch
          rt.slide += (home - rt.slide) * damp(3.2, dt)
          if (Math.abs(home - rt.slide) < 0.3 && rt.run === 0) rt.slide = 0
        }
        const half = rt.pitch / 2
        rt.slide = ((((rt.slide + half) % rt.pitch) + rt.pitch) % rt.pitch) - half
      }
      const x = rt.slide - v.px * 16
      const y = v.scroll * -64 + v.py * 8
      if (Math.abs(x - v.wordX) > 0.05 || Math.abs(y - v.wordY) > 0.05) {
        v.wordX = x
        v.wordY = y
        word.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), ${y.toFixed(2)}px, 0)`
      }
    }
    rt.calls = state.gl.info.render.calls
    rt.frames++
  })
  return null
}

/** Tells the page the model is on stage (inside the Suspense boundary, so it mounts with him). */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady])
  return null
}

/**
 * What he stands on: a round pool of warm light, a fine turntable ring that turns with him (and spins under his
 * feet while he runs), a soft body shadow and a tight contact shadow under each shoe that fades as the foot lifts.
 */
function Floor({ rt, turntable }: { rt: Runtime; turntable: React.RefObject<THREE.Group | null> }) {
  const tex = useMemo(
    () => ({
      pool: softDisc([[0, 0.95], [0.18, 0.62], [0.45, 0.24], [0.75, 0.06], [1, 0]]),
      ring: ringTexture(),
      shade: softDisc([[0, 0.92], [0.35, 0.6], [0.7, 0.16], [1, 0]]),
    }),
    [],
  )
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex])
  // the ring dips out of sight before it reaches the dock, so no tick ever pokes out around the glass
  const fade = useMemo(() => ({ value: new THREE.Vector2(-2, -1) }), [])
  const ringMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ map: tex.ring, color: '#ffd9ae', transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uFade = fade
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', 'uniform vec2 uFade;\nvoid main() {')
        .replace('#include <opaque_fragment>', '#include <opaque_fragment>\n\tgl_FragColor.a *= smoothstep( uFade.x, uFade.y, gl_FragCoord.y );')
    }
    return m
  }, [tex, fade])
  useEffect(() => () => ringMat.dispose(), [ringMat])
  const ring = useRef<THREE.Mesh>(null)
  const body = useRef<THREE.Mesh>(null)
  const feet = useRef<Array<THREE.Mesh | null>>([null, null])
  const bones = useRef<Array<THREE.Object3D | null>>([null, null])
  const ground = useRef([Infinity, Infinity])
  const spin = useRef(0)
  useFrame(({ viewport }, delta) => {
    const dt = Math.min(delta, 1 / 20)
    // (device pixels from the canvas' bottom edge; the dock's top is 118px up)
    if (rt.docked) fade.value.set(122 * viewport.dpr, 164 * viewport.dpr)
    else fade.value.set(-2, -1)
    // the ground runs back under a runner
    if (!rt.reduced) spin.current += rt.run * 2.6 * dt * SIDE
    if (ring.current) ring.current.rotation.z = rt.shown - RUN_YAW * rt.run + spin.current
    if (body.current) body.current.scale.setScalar(1 - rt.run * 0.12)
    const g = turntable.current
    if (!g) return
    rt.stride *= Math.exp(-1.5 * dt)
    for (let i = 0; i < 2; i++) {
      const bone = (bones.current[i] ??= g.getObjectByName(i ? 'RightToeBase' : 'LeftToeBase') ?? g.getObjectByName(i ? 'RightFoot' : 'LeftFoot') ?? null)
      const blob = feet.current[i]
      if (!bone || !blob) continue
      bone.getWorldPosition(_v)
      ground.current[i] = Math.min(ground.current[i], _v.y)
      const lift = THREE.MathUtils.clamp((_v.y - ground.current[i]) / 0.24, 0, 1)
      rt.stride = Math.max(rt.stride, lift)
      blob.position.set(_v.x, 0.004 + i * 0.0005, _v.z + 0.02)
      blob.scale.setScalar(1 + lift * 0.9)
      ;(blob.material as THREE.MeshBasicMaterial).opacity = 0.62 * (1 - lift) ** 1.5
    }
  })
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.001} renderOrder={1}>
        <planeGeometry args={[2.3, 2.3]} />
        <meshBasicMaterial map={tex.pool} color="#ffa552" transparent opacity={0.78} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.002} renderOrder={2}>
        <planeGeometry args={[1.26, 1.26]} />
        <primitive object={ringMat} attach="material" />
      </mesh>
      <mesh ref={body} rotation-x={-Math.PI / 2} position={[-SIDE * 0.05, 0.003, -0.03]} renderOrder={3}>
        <planeGeometry args={[1.25, 0.95]} />
        <meshBasicMaterial map={tex.shade} color="#140a04" transparent opacity={0.6} depthWrite={false} toneMapped={false} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} ref={(m) => void (feet.current[i] = m)} rotation-x={-Math.PI / 2} position={[i ? -0.09 : 0.09, 0.004, 0.02]} renderOrder={4}>
          <planeGeometry args={[0.3, 0.36]} />
          <meshBasicMaterial map={tex.shade} color="#0d0603" transparent opacity={0.62} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

interface Leaf {
  /** Place across and up the view at its depth, as shares (−1 … 1 and 0 … 1), so the field always fills the frame. */
  u: number
  v: number
  z: number
  fall: number
  sway: number
  ph: number
  spin: number
  size: number
  placed: boolean
}

/**
 * Autumn leaves in real depth: some drift behind him, some in front, a few large and out of focus near the lens.
 * At rest they fall slowly; while he runs the air rushes past and carries them the other way.
 */
function LeafField({ rt, count, soft = false }: { rt: Runtime; count: number; soft?: boolean }) {
  const mesh = useMemo(() => {
    const mat = soft
      ? new THREE.MeshBasicMaterial({ map: leafTexture(true), transparent: true, opacity: 0.36, depthWrite: false, side: THREE.DoubleSide })
      : new THREE.MeshLambertMaterial({ map: leafTexture(), alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide, emissive: '#8a3d10', emissiveIntensity: 0.55 })
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, count)
    m.frustumCulled = false
    m.renderOrder = soft ? 10 : 0
    return m
  }, [count, soft])
  const leaves = useMemo<Leaf[]>(() => {
    const rnd = mulberry32(soft ? 97 : 41)
    return Array.from({ length: count }, () => ({
      u: rnd() * 2 - 1,
      v: rnd(),
      z: soft ? 1.1 + rnd() * 0.7 : -2.8 + rnd() * 3.6,
      fall: 0.045 + rnd() * 0.06,
      sway: 0.35 + rnd() * 0.5,
      ph: rnd() * 6.283,
      spin: (rnd() - 0.5) * 1.1,
      size: soft ? 0.17 + rnd() * 0.07 : 0.085 + rnd() * 0.065,
      placed: false,
    }))
  }, [count, soft])
  useEffect(() => {
    const rnd = mulberry32(soft ? 98 : 42)
    // the out-of-focus ones stay orange and rust: a blurred yellow reads as a stain, not a leaf
    leaves.forEach((_, i) => mesh.setColorAt(i, _c.set(soft ? (rnd() < 0.5 ? LEAF_COLORS[0] : LEAF_COLORS[2]) : LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)])))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    return () => {
      mesh.geometry.dispose()
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.map?.dispose()
      mat.dispose()
    }
  }, [mesh, leaves, soft])
  const clock = useRef(0)
  useFrame(({ camera, size }, delta) => {
    const dt = rt.reduced ? 0 : Math.min(delta, 1 / 20)
    clock.current += dt
    const t = clock.current
    const aspect = size.width / Math.max(1, size.height)
    const wind = rt.run * (soft ? 2.6 : 1.7) * -SIDE
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i]
      // the slice of the view at this leaf's depth (a little wider than the frame, so leaves enter and leave off screen)
      const halfH = (camera.position.z - l.z) * TAN
      const halfW = halfH * aspect + l.size
      // where the floor cuts this slice: a leaf that lands shrinks away and a new one starts at the top
      const centre = camera.position.y - 0.42 * (1 - l.z / camera.position.z)
      const floor = THREE.MathUtils.clamp((0.02 - (centre - halfH)) / (halfH * 2), -0.08, 0.9)
      if (!l.placed) {
        l.v = floor + l.v * (1.05 - floor)
        l.placed = true
      }
      l.v -= (l.fall * (1 - rt.run * 0.5) * dt) / halfH
      l.u += ((Math.sin(t * l.sway + l.ph) * 0.03 + wind * (0.6 + l.sway * 0.7)) * dt) / halfW
      if (l.v < floor) {
        l.v = 1.08
        l.u = Math.sin(l.ph * 7.3 + t * 1.7) // somewhere new across the frame
      }
      if (l.u > 1) l.u -= 2
      else if (l.u < -1) l.u += 2
      let x = l.u * halfW
      let z = l.z
      let size = l.size
      // nothing crosses his face or lands on his shoes, standing or running
      if (soft) {
        // near the lens: at rest they keep to his sides; in the wind they thin out to nothing as they pass him
        if (Math.abs(x) < 0.72) x = THREE.MathUtils.lerp(x, (x < 0 ? -1 : 1) * (0.46 + Math.abs(x) * 0.361), 1 - rt.run)
        size *= 1 - rt.run * (1 - THREE.MathUtils.smoothstep(Math.abs(x), 0.22, 0.6))
      } else {
        // in his own depth: a leaf on the near side swoops round behind him as it comes to his body
        const near = THREE.MathUtils.smoothstep(l.z, -0.6, -0.1) * (1 - THREE.MathUtils.smoothstep(Math.abs(x), 0.34, 0.66))
        z = THREE.MathUtils.lerp(l.z, -0.62, near)
      }
      const y = centre - halfH + l.v * halfH * 2
      const landing = floor > -0.08 ? THREE.MathUtils.smoothstep((l.v - floor) * halfH * 2, 0, 0.16) : 1
      // they tumble but never turn edge-on for long, so each one reads as a leaf
      const a = t * l.spin + l.ph
      _e.set(Math.sin(a * 1.3) * 0.95 + rt.run * 0.5, Math.sin(a * 0.8 + 1.7) * 0.95, a * 0.6 + wind * 0.25)
      _m.compose(_v.set(x, y, z), _q.setFromEuler(_e), _s.setScalar(size * landing))
      mesh.setMatrixAt(i, _m)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return <primitive object={mesh} />
}

/** Everything inside the canvas. */
export function Scene({ rt, onReady }: { rt: Runtime; onReady: () => void }) {
  const turntable = useRef<THREE.Group>(null)
  return (
    <>
      <Lights />
      <Director rt={rt} turntable={turntable} />
      <Floor rt={rt} turntable={turntable} />
      <LeafField rt={rt} count={26} />
      <LeafField rt={rt} count={6} soft />
      <group ref={turntable} rotation-y={REST_YAW}>
        <Suspense fallback={null}>
          {/* SariModel draws him and breathes; what he does on this stage is acted on top (see Acting.tsx) */}
          <SariModel action="idle" />
          <Acting rt={rt} turntable={turntable} />
          <Ready onReady={onReady} />
        </Suspense>
      </group>
    </>
  )
}
