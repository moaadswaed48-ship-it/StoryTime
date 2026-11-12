import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { mulberry32 } from '@/lib/seeded'
import { OBSTACLES } from '../logic'
import { HAZE, LEAF_COLORS, backdropTexture, barkTexture, blobTexture, dappleTexture, leafTexture, pavingTexture } from './textures'

/**
 * The set: everything that does not move. Built once from a handful of instanced meshes so the whole yard
 * costs about a dozen draw calls. Colours are warm and baked (no shadow maps); depth comes from mist,
 * the painted backdrop and soft blob shadows.
 */

export const TREE = { x: OBSTACLES[0].x, z: OBSTACLES[0].z }
/** A heap of leaves Sari can run through. */
export const PILE = { x: 4.9, z: 1.4, r: 1.05 }
const FENCE_Z = -6
const FENCE_X = 8.5

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _c = new THREE.Color()

function useDisposable<T extends { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }>(make: () => T): T {
  const obj = useMemo(make, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(
    () => () => {
      obj.geometry.dispose()
      for (const m of Array.isArray(obj.material) ? obj.material : [obj.material]) m.dispose()
    },
    [obj],
  )
  return obj
}

/** Joins simple geometries (position, normal, uv, colour) into one draw call. */
function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g))
  const out = new THREE.BufferGeometry()
  for (const name of ['position', 'normal', 'uv', 'color'] as const) {
    const size = name === 'uv' ? 2 : 3
    const total = flat.reduce((n, g) => n + g.attributes.position.count, 0)
    const arr = new Float32Array(total * size)
    let o = 0
    for (const g of flat) {
      const a = g.attributes[name]
      const n = g.attributes.position.count * size
      if (a) arr.set((a.array as Float32Array).subarray(0, n), o)
      else if (name === 'color') arr.fill(1, o, o + n)
      o += n
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size))
  }
  for (const g of flat) g.dispose()
  return out
}
function paint(g: THREE.BufferGeometry, fn: (x: number, y: number, z: number, out: THREE.Color) => void) {
  const pos = g.attributes.position
  const col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    fn(pos.getX(i), pos.getY(i), pos.getZ(i), _c)
    col[i * 3] = _c.r
    col[i * 3 + 1] = _c.g
    col[i * 3 + 2] = _c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

/* ── Ground: paving, pools of light, mist toward the backdrop ───────────────── */

function mistGeometry() {
  // rings around a centre in front of the yard: clear where Sari plays, solid mist where the painting begins
  const radii = [12.5, 15, 18, 21.5, 25, 27.2, 80]
  const alpha = [0, 0.16, 0.4, 0.66, 0.9, 1, 1]
  const seg = 72
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const c = new THREE.Color(HAZE)
  radii.forEach((r, k) => {
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2
      pos.push(Math.cos(a) * r, 0, 6 + Math.sin(a) * r)
      col.push(c.r, c.g, c.b, alpha[k])
    }
  })
  for (let k = 0; k < radii.length - 1; k++)
    for (let i = 0; i < seg; i++) {
      const a = k * (seg + 1) + i
      const b = a + seg + 1
      idx.push(a, a + 1, b, b, a + 1, b + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  return g
}

export function Ground({ onTap }: { onTap: (e: ThreeEvent<PointerEvent>) => void }) {
  const paving = useMemo(() => {
    const tex = pavingTexture()
    tex.repeat.set(33, 33)
    return tex
  }, [])
  const mist = useDisposable(() => {
    const m = new THREE.Mesh(mistGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }))
    m.position.y = 0.075
    m.renderOrder = 3
    return m
  })
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} onPointerDown={onTap}>
        <planeGeometry args={[110, 110]} />
        <meshBasicMaterial map={paving} color="#f1dcc0" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0.6, 0.062, -0.2]} renderOrder={1}>
        <planeGeometry args={[30, 24]} />
        <meshBasicMaterial map={dappleTexture()} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.9} fog={false} />
      </mesh>
      <primitive object={mist} />
    </group>
  )
}

/* ── Backdrop: a curved painted wall, the wide shot of the yard from the film ── */

