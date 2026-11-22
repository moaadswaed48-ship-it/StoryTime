/**
 * Button pictures, drawn from the gestures themselves: each pictogram is the gesture's key moment on a small
 * stand-in body, run through the same solver as the 3D figures. So a button always shows what it does, and a new
 * gesture gets its picture for free. Marks around the body (motion lines, a note, a heart) help small children.
 */
import type { ReactNode } from 'react'
import { BUILDS, type Sheet } from '../cast/sheet.ts'
import { GESTURE_DEFS, gesturePose, type Act } from './gestures.ts'
import { REST, copyPose } from './pose.ts'
import { makeRig } from './rig.ts'
import { newSolved, solve } from './solver.ts'

const STAND_IN: Sheet = {
  id: 'pictogram',
  name: { ar: '', he: '', en: '', da: '' },
  stage: 'child',
  build: { ...BUILDS.child, heads: 3.4, shoulders: 1.35, girth: 0.6 },
  skin: '#000000',
  hair: { style: 'none', color: '#000000' },
  eyes: { color: '#000000', size: 0.5 },
  top: { style: 'tee', color: '#000000' },
  bottom: { style: 'shorts', color: '#000000' },
  shoes: { style: 'shoes', color: '#000000' },
  manner: '',
}

/** Which way each pictogram is seen from (degrees; 0 = from the front) and the moment it shows. */
const VIEW: Record<Act, { yaw: number; at?: number }> = {
  wave: { yaw: 0 },
  dance: { yaw: 0, at: 1.3 },
  jump: { yaw: 0 },
  clap: { yaw: 28, at: 0.7 },
  spin: { yaw: 0, at: 0.86 },
  bow: { yaw: 62 },
  cheer: { yaw: 0 },
  think: { yaw: -20 },
  peek: { yaw: 0 },
  hug: { yaw: 0 },
}

type Drawn = { body: string[]; arms: string[]; head: [number, number, number]; marks: ReactNode }
const cache = new Map<Act, Drawn>()

