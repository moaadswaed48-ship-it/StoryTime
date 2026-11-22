/**
 * Buildings, rooms, furniture, food, toys and everyday objects: the made half of the places-and-props library.
 * Every thing takes a base point (where it stands), a size and its colours, and is drawn through the Painter so it
 * shares the figures' line, shading and texture. Nothing here is tied to one story.
 */
import { Painter, TAU, blob, circle, curve, cutRect, ellipse, poly, rrect, seededList, wobble } from '../kit/core'
import { mixHex } from '../style/color'

const dark = (c: string, k = 0.25) => mixHex(c, '#2a1830', k)
const pale = (c: string, k = 0.4) => mixHex(c, '#fff6e2', k)

// ── buildings and outdoor structures ──────────────────────────────────────────
export type HouseOpts = { wall?: string; roof?: string; door?: string; trim?: string; flat?: boolean; windows?: number; seed?: number }
/** A small house standing on (x, y), `w` wide and `h` high to the eaves. Flat-roofed or pitched. */
export function house(P: Painter, x: number, y: number, w: number, h: number, o: HouseOpts = {}) {
  const wall = o.wall ?? '#f3dcb8'
  const roof = o.roof ?? '#d9694a'
  const trim = o.trim ?? '#5f8fa8'
  const seed = o.seed ?? 1
  if (o.flat) P.shape(cutRect(x - w * 0.54, y - h - h * 0.08, w * 1.08, h * 0.1, 4, seed + 1), dark(wall, 0.12), { shade: 0.4 })
  else P.shape(blob(wobble([x - w * 0.62, y - h, x - w * 0.2, y - h - w * 0.34, x + w * 0.2, y - h - w * 0.34, x + w * 0.62, y - h], 3, seed)), roof, { shade: 1 })
  const body = cutRect(x - w / 2, y - h, w, h, 5, seed, 2.4)
  P.shape(body, wall, { shade: 1.4 })
  P.speckle(body, wall, seed, [x - w / 2, y - h, w, h], 0.8)
  const dw = w * 0.2
  P.shape(blob([x - dw / 2, y, x - dw / 2, y - h * 0.46, x, y - h * 0.58, x + dw / 2, y - h * 0.46, x + dw / 2, y]), o.door ?? dark(roof, 0.2), { shade: 0.6 })
  const n = o.windows ?? 2
  for (let i = 0; i < n; i++) {
    const wx = x + (i === 0 ? -1 : 1) * w * 0.3
    const wy = y - h * (i < 2 ? 0.62 : 0.3)
    P.shape(cutRect(wx - w * 0.08, wy - w * 0.1, w * 0.16, w * 0.2, 3, seed + i), '#3f5f7a', { shade: 0.5 })
    P.shape(cutRect(wx - w * 0.15, wy - w * 0.1, w * 0.07, w * 0.2, 2, seed + i + 4), trim, { shade: 0.3, line: 0.7 })
    P.shape(cutRect(wx + w * 0.08, wy - w * 0.1, w * 0.07, w * 0.2, 2, seed + i + 5), trim, { shade: 0.3, line: 0.7 })
  }
}

/** A picket fence from x0 to x1 standing on y. */
export function fence(P: Painter, x0: number, x1: number, y: number, h: number, color = '#f6ead2', gap = 34) {
  P.shape(rrect(x0, y - h * 0.72, x1 - x0, h * 0.12, 3), color, { shade: 0.4 })
  P.shape(rrect(x0, y - h * 0.32, x1 - x0, h * 0.12, 3), color, { shade: 0.4 })
  for (let x = x0 + gap / 2; x < x1; x += gap) P.shape(blob([x - gap * 0.26, y, x - gap * 0.26, y - h * 0.86, x, y - h, x + gap * 0.26, y - h * 0.86, x + gap * 0.26, y]), color, { shade: 0.5 })
}

/** A low garden wall of fitted stones. */
export function stoneWall(P: Painter, x0: number, x1: number, y: number, h: number, color = '#e3cda4', seed = 3) {
  const p = cutRect(x0, y - h, x1 - x0, h, 8, seed, 4)
  P.shape(p, color, { shade: 1 })
  P.speckle(p, color, seed, [x0, y - h, x1 - x0, h], 0.8)
  const r = seededList(seed, 200)
  const rows = Math.max(2, Math.round(h / 44))
  let k = 0
  P.clip(p, () => {
    for (let j = 0; j < rows; j++) {
      const yy = y - h + (h * j) / rows
      if (j > 0) P.detail(curve([x0, yy + (r[k++ % 200] - 0.5) * 6, (x0 + x1) / 2, yy + (r[k++ % 200] - 0.5) * 6, x1, yy + (r[k++ % 200] - 0.5) * 6]), color, 0.7)
      for (let x = x0 + (j % 2 ? 40 : 90) + r[k++ % 200] * 30; x < x1; x += 90 + r[k++ % 200] * 60) P.detail(curve([x, yy + 3, x + (r[k++ % 200] - 0.5) * 8, yy + h / rows - 3]), color, 0.7)
    }
  })
  P.shape(cutRect(x0 - 8, y - h - 14, x1 - x0 + 16, 22, 8, seed + 2, 3), pale(color, 0.25), { shade: 0.5 })
}

