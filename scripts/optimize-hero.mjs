// Builds the responsive hero image set (AVIF/WebP/JPG) + a tiny blur-up from assets-src/hero.jpg.
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
const src = fileURLToPath(new URL('../assets-src/hero.jpg', import.meta.url))
const out = fileURLToPath(new URL('../public/hero/', import.meta.url))
mkdirSync(out, { recursive: true })
const meta = await sharp(src).metadata()
console.log('source', meta.width, 'x', meta.height)
const widths = [640, 1280, 1920, 2576].filter((w) => w <= meta.width)
for (const w of widths) {
  const base = sharp(src).resize({ width: w, withoutEnlargement: true })
  await base.clone().avif({ quality: 56, effort: 6 }).toFile(`${out}hero-${w}.avif`)
  await base.clone().webp({ quality: 74, effort: 5 }).toFile(`${out}hero-${w}.webp`)
  await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${out}hero-${w}.jpg`)
  console.log('wrote', w)
}
await sharp(src).resize({ width: 24 }).webp({ quality: 50 }).toFile(`${out}hero-blur.webp`)
console.log('done')
