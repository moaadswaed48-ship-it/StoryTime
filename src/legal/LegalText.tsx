import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Lang } from '@/i18n/config'
import type { LegalBlock } from '@/i18n/legal-schema'
import { localPath } from '@/seo/paths'

/**
 * Renders the legal pages' text. Two inline marks (src/i18n/legal-schema.ts):
 *   [[text]]       a visible placeholder: a dashed box, announced to screen readers as "to be filled in"
 *   {path|label}   a link to a page of the site, in the reader's language
 */
export type InlineToken = { kind: 'text'; text: string } | { kind: 'placeholder'; text: string } | { kind: 'link'; path: string; text: string }

const MARKS = /\[\[(.+?)\]\]|\{([a-z0-9/-]+)\|([^}]+)\}/g

export function parseInline(s: string): InlineToken[] {
  const out: InlineToken[] = []
  let last = 0
  for (const m of s.matchAll(MARKS)) {
    if (m.index > last) out.push({ kind: 'text', text: s.slice(last, m.index) })
    if (m[1] !== undefined) out.push({ kind: 'placeholder', text: m[1] })
    else out.push({ kind: 'link', path: m[2]!, text: m[3]! })
    last = m.index + m[0].length
  }
  if (last < s.length) out.push({ kind: 'text', text: s.slice(last) })
  return out
}

/** Every string inside a block, for tests and for the placeholder count. */
export function blockStrings(b: LegalBlock): string[] {
  if (typeof b === 'string') return [b]
  if ('list' in b) return b.list
  if ('steps' in b) return b.steps
  if ('note' in b) return [b.note]
  return [...b.table.head, ...b.table.rows.flat()]
}

export function Placeholder({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="rounded-md border border-dashed border-ink-muted bg-surface px-1.5 text-ink-muted [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
      <span className="sr-only">{label} </span>
      {children}
    </span>
  )
}

export function Inline({ text, lang, placeholderLabel }: { text: string; lang: Lang; placeholderLabel: string }) {
  return (
    <>
      {parseInline(text).map((t, i) =>
        t.kind === 'text' ? (
          <Fragment key={i}>{t.text}</Fragment>
        ) : t.kind === 'placeholder' ? (
          <Placeholder key={i} label={placeholderLabel}>{t.text}</Placeholder>
        ) : (
          <Link key={i} to={localPath(lang, t.path)} className="font-medium underline underline-offset-4">{t.text}</Link>
        ),
      )}
    </>
  )
}

export function Blocks({ blocks, lang, placeholderLabel }: { blocks: LegalBlock[]; lang: Lang; placeholderLabel: string }) {
  const inl = (s: string) => <Inline text={s} lang={lang} placeholderLabel={placeholderLabel} />
  return (
    <>
      {blocks.map((b, i) => {
        if (typeof b === 'string') return <p key={i}>{inl(b)}</p>
        if ('list' in b) {
          return (
            <ul key={i} className="flex list-disc flex-col gap-2 ps-6 marker:text-ink-muted">
              {b.list.map((s, j) => <li key={j}>{inl(s)}</li>)}
            </ul>
          )
        }
        if ('steps' in b) {
          return (
            <ol key={i} className="flex list-decimal flex-col gap-2 ps-6 marker:font-semibold">
              {b.steps.map((s, j) => <li key={j}>{inl(s)}</li>)}
            </ol>
          )
        }
        if ('note' in b) return <p key={i} className="rounded-control border-s-4 border-ink-muted bg-surface p-4">{inl(b.note)}</p>
        const { head, rows } = b.table
        return (
          <div key={i}>
            {/* Phones: one card per row, each value under its column's name. */}
            <ul className="flex flex-col gap-3 sm:hidden">
              {rows.map((r, j) => (
                <li key={j} className="rounded-control border border-line bg-surface p-4">
                  <p className="font-semibold">{inl(r[0]!)}</p>
                  <dl className="mt-2 flex flex-col gap-2 text-base">
                    {r.slice(1).map((cell, k) => (
                      <div key={k}>
                        <dt className="text-sm text-ink-muted">{head[k + 1]}</dt>
                        <dd>{inl(cell)}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
            {/* Wider screens: a real table. */}
            <table className="hidden w-full border-collapse text-start text-base sm:table">
              <thead>
                <tr>{head.map((h, k) => <th key={k} scope="col" className="border-b-2 border-line px-3 py-2 text-start align-bottom font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, j) => (
                  <tr key={j} className="align-top">
                    {r.map((cell, k) =>
                      k === 0 ? (
                        <th key={k} scope="row" className="border-b border-line px-3 py-3 text-start font-medium">{inl(cell)}</th>
                      ) : (
                        <td key={k} className="border-b border-line px-3 py-3">{inl(cell)}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </>
  )
}
