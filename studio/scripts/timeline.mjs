// Regenerates src/comps/story.timeline.json from the storyteller's cue lengths. Re-run whenever the voice changes:
//   node scripts/timeline.mjs [--index=../public/audio/story/index.json] [--lang=ar]
//
// The rule (reverse-engineered from the first, Google-voice film and checked against all twelve of its scenes):
//   bar        = 3 beats at 72 bpm = 2.5 s
//   scene bars = ceil((lead + cue seconds) / bar)     lead = 0.5 s: her line starts half a second into the scene
//                the last scene gets one more bar for the end of the film (the outro and the fade-out)
//   start/end  = running sum of the scene lengths; scenes dissolve into each other over 0.4 s centred on the boundary
//   shots      = the scene's shot list in src/comps/story.shots.json (the full-length one), trimmed to the scene's bars:
//                while there are too many bars, take one from the longest shot (the earliest of equals, never below 1);
//                if there are more shots than bars, drop shots from the end.
// The score (scripts/scores/story.mjs), the page (src/comps/story.ts), the voice mix and public/film/story.json
// (scripts/render.mjs) all read the timeline this writes.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')))
const index = JSON.parse(readFileSync(resolve(ROOT, opt.index ?? '../public/audio/story/index.json'), 'utf8'))
const cues = index.cue[opt.lang ?? 'ar']
const shotLists = JSON.parse(readFileSync(resolve(ROOT, 'src/comps/story.shots.json'), 'utf8')).scenes
const old = JSON.parse(readFileSync(resolve(ROOT, 'src/comps/story.timeline.json'), 'utf8'))

const BEAT = old.beat ?? 60 / 72
const BAR = Math.round(BEAT * 3 * 1e6) / 1e6 // 2.5
const LEAD = old.voice?.lead ?? 0.5
const r = (x) => Math.round(x * 1e4) / 1e4

let at = 0
const scenes = shotLists.map((full, i) => {
  const cue = cues[`s${String(i + 1).padStart(2, '0')}`]
  if (!cue) throw new Error(`no cue length for scene ${i + 1}`)
  const bars = Math.ceil((LEAD + cue) / BAR - 1e-9) + (i === shotLists.length - 1 ? 1 : 0)
  let shots = full.map((s) => ({ ...s }))
  const sum = () => shots.reduce((n, s) => n + s.bars, 0)
  while (sum() > bars) {
    if (shots.length > bars) shots.pop() // more shots than bars
    else {
      const top = Math.max(...shots.map((s) => s.bars))
      shots.find((s) => s.bars === top).bars-- // longest first, earliest of equals
    }
  }
  const sc = { scene: i, start: r(at), end: r(at + bars * BAR), shots }
  at += bars * BAR
  return sc
})
const totalBars = scenes.reduce((n, s) => n + s.shots.reduce((m, x) => m + x.bars, 0), 0)
const tl = { fps: old.fps, width: old.width, height: old.height, beat: old.beat, bar: BAR, bars: totalBars, duration: r(at), xfade: old.xfade, voice: { lead: LEAD }, scenes }
writeFileSync(resolve(ROOT, 'src/comps/story.timeline.json'), JSON.stringify(tl, null, 2) + '\n')
console.log(scenes.map((s) => `${s.scene + 1}: ${((s.end - s.start) / BAR)} bars  ${s.shots.map((x) => x.bars).join('+')}  (cue ${cues['s' + String(s.scene + 1).padStart(2, '0')]} s)`).join('\n'))
console.log(`total ${totalBars} bars = ${tl.duration} s`)