const ARC = (200 * Math.PI) / 180
export function Backdrop() {
  const map = useMemo(() => {
    const tex = backdropTexture()
    tex.repeat.set(3, 1) // six mirrored tiles around the arc
    tex.offset.set(0.5, 0) // …with the school straight ahead
    return tex
  }, [])
  return (
    <mesh position={[0, 6.5, 0]}>
      <cylinderGeometry args={[21, 21, 13.4, 72, 1, true, Math.PI - ARC / 2, ARC]} />
      <meshBasicMaterial map={map} side={THREE.BackSide} fog={false} />
    </mesh>
  )
}

/* ── The big tree ───────────────────────────────────────────────────────────── */

/** The crown: a dome of leafy clumps (x, y, z, radius), wider toward the yard, laid out on a golden-angle spiral. */
const BLOBS: [number, number, number, number][] = (() => {
  const rnd = mulberry32(12)
  const out: [number, number, number, number][] = [[0.3, 6.0, 0.2, 2.0]]
  const n = 18
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + 0.4
    const rad = 0.9 + 3.4 * Math.sqrt((i + 0.6) / n)
    out.push([Math.cos(a) * rad * 1.02 + 0.35, 4.55 + (1 - (rad / 4.5) ** 2) * 1.9 + (rnd() - 0.5) * 0.5, Math.sin(a) * rad * 0.82 + 0.1, 1.5 - rad * 0.15 + rnd() * 0.35])
  }
  return out
})()
/** Loose sprays of leaves around the rim (leaves only, nothing solid inside): they break up the round outline of the clumps. */
const SPRAYS: [number, number, number, number][] = (() => {
  const rnd = mulberry32(29)
  const out: [number, number, number, number][] = []
  const n = 16
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.3
    const rad = 3.9 + rnd() * 1.0
    out.push([Math.cos(a) * rad * 1.02 + 0.35, 3.75 + rnd() * 1.1, Math.sin(a) * rad * 0.82 + 0.1, 0.5 + rnd() * 0.4])
  }
  return out
})()
const SQUASH = 0.8
/** Mostly gold and orange, a few reds: the crown is back-lit. */
const CROWN_COLORS = ['#f4a72c', '#f4a72c', '#e2711d', '#f2c14e', '#f7d06a', '#d9902f', '#e98a2b', '#c8421f']

function trunkGeometry() {
  const H = 4.5
  const seg = 28
  const rings = 18
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const dark = new THREE.Color('#6d4426')
  const warm = new THREE.Color('#b9865a')
  for (let j = 0; j <= rings; j++) {
    const v = j / rings
    const y = v * H
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2
      const roots = 0.62 * Math.exp(-y * 1.9) * (0.7 + 0.6 * Math.max(0, Math.sin(a * 5 + 0.6)))
      const r = (0.58 - 0.12 * v + 0.16 * v * v) * (1 + 0.07 * Math.sin(a * 3 + y * 1.4) + 0.04 * Math.sin(a * 7 + y * 3)) + roots
      pos.push(Math.sin(a) * r + Math.sin(y * 0.55) * 0.14, y, Math.cos(a) * r)
      const n = Math.hypot(Math.sin(a), 0.12, Math.cos(a))
      nor.push(Math.sin(a) / n, 0.12 / n, Math.cos(a) / n)
      uv.push((i / seg) * 3, v * 0.98)
      _c.copy(dark).lerp(warm, 0.2 + 0.8 * v)
      col.push(_c.r, _c.g, _c.b)
    }
  }
  for (let j = 0; j < rings; j++)
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i
      const b = a + seg + 1
      idx.push(a, a + 1, b, b, a + 1, b + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  return g
}
function branchGeometry(from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number) {
  const dir = to.clone().sub(from)
  const len = dir.length()
  const g = new THREE.CylinderGeometry(r1, r0, len, 8, 1, true)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()))
  g.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2)
  return paint(g, (_x, _y, _z, out) => out.set('#a5744a'))
}
function canopyGeometry() {
  // the inside of the crown: darker than the leaves around it, so a gap between leaves reads as depth, not as a bright ball
  const under = new THREE.Color('#9c4716')
  const mid = new THREE.Color('#c26a1d')
  const top = new THREE.Color('#e39636')
  return merge(
    BLOBS.map(([cx, cy, cz, r], i) => {
      const g = new THREE.IcosahedronGeometry(1, 2)
      const pos = g.attributes.position
      const col = new Float32Array(pos.count * 3)
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v)
        const y = pos.getY(v)
        const z = pos.getZ(v)
        // lumpy, like clumps of foliage; the hollows are a little darker
        const lump = 0.17 * Math.sin(x * 4.1 + i) * Math.sin(y * 3.7 + i * 1.3) + 0.1 * Math.sin(z * 6.3 + i * 2)
        const d = (1 + lump) * 0.84
        const wy = cy + y * r * d * SQUASH
        pos.setXYZ(v, cx + x * r * d, wy, cz + z * r * d)
        const h = THREE.MathUtils.clamp((wy - 3.9) / 3.6, 0, 1)
        if (h < 0.5) _c.copy(under).lerp(mid, h * 2)
        else _c.copy(mid).lerp(top, (h - 0.5) * 2)
        _c.multiplyScalar(0.92 + 0.08 * (y * 0.5 + 0.5) + lump * 0.45)
        col[v * 3] = _c.r
        col[v * 3 + 1] = _c.g
        col[v * 3 + 2] = _c.b
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3))
      return g
    }),
  )
}

