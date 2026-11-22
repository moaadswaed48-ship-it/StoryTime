/**
 * Rounded-form builder. Every body part is a grid of points (a loft): rows along the form, columns around it.
 * Parts carry position, smooth normal, vertex colour and skin weights, and are merged into one geometry so a whole
 * figure is drawn in one call (plus one for its outline).
 */
import * as THREE from 'three'

/** Up to four [bone index, weight] pairs. */
export type Weights = [number, number][]

export class Part {
  pos: number[] = []
  nrm: number[] = []
  col: number[] = []
  idx: number[] = []
  si: number[] = []
  sw: number[] = []
  /** Per triangle: the grid cell it came from (row, column), for patterns. */
  cells: [number, number][] = []

  get count() {
    return this.pos.length / 3
  }

  /** Smooth normals, averaged across vertices that share a position (so colour seams do not crack the outline). */
  computeNormals() {
    const n = new Float64Array(this.pos.length)
    const p = this.pos
    for (let t = 0; t < this.idx.length; t += 3) {
      const a = this.idx[t] * 3
      const b = this.idx[t + 1] * 3
      const c = this.idx[t + 2] * 3
      const ux = p[b] - p[a]
      const uy = p[b + 1] - p[a + 1]
      const uz = p[b + 2] - p[a + 2]
      const vx = p[c] - p[a]
      const vy = p[c + 1] - p[a + 1]
      const vz = p[c + 2] - p[a + 2]
      const nx = uy * vz - uz * vy
      const ny = uz * vx - ux * vz
      const nz = ux * vy - uy * vx
      for (const k of [a, b, c]) {
        n[k] += nx
        n[k + 1] += ny
        n[k + 2] += nz
      }
    }
    const key = (i: number) => `${Math.round(p[i] * 2e4)},${Math.round(p[i + 1] * 2e4)},${Math.round(p[i + 2] * 2e4)}`
    const sums = new Map<string, [number, number, number]>()
    for (let i = 0; i < p.length; i += 3) {
      const k = key(i)
      const s = sums.get(k)
      if (s) {
        s[0] += n[i]
        s[1] += n[i + 1]
        s[2] += n[i + 2]
      } else sums.set(k, [n[i], n[i + 1], n[i + 2]])
    }
    this.nrm = new Array(p.length)
    for (let i = 0; i < p.length; i += 3) {
      const s = sums.get(key(i))!
      const l = Math.hypot(s[0], s[1], s[2]) || 1
      this.nrm[i] = s[0] / l
      this.nrm[i + 1] = s[1] / l
      this.nrm[i + 2] = s[2] / l
    }
    return this
  }

  /** Turns the triangles to face outward (closed or nearly closed forms only). */
  faceOutward() {
    const p = this.pos
    let cx = 0
    let cy = 0
    let cz = 0
    for (let i = 0; i < p.length; i += 3) {
      cx += p[i]
      cy += p[i + 1]
      cz += p[i + 2]
    }
    const n = this.count || 1
    cx /= n
    cy /= n
    cz /= n
    let vol = 0
    for (let t = 0; t < this.idx.length; t += 3) {
      const a = this.idx[t] * 3
      const b = this.idx[t + 1] * 3
      const c = this.idx[t + 2] * 3
      const ax = p[a] - cx
      const ay = p[a + 1] - cy
      const az = p[a + 2] - cz
      const bx = p[b] - cx
      const by = p[b + 1] - cy
      const bz = p[b + 2] - cz
      const dx = p[c] - cx
      const dy = p[c + 1] - cy
      const dz = p[c + 2] - cz
      vol += ax * (by * dz - bz * dy) + ay * (bz * dx - bx * dz) + az * (bx * dy - by * dx)
    }
    if (vol < 0) this.flip()
    return this
  }

  flip() {
    for (let t = 0; t < this.idx.length; t += 3) {
      const b = this.idx[t + 1]
      this.idx[t + 1] = this.idx[t + 2]
      this.idx[t + 2] = b
    }
    return this
  }

