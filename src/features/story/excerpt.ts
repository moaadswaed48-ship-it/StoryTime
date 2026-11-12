/**
 * Her sentences are shown exactly as written. Where one of our excerpts starts or stops in the middle of a sentence of
 * hers, the card adds a quiet "…" (ours, in a lighter tone) instead of passing a fragment off as a whole sentence.
 */
const BOUNDARY = '.!?؟…:"«»“”\'-–—'
const TERMINAL = '.!?؟…'

/** Finds `quote` in the scene's paragraphs and says whether her sentence continues before and/or after it. */
export function excerptCut(quote: string, paragraphs: string[]): { before: boolean; after: boolean } {
  for (const para of paragraphs) {
    const at = para.indexOf(quote)
    if (at < 0) continue
    const head = para.slice(0, at).trimEnd()
    const tail = para.slice(at + quote.length).trimStart()
    const q = quote.trim()
    return {
      before: head.length > 0 && !BOUNDARY.includes(head[head.length - 1]),
      after: !TERMINAL.includes(q[q.length - 1]) && tail.length > 0 && !TERMINAL.includes(tail[0]),
    }
  }
  return { before: false, after: false }
}