/** A market stall: a counter, two posts and a striped awning; `goods` draws what is on the counter (origin at its top-left, counter width given). */
export function stall(P: Painter, x: number, y: number, w: number, h: number, o: { awning?: [string, string]; counter?: string; goods?: (w: number) => void; seed?: number } = {}) {
  const [a1, a2] = o.awning ?? ['#e2674a', '#fff3d6']
  const wood = o.counter ?? '#b98556'
  const c = P.ctx
  for (const sx of [-1, 1]) P.shape(rrect(x + sx * w * 0.46 - 7, y - h, 14, h, 4), dark(wood, 0.15), { shade: 0.5 })
  const top = y - h * 0.42
  P.shape(cutRect(x - w / 2, top, w, h * 0.42, 5, o.seed ?? 2, 3), wood, { shade: 1.2 })
  for (const u of [0.33, 0.66]) P.detail(curve([x - w / 2 + 6, top + h * 0.42 * u, x + w / 2 - 6, top + h * 0.42 * u + 2]), wood, 0.7)
  P.shape(cutRect(x - w * 0.54, top - 12, w * 1.08, 18, 5, 7, 2), pale(wood, 0.2), { shade: 0.5 })
  if (o.goods) {
    c.save()
    c.translate(x - w / 2, top - 12)
    o.goods(w)
    c.restore()
  }
  // the awning: stripes cut with a scalloped edge
  const ay = y - h
  const n = 7
  const aw = (w * 1.24) / n
  const cloth = new Path2D()
  cloth.moveTo(x - w * 0.5, ay - h * 0.1)
  cloth.lineTo(x + w * 0.5, ay - h * 0.1)
  cloth.lineTo(x + w * 0.62, ay + h * 0.14)
  for (let i = n - 1; i >= 0; i--) cloth.quadraticCurveTo(x - w * 0.62 + aw * (i + 0.5), ay + h * 0.14 + aw * 0.5, x - w * 0.62 + aw * i, ay + h * 0.14)
  cloth.closePath()
  P.shape(cloth, a1, {
    shade: 1,
    over: () => {
      for (let i = 0; i < n; i += 2) P.flat(poly([x - w * 0.5 + (w / n) * i, ay - h * 0.1, x - w * 0.5 + (w / n) * (i + 1), ay - h * 0.1, x - w * 0.62 + aw * (i + 1), ay + h * 0.3, x - w * 0.62 + aw * i, ay + h * 0.3]), a2)
    },
  })
}

/** A string of little flags between two points, sagging; `t` makes it stir. */
export function bunting(P: Painter, x0: number, y0: number, x1: number, y1: number, colors: string[], t = 0, n = 9) {
  const sag = Math.hypot(x1 - x0, y1 - y0) * 0.1
  const at = (u: number) => ({ x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag })
  P.line(curve([x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + sag * 1.9, x1, y1]), '#6b4a55', 2.4)
  for (let i = 0; i < n; i++) {
    const a = at((i + 0.5) / n)
    const s = (Math.hypot(x1 - x0, y1 - y0) / n) * 0.42
    const sw = Math.sin(t * 2 + i) * s * 0.18
    P.shape(poly([a.x - s, a.y, a.x + s, a.y, a.x + sw, a.y + s * 1.9]), colors[i % colors.length], { shade: 0.4, line: 0.7 })
  }
}

// ── indoors ───────────────────────────────────────────────────────────────────
export type RoomOpts = { wall?: string; floor?: string; floorY: number; skirting?: string; dado?: string; seed?: number }
/** The shell of a room: back wall, an optional painted lower band, skirting board and floor with boards running away. */
export function room(P: Painter, o: RoomOpts) {
  const wall = o.wall ?? '#f6e2c0'
  const floor = o.floor ?? '#dba873'
  const x0 = -400
  const x1 = P.W + 400
  const w = rrect(x0, -400, x1 - x0, o.floorY + 400, 0)
  P.shape(w, wall, { line: 0, shade: 0 })
  P.speckle(w, wall, o.seed ?? 11, [0, 0, P.W, o.floorY], 0.5, 1.8)
  if (o.dado) {
    const d = cutRect(x0, o.floorY - 250, x1 - x0, 252, 0, 5, 3)
    P.shape(d, o.dado, { line: 0.5, shade: 0 })
    P.speckle(d, o.dado, 12, [0, o.floorY - 250, P.W, 250], 0.9, 1.6)
  }
  const f = rrect(x0, o.floorY, x1 - x0, P.H - o.floorY + 400, 0)
  P.shape(f, floor, { line: 0, shade: 0 })
  P.speckle(f, floor, 13, [0, o.floorY, P.W, P.H - o.floorY], 1.2, 1.8)
  // floor boards: lines that fan out toward the viewer
  const vx = P.W * 0.5
  const lines = new Path2D()
  for (let i = -14; i <= 14; i++) {
    lines.moveTo(vx + i * 120, o.floorY)
    lines.lineTo(vx + i * 330, P.H + 60)
  }
  P.clip(f, () => P.detail(lines, floor, 0.6))
  P.shape(cutRect(x0, o.floorY - 26, x1 - x0, 30, 0, 9, 1.4), o.skirting ?? pale(wall, 0.5), { line: 0.7, shade: 0.5 })
}