  /** Skin weights from each vertex position (bind pose). */
  skin(fn: (x: number, y: number, z: number) => Weights) {
    this.si = []
    this.sw = []
    for (let i = 0; i < this.pos.length; i += 3) {
      const w = fn(this.pos[i], this.pos[i + 1], this.pos[i + 2]).filter((e) => e[1] > 1e-4)
      w.sort((a, b) => b[1] - a[1])
      const top = w.slice(0, 4)
      const sum = top.reduce((s, e) => s + e[1], 0) || 1
      for (let k = 0; k < 4; k++) {
        this.si.push(top[k] ? top[k][0] : 0)
        this.sw.push(top[k] ? top[k][1] / sum : 0)
      }
    }
    return this
  }

  /** Gives every triangle its own flat colour (cloth patterns); normals stay smooth. */
  paintCells(colorOf: (row: number, col: number) => THREE.Color | null) {
    const out = new Part()
    out.nrm = []
    for (let t = 0; t < this.idx.length; t += 3) {
      const [r, c] = this.cells[t / 3] ?? [0, 0]
      const paint = colorOf(r, c)
      for (let k = 0; k < 3; k++) {
        const v = this.idx[t + k] * 3
        out.pos.push(this.pos[v], this.pos[v + 1], this.pos[v + 2])
        out.nrm.push(this.nrm[v], this.nrm[v + 1], this.nrm[v + 2])
        if (paint) out.col.push(paint.r, paint.g, paint.b)
        else out.col.push(this.col[v], this.col[v + 1], this.col[v + 2])
        out.idx.push(out.count - 1)
      }
    }
    return out
  }
}

type GridOpts = {
  /** Columns wrap around (a closed ring). Default true. */
  wrap?: boolean
  /** Close the first / last row with a fan to its centre. */
  capStart?: boolean
  capEnd?: boolean
  /** Skip the automatic outward-facing check (open patches): true = keep the winding as built. */
  keepWinding?: boolean
}

/**
 * A grid of `rows` × `cols` points. `at(row, col, out)` gives the position, `color(row, col)` the vertex colour.
 */
export function grid(rows: number, cols: number, at: (row: number, col: number, out: THREE.Vector3) => void, color: (row: number, col: number) => THREE.Color, opts: GridOpts = {}): Part {
  const wrap = opts.wrap ?? true
  const part = new Part()
  const v = new THREE.Vector3()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      at(r, c, v)
      part.pos.push(v.x, v.y, v.z)
      const k = color(r, c)
      part.col.push(k.r, k.g, k.b)
    }
  }
  const span = wrap ? cols : cols - 1
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < span; c++) {
      const a = r * cols + c
      const b = r * cols + ((c + 1) % cols)
      const d = (r + 1) * cols + c
      const e = (r + 1) * cols + ((c + 1) % cols)
      part.idx.push(a, d, b, b, d, e)
      part.cells.push([r, c], [r, c])
    }
  }
  const cap = (row: number, reverse: boolean) => {
    let x = 0
    let y = 0
    let z = 0
    for (let c = 0; c < cols; c++) {
      const i = (row * cols + c) * 3
      x += part.pos[i]
      y += part.pos[i + 1]
      z += part.pos[i + 2]
    }
    part.pos.push(x / cols, y / cols, z / cols)
    const k = color(row, 0)
    part.col.push(k.r, k.g, k.b)
    const centre = part.count - 1
    for (let c = 0; c < span; c++) {
      const a = row * cols + c
      const b = row * cols + ((c + 1) % cols)
      if (reverse) part.idx.push(centre, b, a)
      else part.idx.push(centre, a, b)
      part.cells.push([row, c])
    }
  }
  if (opts.capStart) cap(0, false)
  if (opts.capEnd) cap(rows - 1, true)
  if (!opts.keepWinding) part.faceOutward()
  return part.computeNormals()
}

/** One station of a tube: centre, radii across (`r` along the first cross axis, `rv` along the second) and colour. */
export type Station = { p: THREE.Vector3; r: number; rv?: number; c: THREE.Color }

const _t = new THREE.Vector3()
const _u = new THREE.Vector3()
const _w = new THREE.Vector3()

