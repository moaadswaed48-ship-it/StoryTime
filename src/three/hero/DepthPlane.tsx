import { useEffect, useMemo, useRef } from 'react'
import { asset } from '@/lib/asset'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { heroProgress, pointer } from '@/three/shared/progress'
import './depthMaterial' // registers <depthParallaxMaterial> with R3F (side effect — keep as a value import)
import type { DepthParallaxMaterial } from './depthMaterial'

const IMG = { w: 2576, h: 1664 }

/**
 * The hero photograph rendered as a depth-displaced plane that fills the hero View with object-fit: cover
 * semantics identical to the DOM <picture> underneath — so it fades in without any visible switch and then
 * parallaxes with the pointer and the scroll. Desktop full tier only.
 */
export function DepthPlane({ visible, focus }: { visible: { current: boolean }; focus: { px: number; py: number } }) {
  const [map, depth] = useTexture([asset('hero/hero-1920.webp'), asset('hero/hero-depth.png')])
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const matRef = useRef<InstanceType<typeof DepthParallaxMaterial>>(null)
  const mouse = useRef(new THREE.Vector2())

  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.minFilter = THREE.LinearFilter
    map.generateMipmaps = false
    depth.colorSpace = THREE.NoColorSpace
    depth.minFilter = THREE.LinearFilter
    depth.generateMipmaps = false
  }, [map, depth])

  // plane spans the full view at z = 0
  const dims = useMemo(() => {
    const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const aspect = size.width / Math.max(1, size.height)
    return { w: 2 * halfH * aspect, h: 2 * halfH, aspect }
  }, [camera, size.width, size.height])

  // object-fit: cover mapping (same math as the DOM image)
  const cover = useMemo(() => {
    const imgAspect = IMG.w / IMG.h
    let sx = 1, sy = 1
    if (dims.aspect > imgAspect) sy = imgAspect / dims.aspect
    else sx = dims.aspect / imgAspect
    const ox = (1 - sx) * focus.px
    const oy = (1 - sy) * (1 - focus.py)
    return new THREE.Vector4(sx, sy, ox, oy)
  }, [dims.aspect, focus.px, focus.py])

  useFrame((_, dtRaw) => {
    const m = matRef.current
    if (!m) return
    const dt = Math.min(dtRaw, 1 / 30)
    if (!visible.current) return
    const target = pointer.active ? pointer : { x: 0, y: 0 }
    mouse.current.x += (target.x - mouse.current.x) * (1 - Math.exp(-3 * dt))
    mouse.current.y += (target.y - mouse.current.y) * (1 - Math.exp(-3 * dt))
    m.uMouse.copy(mouse.current)
    m.uScroll = heroProgress.value
    m.uOpacity += (1 - m.uOpacity) * (1 - Math.exp(-4 * dt))
    m.uCover = cover
  })

  const scale = 1 + heroProgress.value * 0.06
  return (
    <mesh position={[0, 0, 0]} scale={[dims.w * scale, dims.h * scale, 1]} renderOrder={-1}>
      <planeGeometry args={[1, 1, 64, 40]} />
      <depthParallaxMaterial ref={matRef} uMap={map} uDepth={depth} transparent depthWrite={false} />
    </mesh>
  )
}
