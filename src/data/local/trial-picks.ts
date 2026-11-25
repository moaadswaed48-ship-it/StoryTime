import type { AgeGroup } from '../types'

/**
 * The trial stories of each age group in test mode (Stage 4, part C; recorded in docs/HANDOFF.md). On Supabase the
 * owner sets them in the owner's area (story_age_groups.is_trial); this is the local backend's stand-in.
 * Chosen to show the range of the library in three days: one values story, one numbers or learning story, one
 * feelings, health or science story. A04, B02 and C01 were named by the owner.
 *   2-3  A04 Slow, Slow, Together (respect for older people) · A01 One, Two, Three, Wheee! (counting) ·
 *        A07 Boom, Says the Sky (a scared feeling, comfort)
 *   4-5  B02 The Shell That Sings (listening to a classmate) · B01 Ten Goats Home (counting to ten) ·
 *        B09 The Kite That Kept Falling (keep trying)
 *   6-8  C01 Ten Pomegranates, Two Baskets (number pairs that make ten) · C03 The Quiet Morning (helping Mother) ·
 *        C10 Long-Legs Flies South (bird migration, science)
 * The order is the order on the shelf.
 */
export const TRIAL_PICKS: Record<AgeGroup, readonly string[]> = {
  '2-3': ['a04', 'a01', 'a07'],
  '4-5': ['b02', 'b01', 'b09'],
  '6-8': ['c01', 'c03', 'c10'],
}