/** A window in a wall: frame, panes with sky and a far hill, and a curtain at each side. */
export function windowIn(P: Painter, x: number, y: number, w: number, h: number, o: { frame?: string; sky?: string; curtain?: string; hill?: string; night?: boolean } = {}) {
  const frame = o.frame ?? '#fff6e2'
  P.shape(cutRect(x - w / 2 - 14, y - h / 2 - 14, w + 28, h + 28, 8, 3, 2), frame, { shade: 0.8 })
  const glass = rrect(x - w / 2, y - h / 2, w, h, 4)
  P.shape(glass, o.sky ?? '#bfe0e6', { shade: 0, line: 0.7, tex: false })
  P.clip(glass, () => {
    P.far(0.5, () => {
      P.flat(blob([x - w * 0.7, y + h * 0.5, x - w * 0.3, y + h * 0.06, x + w * 0.1, y + h * 0.28, x + w * 0.5, y + h * 0.0, x + w * 0.8, y + h * 0.5]), o.hill ?? '#8fb88a')
    })
    if (o.night) P.flat(circle(x + w * 0.2, y - h * 0.2, w * 0.09), '#fdf3d0')
    else P.flat(ellipse(x - w * 0.14, y - h * 0.2, w * 0.2, h * 0.07), '#fffaf0', 0.9)
  })
  P.line(curve([x, y - h / 2, x, y + h / 2]), frame, 9)
  P.line(curve([x - w / 2, y, x + w / 2, y]), frame, 9)
  P.shape(cutRect(x - w / 2 - 26, y + h / 2 + 8, w + 52, 18, 6, 4, 2), frame, { shade: 0.5 })
  if (o.curtain) {
    for (const s of [-1, 1]) {
      const cx = x + s * (w / 2 + 6)
      P.shape(blob([cx - s * 8, y - h / 2 - 22, cx + s * 54, y - h / 2 - 22, cx + s * 60, y + h / 2 + 30, cx + s * 30, y + h / 2 + 22, cx - s * 2, y + h * 0.1, cx + s * 14, y - h * 0.2]), o.curtain, { shade: 1 })
      P.detail(curve([cx + s * 30, y - h / 2 - 10, cx + s * 40, y, cx + s * 44, y + h / 2 + 20]), o.curtain, 0.7)
    }
    P.line(curve([x - w / 2 - 70, y - h / 2 - 24, x + w / 2 + 70, y - h / 2 - 24]), '#8a5a44', 7)
  }
}

/** Sunlight lying on a wall or floor: a flat pale shape with hard edges (the window's shape thrown across the room). */
export function sunPatch(P: Painter, pts: number[], alpha = 0.3, color = '#fff2c4') {
  if (P.sil) return
  const c = P.ctx
  c.save()
  c.globalCompositeOperation = 'soft-light'
  c.globalAlpha = alpha * 2
  c.fillStyle = color
  c.fill(poly(pts))
  c.globalCompositeOperation = 'source-over'
  c.globalAlpha = alpha * 0.5
  c.fill(poly(pts))
  c.restore()
}

/** A round rug lying on the floor (an ellipse because it is seen from the side), with rings. */
export function rug(P: Painter, x: number, y: number, rx: number, ry: number, colors = ['#d9694a', '#f6e2b8', '#3f8f8a']) {
  P.shape(ellipse(x, y, rx, ry), colors[0], { shade: 0, line: 0.8 })
  P.flat(ellipse(x, y, rx * 0.84, ry * 0.84), colors[1])
  P.flat(ellipse(x, y, rx * 0.74, ry * 0.74), colors[2 % colors.length])
  P.flat(ellipse(x, y, rx * 0.46, ry * 0.46), colors[1])
  P.flat(ellipse(x, y, rx * 0.34, ry * 0.34), colors[0])
  P.speckle(ellipse(x, y, rx, ry), colors[0], 21, [x - rx, y - ry, rx * 2, ry * 2], 1.4)
  const fr = new Path2D()
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU
    fr.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * ry)
    fr.lineTo(x + Math.cos(a) * (rx + 9), y + Math.sin(a) * (ry + 5))
  }
  P.line(fr, dark(colors[0], 0.1), 2.4, 0.9)
}

// ── furniture ─────────────────────────────────────────────────────────────────
/** A table standing on (x, y): `w` wide, `h` high. Round-cornered top seen slightly from above. */
export function table(P: Painter, x: number, y: number, w: number, h: number, color = '#c98f5c', seed = 1) {
  P.groundShadow(x, y, w * 0.56, h * 0.09)
  for (const s of [-1, 1]) {
    P.shape(rrect(x + s * w * 0.34 - 8, y - h * 0.9, 16, h * 0.82, 5), dark(color, 0.22), { shade: 0.5 })
    P.shape(rrect(x + s * w * 0.42 - 9, y - h * 0.9, 18, h * 0.9, 5), color, { shade: 0.6 })
  }
  P.shape(cutRect(x - w * 0.46, y - h * 0.86, w * 0.92, h * 0.14, 5, seed, 2), dark(color, 0.14), { shade: 0.4 })
  P.shape(blob(wobble([x - w * 0.5, y - h * 0.9, x - w * 0.44, y - h * 1.04, x + w * 0.44, y - h * 1.04, x + w * 0.5, y - h * 0.9, x + w * 0.48, y - h * 0.84, x - w * 0.48, y - h * 0.84], 1.5, seed)), pale(color, 0.16), { shade: 0.6 })
}
/** The height of a table's top surface above its base (where things are put). */
export const tableTop = (h: number) => h * 0.96

