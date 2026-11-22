/**
 * Places: whole settings composed from the library, each in planes from far to near so a scene gets real depth
 * (hazy distance, overlapping middle ground, a floor the cast stands on). A place draws everything BEHIND the
 * cast; its `…Front` partner draws what overlaps them at the very front of the picture.
 * All sizes follow the Painter's page (P.W × P.H) and the ground line `gy`, so one place serves film and book.
 */
import { drawAnimal, restAnimal } from '../animals'
import { Painter, Pen, blob, circle, curve, cutRect, ellipse, poly, seededList } from '../kit/core'
import { mixHex } from '../style/color'
import { bush, cloud, flower, grass, ground, hills, leafSpray, moon, pathway, potPlant, sea, sky, stars, sun, surf, tree } from './nature'
import { ball, basket, bed, block, book, bucket, bunting, clock, crate, fence, fruit, house, lamp, pinnedDrawing, room, rug, shelf, stall, stoneWall, sunPatch, teddy, toyCar, umbrella, windowIn } from './things'

/** A village on a far slope: a handful of small flat-roofed houses and dark trees, hazed by distance. */
function farVillage(P: Painter, x: number, y: number, w: number, seed: number) {
  const r = seededList(seed, 40)
  for (let i = 0; i < 6; i++) {
    const hx = x + (i / 5 - 0.5) * w + (r[i] - 0.5) * 30
    const hy = y - r[i + 6] * 26
    const s = 34 + r[i + 12] * 22
    house(P, hx, hy, s * 1.3, s, { wall: ['#f6e6c8', '#f1d2b0', '#fbf0da'][i % 3], roof: '#d9856a', flat: i % 3 !== 0, windows: 1, seed: i + 1, trim: '#7fa9b8' })
    if (i % 2) P.shape(blob([hx + s, hy, hx + s * 0.9, hy - s * 1.3, hx + s * 1.1, hy - s * 1.9, hx + s * 1.3, hy - s * 1.3, hx + s * 1.2, hy]), '#4f7f62', { shade: 0.6, line: 0.7 })
  }
}

export type GardenOpts = { gy: number; /** Height of the horizon above the ground line (default 250). */ rise?: number; treeX?: number; treeH?: number; wall?: boolean; fruit?: string; sway?: number; sun?: boolean }
/** A walled garden in the morning: hills and a village far off, a stone wall, a lawn with a path, one fruit tree. */
export function garden(P: Painter, t: number, o: GardenOpts) {
  const gy = o.gy
  const hz = gy - (o.rise ?? 250)
  sky(P, ['#a4d5e6', '#b6dfe6', '#c9e8e6', '#dcefe2'], hz + 30, 5)
  if (o.sun !== false) sun(P, P.W * 0.84, hz - 330, 44)
  P.parallax(0.08)
  P.far(0.45, () => {
    cloud(P, P.W * 0.52 + t * 3, hz - 250, 250, 3)
    cloud(P, P.W * 0.16 + t * 2, hz - 150, 170, 4)
    cloud(P, P.W * 0.93 + t * 2.4, hz - 120, 200, 8)
  })
  P.parallax(0.25)
  P.far(0.8, () => hills(P, hz - 6, 54, 21, '#7fae96', { humps: 4 }))
  P.parallax(0.4)
  P.far(0.58, () => {
    hills(P, hz + 46, 40, 22, '#86b678', { humps: 5 })
    farVillage(P, P.W * 0.45, hz + 62, 420, 7)
  })
  P.parallax(0.6)
  P.far(0.32, () => {
    hills(P, hz + 104, 26, 23, '#a4c96e', { humps: 6 })
    for (const [x, s] of [[0.08, 1], [0.6, 0.8], [0.97, 1.1]] as const) tree(P, P.W * x, hz + 150, 150 * s, { leaf: '#5f9a5a', seed: 3 + Math.round(x * 10), spread: 0.7 })
  })
  P.world()
  // the garden itself
  const lawn = '#b5d277'
  ground(P, gy - 96, lawn, { seed: 31, bow: 14 })
  if (o.wall !== false) {
    P.far(0.12, () => {
      stoneWall(P, -200, P.W * 0.46, gy - 80, 132, '#ecd6ab', 4)
      stoneWall(P, P.W * 0.56, P.W + 200, gy - 80, 132, '#ecd6ab', 6)
      // the gate posts where the path leaves
      for (const x of [P.W * 0.46, P.W * 0.56]) P.shape(cutRect(x - 22, gy - 250, 44, 176, 8, 3, 2), '#e2c594', { shade: 0.8 })
      bush(P, P.W * 0.22, gy - 196, 300, '#6fa25c', 5, '#f08a9a')
      bush(P, P.W * 0.86, gy - 196, 260, '#6fa25c', 6, '#fff3d6')
    })
  }
  pathway(P, [P.W * 0.58, P.H + 60, 170, P.W * 0.5, gy + 20, 96, P.W * 0.5, gy - 62, 52, P.W * 0.51, gy - 96, 40], '#f0dcae', 4)
  grass(P, 0, P.W, gy - 78, 41, '#8fbb5c', 26, 22)
  grass(P, 0, P.W, gy + 60, 42, '#8fbb5c', 16, 30)
  if (o.treeX !== undefined) {
    P.groundShadow(o.treeX + (o.treeH ?? 600) * 0.1, gy - 20, (o.treeH ?? 600) * 0.36, 26)
    tree(P, o.treeX, gy - 20, o.treeH ?? 600, { leaf: '#4f9458', trunk: '#8f6048', fruit: o.fruit ?? '#f59a2c', seed: 12, sway: o.sway ?? 0, spread: 0.84, fruits: 11 })
  }
}
/** The near edge of the garden: flowers and big leaves that overlap the cast's feet. */
export function gardenFront(P: Painter, t: number, gy: number) {
  const sw = Math.sin(t * 1.3) * 0.05
  leafSpray(P, -30, P.H + 30, 330, -0.9, '#3f7f58', 4, 5)
  leafSpray(P, P.W + 30, P.H + 40, 300, -2.3, '#3f7f58', 9, 5)
  for (const [x, h, c] of [[0.1, 150, '#e2674a'], [0.15, 110, '#f2c94c'], [0.045, 120, '#fff3d6'], [0.9, 130, '#e48a9e'], [0.95, 170, '#f2c94c']] as const) flower(P, P.W * x, P.H + 10, h, c, sw + (x - 0.5) * 0.3)
  void gy
}