export function Tree() {
  const trunk = useDisposable(() => {
    const top = new THREE.Vector3(0.1, 4.2, 0)
    const geo = merge([
      trunkGeometry(),
      branchGeometry(top, new THREE.Vector3(2.8, 5.3, 1.0), 0.36, 0.14),
      branchGeometry(top, new THREE.Vector3(-2.4, 5.3, 0.5), 0.34, 0.14),
      branchGeometry(top, new THREE.Vector3(0.7, 5.4, -1.9), 0.32, 0.14),
      branchGeometry(top, new THREE.Vector3(1.2, 6.2, 0.2), 0.34, 0.16),
      branchGeometry(new THREE.Vector3(2.5, 5.2, 0.9), new THREE.Vector3(4.1, 5.05, 0.6), 0.17, 0.08),
      // thinner boughs out to the clumps on the rim: seen from below, between the leaves, they say "tree", not "ball of leaves"
      ...BLOBS.filter((_, i) => i >= 8 && i % 2 === 0).map(([x, y, z]) => {
        const from = new THREE.Vector3(0.1 + (x - 0.1) * 0.3, 4.75, z * 0.3)
        return branchGeometry(from, new THREE.Vector3(x * 0.96, y - 0.35, z * 0.96), 0.13, 0.05)
      }),
    ])
    const bark = barkTexture()
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, map: bark }))
  })
  const crown = useDisposable(() => new THREE.Mesh(canopyGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true })))
  const leaves = useDisposable(() => {
    const rnd = mulberry32(17)
    const total = 4800
    const all = [...BLOBS, ...SPRAYS]
    const sum = all.reduce((n, b) => n + b[3] * b[3], 0)
    const geo = new THREE.PlaneGeometry(1, 1)
    const mat = new THREE.MeshBasicMaterial({ map: leafTexture(), alphaTest: 0.4, side: THREE.DoubleSide })
    const mesh = new THREE.InstancedMesh(geo, mat, total)
    const z = new THREE.Vector3(0, 0, 1)
    const dir = new THREE.Vector3()
    let k = 0
    all.forEach(([cx, cy, cz, r], bi) => {
      const spray = bi >= BLOBS.length
      const n = bi === all.length - 1 ? total - k : Math.round((total * r * r) / sum)
      for (let i = 0; i < n && k < total; i++, k++) {
        const u = spray ? rnd() * 2 - 1 : rnd() * 1.8 - 1 // more of them underneath and on the sides, where the camera looks
        const a = rnd() * Math.PI * 2
        const s = Math.sqrt(1 - u * u)
        dir.set(Math.cos(a) * s, u, Math.sin(a) * s)
        // a loose shell: some leaves sit deep, some hang out past the outline (a spray is leaves all the way through)
        const out = spray ? r * (0.2 + rnd() * 1.0) : r * (0.88 + rnd() * 0.54)
        _p.set(cx + dir.x * out, cy + dir.y * out * SQUASH, cz + dir.z * out)
        _q.setFromUnitVectors(z, dir)
        _q.multiply(new THREE.Quaternion().setFromEuler(_e.set((rnd() - 0.5) * 1.1, (rnd() - 0.5) * 1.1, rnd() * Math.PI * 2)))
        const size = 0.42 + rnd() * 0.36
        mesh.setMatrixAt(k, _m.compose(_p, _q, _s.setScalar(size)))
        const light = 0.74 + 0.36 * (dir.y * 0.5 + 0.5) + rnd() * 0.16 - (out < r ? 0.1 : 0)
        mesh.setColorAt(k, _c.set(CROWN_COLORS[Math.floor(rnd() * CROWN_COLORS.length)]).multiplyScalar(light))
      }
    })
    mesh.count = k
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  })
  return (
    <group position={[TREE.x, 0, TREE.z]}>
      <primitive object={trunk} />
      <primitive object={crown} />
      <primitive object={leaves} />
    </group>
  )
}

