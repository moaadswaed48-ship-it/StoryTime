import type { CSSProperties } from 'react'

const DIGITS = /[0-9٠-٩]/
const RUNS = /[0-9٠-٩]+|[^0-9٠-٩]+/g
/** How many glyphs each column rolls through before it lands on its own digit. */
const ROLL = 5

/** The digits a column passes on the way to `ch`, in the same script as `ch` (Latin or Arabic-Indic). */
function strip(ch: string): string[] {
  const zero = ch >= '٠' ? 0x0660 : 0x30
  const d = ch.charCodeAt(0) - zero
  return Array.from({ length: ROLL + 1 }, (_, k) => String.fromCharCode(zero + ((d - ROLL + k + 20) % 10)))
}

/**
 * A big numeral whose digits roll into place like a counter (`.is-in` on an ancestor starts it; see parents.css).
 * The text is taken as written in the copy: digits are only ever digits (never letters), each run of digits keeps
 * its left-to-right order, and the runs themselves follow the reading direction — so «٣–٦» reads as it does in a sentence.
 * The rest state shows the final value; screen readers get the plain string.
 */
export function Odometer({ value, order = 0 }: { value: string; order?: number }) {
  // The Arabic-Indic zero is a small diamond by design; at display size it would read as a stray dot.
  // Alone, it is drawn larger (the glyph itself, never a ring — a circle reads as «٥») and pops in instead of rolling.
  if (value === '٠')
    return (
      <span className="pr-odo pr-odo--zero-ar" style={{ '--i': order } as CSSProperties}>
        <span className="sr-only">{value}</span>
        <span className="pr-odo__zero" aria-hidden>
          <i>{value}</i>
          <span>{value}</span>
        </span>
      </span>
    )
  const runs = value.match(RUNS) ?? [value]
  let col = 0
  return (
    <span className="pr-odo" style={{ '--i': order } as CSSProperties}>
      <span className="sr-only">{value}</span>
      <span className="pr-odo__face" aria-hidden>
        {runs.map((run, r) =>
          DIGITS.test(run) ? (
            <span key={r} className="pr-odo__run">
              {[...run].map((ch, c) => (
                <span key={c} className="pr-odo__col">
                  <span className="pr-odo__ghost">{ch}</span>
                  <span className="pr-odo__strip" style={{ '--c': col++ } as CSSProperties}>
                    {strip(ch).map((g, k) => (
                      <span key={k}>{g}</span>
                    ))}
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span key={r} className="pr-odo__sep" style={{ '--c': col } as CSSProperties}>
              {run}
            </span>
          ),
        )}
      </span>
    </span>
  )
}