/** A chair seen a little from the side; `flip` −1 turns it to face left. `s` is the seat height. */
export function chair(P: Painter, x: number, y: number, s: number, color = '#5f8fa8', flip = 1) {
  P.groundShadow(x, y, s * 0.5, s * 0.08)
  P.at(x, y, 1, () => {
    const w = s * 0.86
    P.shape(rrect(-w * 0.46, -s, w * 0.1, s, 4), dark(color, 0.2), { shade: 0.4 })
    P.shape(rrect(w * 0.3, -s, w * 0.1, s, 4), dark(color, 0.2), { shade: 0.4 })
    // back: two posts and two rails
    P.shape(rrect(-w * 0.52, -s * 2.05, w * 0.12, s * 2.05, 5), color, { shade: 0.5 })
    P.shape(cutRect(-w * 0.5, -s * 2.0, w * 0.2, s * 0.32, 6, 3, 1.5), color, { shade: 0.5 })
    P.shape(cutRect(-w * 0.5, -s * 1.52, w * 0.2, s * 0.2, 6, 4, 1.5), color, { shade: 0.5 })
    P.shape(rrect(w * 0.38, -s, w * 0.12, s, 5), color, { shade: 0.5 })
    P.shape(blob([-w * 0.56, -s * 1.02, -w * 0.5, -s * 1.14, w * 0.46, -s * 1.14, w * 0.56, -s * 1.02, w * 0.54, -s * 0.92, -w * 0.54, -s * 0.92]), pale(color, 0.14), { shade: 0.7 })
  }, flip)
}

/** A bench for two. */
export function bench(P: Painter, x: number, y: number, w: number, s: number, color = '#b98556') {
  P.groundShadow(x, y, w * 0.56, s * 0.1)
  for (const k of [-1, 1]) P.shape(rrect(x + k * w * 0.4 - 8, y - s, 16, s, 4), dark(color, 0.2), { shade: 0.5 })
  P.shape(cutRect(x - w / 2, y - s * 1.9, w, s * 0.34, 8, 2, 2), color, { shade: 0.7 })
  for (const k of [-1, 1]) P.shape(rrect(x + k * w * 0.44 - 6, y - s * 1.9, 12, s * 0.9, 4), dark(color, 0.1), { shade: 0.4 })
  P.shape(cutRect(x - w * 0.54, y - s * 1.1, w * 1.08, s * 0.2, 8, 3, 2), pale(color, 0.15), { shade: 0.7 })
}

/** Open shelves standing on (x, y); `fill(row, x0, y, w)` draws what is on each shelf (y = the shelf's top). */
export function shelf(P: Painter, x: number, y: number, w: number, h: number, color = '#e9c58f', rows = 3, fill?: (row: number, x0: number, yy: number, ww: number) => void) {
  P.groundShadow(x, y, w * 0.56, 12)
  const back = cutRect(x - w / 2, y - h, w, h, 6, 5, 2)
  P.shape(back, dark(color, 0.26), { shade: 0 })
  for (let i = 0; i < rows; i++) {
    const yy = y - (h * i) / rows - 12
    fill?.(i, x - w / 2 + 16, yy, w - 32)
    P.shape(cutRect(x - w / 2 - 4, yy, w + 8, 14, 4, 6 + i, 1.5), color, { shade: 0.5 })
  }
  P.shape(rrect(x - w / 2 - 8, y - h - 6, 16, h + 6, 5), color, { shade: 0.6 })
  P.shape(rrect(x + w / 2 - 8, y - h - 6, 16, h + 6, 5), color, { shade: 0.6 })
  P.shape(cutRect(x - w / 2 - 12, y - h - 14, w + 24, 18, 5, 9, 1.5), pale(color, 0.2), { shade: 0.5 })
}

/** A bed seen from the side: frame, mattress, pillow, a blanket that can be re-coloured. */
export function bed(P: Painter, x: number, y: number, w: number, o: { frame?: string; blanket?: string; pillow?: string } = {}) {
  const frame = o.frame ?? '#b98556'
  const h = w * 0.3
  P.groundShadow(x, y, w * 0.56, 16)
  P.shape(cutRect(x - w / 2 - 12, y - h * 1.7, 26, h * 1.7, 8, 2, 2), frame, { shade: 0.7 })
  P.shape(cutRect(x + w / 2 - 12, y - h * 1.1, 24, h * 1.1, 8, 3, 2), frame, { shade: 0.7 })
  P.shape(cutRect(x - w / 2, y - h * 0.5, w, h * 0.36, 6, 4, 2), frame, { shade: 0.6 })
  P.shape(cutRect(x - w / 2 + 6, y - h * 0.86, w - 12, h * 0.42, 14, 5, 3), '#fff6e2', { shade: 0.6 })
  P.shape(blob([x - w * 0.47, y - h * 0.9, x - w * 0.44, y - h * 1.2, x - w * 0.24, y - h * 1.22, x - w * 0.2, y - h * 0.9]), o.pillow ?? '#fff6e2', { shade: 0.6 })
  P.shape(blob(wobble([x - w * 0.16, y - h * 0.94, x + w * 0.1, y - h * 1.04, x + w * 0.47, y - h * 0.94, x + w * 0.49, y - h * 0.3, x + w * 0.1, y - h * 0.26, x - w * 0.18, y - h * 0.32], 3, 8)), o.blanket ?? '#5f8fa8', { shade: 1.2 })
}

/** A standing lamp; `lit` shows the pool of light it gives as a flat pale shape under the shade. */
export function lamp(P: Painter, x: number, y: number, h: number, o: { shade?: string; stand?: string; lit?: boolean } = {}) {
  const sh = o.shade ?? '#f2c94c'
  P.groundShadow(x, y, h * 0.12, 6)
  P.shape(rrect(x - 4, y - h * 0.8, 8, h * 0.8, 3), o.stand ?? '#6b4a55', { shade: 0.3 })
  P.shape(ellipse(x, y - 3, h * 0.11, 7), o.stand ?? '#6b4a55', { shade: 0.3 })
  if (o.lit) P.flat(blob([x - h * 0.12, y - h * 0.76, x + h * 0.12, y - h * 0.76, x + h * 0.36, y - h * 0.2, x - h * 0.36, y - h * 0.2]), '#fff2c4', 0.22)
  P.shape(blob([x - h * 0.1, y - h, x + h * 0.1, y - h, x + h * 0.17, y - h * 0.74, x - h * 0.17, y - h * 0.74]), sh, { shade: 0.8 })
}

