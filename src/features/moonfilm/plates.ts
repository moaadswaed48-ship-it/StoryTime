/**
 * Three book pictures drawn with the film's kit (the key poses of scenes 4, 6 and 9 from docs/stories/moon-art.md),
 * to show the style holds across the story. Each is one static frame: the same puppets, set and light as the film.
 */
import { Painter, paperGrain, type Light } from './kit/core'
import { drawPerson, rest, skeleton, type Pose, type Who } from './kit/people'
import { drawEyeHalo, drawRover, roverRest, type Rover } from './kit/wameed'
import { dayRegion, drawEarth, drawGround, drawPrints, drawRocket, drawSky, drawTracks, nightRegion, type Ground, type Print, type Terminator } from './kit/world'

export const STILLS = [4, 6, 9]

type Actor = { who: Who; pose: Pose; basket?: boolean; basketOn?: 'a' | 'b' }

function people(P: Painter, actors: Actor[], shadows: boolean) {
  if (shadows && P.light === 'day') {
    for (const a of actors) P.shadow(a.pose.x, a.pose.y, () => drawPerson(P, a.who, { ...a.pose, x: 0, y: 0, lift: 0 }, { basket: a.basket, basketOn: a.basketOn }), a.pose.lift)
  }
  for (const a of actors) drawPerson(P, a.who, a.pose, { basket: a.basket, basketOn: a.basketOn })
}

// ── 4 · قفزة عالية — the first jump ───────────────────────────────────────────
function plate4(P: Painter) {
  const G = 1000
  P.cam = { x: 0, y: 584, zoom: 0.62 }
  const ground: Ground = {
    horizon: 846,
    cx: 100,
    curve: 9000,
    hills: [[-1300, 260, 44], [-560, 170, 28], [420, 230, 40], [1320, 190, 34]],
    craters: [[-980, 930, 110], [-250, 900, 60], [300, 1010, 84], [1180, 1040, 120], [-1250, 1090, 70]],
    pebbles: [[-700, 990, 7], [-120, 1050, 6], [520, 940, 6], [900, 990, 8], [-1100, 1010, 6]],
  }
  const sari: Pose = {
    ...rest('sari', -40, G + 44), lift: 800, rot: -0.12, sq: 1.03,
    ax: -64, ay: -42, bx: 66, by: -36, fax: -66, fay: 34, fbx: 64, fby: 12,
    mOpen: 1, mWide: 1, mCurve: 1, wide: 0.5, brow: 1, lookY: 0.2, tilt: -0.06,
  }
  const amir: Pose = {
    ...rest('amir', 548, G - 26), lift: 20, crouch: 0.62, lean: -0.3, turn: -0.75, toe: -1, tilt: -0.22,
    lookX: -1, lookY: -1, wide: 0.8, brow: 1, mOpen: 0.7, mWide: 0.8, ax: 30, ay: 40, bx: 52, by: 26, fax: -18, fbx: 14,
  }
  const layla: Pose = {
    ...rest('layla', 0, 0), turn: -0.6, lookX: -1, lookY: -0.8, tilt: -0.14, happy: 1, mOpen: 0.8, mWide: 1, mCurve: 1,
    ax: -40, ay: -46, bx: 14, by: 70, lean: -0.06,
  }
  drawSky(P)
  P.screen()
  drawEarth(P, 330, 196, 56, 12)
  P.world()
  P.light = 'day'
  drawGround(P, ground, -1700, 1700)
  const prints: Print[] = [{ t: 0, x: -62, y: G + 46, who: 'sari' }, { t: 0, x: -18, y: G + 41, who: 'sari' }]
  drawPrints(P, prints, 1)
  P.shadow(620, G - 40, () => drawRocket(P, 0, 0, 1.12), 0, 3, 0.13)
  people(P, [{ who: 'sari', pose: sari }, { who: 'amir', pose: amir }], true)
  drawRocket(P, 620, G - 40, 1.12, () => {
    P.ctx.scale(1 / 1.12, 1 / 1.12)
    drawPerson(P, 'layla', { ...layla, y: 22 }, { basket: true, basketOn: 'b' })
  })
  drawPerson(P, 'amir', amir)
  drawPerson(P, 'sari', sari)
  paperGrain(P)
}

