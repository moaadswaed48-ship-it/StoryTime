import { useEffect, useMemo, useRef } from 'react'
import { asset } from '@/lib/asset'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { makeFlyers, type Flyer } from './paths'
import { makeFlapMaterial } from './flapMaterial'
import { heroProgress, pointer } from '@/three/shared/progress'

const _pos = new THREE.Vector3()
const _tan = new THREE.Vector3()
const _up = new THREE.Vector3()
const _toCam = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()
const _ptr = new THREE.Vector3()
const _off = new THREE.Vector3()
const _mat = new THREE.Matrix4()
const WORLD_UP = new THREE.Vector3(0, 1, 0)

interface Props {
  near?: number
  far?: number
  visible: { current: boolean }
  frozen?: boolean
}

/** One InstancedMesh of flapping monarchs on seeded CatmullRom loops; rises and shrinks as the hero scrolls away. */
export function Butterflies({ near = 8, far = 10, visible, frozen = false }: Props) {
  const atlas = useTexture(asset('textures/wings-atlas-1024x512.png'))
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)

  const flyers = useMemo<Flyer[]>(() => [...makeFlyers(near, false, 1337), ...makeFlyers(far, true, 4242)], [near, far])
  const count = flyers.length
  const offsets = useMemo(() => flyers.map(() => new THREE.Vector3()), [flyers])

  const { geometry, material, uniforms } = useMemo(() => {
    atlas.colorSpace = THREE.SRGBColorSpace
    atlas.anisotropy = 4
    const geometry = new THREE.PlaneGeometry(2, 2, 12, 6).rotateX(Math.PI / 2) // head → +z, wings span ±x, lift along +y
    const phase = new Float32Array(count)
    const speed = new Float32Array(count)
    const amp = new Float32Array(count)
    const variant = new Float32Array(count)
    const fade = new Float32Array(count)
    flyers.forEach((f, i) => {
      phase[i] = f.flapPhase
      speed[i] = f.flapSpeed
      amp[i] = 1
      variant[i] = f.variant
      fade[i] = f.far ? 0.72 : 1
    })
    geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))
    geometry.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speed, 1))
    geometry.setAttribute('aAmp', new THREE.InstancedBufferAttribute(amp, 1))
    geometry.setAttribute('aVariant', new THREE.InstancedBufferAttribute(variant, 1))
    geometry.setAttribute('aFade', new THREE.InstancedBufferAttribute(fade, 1))
    const { mat, uniforms } = makeFlapMaterial(atlas)
    return { geometry, material: mat, uniforms }
  }, [atlas, flyers, count])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  const time = useRef(0)
  useFrame((_, dtRaw) => {
    const mesh = meshRef.current
    if (!mesh || !visible.current) return
    const dt = Math.min(dtRaw, 1 / 30)
    if (!frozen) time.current += dt
    const t = time.current
    uniforms.uTime.value = t
    const p = heroProgress.value
    // visible half-extents at z=0 for THIS view's camera (deterministic, independent of root canvas state)
    const dist = camera.position.z
    const halfH = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov ?? 30) / 2)
    const halfW = halfH * (size.width / Math.max(1, size.height))
    const rise = p * 1.2 * halfH
    const portrait = size.width < size.height
    const lift = portrait ? 0.45 * halfH : 0 // on phones the copy sits at the bottom: keep the flock in the sky
    const shrink = 1 - THREE.MathUtils.smoothstep(p, 0.5, 0.9)
    _ptr.set(pointer.x * halfW, pointer.y * halfH, 0)
    const ampAttr = geometry.getAttribute('aAmp') as THREE.InstancedBufferAttribute

    for (let i = 0; i < count; i++) {
      const f = flyers[i]
      const u = (t * f.speed + f.phase) % 1
      f.curve.getPointAt(u, _pos)
      f.curve.getTangentAt(u, _tan)
      _pos.x *= halfW
      _pos.y *= halfH
      _tan.x *= halfW
      _tan.y *= halfH
      _tan.normalize()

      // pointer repulsion (near flyers only, desktop)
      const off = offsets[i]
      if (!f.far && pointer.active) {
        _off.subVectors(_pos, _ptr)
        _off.z = 0
        const d = _off.length()
        if (d < 0.7 && d > 1e-4) _off.multiplyScalar(((0.7 - d) / d) * 0.9)
        else _off.set(0, 0, 0)
        off.lerp(_off, 1 - Math.exp(-4 * dt))
      } else off.lerp(_off.set(0, 0, 0), 1 - Math.exp(-2 * dt))
      _pos.add(off)
      _pos.y += rise + lift + Math.sin(t * 1.3 + f.flapPhase) * 0.03

      // orientation: head along the tangent, wing normal blended between world up and the camera (dorsal side shows)
      _toCam.subVectors(camera.position, _pos).normalize()
      _up.copy(WORLD_UP).multiplyScalar(0.35).addScaledVector(_toCam, 0.65).normalize()
      _m.lookAt(_s.copy(_pos).add(_tan), _pos, _up)
      _q.setFromRotationMatrix(_m)

      // glide envelope: flap hard for a while, then glide (wings nearly still and level)
      f.glideT += dt
      const cycle = f.glideT % f.glideLen
      const gliding = cycle > f.glideLen * 0.62
      const targetAmp = gliding ? 0.35 : 1
      f.amp += (targetAmp - f.amp) * (1 - Math.exp(-3 * dt))
      ampAttr.setX(i, f.amp)

      const sc = f.scale * halfH * 2 * shrink
      _s.set(sc, sc, sc)
      _mat.compose(_pos, _q, _s)
      mesh.setMatrixAt(i, _mat)
    }
    ampAttr.needsUpdate = true
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} />
}
