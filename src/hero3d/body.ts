/**
 * The figure's geometry: body, clothes, hair and extras, built from a sheet as rounded toy-like forms and merged
 * into one skinned mesh (vertex colours carry every colour, so no textures are needed).
 */
import * as THREE from 'three'
import type { Sheet } from '../cast/sheet.ts'
import { Part, blob, grid, merge, mix, roundEnd, smooth, tube, type Station, type Weights } from './mesh.ts'
import { BONE_INDEX as B, type Rig } from './rig.ts'

const X = new THREE.Vector3(1, 0, 0)
const Y = new THREE.Vector3(0, 1, 0)
const Zv = new THREE.Vector3(0, 0, 1)
const DEG = Math.PI / 180

export const col = (hex: string) => new THREE.Color(hex)
/** Lighter (t > 0, toward white) or darker (t < 0, toward a deep warm tone). */
export const tone = (c: THREE.Color, t: number) => (t >= 0 ? c.clone().lerp(new THREE.Color(1, 1, 1), t) : c.clone().lerp(new THREE.Color(0.05, 0.03, 0.06), -t))

/** Colours a sheet does not name are derived here, so the flat puppet and the 3D figure can agree on them. */
export function palette(sheet: Sheet) {
  const skin = col(sheet.skin)
  const top = col(sheet.top.color)
  const trim = sheet.top.trim ? col(sheet.top.trim) : tone(top, top.getHSL({ h: 0, s: 0, l: 0 }).l > 0.6 ? -0.22 : 0.42)
  const hair = col(sheet.hair.color)
  const blush = sheet.blush ? col(sheet.blush) : skin.clone().lerp(col('#e2566b'), 0.34)
  return {
    skin,
    blush,
    hair,
    cover: sheet.hair.cover ? col(sheet.hair.cover) : trim.clone(),
    top,
    trim,
    bottom: col(sheet.bottom.color),
    shoes: col(sheet.shoes.color),
    sole: tone(col(sheet.shoes.color), sheet.shoes.style === 'sandals' ? -0.25 : 0.55),
    eye: col(sheet.eyes.color),
    brow: sheet.brows ? col(sheet.brows.color) : tone(hair, sheet.hair.style === 'none' || sheet.hair.style === 'covered' ? -0.1 : -0.25),
    hat: col('#e8c57c'),
    scarf: trim.clone(),
    bag: col('#a8683c'),
    wood: col('#8a5a3a'),
    ink: col('#33262b'),
    white: col('#fffaf2'),
  }
}
export type Palette = ReturnType<typeof palette>

/** Smooth curve through (x, y) points: Catmull-Rom, held flat outside the range. */
function spline(pts: [number, number][]) {
  return (x: number) => {
    if (x <= pts[0][0]) return pts[0][1]
    const n = pts.length
    if (x >= pts[n - 1][0]) return pts[n - 1][1]
    let i = 1
    while (pts[i][0] < x) i++
    const p0 = pts[Math.max(0, i - 2)]
    const p1 = pts[i - 1]
    const p2 = pts[i]
    const p3 = pts[Math.min(n - 1, i + 1)]
    const t = (x - p1[0]) / (p2[0] - p1[0])
    const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0] || 1)) * (p2[0] - p1[0])
    const m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0] || 1)) * (p2[0] - p1[0])
    const t2 = t * t
    const t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2
  }
}

/** A stretch of a limb or the trunk covered by cloth: from `a` to `b` (in the tube's own measure), with a thickness. */
type Cover = { a: number; b: number; color: THREE.Color; pad: number; pattern?: boolean }
type Section = { p: THREE.Vector3; r: number; rv?: number }

/**
 * A tube whose surface changes colour and thickness where clothes begin and end (a small rolled hem at each edge).
 * Returns the part and, per row, whether that row is patterned cloth.
 */
function dressedTube(samples: number[], at: (t: number) => Section, base: THREE.Color, covers: Cover[], around: number, side: THREE.Vector3, ends: { start?: THREE.Vector3; end?: THREE.Vector3 }) {
  const lo = samples[0]
  const hi = samples[samples.length - 1]
  const cuts = covers.flatMap((c) => [c.a, c.b]).filter((t) => t > lo + 1e-4 && t < hi - 1e-4)
  const ts = [...samples.filter((t) => cuts.every((c) => Math.abs(c - t) > (hi - lo) * 0.012)), ...cuts].sort((a, b) => a - b)
  const state = (t: number) => {
    let s: Cover | null = null
    for (const c of covers) if (t >= c.a && t <= c.b) s = c
    return s
  }
  const st: Station[] = []
  const patterned: boolean[] = []
  const push = (sec: Section, c: THREE.Color, pad: number, pat: boolean) => {
    st.push({ p: sec.p, r: sec.r + pad, rv: sec.rv === undefined ? undefined : sec.rv + pad, c })
    patterned.push(pat)
  }
  const eps = (hi - lo) * 1e-3
  ts.forEach((t, i) => {
    const sec = at(t)
    const below = state(t - eps)
    const above = state(t + eps)
    const first = i === 0
    const last = i === ts.length - 1
    const s0 = first ? above : below
    const s1 = last ? below : above
    if (first && ends.start) {
      const c = s1?.color ?? base
      const pad = s1?.pad ?? 0
      for (const e of roundEnd(sec.p, ends.start, sec.r + pad, c, true, sec.rv === undefined ? undefined : sec.rv + pad).slice(0, -1)) {
        st.push(e)
        patterned.push(false)
      }
    }
    if (s0 === s1) push(sec, s0?.color ?? base, s0?.pad ?? 0, !!s0?.pattern)
    else {
      const p0 = s0?.pad ?? 0
      const p1 = s1?.pad ?? 0
      push(sec, s0?.color ?? base, p0, false)
      if (p0 > p1) push(sec, s0?.color ?? base, p1 + 0.0006, false)
      else push(sec, s1?.color ?? base, p0 + 0.0006, false)
      push(sec, s1?.color ?? base, p1, !!s1?.pattern)
    }
    if (last && ends.end) {
      const c = s0?.color ?? base
      const pad = s0?.pad ?? 0
      for (const e of roundEnd(sec.p, ends.end, sec.r + pad, c, false, sec.rv === undefined ? undefined : sec.rv + pad).slice(1)) {
        st.push(e)
        patterned.push(false)
      }
    }
  })
  return { part: tube(st, around, side), patterned }
}

