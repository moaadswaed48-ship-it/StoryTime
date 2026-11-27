import { AGE_GROUPS, PASS_MONTHS, type PassMonths, type Price } from './types'

/**
 * The price list as the public plans page shows it. No price is set yet: every price is null, shown as a visibly
 * marked placeholder (CLAUDE.md rule 4). The database (pass_prices) holds the same nulls; when the owner gives
 * prices they are set there and here, and the public page is rebuilt.
 */
export const PRICES: readonly Price[] = AGE_GROUPS.flatMap((ageGroup) => PASS_MONTHS.map((months) => ({ ageGroup, months, priceAgorot: null })))

/** How many of the given passes have a price: none, some or all (review 26 Nov, finding 9: decided per pass, not by one price). */
export type PricedState = 'none' | 'some' | 'all'
function state(list: readonly Price[]): PricedState {
  const set = list.filter((p) => p.priceAgorot !== null).length
  return set === 0 ? 'none' : set === list.length ? 'all' : 'some'
}
/** One pass length across the three age groups (the home page teaser lists lengths, not groups). */
export const lengthPriced = (prices: readonly Price[], months: PassMonths): PricedState =>
  state(AGE_GROUPS.map((g) => prices.find((p) => p.ageGroup === g && p.months === months) ?? { ageGroup: g, months, priceAgorot: null }))
/** All nine passes (the "Before you buy" validity line). */
export const allPriced = (prices: readonly Price[]): PricedState =>
  state(AGE_GROUPS.flatMap((g) => PASS_MONTHS.map((m) => prices.find((p) => p.ageGroup === g && p.months === m) ?? { ageGroup: g, months: m, priceAgorot: null })))
