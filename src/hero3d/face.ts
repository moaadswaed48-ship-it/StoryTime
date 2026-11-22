/**
 * The face: flat picture-book features laid on the head's surface. Eyes look around behind skin-coloured lids,
 * so they can blink and smile-squint; brows and mouth move by morph targets. Everything is plain geometry and
 * morphs, so it survives a GLB export.
 */
import * as THREE from 'three'
import type { Sheet } from '../cast/sheet.ts'
import { type Palette, tone } from './body.ts'
import { headSurface } from './head.ts'
import { Part, blob, grid, type Station, tube } from './mesh.ts'
import type { Rig } from './rig.ts'

export type FaceState = { blink: number; happy: number; smile: number; open: number; round: number; browL: number; browR: number; lookX: number; lookY: number }

/** What the face meshes are set to for a state: morph weights per mesh and the iris offsets. */
export type FaceValues = { lids: number[]; lashes: number[]; brows: number[]; mouth: number[]; irisLeft: number[]; irisRight: number[] }

export type Face = {
  /** Add to the head bone. */
  group: THREE.Group
  /** The values a state maps to (also used to bake clips). */
  sample: (s: FaceState) => FaceValues
  apply: (s: FaceState) => void
  dispose: () => void
}

const TAU = Math.PI * 2

/** Collects flat or lit patches with optional morph targets into one geometry. */
class Patch {
  pos: number[] = []
  nrm: number[] = []
  col: number[] = []
  idx: number[] = []
  morph: Record<string, number[]> = {}
  constructor(names: string[] = []) {
    for (const n of names) this.morph[n] = []
  }
  get count() {
    return this.pos.length / 3
  }
  vertex(p: THREE.Vector3, n: THREE.Vector3, c: THREE.Color, targets: Record<string, THREE.Vector3> = {}) {
    this.pos.push(p.x, p.y, p.z)
    this.nrm.push(n.x, n.y, n.z)
    this.col.push(c.r, c.g, c.b)
    for (const k of Object.keys(this.morph)) {
      const t = targets[k]
      if (t) this.morph[k].push(t.x - p.x, t.y - p.y, t.z - p.z)
      else this.morph[k].push(0, 0, 0)
    }
    return this.count - 1
  }
  /** Adds a part built with the mesh tools (no morphs). */
  add(part: Part) {
    const base = this.count
    this.pos.push(...part.pos)
    this.nrm.push(...part.nrm)
    this.col.push(...part.col)
    for (const k of Object.keys(this.morph)) for (let i = 0; i < part.pos.length; i++) this.morph[k].push(0)
    for (const i of part.idx) this.idx.push(i + base)
  }
  geometry() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3))
    g.setIndex(this.idx)
    const names = Object.keys(this.morph)
    if (names.length) {
      g.morphAttributes.position = names.map((n) => {
        const a = new THREE.Float32BufferAttribute(this.morph[n], 3)
        a.name = n
        return a
      })
      g.morphTargetsRelative = true
    }
    return g
  }
}

