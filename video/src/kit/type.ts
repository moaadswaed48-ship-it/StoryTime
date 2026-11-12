import { clamp, easeOutCubic, easeOutQuart } from '../engine/math'
import type { Stage } from '../engine/stage'

/**
 * Type on the stage is real DOM text, so Arabic is shaped by the browser: right to left, letters joined.
 * A block animates word by word (or as one piece) — never letter by letter, and never with tracking.
 * Every style is a pure function of time; nothing transitions on its own.
 */
export interface TextStyle {
  font: 'display' | 'story' | 'ui'
  size: number
  weight?: number
  color?: string
  /** Max width in px before wrapping. */
  width?: number
  lineHeight?: number
  align?: 'center' | 'right' | 'left'
  /** Soft dark halo so type stays readable on bright picture. */
  shadow?: boolean | string
  dir?: 'rtl' | 'ltr'
  opacity?: number
}

export interface Cue {
  /** When the first word starts to appear, and when the block starts to leave (stage seconds). */
  in: number
  out: number
  stagger?: number
  /** Seconds a word takes to arrive / the block takes to leave. */
  rise?: number
  fall?: number
  mode?: 'words' | 'block'
}

export class TextBlock {
  el: HTMLDivElement
  private words: HTMLElement[] = []
  private baseOpacity: number

  /** `lines`: each string is a line; words are split on spaces. (x, y) is the anchor in stage px. */
  constructor(stage: Stage, lines: string | string[], style: TextStyle, x: number, y: number, anchor: 'center' | 'top' | 'bottom' = 'center') {
    const el = document.createElement('div')
    const cls = style.font === 'display' ? 'f-display' : style.font === 'story' ? 'f-story' : 'f-ui'
    el.className = cls
    el.dir = style.dir ?? 'rtl'
    el.lang = style.dir === 'ltr' ? 'en' : 'ar'
    const align = style.align ?? 'center'
    const w = style.width ?? stage.W * 0.86
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
    const ty = anchor === 'center' ? '-50%' : anchor === 'bottom' ? '-100%' : '0'
    const shadow = style.shadow === true ? '0 2px 28px rgba(18,10,5,0.6), 0 1px 4px rgba(18,10,5,0.55)' : typeof style.shadow === 'string' ? style.shadow : 'none'
    el.style.cssText = `position:absolute;left:${left}px;top:${y}px;width:${w}px;transform:translateY(${ty});text-align:${align};font-size:${style.size}px;` + `${style.weight ? `font-weight:${style.weight};` : ''}${style.lineHeight ? `line-height:${style.lineHeight};` : ''}color:${style.color ?? '#f6f0e4'};text-shadow:${shadow};opacity:0;`
    this.baseOpacity = style.opacity ?? 1
    for (const line of Array.isArray(lines) ? lines : [lines]) {
      const row = document.createElement('span')
      row.className = 't-line'
      const parts = line.split(' ').filter(Boolean)
      parts.forEach((word, i) => {
        const span = document.createElement('span')
        span.className = 't-word'
        span.textContent = word
        row.appendChild(span)
        this.words.push(span)
        if (i < parts.length - 1) row.appendChild(document.createTextNode(' '))
      })
      el.appendChild(row)
    }
    stage.dom.appendChild(el)
    this.el = el
  }

  update(time: number, cue: Cue) {
    const rise = cue.rise ?? 0.6
    const fall = cue.fall ?? 0.4
    const stagger = cue.mode === 'block' ? 0 : (cue.stagger ?? 0.14)
    const last = cue.in + stagger * (this.words.length - 1) + rise
    if (time < cue.in || time > cue.out + fall) {
      this.el.style.opacity = '0'
      this.el.style.visibility = 'hidden'
      return
    }
    this.el.style.visibility = 'visible'
    const leave = clamp((time - cue.out) / fall)
    const lo = 1 - leave * leave * (3 - 2 * leave)
    this.el.style.opacity = String(this.baseOpacity * lo)
    this.el.style.filter = leave > 0 ? `blur(${(leave * 10).toFixed(2)}px)` : 'none'
    const settled = time >= last
    this.words.forEach((w, i) => {
      if (settled) {
        w.style.opacity = '1'
        w.style.transform = 'none'
        w.style.filter = 'none'
        return
      }
      const p = clamp((time - cue.in - i * stagger) / rise)
      const e = easeOutCubic(p)
      w.style.opacity = String(easeOutQuart(p))
      w.style.transform = `translateY(${((1 - e) * 0.38).toFixed(4)}em)`
      w.style.filter = p < 1 ? `blur(${((1 - e) * 14).toFixed(2)}px)` : 'none'
    })
  }
}

/** A plain DOM box on the stage (scrims, rules, pills). Returns the element; style it per frame. */
export function box(stage: Stage, css: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = `position:absolute;${css}`
  stage.dom.appendChild(el)
  return el
}

/** Western digits → Arabic-Indic, as the site's num() does for Arabic. */
export const arNum = (n: number | string) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
