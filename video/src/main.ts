import '@fontsource-variable/rubik/index.css'
import '@fontsource/noto-naskh-arabic/400.css'
import '@fontsource/noto-naskh-arabic/500.css'
import '@fontsource/noto-naskh-arabic/600.css'
import '@fontsource/noto-naskh-arabic/700.css'
import './type.css'
import { createCompositor, createStage, type Film, type Stage } from './engine/stage'

/**
 * Entry point of the studio page: /?comp=<id>. It builds the chosen film and exposes
 *   window.__film = { ready, frames, fps, W, H, seek(frame) }
 * `seek` draws exactly one frame and resolves when the pixels are final; scripts/render.mjs then captures it.
 */
interface CompDef {
  W: number
  H: number
  fps: number
  build(stage: Stage, params: URLSearchParams): Promise<Film>
}

const COMPS: Record<string, () => Promise<CompDef>> = {
  lab: async () => (await import('./comps/lab')).default,
  'trailer-16x9': async () => (await import('./comps/trailer')).wide,
  'trailer-9x16': async () => (await import('./comps/trailer')).tall,
  'trailer-poster': async () => (await import('./comps/trailer')).poster,
  story: async () => (await import('./comps/story')).default,
}

declare global {
  interface Window {
    __film: { ready: boolean; error?: string; frames: number; fps: number; W: number; H: number; seek(frame: number): Promise<void> }
  }
}

async function boot() {
  const params = new URLSearchParams(location.search)
  const id = params.get('comp') ?? 'lab'
  console.log('boot', Math.round(performance.now()))
  const def = await COMPS[id]()
  console.log('imported', Math.round(performance.now()))
  // every face used anywhere must be decoded before the first frame
  await Promise.all([
    document.fonts.load('400 40px "Rubik Variable"', 'أوراق الخريف Story'),
    document.fonts.load('600 40px "Rubik Variable"', 'أوراق الخريف Story'),
    document.fonts.load('800 40px "Rubik Variable"', 'أوراق الخريف Story'),
    document.fonts.load('900 40px "Rubik Variable"', 'أوراق الخريف Story'),
    document.fonts.load('400 40px "Noto Naskh Arabic"', 'أوراق الخريف'),
    document.fonts.load('500 40px "Noto Naskh Arabic"', 'أوراق الخريف'),
    document.fonts.load('600 40px "Noto Naskh Arabic"', 'أوراق الخريف'),
    document.fonts.load('700 40px "Noto Naskh Arabic"', 'أوراق الخريف'),
  ])
  await document.fonts.ready
  console.log('fonts', Math.round(performance.now()))
  const stage = createStage(def.W, def.H, def.fps)
  const film = await def.build(stage, params)
  const comp = createCompositor(stage)
  window.__film = {
    ready: true,
    frames: Math.round(film.duration * def.fps),
    fps: def.fps,
    W: def.W,
    H: def.H,
    seek: async (frame: number) => {
      await comp.draw(film, frame / def.fps, frame)
    },
  }
}

boot().catch((e) => {
  console.error(e)
  window.__film = { ready: false, error: String(e?.stack ?? e), frames: 0, fps: 24, W: 0, H: 0, seek: async () => {} }
})
