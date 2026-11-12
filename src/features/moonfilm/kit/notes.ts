/** The score's few instruments: soft mallet notes, bells, a low thud for a landing, and a slow pad. */
import type { Note } from './stage'

// D major pentatonic
export const D3 = 146.83, F3 = 174.61, Fs3 = 185.0, A3 = 220.0
export const D4 = 293.66, E4 = 329.63, Fs4 = 369.99, A4 = 440.0
export const D5 = 587.33, E5 = 659.25, Fs5 = 739.99, A5 = 880.0, B5 = 987.77, D6 = 1174.66, E6 = 1318.51

export const mallet = (t: number, f: number, v = 0.16, d = 0.7): Note => ({ t, f, d, v, wave: 'triangle' })
export const bell = (t: number, f: number, v = 0.1, d = 1.4): Note => ({ t, f, d, v, wave: 'sine' })
export const thud = (t: number, v = 0.22): Note => ({ t, f: 96, to: 58, d: 0.28, v, wave: 'sine' })
export const pad = (t: number, end: number, f: number, v: number): Note => ({ t, f, d: end - t, v, wave: 'sine', attack: 1.6 })