/* ── Fence, bench and planters: one instanced box mesh ──────────────────────── */

const PICKETS = ['#e8c15c', '#9eb46b', '#7fa8b6', '#d86c4c', '#efdcb8']
const WOOD = ['#b0794a', '#a56f42', '#ba8454', '#9d683d']

export function Woodwork() {
  const boxes = useDisposable(() => {
    const rnd = mulberry32(8)
    const list: { p: [number, number, number]; s: [number, number, number]; r?: [number, number, number]; c: string }[] = []
    let n = 0
    const picket = (x: number, z: number, side: boolean) => {
      const h = 0.92 + rnd() * 0.1
      list.push({ p: [x, h / 2, z], s: side ? [0.05, h, 0.2] : [0.2, h, 0.05], r: side ? [(rnd() - 0.5) * 0.06, 0, 0] : [0, 0, (rnd() - 0.5) * 0.06], c: PICKETS[n++ % PICKETS.length] })
    }
    for (let x = -FENCE_X; x <= FENCE_X + 0.01; x += 0.31) picket(x, FENCE_Z, false)
    for (let z = FENCE_Z + 0.31; z <= 8; z += 0.31) {
      picket(-FENCE_X, z, true)
      picket(FENCE_X, z, true)
    }
    for (const y of [0.3, 0.68]) {
      list.push({ p: [0, y, FENCE_Z - 0.05], s: [FENCE_X * 2, 0.08, 0.04], c: WOOD[0] })
      for (const x of [-FENCE_X - 0.05, FENCE_X + 0.05]) list.push({ p: [x, y, (FENCE_Z + 8) / 2], s: [0.04, 0.08, 8 - FENCE_Z], c: WOOD[0] })
    }
    // bench against the back fence
    const bx = 3.7
    const bz = -5.25
    for (let i = 0; i < 3; i++) list.push({ p: [bx, 0.44, bz - 0.17 + i * 0.19], s: [2.3, 0.05, 0.16], c: WOOD[i % 2 ? 2 : 0] })
    for (let i = 0; i < 2; i++) list.push({ p: [bx, 0.7 + i * 0.2, bz - 0.33 - i * 0.03], s: [2.3, 0.15, 0.045], r: [-0.14, 0, 0], c: WOOD[i ? 0 : 2] })
    for (const x of [bx - 1.0, bx + 1.0]) {
      list.push({ p: [x, 0.21, bz + 0.16], s: [0.08, 0.42, 0.08], c: WOOD[3] })
      list.push({ p: [x, 0.5, bz - 0.3], s: [0.08, 1.0, 0.08], r: [-0.1, 0, 0], c: WOOD[3] })
      list.push({ p: [x, 0.4, bz - 0.06], s: [0.07, 0.07, 0.5], c: WOOD[3] })
    }
    // planter boxes
    for (const [x, z, w] of PLANTERS) {
      list.push({ p: [x, 0.22, z], s: [w, 0.44, 0.52], c: WOOD[1] })
      list.push({ p: [x, 0.45, z], s: [w + 0.08, 0.06, 0.6], c: WOOD[2] })
    }
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), list.length)
    list.forEach((b, i) => {
      _q.setFromEuler(_e.set(...(b.r ?? [0, 0, 0])))
      mesh.setMatrixAt(i, _m.compose(_p.set(...b.p), _q, _s.set(...b.s)))
      mesh.setColorAt(i, _c.set(b.c).offsetHSL(0, 0, (rnd() - 0.5) * 0.05))
    })
    return mesh
  })
  return <primitive object={boxes} />
}