// ── food ──────────────────────────────────────────────────────────────────────
/** A round fruit (apple, orange, lemon, tomato: it is the colour that says which), with or without a leaf. */
export function fruit(P: Painter, x: number, y: number, r: number, color = '#f0932e', leaf = true) {
  P.shape(blob([x - r, y - r * 0.1, x - r * 0.7, y - r, x + r * 0.7, y - r, x + r, y - r * 0.1, x + r * 0.7, y + r * 0.92, x - r * 0.7, y + r * 0.92]), color, { shade: 0.5, tex: false })
  P.flat(ellipse(x - r * 0.34, y - r * 0.4, r * 0.2, r * 0.3, 0.5), '#fff6dc', 0.5)
  if (leaf) {
    P.line(curve([x, y - r * 0.84, x + r * 0.1, y - r * 1.2]), '#6b4a3a', Math.max(1.4, r * 0.12))
    P.shape(blob([x + r * 0.1, y - r * 1.1, x + r * 0.5, y - r * 1.5, x + r * 0.9, y - r * 1.1, x + r * 0.5, y - r * 0.96]), '#5f9a52', { shade: 0.3, line: 0.7, tex: false })
  }
}
export function bread(P: Painter, x: number, y: number, s: number, color = '#dba15a') {
  P.shape(blob([x - s, y, x - s * 0.9, y - s * 0.62, x, y - s * 0.74, x + s * 0.9, y - s * 0.62, x + s, y]), color, { shade: 0.7 })
  for (const u of [-0.5, 0, 0.5]) P.line(curve([x + u * s - s * 0.12, y - s * 0.6, x + u * s + s * 0.1, y - s * 0.3]), pale(color, 0.5), s * 0.07)
}
export function melonSlice(P: Painter, x: number, y: number, s: number) {
  const p = new Path2D()
  p.arc(x, y - s, s, 0, Math.PI)
  p.closePath()
  P.shape(p, '#5f9a52', { shade: 0.6 })
  const q = new Path2D()
  q.arc(x, y - s, s * 0.82, 0, Math.PI)
  q.closePath()
  P.flat(q, '#ee6a5f')
  for (const [dx, dy] of [[-0.4, 0.3], [0, 0.5], [0.4, 0.3], [-0.2, 0.14], [0.2, 0.16]]) P.flat(ellipse(x + dx * s, y - s + dy * s, s * 0.035, s * 0.06), '#3a2630')
}
/** A bowl; `contents` draws what is in it (origin at the middle of its rim). */
export function bowl(P: Painter, x: number, y: number, w: number, color = '#5f8fa8', contents?: () => void) {
  if (contents) {
    P.ctx.save()
    P.ctx.translate(x, y - w * 0.44)
    contents()
    P.ctx.restore()
  }
  P.shape(blob([x - w / 2, y - w * 0.46, x + w / 2, y - w * 0.46, x + w * 0.34, y - w * 0.06, x + w * 0.16, y, x - w * 0.16, y, x - w * 0.34, y - w * 0.06]), color, { shade: 0.8 })
  P.line(curve([x - w * 0.46, y - w * 0.4, x + w * 0.46, y - w * 0.4]), pale(color, 0.5), w * 0.04)
}
export function cup(P: Painter, x: number, y: number, s: number, color = '#f2c94c') {
  P.line(curve([x + s * 0.4, y - s * 0.74, x + s * 0.8, y - s * 0.6, x + s * 0.4, y - s * 0.26]), dark(color, 0.5), s * 0.2)
  P.line(curve([x + s * 0.4, y - s * 0.74, x + s * 0.8, y - s * 0.6, x + s * 0.4, y - s * 0.26]), color, s * 0.11)
  P.shape(blob([x - s * 0.44, y - s, x + s * 0.44, y - s, x + s * 0.36, y, x - s * 0.36, y]), color, { shade: 0.6 })
}
/** A woven basket with a hoop handle; `contents` draws what is in it (origin at the middle of its rim). */
export function basket(P: Painter, x: number, y: number, w: number, color = '#d2a565', contents?: () => void) {
  const h = w * 0.56
  P.line(curve([x - w * 0.4, y - h, x - w * 0.36, y - h * 1.9, x + w * 0.36, y - h * 1.9, x + w * 0.4, y - h]), dark(color, 0.5), w * 0.085)
  P.line(curve([x - w * 0.4, y - h, x - w * 0.36, y - h * 1.9, x + w * 0.36, y - h * 1.9, x + w * 0.4, y - h]), color, w * 0.05)
  if (contents) {
    P.ctx.save()
    P.ctx.translate(x, y - h)
    contents()
    P.ctx.restore()
  }
  const body = blob([x - w / 2, y - h, x + w / 2, y - h, x + w * 0.4, y, x - w * 0.4, y])
  P.shape(body, color, {
    shade: 0.9,
    over: () => {
      const weave = new Path2D()
      for (let i = 1; i < 4; i++) {
        weave.moveTo(x - w / 2, y - h + (h * i) / 4)
        weave.lineTo(x + w / 2, y - h + (h * i) / 4)
      }
      for (let i = -3; i <= 3; i++) {
        weave.moveTo(x + (i * w) / 7.4, y - h)
        weave.lineTo(x + (i * w) / 8.4, y)
      }
      P.detail(weave, color, 0.6)
    },
  })
  P.shape(cutRect(x - w * 0.54, y - h - w * 0.05, w * 1.08, w * 0.11, w * 0.05, 3, 1), pale(color, 0.2), { shade: 0.4 })
}
/** A wooden crate heaped with round fruit. */
export function crate(P: Painter, x: number, y: number, w: number, h: number, color = '#c79a62', fruitColor = '#f0932e', seed = 1) {
  const r = seededList(seed, 30)
  const n = Math.max(3, Math.round(w / 34))
  for (let j = 0; j < 2; j++) for (let i = 0; i < n - j; i++) fruit(P, x - w * 0.4 + ((i + j * 0.5) / (n - 1)) * w * 0.8 + (r[i + j * 8] - 0.5) * 6, y - h - 6 - j * w * 0.12 + (r[i + 14] - 0.5) * 6, w * 0.085, fruitColor, false)
  P.shape(cutRect(x - w / 2, y - h, w, h, 4, seed, 2), color, { shade: 0.8 })
  for (const u of [0.34, 0.67]) P.detail(curve([x - w / 2 + 4, y - h + h * u, x + w / 2 - 4, y - h + h * u]), color, 0.7)
}

