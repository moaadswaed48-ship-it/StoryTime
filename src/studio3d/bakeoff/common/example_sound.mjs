// A working example of the sound contract: 30 seconds of stereo sound at 48 kHz, written as a 16-bit WAV.
// It is a soft tick once a second, nothing more. Mechanics only: not a design to follow.
//
//   node src/studio3d/bakeoff/common/example_sound.mjs --out ../out/example-sound.wav
//
// The contract: `node sound.mjs --out FILE` writes exactly 1,440,000 sample frames (30 s x 48,000), two channels.
// Plain Node, no packages. The project's own sound code may be imported (Node runs the .ts files directly):
//   src/audio/sfx.ts   effects made in code (SFX, SFX_NAMES, the Cue type)
//   src/audio/mix.ts   mixCues(cues, seconds), loudness(L, R), wav(L, R)
//   studio/scripts/music.mjs is a command-line score player (read it; it loads scores from studio/scripts/scores/).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../../../..')
const { wav } = await import(pathToFileURL(resolve(REPO, 'src/audio/mix.ts')).href)

const arg = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : [])).filter((p) => p.length))
if (!arg.out) throw new Error('usage: node sound.mjs --out FILE')

const SR = 48000
const N = 30 * SR
const L = new Float32Array(N)
const R = new Float32Array(N)
for (let s = 0; s < 30; s++) {
  for (let i = 0; i < 2400; i++) {
    const v = 0.2 * Math.sin((2 * Math.PI * 880 * i) / SR) * Math.exp(-i / 400)
    L[s * SR + i] = v
    R[s * SR + i] = v
  }
}
mkdirSync(dirname(resolve(arg.out)), { recursive: true })
writeFileSync(resolve(arg.out), wav(L, R))
console.log(`sound: ${resolve(arg.out)} · ${N} sample frames`)
