/** Colour arithmetic for the Studio. Colours are `#rrggbb` strings everywhere; results are cached. */

const RGB = new Map<string, [number, number, number]>()
export function rgb(hex: string): [number, number, number] {
  let c = RGB.get(hex)
  if (!c) {
    const h = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
    const n = parseInt(h.slice(1, 7), 16)
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    RGB.set(hex, c)
  }
  return c
}
const h2 = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
export const hex = (r: number, g: number, b: number) => `#${h2(r)}${h2(g)}${h2(b)}`

/** `a` moved toward `b` by `k` (0…1). */
export function mixHex(a: string, b: string, k: number): string {
  const A = rgb(a)
  const B = rgb(b)
  return hex(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k)
}

/** Multiply blend (how a transparent darker wash sits on a colour), mixed in by `k`. */
export function mulHex(a: string, b: string, k = 1): string {
  const A = rgb(a)
  const B = rgb(b)
  const m = (i: number) => A[i] + ((A[i] * B[i]) / 255 - A[i]) * k
  return hex(m(0), m(1), m(2))
}

export function toHsl(c: string): [number, number, number] {
  const [r, g, b] = rgb(c).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}
export function fromHsl(h: number, s: number, l: number): string {
  const f = (p: number, q: number, t: number) => {
    t = ((t % 1) + 1) % 1
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
  }
  if (s === 0) return hex(l * 255, l * 255, l * 255)
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return hex(f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255)
}
/** Lighter (k > 0) or darker (k < 0) keeping the hue; saturation scaled by `sat`. */
export function tone(c: string, k: number, sat = 1): string {
  const [h, s, l] = toHsl(c)
  return fromHsl(h, Math.max(0, Math.min(1, s * sat)), Math.max(0, Math.min(1, k >= 0 ? l + (1 - l) * k : l * (1 + k))))
}
export const luma = (c: string) => {
  const [r, g, b] = rgb(c)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
