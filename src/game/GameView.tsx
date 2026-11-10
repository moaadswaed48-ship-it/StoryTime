import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { View, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useViewVisible } from '@/three/shared/useViewVisible'
import { Hudhud, makeCtrl } from '@/three/mascot/Hudhud'
import { dirSign, locale } from '@/i18n/locale'
import { mulberry32 } from '@/lib/seeded'
import { sfx } from '@/audio/synth'
import { exposeQA } from '@/three/shared/qa'
import { newRound, catchLetter, isDone, pickLetter, type Round } from './logic'

export interface GameState { nameIdx: number; got: number; leaves: number; done: boolean }
export interface GameBus { running: boolean; targetY: number; names: string[]; onState: (s: GameState) => void; restart: number }

const COLORS = ['#e2711d', '#f4a72c', '#c8421f', '#d9902f']
const texCache = new Map<string, THREE.CanvasTexture>()
function leafTexture(ch: string, color: string): THREE.CanvasTexture {
  const key = ch + color
  const hit = texCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = 160
  const x = c.getContext('2d')!
  x.translate(80, 80)
  x.fillStyle = color
  x.beginPath()
  x.moveTo(0, -72)
  x.bezierCurveTo(70, -40, 58, 44, 0, 72)
  x.bezierCurveTo(-58, 44, -70, -40, 0, -72)
  x.fill()
  x.strokeStyle = 'rgba(90,40,0,.45)'
  x.lineWidth = 4
  x.stroke()
  x.fillStyle = '#fffaf0'
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.direction = locale === 'ar' ? 'rtl' : 'ltr'
  x.font = locale === 'ar' ? "700 76px 'Noto Naskh Arabic', serif" : "800 70px 'Manrope Variable', sans-serif"
  x.fillText(ch, 0, locale === 'ar' ? -4 : 4)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  texCache.set(key, t)
  return t
}

interface Leaf { x: number; y: number; ch: string; live: boolean; spin: number; vy: number }
const POOL = 9