// ── toys ──────────────────────────────────────────────────────────────────────
export function ball(P: Painter, x: number, y: number, r: number, colors = ['#e2674a', '#fff3d6'], roll = 0) {
  const p = circle(x, y - r, r)
  P.shape(p, colors[0], {
    shade: 1,
    over: () => {
      const c = P.ctx
      c.save()
      c.translate(x, y - r)
      c.rotate(roll)
      P.flat(blob([-r * 1.2, -r * 0.3, 0, -r * 0.62, r * 1.2, -r * 0.3, r * 1.2, r * 0.3, 0, 0.0, -r * 1.2, r * 0.3]), colors[1])
      c.restore()
    },
  })
  P.flat(circle(x - r * 0.34, y - r * 1.36, r * 0.16), '#ffffff', 0.6)
}
/** One wooden building block with its lower-left corner at (x, y), turned by `rot` about the middle of its base. */
export function block(P: Painter, x: number, y: number, w: number, h: number, color: string, rot = 0, mark: 'dot' | 'star' | 'bar' | 'none' = 'none') {
  const c = P.ctx
  c.save()
  c.translate(x + w / 2, y)
  c.rotate(rot)
  P.shape(cutRect(-w / 2, -h, w, h, Math.min(w, h) * 0.12, Math.round(w + h), 1), color, { shade: 0.7 })
  if (!P.sil) {
    const m = pale(color, 0.55)
    if (mark === 'dot') P.flat(circle(0, -h / 2, Math.min(w, h) * 0.2), m)
    else if (mark === 'bar') P.flat(rrect(-w * 0.3, -h * 0.6, w * 0.6, h * 0.2, 3), m)
    else if (mark === 'star') {
      const pts: number[] = []
      for (let i = 0; i < 10; i++) pts.push(Math.sin((i / 10) * TAU) * Math.min(w, h) * (i % 2 ? 0.14 : 0.3), -h / 2 - Math.cos((i / 10) * TAU) * Math.min(w, h) * (i % 2 ? 0.14 : 0.3))
      P.flat(poly(pts), m)
    }
  }
  c.restore()
}
/** A sitting teddy bear, `s` tall. */
export function teddy(P: Painter, x: number, y: number, s: number, color = '#c98f5c') {
  const belly = pale(color, 0.5)
  for (const k of [-1, 1]) {
    P.shape(ellipse(x + k * s * 0.24, y - s * 0.08, s * 0.16, s * 0.1, k * 0.3), color, { shade: 0.5 })
    P.shape(ellipse(x + k * s * 0.3, y - s * 0.4, s * 0.09, s * 0.16, k * -0.5), color, { shade: 0.5 })
    P.shape(circle(x + k * s * 0.19, y - s * 0.86, s * 0.085), color, { shade: 0.4 })
  }
  P.shape(ellipse(x, y - s * 0.3, s * 0.24, s * 0.27), color, { shade: 0.9 })
  P.flat(ellipse(x, y - s * 0.27, s * 0.14, s * 0.16), belly)
  P.shape(ellipse(x, y - s * 0.7, s * 0.22, s * 0.2), color, { shade: 0.8 })
  P.flat(ellipse(x, y - s * 0.64, s * 0.1, s * 0.075), belly)
  if (!P.sil) {
    for (const k of [-1, 1]) P.flat(circle(x + k * s * 0.085, y - s * 0.73, s * 0.022), '#2a1a1c')
    P.flat(ellipse(x, y - s * 0.67, s * 0.03, s * 0.02), '#2a1a1c')
    P.line(curve([x - s * 0.04, y - s * 0.62, x, y - s * 0.6, x + s * 0.04, y - s * 0.62]), '#2a1a1c', 1.6)
  }
}
/** A kite in the air at (x, y), tilted by `rot`, with a tail that ripples with `t`. */
export function kite(P: Painter, x: number, y: number, s: number, rot = 0, colors = ['#e2674a', '#f2c94c'], t = 0) {
  const c = P.ctx
  c.save()
  c.translate(x, y)
  c.rotate(rot)
  const tail: number[] = [0, s]
  for (let i = 1; i <= 6; i++) tail.push(Math.sin(i * 1.3 + t * 3) * s * 0.16, s + i * s * 0.26)
  P.line(curve(tail), '#6b4a55', 2)
  for (let i = 1; i <= 3; i++) P.shape(poly([tail[i * 4] - s * 0.1, tail[i * 4 + 1] - s * 0.05, tail[i * 4] + s * 0.1, tail[i * 4 + 1] + s * 0.05, tail[i * 4] + s * 0.1, tail[i * 4 + 1] - s * 0.05, tail[i * 4] - s * 0.1, tail[i * 4 + 1] + s * 0.05]), colors[i % 2], { shade: 0.2, line: 0.6 })
  P.shape(poly([0, -s, s * 0.62, -s * 0.16, 0, s, -s * 0.62, -s * 0.16]), colors[0], { shade: 0.8, over: () => P.flat(poly([0, -s, s * 0.62, -s * 0.16, 0, -s * 0.16]), colors[1]) })
  P.detail(curve([0, -s, 0, s]), colors[0], 0.6)
  P.detail(curve([-s * 0.62, -s * 0.16, s * 0.62, -s * 0.16]), colors[0], 0.6)
  c.restore()
}
export function toyCar(P: Painter, x: number, y: number, s: number, color = '#e2674a', flip = 1) {
  P.at(x, y, 1, () => {
    P.shape(blob([-s, -s * 0.2, -s * 0.96, -s * 0.56, -s * 0.5, -s * 0.62, -s * 0.3, -s * 0.98, s * 0.3, -s * 0.98, s * 0.56, -s * 0.6, s, -s * 0.5, s, -s * 0.2]), color, { shade: 0.7 })
    P.flat(blob([-s * 0.26, -s * 0.9, s * 0.24, -s * 0.9, s * 0.42, -s * 0.62, -s * 0.4, -s * 0.62]), '#bfe0e6')
    for (const k of [-0.56, 0.56]) {
      P.shape(circle(k * s, -s * 0.2, s * 0.22), '#3a2630', { shade: 0.3 })
      P.flat(circle(k * s, -s * 0.2, s * 0.09), '#f6e2b8')
    }
  }, flip)
}
/** A beach bucket with a handle; a spade stands in it when `spade` is given. */
export function bucket(P: Painter, x: number, y: number, s: number, color = '#f2c94c', spade?: string) {
  if (spade) {
    P.line(curve([x + s * 0.1, y - s * 0.8, x + s * 0.4, y - s * 1.7]), dark(spade, 0.4), s * 0.12)
    P.shape(blob([x + s * 0.26, y - s * 1.6, x + s * 0.62, y - s * 1.76, x + s * 0.6, y - s * 2.1, x + s * 0.3, y - s * 2.0]), spade, { shade: 0.4 })
  }
  P.line(curve([x - s * 0.46, y - s * 0.92, x, y - s * 1.5, x + s * 0.46, y - s * 0.92]), dark(color, 0.45), s * 0.07)
  P.shape(blob([x - s * 0.5, y - s, x + s * 0.5, y - s, x + s * 0.36, y, x - s * 0.36, y]), color, { shade: 0.8 })
  P.shape(cutRect(x - s * 0.54, y - s * 1.04, s * 1.08, s * 0.14, s * 0.06, 3, 1), pale(color, 0.3), { shade: 0.3 })
}