function draw(act: Act): Drawn {
  const hit = cache.get(act)
  if (hit) return hit
  const rig = makeRig(STAND_IN)
  const pose = copyPose(REST)
  const view = VIEW[act]
  gesturePose(act, view.at ?? GESTURE_DEFS[act].apex, pose)
  if (act === 'spin') pose.yaw = 0
  const s = solve(rig, pose, newSolved())
  const yaw = (view.yaw * Math.PI) / 180
  // 100 × 100 picture, ground at y = 92; the figure is drawn as large as its pose allows
  const flat = (v: { x: number; y: number; z: number }): [number, number] => [v.x * Math.cos(yaw) + v.z * Math.sin(yaw), v.y]
  const all = Object.values(s.at).map(flat)
  const top = Math.max(...all.map((p) => p[1])) + rig.headH * 0.12
  const xs = all.map((p) => p[0])
  const k = Math.min(80 / top, 84 / (Math.max(...xs) - Math.min(...xs) + rig.headH * 0.4), 74 / rig.H)
  const cx = act === 'think' || act === 'hug' || act === 'wave' ? 0 : (Math.max(...xs) + Math.min(...xs)) / 2
  const pt = (v: { x: number; y: number; z: number }): [number, number] => {
    const [x, y] = flat(v)
    return [50 + (x - cx) * k, 92 - y * k]
  }
  const line = (...names: (keyof typeof s.at)[]) => names.map((n, i) => `${i ? 'L' : 'M'}${pt(s.at[n]).map((c) => c.toFixed(1)).join(' ')}`).join('')
  const body = [line('hips', 'spine', 'chest', 'neck'), line('leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'leftToe'), line('rightUpperLeg', 'rightLowerLeg', 'rightFoot', 'rightToe')]
  const arms = [line('chest', 'leftUpperArm', 'leftLowerArm', 'leftHand', 'leftTip'), line('chest', 'rightUpperArm', 'rightLowerArm', 'rightHand', 'rightTip')]
  const crown = pt(s.at.crown)
  const base = pt(s.at.head)
  const r = Math.hypot(crown[0] - base[0], crown[1] - base[1]) * 0.54
  const head: [number, number, number] = [(crown[0] + base[0]) / 2, (crown[1] + base[1]) / 2 - r * 0.1, r]
  const hands = [pt(s.at.leftTip), pt(s.at.rightTip)]
  const out = { body, arms, head, marks: marks(act, head, hands) }
  cache.set(act, out)
  return out
}

function marks(act: Act, head: [number, number, number], hands: [number, number][]): ReactNode {
  const [hx, hy, hr] = head
  const thin = { fill: 'none', stroke: 'currentColor', strokeWidth: 3.2, strokeLinecap: 'round' as const, opacity: 0.55 }
  const spark = (x: number, y: number, a: number, len = 6, gap = 5) => {
    const c = Math.cos(a)
    const sn = Math.sin(a)
    return <path d={`M${x + c * gap} ${y + sn * gap}L${x + c * (gap + len)} ${y + sn * (gap + len)}`} {...thin} />
  }
  switch (act) {
    case 'wave': {
      const [x, y] = hands[1][1] < hands[0][1] ? hands[1] : hands[0]
      return (
        <>
          <path d={`M${x - 9} ${y - 7}q-5 6 -2 13`} {...thin} />
          <path d={`M${x + 8} ${y - 8}q6 5 5 13`} {...thin} />
        </>
      )
    }
    case 'dance':
      return (
        <g fill="currentColor" opacity={0.6}>
          <path d="M80 30v-16l10 3v4l-7 -2v12a4.5 3.6 0 1 1 -3 -3.4z" />
          <path d="M14 44v-13l8 2.4v3.4l-5.4 -1.6v9.6a3.8 3 0 1 1 -2.6 -2.8z" />
        </g>
      )
    case 'jump':
      return (
        <>
          <path d="M30 86l-4 5M50 88v5M70 86l4 5" {...thin} />
        </>
      )
    case 'clap': {
      const x = (hands[0][0] + hands[1][0]) / 2
      const y = Math.min(hands[0][1], hands[1][1])
      return (
        <>
          {spark(x, y, -Math.PI / 2, 6, 7)}
          {spark(x, y, -Math.PI / 2 - 0.75, 6, 8)}
          {spark(x, y, -Math.PI / 2 + 0.75, 6, 8)}
        </>
      )
    }
    case 'spin':
      return (
        <>
          <path d="M20 60a30 9 0 0 0 60 0" {...thin} />
          <path d="M80 60l-6 4M80 60l2.5 6.5" {...thin} />
          <path d="M24 54a30 9 0 0 1 20 -5" {...thin} strokeDasharray="1 7" />
        </>
      )
    case 'cheer':
      return (
        <>
          {spark(hands[0][0], hands[0][1], -Math.PI / 2 + 0.3, 5, 5)}
          {spark(hands[1][0], hands[1][1], -Math.PI / 2 - 0.3, 5, 5)}
          {spark(hx, hy - hr, -Math.PI / 2, 5, 4)}
        </>
      )
    case 'think':
      return (
        <g fill="currentColor" opacity={0.55}>
          <circle cx={hx + hr + 5} cy={hy - hr + 2} r={2.2} />
          <circle cx={hx + hr + 11} cy={hy - hr - 6} r={3.2} />
          <circle cx={hx + hr + 19} cy={hy - hr - 16} r={5.4} />
        </g>
      )
    case 'hug':
      return <path d="M78 22c0 -6 8 -6 8 0c0 -6 8 -6 8 0c0 6 -8 10 -8 12c0 -2 -8 -6 -8 -12z" fill="currentColor" opacity={0.6} transform="translate(-6 0)" />
    default:
      return null
  }
}

/**
 * The picture for a gesture button. Decorative: the button carries the label.
 * Arms are drawn over the body with a rim in the button's own colour (CSS variable --icon-bg), so a hand in front
 * of the chest or face still reads.
 */
export function GestureIcon({ act, className }: { act: Act; className?: string }) {
  const g = draw(act)
  const round = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path d="M18 94h64" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.22} />
      {g.marks}
      <path d={g.body[0]} {...round} stroke="currentColor" strokeWidth={17} />
      <path d={g.body[1]} {...round} stroke="currentColor" strokeWidth={8.5} />
      <path d={g.body[2]} {...round} stroke="currentColor" strokeWidth={8.5} />
      <circle cx={g.head[0]} cy={g.head[1]} r={g.head[2] + 2.2} fill="var(--icon-bg, #fff)" />
      <circle cx={g.head[0]} cy={g.head[1]} r={g.head[2]} fill="currentColor" />
      {g.arms.map((d, i) => (
        <g key={i}>
          <path d={d} {...round} stroke="var(--icon-bg, #fff)" strokeWidth={12} />
          <path d={d} {...round} stroke="currentColor" strokeWidth={7.5} />
        </g>
      ))}
    </svg>
  )
}