// ── 6 · خطوة.. ليل! — the line between day and night ─────────────────────────
function plate6(P: Painter) {
  const G = 1000
  P.cam = { x: 430, y: 678, zoom: 0.8 }
  const L: Terminator = { x: 0, y: G, slope: 0.5 }
  const ground: Ground = {
    horizon: 870,
    cx: 300,
    curve: 8000,
    hills: [[-640, 240, 40], [-60, 130, 24], [760, 250, 44], [1240, 120, 22], [1700, 200, 34]],
    craters: [[-520, 1010, 86], [-300, 918, 48], [560, 925, 60], [980, 1060, 100], [1420, 960, 56], [330, 1130, 70]],
    pebbles: [[-200, 1080, 7], [420, 1010, 6], [760, 980, 6], [1150, 1000, 7], [1500, 1090, 8], [220, 950, 5]],
  }
  const sari: Pose = {
    ...rest('sari', 78, G), hipx: 10, lean: 0.14, turn: -0.75, toe: -1, tilt: 0.08, lookX: -0.8, lookY: 1,
    fax: -112, fay: 5, fbx: 30, ax: -40, ay: 30, bx: 56, by: 6, mOpen: 0.9, mWide: 1, mCurve: 1, brow: 0.8, crouch: 0.16,
  }
  const amir: Pose = {
    ...rest('amir', 270, G + 14), lift: 74, turn: -0.5, tilt: -0.08, rot: 0.08, sq: 1.03, lookX: -1, lookY: 0.7,
    ax: -62, ay: -8, bx: 62, by: -16, fax: -36, fay: 22, fbx: 32, fby: 8, happy: 1, mOpen: 0.9, mWide: 1, mCurve: 1,
  }
  const layla: Pose = {
    ...rest('layla', 720, G - 16), turn: -0.55, toe: -1, lookX: -1, lookY: 0.3, lean: -0.05, mOpen: 0.3, mWide: 1, mCurve: 1,
    fax: -40, fbx: 30, fby: 10, bx: 12, by: 116, ax: -56, ay: 4,
  }
  // the trail of prints from the rocket to here: small far away, larger as it comes near
  const prints: Print[] = []
  for (let i = 0; i < 40; i++) {
    const k = i / 39
    prints.push({ t: 0, x: 1462 - k * 1240 + (i % 2) * 18, y: 900 + Math.pow(k, 1.6) * 110 + (i % 2) * 8, who: i % 3 === 2 ? 'layla' : i % 3 ? 'amir' : 'sari' })
  }
  const actors: Actor[] = [{ who: 'layla', pose: layla, basket: true, basketOn: 'b' }, { who: 'sari', pose: sari }, { who: 'amir', pose: amir }]
  const scene = (light: Light) => {
    P.light = light
    drawGround(P, ground, -900, 1800)
    if (light === 'day') {
      // the far prints are drawn small: the same oval, scaled toward the horizon
      for (const p of prints) {
        const s = 0.34 + 0.8 * Math.min(1, (p.y - 895) / 100)
        P.ctx.save()
        P.ctx.translate(p.x, p.y)
        P.ctx.scale(s, s)
        drawPrints(P, [{ ...p, x: 0, y: 0 }], 1)
        P.ctx.restore()
      }
      P.shadow(1500, 892, () => drawRocket(P, 0, 0, 0.15), 0, 3.4, 0.13)
      drawRocket(P, 1500, 892, 0.15)
    }
    people(P, actors, true)
  }
  drawSky(P)
  P.screen()
  drawEarth(P, 300, 190, 56, 26)
  P.world()
  P.clip(dayRegion(L), () => scene('day'))
  P.clip(nightRegion(L), () => scene('night'))
  P.light = 'day'
  paperGrain(P)
}

