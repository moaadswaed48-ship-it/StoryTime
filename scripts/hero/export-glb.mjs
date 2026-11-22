/**
 * Writes the hero characters as GLB files for a game: skinned mesh, the 19 standard bones, the face with its morph
 * targets, and one animation clip per gesture (idle, wave, dance, …).
 *   node scripts/hero/export-glb.mjs                → qa/out/hero/glb/<id>.glb for the six hero characters
 *   node scripts/hero/export-glb.mjs --cast=all     → every sheet in the first cast
 *   node scripts/hero/export-glb.mjs --out=some/dir --ids=noor,adam
 * Each file is read back with three's loader and its bones and clips are printed.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../..', import.meta.url))
const opt = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')))
const out = opt.out ? `${process.cwd()}/${opt.out}` : `${root}qa/out/hero/glb`

const vite = await createServer({ root, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', resolve: { alias: { '@': `${root}src` } } })
try {
  const { roundTrip } = await vite.ssrLoadModule('/src/hero3d/glb.ts')
  const { CAST } = await vite.ssrLoadModule('/src/cast/cast.ts')
  const { HERO_SAMPLES } = await vite.ssrLoadModule('/src/cast/samples.ts')
  let sheets = opt.cast === 'all' ? CAST : HERO_SAMPLES
  if (opt.ids) sheets = CAST.filter((s) => opt.ids.split(',').includes(s.id))
  await mkdir(out, { recursive: true })
  for (const sheet of sheets) {
    const { bytes, summary } = await roundTrip(sheet)
    await writeFile(`${out}/${sheet.id}.glb`, Buffer.from(bytes))
    console.log(`${sheet.id}.glb  ${(bytes.byteLength / 1024).toFixed(0)} KB  ${summary.vertices} vertices  ${summary.bones.length} bones  clips: ${summary.clips.join(' ')}`)
  }
  console.log(`written to ${out}`)
} finally {
  await vite.close()
}
