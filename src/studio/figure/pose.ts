/**
 * A pose: every number that places a figure and makes it act. Poses are plain numbers so they can be key-framed
 * with `track()` and blended, and they are measured in the figure's own proportions (arm lengths, leg lengths,
 * head sizes), never in pixels: the same pose works on a toddler and on a grandfather.
 *
 * Sides are the character's own: `r…` is the character's right arm or leg (on screen left when it faces us),
 * `l…` its left. They match the standard bone names in `src/cast/sheet.ts` (rightUpperArm, leftHand, …).
 */

export type Pose = {
  /** Ground point between the feet, in stage units. */
  x: number
  y: number
  /** Height above the ground, in body heights (a jump). */
  lift: number
  /** Hips: sideways shift (in half shoulder widths), 0…1 crouch, torso lean (radians, + toward screen right). */
  hipx: number
  crouch: number
  lean: number
  /** Squash (<1) and stretch (>1) of the torso. */
  sq: number
  /** Whole-body rotation about the hips, radians (tumbling). */
  rot: number
  /** 0…1 bending forward toward the viewer (a bow): the torso shortens and the head comes down in front of the chest. */
  pitch: number
  /**
   * Which way the figure faces, radians about the upright axis: 0 faces us, +π/2 is a side view facing screen right,
   * −π/2 faces screen left, π shows the back; ±π/4 is a three-quarter view. The whole skeleton is turned, so a
   * turn passes through every view in between.
   */
  spin: number
  /** Shoulders turned against the hips, radians (+ = chest toward screen right): the counter-swing of a walk, a reach across. */
  twist: number
  /** −1…1 curve of the back, seen from the side: + rounds it (a slump, curling over something), − hollows it (chest out, proud). */
  arc: number
  /** Extra tilt of the hip line and of the shoulder line in the picture, radians (+ = screen-right side down). They already counter each other when `hipx` puts the weight on one leg. */
  hipTilt: number
  shTilt: number
  /** Head: −1…1 turn (− toward screen left), tilt (radians), −1…1 nod (+ looks down). */
  turn: number
  tilt: number
  nod: number

  // ── the face ──
  /** Where the eyes look, −1…1 each way. */
  lookX: number
  lookY: number
  /** 0 open … 1 shut. */
  blink: number
  /** 0…1 heavy upper lids (sleepy, doubtful). */
  lids: number
  /** 0…1 eyes wide open (surprise, fear). */
  wide: number
  /** 0…1 cheeks pushed up into the eyes (a real smile; at 1 the eyes become arcs). */
  cheek: number
  /** Brows: −1 low … 1 high; tilt −1 = cross (inner ends down) … 1 = worried (inner ends up). */
  brow: number
  browTilt: number
  /** Mouth: −1 frown … 1 smile; 0…1 open; 0 small round … 1 wide; 0…1 a wobbling, unsure line. */
  smile: number
  open: number
  mWide: number
  wob: number
  /** Extra colour in the cheeks, 0…1 (shy, hot, proud). */
  flush: number

  // ── arms: where each hand goes ──
  /** From its own shoulder, in arm lengths: x + = out to its own side, y + = down. (0.05, 0.97) hangs. */
  rx: number
  ry: number
  lx: number
  ly: number
  /** …and forward (+) or back (−) of the shoulder, in arm lengths: a reach toward what the figure faces, the swing of a walking arm. */
  rz: number
  lz: number
  /** …or (weight 0…1) a point on the body: x in half shoulder widths from the centre line (+ = own side), y 0 = shoulders … 1 = hips. */
  rB: number
  rBx: number
  rBy: number
  lB: number
  lBx: number
  lBy: number
  /** …or (weight 0…1) a point on the head: in head half-widths and half-heights from its centre (x + = own side, y + = down). */
  rH: number
  rHx: number
  rHy: number
  lH: number
  lHx: number
  lHy: number
  /** …or (weight 0…1) a point in the world, stage units (holding something, touching someone). */
  rW: number
  rWx: number
  rWy: number
  lW: number
  lWx: number
  lWy: number
  /** How far toward the viewer (+) or away (−) that world point is, in arm lengths from the shoulder (it decides whether the arm passes in front of the body). */
  rWd: number
  lWd: number
  /** Hand shape: 0 relaxed (fingers softly curled), 1 pointing, 2…4 that many fingers held up, 5 open with fingers spread, 6 closed (a grip or a fist), 7 an open palm held flat (offering, receiving, a stop). */
  rHand: number
  lHand: number
  /** Extra turn of the hand at the wrist, radians. */
  rWrist: number
  lWrist: number
  /** 1 = that arm passes behind the body. */
  rBack: number
  lBack: number
  /** Which way the elbow bends, 0…1 between the two solutions, or −1 to let the rig choose. */
  rBend: number
  lBend: number

  // ── legs ──
  /** Each foot from its resting place: x in leg lengths along the screen (+ right), y in leg lengths up. */
  rfx: number
  rfy: number
  lfx: number
  lfy: number
  /** …and forward (+) or back (−), in leg lengths along the way the figure faces: a step. Sitting on the ground, 0.3 or more stretches the leg out in front. */
  rfz: number
  lfz: number
  /** How far each heel is lifted, radians (+ = heel up, on the ball of the foot; − = toes up, landing on the heel). */
  rfa: number
  lfa: number
  /** 0…1 that knee on the ground (the other foot stands in front, knee up). Both at 1: kneeling on both knees. */
  rKneel: number
  lKneel: number
  /** −1…1: the feet and knees turned away from the way the body faces (+ toward screen right when it faces us). 0 = straight ahead. */
  toe: number
  /** 0…1 up on the toes: heels lifted, the whole figure a little taller. */
  tip: number
  /** 0 standing … 1 sitting; `seat` is the height of what is sat on, in leg lengths (0 = on the ground, legs crossed; 0.5 = a chair of the sitter's own knee height). */
  sit: number
  seat: number
  /** Swing of whatever hangs (braids, ponytail, scarf, bag, skirt), radians. */
  swing: number
}

