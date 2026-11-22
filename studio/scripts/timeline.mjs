// Builds a film's timeline from its narration line lengths. Carried from the old build's video/scripts/timeline.mjs.
//   node studio/scripts/timeline.mjs --index=<cue lengths.json> --shots=<shots.json> --out=<timeline.json> [--lang=ar]
// <cue lengths.json>: { cue: { ar: { s01: 3.2, s02: 4.1, ... } } } (seconds per scene line; estimated from reading
// speed until real voice timings exist). <shots.json>: { scenes: [[{ bars: 2, ... }, ...], ...] }. If --out already
// exists its fps, size, beat, xfade and voice lead are kept; otherwise 24 fps, 1920×1080, 72 bpm.
//
// The rule (reverse-engineered from the first, Google-voice film and checked against all twelve of its scenes):
//   bar        = 3 beats at 72 bpm = 2.5 s
//   scene bars = ceil((lead + cue seconds) / bar)     lead = 0.5 s: her line starts half a second into the scene
//                the last scene gets one more bar for the end of the film (the outro and the fade-out)
//   start/end  = running sum of the scene lengths; scenes dissolve into each other over 0.4 s centred on the boundary
//   shots      = the scene's shot list in --shots file (the full-length one), trimmed to the scene's bars:
//                while there are too many bars, take one from the longest shot (the earliest of equals, never below 1);
//                if there are more shots than bars, drop shots from the end.
// The score, the film page and the voice mix all read the timeline this writes.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')))
if (!opt.index || !opt.shots || !opt.out) throw new Error('usage: node studio/scripts/timeline.mjs --index=<cues.json> --shots=<shots.json> --out=<timeline.json>')
const index = JSON.parse(readFileSync(resolve(opt.index), 'utf8'))
const cues = index.cue[opt.lang ?? 'ar']
const shotLists = JSON.parse(readFileSync(resolve(opt.shots), 'utf8')).scenes
const OUT = resolve(opt.out)
const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { fps: 24, width: 1920, height: 1080, beat: 60 / 72, xfade: 0.4 }

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
writeFileSync(OUT, JSON.stringify(tl, null, 2) + '\n')
console.log(scenes.map((s) => `${s.scene + 1}: ${((s.end - s.start) / BAR)} bars  ${s.shots.map((x) => x.bars).join('+')}  (cue ${cues['s' + String(s.scene + 1).padStart(2, '0')]} s)`).join('\n'))
console.log(`total ${totalBars} bars = ${tl.duration} s`)
