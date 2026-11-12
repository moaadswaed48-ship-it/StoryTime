import { useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { LazyCanvas } from '@/design/LazyCanvas'
import { clampToYard, pushOut } from '../logic'
import { rt } from '../runtime'
import { useGame } from '../store'
import { FallingLeaves, KickedLeaves } from './Leaves3D'
import { Papers } from './Papers'
import { Player } from './Player'
import { HAZE } from './textures'
import { Backdrop, Ground, LeafCarpet, Shadows, Softwork, Tree, Woodwork } from './Yard'

const _p = new THREE.Vector3()

/** Tap or click the ground and Sari walks there; tapping a paper sends him to it. */
function onTap(e: ThreeEvent<PointerEvent>) {
  const game = useGame.getState()
  if (game.phase !== 'playing') return
  e.stopPropagation()
  let spot = { x: e.point.x, z: e.point.z }
  for (let i = 0; i < rt.papers.length; i++) {
    if (game.collected[i]) continue
    const p = rt.papers[i]
    if (e.ray.distanceToPoint(_p.set(p.x, 0.7, p.z)) < 0.75) spot = { x: p.x, z: p.z }
  }
  rt.target = clampToYard(pushOut(spot))
}

/** Keeps a few numbers for the QA hooks (draw calls must stay well under 60). */
function Stats() {
  useFrame(({ gl }) => {
    rt.calls = gl.info.render.calls
    rt.frames++
  })
  return null
}

function Fail({ onFail }: { onFail: () => void }) {
  useEffect(() => onFail(), [onFail])
  return null
}

/**
 * The yard in WebGL. Loaded lazily (three.js never ships with the first paint) and only while the game is open.
 * No tone mapping: the canvas-painted colours and the film still are shown exactly as authored.
 */
export default function World({ onFail, paused = false }: { onFail: () => void; paused?: boolean }) {
  return (
    // the play view always fills the screen, so the loop only stops while the view is fading out
    <LazyCanvas flat frameloop={paused ? 'never' : 'always'} camera={{ fov: 50, near: 0.1, far: 140, position: [0, 2.35, 8.6] }} fallback={<Fail onFail={onFail} />}>
      <color attach="background" args={['#f3cdb6']} />
      <fog attach="fog" args={[HAZE, 15, 54]} />
      <hemisphereLight args={['#fff0d8', '#a8683a', 2.1]} />
      <directionalLight position={[-5, 8, 6]} intensity={2.1} color="#ffd9ad" />
      <directionalLight position={[4, 5, -8]} intensity={1.5} color="#ff9c55" />
      <Backdrop />
      <Ground onTap={onTap} />
      <Shadows />
      <LeafCarpet />
      <Tree />
      <Woodwork />
      <Softwork />
      <FallingLeaves />
      <KickedLeaves />
      <Papers />
      <Player />
      <Stats />
    </LazyCanvas>
  )
}
