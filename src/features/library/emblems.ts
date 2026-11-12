/**
 * The twelve stamped emblems of the season series, drawn on a 64 × 64 grid.
 * `fg` is the foil, `ko` the knock-out (the cloth showing through) — the same drawing is used as
 * a mask for an element painted in foil (spine, cover, detail view) and as a tiled pattern stamped
 * all over a cover board.
 */
import type { Emblem } from '@/content/library'

interface Paint {
  fg: string
  ko: string
}

const spin = (n: number, step: number, inner: (i: number) => string) =>
  Array.from({ length: n }, (_, i) => `<g transform="rotate(${i * step} 32 32)">${inner(i)}</g>`).join('')

const DRAW: Record<Emblem, (p: Paint) => string> = {
  leaf: ({ fg, ko }) =>
    `<path d="M32 4 36.6 14.6 42.5 11.5 41 24.5 49 17.5 50.6 23 58.5 21.6 54.6 30 59.5 33 48 41.6 49.6 47 33.8 44V60H30.2V44L14.4 47 16 41.6 4.5 33 9.4 30 5.5 21.6 13.4 23 15 17.5 23 24.5 21.5 11.5 27.4 14.6Z" fill="${fg}" stroke="${fg}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M32 41V16M32 37 45.5 27.5M32 37 18.5 27.5M32 29l7-9.5M32 29l-7-9.5" fill="none" stroke="${ko}" stroke-width="1.5" stroke-linecap="round"/>`,
  snow: ({ fg, ko }) =>
    `<g fill="none" stroke="${fg}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${spin(3, 60, () => `<path d="M32 5V59M32 13.5l-6-5.5M32 13.5l6-5.5M32 50.5l-6 5.5M32 50.5l6 5.5M32 22l-4.6-4M32 22l4.6-4M32 42l-4.6 4M32 42l4.6 4"/>`)}</g>` +
    `<circle cx="32" cy="32" r="3" fill="${ko}"/>`,
  drop: ({ fg, ko }) =>
    `<path d="M32 4.5C32 4.5 12.5 27 12.5 40.5a19.5 19.5 0 0 0 39 0C51.5 27 32 4.5 32 4.5Z" fill="${fg}"/>` +
    `<path d="M21.5 40.5a10.5 10.5 0 0 0 7.6 10" fill="none" stroke="${ko}" stroke-width="2.6" stroke-linecap="round"/>`,
  flower: ({ fg, ko }) =>
    spin(6, 60, () => `<ellipse cx="32" cy="15" rx="7.8" ry="11.6" fill="${fg}"/>`) +
    `<circle cx="32" cy="32" r="7.6" fill="${ko}"/><circle cx="32" cy="32" r="3.8" fill="${fg}"/>`,
  seed: ({ fg, ko }) =>
    `<path d="M32 58V30" fill="none" stroke="${fg}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="M31.4 37C19.5 37.4 10.6 29.6 9.6 16.6 22.4 16 31.4 24.4 31.4 37Z" fill="${fg}"/>` +
    `<path d="M32.6 30.4C32.6 18.6 40.8 9.4 54.4 8.8 55 21 46.4 30.4 32.6 30.4Z" fill="${fg}"/>` +
    `<path d="M15.5 22.5 27.5 33.5M49.5 14 37 26.5" fill="none" stroke="${ko}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M16 58.4h32" fill="none" stroke="${fg}" stroke-width="3.2" stroke-linecap="round"/>`,
  rainbow: ({ fg }) =>
    `<g fill="none" stroke="${fg}" stroke-linecap="round"><path d="M8 46a24 24 0 0 1 48 0" stroke-width="4.6"/><path d="M16.2 46a15.8 15.8 0 0 1 31.6 0" stroke-width="4.2"/><path d="M24.2 46a7.8 7.8 0 0 1 15.6 0" stroke-width="3.8"/></g>` +
    `<g fill="${fg}"><circle cx="6.5" cy="50" r="4.6"/><circle cx="12.5" cy="48" r="5.4"/><circle cx="18.6" cy="50.6" r="4"/><rect x="4" y="50" width="17" height="5" rx="2.5"/><circle cx="45.4" cy="50.6" r="4"/><circle cx="51.5" cy="48" r="5.4"/><circle cx="57.5" cy="50" r="4.6"/><rect x="43" y="50" width="17" height="5" rx="2.5"/></g>`,
  sun: ({ fg }) =>
    `<circle cx="32" cy="32" r="11.5" fill="${fg}"/>` +
    `<g fill="none" stroke="${fg}" stroke-width="3.4" stroke-linecap="round">${spin(12, 30, (i) => (i % 2 ? `<path d="M32 10.5v3.6"/>` : `<path d="M32 5.5v8.6"/>`))}</g>`,
  shade: ({ fg, ko }) =>
    `<path d="M32 5.5a13.5 13.5 0 0 1 12.9 9.6A11.6 11.6 0 0 1 47 38H17a11.6 11.6 0 0 1 2.1-22.9A13.5 13.5 0 0 1 32 5.5Z" fill="${fg}"/>` +
    `<path d="M29.3 37h5.4l1.9 16.5h-9.2Z" fill="${fg}"/>` +
    `<path d="M32 37V24.5M32 31.5l5.6-5.2M32 34l-5.2-4.6" fill="none" stroke="${ko}" stroke-width="1.6" stroke-linecap="round"/>` +
    `<ellipse cx="38" cy="57.2" rx="17" ry="3" fill="${fg}" opacity=".6"/>`,
  starfish: ({ fg, ko }) =>
    `<path d="M32 7 38.6 24.2 56.7 25.4 42.8 37 47.3 54.6 32 45 16.7 54.6 21.2 37 7.3 25.4 25.4 24.2Z" fill="${fg}" stroke="${fg}" stroke-width="5" stroke-linejoin="round"/>` +
    `<g fill="${ko}"><circle cx="32" cy="33.4" r="1.9"/><circle cx="32" cy="24" r="1.5"/><circle cx="32" cy="16" r="1.3"/><circle cx="40.6" cy="30.6" r="1.5"/><circle cx="48" cy="28.4" r="1.3"/><circle cx="37.4" cy="40.6" r="1.5"/><circle cx="41.8" cy="47" r="1.3"/><circle cx="26.6" cy="40.6" r="1.5"/><circle cx="22.2" cy="47" r="1.3"/><circle cx="23.4" cy="30.6" r="1.5"/><circle cx="16" cy="28.4" r="1.3"/></g>`,
  olive: ({ fg }) =>
    `<path d="M11 55Q30 41 51 12" fill="none" stroke="${fg}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<g fill="${fg}">${[
      [18.8, 38.3, 17.5, -105],
      [28.8, 29.3, 17.5, -105],
      [39, 18.4, 16, -105],
      [34.6, 40.8, 17.5, -8],
      [45.4, 29.8, 16.5, -8],
      [54.6, 8.6, 12.5, -46],
    ]
      .map(([x, y, l, a]) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M${-l / 2} 0Q0 ${-l * 0.36} ${l / 2} 0Q0 ${l * 0.36} ${-l / 2} 0Z"/>`)
      .join('')}<ellipse cx="21.5" cy="56" rx="4.3" ry="5.5" transform="rotate(24 21.5 56)"/><ellipse cx="32" cy="50.6" rx="4" ry="5.2" transform="rotate(30 32 50.6)"/></g>`,
  bread: ({ fg, ko }) =>
    `<path d="M6.5 43C6.5 28.5 17.6 20 32 20s25.5 8.5 25.5 23c0 5.2-3.6 8.5-9.2 8.5H15.7C10.1 51.5 6.5 48.2 6.5 43Z" fill="${fg}"/>` +
    `<path d="M19.5 28.5l6.6 10M29.5 26l6.6 10M39.5 28.5l6.6 10" fill="none" stroke="${ko}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="M24 15c-2.2-3 2.2-4.2 0-7.4M32 13.5c-2.2-3 2.2-4.2 0-7.4M40 15c-2.2-3 2.2-4.2 0-7.4" fill="none" stroke="${fg}" stroke-width="2.1" stroke-linecap="round"/>`,
  moon: ({ fg }) =>
    `<path d="M39.5 6.5A26 26 0 1 0 57.6 42 21.5 21.5 0 0 1 39.5 6.5Z" fill="${fg}"/>` +
    `<path d="M49.5 12l2 5.4 5.4 2-5.4 2-2 5.4-2-5.4-5.4-2 5.4-2Z" fill="${fg}"/><circle cx="57" cy="31" r="1.7" fill="${fg}"/>`,
}

/** Inner SVG markup of an emblem (for `dangerouslySetInnerHTML` inside a 64 × 64 viewBox). */
export const emblemMarkup = (name: Emblem, fg: string, ko: string) => DRAW[name]({ fg, ko })

const maskCache = new Map<Emblem, string>()
/**
 * The emblem as a CSS mask image: opaque where there is foil, clear where the cloth shows through.
 * The element that wears it is painted with the foil gradient, so the light that crosses the lettering crosses the emblem too.
 */
export function emblemMask(name: Emblem): string {
  let url = maskCache.get(name)
  if (!url) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">${DRAW[name]({ fg: '#fff', ko: '#000' })}</mask></defs><rect width="64" height="64" fill="#fff" mask="url(#m)"/></svg>`
    url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
    maskCache.set(name, url)
  }
  return url
}

/** A half-drop repeat of the emblem as a CSS background image (the pattern stamped all over a cover board). */
export function emblemPattern(name: Emblem, fg: string, ko: string): string {
  const one = DRAW[name]({ fg, ko })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><g transform="translate(9 9) scale(.47)">${one}</g><g transform="translate(57 57) scale(.47)">${one}</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