export type KinderOpts = { gy: number; shelfX?: number; windowX?: number }
/** A kindergarten corner: a sunny window, a shelf of toys and books, children's drawings, a rug. */
export function kindergarten(P: Painter, t: number, o: KinderOpts) {
  const gy = o.gy
  P.world()
  room(P, { floorY: gy - 150, wall: '#f9e4b4', dado: '#a9d3c4', floor: '#e0b07a', skirting: '#fff6e2' })
  const wx = o.windowX ?? P.W * 0.3
  windowIn(P, wx, gy - 560, 330, 300, { curtain: '#e98a6a', sky: '#bfe3ea', hill: '#8fbb78' })
  // the window's light thrown across the wall and the floor
  sunPatch(P, [wx + 260, gy - 150, wx + 620, gy - 150, wx + 980, gy + 120, wx + 480, gy + 120], 0.3)
  bunting(P, wx + 260, gy - 800, P.W + 60, gy - 760, ['#e2674a', '#f2c94c', '#3f8f8a', '#7a4f9a', '#fff3d6'], t, 12)
  for (const [dx, dy, k, r] of [[430, -640, 'sun', -0.06], [600, -610, 'house', 0.05], [760, -650, 'fish', -0.03], [-330, -560, 'flower', 0.07]] as const) pinnedDrawing(P, wx + dx, gy + dy, 130, 104, k, r)
  clock(P, wx - 310, gy - 760, 54, '#e2674a', 10, 12)
  const sx = o.shelfX ?? P.W * 0.82
  shelf(P, sx, gy - 150, 420, 400, '#ecc98f', 3, (row, x0, y, w) => {
    if (row === 0) {
      ball(P, x0 + 56, y, 44, ['#3f8f8a', '#fff3d6'])
      toyCar(P, x0 + 190, y, 46, '#e2674a')
      for (let i = 0; i < 3; i++) block(P, x0 + w - 150 + i * 46, y, 42, 42, ['#f2c94c', '#7a4f9a', '#5f9a52'][i], 0, i === 1 ? 'star' : 'dot')
    } else if (row === 1) {
      for (let i = 0; i < 7; i++) book(P, x0 + 30 + i * 34, y, 28, 96 + (i % 3) * 12, ['#e2674a', '#3f8f8a', '#f2c94c', '#7a4f9a', '#5f8fa8'][i % 5], i === 6 ? 0.2 : 0)
      teddy(P, x0 + w - 70, y, 120)
    } else {
      potPlant(P, x0 + 60, y, 70, { pot: '#e98a6a' })
      basket(P, x0 + w - 110, y, 130, '#d2a565', () => { for (let i = 0; i < 4; i++) P.shape(circle(-44 + i * 30, -8, 20), ['#e2674a', '#f2c94c', '#3f8f8a', '#e48a9e'][i], { shade: 0.5 }) })
    }
  })
  rug(P, P.W * 0.46, gy + 26, 520, 96, ['#d9694a', '#f6e2b8', '#3f8f8a'])
}
export function kindergartenFront(P: Painter, t: number, gy: number) {
  // a plant at the front corner, in shade: it frames the picture and gives the near plane
  potPlant(P, 90, P.H + 70, 260, { pot: '#c96a4a', leaf: '#3f7f58', seed: 8 })
  void t
  void gy
}

