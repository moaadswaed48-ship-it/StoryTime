/**
 * وميض (Wameed): a shoebox-sized Moon rover — six wheels, one round eye on a short neck, one wing that opens like a
 * paper fan of seven petals. He has no mouth: he speaks in blinks, in the tilt of his neck and in wheel wiggles.
 * He always faces screen right (toward the Sun).
 */
import { C, Painter, blob, circle, clamp01, ellipse, lerp, mixHex, ramp, rrect } from './core'

export type Rover = {
  x: number
  y: number
  lift: number
  rot: number
  sq: number
  /** 0 = neck drooped in sleep, 1 = up and alert. */
  neck: number
  lookX: number
  lookY: number
  /** Eye light 0…1 and the eyelid (1 = shut). */
  glow: number
  lid: number
  /** The fan: 0 = folded flat on his back, 1 = all seven petals open. */
  sweep: number
  /** 1 = grey with dust, 0 = clean. */
  dust: number
  /** Wheel turn (radians) and a little forward/back roll (units). */
  roll: number
  /** 1 = facing screen right, −1 = facing left; in between he turns like a paper cut-out. */
  flip: number
}

export const roverRest: Rover = { x: 0, y: 0, lift: 0, rot: 0, sq: 1, neck: 0, lookX: 0, lookY: 0, glow: 0, lid: 1, sweep: 0, dust: 1, roll: 0, flip: 1 }

const HINGE = { x: -6, y: -86 }
const PETAL = 112
const NECK = { x: 46, y: -84 }

function eyeLocal(r: Rover) {
  const a = lerp(1.2, 0.12, r.neck)
  const len = lerp(27, 40, r.neck)
  return { x: NECK.x + Math.sin(a) * len, y: NECK.y - Math.cos(a) * len, a }
}
/** Where his eye is in the world (for the camera and for the light it throws). */
export function roverEye(r: Rover) {
  const e = eyeLocal(r)
  const cr = Math.cos(r.rot)
  const sr = Math.sin(r.rot)
  const x = (e.x / Math.sqrt(r.sq)) * r.flip
  const y = e.y * r.sq + 40
  return { x: r.x + x * cr - y * sr, y: r.y - r.lift - 40 + x * sr + y * cr }
}
/** Where the tip of petal `i` is in the world when it is at its open place (for dust shaken off the wing). */
export function petalTip(r: Rover, i: number) {
  const a = ((176 - i * 28) * Math.PI) / 180
  return { x: r.x + HINGE.x + Math.cos(a) * PETAL * 0.8, y: r.y - r.lift + HINGE.y - Math.sin(a) * PETAL * 0.8 }
}

