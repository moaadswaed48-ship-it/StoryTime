// A four-bar test score (3/4, D major) that proves music.mjs runs. Not a film score.
// Melody notes: [note, beat (1-based, may be fractional), beats, velocity].
import { CHORDS } from './chords.mjs'

export default {
  beat: 60 / 72,
  duration: 4 * 3 * (60 / 72) + 1.5,
  seed: 7,
  chords: CHORDS,
  fadeOut: 1.2,
  bars: [
    { chord: 'D', melody: [['F#4', 1, 1], ['A4', 2, 1], ['D5', 3, 1]] },
    { chord: 'G', melody: [['B4', 1, 2], ['G4', 3, 1, 0.85]] },
    { chord: 'A', melody: [['A4', 1, 2], ['E4', 3, 1, 0.8]] },
    { chord: 'D', melody: [['D5', 1, 3]], hold: 1 },
  ],
}
