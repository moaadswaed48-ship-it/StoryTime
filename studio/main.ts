// The Studio export page. /?scene=<id>&lang=en&style=gouache&captions=1 draws one scene and exposes
// window.__studio = { ready, error, list, W, H, duration, shots, loop, seek(t) } for studio/scripts/export.mjs.
import { mountScene } from '@/studio/mount'
import { SCENES } from '@/studio/scenes'
import { toVtt, type Lang } from '@/studio/scene'

const q = new URLSearchParams(location.search)
const api: Record<string, unknown> = { ready: false, error: null, list: Object.values(SCENES).map((s) => ({ id: s.id, title: s.title, W: s.W, H: s.H, duration: s.duration, shots: s.shots ?? [0], loop: !!s.loop, words: !!s.words })) }
try {
  const id = q.get('scene')
  if (id) {
    const m = mountScene(document.getElementById('stage')!, id, { lang: (q.get('lang') ?? 'en') as Lang, style: q.get('style') ?? 'gouache', captions: q.get('captions') === '1', dpr: window.devicePixelRatio, page: q.get('page') === '1' ? 1 : q.get('page') === '2' ? 2 : undefined })
    Object.assign(api, { W: m.scene.W, H: m.scene.H, duration: m.scene.duration, shots: m.scene.shots ?? [0], loop: !!m.scene.loop, seek: m.seek, vtt: (l: Lang) => toVtt(m.scene, l), sound: m.scene.sound ?? [] })
    if (q.get('t')) m.seek(Number(q.get('t')))
  }
  api.ready = true
} catch (e) {
  api.error = String((e as Error).stack ?? e)
}
;(window as unknown as { __studio: unknown }).__studio = api