export function drawRover(P: Painter, r: Rover) {
  const c = P.ctx
  const sil = P.light === 'sil'
  c.save()
  c.translate(r.x, r.y - r.lift)
  // tumble about the middle of the body, squash from the wheels up
  c.translate(0, -40)
  c.rotate(r.rot)
  c.translate(0, 40)
  c.scale(r.flip / Math.sqrt(r.sq), r.sq)

  const dusty = (hex: string, k = 0.8) => (r.dust > 0.01 ? mixHex(hex, C.dustMid, r.dust * k) : hex)

  // far-side wheels
  for (const x of [-39, 7, 53]) P.fill(circle(x, -21, 15), '#15182a', 0)

  // the wing behind the neck: a fan of seven petals; the leading one sweeps round and leaves the others in place
  const travelled = r.sweep * 168
  const widen = lerp(0.2, 1, ramp(r.sweep, 0, 0.1))
  const rise = lerp(180, 176, ramp(r.sweep, 0, 0.05))
  for (let i = 0; i < 7; i++) {
    const deg = rise - Math.min(travelled, i * 28)
    const a = (deg * Math.PI) / 180
    const hw = 29 * widen
    // each petal comes clean as it locks into place
    const dust = r.dust * (1 - ramp(travelled, i * 28 - 20, i * 28 + 4)) * (i === 0 ? 1 - ramp(r.sweep, 0.02, 0.2) : 1)
    c.save()
    c.translate(HINGE.x, HINGE.y)
    c.rotate(-a)
    const L = PETAL
    const petal = new Path2D()
    petal.moveTo(0, 0)
    petal.quadraticCurveTo(L * 0.45, -hw * 1.3, L * 0.9, -hw * 0.72)
    petal.quadraticCurveTo(L * 1.05, 0, L * 0.9, hw * 0.72)
    petal.quadraticCurveTo(L * 0.45, hw * 1.3, 0, 0)
    const base = i % 2 ? C.petalDark : C.petal
    P.fill(petal, dust > 0.01 ? mixHex(base, C.dustMid, dust * 0.9) : base, widen > 0.6 ? 2.2 : 1.2)
    if (!sil && widen > 0.5) {
      const v = new Path2D()
      v.moveTo(10, 0)
      v.lineTo(L * 0.93, 0)
      v.moveTo(L * 0.36, 0)
      v.quadraticCurveTo(L * 0.6, -hw * 0.25, L * 0.8, -hw * 0.5)
      v.moveTo(L * 0.36, 0)
      v.quadraticCurveTo(L * 0.6, hw * 0.25, L * 0.8, hw * 0.5)
      c.globalAlpha = (1 - dust) * (P.light === 'night' ? 0.55 : 1)
      c.strokeStyle = C.gold
      c.lineWidth = 2
      c.lineCap = 'round'
      c.stroke(v)
      c.globalAlpha = 1
    }
    c.restore()
  }
  // hinge
  P.fill(circle(HINGE.x, HINGE.y + 2, 9), dusty(C.dustMid, 0.4), 1.5)

  // undercarriage and body
  P.fill(rrect(-66, -42, 132, 20, 9), dusty(C.dustFar, 0.3), 2)
  const body = blob([-80, -34, -82, -80, -46, -88, 46, -88, 80, -78, 78, -34])
  P.fill(body, dusty(C.cream), 3)
  if (!sil) {
    c.save()
    P.flat(blob([-80, -36, -81, -52, 79, -52, 78, -36]), dusty(C.dustNear, 0.5))
    // dust lies on him in soft drifts until the Sun wakes him
    if (r.dust > 0.02) {
      c.globalAlpha = clamp01(r.dust * 1.2)
      for (const [x, y, rx, ry] of [[-48, -85, 30, 7], [10, -87, 40, 6], [56, -80, 20, 6], [-66, -62, 10, 14]]) P.flat(ellipse(x, y, rx, ry), C.dustFar)
      c.globalAlpha = 1
    }
    c.restore()
    // a round window of blue glass and two rivets: children's-drawing detail, no writing
    P.flat(circle(-44, -64, 10.5), dusty(C.sea, 0.6))
    P.flat(circle(-41, -67, 3.2), dusty('#9cc3ee', 0.6))
    P.flat(circle(-14, -64, 3.4), dusty(C.dustFar, 0.4))
    P.flat(circle(4, -64, 3.4), dusty(C.dustFar, 0.4))
    P.flat(rrect(76, -66, 9, 22, 4), dusty(C.dustMid, 0.4))
  }

  // near wheels with a hub mark that shows them turning
  for (const x of [-48, 0, 48]) {
    P.fill(circle(x, -17, 17.5), C.wheel, 2)
    if (!sil) {
      P.flat(circle(x, -17, 7.5), dusty(C.cream, 0.5))
      const sp = new Path2D()
      for (let q = 0; q < 3; q++) {
        const a = r.roll + (q * Math.PI * 2) / 3
        sp.moveTo(x + Math.cos(a) * 9.5, -17 + Math.sin(a) * 9.5)
        sp.lineTo(x + Math.cos(a) * 14, -17 + Math.sin(a) * 14)
      }
      P.line(sp, '#4a4f6c', 3)
    }
  }

  // neck and eye
  const e = eyeLocal(r)
  P.limb([NECK.x, NECK.y + 4, e.x, e.y], 11, dusty(C.dustMid, 0.4), 2)
  c.save()
  c.translate(e.x, e.y)
  c.rotate(e.a * 0.55)
  const R = 26
  P.fill(circle(0, 0, R), dusty(C.cream), 3)
  if (!sil) {
    const lx = r.lookX * 5
    const ly = r.lookY * 4
    c.fillStyle = P.light === 'night' ? '#0d1128' : '#161b3a'
    c.fill(circle(lx, ly, 18.5))
    const g = clamp01(r.glow)
    if (g > 0.01) {
      // his light is his own: it does not dim in the night
      c.globalAlpha = g
      c.fillStyle = C.gold
      c.fill(circle(lx, ly, 15.5))
      c.fillStyle = C.goldHot
      c.fill(circle(lx, ly, 9.5))
      c.globalAlpha = 1
    }
    c.fillStyle = g > 0.3 ? '#ffffff' : 'rgba(255,255,255,0.35)'
    c.fill(circle(lx + 6, ly - 6.5, 3.6))
    // eyelid: a cream shutter that comes down from above
    if (r.lid > 0.01) {
      c.save()
      c.clip(circle(lx, ly, 19.5))
      c.fillStyle = P.col(dusty(C.dustNear, 0.6))
      c.fillRect(lx - 22, ly - 22, 44, 44 * clamp01(r.lid))
      c.restore()
    }
    // a little visor, like a brow
    const v = new Path2D()
    v.arc(0, 0, R + 1, -2.5, -0.64)
    P.line(v, dusty(C.dustMid, 0.4), 6)
  }
  c.restore()
  c.restore()
}

/** The halo round his lit eye: two flat gold rings, drawn on top of everything near him. */
export function drawEyeHalo(P: Painter, r: Rover, strength = 1) {
  const g = clamp01(r.glow) * strength
  if (g < 0.02) return
  const e = roverEye(r)
  const c = P.ctx
  c.save()
  c.globalCompositeOperation = 'lighter'
  c.fillStyle = `rgba(233,213,138,${0.1 * g})`
  c.fill(circle(e.x, e.y, 30 + 58 * g))
  c.fillStyle = `rgba(233,213,138,${0.14 * g})`
  c.fill(circle(e.x, e.y, 26 + 26 * g))
  c.restore()
}
