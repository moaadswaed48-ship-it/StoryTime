import './moonfilm.css'
import { Player } from './Player'
import { Stills } from './Gallery'

/**
 * «نزهة على القمر» drawn and animated entirely in code (no image or video generators): the style proof.
 *
 *   /demo.html?f=moonfilm            scene 8 «هوب!» as a short film, with play / pause / restart and a scrub bar
 *   /demo.html?f=moonfilm&t=27.4     opens paused on that second (add &bare=1 for the picture alone)
 *   /demo.html?f=moonfilm&stills=1   three book pictures from the same kit (scenes 4, 6 and 9)
 *   /demo.html?f=moonfilm&still=6    one of them alone, 16:9
 *
 * The kit is in `kit/` (painter, puppets, Wameed, the Moon set); scenes are plain functions of time.
 */
export function MoonFilm() {
  const q = new URLSearchParams(location.search)
  if (q.has('stills') || q.has('still')) return <Stills only={q.has('still') ? Number(q.get('still')) : null} />
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  // with reduced motion the scene opens on its key pose (the finished picture) instead of its first frame
  const startAt = q.has('t') ? Number(q.get('t')) : reduce ? 34.9 : null
  return <Player startAt={startAt} bare={q.has('bare')} />
}
