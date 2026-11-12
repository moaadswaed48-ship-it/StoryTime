import { dirSign } from '@/i18n/locale'
import type { SariAction } from '@/design/SariModel'

/**
 * Which side the text column is on, as a screen direction: +1 = right (Arabic), −1 = left (English).
 * Sari's key light comes from that side, he rests turned a little toward it and he runs toward it,
 * so the whole stage mirrors with the reading direction.
 */
export const SIDE = -dirSign

/** Resting turn (rad): he looks slightly into the page, toward the words. */
export const REST_YAW = 0.16 * SIDE
/** While running he turns three-quarters toward the words, so the stride reads. */
export const RUN_YAW = 0.62 * SIDE
/** How far the stage turns him as it scrolls through the screen (rad at one screen away). */
export const SCROLL_YAW = 0.85
/** Drag sensitivity (rad per px): half a turn in about one hand's swipe. */
export const DRAG = 0.0085
/** A one-off wave lasts this long (ms): about three shakes of the hand. */
export const WAVE_MS = 2600

/**
 * Fast values that change every frame live here, not in React state.
 * Written by the pointer handlers (DOM) and read by the render loop (WebGL), and the other way round.
 */
export interface Runtime {
  /** What he is doing right now (mirrors React state, so the loop never waits for a render). */
  action: SariAction
  /** The visitor's own turn (rad), on top of the resting turn. */
  yaw: number
  /** Turn speed (rad/s) kept after a throw. */
  vel: number
  dragging: boolean
  /** Time of the last touch (ms): he eases back to the front a few seconds after it. */
  lastInput: number
  /** QA: keep the turn exactly where it was put (no easing back). */
  hold: boolean
  /** Stage centre relative to the screen centre, in screens (−1 … 1). Drives the scroll turn and the word's parallax. */
  scroll: number
  /** Pointer inside the stage, −1 … 1 (targets; the loop smooths them). */
  px: number
  py: number
  /** Smoothed 0 … 1: how much the world is rushing past (run). */
  run: number
  /** Total turn actually shown (rad), for QA and the turntable ring. */
  shown: number
  /** When the model appeared (ms): the entrance turn counts from here. 0 = not yet. */
  introAt: number
  /** No entrance, no parallax, no drifting: only what the visitor asks for moves. */
  reduced: boolean
  /** The giant word behind him (DOM): the loop slides it, so there is one clock for everything. */
  word: HTMLElement | null
  /** Width of one word + gap (px): the marquee wraps on it. */
  pitch: number
  /** Marquee travel (px). */
  slide: number
  /** How high a foot has just been lifted, 0 … 1 (decays): proof for QA that the run cycle is really playing. */
  stride: number
  /** Draw calls of the last frame (QA: must stay small). */
  calls: number
  frames: number
}

export const createRuntime = (): Runtime => ({
  action: 'idle',
  yaw: 0,
  vel: 0,
  dragging: false,
  lastInput: 0,
  hold: false,
  scroll: 0,
  px: 0,
  py: 0,
  run: 0,
  shown: REST_YAW,
  introAt: 0,
  reduced: false,
  word: null,
  pitch: 0,
  slide: 0,
  stride: 0,
  calls: 0,
  frames: 0,
})

/** Wraps an angle into (−π, π], so easing home always takes the short way round. */
export const wrapAngle = (a: number) => {
  const t = (a + Math.PI) % (Math.PI * 2)
  return (t < 0 ? t + Math.PI * 2 : t) - Math.PI
}
