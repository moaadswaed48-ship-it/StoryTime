import { describe, expect, it } from 'vitest'
import { words } from '../src/content/learning'
import { story } from '../src/content/story'
import { excerptCut } from '../src/features/story/excerpt'

describe('story: word cards show the author’s sentences honestly', () => {
  it('every quote is found, verbatim, in the scene it names', () => {
    for (const w of words) expect(story.scenes[w.scene].ar.some((p) => p.includes(w.quote.ar)), w.id).toBe(true)
  })
  it('marks an excerpt that starts or stops inside one of her sentences, and leaves whole sentences alone', () => {
    expect(excerptCut('ب ج', ['أ ب ج د.'])).toEqual({ before: true, after: true })
    expect(excerptCut('ب ج.', ['أ! ب ج. د'])).toEqual({ before: false, after: false })
    expect(excerptCut('ب ج', ['ب ج!'])).toEqual({ before: false, after: false })
    expect(excerptCut('غير موجود', ['أ ب ج.'])).toEqual({ before: false, after: false })
    const cuts = Object.fromEntries(words.map((w) => [w.id, excerptCut(w.quote.ar, story.scenes[w.scene].ar)]))
    expect(cuts.turn).toEqual({ before: false, after: false }) // a whole sentence of hers
    expect(cuts.wind).toEqual({ before: true, after: false }) // her sentence begins earlier: «بينما كان أمير…»
    expect(cuts.boat).toEqual({ before: true, after: true })
  })
})