export const HAND = { relaxed: 0, point: 1, two: 2, three: 3, four: 4, open: 5, grip: 6, palm: 7 } as const
/** The views a figure is usually drawn in, as values for `spin` (multiply by −1 to face screen left). */
export const VIEW = { front: 0, threeQuarter: Math.PI / 4, side: Math.PI / 2, backThreeQuarter: (Math.PI * 3) / 4, back: Math.PI } as const

/** Standing at ease, arms hanging, a small closed smile. */
export function rest(x = 0, y = 0): Pose {
  return {
    x, y, lift: 0, hipx: 0, crouch: 0, lean: 0, sq: 1, rot: 0, pitch: 0, spin: 0, twist: 0, arc: 0, hipTilt: 0, shTilt: 0,
    turn: 0, tilt: 0, nod: 0,
    lookX: 0, lookY: 0, blink: 0, lids: 0, wide: 0, cheek: 0.15, brow: 0, browTilt: 0,
    smile: 0.45, open: 0, mWide: 0.5, wob: 0, flush: 0,
    rx: 0.07, ry: 0.97, lx: 0.07, ly: 0.97, rz: 0, lz: 0,
    rB: 0, rBx: 0, rBy: 0, lB: 0, lBx: 0, lBy: 0,
    rH: 0, rHx: 0, rHy: 0, lH: 0, lHx: 0, lHy: 0,
    rW: 0, rWx: 0, rWy: 0, lW: 0, lWx: 0, lWy: 0, rWd: 0, lWd: 0,
    rHand: 0, lHand: 0, rWrist: 0, lWrist: 0, rBack: 0, lBack: 0, rBend: -1, lBend: -1,
    rfx: 0, rfy: 0, lfx: 0, lfy: 0, rfz: 0, lfz: 0, rfa: 0, lfa: 0, rKneel: 0, lKneel: 0, toe: 0, tip: 0,
    sit: 0, seat: 0, swing: 0,
  }
}

/** Only the face numbers of a pose. */
export type Face = Pick<Pose, 'lookX' | 'lookY' | 'blink' | 'lids' | 'wide' | 'cheek' | 'brow' | 'browTilt' | 'smile' | 'open' | 'mWide' | 'wob' | 'flush'>

