// Prepares the rigged character for the web: renames the clip, removes root motion, then compresses.
// Usage: node scripts/assets/build-model.mjs
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'

const SRC = 'assets-src/film/model/sari-run2.glb'
const TMP = 'assets-src/film/model/_sari-clean.glb'
const OUT = 'public/models/sari.glb'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(SRC)
const root = doc.getRoot()
for (const anim of root.listAnimations()) {
  anim.setName('run')
  for (const ch of anim.listChannels()) {
    const node = ch.getTargetNode()
    if (node?.getName() === 'Hips' && ch.getTargetPath() === 'translation') {
      // keep the vertical bob, cancel forward/sideways travel so the game moves the character itself
      const out = ch.getSampler().getOutput()
      const first = out.getElement(0, [])
      const el = []
      let travel = 0
      for (let i = 0; i < out.getCount(); i++) {
        out.getElement(i, el)
        travel = Math.max(travel, Math.hypot(el[0] - first[0], el[2] - first[2]))
        el[0] = first[0]
        el[2] = first[2]
        out.setElement(i, el)
      }
      console.log('root motion removed, max travel was', travel.toFixed(3), 'over', out.getCount(), 'keys')
    }
  }
  console.log('clip', anim.getName(), 'channels', anim.listChannels().length)
}
await io.write(TMP, doc)
execFileSync('npx', ['gltf-transform', 'optimize', TMP, OUT, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024', '--simplify', 'false', '--flatten', 'false', '--join', 'false'], { stdio: 'inherit' })
console.log(OUT, (statSync(OUT).size / 1e6).toFixed(2) + ' MB')