/** A child's bedroom at night: a window with the moon, a bed, a lit lamp, a shelf. */
export function bedroom(P: Painter, t: number, o: { gy: number }) {
  const gy = o.gy
  P.world()
  room(P, { floorY: gy - 130, wall: '#c9cdea', floor: '#b98a66', skirting: '#f1e8dc' })
  windowIn(P, P.W * 0.25, gy - 560, 300, 320, { curtain: '#7f8fc9', sky: '#33407a', hill: '#2c4a5e', night: true })
  shelf(P, P.W * 0.86, gy - 130, 300, 330, '#d9b78a', 2, (row, x0, y, w) => {
    if (row === 0) teddy(P, x0 + w / 2, y, 130)
    else for (let i = 0; i < 6; i++) book(P, x0 + 24 + i * 32, y, 26, 90 + (i % 2) * 14, ['#e2674a', '#3f8f8a', '#f2c94c'][i % 3])
  })
  bed(P, P.W * 0.56, gy - 80, 640, { blanket: '#e2674a', frame: '#c79a6a' })
  lamp(P, P.W * 0.76, gy - 110, 420, { lit: true })
  rug(P, P.W * 0.4, gy + 40, 380, 70, ['#5f6fb0', '#f6e2b8', '#e2674a'])
  void t
}

/** A market street: houses in rows going away, two stalls under striped awnings, crates of fruit, bunting. */
export function street(P: Painter, t: number, o: { gy: number }) {
  const gy = o.gy
  const hz = gy - 330
  sky(P, ['#f6d3a0', '#f9e0b4', '#fbebcb'], hz + 60, 9)
  P.parallax(0.2)
  P.far(0.7, () => {
    for (let i = 0; i < 9; i++) house(P, i * 250 - 40, hz + 150, 230, 210 + (i % 3) * 60, { wall: ['#f2d9b4', '#eac7a4', '#f7e6c9'][i % 3], flat: true, windows: 2, seed: i + 3, roof: '#d98a6a', trim: '#8fb3c2' })
  })
  P.parallax(0.5)
  P.far(0.38, () => {
    for (let i = 0; i < 6; i++) house(P, i * 400 + 60, gy - 150, 330, 300 + (i % 2) * 90, { wall: ['#f7dcae', '#f1c9a0', '#fbe9c8'][i % 3], flat: i % 2 === 0, windows: 2, seed: i + 13, roof: '#d9694a', door: ['#3f8f8a', '#7a4f9a', '#5f8fa8'][i % 3], trim: '#5f8fa8' })
  })
  P.world()
  ground(P, gy - 150, '#ecd6a8', { seed: 33, bow: 6 })
  const tiles = new Pen()
  for (let i = -6; i <= 6; i++) {
    tiles.moveTo(P.W / 2 + i * 150, gy - 150)
    tiles.lineTo(P.W / 2 + i * 420, P.H + 40)
  }
  for (const y of [gy - 90, gy - 10, gy + 100]) {
    tiles.moveTo(-200, y)
    tiles.lineTo(P.W + 200, y)
  }
  P.detail(tiles, '#ecd6a8', 0.6)
  bunting(P, -40, gy - 900, P.W * 0.55, gy - 860, ['#e2674a', '#f2c94c', '#3f8f8a', '#fff3d6'], t, 12)
  stall(P, P.W * 0.24, gy - 110, 470, 430, { awning: ['#e2674a', '#fff3d6'], goods: (w) => { crate(P, w * 0.22, 0, 150, 56, '#c79a62', '#f59a2c', 2); crate(P, w * 0.62, 0, 150, 56, '#c79a62', '#e2543f', 3); for (let i = 0; i < 3; i++) fruit(P, w * 0.86 + i * 22, -14, 15, '#f2d24c', i === 1) } })
  stall(P, P.W * 0.78, gy - 110, 420, 400, { awning: ['#3f8f8a', '#f6e2b8'], counter: '#b98556', goods: (w) => { basket(P, w * 0.26, 0, 150, '#d2a565', () => { for (let i = 0; i < 4; i++) fruit(P, -44 + i * 30, -10, 19, '#8fbb4c', false) }); crate(P, w * 0.7, 0, 160, 56, '#c79a62', '#b35a8a', 5) } })
  potPlant(P, P.W * 0.52, gy - 120, 120, { pot: '#c96a4a' })
}

