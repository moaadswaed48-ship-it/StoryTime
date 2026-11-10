// Renders a GLB from several angles with headless Chromium and saves one contact sheet.
// Usage: node scripts/qa/glb-shot.mjs <file.glb> <out.jpg> [animationIndex] [time]
import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { chromium } from 'playwright'

const [, , glb, out, animIdx = '-1', time = '0', poses = ''] = process.argv
const ROOT = resolve('.')
const TYPES = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html', '.wasm': 'application/wasm' }
const html = `<!doctype html><body style="margin:0;background:#e9e2d6"><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<canvas id="c" width="1600" height="640"></canvas><script type="module">
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
const r = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true })
r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping
const scene = new THREE.Scene(); scene.background = new THREE.Color('#e9e2d6')
scene.add(new THREE.HemisphereLight('#fff6e6', '#b99a78', 1.6))
const d = new THREE.DirectionalLight('#fff1dc', 2.4); d.position.set(2, 4, 3); scene.add(d)
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder)
const g = await loader.loadAsync('/model.glb')
scene.add(g.scene); const box = new THREE.Box3().setFromObject(g.scene); const size = box.getSize(new THREE.Vector3()); const c = box.getCenter(new THREE.Vector3())
let tris = 0, bones = 0, meshes = 0; const names = []
g.scene.traverse(o => { if (o.isMesh) { meshes++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 } if (o.isBone) { bones++; names.push(o.name) } })
window.__info = { size: size.toArray(), center: c.toArray(), tris, bones, meshes, boneNames: names, clips: g.animations.map(a => [a.name, +a.duration.toFixed(2), a.tracks.length]) }
const idx = ${Number(animIdx)}
if (idx >= 0 && g.animations[idx]) { const m = new THREE.AnimationMixer(g.scene); m.clipAction(g.animations[idx]).play(); m.setTime(${Number(time)}) ; g.scene.updateMatrixWorld(true) }
const POSES = ${poses ? poses : 'null'}
const s = 1.7 / Math.max(size.y, 0.001)
const VIEWS = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 4]
r.setScissorTest(true)
if (POSES) {
  const bones = {}; g.scene.traverse(o => { if (o.isBone) bones[o.name] = o })
  const rest = {}; for (const k in bones) rest[k] = bones[k].quaternion.clone()
  const n = POSES.length, w = 1600 / n
  POSES.forEach((pose, i) => {
    for (const k in bones) bones[k].quaternion.copy(rest[k])
    for (const k in pose) { const e = new THREE.Euler(...pose[k]); bones[k].quaternion.multiply(new THREE.Quaternion().setFromEuler(e)) }
    g.scene.updateMatrixWorld(true)
    const cam = new THREE.PerspectiveCamera(28, w / 640, 0.01, 100)
    const a = i % 2 ? 0.6 : 0, dist = 4.6 / s
    cam.position.set(c.x + Math.sin(a) * dist, c.y + size.y * 0.12, c.z + Math.cos(a) * dist); cam.lookAt(c)
    r.setViewport(i * w, 0, w, 640); r.setScissor(i * w, 0, w, 640); r.render(scene, cam)
  })
} else VIEWS.forEach((a, i) => {
  const cam = new THREE.PerspectiveCamera(28, 320 / 640, 0.01, 100)
  const dist = 4.6 / s
  cam.position.set(c.x + Math.sin(a) * dist, c.y + size.y * 0.12, c.z + Math.cos(a) * dist); cam.lookAt(c)
  r.setViewport(i * 320, 0, 320, 640); r.setScissor(i * 320, 0, 320, 640); r.render(scene, cam)
})
window.__done = true
</script>`
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  if (url === '/') return res.writeHead(200, { 'content-type': 'text/html' }).end(html)
  const file = url === '/model.glb' ? resolve(glb) : resolve(ROOT, '.' + url)
  if (!existsSync(file)) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
}).listen(0)
const port = server.address().port
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 640 } })
page.on('pageerror', (e) => console.log('PAGEERR', e.message))
await page.goto(`http://localhost:${port}/`)
await page.waitForFunction(() => window.__done, null, { timeout: 120000 })
console.log(JSON.stringify(await page.evaluate(() => window.__info)))
await page.locator('#c').screenshot({ path: out, type: 'jpeg', quality: 80 })
await browser.close(); server.close()
