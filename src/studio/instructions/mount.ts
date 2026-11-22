/**
 * Puts instruction cards on a web page: the picture on a canvas and the caption as real text, laid over the label
 * the picture draws for it or set on a band under it. Plain DOM, no framework: the lab page and the export page
 * both use this, so what is exported is what is seen.
 *
 * Right-to-left pages: the caption runs right to left and the step number moves to the right; the art is never
 * mirrored.
 */
import { Painter, paperGrain } from '../kit/core'
import { RTL, type Lang } from '../scene'
import type { DirectionId } from '../style/instruction-profiles'
import { ACTIVITIES, ACTIVITY_LIST } from './activities'
import { DIRECTIONS } from './index'
import type { ActivityId, Card, CardKey } from './types'

const LATIN = "'Andika', 'Atkinson Hyperlegible Next', 'Inter', system-ui, sans-serif"
const ARABIC = "'Noto Kufi Arabic', 'Noto Naskh Arabic', 'Geeza Pro', 'Segoe UI', 'DejaVu Sans', sans-serif"
const HEBREW = "'Noto Sans Hebrew', 'Arial Hebrew', 'Segoe UI', 'DejaVu Sans', sans-serif"
export const fontFor = (lang: Lang) => (lang === 'ar' ? ARABIC : lang === 'he' ? HEBREW : LATIN)

export type MountedCard = { el: HTMLElement; card: Card; seek: (t: number) => void; destroy: () => void }
export type CardOpts = { lang?: Lang; dpr?: number; /** Mark a step that moves with a small loop sign (contact sheets). */ badge?: boolean }

const LOOP_SIGN = `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5L19.5 9"/><path d="M19.5 4v5h-5"/><path d="M19.5 12a7.5 7.5 0 0 1-12.6 5.5L4.5 15"/><path d="M4.5 20v-5h5"/></svg>`

export function mountCard(root: HTMLElement, dirId: DirectionId, activityId: ActivityId, key: CardKey, o: CardOpts = {}): MountedCard {
  const dir = DIRECTIONS[dirId]
  const activity = ACTIVITIES[activityId]
  const card = activity.cards.find((c) => c.key === key)
  if (!dir || !activity || !card) throw new Error(`no instruction card ${dirId}/${activityId}/${key}`)
  const pr = dir.profile
  const lang = o.lang ?? 'en'
  const rtl = RTL[lang]
  const steps = activity.cards.filter((c) => c.n > 0).length
  const cap = pr.caption

  const el = document.createElement('figure')
  el.lang = lang
  el.dir = rtl ? 'rtl' : 'ltr'
  el.style.cssText = 'margin:0;display:block;width:100%;container-type:inline-size'
  // the card: its corners are round at any size, and they clip the picture and the caption band together
  const box = document.createElement('div')
  box.style.cssText = `border-radius:${pr.radius * 100}cqw;overflow:hidden;background:${cap.band ?? pr.style.palette.paper}`
  el.appendChild(box)
  const pic = document.createElement('div')
  pic.style.cssText = `position:relative;width:100%;aspect-ratio:${pr.W}/${pr.H};background:${pr.style.palette.paper}`
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', card.caption[lang])
  pic.appendChild(canvas)
  box.appendChild(pic)

  const words = document.createElement('figcaption')
  words.textContent = card.caption[lang]
  const sizeK = lang === 'ar' ? 1.04 : 1
  const type = `margin:0;font-family:${fontFor(lang)};font-weight:${cap.weight};color:${cap.color};line-height:${rtl ? 1.4 : 1.16};text-align:center;text-wrap:balance;letter-spacing:${rtl ? 'normal' : '-0.005em'}`
  let zone: HTMLElement
  if (cap.place === 'over' && cap.box) {
    const b = card.n === 0 && cap.box0 ? cap.box0 : cap.box
    zone = document.createElement('div')
    const bx = rtl ? pr.W - b.x - b.w : b.x
    zone.style.cssText = `position:absolute;left:${(bx / pr.W) * 100}%;top:${(b.y / pr.H) * 100}%;width:${(b.w / pr.W) * 100}%;height:${(b.h / pr.H) * 100}%;display:flex;align-items:center;justify-content:center;padding:0 2.4cqw;box-sizing:border-box`
    words.style.cssText = type
    zone.appendChild(words)
    pic.appendChild(zone)
  } else {
    zone = document.createElement('div')
    zone.style.cssText = `display:flex;align-items:center;justify-content:center;min-height:${(cap.bandH ?? 0.18) * 100}cqw;padding:1.6cqw 5cqw 2cqw;box-sizing:border-box;background:${cap.band ?? 'transparent'}`
    words.style.cssText = type
    zone.appendChild(words)
    box.appendChild(zone)
  }
  if (o.badge && card.loop) {
    const sign = document.createElement('div')
    sign.innerHTML = LOOP_SIGN
    sign.style.cssText = `position:absolute;top:3.4cqw;inset-inline-end:3.4cqw;width:9cqw;height:9cqw;padding:1.7cqw;box-sizing:border-box;border-radius:50%;background:rgba(255,250,240,.94);color:#3a2a44;box-shadow:0 .4cqw 1.2cqw rgba(40,24,52,.28)`
    pic.appendChild(sign)
  }
  root.appendChild(el)

  // the caption must fit its label: long lines step down in size, never below 78 %
  const fit = () => {
    let k = 1
    const set = () => (words.style.fontSize = `${cap.size * sizeK * k * 100}cqw`)
    set()
    if (cap.place !== 'over') return
    for (let i = 0; i < 6 && (words.scrollHeight > zone.clientHeight || words.scrollWidth > zone.clientWidth) && k > 0.78; i++) {
      k *= 0.95
      set()
    }
  }

  let last = card.still ?? 0
  const draw = (t: number) => {
    last = t
    const cssW = pic.clientWidth || pr.W
    const dpr = o.dpr ?? Math.min(2, window.devicePixelRatio || 1)
    const pw = Math.max(2, Math.round(cssW * dpr))
    const ph = Math.round((pw * pr.H) / pr.W)
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw
      canvas.height = ph
    }
    const ctx = canvas.getContext('2d')!
    const P = new Painter(ctx, pw, pr.W, pr.H)
    P.style = pr.style
    P.holdFps = pr.holdFps
    P.screen()
    ctx.fillStyle = pr.style.palette.paper
    ctx.fillRect(0, 0, pr.W, pr.H)
    dir.draw(P, { activity, card, t, rtl, steps })
    paperGrain(P)
  }
  const onResize = () => {
    fit()
    draw(last)
  }
  window.addEventListener('resize', onResize)
  fit()
  draw(last)
  return {
    el,
    card,
    seek: draw,
    destroy: () => {
      window.removeEventListener('resize', onResize)
      el.remove()
    },
  }
}

