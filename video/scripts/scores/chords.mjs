// Voicings in D major, kept in the warm middle of the keyboard. `arp` is the harp's six eighths (1–5–8–10–8–5).
export const CHORDS = {
  D: { bass: 'D2', arp: ['D3', 'A3', 'D4', 'F#4', 'D4', 'A3'], pad: ['D3', 'A3', 'F#4'] },
  Dhi: { bass: 'D2', arp: ['D3', 'A3', 'F#4', 'A4', 'F#4', 'A3'], pad: ['D3', 'A3', 'F#4', 'A4'] },
  'G/D': { bass: 'D2', arp: ['D3', 'G3', 'B3', 'D4', 'B3', 'G3'], pad: ['D3', 'G3', 'B3'] },
  Bm: { bass: 'B1', arp: ['B2', 'F#3', 'B3', 'D4', 'B3', 'F#3'], pad: ['B2', 'F#3', 'D4'] },
  G: { bass: 'G2', arp: ['G2', 'D3', 'G3', 'B3', 'G3', 'D3'], pad: ['G2', 'D3', 'B3'] },
  A: { bass: 'A2', arp: ['A2', 'E3', 'A3', 'C#4', 'A3', 'E3'], pad: ['A2', 'E3', 'C#4'] },
  A7: { bass: 'A2', arp: ['A2', 'E3', 'G3', 'C#4', 'G3', 'E3'], pad: ['A2', 'G3', 'C#4'] },
  Asus: { bass: 'A2', arp: ['A2', 'E3', 'A3', 'D4', 'A3', 'E3'], pad: ['A2', 'E3', 'D4'] },
  Em: { bass: 'E2', arp: ['E2', 'B2', 'E3', 'G3', 'E3', 'B2'], pad: ['E3', 'B3', 'G4'] },
  'D/F#': { bass: 'F#2', arp: ['F#2', 'D3', 'A3', 'D4', 'A3', 'D3'], pad: ['F#3', 'A3', 'D4'] },
  'F#m': { bass: 'F#2', arp: ['F#2', 'C#3', 'F#3', 'A3', 'F#3', 'C#3'], pad: ['F#3', 'A3', 'C#4'] },
}
