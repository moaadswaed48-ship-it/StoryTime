/**
 * A picture inside a sheet: draws a whole scene (with its own page size, mood and lights) into a hand-cut frame on
 * a larger page. Used by proof sheets that show the same scene several ways side by side.
 */
import { Painter, cutRect } from '../kit/core'

const SHEETS: HTMLCanvasElement[] = []
/** Draws `fn` (a scene of W × H stage units) into the rectangle (x, y, w, h) of the sheet `P` is painting. */
export function panel(P: Painter, slot: number, x: number, y: number, w: number, h: number, W: number, H: number, fn: (Q: Painter) => void) {
  const cv = (SHEETS[slot] ??= document.createElement('canvas'))
  const pw = Math.max(2, Math.round(w * P.s))
  const ph = Math.max(2, Math.round(h * P.s))
  if (cv.width !== pw || cv.height !== ph) {
    cv.width = pw
    cv.height = ph
  }
  const g = cv.getContext('2d')!
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'
  g.fillStyle = P.style.palette.paper
  g.fillRect(0, 0, pw, ph)
  const Q = new Painter(g, pw, W, H)
  Q.style = P.style
  Q.holdFps = P.holdFps
  Q.screen()
  fn(Q)
  const c = P.ctx
  c.save()
  P.screen()
  c.clip(cutRect(x, y, w, h, 18, slot + 3, 3))
  c.drawImage(cv, x, y, w, h)
  c.restore()
}
