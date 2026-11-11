import { memo, type CSSProperties, type ReactNode } from 'react'
import type { ShelfBook } from '@/content/library'
import { t } from '@/i18n/copy'
import { dirSign, locale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { emblemFoil, emblemMarkup, emblemPattern } from './emblems'
import { luminance, mix, type Geom, type Metrics } from './engine'

/** Average glyph advance (em) of the display face at weight 700–800 — used to fit titles without measuring. */
const ADV = locale === 'ar' ? 0.5 : 0.57
/** The spine is on the right of an Arabic book's front cover and on the left of an English one. */
const SPINE_SIDE = -dirSign

interface Tones {
  cloth: string
  foil: string
  hi: string
  lo: string
  /** How strongly the travelling light shows (pale foil on dark cloth flashes; dark pigment foil only gleams). */
  glint: number
  pattern: number
}
function tones(book: ShelfBook): Tones {
  const { cloth, foil } = book.palette
  const dark = luminance(foil) < 0.4
  return {
    cloth,
    foil,
    hi: mix(foil, '#ffffff', dark ? 0.36 : 0.62),
    lo: mix(foil, '#000000', dark ? 0.28 : 0.24),
    glint: dark ? 0.5 : 0.92,
    pattern: dark ? 0.13 : luminance(cloth) > 0.5 ? 0.22 : 0.17,
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

function Emblem({ book, id, tn, mono, className }: { book: ShelfBook; id: string; tn: Tones; mono?: boolean; className?: string }) {
  const html = mono ? emblemMarkup(book.emblem, '#fff', '#000') : emblemFoil(book.emblem, id, tn.lo, tn.foil, tn.hi, tn.cloth)
  return <svg className={className} viewBox="0 0 64 64" aria-hidden focusable="false" dangerouslySetInnerHTML={{ __html: html }} />
}

/** The two white bars of light that cross the foil when the book turns (see library.css → .lib-glint). */
function Glint({ children }: { children: ReactNode }) {
  return (
    <div className="lib-glint">
      <span className="lib-glint-bar" />
      <span className="lib-glint-bar is-b" />
      <div className="lib-mono is-mono">{children}</div>
    </div>
  )
}

/* ── Series cover: cloth, double foil frame, blind-stamped pattern panel, medallion, title, belly band ── */
function SeriesArt({ book, tn, mono }: { book: ShelfBook; tn: Tones; mono?: boolean }) {
  return (
    <div className="lib-art">
      <span className="lib-frame" />
      <p className="lib-cbrand lib-foil">
        <i />
        {t.brand}
        <i />
      </p>
      <div className="lib-panel">
        {!mono && <span className="lib-pattern" style={{ backgroundImage: emblemPattern(book.emblem, tn.foil, tn.cloth), opacity: tn.pattern }} />}
        <span className="lib-medal lib-cloth">
          <Emblem book={book} id={`lg-${book.id}-c`} tn={tn} mono={mono} />
        </span>
      </div>
      <p className="lib-ctitle lib-foil">{book.title[locale]}</p>
      <p className="lib-cseason lib-foil">{t.library.filters[book.season]}</p>
    </div>
  )
}

function SeriesCover({ book, tn }: { book: ShelfBook; tn: Tones }) {
  return (
    <div className="lib-cover lib-cloth">
      <span className="lib-hinge" />
      <SeriesArt book={book} tn={tn} />
      <Glint>
        <SeriesArt book={book} tn={tn} mono />
      </Glint>
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
  const box = 53 // width of the lock-up in cover units
  const fit = (s: string, max: number, min: number) => Math.max(min, Math.min(max, box / (ADV * s.length)))
  return (
    <div className="lib-rtitle">
      <p className="lib-foil" style={{ fontSize: `calc(var(--u) * ${fit(lines[0], 10.6, 6).toFixed(2)})` }}>
        {lines[0]}
      </p>
      {lines[1] && (
        <p className="lib-foil is-b" style={{ fontSize: `calc(var(--u) * ${fit(lines[1], 8, 5.5).toFixed(2)})` }}>
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
  const copper = { '--foil': mix(c, '#000000', 0.22), '--foil-hi': mix(c, '#ffc48a', 0.3), '--foil-lo': mix(c, '#000000', 0.5) } as CSSProperties
  return (
    <div className="lib-cover is-photo" style={copper}>
      <img src={asset(book.cover!)} alt="" draggable={false} decoding="async" />
      <span className="lib-hinge" />
      <ReadyTitle book={book} />
      <Glint>
        <ReadyTitle book={book} />
      </Glint>
      <span className="lib-sheen" />
      <p className="lib-rmark">{t.brand}</p>
    </div>
  )
}

/* ── Spine ── */
function Spine({ book, g, m, tn }: { book: ShelfBook; g: Geom; m: Metrics; tn: Tones }) {
  const title = book.title[locale]
  const bandTop = book.ready ? m.S * 0.07 : m.bandB + m.bandH
  // Room left for the vertical title between the emblem block and the band.
  const room = g.H - (g.T * 0.2 + 5 + g.T * 0.86 + 1) - bandTop - 22
  const single = Math.min(g.T * 0.37, 23, room / (ADV * title.length))
  const two = twoLines(title)
  const useTwo = two.length === 2 && single < g.T * 0.27
  const lines = useTwo ? two : [title]
  const size = useTwo ? Math.min(g.T * 0.3, room / (ADV * Math.max(two[0].length, two[1]!.length))) : single
  const soon = t.library.soon
  // The band text only when it can be read on this spine; otherwise the band carries a dot.
  const bandText = !book.ready && g.T >= (locale === 'ar' ? 42 : 46)
  return (
    <>
      <span className="lib-round" />
      <div className="lib-spine-in" style={{ paddingBottom: bandTop + 12 }}>
        <span className="lib-rule2" />
        <Emblem book={book} id={`lg-${book.id}-s`} tn={tn} className="lib-semblem" />
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
        <div className={cn('lib-band is-spine', !bandText && 'is-dot')}>
          {bandText ? (
            <span>
              {soon.split(' ').map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </span>
          ) : (
            <i />
          )}
        </div>
      )}
      <span className="lib-smark" style={{ bottom: book.ready ? m.S * 0.035 : m.bandB * 0.5 }} />
    </>
  )
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
export const Book = memo(function Book({ book, g, m, i, selected, setRef }: BookProps) {
  const tn = tones(book)
  const status = book.ready ? t.library.ready : t.library.soon
  const style = {
    width: g.W,
    height: g.H,
    marginLeft: -g.W / 2,
    top: m.floorY - g.H,
    '--u': `${(g.W / 100).toFixed(3)}px`,
    '--T': `${g.T}px`,
    '--cloth': tn.cloth,
    '--foil': tn.foil,
    '--foil-hi': tn.hi,
    '--foil-lo': tn.lo,
    '--glint': tn.glint,
    '--band-b': `${m.bandB}px`,
    '--band-h': `${m.bandH}px`,
    '--sp': `${(dirSign * g.W * 3.3).toFixed(1)}px`,
  } as CSSProperties
  const half = g.T / 2
  return (
    <div
      ref={(el) => setRef(i, el)}
      id={`lib-book-${book.id}`}
      className={cn('lib-book', book.ready && 'is-ready')}
      data-i={i}
      role="option"
      aria-selected={selected}
      aria-label={`${book.title[locale]} — ${t.library.filters[book.season]} · ${status}`}
      style={style}
    >
      <div className="lib-face lib-front" aria-hidden style={{ transform: `translateZ(${half}px)` }}>
        {book.ready ? <ReadyCover book={book} /> : <SeriesCover book={book} tn={tn} />}
      </div>
      <div className="lib-face lib-back lib-cloth" aria-hidden style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}>
        {!book.ready && <div className="lib-band" />}
      </div>
      <div className="lib-face lib-spine lib-cloth" aria-hidden style={{ width: g.T, marginLeft: -half, transform: `rotateY(${SPINE_SIDE * 90}deg) translateZ(${g.W / 2}px)` }}>
        <Spine book={book} g={g} m={m} tn={tn} />
      </div>
      <div className="lib-face lib-fore" aria-hidden style={{ width: g.T, marginLeft: -half, transform: `rotateY(${-SPINE_SIDE * 90}deg) translateZ(${g.W / 2 - 1}px)` }} />
      <div className="lib-face lib-top" aria-hidden style={{ height: g.T, top: -half, transform: 'rotateX(90deg)' }} />
    </div>
  )
})
