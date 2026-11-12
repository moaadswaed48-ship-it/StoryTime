// The story film's lullaby: 32 bars of 3/4 in D major at 72 bpm. Each scene is a phrase of two or three bars
// (src/comps/story.timeline.json), so the tune turns a corner exactly where the story does.
// Melody notes: [note, beat (1-based), beats, velocity].
import { readFileSync } from 'node:fs'
import { CHORDS } from './chords.mjs'
const TL = JSON.parse(readFileSync(new URL('../../src/comps/story.timeline.json', import.meta.url), 'utf8'))
const sceneAt = (i) => TL.scenes[i].start

// The written tune: twelve phrases (one per scene). The film's scenes now last as long as the storyteller's lines,
// so each phrase is stretched to the bars its scene has: it repeats from its start and always closes on its own last bar.
const TUNE = [
    // 1–2 · in class: Sari cannot sit still
    { chord: 'D', melody: [['A4', 1, 1], ['F#4', 2, 1, 0.85], ['A4', 3, 1]], level: 0.85 },
    { chord: 'G', melody: [['B4', 1, 2], ['A4', 3, 1, 0.85]], level: 0.85 },
    // 3–5 · out to the yard, the papers are laid out
    { chord: 'D', melody: [['F#4', 1, 1], ['A4', 2, 1], ['D5', 3, 1]] },
    { chord: 'Bm', melody: [['D5', 1, 2], ['B4', 3, 1, 0.85]] },
    { chord: 'A', melody: [['C#5', 1, 2], ['A4', 3, 1, 0.85]] },
    // 6–8 · wait your turn
    { chord: 'G', melody: [['B4', 1, 1], ['D5', 2, 1], ['B4', 3, 1, 0.85]] },
    { chord: 'D/F#', melody: [['A4', 1, 2], ['F#4', 3, 1, 0.8]] },
    { chord: 'A7', melody: [['E4', 1, 1, 0.85], ['G4', 2, 1, 0.85], ['E4', 3, 1, 0.8]] },
    // 9–10 · blowing!
    { chord: 'D', melody: [['F#5', 1, 1], ['E5', 2, 1, 0.85], ['D5', 3, 1, 0.9]] },
    { chord: 'G', melody: [['B4', 1, 2], ['D5', 3, 1, 0.9]] },
    // 11–13 · the stick: a chime on the tap, the paper turns, the name
    { chord: 'Em', melody: [['G4', 1, 1], ['B4', 3, 1, 0.9]], bells: [['E6', 2, 0.8, 1.1], ['B6', 2.25, 0.4, 0.8]] },
    { chord: 'A7', melody: [['C#5', 1, 1], ['E5', 2, 1], ['G5', 3, 1]] },
    { chord: 'D', melody: [['F#5', 1, 2], ['D5', 3, 1, 0.85]] },
    // 14–15 · the wind plays
    { chord: 'Bm', melody: [['F#5', 1, 1], ['D5', 2, 1, 0.9], ['B4', 3, 1, 0.9]] },
    { chord: 'G', melody: [['E5', 1, 2], ['D5', 3, 1, 0.9]] },
    // 16–18 · one leaf comes down
    { chord: 'Em', melody: [['G5', 1, 1], ['F#5', 2, 1, 0.85], ['E5', 3, 1, 0.85]], level: 0.85 },
    { chord: 'A', melody: [['C#5', 1, 1], ['B4', 2, 1, 0.85], ['A4', 3, 1, 0.85]], level: 0.85 },
    { chord: 'D', melody: [['F#4', 1, 2], ['A4', 3, 1, 0.85]] },
    // 19–20 · they fall like rain
    { chord: 'G', melody: [['B4', 1, 1], ['D5', 2, 1], ['G5', 3, 1]] },
    { chord: 'D', melody: [['F#5', 1, 2], ['D5', 3, 1, 0.9]] },
    // 21–23 · come and see: nature paints a picture
    { chord: 'Bm', melody: [['F#4', 1, 1], ['B4', 2, 1], ['D5', 3, 1]] },
    { chord: 'G', melody: [['E5', 1, 2], ['D5', 3, 1, 0.9]] },
    { chord: 'Asus', melody: [['C#5', 1, 1, 0.9], ['E5', 2, 2]], bells: [['A5', 3, 0.5, 1.4]] },
    // 24–26 · crowns and towers
    { chord: 'D', melody: [['A5', 1, 1], ['F#5', 2, 1, 0.85], ['D5', 3, 1, 0.9]] },
    { chord: 'G', melody: [['B4', 1, 1], ['D5', 2, 1], ['G5', 3, 1]] },
    { chord: 'A7', melody: [['E5', 1, 2], ['C#5', 3, 1, 0.85]] },
    // 27–28 · the boat of leaves
    { chord: 'D', melody: [['F#5', 1, 2], ['A5', 3, 1, 0.9]] },
    { chord: 'Bm', melody: [['F#5', 1, 2], ['D5', 3, 1, 0.85]] },
    // 29–32 · the migrating birds; home
    { chord: 'G', melody: [['B4', 1, 1], ['D5', 2, 1], ['G5', 3, 1]] },
    { chord: 'A', melody: [['A5', 1, 2], ['E5', 3, 1, 0.9]] },
    { chord: 'D', melody: [['F#5', 1, 2], ['D5', 3, 1, 0.85]], level: 0.85 },
    { chord: 'Dhi', harp: 'half', level: 0.7, melody: [['D5', 1, 3]], bells: [['D5', 1, 0.6, 1.4], ['F#5', 1.5, 0.5, 1.4], ['A5', 2, 0.55, 1.5], ['D6', 2.5, 0.6, 1.8]] },
]
const PHRASES = [2, 3, 3, 2, 3, 2, 3, 2, 3, 3, 2, 4]
const bars = []
let at = 0
PHRASES.forEach((len, i) => {
  const phrase = TUNE.slice(at, at + len)
  at += len
  const need = TL.scenes[i].shots.reduce((n, sh) => n + sh.bars, 0)
  for (let b = 0; b < need - 1; b++) bars.push({ ...phrase[b % (len - 1)], level: b >= len - 1 ? 0.8 : phrase[b % (len - 1)].level })
  bars.push(phrase[len - 1])
})

export default {
  beat: TL.beat,
  duration: TL.duration,
  seed: 19,
  chords: CHORDS,
  fadeIn: 0.6,
  fadeOut: 2.4,
  bars,
  wind: [
    { at: sceneAt(5) - 0.5, dur: 5.6, gain: 0.05, lo: 320, hi: 1500 },
    { at: sceneAt(11) + 3.5, dur: 6, gain: 0.02, lo: 300, hi: 900 },
  ],
}