const PLANTERS: [number, number, number][] = [
  [6.7, -5.45, 1.5],
  [0.6, -5.45, 1.5],
  [-6.4, -5.45, 1.5],
  [-7.6, 2.4, 0.7],
]
const FLOWERS = ['#f1b23a', '#e9792b', '#d9541e', '#f6d16a', '#e2603a', '#fbe7b0']
const GREENS = ['#7c8a3c', '#93993f', '#6f7d38']

/** Round things: flowers in the planters and the heap of leaves. */
export function Softwork() {
  const balls = useDisposable(() => {
    const rnd = mulberry32(31)
    const list: { p: [number, number, number]; s: [number, number, number]; c: string }[] = []
    for (const [x, z, w] of PLANTERS) {
      // a low cushion of green, thick with small flowers (two sizes)
      const bushes = Math.max(2, Math.round(w * 2.4))
      for (let i = 0; i < bushes; i++) {
        const bx = x - w / 2 + ((i + 0.5) / bushes) * w
        const br = (w / bushes) * 0.66
        list.push({ p: [bx, 0.5, z], s: [br, 0.17 + rnd() * 0.05, 0.3], c: GREENS[i % GREENS.length] })
        for (let k = 0; k < 18; k++) {
          const a = rnd() * Math.PI * 2
          const d = Math.sqrt(rnd()) * br * 0.92
          const r = k % 4 === 0 ? 0.062 + rnd() * 0.018 : 0.034 + rnd() * 0.016
          list.push({ p: [bx + Math.cos(a) * d, 0.64 + rnd() * 0.07 - d * 0.12, z + Math.sin(a) * d * 0.72], s: [r, r * 0.7, r], c: FLOWERS[Math.floor(rnd() * FLOWERS.length)] })
        }
      }
    }
    // the heap of leaves (its surface is covered by carpet leaves)
    // …so these mounds stay well under the leaves and are dark: seen between leaves, they read as the shade inside the heap
    list.push({ p: [PILE.x, 0.0, PILE.z], s: [PILE.r * 0.8, 0.3, PILE.r * 0.72], c: '#9a4a18' })
    list.push({ p: [PILE.x + 0.5, 0.0, PILE.z + 0.26], s: [0.5, 0.2, 0.48], c: '#8f4416' })
    list.push({ p: [PILE.x - 0.52, 0.0, PILE.z - 0.14], s: [0.46, 0.18, 0.42], c: '#a3511b' })
    const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshLambertMaterial(), list.length)
    list.forEach((b, i) => {
      mesh.setMatrixAt(i, _m.compose(_p.set(...b.p), _q.identity(), _s.set(...b.s)))
      mesh.setColorAt(i, _c.set(b.c))
    })
    return mesh
  })
  return <primitive object={balls} />
}

/* ── Soft shadows, stretched away from the low sun ──────────────────────────── */

