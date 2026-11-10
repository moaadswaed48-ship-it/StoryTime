// Bakes a Y-rotation into a GLB's vertices (auto-riggers expect the character to face +Z) and puts the feet on y=0.
// Usage: node scripts/assets/orient-glb.mjs in.glb out.glb <degreesAboutY>
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
const [, , src, out, deg = '-90'] = process.argv
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(src)
const a = (Number(deg) * Math.PI) / 180
const c = Math.cos(a), s = Math.sin(a)
const rot = (x, y, z) => [x * c + z * s, y, -x * s + z * c]
let minY = Infinity
const seen = new Set()
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    for (const sem of ['POSITION', 'NORMAL', 'TANGENT']) {
      const acc = prim.getAttribute(sem)
      if (!acc || seen.has(acc)) continue
      seen.add(acc)
      const el = []
      for (let i = 0; i < acc.getCount(); i++) {
        acc.getElement(i, el)
        const [x, y, z] = rot(el[0], el[1], el[2])
        el[0] = x; el[1] = y; el[2] = z
        acc.setElement(i, el)
        if (sem === 'POSITION') minY = Math.min(minY, y)
      }
    }
  }
}
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const acc = prim.getAttribute('POSITION'); const el = []
  for (let i = 0; i < acc.getCount(); i++) { acc.getElement(i, el); el[1] -= minY; acc.setElement(i, el) }
}
await io.write(out, doc)
console.log('written', out, 'minY was', minY.toFixed(4))