const F = (f: Partial<Face>): Partial<Face> => f
/**
 * Named expressions, as partial poses to lay over any body pose (`{ ...pose, ...FACES.worry }`) or to key-frame.
 * This is the acting range every character shares.
 */
export const FACES = {
  calm: F({ smile: 0.45, open: 0, cheek: 0.15, brow: 0, browTilt: 0, lids: 0, wide: 0, wob: 0, blink: 0, mWide: 0.5, flush: 0 }),
  smile: F({ smile: 0.9, open: 0, cheek: 0.55, brow: 0.2, browTilt: 0, lids: 0, wide: 0, wob: 0, mWide: 0.8 }),
  delight: F({ smile: 1, open: 0.75, cheek: 1, brow: 0.7, browTilt: 0.1, lids: 0, wide: 0, wob: 0, mWide: 1, flush: 0.5 }),
  laugh: F({ smile: 1, open: 1, cheek: 1, brow: 0.5, browTilt: 0.25, lids: 0, wide: 0, wob: 0, mWide: 0.9, flush: 0.7 }),
  surprise: F({ smile: 0, open: 0.6, cheek: 0, brow: 1, browTilt: 0.1, lids: 0, wide: 1, wob: 0, mWide: 0.08 }),
  curious: F({ smile: 0.2, open: 0.14, cheek: 0, brow: 0.6, browTilt: 0.2, lids: 0, wide: 0.5, wob: 0, mWide: 0.2 }),
  think: F({ smile: -0.1, open: 0, cheek: 0, brow: 0.35, browTilt: -0.35, lids: 0.18, wide: 0, wob: 0.25, mWide: 0.3, lookX: 0.7, lookY: -0.7 }),
  worry: F({ smile: -0.55, open: 0, cheek: 0, brow: 0.55, browTilt: 1, lids: 0, wide: 0.45, wob: 1, mWide: 0.55 }),
  sad: F({ smile: -1, open: 0, cheek: 0, brow: -0.1, browTilt: 1, lids: 0.35, wide: 0, wob: 0.3, mWide: 0.45, lookY: 0.7 }),
  cross: F({ smile: -0.7, open: 0, cheek: 0.25, brow: -0.7, browTilt: -1, lids: 0.25, wide: 0, wob: 0, mWide: 0.4 }),
  shy: F({ smile: 0.6, open: 0, cheek: 0.5, brow: 0.3, browTilt: 0.6, lids: 0.3, wide: 0, wob: 0.2, mWide: 0.3, lookX: -0.5, lookY: 0.8, flush: 1 }),
  sleepy: F({ smile: 0.1, open: 0, cheek: 0, brow: -0.25, browTilt: 0.45, lids: 0.72, wide: 0, wob: 0, mWide: 0.35, lookY: 0.4 }),
  yawn: F({ smile: -0.2, open: 1, cheek: 0.7, brow: 0.5, browTilt: 0.7, lids: 0.4, wide: 0, wob: 0, mWide: 0.12, blink: 1 }),
  asleep: F({ smile: 0.35, open: 0, cheek: 0, brow: -0.1, browTilt: 0.2, lids: 0, wide: 0, wob: 0, mWide: 0.3, blink: 1 }),
} as const
export type FaceName = keyof typeof FACES

/** Blend two poses number by number (k = 0 gives `a`, 1 gives `b`). */
export function mixPose(a: Pose, b: Pose, k: number): Pose {
  const out = { ...a } as Record<string, number>
  const B = b as unknown as Record<string, number>
  for (const key in out) out[key] += (B[key] - out[key]) * k
  // hand shapes and "behind the body" are choices, not amounts: they switch half-way
  for (const key of ['rHand', 'lHand', 'rBack', 'lBack'] as const) out[key] = k < 0.5 ? a[key] : b[key]
  // a choice left to the rig stays left to the rig
  for (const key of ['rBend', 'lBend'] as const) if (a[key] < 0 || b[key] < 0) out[key] = -1
  return out as unknown as Pose
}