const SHADOWS: [number, number, number, number, number][] = [
  // x, z, width, depth, turn
  [TREE.x + 1.5, TREE.z + 1.6, 9.5, 6.6, -0.6],
  [TREE.x + 0.2, TREE.z + 0.2, 4.6, 4.0, 0],
  [TREE.x + 0.05, TREE.z + 0.1, 2.7, 2.3, 0],
  [3.9, -5.0, 3.4, 1.5, 0],
  ...PLANTERS.map(([x, z, w]): [number, number, number, number, number] => [x + 0.2, z + 0.25, w + 0.9, 1.4, 0]),
  [PILE.x + 0.25, PILE.z + 0.3, 3.3, 2.5, -0.5],
  [0, FENCE_Z + 0.3, 19, 1.3, 0],
  [-FENCE_X + 0.35, 1, 1.3, 15, 0],
  [FENCE_X + 0.3, 1, 1.2, 15, 0],
]
export function Shadows() {
  const mesh = useDisposable(() => {
    const geo = new THREE.PlaneGeometry(1, 1)
    geo.rotateX(-Math.PI / 2)
    const m = new THREE.InstancedMesh(geo, shadowMaterial(0.36), SHADOWS.length)
    SHADOWS.forEach(([x, z, w, d, turn], i) => m.setMatrixAt(i, _m.compose(_p.set(x, 0.07, z), _q.setFromEuler(_e.set(0, turn, 0)), _s.set(w, 1, d))))
    m.renderOrder = 2
    return m
  })
  return <primitive object={mesh} />
}
export const shadowMaterial = (opacity: number) => new THREE.MeshBasicMaterial({ map: blobTexture(), color: '#4b2409', transparent: true, opacity, depthWrite: false })

/* ── The carpet of leaves ───────────────────────────────────────────────────── */

export function LeafCarpet() {
  const mesh = useDisposable(() => {
    const rnd = mulberry32(44)
    const max = 2360
    const geo = new THREE.PlaneGeometry(1, 1)
    geo.rotateX(-Math.PI / 2)
    const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: leafTexture(), alphaTest: 0.4, side: THREE.DoubleSide }), max)
    let k = 0
    const put = (x: number, y: number, z: number, size: number, tilt: number) => {
      _q.setFromEuler(_e.set((rnd() - 0.5) * tilt, rnd() * Math.PI * 2, (rnd() - 0.5) * tilt))
      m.setMatrixAt(k, _m.compose(_p.set(x, y, z), _q, _s.setScalar(size)))
      m.setColorAt(k, _c.set(LEAF_COLORS[Math.floor(rnd() * LEAF_COLORS.length)]).multiplyScalar(0.86 + rnd() * 0.22))
      k++
    }
    // the heap first
    for (let i = 0; i < 460; i++) {
      const a = rnd() * Math.PI * 2
      const d = Math.sqrt(rnd()) * PILE.r * 1.22
      // a round dome that sits clear above the mounds underneath, with loose leaves spilling out around its foot
      const h = 0.46 * Math.sqrt(Math.max(0, 1 - (d / (PILE.r * 1.06)) ** 2))
      put(PILE.x + Math.cos(a) * d, 0.05 + h + rnd() * 0.05, PILE.z + Math.sin(a) * d * 0.9, 0.32 + rnd() * 0.24, 1.25)
    }
    // leaves drifted up against the foot of the tree: they bury the line where the trunk meets the ground
    for (let i = 0; i < 170; i++) {
      const a = rnd() * Math.PI * 2
      const d = 1.0 + rnd() * 0.8
      put(TREE.x + Math.sin(a) * d + 0.05, 0.05 + rnd() * 0.2 * (1 - (d - 1.0) / 0.8), TREE.z + Math.cos(a) * d, 0.28 + rnd() * 0.22, 0.9)
    }
    // then the yard: thick along the fence and under the tree, thinner where Sari runs
    for (let tries = 0; k < max && tries < 20000; tries++) {
      const x = (rnd() * 2 - 1) * 11
      const z = -7.4 + rnd() * 19
      const dTree = Math.hypot(x - TREE.x, z - TREE.z)
      if (dTree < 0.95) continue
      let density = 0.33
      if (Math.abs(x) > 6.6 || z < -4.4) density += 0.45
      if (dTree < 3.6) density += 0.55 * (1 - dTree / 3.6)
      if (Math.abs(x) > FENCE_X || z < FENCE_Z) density = 0.5
      if (z > 6) density += 0.15
      if (rnd() > density) continue
      put(x, 0.03 + rnd() * 0.025, z, 0.24 + rnd() * 0.24, 0.35)
    }
    m.count = k
    m.instanceMatrix.needsUpdate = true
    return m
  })
  return <primitive object={mesh} />
}
