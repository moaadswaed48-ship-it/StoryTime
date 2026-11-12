/**
 * A small gaussian-like blur for tiny canvases (three box passes on premultiplied pixels).
 * Used once at start-up for two things that would otherwise need a live CSS/canvas filter:
 * the out-of-focus leaf sprites and the hero's blurred backdrop. Same result in every browser.
 *
 * `half` is the box half-width in pixels (the blur's sigma is about `half + 0.5`).
 * `edge: 'clamp'` repeats the border pixels (for pictures); `'clear'` treats the outside as transparent (for sprites).
 */
export function blurPixels(data: Uint8ClampedArray, w: number, h: number, half: number, edge: 'clamp' | 'clear' = 'clear') {
  const n = w * h
  const a = new Float32Array(n * 4)
  const b = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) {
    const al = data[i * 4 + 3] / 255
    a[i * 4] = data[i * 4] * al
    a[i * 4 + 1] = data[i * 4 + 1] * al
    a[i * 4 + 2] = data[i * 4 + 2] * al
    a[i * 4 + 3] = data[i * 4 + 3]
  }
  const k = 1 / (2 * half + 1)
  const clamp = edge === 'clamp'
  /** One box pass along a line of `len` samples spaced `step` apart; `lines` lines spaced `lineStep` apart. */
  const pass = (src: Float32Array, dst: Float32Array, len: number, lines: number, step: number, lineStep: number) => {
    const at = (o: number, i: number, ch: number) => (i < 0 ? (clamp ? src[o + ch] : 0) : i >= len ? (clamp ? src[o + (len - 1) * step + ch] : 0) : src[o + i * step + ch])
    for (let l = 0; l < lines; l++) {
      const o = l * lineStep
      for (let ch = 0; ch < 4; ch++) {
        let acc = 0
        for (let i = -half; i <= half; i++) acc += at(o, i, ch)
        for (let i = 0; i < len; i++) {
          dst[o + i * step + ch] = acc * k
          acc += at(o, i + half + 1, ch) - at(o, i - half, ch)
        }
      }
    }
  }
  for (let p = 0; p < 3; p++) {
    pass(a, b, w, h, 4, w * 4)
    pass(b, a, h, w, w * 4, 4)
  }
  for (let i = 0; i < n; i++) {
    const al = a[i * 4 + 3]
    if (al > 0.5) {
      const q = 255 / al
      data[i * 4] = a[i * 4] * q
      data[i * 4 + 1] = a[i * 4 + 1] * q
      data[i * 4 + 2] = a[i * 4 + 2] * q
      data[i * 4 + 3] = al
    } else data[i * 4 + 3] = 0
  }
}
