/**
 * Maps a normalized point (nx, ny in 0..1) of an image drawn with `object-fit: cover`
 * and `object-position: px% py%` inside a box to pixel coordinates relative to that box.
 */
export function coverPoint(
  nx: number,
  ny: number,
  img: { w: number; h: number },
  box: { w: number; h: number },
  pos: { px: number; py: number },
): { x: number; y: number } {
  const scale = Math.max(box.w / img.w, box.h / img.h)
  const W = img.w * scale
  const H = img.h * scale
  const offX = (box.w - W) * pos.px
  const offY = (box.h - H) * pos.py
  return { x: offX + nx * W, y: offY + ny * H }
}
