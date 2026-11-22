/**
 * Puts a scene on a web page: the canvas, and over it the real text of a book page or the caption of a film.
 * Used by the Studio export page (studio/main.ts) and by the lab pages, so what is exported is what is seen.
 * Plain DOM, no framework.
 */
import { SCENES } from './scenes'
import { captionAt, renderScene, RTL, type Lang, type Scene } from './scene'
import { PROFILES } from './style/profile'

export type Mounted = { scene: Scene; seek: (t: number) => void; destroy: () => void }
export type MountOpts = {
  lang?: Lang
  style?: string
  captions?: boolean
  /** Canvas pixels per CSS pixel (default: the device's, at most 2). */
  dpr?: number
  /** Show one page of a spread, as a phone held upright does: 1 is the first page in reading order, 2 the second. */
  page?: 1 | 2
}

const LATIN = "'Andika', 'Atkinson Hyperlegible Next', 'Inter', system-ui, sans-serif"
const ARABIC = "'Noto Naskh Arabic', 'Geeza Pro', 'Segoe UI', 'DejaVu Sans', sans-serif"
const HEBREW = "'Noto Sans Hebrew', 'Arial Hebrew', 'Segoe UI', 'DejaVu Sans', sans-serif"
const fontFor = (lang: Lang) => (lang === 'ar' ? ARABIC : lang === 'he' ? HEBREW : LATIN)

const WASH_FILTER = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="st-wash" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="7"/></filter></svg>`

export function mountScene(root: HTMLElement, id: string, o: MountOpts = {}): Mounted {
  const scene = SCENES[id]
  if (!scene) throw new Error(`no scene "${id}"`)
  const lang = o.lang ?? 'en'
  const style = PROFILES[o.style ?? 'gouache'] ?? PROFILES.gouache
  const rtl = RTL[lang]

  // the frame (one page of a spread, or the whole picture) and inside it the picture at its full width
  const frame = document.createElement('div')
  const half = !!o.page
  frame.style.cssText = `position:relative;width:100%;aspect-ratio:${half ? scene.W / 2 : scene.W}/${scene.H};overflow:hidden;background:${style.palette.paper}`
  const box = document.createElement('div')
  // page 1 is the left half in a left-to-right book and the right half in a right-to-left one
  const showRight = half && (o.page === 2) !== rtl
  box.style.cssText = `position:absolute;top:0;left:${showRight ? '-100%' : '0'};width:${half ? 200 : 100}%;height:100%;container-type:inline-size`
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', scene.title)
  box.appendChild(canvas)
  frame.appendChild(box)

  if (scene.words?.length) {
    box.insertAdjacentHTML('beforeend', WASH_FILTER)
    for (const w of scene.words) {
      // the layout mirrors for right-to-left; the picture underneath does not
      const x = rtl ? scene.W - w.x - w.w : w.x
      const zone = document.createElement('div')
      zone.style.cssText = `position:absolute;left:${(x / scene.W) * 100}%;top:${(w.y / scene.H) * 100}%;width:${(w.w / scene.W) * 100}%`
      // the wash is as big as the words need, not as big as the zone allows
      const wash = document.createElement('div')
      wash.style.cssText = `position:absolute;inset:-2.6cqw -3cqw;background:${style.palette.paper};opacity:0.88;border-radius:46% 54% 52% 48% / 58% 46% 54% 42%;filter:url(#st-wash)`
      const p = document.createElement('p')
      p.lang = lang
      p.dir = rtl ? 'rtl' : 'ltr'
      p.textContent = w.text[lang]
      p.style.cssText = `position:relative;margin:0;padding:0 1.6cqw;box-sizing:border-box;font-family:${fontFor(lang)};font-size:${(w.size ?? 0.021) * (lang === 'ar' ? 1.06 : 1) * 100}cqw;line-height:${rtl ? 1.62 : 1.5};font-weight:500;color:#3a2238;text-align:start;text-wrap:pretty;white-space:pre-line`
      zone.append(wash, p)
      box.appendChild(zone)
    }
  }

  let cap: HTMLParagraphElement | null = null
  if (o.captions && scene.captions?.length) {
    cap = document.createElement('p')
    cap.lang = lang
    cap.dir = rtl ? 'rtl' : 'ltr'
    cap.style.cssText = `position:absolute;inset-inline:8%;bottom:4.2%;margin:0;text-align:center;font-family:${fontFor(lang)};font-size:${lang === 'ar' ? 3.3 : 3}cqw;font-weight:600;line-height:1.35;color:#fffaf0;text-shadow:0 0.14cqw 0 #3a2238,0 -0.14cqw 0 #3a2238,0.14cqw 0 0 #3a2238,-0.14cqw 0 0 #3a2238,0.1cqw 0.1cqw 0 #3a2238,-0.1cqw 0.1cqw 0 #3a2238,0.1cqw -0.1cqw 0 #3a2238,-0.1cqw -0.1cqw 0 #3a2238,0 0.4cqw 0.9cqw rgba(58,34,56,.45)`
    box.appendChild(cap)
  }
  root.appendChild(frame)

  let last = 0
  const draw = (t: number) => {
    last = t
    const cssW = box.clientWidth || scene.W
    const dpr = o.dpr ?? Math.min(2, window.devicePixelRatio || 1)
    const pw = Math.max(2, Math.round(cssW * dpr))
    const ph = Math.round((pw * scene.H) / scene.W)
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw
      canvas.height = ph
    }
    renderScene(scene, canvas.getContext('2d')!, pw, t, { lang, style })
    if (cap) {
      const line = captionAt(scene, t)
      cap.textContent = line ? line.text[lang] : ''
    }
  }
  const onResize = () => draw(last)
  window.addEventListener('resize', onResize)
  draw(0)
  return {
    scene,
    seek: draw,
    destroy: () => {
      window.removeEventListener('resize', onResize)
      frame.remove()
    },
  }
}
