// Downloads the CC0 lighting/texture assets from Poly Haven (https://polyhaven.com/license).
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../public/', import.meta.url))
const T = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/'
const M = 'https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/decorative_book_set_01/'
const files = [
  ['env/kloofendal_misty_morning_1k.hdr', 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_misty_morning_1k.hdr'],
  ['textures/wood_table_001_diff_1k.jpg', T + 'wood_table_001/wood_table_001_diff_1k.jpg'],
  ['textures/wood_table_001_nor_gl_1k.jpg', T + 'wood_table_001/wood_table_001_nor_gl_1k.jpg'],
  ['textures/wood_table_001_arm_1k.jpg', T + 'wood_table_001/wood_table_001_arm_1k.jpg'],
  ['textures/book_hardcover_01_nor_gl_1k.jpg', M + 'book_hardcover_01_nor_gl_1k.jpg'],
  ['textures/book_hardcover_01_arm_1k.jpg', M + 'book_hardcover_01_arm_1k.jpg'],
]
for (const [rel, url] of files) {
  const out = root + rel
  mkdirSync(out.slice(0, out.lastIndexOf('/')), { recursive: true })
  if (existsSync(out)) { console.log('skip', rel); continue }
  const res = await fetch(url)
  if (!res.ok) { console.error('FAILED', rel, res.status); process.exitCode = 1; continue }
  writeFileSync(out, Buffer.from(await res.arrayBuffer()))
  console.log('ok  ', rel)
}
