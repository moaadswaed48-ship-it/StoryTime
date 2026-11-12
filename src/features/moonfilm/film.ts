/**
 * The film: the finished scenes of «نزهة على القمر» in story order, joined into one time-line. Everything is still a
 * pure function of the time, so the whole film can be scrubbed and captured frame by frame like a single scene.
 */
import { Painter, STAGE_H, STAGE_W, clamp01 } from './kit/core'
import type { Caption, Note, SceneDef } from './kit/stage'
import { scene4 } from './scene4'
import { scene5 } from './scene5'
import { scene6 } from './scene6'
import { scene7 } from './scene7'
import { scene8 } from './scene8'
import { scene9 } from './scene9'
import { scene11 } from './scene11'

/** Every scene that exists, in story order. */
export const SCENES: SceneDef[] = [scene4, scene5, scene6, scene7, scene8, scene9, scene11]
/** The scenes shown inside the site (a scene joins this list once it has been checked frame by frame). */
export const PUBLISHED = [4, 5, 6, 7, 8, 9, 11]

const DIP = 0.32 // seconds of fade to and from black at a change of scene

export type Film = {
  duration: number
  /** Scene number and where it starts. */
  scenes: { n: number; start: number; duration: number }[]
  /** Every shot's start, in film time. */
  shots: number[]
  render: (P: Painter, T: number) => void
  caption: (T: number) => Caption | null
  score: Note[]
  audit: (fps?: number, limit?: number) => { t: number; scene: number; joint: string; jump: number }[]
}

/** The film made of the given scene numbers (all of them when none are named). */
export function makeFilm(only?: number[]): Film {
  const list = SCENES.filter((s) => !only || only.includes(s.n))
  const parts = list.length ? list : SCENES
  let at = 0
  const scenes = parts.map((s) => {
    const start = at
    at += s.duration
    return { n: s.n, start, duration: s.duration }
  })
  const duration = at
  const find = (T: number) => {
    let i = scenes.length - 1
    while (i > 0 && T < scenes[i].start) i--
    return i
  }
  return {
    duration,
    scenes,
    shots: parts.flatMap((s, i) => s.shots.map((t) => scenes[i].start + t)),
    render(P, T) {
      const i = find(T)
      const t = Math.min(T - scenes[i].start, parts[i].duration)
      parts[i].render(P, t)
      // a short dip to black at each change of scene (never on the film's first or last frame)
      const fadeIn = i > 0 && !parts[i - 1].joins
      const fadeOut = i < parts.length - 1 && !parts[i].joins
      const a = Math.max(fadeIn ? 1 - clamp01(t / DIP) : 0, fadeOut ? 1 - clamp01((parts[i].duration - t) / DIP) : 0)
      if (a > 0) {
        P.screen()
        P.ctx.fillStyle = `rgba(5,7,15,${a})`
        P.ctx.fillRect(-2, -2, STAGE_W + 4, STAGE_H + 4)
      }
    },
    caption(T) {
      const i = find(T)
      const c = parts[i].caption(T - scenes[i].start)
      return c && { ...c, id: `${parts[i].n}:${c.id}` }
    },
    score: parts.flatMap((s, i) => s.score.map((n) => ({ ...n, t: n.t + scenes[i].start }))),
    audit(fps = 30, limit = 40) {
      const out: { t: number; scene: number; joint: string; jump: number }[] = []
      parts.forEach((s, i) => {
        let prev: Record<string, { x: number; y: number }> | null = null
        for (let k = 0; k <= s.duration * fps; k++) {
          const now = s.joints(k / fps)
          // a change of shot may move anybody anywhere: only motion inside a shot is checked
          const cut = s.shots.some((c) => c > (k - 1) / fps + 1e-6 && c <= k / fps + 1e-6)
          if (prev && !cut) {
            for (const j in now) {
              if (!prev[j]) continue
              const d = Math.hypot(now[j].x - prev[j].x, now[j].y - prev[j].y)
              if (d > limit) out.push({ t: +(scenes[i].start + k / fps).toFixed(3), scene: s.n, joint: j, jump: Math.round(d) })
            }
          }
          prev = now
        }
      })
      return out
    },
  }
}
