import { memo, type CSSProperties } from 'react'
import type { ShelfBook } from '@/content/library'
import { t } from '@/i18n/copy'
import { dirSign, locale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { emblemMask, emblemPattern } from './emblems'
import { luminance, mix, type Geom, type Metrics } from './engine'

/** Average glyph advance (em) of the display face at weight 700–800 — used to fit titles without measuring. */
const ADV = locale === 'ar' ? 0.5 : 0.57
/** The same for the heavier (900) cover lock-up. */
const ADV_COVER = locale === 'ar' ? 0.5 : 0.64
/** The spine is on the right of an Arabic book's front cover and on the left of an English one. */
const SPINE_SIDE = -dirSign

interface Tones {
  cloth: string
  foil: string
  hi: string
  lo: string
  /** Colour of the light that crosses the foil when the book turns. */
  gl: string
  /** Dark stamping on pale cloth is pigment, not metal: nearly flat, pressed in, and it only gleams. */
  pigment: boolean
  pattern: number
}
function tones(book: ShelfBook): Tones {
  const { cloth, foil } = book.palette
  const pigment = luminance(foil) < 0.4
  return {
    cloth,
    foil,
    hi: mix(foil, '#ffffff', pigment ? 0.1 : 0.66),
    lo: mix(foil, '#000000', pigment ? 0.18 : 0.26),
    gl: mix(foil, '#ffffff', pigment ? 0.34 : 0.92),
    pigment,
    pattern: pigment ? 0.2 : luminance(cloth) > 0.3 ? 0.3 : 0.24,
  }
}

/** Splits a title into one or two balanced lines (whole words only). */
function twoLines(title: string): [string, string] | [string] {
  const words = title.split(' ')
  if (words.length < 2) return [title]
  let best = 1
  let bd = Infinity
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (d < bd) {
      bd = d
      best = i
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

/** An emblem stamped in foil: a foil-painted box seen through the emblem's shape. */
export function Emblem({ name, className }: { name: ShelfBook['emblem']; className?: string }) {
  const mask = emblemMask(name)
  return <span className={cn('lib-emb lib-foilfill', className)} aria-hidden style={{ maskImage: mask, WebkitMaskImage: mask }} />
}

/**
 * Series covers. Three bindings share one grammar (cloth, foil frame, imprint line, emblem, title, belly band),
 * so the row reads as a series, but no two neighbours on the shelf wear the same one:
 *   plate — the emblem stamped all over the board, the title on a framed plate with a seal under it;
 *   medal — a large foil medallion in a field of blind stamping, the title beneath;
 *   arch  — the emblem standing in a pressed, arched window with studs in the corners.
 */
type Lay = 'plate' | 'medal' | 'arch'
const LAYS: Lay[] = ['plate', 'medal', 'arch']

/** Title set in one or two lines, sized (in cover units) to the width it is given. */
function CoverTitle({ title, width, max }: { title: string; width: number; max: number }) {
  const one = width / (ADV * title.length)
  const two = twoLines(title)
  const lines = one < max * 0.74 && two.length === 2 ? two : [title]
  const size = Math.min(max, width / (ADV * Math.max(...lines.map((l) => l.length))))
  return (
    <p className="lib-ctitle lib-foil" style={{ fontSize: `calc(var(--u) * ${size.toFixed(2)})` }}>
      {lines.map((l, i) => (
        <span key={i}>{l}</span>
      ))}
    </p>
  )
}

function SeriesCover({ book, tn, lay }: { book: ShelfBook; tn: Tones; lay: Lay }) {
  const title = book.title[locale]
  return (
    <div className={cn('lib-cover lib-cloth', `is-${lay}`)}>
      {lay !== 'arch' && <span className="lib-pattern" style={{ backgroundImage: emblemPattern(book.emblem, tn.foil, tn.cloth), opacity: lay === 'plate' ? tn.pattern * 1.9 : tn.pattern }} />}
      <span className="lib-hinge" />
      <div className="lib-art">
        <span className="lib-frame" />
        {lay === 'arch' && (
          <>
            <span className="lib-stud is-1" />
            <span className="lib-stud is-2" />
          </>
        )}
        <p className="lib-cbrand lib-foil">
          <i />
          {t.brand}
          <i />
        </p>
        {lay === 'plate' ? (
          <div className="lib-fig">
            <div className="lib-plate lib-cloth">
              <CoverTitle title={title} width={62} max={10.4} />
            </div>
            <span className="lib-seal lib-cloth">
              <span className="lib-ring" />
              <Emblem name={book.emblem} />
            </span>
          </div>
        ) : (
          <>
            <div className="lib-fig">
              <span className={cn(lay === 'medal' ? 'lib-medal lib-cloth' : 'lib-arch')}>
                {lay === 'medal' && <span className="lib-ring" />}
                {lay === 'medal' && <span className="lib-ring is-in" />}
                <Emblem name={book.emblem} />
              </span>
            </div>
            <CoverTitle title={title} width={78} max={10.4} />
          </>
        )}
        <p className="lib-cseason lib-foil">{t.library.filters[book.season]}</p>
      </div>
      <span className="lib-sheen" />
      <div className="lib-band">
        <i />
        {t.library.soon}
      </div>
    </div>
  )
}

/* ── The real book: the painted cover, full bleed, with the title stamped in copper foil on the open sky ── */
function ReadyTitle({ book }: { book: ShelfBook }) {
  const title = book.title[locale]
  // The copy already breaks this title by hand; fall back to a balanced split for any other book.
  const lines: string[] = title === `${t.hero.titleA} ${t.hero.titleB}` ? [t.hero.titleA, t.hero.titleB] : twoLines(title)
  const box = locale === 'ar' ? 53 : 60 // width of the lock-up in cover units
  const fit = (s: string, max: number, min: number, adv = ADV_COVER) => Math.max(min, Math.min(max, box / (adv * s.length)))
  return (
    <div className="lib-rtitle">
      <p className="lib-foil" style={{ fontSize: `calc(var(--u) * ${fit(lines[0], 10.6, 6).toFixed(2)})` }}>
        {lines[0]}
      </p>
      {lines[1] && (
        <p className="lib-foil is-b" style={{ fontSize: `calc(var(--u) * ${fit(lines[1], 8, 4.2, locale === 'ar' ? ADV_COVER : 0.56).toFixed(2)})` }}>
          {lines[1]}
        </p>
      )}
      <p className="lib-rby lib-foil">{t.library.by}</p>
    </div>
  )
}

function ReadyCover({ book }: { book: ShelfBook }) {
  // On the painted sky the title is stamped in copper (the spine's cloth colour), not in the pale gold of the spine.
  const c = book.palette.cloth
  const copper = { '--foil': mix(c, '#000000', 0.22), '--foil-hi': mix(c, '#ffc48a', 0.34), '--foil-lo': mix(c, '#000000', 0.5), '--foil-gl': '#ffdcae' } as CSSProperties
  return (
    <div className="lib-cover is-photo" style={copper}>
      <img src={asset(book.cover!)} alt="" draggable={false} decoding="async" />
      <span className="lib-hinge" />
      <ReadyTitle book={book} />
      <span className="lib-sheen" />
      <p className="lib-rmark">{t.brand}</p>
    </div>
  )
}

/* ── Spine ── */
function Spine({ book, g, m }: { book: ShelfBook; g: Box; m: Box & { S: number; bandB: number; bandH: number } }) {
  const title = book.title[locale]
  const bandTop = book.ready ? m.S * 0.07 : m.bandB + m.bandH
  // Room left for the vertical title between the emblem block and the band.
  const room = g.H - (g.T * 0.2 + 5 * m.K + g.T * 0.86 + 1) - bandTop - 22 * m.K
  const single = Math.min(g.T * 0.37, 23 * m.K, room / (ADV * title.length))
  const two = twoLines(title)
  const useTwo = two.length === 2 && single < g.T * 0.27
  const lines = useTwo ? two : [title]
  const size = useTwo ? Math.min(g.T * 0.3, room / (ADV * Math.max(two[0].length, two[1]!.length))) : single
  const soon = t.library.soon
  // The band always says "coming soon": across the spine where there is room, down it on narrow shelves (phones).
  // Decided for the whole row (from its thinnest possible spine), so the shelf never mixes the two.
  const upright = (m.S / m.K) * 0.122 < (locale === 'ar' ? 42 : 46)
  const words = soon.split(' ')
  const vSize = Math.max(8 * m.K, Math.min(g.T * 0.3, (g.T * 0.86) / (words.length * 1.12), (m.bandH - 9 * m.K) / (ADV * Math.max(...words.map((w) => w.length)))))
  return (
    <>
      <span className="lib-round" />
      <div className="lib-spine-in" style={{ paddingBottom: bandTop + 12 * m.K }}>
        <span className="lib-rule2" />
        <Emblem name={book.emblem} className="lib-semblem" />
        <span className="lib-rule1" />
        <div className="lib-stitle">
          <span className="lib-stitle-t lib-foil" style={{ fontSize: `${size.toFixed(1)}px` }}>
            {lines.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </span>
        </div>
        <span className="lib-rule1" />
      </div>
      {!book.ready && (
        <div className={cn('lib-band is-spine', upright && 'is-v')} style={upright ? { fontSize: `${vSize.toFixed(1)}px` } : undefined}>
          <span>
            {words.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </span>
        </div>
      )}
      <span className="lib-smark" style={{ bottom: book.ready ? m.S * 0.035 : m.bandB * 0.5 }} />
    </>
  )
}

/** A box in layout pixels (already multiplied by the scene's K). */
interface Box {
  W: number
  H: number
  T: number
  K: number
}

interface BookProps {
  book: ShelfBook
  g: Geom
  m: Metrics
  i: number
  selected: boolean
  setRef: (i: number, el: HTMLDivElement | null) => void
}

/**
 * One book as a real box: front board, back board, spine, page block (fore-edge and top).
 * Its transform, opacity and light (`--o`, `--sh-*`, `--sx`) are written every frame by the shelf loop.
 */
export const Book = memo(function Book({ book, g: geom, m, i, selected, setRef }: BookProps) {
  const tn = tones(book)
  const K = m.K
  const g: Box = { W: geom.W * K, H: geom.H * K, T: geom.T * K, K }
  const sm = { ...g, S: m.S * K, bandB: m.bandB * K, bandH: m.bandH * K }
  const status = book.ready ? t.library.ready : t.library.soon
  const style = {
    width: g.W,
    height: g.H,
    marginLeft: -g.W / 2,
    top: m.floorY - g.H,
    '--k': K,
    '--u': `${(g.W / 100).toFixed(3)}px`,
    '--T': `${g.T.toFixed(2)}px`,
    '--cloth': tn.cloth,
    '--foil': tn.foil,
    '--foil-hi': tn.hi,
    '--foil-lo': tn.lo,
    '--foil-gl': tn.gl,
    '--band-b': `${sm.bandB.toFixed(2)}px`,
    '--band-h': `${sm.bandH.toFixed(2)}px`,
  } as CSSProperties
  const half = g.T / 2
  return (
    <div
      ref={(el) => setRef(i, el)}
      id={`lib-book-${book.id}`}
      className={cn('lib-book', book.ready && 'is-ready', tn.pigment && 'is-pigment')}
      data-i={i}
      role="option"
      aria-selected={selected}
      style={style}
    >
      {/* The accessible name; everything painted on the faces is decoration and hidden from assistive tech. */}
      <span className="sr-only">{`${book.title[locale]} — ${t.library.filters[book.season]} · ${status}`}</span>
      <div className="lib-face lib-front" aria-hidden style={{ transform: `translateZ(${half}px)` }}>
        {book.ready ? <ReadyCover book={book} /> : <SeriesCover book={book} tn={tn} lay={LAYS[i % 3]} />}
      </div>
      <div className="lib-face lib-back" aria-hidden style={{ transform: `rotateY(180deg) translateZ(${half}px)` }} />
      <div className="lib-face lib-spine lib-cloth" aria-hidden style={{ width: g.T, marginLeft: -half, transform: `rotateY(${SPINE_SIDE * 90}deg) translateZ(${g.W / 2}px)` }}>
        <Spine book={book} g={g} m={sm} />
      </div>
      <div className="lib-face lib-fore" aria-hidden style={{ width: g.T, marginLeft: -half, transform: `rotateY(${-SPINE_SIDE * 90}deg) translateZ(${g.W / 2 - 1}px)` }} />
      <div className="lib-face lib-top" aria-hidden style={{ height: g.T, top: -half, transform: 'rotateX(90deg)' }} />
    </div>
  )
})