/**
 * A tube through stations. `side` is a direction roughly across the tube (the first cross axis is built from it).
 * Stations at the same point make a step (a hem); ends are closed with a fan, so finish with `roundEnd` stations.
 */
export function tube(st: Station[], around: number, side: THREE.Vector3, opts: { capStart?: boolean; capEnd?: boolean; shape?: (angle: number, row: number) => [number, number] } = {}): Part {
  const tangents = st.map((_, i) => {
    let a = i
    let b = i
    while (a > 0 && st[a].p.distanceToSquared(st[i].p) < 1e-10) a--
    while (b < st.length - 1 && st[b].p.distanceToSquared(st[i].p) < 1e-10) b++
    return new THREE.Vector3().subVectors(st[b].p, st[a].p).normalize()
  })
  return grid(
    st.length,
    around,
    (row, col, out) => {
      const s = st[row]
      _t.copy(tangents[row])
      _u.copy(side).addScaledVector(_t, -side.dot(_t)).normalize()
      _w.crossVectors(_t, _u)
      const ang = (col / around) * Math.PI * 2
      const [cx, cy] = opts.shape ? opts.shape(ang, row) : [Math.cos(ang), Math.sin(ang)]
      out.copy(s.p).addScaledVector(_u, cx * s.r).addScaledVector(_w, cy * (s.rv ?? s.r))
    },
    (row) => st[row].c,
    { capStart: opts.capStart ?? true, capEnd: opts.capEnd ?? true },
  )
}

/** Stations that round a tube end at `p`: from the tip (`dir` points out of the tube) back to the full radius. */
export function roundEnd(p: THREE.Vector3, dir: THREE.Vector3, r: number, c: THREE.Color, start: boolean, rv?: number, steps = 4): Station[] {
  const out: Station[] = []
  for (let i = 0; i < steps; i++) {
    const a = ((i + 0.35) / (steps + 0.35)) * (Math.PI / 2)
    out.push({ p: p.clone().addScaledVector(dir, Math.cos(a) * r), r: Math.sin(a) * r, rv: rv === undefined ? undefined : Math.sin(a) * rv, c })
  }
  out.push({ p: p.clone(), r, rv, c })
  return start ? out : out.reverse()
}

/** An ellipsoid (optionally flattened along some sides), as a part. */
export function blob(centre: THREE.Vector3, rx: number, ry: number, rz: number, color: THREE.Color, around = 12, rows = 7): Part {
  return grid(
    rows,
    around,
    (row, col, out) => {
      const lat = -Math.PI / 2 + ((row + 0.5) / rows) * Math.PI
      const lon = (col / around) * Math.PI * 2
      out.set(centre.x + Math.cos(lat) * Math.sin(lon) * rx, centre.y + Math.sin(lat) * ry, centre.z + Math.cos(lat) * Math.cos(lon) * rz)
    },
    () => color,
    { capStart: true, capEnd: true },
  )
}

/** Merges parts into one skinned geometry. */
export function merge(parts: Part[]): THREE.BufferGeometry {
  let n = 0
  let ni = 0
  for (const p of parts) {
    n += p.count
    ni += p.idx.length
  }
  const pos = new Float32Array(n * 3)
  const nrm = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  const si = new Uint16Array(n * 4)
  const sw = new Float32Array(n * 4)
  const idx = n > 65535 ? new Uint32Array(ni) : new Uint16Array(ni)
  let v = 0
  let t = 0
  for (const p of parts) {
    if (p.si.length !== p.count * 4) throw new Error('hero3d: a part has no skin weights')
    pos.set(p.pos, v * 3)
    nrm.set(p.nrm, v * 3)
    col.set(p.col, v * 3)
    si.set(p.si, v * 4)
    sw.set(p.sw, v * 4)
    for (let i = 0; i < p.idx.length; i++) idx[t + i] = p.idx[i] + v
    v += p.count
    t += p.idx.length
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4))
  g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4))
  g.setIndex(new THREE.BufferAttribute(idx, 1))
  return g
}

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export const mix = (a: number, b: number, t: number) => a + (b - a) * t
