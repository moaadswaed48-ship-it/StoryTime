// The trailer's lullaby: 16 bars of 3/4 in D major. Bar lines are the picture cuts
// (src/comps/trailer.timeline.json). Melody notes: [note, beat (1-based, may be fractional), beats, velocity].
import { readFileSync } from 'node:fs'
import { CHORDS } from './chords.mjs'
const TL = JSON.parse(readFileSync(new URL('../../src/comps/trailer.timeline.json', import.meta.url), 'utf8'))

export default {
  beat: TL.beat,
  duration: TL.duration,
  seed: 7,
  chords: CHORDS,
  fadeOut: 1.6,
  bars: [
    // 1–2 · her title: bells over a held chord, the harp only answers
    { chord: 'D', harp: 'half', level: 0.8, melody: [['F#4', 1, 1, 0.9], ['A4', 2, 1, 0.9], ['D5', 3, 1]], doubleLevel: 1.6 },
    { chord: 'G/D', harp: 'half', level: 0.8, melody: [['B4', 1, 2], ['G4', 3, 1, 0.85]], doubleLevel: 1.6, bells: [['D6', 2, 0.35, 1.4]] },
    // 3–6 · her world (A): the tune begins
    { chord: 'D', melody: [['A4', 1, 1], ['F#4', 2, 1, 0.85], ['A4', 3, 1]] },
    { chord: 'Bm', melody: [['B4', 1, 2], ['D5', 3, 1, 0.9]] },
    { chord: 'G', melody: [['B4', 1, 1], ['A4', 2, 1, 0.85], ['G4', 3, 1, 0.85]] },
    { chord: 'A', melody: [['A4', 1, 2], ['E4', 3, 1, 0.8]] },
    // 7–9 · it climbs to the birds
    { chord: 'Bm', melody: [['F#4', 1, 1], ['B4', 2, 1], ['D5', 3, 1]] },
    { chord: 'G', melody: [['E5', 1, 2], ['D5', 3, 1, 0.9]] },
    { chord: 'Asus', melody: [['C#5', 1, 1, 0.9], ['E5', 2, 2]], bells: [['A5', 3, 0.5, 1.4]] },
    // 10–14 · one story, three ways (B): lighter, dancing
    { chord: 'D', melody: [['F#5', 1, 1], ['E5', 2, 1, 0.85], ['D5', 3, 1, 0.9]] },
    { chord: 'G', melody: [['B4', 1, 2], ['D5', 3, 1, 0.9]] },
    { chord: 'D/F#', melody: [['A4', 1, 1], ['D5', 2, 1], ['F#5', 3, 1]] },
    // the game: a chime each time Sari takes a paper (beats 2, 3 | 1, 2, 3)
    { chord: 'Em', melody: [['G5', 1, 1], ['F#5', 2, 1, 0.85], ['E5', 3, 1, 0.9]], bells: [['B5', 2, 0.55, 0.7], ['D6', 3, 0.55, 0.7]] },
    { chord: 'A7', melody: [['C#5', 1, 1], ['E5', 2, 1], ['G5', 3, 1]], bells: [['E6', 1, 0.55, 0.7], ['F#6', 2, 0.55, 0.7], ['A6', 3, 0.6, 0.8]] },
    // 15–16 · home: her closing line, then the title
    { chord: 'D', melody: [['F#5', 1, 2], ['D5', 3, 1, 0.85]], hold: 1 },
    { chord: 'Dhi', harp: 'half', level: 0.8, melody: [['D5', 1, 3]], hold: 1, bells: [['D5', 1, 0.6, 1.4], ['F#5', 1.5, 0.5, 1.4], ['A5', 2, 0.55, 1.5], ['D6', 2.5, 0.6, 1.8]] },
  ],
  // the gust: wind rises with the papers (bars 5–6) and once more, softly, with the birds
  wind: [
    { at: TL.cuts.v06 * TL.bar - 0.5, dur: 5.4, gain: 0.05, lo: 320, hi: 1500 },
    { at: TL.cuts.v12 * TL.bar - 0.3, dur: 4.2, gain: 0.022, lo: 300, hi: 900 },
  ],
}