// ── 9 · نصف أرض — half an Earth ───────────────────────────────────────────────
function plate9(P: Painter) {
  const G = 790
  P.cam = { x: 0, y: 566, zoom: 1.3 }
  const ground: Ground = {
    horizon: 742,
    cx: 0,
    curve: 5200,
    hills: [[-640, 150, 20], [-120, 90, 12], [470, 170, 22]],
    craters: [[-560, 840, 44], [610, 830, 52]],
    pebbles: [[-300, 880, 6], [140, 905, 5], [520, 900, 6], [-640, 915, 6]],
  }
  const rover: Rover = { ...roverRest, x: -520, y: G + 6, neck: 1, lookX: 0.4, lookY: -1, glow: 1, lid: 0, sweep: 1, dust: 0 }
  const sari: Pose = {
    ...rest('sari', 40, G - 4), back: 1, lift: 66, sq: 1.04, tilt: -0.08, rot: -0.05,
    ax: -62, ay: -48, aPoint: 1, bx: 30, by: 44, fax: -26, fay: 8, fbx: 28, fby: 2,
  }
  const amir: Pose = { ...rest('amir', 300, G + 8), back: 1, tilt: -0.16, lean: -0.04, ax: -30, ay: -58, bx: 12, by: 72 }
  const layla: Pose = { ...rest('layla', 520, G), back: 1, tilt: -0.14, lean: -0.05, aw: 1, awx: 0, awy: 0, bx: 8, by: 104 }
  // her hand rests on Amir's shoulder
  const sk = skeleton('amir', amir)
  const sh = sk.world(sk.shB)
  layla.awx = sh.x + 2
  layla.awy = sh.y - 16

  drawSky(P)
  P.screen()
  // larger than in any other shot: the camera is low and tilted up
  drawEarth(P, 690, 262, 196, 4, true)
  P.world()
  P.light = 'day'
  drawGround(P, ground, -900, 900)
  drawTracks(P, 20, G + 62, 640, 62)
  const prints: Print[] = [
    { t: 0, x: -150, y: 838, who: 'sari' }, { t: 0, x: -96, y: 846, who: 'sari' }, { t: 0, x: 170, y: 856, who: 'amir' }, { t: 0, x: 226, y: 850, who: 'amir' },
    { t: 0, x: 420, y: 842, who: 'layla' }, { t: 0, x: 470, y: 850, who: 'layla' }, { t: 0, x: 18, y: G + 2, who: 'sari' }, { t: 0, x: 62, y: G - 2, who: 'sari' },
    { t: 0, x: 640, y: 812, who: 'layla' }, { t: 0, x: 690, y: 822, who: 'amir' },
  ]
  drawPrints(P, prints, 1)
  P.shadow(rover.x, rover.y, () => drawRover(P, { ...rover, x: 0, y: 0 }))
  const actors: Actor[] = [{ who: 'layla', pose: layla, basket: true, basketOn: 'b' }, { who: 'sari', pose: sari }, { who: 'amir', pose: amir }]
  for (const a of actors) P.shadow(a.pose.x, a.pose.y, () => drawPerson(P, a.who, { ...a.pose, x: 0, y: 0, lift: 0, aw: 0, ax: -44, ay: -20 }, {}), a.pose.lift)
  drawRover(P, rover)
  drawPerson(P, 'sari', sari)
  drawPerson(P, 'amir', amir)
  drawPerson(P, 'layla', layla, { basket: true, basketOn: 'b' })
  drawEyeHalo(P, rover, 0.7)
  paperGrain(P)
}

export function renderStill(P: Painter, n: number) {
  if (n === 4) plate4(P)
  else if (n === 6) plate6(P)
  else plate9(P)
}
