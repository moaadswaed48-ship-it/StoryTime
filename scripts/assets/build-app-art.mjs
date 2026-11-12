// Cuts the app's small pictures out of the scene paintings, so every face in the app is the same face as in the book and the film.
// Usage: node scripts/assets/build-app-art.mjs   (needs sharp; reads public/story/kNN.webp, writes public/app/**)
//   public/app/avatars/{sari,amir}.webp   round "who is reading?" pictures (the leaf and the bird are drawn in code)
//   public/app/doors/{read,watch,play}.webp   tall crops for the three doors of the story page
//   public/app/words/<id>.webp              square crops for "words from the story" (ids match src/content/learning.ts)
// Rectangles are [left, top, width, height] in the 1344×752 scene picture. Nothing is generated or repainted: crops only.
import { mkdirSync, statSync } from 'node:fs'
import sharp from 'sharp'

const pad = (n) => String(n).padStart(2, '0')
const scene = (n) => `public/story/k${pad(n)}.webp`

const JOBS = [
  // who is reading today?
  { out: 'avatars/sari', scene: 5, rect: [205, 35, 345, 345], size: 384, q: 84 },
  { out: 'avatars/amir', scene: 5, rect: [942, 38, 316, 316], size: 384, q: 84 },
  // the three doors (2:3)
  { out: 'doors/read', scene: 1, rect: [150, 0, 501, 752], size: [560, 840], q: 80 },
  { out: 'doors/watch', scene: 6, rect: [520, 0, 501, 752], size: [560, 840], q: 80 },
  { out: 'doors/play', scene: 2, rect: [300, 0, 501, 752], size: [560, 840], q: 80 },
  // words from the story
  { out: 'words/turn', scene: 3, rect: [600, 130, 480, 480], size: 320, q: 80 },
  { out: 'words/wind', scene: 6, rect: [520, 44, 340, 340], size: 320, q: 80 },
  { out: 'words/leaf', scene: 7, rect: [640, 20, 300, 300], size: 320, q: 80 },
  { out: 'words/rain', scene: 8, rect: [690, 170, 410, 410], size: 320, q: 80 },
  { out: 'words/crown', scene: 10, rect: [30, 240, 300, 300], size: 320, q: 80 },
  { out: 'words/boat', scene: 11, rect: [300, 190, 520, 520], size: 320, q: 80 },
  { out: 'words/flock', scene: 12, rect: [640, 8, 300, 300], size: 320, q: 80 },
  { out: 'words/autumn', scene: 12, rect: [800, 290, 380, 380], size: 320, q: 80 },
]

for (const d of ['avatars', 'doors', 'words']) mkdirSync(`public/app/${d}`, { recursive: true })
for (const j of JOBS) {
  const [left, top, width, height] = j.rect
  const [w, h] = Array.isArray(j.size) ? j.size : [j.size, j.size]
  const file = `public/app/${j.out}.webp`
  await sharp(scene(j.scene))
    .extract({ left, top, width, height })
    .resize(w, h, { kernel: 'lanczos3' })
    .sharpen({ sigma: 0.6 })
    .webp({ quality: j.q })
    .toFile(file)
  console.log(file, (statSync(file).size / 1024).toFixed(1) + ' kB')
}
