import { AGE_GROUPS, PASS_MONTHS, type Price } from './types'

/**
 * The price list as the public plans page shows it. No price is set yet: every price is null, shown as a visibly
 * marked placeholder (CLAUDE.md rule 4). The database (pass_prices) holds the same nulls; when the owner gives
 * prices they are set there and here, and the public page is rebuilt.
 */
export const PRICES: readonly Price[] = AGE_GROUPS.flatMap((ageGroup) => PASS_MONTHS.map((months) => ({ ageGroup, months, priceAgorot: null })))
