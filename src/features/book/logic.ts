import { story, sceneText, SCENES } from '@/content/story'
import { locale } from '@/i18n/locale'

/** Scenes 1–4 (index 0–3) are free; further scenes need the demo log-in. */
export const FREE_SCENES = 4
/** `scene === SCENES` is the end page. */
export const END = SCENES

export interface Pos {
  scene: number
  step: number
}

/** The author's paragraphs for a scene in the current language (never altered here). */
export const paragraphs = (scene: number): string[] => (scene >= 0 && scene < SCENES ? sceneText(story.scenes[scene], locale) : [])
export const stepCount = (scene: number) => Math.max(1, paragraphs(scene).length)
export const lastStep = (scene: number) => stepCount(scene) - 1
export const clampScene = (n: number) => Math.min(SCENES - 1, Math.max(0, Math.round(Number.isFinite(n) ? n : 0)))

/** One "next": the following paragraph, then the following scene, then the end page. */
export function nextPos(p: Pos): Pos {
  if (p.scene >= END) return p
  if (p.step < lastStep(p.scene)) return { scene: p.scene, step: p.step + 1 }
  return { scene: p.scene + 1, step: 0 }
}

/** One "previous": the paragraph before; from a scene's first paragraph, the last paragraph of the scene before. */
export function prevPos(p: Pos, gated: boolean): Pos {
  if (p.scene >= END) return { scene: SCENES - 1, step: lastStep(SCENES - 1) }
  if (!gated && p.step > 0) return { scene: p.scene, step: p.step - 1 }
  if (p.scene > 0) return { scene: p.scene - 1, step: lastStep(p.scene - 1) }
  return p
}

/**
 * The slow drift of the picture: every paragraph nudges the frame a little (percent of the page, plus a scale
 * that keeps the edges covered). Deterministic, so a turning leaf can be painted exactly like the page it lands on.
 */
export function driftOf(scene: number, step: number): { s: number; tx: number; ty: number } {
  const dir = scene % 2 ? -1 : 1
  const pan = [0, 0.85, -0.55, 0.6, -0.8, 0.35, -0.3]
  const rise = [0, -0.35, 0.3, -0.2, 0.35, -0.3, 0.15]
  const i = Math.min(step, pan.length - 1)
  return { s: 1.045 + Math.min(step, 6) * 0.006, tx: pan[i] * dir, ty: rise[i] }
}
export const driftCss = (scene: number, step: number) => {
  const d = driftOf(scene, step)
  return `translate(${d.tx}%, ${d.ty}%) scale(${d.s})`
}
