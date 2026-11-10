import { useEffect, useRef, type RefObject } from 'react'
import { View, PerspectiveCamera } from '@react-three/drei'
import { useViewVisible } from '@/three/shared/useViewVisible'
import { Hudhud, type HudhudCtrl } from './Hudhud'

/** "Meet Hudhud" stage: drag to spin, tap to fan the crest. The View div is the gesture target. */
export default function MascotView({ ctrl, scarf }: { ctrl: RefObject<HudhudCtrl>; scarf: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useViewVisible(ref)
  useEffect(() => {
    const el = ref.current!
    let down: { x: number; yaw: number; moved: boolean } | null = null
    const pd = (e: PointerEvent) => {
      down = { x: e.clientX, yaw: ctrl.current.yaw, moved: false }
      el.setPointerCapture(e.pointerId)
    }
    const pm = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      ctrl.current.look.x = ((e.clientX - r.left) / r.width) * 2 - 1
      ctrl.current.look.y = ((e.clientY - r.top) / r.height) * 2 - 1
      if (!down) return
      const dx = e.clientX - down.x
      if (Math.abs(dx) > 6) down.moved = true
      ctrl.current.yaw = down.yaw + dx * 0.012
    }
    const pu = () => {
      if (down && !down.moved) {
        ctrl.current.crest = ctrl.current.crest > 0.8 ? 0.15 : 1
        ctrl.current.hop = 0.6
      }
      down = null
    }
    el.addEventListener('pointerdown', pd)
    el.addEventListener('pointermove', pm)
    el.addEventListener('pointerup', pu)
    el.addEventListener('pointercancel', pu)
    return () => {
      el.removeEventListener('pointerdown', pd)
      el.removeEventListener('pointermove', pm)
      el.removeEventListener('pointerup', pu)
      el.removeEventListener('pointercancel', pu)
    }
  }, [ctrl])
  return (
    <View ref={ref} className="view-target h-full w-full cursor-grab select-none" style={{ touchAction: 'pan-y' }} data-testid="mascot-view">
      <PerspectiveCamera makeDefault fov={30} position={[0, 0.35, 4.3]} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#fff3dc', '#b8804a', 0.9]} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.2} color="#fff0d6" />
      <directionalLight position={[-3, 2, -2.5]} intensity={1.6} color="#ffb070" />
      <group position={[0, -0.25, 0]}>
        <Hudhud ctrl={ctrl} scarf={scarf} visible={visible} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
          <circleGeometry args={[0.62, 40]} />
          <meshBasicMaterial color="#5a2e0c" transparent opacity={0.22} />
        </mesh>
      </group>
    </View>
  )
}
