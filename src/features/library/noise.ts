import { mulberry32 } from '@/lib/seeded'

let cached: string | null = null

/**
 * A small seamless tile of soft grey grain (mean exactly mid-grey), as a PNG data URL. It is laid over
 * cloth, paper and wood with a blend mode so every surface has tooth. Made once on a canvas instead of
 * with an SVG turbulence filter: a bitmap is decoded once and tiled for free, whereas the filter would be
 * re-run by the rasteriser for every one of the ~50 layers that wear it.
 */
export function noiseTile(size = 128, contrast = 0.2): string {
  if (cached !== null) return cached
  cached = ''
  try {
    const cv = document.createElement('canvas')
    cv.width = cv.height = size
    const ctx = cv.getContext('2d')
    if (!ctx) return cached
    const rnd = mulberry32(0x5eed)
    const raw = new Float32Array(size * size)
    for (let i = 0; i < raw.length; i++) raw[i] = rnd() - 0.5
    const img = ctx.createImageData(size, size)
    const at = (x: number, y: number) => raw[((y + size) % size) * size + ((x + size) % size)]
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Half sharp grain, half a 3×3 average (wrapping at the edges, so the tile repeats without a seam).
        let soft = 0
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) soft += at(x + dx, y + dy)
        const v = 0.5 + (raw[y * size + x] * 0.55 + (soft / 9) * 1.6) * contrast * 2
        const g = Math.max(0, Math.min(255, Math.round(v * 255)))
        const o = (y * size + x) * 4
        img.data[o] = img.data[o + 1] = img.data[o + 2] = g
        img.data[o + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    cached = `url(${cv.toDataURL('image/png')})`
  } catch {
    cached = ''
  }
  return cached
}