// ── everyday things ───────────────────────────────────────────────────────────
/** A closed book lying or standing: `w` wide, `h` high. */
export function book(P: Painter, x: number, y: number, w: number, h: number, color = '#3f8f8a', rot = 0) {
  const c = P.ctx
  c.save()
  c.translate(x, y)
  c.rotate(rot)
  P.shape(cutRect(-w / 2, -h, w, h, 3, Math.round(w), 1), color, { shade: 0.5 })
  P.flat(rrect(-w / 2 + w * 0.12, -h + 2, w * 0.06, h - 4, 1), pale(color, 0.5))
  c.restore()
}
/** An open book, as held in two hands (origin between the hands). */
export function openBook(P: Painter, s: number, color = '#e2674a') {
  P.shape(blob([-s, -s * 0.5, 0, -s * 0.36, s, -s * 0.5, s * 0.96, s * 0.34, 0, s * 0.46, -s * 0.96, s * 0.34]), color, { shade: 0.5 })
  P.shape(blob([-s * 0.9, -s * 0.52, 0, -s * 0.4, s * 0.9, -s * 0.52, s * 0.88, s * 0.24, 0, s * 0.36, -s * 0.88, s * 0.24]), '#fff6e2', { shade: 0.4, line: 0.7 })
  P.detail(curve([0, -s * 0.4, 0, s * 0.36]), '#fff6e2', 0.7)
  if (P.sil) return
  // a picture on one page, lines of writing on the other (never real words)
  P.flat(blob([-s * 0.74, -s * 0.34, -s * 0.2, -s * 0.26, -s * 0.2, s * 0.12, -s * 0.74, s * 0.06]), '#8fc3c9')
  P.flat(circle(-s * 0.56, -s * 0.16, s * 0.07), '#f2c94c')
  const w = new Path2D()
  for (let i = 0; i < 4; i++) {
    w.moveTo(s * 0.18, -s * 0.24 + i * s * 0.12)
    w.lineTo(s * (i === 3 ? 0.5 : 0.74), -s * 0.3 + i * s * 0.12)
  }
  P.line(w, '#7a6a80', Math.max(1.5, s * 0.03), 0.8)
}
export function wateringCan(P: Painter, x: number, y: number, s: number, color = '#5f8fa8', flip = 1) {
  P.at(x, y, 1, () => {
    P.line(curve([-s * 0.4, -s * 0.8, -s * 0.9, -s * 0.9, -s * 0.84, -s * 0.2, -s * 0.4, -s * 0.2]), dark(color, 0.45), s * 0.16)
    P.line(curve([-s * 0.4, -s * 0.8, -s * 0.9, -s * 0.9, -s * 0.84, -s * 0.2, -s * 0.4, -s * 0.2]), color, s * 0.09)
    P.shape(blob([s * 0.3, -s * 0.4, s * 1.0, -s * 1.02, s * 1.14, -s * 0.9, s * 0.4, -s * 0.16]), color, { shade: 0.5 })
    P.shape(ellipse(s * 1.1, -s * 1.0, s * 0.1, s * 0.2, 0.7), pale(color, 0.3), { shade: 0.3 })
    P.shape(blob([-s * 0.46, -s, s * 0.46, -s, s * 0.42, 0, -s * 0.42, 0]), color, { shade: 0.9 })
    P.shape(ellipse(0, -s, s * 0.46, s * 0.1), dark(color, 0.3), { shade: 0, line: 0.8 })
  }, flip)
}
export function umbrella(P: Painter, x: number, y: number, s: number, colors = ['#e2674a', '#f2c94c'], rot = 0) {
  const c = P.ctx
  c.save()
  c.translate(x, y)
  c.rotate(rot)
  P.line(curve([0, 0, 0, -s * 1.5]), '#6b4a55', s * 0.05)
  const p = new Path2D()
  p.moveTo(-s, -s * 1.2)
  p.bezierCurveTo(-s * 0.9, -s * 2.1, s * 0.9, -s * 2.1, s, -s * 1.2)
  for (let i = 3; i >= 0; i--) p.quadraticCurveTo(-s + (i + 0.5) * s * 0.5, -s * 1.36, -s + i * s * 0.5, -s * 1.2)
  p.closePath()
  P.shape(p, colors[0], { shade: 1, over: () => { for (const k of [-0.75, 0.25]) P.flat(blob([k * s, -s * 1.1, k * s + s * 0.1, -s * 2.0, k * s + s * 0.4, -s * 2.0, k * s + s * 0.5, -s * 1.1]), colors[1]) } })
  c.restore()
}
export function clock(P: Painter, x: number, y: number, r: number, color = '#3f8f8a', hour = 10, minute = 10) {
  P.shape(circle(x, y, r), color, { shade: 0.7 })
  P.shape(circle(x, y, r * 0.8), '#fff6e2', { shade: 0, line: 0.7, tex: false })
  if (P.sil) return
  for (let i = 0; i < 12; i++) P.flat(circle(x + Math.sin((i / 12) * TAU) * r * 0.64, y - Math.cos((i / 12) * TAU) * r * 0.64, r * (i % 3 ? 0.03 : 0.055)), '#3a2238')
  const ha = ((hour % 12) / 12 + minute / 720) * TAU
  const ma = (minute / 60) * TAU
  P.line(curve([x, y, x + Math.sin(ha) * r * 0.36, y - Math.cos(ha) * r * 0.36]), '#3a2238', r * 0.09)
  P.line(curve([x, y, x + Math.sin(ma) * r * 0.56, y - Math.cos(ma) * r * 0.56]), '#3a2238', r * 0.06)
}
/** A child's drawing pinned to the wall: paper, a sun or a house or a flower in crayon, and a piece of tape. */
export function pinnedDrawing(P: Painter, x: number, y: number, w: number, h: number, kind: 'sun' | 'house' | 'flower' | 'fish', rot = 0, paper = '#fffaf0') {
  const c = P.ctx
  c.save()
  c.translate(x, y)
  c.rotate(rot)
  P.shape(cutRect(-w / 2, -h / 2, w, h, 3, Math.round(x), 2), paper, { shade: 0.3, line: 0.7 })
  if (!P.sil) {
    const s = Math.min(w, h) * 0.3
    if (kind === 'sun') {
      const rays = new Path2D()
      for (let i = 0; i < 8; i++) {
        rays.moveTo(Math.cos((i / 8) * TAU) * s * 0.7, Math.sin((i / 8) * TAU) * s * 0.7)
        rays.lineTo(Math.cos((i / 8) * TAU) * s * 1.1, Math.sin((i / 8) * TAU) * s * 1.1)
      }
      P.line(rays, '#f0a030', 3)
      P.flat(circle(0, 0, s * 0.5), '#f2c94c')
    } else if (kind === 'house') {
      P.flat(rrect(-s * 0.7, -s * 0.2, s * 1.4, s, 2), '#6fa9d6')
      P.flat(poly([-s * 0.9, -s * 0.2, 0, -s, s * 0.9, -s * 0.2]), '#e2674a')
      P.flat(rrect(-s * 0.16, s * 0.3, s * 0.32, s * 0.5, 1), '#fff3d6')
    } else if (kind === 'flower') {
      P.line(curve([0, s, 0, 0]), '#5f9a52', 3)
      for (let i = 0; i < 5; i++) P.flat(circle(Math.cos((i / 5) * TAU) * s * 0.4, -s * 0.2 + Math.sin((i / 5) * TAU) * s * 0.4, s * 0.3), '#e48a9e')
      P.flat(circle(0, -s * 0.2, s * 0.22), '#f2c94c')
    } else {
      P.flat(ellipse(0, 0, s * 0.8, s * 0.46), '#f0932e')
      P.flat(poly([-s * 0.7, 0, -s * 1.2, -s * 0.44, -s * 1.2, s * 0.44]), '#f0932e')
      P.flat(circle(s * 0.4, -s * 0.1, s * 0.08), '#3a2238')
    }
    P.flat(rrect(-w * 0.12, -h / 2 - 5, w * 0.24, 12, 2), '#f2d9a0', 0.9)
  }
  c.restore()
}