export type SetOpts = CardOpts & { /** Cards per row (1 on a phone, 2 or 3 on a tablet). */ cols?: number; /** Only this activity. */ only?: ActivityId }
export type MountedSet = { cards: MountedCard[]; destroy: () => void }

/** A whole activity page section: for each activity its title and age, then its cards in reading order. */
export function mountSet(root: HTMLElement, dirId: DirectionId, o: SetOpts = {}): MountedSet {
  const lang = o.lang ?? 'en'
  const rtl = RTL[lang]
  const cols = o.cols ?? 1
  const wrap = document.createElement('div')
  wrap.dir = rtl ? 'rtl' : 'ltr'
  wrap.lang = lang
  wrap.style.cssText = `container-type:inline-size;font-family:${fontFor(lang)};color:#33283a`
  root.appendChild(wrap)
  const cards: MountedCard[] = []
  for (const a of ACTIVITY_LIST) {
    if (o.only && a.id !== o.only) continue
    const head = document.createElement('div')
    head.style.cssText = `display:flex;align-items:center;gap:${cols > 1 ? 1.4 : 2.6}cqw;padding:${cols > 1 ? '2.6cqw 0 1.6cqw' : '5cqw 0 3.2cqw'}`
    const age = document.createElement('span')
    age.textContent = a.ages
    age.style.cssText = `flex:none;font-weight:800;font-size:${cols > 1 ? 1.9 : 3.8}cqw;padding:.25em .7em;border-radius:99em;background:#33283a;color:#fff8ea;font-family:${LATIN};direction:ltr`
    const title = document.createElement('h2')
    title.textContent = a.title[lang]
    title.style.cssText = `margin:0;font-weight:800;font-size:${cols > 1 ? 3 : 5.6}cqw;line-height:1.2`
    head.append(age, title)
    wrap.appendChild(head)
    const grid = document.createElement('div')
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${cols > 1 ? 2 : 4.2}cqw`
    wrap.appendChild(grid)
    for (const c of a.cards) cards.push(mountCard(grid, dirId, a.id, c.key, o))
  }
  return {
    cards,
    destroy: () => {
      for (const c of cards) c.destroy()
      wrap.remove()
    },
  }
}
