import './moonfilm.css'
import { makeFilm } from './film'
import { Player } from './Player'
import { Stills } from './Gallery'

/**
 * «نزهة على القمر» drawn and animated entirely in code (no image or video generators): the style proof.
 *
 *   /demo.html?f=moonfilm            every finished scene in story order, with play / pause / restart and a scrub bar
 *   /demo.html?f=moonfilm&scene=8    one scene alone (or several: &scene=4,6)
 *   /demo.html?f=moonfilm&t=27.4     opens paused on that second (add &bare=1 for the picture alone, &q=0 to
 *                                    keep full resolution even if the device is slow)
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
  const film = makeFilm(q.get('scene')?.split(',').map(Number))
  const startAt = q.has('t') ? Number(q.get('t')) : reduce ? film.duration - 0.3 : null
  return <Player film={film} startAt={startAt} bare={q.has('bare')} lockQuality={q.get('q') === '0'} />
}