function World({ bus, visible }: { bus: RefObject<GameBus>; visible: RefObject<boolean> }) {
  const size = useThree((s) => s.size)
  const ctrl = useRef(makeCtrl())
  const bird = useRef<THREE.Group>(null)
  const meshes = useRef<(THREE.Mesh | null)[]>([])
  const sim = useRef({ leaves: Array.from({ length: POOL }, (): Leaf => ({ x: 0, y: 0, ch: '', live: false, spin: 0, vy: 0 })), round: null as Round | null, nameIdx: 0, caught: 0, y: 0, t: 0, next: 0.4, rand: mulberry32(11), seenRestart: -1, cheer: 0 })
  const geo = useMemo(() => new THREE.PlaneGeometry(0.62, 0.62), [])
  const mats = useMemo(() => Array.from({ length: POOL }, () => new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.2, side: THREE.DoubleSide })), [])

  useEffect(() => {
    document.fonts?.load("700 76px 'Noto Naskh Arabic'").catch(() => undefined)
    exposeQA({ game: { state: () => ({ nameIdx: sim.current.nameIdx, got: sim.current.round?.got ?? 0, leaves: sim.current.caught }), wanted: () => sim.current.round?.letters[sim.current.round.got] ?? null, positions: () => sim.current.leaves.filter((l) => l.live).map((l) => ({ x: l.x, y: l.y, ch: l.ch })), halfH: () => 4.29 / 2 } })
  }, [])

  useFrame((_, delta) => {
    if (!visible.current) return
    const b = bus.current
    const s = sim.current
    const dt = Math.min(delta, 1 / 30)
    const halfH = 2.05
    const halfW = halfH * (size.width / Math.max(1, size.height))
    const px = -dirSign * halfW * 0.56
    ctrl.current.fly = b.running
    ctrl.current.yaw = b.running ? dirSign * 1.25 : dirSign * 0.5
    if (b.restart !== s.seenRestart) {
      s.seenRestart = b.restart
      s.nameIdx = 0
      s.caught = 0
      s.round = newRound(b.names[0])
      s.leaves.forEach((l) => (l.live = false))
      s.next = 0.5
      b.onState({ nameIdx: 0, got: 0, leaves: 0, done: false })
    }
    s.t += dt
    s.y += (THREE.MathUtils.clamp(b.targetY, -halfH + 0.55, halfH - 0.55) - s.y) * (1 - Math.exp(-9 * dt))
    if (s.cheer > 0) {
      s.cheer -= dt
      ctrl.current.crest = 1
    } else ctrl.current.crest = 0.45
    bird.current!.position.set(px, s.y - 0.1, 0)
    bird.current!.rotation.z = THREE.MathUtils.clamp((b.targetY - s.y) * 0.25, -0.35, 0.35) * dirSign
    if (b.running && s.round) {
      s.next -= dt
      if (s.next <= 0) {
        const l = s.leaves.find((v) => !v.live)
        if (l) {
          const pool = Array.from(new Set(b.names.flatMap((n) => Array.from(n))))
          l.live = true
          l.ch = pickLetter(s.round, s.rand, pool)
          l.x = dirSign * (halfW + 0.5)
          l.y = (s.rand() * 2 - 1) * (halfH - 0.6)
          l.spin = (s.rand() - 0.5) * 2
          l.vy = (s.rand() - 0.5) * 0.3
          const i = s.leaves.indexOf(l)
          mats[i].map = leafTexture(l.ch, COLORS[i % COLORS.length])
          mats[i].needsUpdate = true
        }
        s.next = 0.75 + s.rand() * 0.5
      }
    }
    for (let i = 0; i < POOL; i++) {
      const l = s.leaves[i]
      const m = meshes.current[i]
      if (!m) continue
      m.visible = l.live
      if (!l.live) continue
      if (b.running) {
        l.x -= dirSign * 1.55 * dt
        l.y += (l.vy + Math.sin(s.t * 2 + i) * 0.25) * dt
      }
      m.position.set(l.x, l.y, 0.2)
      m.rotation.z = Math.sin(s.t * 1.5 + i) * 0.35 * l.spin
      if (b.running && s.round && Math.hypot(l.x - px, l.y - s.y) < 0.6) {
        l.live = false
        s.caught++
        if (catchLetter(s.round, l.ch)) {
          sfx.chime()
          s.cheer = 0.5
          if (isDone(s.round)) {
            sfx.win()
            s.nameIdx++
            if (s.nameIdx >= b.names.length) {
              b.running = false
              b.onState({ nameIdx: s.nameIdx - 1, got: s.round.got, leaves: s.caught, done: true })
              s.round = null
              continue
            }
            s.round = newRound(b.names[s.nameIdx])
            s.leaves.forEach((v) => (v.live = false))
          }
        } else sfx.pop()
        if (s.round) b.onState({ nameIdx: s.nameIdx, got: s.round.got, leaves: s.caught, done: false })
      } else if (l.x * dirSign < -halfW - 0.6) l.live = false
    }
  })

  return (
    <>
      <group ref={bird} scale={0.72}>
        <Hudhud ctrl={ctrl} visible={visible} />
      </group>
      {mats.map((m, i) => (
        <mesh key={i} ref={(el) => void (meshes.current[i] = el)} geometry={geo} material={m} visible={false} />
      ))}
    </>
  )
}

export default function GameView({ bus }: { bus: RefObject<GameBus> }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useViewVisible(ref)
  useEffect(() => {
    const el = ref.current!
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      bus.current.targetY = -(((e.clientY - r.top) / r.height) * 2 - 1) * 2.05
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerdown', move)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerdown', move)
    }
  }, [bus])
  return (
    <View ref={ref} className="view-target h-full w-full select-none" style={{ touchAction: 'none' }} data-testid="game-view">
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 7.65]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 4, 4]} intensity={2} color="#fff0d6" />
      <directionalLight position={[-3, 1, -2]} intensity={1.2} color="#ffb070" />
      <World bus={bus} visible={visible} />
    </View>
  )
}
