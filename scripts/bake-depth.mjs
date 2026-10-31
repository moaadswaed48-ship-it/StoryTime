// Bakes a depth map for the hero plate with Depth-Anything-V2-Small (Apache-2.0) via transformers.js on CPU.
// Output: public/hero/hero-depth.png (8-bit, bright = near), dilated 4px + blurred so silhouettes don't halo.
import { pipeline, env } from '@huggingface/transformers'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

env.cacheDir = fileURLToPath(new URL('../.hf-cache/', import.meta.url))
const src = fileURLToPath(new URL('../public/hero/hero-1280.jpg', import.meta.url))
const out = fileURLToPath(new URL('../public/hero/hero-depth.png', import.meta.url))

console.time('model')
const de = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp16', device: 'cpu' })
console.timeEnd('model')
console.time('infer')
const { depth } = await de(src)
console.timeEnd('infer')
// depth: RawImage (1 channel, same size as input)
const w = depth.width, h = depth.height
const data = Buffer.from(depth.data)
// normalise 0..255, then max-filter (dilate) 5x5 so near objects "own" their edges, then blur
let min = 255, max = 0
for (const v of data) { if (v < min) min = v; if (v > max) max = v }
const norm = Buffer.alloc(w * h)
for (let i = 0; i < w * h; i++) norm[i] = Math.round(((data[i] - min) / Math.max(1, max - min)) * 255)
const dil = Buffer.alloc(w * h)
const R = 2
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  let m = 0
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const yy = Math.min(h - 1, Math.max(0, y + dy)), xx = Math.min(w - 1, Math.max(0, x + dx))
    const v = norm[yy * w + xx]
    if (v > m) m = v
  }
  dil[y * w + x] = m
}
await sharp(dil, { raw: { width: w, height: h, channels: 1 } }).blur(2).png({ compressionLevel: 9 }).toFile(out)
console.log('wrote', out, w, 'x', h)