const range = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))

/** Cloth pattern: repaints the cells of patterned rows. */
function applyPattern(part: Part, patterned: boolean[], pattern: Sheet['top']['pattern'], a: THREE.Color, b: THREE.Color, around: number): Part {
  if (!pattern || pattern === 'plain' || pattern === 'dots') return part
  const mid = a.clone().lerp(b, 0.5)
  let band = -1
  const bandOf = patterned.map((p, i) => (p && patterned[i + 1] ? ++band : -1))
  const step = Math.max(1, Math.round(around / 10))
  return part.paintCells((row, c) => {
    const k = bandOf[row]
    if (k === undefined || k < 0) return null
    if (pattern === 'stripes') return k % 2 ? b : a
    const u = k % 2
    const v = Math.floor(c / step) % 2
    return u + v === 0 ? a : u + v === 1 ? mid : b
  })
}

export type Built = {
  geometry: THREE.BufferGeometry
  /** Trunk surface: half-widths and centre at a height (for parts that sit on it). */
  trunk: (y: number) => { rx: number; rz: number; zc: number; pad: number }
}

export function buildBody(sheet: Sheet, rig: Rig, pal: Palette): Built {
  const parts: Part[] = []
  const j = rig.joint
  const { headH, hipY, shoulderY, torso } = rig
  const extras = new Set(sheet.extras ?? [])

  /* ───────── skin weights ───────── */
  const band = torso * 0.16
  const trunkW = (_x: number, y: number): Weights => {
    const a = smooth(j.spine.y - band, j.spine.y + band, y)
    const b = smooth(j.chest.y - band, j.chest.y + band, y)
    const c = smooth(j.neck.y - headH * 0.05, j.neck.y + headH * 0.07, y)
    const d = smooth(j.head.y - headH * 0.1, j.head.y + headH * 0.03, y)
    return [
      [B.hips, 1 - a],
      [B.spine, a * (1 - b)],
      [B.chest, a * b * (1 - c)],
      [B.neck, a * b * c * (1 - d)],
      [B.head, a * b * c * d],
    ]
  }
  const headW = (): Weights => [[B.head, 1]]
  /** Hair and cloth that hang below the chin follow the chest more and more. */
  const hangW = (_x: number, y: number): Weights => {
    const k = 0.8 * smooth(rig.chinY + headH * 0.05, rig.chinY - headH * 0.45, y)
    return [
      [B.head, 1 - k],
      [B.chest, k],
    ]
  }

  /* ───────── trunk ───────── */
  const top = sheet.top.style
  const bottom = sheet.bottom.style
  const yWaist = hipY + torso * 0.36
  const yCollar = j.neck.y + headH * 0.015
  const g = rig.girth
  const fy = (f: number) => hipY + torso * f
  const neckTop = rig.chinY + headH * 0.16
  const rxAt = spline([
    [fy(-0.2), rig.pelvisX * 0.55],
    [fy(-0.1), rig.pelvisX * 0.92],
    [fy(0.02), rig.pelvisX],
    [fy(0.36), rig.waistX],
    [fy(0.68), rig.chestX],
    [fy(0.9), rig.chestX * 0.97],
    [shoulderY + rig.armR * 0.25, rig.chestX * 0.84],
    [mix(shoulderY, j.neck.y, 0.75), mix(rig.chestX * 0.5, rig.neckR, 0.5)],
    [j.neck.y + headH * 0.03, rig.neckR * 1.04],
    [neckTop, rig.neckR],
  ])
  const rzAt = spline([
    [fy(-0.2), rig.pelvisX * 0.5 * rig.depth],
    [fy(-0.1), rig.pelvisX * 0.9 * rig.depth],
    [fy(0.02), rig.pelvisX * rig.depth],
    [fy(0.3), rig.waistX * (rig.depth + 0.1 * g)],
    [fy(0.68), rig.chestX * rig.depth * 0.95],
    [fy(0.9), rig.chestX * rig.depth * 0.88],
    [shoulderY + rig.armR * 0.25, rig.chestX * rig.depth * 0.72],
    [mix(shoulderY, j.neck.y, 0.75), rig.neckR * 1.15],
    [j.neck.y + headH * 0.03, rig.neckR * 1.02],
    [neckTop, rig.neckR],
  ])
  const zcAt = spline([
    [fy(-0.1), 0],
    [fy(0.28), rig.waistX * 0.13 * g],
    [fy(0.7), 0.004],
    [j.neck.y, -headH * 0.01],
    [neckTop, -headH * 0.02],
  ])

  const longTop = top === 'dress' || top === 'tunic' || top === 'coat'
  const padTop = rig.armR * ({ tee: 0.1, shirt: 0.11, jumper: 0.22, dress: 0.1, tunic: 0.14, coat: 0.28, apron: 0.1 } as const)[top]
  const padBottom = rig.thighR * 0.12
  const underTop = top === 'apron' ? pal.trim : pal.top
  const hemY = top === 'jumper' ? fy(0.14) : fy(0.24)
  const yBottomEnd = fy(-0.2)
  const trunkCovers: Cover[] = []
  if (longTop) trunkCovers.push({ a: -9, b: yCollar, color: pal.top, pad: padTop, pattern: true })
  else {
    const bc = bottom === 'none' ? pal.white : pal.bottom
    trunkCovers.push({ a: -9, b: yWaist, color: bc, pad: padBottom })
    trunkCovers.push({ a: hemY, b: yCollar, color: underTop, pad: padTop + padBottom * 0.4, pattern: top !== 'apron' })
    if (top === 'jumper') trunkCovers.push({ a: hemY, b: hemY + torso * 0.09, color: pal.trim, pad: padTop + padBottom * 0.4 + 0.002 })
    if (top === 'apron') trunkCovers.push({ a: yWaist - torso * 0.03, b: yWaist + torso * 0.04, color: pal.top, pad: padTop + padBottom * 0.4 + rig.line * 1.5 })
  }
  const trunkPad = (y: number) => {
    let p = 0
    for (const c of trunkCovers) if (y >= c.a && y <= c.b) p = c.pad
    return p
  }
  const trunk = (y: number) => ({ rx: rxAt(y), rz: rzAt(y), zc: zcAt(y), pad: trunkPad(y) })
  /** A point on the clothed trunk: angle 0 is the front, 90° the figure's left. */
  const onTrunk = (y: number, ang: number, lift = 0, out = new THREE.Vector3()) => {
    const t = trunk(y)
    return out.set(Math.sin(ang) * (t.rx + t.pad + lift), y, t.zc + Math.cos(ang) * (t.rz + t.pad + lift))
  }

  {
    const rows = range(yBottomEnd, neckTop, 26)
    const { part, patterned } = dressedTube(rows, (y) => ({ p: new THREE.Vector3(0, y, zcAt(y)), r: rxAt(y), rv: rzAt(y) }), pal.skin, trunkCovers, 24, X, { start: new THREE.Vector3(0, -1, 0) })
    parts.push(applyPattern(part, patterned, sheet.top.pattern, pal.top, pal.trim, 24).skin(trunkW))
  }

  // dots: little raised spots on the top
  if (sheet.top.pattern === 'dots') {
    const y0 = longTop ? fy(0.0) : hemY + torso * 0.08
    const y1 = fy(0.92)
    let k = 0
    for (let y = y0; y < y1; y += torso * 0.15, k++) {
      for (let a = 0; a < 6; a++) {
        const ang = ((a + (k % 2) * 0.5) / 6) * Math.PI * 2
        const c = onTrunk(y, ang, -rig.line * 1.2)
        parts.push(blob(c, rig.line * 2.6, rig.line * 2.6, rig.line * 2.6, pal.trim, 7, 4).skin(trunkW))
      }
    }
  }

  /* ───────── skirt, dress, tunic and coat flare ───────── */
  const flare = top === 'dress' ? { to: rig.kneeY + rig.legU * 0.08, wide: 1.62, color: pal.top } : top === 'coat' ? { to: rig.kneeY + rig.legU * 0.2, wide: 1.26, color: pal.top } : top === 'tunic' ? { to: hipY - rig.legU * 0.42, wide: 1.24, color: pal.top } : bottom === 'skirt' ? { to: rig.kneeY + rig.legU * 0.3, wide: 1.5, color: pal.bottom } : null
  if (flare) {
    const yTop = longTop ? fy(0.3) : yWaist - torso * 0.02
    const t0 = trunk(yTop)
    const pad0 = t0.pad + rig.line
    const hemRx = rig.pelvisX * flare.wide + rig.thighR * 0.25
    const hemRz = Math.max(rig.pelvisX * rig.depth * flare.wide, rig.thighR * 1.5)
    const under = tone(flare.color, -0.35)
    const n = 9
    const st: Station[] = [{ p: new THREE.Vector3(0, yTop + torso * 0.03, t0.zc), r: t0.rx * 0.8, rv: t0.rz * 0.8, c: flare.color }]
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1)
      const y = mix(yTop, flare.to, u)
      const e = Math.pow(u, 0.8)
      // follow the body down to the hips, then open out
      const body = trunk(Math.max(y, fy(-0.08)))
      const rx = mix(Math.max(t0.rx, body.rx) + pad0, hemRx, e)
      const rz = mix(Math.max(t0.rz, body.rz) + pad0, hemRz, e)
      const isTrim = sheet.top.trim && top !== 'coat' && flare.color === pal.top && u > 0.86
      st.push({ p: new THREE.Vector3(0, y, mix(t0.zc, 0, u)), r: rx, rv: rz, c: isTrim ? pal.trim : flare.color })
    }
    const last = st[st.length - 1]
    st.push({ p: last.p.clone(), r: last.r * 0.97, rv: last.rv! * 0.97, c: under })
    st.push({ p: last.p.clone().setY(last.p.y + rig.line), r: last.r * 0.5, rv: last.rv! * 0.5, c: under })
    const part = tube(st, 24, X)
    const patterned = st.map((s) => s.c === flare.color)
    const hipX = j.leftUpperLeg.x
    parts.push(
      applyPattern(part, flare.color === pal.top ? patterned : [], sheet.top.pattern, pal.top, pal.trim, 24).skin((x, y) => {
        const k = 0.62 * smooth(hipY + torso * 0.05, flare.to, y)
        const l = smooth(-hipX, hipX, x)
        const w = trunkW(x, y).map(([b, v]) => [b, v * (1 - k)] as [number, number])
        return [...w, [B.leftUpperLeg, k * l], [B.rightUpperLeg, k * (1 - l)]]
      }),
    )
  }

  /* ───────── collars, buttons, apron ───────── */
  const ringAround = (y: number, lift: number, thick: number, c: THREE.Color, tilt = 0, squash = 0.8) => {
    // a soft ring around the trunk at height y (collar, cuff-like bands)
    const rows = 7
    return grid(
      rows + 1,
      20,
      (row, cc, out) => {
        const ph = (row / rows) * Math.PI * 2
        const ang = (cc / 20) * Math.PI * 2
        const yy = y + Math.sin(ph) * thick * squash - Math.cos(ang) * tilt
        onTrunk(yy, ang, lift + Math.cos(ph) * thick, out)
        out.y = yy
      },
      () => c,
      { keepWinding: true },
    )
  }
  if (top === 'jumper') parts.push(ringAround(yCollar, rig.line, headH * 0.035, pal.trim, headH * 0.02).skin(trunkW))
  if (top === 'shirt') parts.push(ringAround(yCollar - headH * 0.01, rig.line * 0.5, headH * 0.03, tone(pal.top, 0.35), headH * 0.035, 0.6).skin(trunkW))
  if (top === 'coat') parts.push(ringAround(yCollar - headH * 0.02, rig.line, headH * 0.05, pal.trim, headH * 0.05, 0.7).skin(trunkW))
  if (top === 'dress' || top === 'tunic') parts.push(ringAround(yCollar - headH * 0.005, rig.line * 0.3, headH * 0.02, pal.trim, headH * 0.03, 0.6).skin(trunkW))
  if (top === 'shirt' || top === 'coat') {
    const n = top === 'coat' ? 3 : 4
    const from = top === 'coat' ? fy(0.2) : hemY + torso * 0.1
    for (let i = 0; i < n; i++) {
      const y = mix(from, fy(0.84), i / (n - 1))
      const r = rig.line * (top === 'coat' ? 3.2 : 2.2)
      parts.push(blob(onTrunk(y, 0, -r * 0.45), r, r, r, top === 'coat' ? pal.trim : tone(pal.top, 0.5), 8, 4).skin(trunkW))
    }
  }
  if (top === 'apron') {
    // bib and skirt panel on the front, with a neck strap
    const yTop = fy(0.82)
    const yEnd = hipY - rig.legU * 0.5
    const rows = 14
    const cols = 11
    const lift = rig.line * 1.6
    const half = (y: number) => mix(62, 30, smooth(yWaist, yWaist + torso * 0.14, y)) * DEG
    parts.push(
      grid(
        rows,
        cols,
        (row, cc, out) => {
          const y = mix(yEnd, yTop, row / (rows - 1))
          const edge = row === 0 || row === rows - 1 || cc === 0 || cc === cols - 1
          const ang = (cc / (cols - 1) - 0.5) * 2 * half(y)
          const yy = Math.max(y, fy(-0.12))
          onTrunk(yy, ang, edge ? rig.line * 0.2 : lift, out)
          if (y < yy) {
            // below the trunk the panel hangs straight, a little forward
            out.y = y
            out.z += (yy - y) * 0.12
          }
        },
        () => pal.top,
        { wrap: false, keepWinding: true },
      )
        .flip()
        .computeNormals()
        .skin((x, y) => {
          const k = 0.45 * smooth(hipY, yEnd, y)
          const l = smooth(-j.leftUpperLeg.x, j.leftUpperLeg.x, x)
          const w = trunkW(x, y).map(([b, v]) => [b, v * (1 - k)] as [number, number])
          return [...w, [B.leftUpperLeg, k * l], [B.rightUpperLeg, k * (1 - l)]]
        }),
    )
    for (const s of [1, -1]) {
      const a = onTrunk(yTop, s * 26 * DEG, lift * 0.6)
      const b = onTrunk(yCollar + headH * 0.01, s * 100 * DEG, lift * 0.4)
      const m = onTrunk(mix(yTop, yCollar, 0.6), s * 52 * DEG, lift * 0.8)
      const st: Station[] = [a, a.clone().lerp(m, 0.5), m, m.clone().lerp(b, 0.5), b].map((p) => ({ p, r: rig.line * 2.2, c: pal.top }))
      parts.push(tube(st, 6, Zv).skin(trunkW))
    }
  }

  /* ───────── arms and hands ───────── */
  const sleeve = ({ tee: 0.25, shirt: 0.96, jumper: 0.96, dress: 0.2, tunic: 0.8, coat: 0.96, apron: 0.55 } as const)[top]
  const sleevePad = Math.max(padTop, rig.armR * 0.1)
  for (const s of [1, -1]) {
    const side = s > 0 ? 'left' : 'right'
    const a = j[`${side}UpperArm`]
    const elbowX = j[`${side}LowerArm`].x
    const rAt = spline([
      [0, rig.armR],
      [0.52, rig.armR * 0.9],
      [1, rig.wristR],
    ])
    const covers: Cover[] = [{ a: -9, b: sleeve, color: underTop, pad: sleevePad, pattern: top !== 'apron' }]
    if (top === 'jumper' || top === 'coat') covers.push({ a: sleeve - 0.09, b: sleeve, color: pal.trim, pad: sleevePad + 0.0015 })
    if (top === 'shirt') covers.push({ a: sleeve - 0.07, b: sleeve, color: tone(pal.top, 0.35), pad: sleevePad + 0.001 })
    const { part, patterned } = dressedTube(range(0, 1, 15), (t) => ({ p: new THREE.Vector3(a.x + s * t * rig.arm, a.y, 0), r: rAt(t) }), pal.skin, covers, 14, Y, { start: new THREE.Vector3(-s, 0, 0), end: new THREE.Vector3(s, 0, 0) })
    const w = rig.armR * 1.1
    const iu = B[`${side}UpperArm`]
    const il = B[`${side}LowerArm`]
    parts.push(
      applyPattern(part, patterned, sheet.top.pattern, pal.top, pal.trim, 14).skin((x) => {
        const t = smooth(-w, w, s * (x - elbowX))
        return [
          [iu, 1 - t],
          [il, t],
        ]
      }),
    )
    // hand: a mitten with a thumb
    const wrist = j[`${side}Hand`]
    const r = rig.handR
    const ih = B[`${side}Hand`]
    parts.push(blob(new THREE.Vector3(wrist.x + s * r * 1.05, wrist.y, 0), r * 1.3, r * 0.66, r * 1.02, pal.skin, 12, 7).skin(() => [[ih, 1]]))
    parts.push(blob(new THREE.Vector3(wrist.x + s * r * 0.75, wrist.y - r * 0.05, r * 0.92), r * 0.6, r * 0.4, r * 0.48, pal.skin, 8, 5).skin(() => [[ih, 1]]))
  }

  /* ───────── legs and feet ───────── */
  const shoes = sheet.shoes.style
  for (const s of [1, -1]) {
    const side = s > 0 ? 'left' : 'right'
    const hip = j[`${side}UpperLeg`]
    const rAt = spline([
      [0, rig.thighR],
      [0.5, rig.thighR * 0.82],
      [0.8, rig.ankleR * 1.12],
      [1, rig.ankleR],
    ])
    const covers: Cover[] = []
    if (bottom === 'trousers') covers.push({ a: -9, b: 0.95, color: pal.bottom, pad: padBottom })
    else if (bottom === 'shorts') covers.push({ a: -9, b: 0.36, color: pal.bottom, pad: padBottom * 1.3 })
    else if (!longTop && bottom === 'none') covers.push({ a: -9, b: 0.1, color: pal.white, pad: padBottom })
    if (shoes === 'boots') covers.push({ a: 0.6, b: 9, color: pal.shoes, pad: padBottom * 1.5 })
    const { part } = dressedTube(range(0, 1, 15), (t) => ({ p: new THREE.Vector3(hip.x, hip.y - t * rig.leg, 0), r: rAt(t) }), pal.skin, covers, 14, X, { start: new THREE.Vector3(0, 1, 0), end: new THREE.Vector3(0, -1, 0) })
    const w = rig.thighR * 0.9
    const iu = B[`${side}UpperLeg`]
    const il = B[`${side}LowerLeg`]
    parts.push(
      part.skin((_x, y) => {
        const t = smooth(-w, w, rig.kneeY - y)
        return [
          [iu, 1 - t],
          [il, t],
        ]
      }),
    )

    // foot
    const ifoot = B[`${side}Foot`]
    const bare = shoes === 'bare' || shoes === 'sandals'
    const bulk = shoes === 'boots' ? 1.1 : bare ? 0.9 : 1
    const L = rig.footLen * (bare ? 0.94 : 1)
    const footAt = (u: number, ang: number, scale: number, out: THREE.Vector3) => {
      const round = Math.pow(1 - Math.pow(Math.abs(2 * u - 1), 3.2), 0.5)
      const wHalf = rig.footW * bulk * (0.8 + 0.3 * Math.sin(Math.PI * Math.pow(u, 0.8))) * round * scale
      const hTot = rig.footH * bulk * mix(1.02, 0.6, smooth(0.3, 0.9, u)) * mix(0.6, 1, round) * scale
      const hb = hTot * 0.24
      const sn = Math.sin(ang)
      return out.set(hip.x + Math.cos(ang) * wHalf, hb + (sn >= 0 ? sn * (hTot - hb) : sn * hb), -0.3 * L + u * L)
    }
    const rows = 9
    parts.push(
      grid(
        rows,
        14,
        (row, cc, out) => footAt(0.03 + (row / (rows - 1)) * 0.94, (cc / 14) * Math.PI * 2, 1, out),
        (_row, cc) => (bare ? pal.skin : Math.sin((cc / 14) * Math.PI * 2) < -0.5 ? pal.sole : pal.shoes),
        { capStart: true, capEnd: true },
      ).skin(() => [[ifoot, 1]]),
    )
    if (shoes === 'sandals') {
      parts.push(
        grid(
          rows,
          14,
          (row, cc, out) => {
            footAt(0.02 + (row / (rows - 1)) * 0.96, (cc / 14) * Math.PI * 2, 1.12, out)
            out.y = Math.min(out.y, rig.footH * 0.16)
          },
          () => pal.sole,
          { capStart: true, capEnd: true },
        ).skin(() => [[ifoot, 1]]),
      )
      for (const u of [0.42, 0.72]) {
        parts.push(
          grid(
            4,
            14,
            (row, cc, out) => {
              const k = row === 0 || row === 3 ? 1.02 : 1.1
              footAt(u + (row - 1.5) * 0.035, (cc / 14) * Math.PI * 2, k, out)
            },
            () => pal.shoes,
            { capStart: true, capEnd: true },
          ).skin(() => [[ifoot, 1]]),
        )
      }
    }
  }

  /* ───────── head ───────── */
  const C = rig.headC
  const hr = rig.head
  /** Radius of the head in a direction (an ellipsoid with fuller cheeks for the young). */
  const headR = (dx: number, dy: number, dz: number) => {
    const base = 1 / Math.sqrt((dx / hr.x) ** 2 + (dy / hr.y) ** 2 + (dz / hr.z) ** 2)
    const cheek = rig.stage === 'toddler' ? 0.05 : rig.stage === 'child' ? 0.035 : 0.012
    const low = Math.exp(-(((dy + 0.42) / 0.3) ** 2))
    return base * (1 + cheek * low * (0.6 + 0.4 * Math.abs(dx)))
  }
  const onHead = (lat: number, lon: number, add: number, out: THREE.Vector3) => {
    const dx = Math.cos(lat) * Math.sin(lon)
    const dy = Math.sin(lat)
    const dz = Math.cos(lat) * Math.cos(lon)
    const r = headR(dx, dy, dz) + add
    return out.set(C.x + dx * r, C.y + dy * r, C.z + dz * r)
  }
  parts.push(
    grid(
      13,
      22,
      (row, cc, out) => onHead(-Math.PI / 2 + ((row + 0.5) / 13) * Math.PI, (cc / 22) * Math.PI * 2, 0, out),
      () => pal.skin,
      { capStart: true, capEnd: true },
    ).skin(headW),
  )

  /* ───────── hair ───────── */
  const hair = sheet.hair.style
  const covered = hair === 'covered'
  const hairC = covered ? pal.cover : pal.hair
  type Shell = { edge: (lon: number) => number; thick: (lon: number, s: number) => number; flare?: (drop: number, lon: number) => number }
  /** A shell over the skull: from the crown (s = 0) down to the hairline `edge(lon)`; s > 1 hangs below the ears. */
  const shell = (sh: Shell, c: THREE.Color, rows = 12, around = 26, weights: (x: number, y: number, z: number) => Weights = hangW) => {
    const at = (s: number, lon: number, th: number, out: THREE.Vector3) => {
      if (s <= 1) return onHead((1 - s) * (Math.PI / 2), lon, th, out)
      const d = (s - 1) * headH
      onHead(0, lon, th, out)
      const k = sh.flare ? sh.flare(d / headH, lon) : 1
      out.x = C.x + (out.x - C.x) * k
      out.z = C.z + (out.z - C.z) * k
      out.y = C.y - d
      return out
    }
    return grid(
      rows + 2,
      around,
      (row, cc, out) => {
        const lon = (cc / around) * Math.PI * 2
        const e = sh.edge(lon > Math.PI ? lon - Math.PI * 2 : lon)
        if (row === 0) return void at(e, lon, -headH * 0.004, out)
        const v = (row - 1) / rows
        const s = e * (1 - v * 0.985)
        const th = sh.thick(lon, s) * headH * Math.min(1, 0.55 + v * 6)
        at(s, lon, th, out)
      },
      () => c,
      { capEnd: true, keepWinding: true },
    )
      .faceOutwardFrom(C)
      .computeNormals()
      .skin(weights)
  }
  /** Hairline that is `front` over the face and `side`/`back` further round (lon in −π … π, 0 = face). */
  const line = (front: number, side: number, back: number, faceHalf = 62, soft = 22) => (lon: number) => {
    const a = Math.abs(lon) / DEG
    const s1 = smooth(faceHalf - soft, faceHalf + soft * 0.4, a)
    const s2 = smooth(105, 165, a)
    return front + (side - front) * s1 + (back - side) * s2
  }
  const fringe = (amount: number, waves: number) => (lon: number) => amount * Math.cos(lon * waves) * smooth(70 * DEG, 30 * DEG, Math.abs(lon))

  if (hair === 'short' || hair === 'ponytail' || hair === 'bun' || hair === 'braids' || hair === 'curls') {
    const base = hair === 'curls' ? line(0.5, 1.1, 1.3) : hair === 'short' ? line(0.5, 1.04, 1.24) : line(0.46, 1.03, 1.22)
    const wave = hair === 'short' ? fringe(0.05, 5) : hair === 'braids' ? (lon: number) => -0.1 * Math.exp(-((lon / 0.16) ** 2)) : fringe(0.03, 3)
    parts.push(shell({ edge: (lon) => base(lon) + wave(lon), thick: () => (hair === 'curls' ? 0.05 : 0.045) }, hairC))
  }
  if (hair === 'tuft') {
    parts.push(shell({ edge: line(0.34, 0.5, 0.62), thick: () => 0.018 }, hairC, 6))
    for (const [dx, dz, r] of [[0, 0.02, 0.075], [0.05, -0.03, 0.055], [-0.045, -0.02, 0.05]] as const) {
      parts.push(blob(new THREE.Vector3(C.x + dx * headH, C.y + hr.y + r * headH * 0.55, C.z + dz * headH), r * headH, r * headH * 1.25, r * headH, hairC, 8, 5).skin(headW))
    }
  }
  if (hair === 'curls') {
    // bubbly curls: balls scattered over the cap
    let seed = 7
    for (const ch of sheet.id) seed = (seed * 31 + ch.charCodeAt(0)) % 9973
    const rnd = () => ((seed = (seed * 4871 + 1993) % 9973), seed / 9973)
    const v = new THREE.Vector3()
    const rings: [number, number][] = [[80, 5], [58, 9], [36, 12], [14, 13], [-6, 11]]
    for (const [latDeg, n] of rings) {
      for (let i = 0; i < n; i++) {
        const lon = ((i + rnd() * 0.5) / n) * Math.PI * 2
        const face = Math.abs(lon > Math.PI ? lon - Math.PI * 2 : lon) / DEG
        if (latDeg < 50 && face < 58) continue
        if (latDeg < 0 && face < 100) continue
        if (extras.has('hat') && latDeg > 30) continue
        const r = headH * (0.085 + rnd() * 0.03)
        onHead((latDeg + rnd() * 8) * DEG, lon, headH * 0.03, v)
        parts.push(blob(v.clone(), r, r, r, hairC, 8, 5).skin(headW))
      }
    }
  }
  if (hair === 'bob') {
    const base = line(0.56, 1.46, 1.46, 52, 16)
    parts.push(shell({ edge: (lon) => base(lon) + fringe(0.03, 7)(lon), thick: () => 0.06, flare: (d) => 1 + 0.07 * Math.sin(Math.min(1, d / 0.46) * Math.PI * 0.9) }, hairC, 14))
  }
  if (hair === 'long') {
    const base = (lon: number) => line(0.5, 1.6, 2.0, 52, 16)(lon)
    parts.push(shell({ edge: (lon) => base(lon) + fringe(0.04, 2)(lon), thick: () => 0.055, flare: (d) => 1 + 0.05 * Math.min(1, d) }, hairC, 16))
  }
  if (covered) {
    // head cover: a wrap with an opening for the face, falling to the shoulders, closed under the chin
    const base = line(0.44, 1.78, 1.84, 50, 14)
    parts.push(shell({ edge: base, thick: () => 0.05, flare: (d) => 1 + 0.16 * smooth(0.25, 0.8, d) }, hairC, 16))
    parts.push(
      grid(
        9,
        20,
        (row, cc, out) => {
          const u = row / 8
          const ang = (cc / 20) * Math.PI * 2
          const y = mix(rig.chinY + headH * 0.2, yCollar - headH * 0.12, u)
          const k = 1 + 0.5 * Math.sin(u * Math.PI * 0.5)
          const rx = mix(hr.x * 0.74, Math.max(rig.neckR * 2.1, rig.chestX * 0.8), u) * (u === 0 ? 0.6 : 1)
          const rz = mix(hr.z * 0.86, Math.max(rig.neckR * 1.9, rig.chestX * rig.depth * 0.86), u) * (u === 0 ? 0.6 : 1)
          out.set(Math.sin(ang) * rx, y, Math.cos(ang) * rz * (Math.cos(ang) > 0 ? 1 : 0.9) + headH * 0.02 * k)
        },
        () => hairC,
        { capStart: true, capEnd: true },
      ).skin((x, y) => {
        const k = smooth(rig.chinY + headH * 0.12, yCollar, y)
        return [
          [B.head, (1 - k) * 0.7],
          [B.neck, 0.3 * (1 - k) + 0.3 * k],
          [B.chest, 0.7 * k],
        ]
      }),
    )
  }
  if (hair === 'ponytail') {
    const v0 = onHead(38 * DEG, Math.PI, headH * 0.02, new THREE.Vector3())
    const st: Station[] = []
    for (let i = 0; i <= 8; i++) {
      const u = i / 8
      const p = new THREE.Vector3(0, v0.y + headH * (0.1 * Math.sin(u * 2.4) - 0.62 * u * u), v0.z - headH * (0.3 * Math.sin(u * 2.2)) + headH * 0.06 * u)
      st.push({ p, r: headH * mix(0.1, 0.035, u * u) * (i === 0 ? 0.75 : 1), c: hairC })
    }
    parts.push(tube(st, 10, X).skin(headW))
    parts.push(blob(v0.clone().add(new THREE.Vector3(0, headH * 0.02, -headH * 0.05)), headH * 0.085, headH * 0.05, headH * 0.085, pal.trim, 10, 5).skin(headW))
  }
  if (hair === 'bun') {
    const v0 = onHead(62 * DEG, Math.PI, headH * 0.1, new THREE.Vector3())
    parts.push(blob(v0, headH * 0.2, headH * 0.17, headH * 0.2, hairC, 12, 7).skin(headW))
  }
  if (hair === 'braids') {
    for (const s of [1, -1]) {
      const v0 = onHead(-12 * DEG, s * 108 * DEG, headH * 0.03, new THREE.Vector3())
      const n = 6
      for (let i = 0; i < n; i++) {
        const r = headH * mix(0.085, 0.06, i / (n - 1))
        const p = new THREE.Vector3(v0.x + s * headH * 0.02 * i, v0.y - headH * 0.115 * (i + 0.4), v0.z + headH * 0.045 * i)
        parts.push(blob(p, r, r * 0.92, r, i === n - 1 ? pal.trim : hairC, 8, 5).skin(hangW))
      }
    }
  }

  // ears, where the hair leaves them free
  if (!covered && hair !== 'bob' && hair !== 'long') {
    for (const s of [1, -1]) {
      const p = onHead((rig.eyeY * 0.5 - 0.1) * 0.9, s * 92 * DEG, -headH * 0.012, new THREE.Vector3())
      parts.push(blob(p, headH * 0.045, headH * 0.085, headH * 0.06, pal.skin, 8, 5).skin(headW))
    }
  }

  /* ───────── extras that are part of the body ───────── */
  if (extras.has('beard')) {
    const rows = 9
    const cols = 17
    const span = 104 * DEG
    parts.push(
      grid(
        rows,
        cols,
        (row, cc, out) => {
          const lon = (cc / (cols - 1) - 0.5) * 2 * span
          const a = Math.abs(lon) / span
          const topLat = mix(-37, -4, Math.pow(a, 1.6)) * DEG
          const lat = mix(topLat, -84 * DEG, row / (rows - 1))
          const edge = row === 0 || cc === 0 || cc === cols - 1
          const depthK = Math.sin((row / (rows - 1)) * Math.PI * 0.75)
          const th = edge ? -headH * 0.003 : headH * (0.03 + 0.11 * depthK * (1 - a * 0.75))
          onHead(lat, lon, th, out)
          if (!edge) out.y -= headH * 0.07 * depthK * (1 - a)
        },
        () => pal.hair,
        { wrap: false, keepWinding: true },
      )
        .faceOutwardFrom(C)
        .computeNormals()
        .skin(headW),
    )
  }
  if (extras.has('hat')) {
    const brimLat = 33 * DEG
    parts.push(shell({ edge: () => 1 - brimLat / (Math.PI / 2), thick: (_l, s) => 0.1 + 0.03 * (1 - s) }, pal.hat, 8, 24, headW))
    const v = new THREE.Vector3()
    const ringRows = 8
    parts.push(
      grid(
        ringRows + 1,
        24,
        (row, cc, out) => {
          const ph = (row / ringRows) * Math.PI * 2
          const lon = (cc / 24) * Math.PI * 2
          onHead(brimLat, lon, headH * 0.08, v)
          const reach = headH * 0.24
          const k = 1 + ((reach * (1 + Math.cos(ph))) / Math.hypot(v.x - C.x, v.z - C.z)) * 0.5
          out.set(C.x + (v.x - C.x) * k, v.y + Math.sin(ph) * headH * 0.022 - (k - 1) * headH * 0.1, C.z + (v.z - C.z) * k)
        },
        () => pal.hat,
        { keepWinding: true },
      )
        .faceOutwardFrom(C)
        .computeNormals()
        .skin(headW),
    )
    // band
    parts.push(shell({ edge: () => 1 - (brimLat + 3 * DEG) / (Math.PI / 2), thick: () => 0.118 }, pal.top, 2, 24, headW))
  }
  if (extras.has('scarf')) {
    parts.push(ringAround(yCollar + headH * 0.02, headH * 0.035, headH * 0.075, pal.scarf, headH * 0.03, 0.85).skin(trunkW))
    const a = onTrunk(yCollar - headH * 0.02, 28 * DEG, headH * 0.05)
    const st: Station[] = []
    for (let i = 0; i <= 6; i++) {
      const u = i / 6
      const y = a.y - u * torso * 0.5
      const p = onTrunk(y, 24 * DEG, headH * 0.035)
      st.push({ p, r: headH * 0.085 * (i === 6 || i === 0 ? 0.7 : 1), rv: headH * 0.03, c: i >= 5 ? tone(pal.scarf, -0.18) : pal.scarf })
    }
    parts.push(tube(st, 10, X).skin(trunkW))
  }
  if (extras.has('bag')) {
    // a satchel on the left hip with a cord over the right shoulder
    const yBag = hipY + torso * 0.06
    const bx = rig.pelvisX + padBottom + headH * 0.09
    const size = Math.max(headH * 0.26, rig.pelvisX * 0.7)
    const st: Station[] = []
    for (let i = 0; i <= 5; i++) {
      const u = i / 5
      const k = Math.pow(1 - Math.pow(Math.abs(2 * u - 1), 4), 0.5)
      st.push({ p: new THREE.Vector3(bx, yBag + (u - 0.5) * size * 1.1, 0.01), r: size * 0.26 * (0.4 + 0.6 * k), rv: size * 0.62 * (0.5 + 0.5 * k), c: u > 0.62 ? tone(pal.bag, -0.2) : pal.bag })
    }
    parts.push(tube(st, 12, X, { shape: (ang) => [Math.sign(Math.cos(ang)) * Math.pow(Math.abs(Math.cos(ang)), 0.6), Math.sign(Math.sin(ang)) * Math.pow(Math.abs(Math.sin(ang)), 0.6)] }).skin(() => [[B.hips, 1]]))
    parts.push(blob(new THREE.Vector3(bx + size * 0.27, yBag + size * 0.1, 0.01), rig.line * 2.2, rig.line * 2.2, rig.line * 2.2, pal.hat, 7, 4).skin(() => [[B.hips, 1]]))
    const yTop = shoulderY + rig.armR * 0.55
    const cord: Station[] = []
    const n = 28
    for (let i = 0; i <= n; i++) {
      const w = i / n
      const ang = (82 - 360 * w) * DEG
      const y = mix(yBag + size * 0.4, yTop, Math.pow(Math.sin(Math.PI * w), 0.85))
      cord.push({ p: onTrunk(y, ang, rig.line * 1.2), r: rig.line * 2.1, c: tone(pal.bag, -0.15) })
    }
    parts.push(tube(cord, 6, Y).skin(trunkW))
  }
  if (extras.has('cane')) {
    // held in the left hand; in the bind pose the arm points along +x, so the stick does too
    const wrist = j.leftHand
    const grip = new THREE.Vector3(wrist.x + rig.handR * 1.0, wrist.y - rig.handR * 0.2, rig.handR * 0.25)
    const len = shoulderY - rig.arm * 0.955 - rig.handR * 1.0
    const r = rig.line * 2.6
    const st: Station[] = []
    // crook
    for (let i = 0; i <= 5; i++) {
      const a = (i / 5) * Math.PI * 0.9
      st.push({ p: new THREE.Vector3(grip.x - rig.handR * 0.9 - Math.sin(a) * rig.handR * 0.9, grip.y, grip.z + rig.handR * 0.9 - Math.cos(a) * rig.handR * 0.9 + rig.handR * 0.9), r: r * (i === 0 ? 0.7 : 1), c: pal.wood })
    }
    st.reverse()
    st.push({ p: grip.clone(), r, c: pal.wood })
    st.push({ p: new THREE.Vector3(grip.x + len * 0.5, grip.y, grip.z), r, c: pal.wood })
    st.push({ p: new THREE.Vector3(grip.x + len * 0.93, grip.y, grip.z), r: r * 0.9, c: pal.wood })
    st.push({ p: new THREE.Vector3(grip.x + len * 0.93, grip.y, grip.z), r: r * 1.15, c: pal.ink })
    st.push({ p: new THREE.Vector3(grip.x + len, grip.y, grip.z), r: r * 1.05, c: pal.ink })
    parts.push(tube(st, 8, Y).skin(() => [[B.leftHand, 1]]))
  }

  return { geometry: merge(parts), trunk }
}