/** A small face for the character chooser, drawn from the sheet (skin, hair or head cover, eyes). */
export function FaceToken({ sheet, className }: { sheet: Sheet; className?: string }) {
  const h = sheet.hair
  const hairC = h.style === 'covered' ? (h.cover ?? h.color) : h.color
  const young = sheet.stage === 'toddler' || sheet.stage === 'child'
  const ey = young ? 54 : 50
  const er = 2.6 + sheet.eyes.size * 2.2
  const has = (e: string) => sheet.extras?.includes(e as never)
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      {(h.style === 'long' || h.style === 'bob') && <path d={h.style === 'long' ? 'M17 46c0 -40 66 -40 66 0v46h-66z' : 'M15 46c0 -40 70 -40 70 0v26c0 6 -70 6 -70 0z'} fill={hairC} />}
      {h.style === 'covered' && <path d="M12 50c0 -52 76 -52 76 0c0 26 -8 44 -8 44h-60s-8 -18 -8 -44z" fill={hairC} />}
      {h.style === 'ponytail' && <path d="M76 26c16 2 20 22 12 40c-2 -14 -8 -22 -16 -26z" fill={hairC} />}
      {h.style === 'bun' && <circle cx={50} cy={13} r={13} fill={hairC} />}
      {h.style === 'braids' && <path d="M17 50c-5 12 -5 26 0 40h9c-4 -14 -3 -26 0 -38zM83 50c5 12 5 26 0 40h-9c4 -14 3 -26 0 -38z" fill={hairC} />}
      <ellipse cx={50} cy={52} rx={31} ry={young ? 31 : 33} fill={sheet.skin} />
      {h.style === 'curls' && (
        <g fill={hairC}>
          {[[22, 34, 11], [32, 22, 12], [46, 16, 12], [60, 17, 12], [72, 26, 11], [80, 38, 10], [19, 47, 8]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      )}
      {h.style === 'tuft' && <path d="M40 24c2 -12 16 -14 18 -2c4 -6 10 -2 6 6c-8 -4 -16 -4 -24 -4z" fill={hairC} />}
      {['short', 'bob', 'long', 'braids', 'ponytail', 'bun'].includes(h.style) && <path d="M19 50c-4 -40 66 -40 62 0c-6 -14 -18 -20 -31 -20s-25 6 -31 20z" fill={hairC} />}
      {h.style === 'covered' && <path d="M19 52c-4 -42 66 -42 62 0c-6 -16 -18 -22 -31 -22s-25 6 -31 22zM22 66c8 22 48 22 56 0l2 14c-10 16 -50 16 -60 0z" fill={hairC} />}
      {has('hat') && <path d="M24 30c0 -26 52 -26 52 0zM8 32c0 -5 84 -5 84 0c0 5 -84 5 -84 0z" fill={sheet.extraColors?.hat ?? '#e7c583'} />}
      <circle cx={38} cy={ey} r={er} fill="#33262b" />
      <circle cx={62} cy={ey} r={er} fill="#33262b" />
      {has('glasses') && <path d="M27 54a11 11 0 1 0 22 0a11 11 0 1 0 -22 0M51 54a11 11 0 1 0 22 0a11 11 0 1 0 -22 0M49 52h2" transform={`translate(0 ${ey - 54})`} fill="none" stroke={sheet.extraColors?.glasses ?? '#4b3040'} strokeWidth={3} />}
      {has('beard') && <path d="M21 60c2 30 56 30 58 0c-8 12 -18 10 -29 10s-21 2 -29 -10z" fill={h.color} />}
      {has('moustache') && <path d="M36 68c6 -6 10 -4 14 0c4 -4 8 -6 14 0c-6 4 -10 3 -14 1c-4 2 -8 3 -14 -1z" fill={h.color} />}
      <path d="M42 70q8 7 16 0" fill="none" stroke="#33262b" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
