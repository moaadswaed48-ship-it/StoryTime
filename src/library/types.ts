/**
 * The little the shelf needs to know about a book. Replaces the old `@/content/library` catalogue, which held
 * story ideas and real artwork that were not carried over.
 */
export type Emblem =
  | 'snow' | 'drop' | 'flower' | 'seed' | 'rainbow' | 'sun' | 'shade' | 'starfish' | 'olive' | 'bread' | 'moon'
  | 'shell' | 'rocket' | 'lantern' | 'clock' | 'book' | 'flame'

export interface ShelfBook {
  /** Stable id: seeds the book's size and lean, so the shelf looks the same on every device. */
  id: string
  /** A finished book stands a little taller and thicker than a "coming soon" one. */
  ready: boolean
  /** Cloth, lettering and foil colours of the code-drawn cover. */
  palette: { cloth: string; ink: string; foil: string }
  emblem: Emblem
}
