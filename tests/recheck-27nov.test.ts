import { describe, expect, it } from 'vitest'
import { codeFromText, ERROR_CODES } from '@/data/errors'
import { orderRefMatches } from '@/data/rules'
import type { AccessSnapshot, Pass } from '@/data/types'
import { errorText } from '@/features/account/messages'
import { classNoteKind, nothingOpenForClass } from '@/features/classroom/classroom'
import ar from '@/i18n/ar'
import da from '@/i18n/da'
import en from '@/i18n/en'
import he from '@/i18n/he'

/**
 * Fixes from the fresh recheck of 27 Nov 2026 (docs/reviews/fixes-recheck-27nov.md), the pure parts. The database
 * side of N3 is tests/db/recheck-27nov.test.ts; N1, N2 and the checkout wording of N4 are checked in the browser by
 * e2e/recheck-27nov.spec.ts.
 */
const ORDER = '3f2a1b9c-1111-4222-8333-944445555666'
const DICTS = { ar, da, en, he }

describe('N3: an order number glued to a word by a hyphen is found', () => {
  it('finds the number after a word ending in a-f, in any case, in the four languages people write', () => {
    for (const ref of ['Ref-3F2A1B9C', 'ref-3f2a1b9c', 'Ordre-3F2A1B9C', 'Code-3F2A1B9C', 'Ordrenr. Ordre-3f2a1b9c', 'Bestilling-3F2A1B9C', 'Ref-3F2A1B9C-1111'])
      expect(orderRefMatches(ref, ORDER), ref).toBe(true)
    // The whole id glued to a word.
    expect(orderRefMatches(`Ref-${ORDER.toUpperCase()}`, ORDER)).toBe(true)
  })

  it('keeps what matched before', () => {
    for (const ref of ['3F2A1B9C', 'Order #3f2a1b9c', ORDER.toUpperCase(), '3f2a1b9c1111', 'ORDER-3F2A1B9C', 'Order 3F2A1B9C', 'הזמנה 3F2A1B9C', 'طلب 3F2A1B9C'])
      expect(orderRefMatches(ref, ORDER), ref).toBe(true)
  })

  it('still refuses what does not name this order', () => {
    for (const ref of ['Ref-3F2A1B9', 'Ref-3F2A1B9D', 'Ref-2F2A1B9C', 'ORDER-2041', 'Ordre-1111-4222', 'Bead-3F2A1B9D', 'deadbeef-3f2a1b9', '', 'Ref-', '-3F2A1B9'])
      expect(orderRefMatches(ref, ORDER), ref).toBe(false)
    // A later part of the id is not the order number: the id must start with what was typed.
    expect(orderRefMatches('Ref-1111-4222-8333', ORDER)).toBe(false)
    expect(orderRefMatches('Ref-944445555666', ORDER)).toBe(false)
    // Letters glued without a hyphen stay part of the run, as before: no guess at where the word ends.
    expect(orderRefMatches('Ref3F2A1B9C', ORDER)).toBe(false)
  })
})

describe('N4: seller_not_set has its own message in the four languages', () => {
  it('is a known error code, found in the database refusal', () => {
    expect(ERROR_CODES).toContain('seller_not_set')
    expect(codeFromText('seller_not_set')).toBe('seller_not_set')
    expect(codeFromText('ERROR: seller_not_set (P0001)')).toBe('seller_not_set')
  })

  for (const [lang, dict] of Object.entries(DICTS)) {
    it(`shows the seller message, not the general error (${lang})`, () => {
      const text = errorText(dict, 'seller_not_set')
      expect(text).toBe(dict.account.errors.sellerNotSet)
      expect(text).not.toBe(dict.account.errors.unknown)
      expect(text.trim().length).toBeGreaterThan(20)
    })
    it(`has its own line for a price removed during checkout, with no total in it (${lang})`, () => {
      const t = dict.commerce.checkout
      expect(t.priceRemovedLead).not.toBe(t.priceChangedLead)
      expect(t.priceRemovedLead).not.toContain('{price}')
      expect(t.priceRemovedLead).not.toContain(dict.commerce.plans.priceNotSet)
    })
  }
})

describe('N2: when the class screen shows the grown-up note', () => {
  const now = '2026-11-27T10:00:00.000Z'
  const at = (days: number) => new Date(Date.parse(now) + days * 86_400_000).toISOString()
  const base: AccessSnapshot = { now, role: 'teacher', trial: null, passes: [] }
  const trial = (endsIn: number) => ({ id: 't', ageGroup: '4-5' as const, startedAt: at(endsIn - 3), endsAt: at(endsIn), storyIds: ['b01'] })
  const pass = (endsIn: number): Pass => ({ id: 'p', orderId: null, ageGroup: '4-5', months: 1, startsAt: at(-30), endsAt: at(endsIn), status: 'active', paidAt: null, amountAgorot: 0 })

  it('nothing open: no trial yet, or the trial or pass has ended; never for the owner or while loading', () => {
    expect(nothingOpenForClass(base)).toBe(true)
    expect(classNoteKind(base)).toBe('never')
    expect(nothingOpenForClass({ ...base, trial: trial(-1) })).toBe(true)
    expect(classNoteKind({ ...base, trial: trial(-1) })).toBe('ended')
    expect(nothingOpenForClass({ ...base, passes: [pass(-1)] })).toBe(true)
    expect(nothingOpenForClass({ ...base, trial: trial(2) })).toBe(false)
    expect(nothingOpenForClass({ ...base, passes: [pass(10)] })).toBe(false)
    expect(nothingOpenForClass({ ...base, role: 'owner' })).toBe(false)
    expect(nothingOpenForClass(null)).toBe(false)
  })
})