/** The sea shore: far headland, moving sea, surf, sand, a boat far out. */
export function shore(P: Painter, t: number, o: { gy: number }) {
  const gy = o.gy
  const hz = gy - 360
  sky(P, ['#9fd3e6', '#bfe3e8', '#dcefe2', '#f6f0d4'], hz + 20, 15)
  sun(P, P.W * 0.2, hz - 300, 50)
  P.parallax(0.1)
  P.far(0.4, () => {
    cloud(P, P.W * 0.6 + t * 3, hz - 230, 260, 13)
    cloud(P, P.W * 0.9 + t * 2, hz - 120, 180, 14)
  })
  P.parallax(0.3)
  P.far(0.7, () => hills(P, hz + 6, 46, 51, '#7fae96', { x0: P.W * 0.55, x1: P.W + 300, humps: 2, bottom: hz + 30 }))
  P.world()
  sea(P, hz, gy - 110, t)
  // a little boat far out, rocking
  P.far(0.3, () => {
    const c = P.ctx
    c.save()
    c.translate(P.W * 0.36, hz + 70 + Math.sin(t * 1.2) * 4)
    c.rotate(Math.sin(t * 1.2) * 0.05)
    P.shape(poly([4, -8, 4, -120, 70, -20]), '#fff6e2', { shade: 0.8 })
    P.shape(poly([-2, -8, -2, -90, -50, -18]), '#e2674a', { shade: 0.6 })
    P.shape(blob([-80, -10, 90, -10, 64, 24, -56, 24]), '#3f6f8f', { shade: 0.8 })
    c.restore()
  })
  surf(P, gy - 124, t)
  ground(P, gy - 96, '#f1dca6', { seed: 36, bow: 16, texture: 1.4 })
  for (const [x, y, r] of [[0.14, 30, 12], [0.4, 90, 9], [0.68, 10, 11], [0.9, 70, 13]] as const) P.shape(ellipse(P.W * x, gy + y, r * 1.5, r), '#fff6e2', { shade: 0.4, line: 0.7 })
  umbrella(P, P.W * 0.88, gy - 30, 190, ['#e2674a', '#fff3d6'], 0.12)
  bucket(P, P.W * 0.72, gy + 40, 70, '#f2c94c', '#e2674a')
}

/** Rolling hills with a road, a farm far off and sheep on the slope. */
export function meadow(P: Painter, t: number, o: { gy: number }) {
  const gy = o.gy
  const hz = gy - 380
  sky(P, ['#a9d8e6', '#c9e7e0', '#e6efd2'], hz + 40, 25)
  P.parallax(0.08)
  P.far(0.4, () => {
    cloud(P, P.W * 0.3 + t * 3, hz - 220, 280, 23)
    cloud(P, P.W * 0.75 + t * 2, hz - 300, 200, 24)
  })
  P.parallax(0.2)
  P.far(0.85, () => hills(P, hz, 70, 61, '#7fae96', { humps: 3 }))
  P.parallax(0.35)
  P.far(0.6, () => {
    hills(P, hz + 80, 60, 62, '#8fbf7a', { humps: 4 })
    house(P, P.W * 0.7, hz + 96, 110, 64, { roof: '#d9694a', wall: '#fbf0da', windows: 1 })
    tree(P, P.W * 0.76, hz + 100, 130, { seed: 2 })
  })
  P.parallax(0.55)
  P.far(0.3, () => {
    hills(P, hz + 190, 50, 63, '#a4cf6e', { humps: 3 })
    for (const [x, y, f] of [[0.2, 208, 1], [0.27, 226, -1], [0.56, 200, 1]] as const) drawAnimal(P, 'sheep', { ...restAnimal(P.W * x, hz + y), scale: 0.5, flip: f })
  })
  P.world()
  ground(P, gy - 110, '#b9d877', { seed: 66, bow: 30 })
  pathway(P, [P.W * 0.3, P.H + 60, 190, P.W * 0.44, gy + 10, 90, P.W * 0.56, gy - 80, 44, P.W * 0.6, gy - 112, 30], '#f0dcae', 7)
  fence(P, P.W * 0.62, P.W + 100, gy - 60, 110, '#fbf0da')
  tree(P, P.W * 0.12, gy - 40, 560, { leaf: '#5f9a52', seed: 5, sway: Math.sin(t) })
  grass(P, 0, P.W, gy + 40, 67, '#8fbb5c', 20, 30)
  for (const [x, c] of [[0.5, '#e2674a'], [0.55, '#f2c94c'], [0.84, '#fff3d6'], [0.9, '#e48a9e']] as const) flower(P, P.W * x, gy + 90, 90, c, Math.sin(t * 1.4 + x * 9) * 0.06)
}

export const PLACES = { garden, kindergarten, bedroom, street, shore, meadow }
void curve
void mixHex
void moon
void stars
