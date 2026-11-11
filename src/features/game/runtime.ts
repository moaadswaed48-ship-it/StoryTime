import { START, type Point } from './logic'

/**
 * Fast-changing values shared by the DOM controls and the 3D world.
 * They are written every frame (stick, position, wind), so they live here and never in React state.
 */
export const rt = {
  /** Arrow keys / WASD, screen space: x → right, y → away from the camera. */
  keys: { x: 0, y: 0 },
  /** On-screen stick, same space, length ≤ 1. */
  stick: { x: 0, y: 0 },
  /** Tap-to-walk target on the ground. */
  target: null as Point | null,
  sari: { x: START.x, z: START.z, heading: 0, moving: false },
  /** Live places of the papers (gusts slide them). */
  papers: [] as Point[],
  /** Current gust: direction and strength 0…1 (decays). */
  wind: { x: 1, z: 0, power: 0 },
  /** Bumped to ask the world for a burst of leaves around Sari. */
  burst: 0,
  /** Edge arrows (DOM) that point at papers outside the screen; the world moves them. */
  arrows: [] as (HTMLElement | null)[],
  /** Set when Sari is moved in one jump (QA hooks, a new round): the camera jumps too instead of gliding. */
  snap: false,
  /** QA: keep the "well done" moment on screen instead of moving on after a second. */
  hold: false,
  /** Renderer statistics for QA. */
  calls: 0,
  frames: 0,
}

export function resetRuntime(papers: readonly Point[]) {
  rt.keys.x = rt.keys.y = rt.stick.x = rt.stick.y = 0
  rt.target = null
  rt.sari.x = START.x
  rt.sari.z = START.z
  rt.sari.heading = 0
  rt.sari.moving = false
  rt.papers = papers.map((p) => ({ x: p.x, z: p.z }))
  rt.wind.power = 0
  rt.snap = true
}