export function buildFace(sheet: Sheet, rig: Rig, pal: Palette, lit: THREE.Material): Face {
  const { onFace, onHead, normalAt } = headSurface(rig)
  const H = rig.headH
  const a = rig.head.x
  const b = rig.head.y
  const extras = new Set(sheet.extras ?? [])
  const group = new THREE.Group()
  group.name = 'face'
  group.position.copy(rig.joint.head).negate()
  const flat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  const tv = new THREE.Vector3()
  const Zf = new THREE.Vector3(0, 0, 1)

  // layers above the skin, in head heights
  const L1 = H * 0.004
  const L2 = H * 0.008
  const L3 = H * 0.013
  const L4 = H * 0.017

  const size = Math.min(1, Math.max(0, sheet.eyes.size))
  const eh = (H * (0.058 + 0.05 * size)) / b // eye half-height, face units
  const ew = (H * (0.058 + 0.05 * size) * 0.8) / a
  const ex = 0.4
  const ey = rig.eyeY
  const eyes = [1, -1].map((s) => ({ s, cx: s * ex, cy: ey }))

  const P = (fx: number, fy: number, layer: number) => onFace(fx, fy, layer, new THREE.Vector3())
  const N = (p: THREE.Vector3) => normalAt(p, new THREE.Vector3())

  /** A filled oval on the face. */
  const disc = (patch: Patch, cx: number, cy: number, rx: number, ry: number, layer: number, c: THREE.Color, litNormals: boolean, seg = 18) => {
    const centre = P(cx, cy, layer)
    const i0 = patch.vertex(centre, litNormals ? N(centre) : Zf, c)
    for (let i = 0; i < seg; i++) {
      const p = P(cx + Math.cos((i / seg) * TAU) * rx, cy + Math.sin((i / seg) * TAU) * ry, layer)
      patch.vertex(p, litNormals ? N(p) : Zf, c)
    }
    for (let i = 0; i < seg; i++) patch.idx.push(i0, i0 + 1 + i, i0 + 1 + ((i + 1) % seg))
  }

  /* ── whites ── */
  const white = new Patch()
  for (const e of eyes) disc(white, e.cx, e.cy, ew * 1.05, eh * 1.05, L1, pal.white, false)
  const whites = new THREE.Mesh(white.geometry(), flat)
  whites.name = 'eyeWhites'

  /* ── irises (they slide to look) ── */
  const ri = ew * 0.76
  const irisMeshes = eyes.map((e) => {
    const patch = new Patch()
    const ry = (ri * a) / b
    disc(patch, e.cx, e.cy, ri, ry, L2, pal.eye, false, 20)
    disc(patch, e.cx, e.cy, ri * 0.56, ry * 0.56, L2 + H * 0.0008, pal.ink, false, 16)
    disc(patch, e.cx + ri * 0.36, e.cy + ry * 0.4, ri * 0.24, ry * 0.24, L2 + H * 0.0016, pal.white, false, 10)
    const m = new THREE.Mesh(patch.geometry(), flat)
    m.name = e.s > 0 ? 'irisLeft' : 'irisRight'
    // slope of the face here, so a sliding iris stays on the surface
    const p0 = P(e.cx, e.cy, 0)
    const px = P(e.cx + 0.05, e.cy, 0)
    const py = P(e.cx, e.cy + 0.05, 0)
    return { m, gx: (px.z - p0.z) / (px.x - p0.x), gy: (py.z - p0.z) / (py.y - p0.y) }
  })

  /* ── skin: the surround of each eye (hides an iris that slides past the opening), nose, blush ── */
  const skin = new Patch()
  const seg = 20
  for (const e of eyes) {
    const rings = [1, 1.3, 1.75]
    const base = skin.count
    for (const k of rings) {
      for (let i = 0; i < seg; i++) {
        const p = P(e.cx + Math.cos((i / seg) * TAU) * ew * k, e.cy + Math.sin((i / seg) * TAU) * eh * k, k === rings[rings.length - 1] ? L1 * 0.4 : L3)
        skin.vertex(p, N(p), pal.skin)
      }
    }
    for (let r = 0; r < rings.length - 1; r++) {
      for (let i = 0; i < seg; i++) {
        const i1 = (i + 1) % seg
        skin.idx.push(base + r * seg + i, base + (r + 1) * seg + i, base + r * seg + i1, base + r * seg + i1, base + (r + 1) * seg + i, base + (r + 1) * seg + i1)
      }
    }
  }
  const cheekC = pal.skin.clone().lerp(pal.blush, 0.62)
  for (const s of [1, -1]) disc(skin, s * 0.6, ey - 0.3 - eh * 0.5, (H * 0.085) / a, (H * 0.07) / b, L1 * 0.6, cheekC, true, 16)
  const noseY = ey - eh - 0.16
  {
    const p = P(0, noseY, 0)
    const nose = blob(p, H * 0.042, H * 0.036, H * 0.04, pal.skin.clone().lerp(pal.blush, 0.3), 10, 5)
    skin.add(nose)
  }
  if (extras.has('freckles')) {
    const dark = tone(pal.skin, -0.3)
    for (const s of [1, -1]) for (const [dx, dy] of [[0.3, 0.02], [0.42, -0.05], [0.52, 0.04], [0.2, -0.07]]) disc(skin, s * dx, noseY + dy + 0.05, (H * 0.011) / a, (H * 0.011) / b, L1, dark, true, 8)
  }
  if (extras.has('moustache')) {
    for (const s of [1, -1]) {
      const st: Station[] = []
      for (let i = 0; i <= 5; i++) {
        const u = i / 5
        const p = P(s * (0.02 + u * 0.27), noseY - 0.105 - 0.05 * u * u, H * 0.012)
        st.push({ p, r: H * (0.034 - 0.02 * u), rv: H * 0.02, c: pal.hair })
      }
      skin.add(tube(st, 8, new THREE.Vector3(0, 1, 0)))
    }
  }
  if (extras.has('glasses')) {
    const frame = pal.glasses
    const rg = Math.max(eh * b * 1.5, H * 0.13)
    const z = P(ex, ey, 0).z + H * 0.035
    const cy = rig.headC.y + ey * b
    const tubeR = H * 0.011
    for (const s of [1, -1]) {
      const cx = s * ex * a
      skin.add(
        grid(
          7,
          20,
          (row, cc, out) => {
            const ph = (row / 6) * TAU
            const ang = (cc / 20) * TAU
            const r = rg + Math.cos(ph) * tubeR
            out.set(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, z + Math.sin(ph) * tubeR)
          },
          () => frame,
        ),
      )
      const ear = onHead(-0.1, s * 1.5, H * 0.01, new THREE.Vector3())
      const hinge = new THREE.Vector3(cx + s * rg, cy, z)
      skin.add(tube([hinge, hinge.clone().lerp(ear, 0.5).add(new THREE.Vector3(s * H * 0.02, 0, 0)), ear].map((p) => ({ p, r: tubeR * 0.8, c: frame })), 6, new THREE.Vector3(0, 1, 0)))
    }
    skin.add(tube([-1, 0, 1].map((k) => ({ p: new THREE.Vector3(k * (ex * a - rg), cy + (1 - k * k) * H * 0.012, z), r: tubeR * 0.85, c: frame })), 6, new THREE.Vector3(0, 1, 0)))
  }
  const skinMesh = new THREE.Mesh(skin.geometry(), lit)
  skinMesh.name = 'faceSkin'

  /* ── lids: the upper one comes down to blink, the lower one comes up for a happy squint ── */
  const lids = new Patch(['blink', 'happy'])
  const lash = new Patch(['blink', 'happy'])
  const cols = 13
  const rowsN = 5
  const arc = (e: { cx: number; cy: number }, u: number, upper: number, k = 1) => {
    // point across the eye at u (0 … 1), on the upper (1) or lower (−1) edge, or anywhere between
    const ang = Math.PI - u * Math.PI
    return [e.cx + Math.cos(ang) * ew * k, e.cy + Math.sin(ang) * eh * upper * k] as const
  }
  for (const e of eyes) {
    // upper lid: all the way down for a blink, half-way for a happy squint; lower lid: up to meet it when happy
    for (const lid of [{ home: 1, blink: -0.86, happy: 0.56 }, { home: -1, blink: -1, happy: 0.46 }]) {
      const base = lids.count
      for (let r = 0; r < rowsN; r++) {
        for (let c = 0; c < cols; c++) {
          const u = c / (cols - 1)
          const k = r / (rowsN - 1)
          const [x0, y0] = arc(e, u, lid.home, 1.04)
          const [xb, yb] = arc(e, u, lid.home + (lid.blink - lid.home) * k, 1.04)
          const [xh, yh] = arc(e, u, lid.home + (lid.happy - lid.home) * k, 1.04)
          const p = P(x0, y0, L3)
          lids.vertex(p, N(p), pal.skin, { blink: P(xb, yb, L3 + H * 0.0015), happy: P(xh, yh, L3 + H * 0.0015) })
        }
      }
      for (let r = 0; r < rowsN - 1; r++) for (let c = 0; c < cols - 1; c++) {
        const i = base + r * cols + c
        const quad = lid.home > 0 ? [i, i + cols, i + 1, i + 1, i + cols, i + cols + 1] : [i, i + 1, i + cols, i + 1, i + cols + 1, i + cols]
        lids.idx.push(...quad)
      }
    }
    // lash line along the upper lid: follows it down in a blink; in a happy squint it stays as a "^"
    const th = (H * 0.011) / b
    const base = lash.count
    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1)
      const taper = 0.35 + 0.65 * Math.sin(u * Math.PI)
      for (const side of [1, -1]) {
        const [x0, y0] = arc(e, u, 1, 1.05)
        const [x1, y1] = arc(e, u, -0.86, 1.05)
        const [x2, y2] = arc(e, u, 0.5, 1.05)
        const p = P(x0, y0 + side * th * taper, L4)
        lash.vertex(p, Zf, pal.ink, { blink: P(x1, y1 + side * th * taper, L4), happy: P(x2, y2 + side * th * taper * 1.25, L4) })
      }
    }
    for (let c = 0; c < cols - 1; c++) {
      const i = base + c * 2
      lash.idx.push(i, i + 1, i + 2, i + 2, i + 1, i + 3)
    }
  }
  const lidMesh = new THREE.Mesh(lids.geometry(), lit)
  lidMesh.name = 'lids'
  const lashMesh = new THREE.Mesh(lash.geometry(), flat)
  lashMesh.name = 'lashes'

  /* ── brows ── */
  const brows = new Patch(['browL', 'browR'])
  const weight = sheet.brows?.weight ?? 0.5
  const bt = (H * (0.01 + 0.016 * weight)) / b
  for (const e of eyes) {
    const base = brows.count
    const name = e.s > 0 ? 'browL' : 'browR'
    const nb = 8
    for (let c = 0; c < nb; c++) {
      const u = c / (nb - 1) // inner → outer
      const x = e.cx + e.s * (u - 0.45) * ew * 2.5
      const y = e.cy + eh * 1.05 + (H * 0.06) / b + Math.sin(u * Math.PI * 0.75) * eh * 0.3
      const taper = 0.45 + 0.55 * Math.sin(Math.pow(u, 0.7) * Math.PI)
      for (const side of [1, -1]) {
        const up = (H * 0.05) / b
        const p = P(x, y + side * bt * taper, L4)
        // raised: the whole brow lifts and the inner end lifts most
        brows.vertex(p, Zf, pal.brow, { [name]: P(x, y + side * bt * taper + up * (0.7 + 0.5 * (1 - u)), L4) })
      }
    }
    for (let c = 0; c < nb - 1; c++) {
      const i = base + c * 2
      const quad = e.s > 0 ? [i, i + 1, i + 2, i + 2, i + 1, i + 3] : [i, i + 2, i + 1, i + 2, i + 3, i + 1]
      brows.idx.push(...quad)
    }
  }
  const browMesh = new THREE.Mesh(brows.geometry(), flat)
  browMesh.name = 'brows'

  /* ── mouth ── */
  const mouth = new Patch(['smile', 'open', 'round'])
  const my = Math.min(noseY - 0.2, -0.5)
  const mw = 0.2 + (rig.stage === 'toddler' ? -0.02 : 0)
  const mt = (H * 0.0075) / b
  const lip = pal.ink.clone().lerp(pal.blush, 0.25)
  const inside = new THREE.Color('#5c1f2e')
  const tongue = new THREE.Color('#e9778c')
  const mc = 15
  const rowsM = [
    { c: lip, base: 1, open: 0.034, round: 0.05 },
    { c: inside, base: 0.2, open: -0.012, round: 0 },
    { c: inside, base: -0.6, open: -0.07, round: -0.045 },
    { c: tongue, base: -1, open: -0.125, round: -0.085 },
  ]
  for (let c = 0; c < mc; c++) {
    const xn = (c / (mc - 1)) * 2 - 1
    const body = Math.sqrt(Math.max(0, 1 - xn * xn * xn * xn))
    const dome = 1 - xn * xn
    for (const row of rowsM) {
      const x = xn * mw
      const y = my + row.base * mt * (0.45 + 0.55 * body)
      const p = P(x, y, L1)
      mouth.vertex(p, Zf, row.c, {
        smile: P(x * 1.06, y + 0.085 * (xn * xn - 0.3), L1),
        open: P(x * 0.9, y + row.open * Math.pow(dome, 0.7), L1),
        round: P(x * 0.5, y + row.round * Math.pow(dome, 0.6), L1),
      })
    }
  }
  const nr = rowsM.length
  for (let c = 0; c < mc - 1; c++) for (let r = 0; r < nr - 1; r++) {
    const i = c * nr + r
    mouth.idx.push(i, i + 1, i + nr, i + nr, i + 1, i + nr + 1)
  }
  const mouthMesh = new THREE.Mesh(mouth.geometry(), flat)
  mouthMesh.name = 'mouth'

  for (const m of [whites, irisMeshes[0].m, irisMeshes[1].m, skinMesh, lidMesh, lashMesh, browMesh, mouthMesh]) {
    m.frustumCulled = false
    group.add(m)
  }

  const lookXMax = ew * a * 0.4
  const lookYMax = eh * b * 0.3
  const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
  const sample = (s: FaceState): FaceValues => {
    const blink = clamp(s.blink, 0, 1)
    const happy = clamp(s.happy, 0, 1) * (1 - blink)
    // the figure's left is the viewer's right: lookX > 0 looks toward the figure's left
    const dx = clamp(s.lookX, -1, 1) * lookXMax
    const dy = clamp(s.lookY, -1, 1) * lookYMax
    const [l, r] = irisMeshes.map((iris) => [dx, dy, iris.gx * dx + iris.gy * dy])
    return {
      lids: [blink, happy],
      lashes: [blink, happy],
      brows: [clamp(s.browL, -1, 1.2), clamp(s.browR, -1, 1.2)],
      mouth: [clamp(s.smile, -1, 1.3), clamp(s.open, 0, 1.2), clamp(s.round, 0, 1)],
      irisLeft: l,
      irisRight: r,
    }
  }
  return {
    group,
    sample,
    apply(s) {
      const v = sample(s)
      for (let i = 0; i < 2; i++) {
        lidMesh.morphTargetInfluences![i] = v.lids[i]
        lashMesh.morphTargetInfluences![i] = v.lashes[i]
        browMesh.morphTargetInfluences![i] = v.brows[i]
      }
      for (let i = 0; i < 3; i++) mouthMesh.morphTargetInfluences![i] = v.mouth[i]
      irisMeshes[0].m.position.fromArray(v.irisLeft)
      irisMeshes[1].m.position.fromArray(v.irisRight)
    },
    dispose() {
      flat.dispose()
      for (const m of group.children) (m as THREE.Mesh).geometry.dispose()
    },
  }
}
