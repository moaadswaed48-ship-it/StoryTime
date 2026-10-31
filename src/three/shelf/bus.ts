/**
 * Shared mutable channel between the DOM side of the shelf (gesture surface, buttons, keyboard)
 * and the simulation inside the drei View. Fast values only; React state stays in the zustand store.
 */
export interface ShelfBus {
  enters: number
  visible: boolean
  drag: { active: boolean; dxPx: number; vxPxMs: number; released: boolean; cancelled: boolean; id: number }
  wheelDx: number
  commands: ShelfCommand[]
  /** Set by the sim: current centred index and visible count, for the DOM live region. */
  index: number
  count: number
  wpp: number
  /** px to shift the row while a book is open (desktop sheet covers the right side). */
  focusShiftPx: number
}
export type ShelfCommand =
  | { type: 'step'; by: number }
  | { type: 'home' }
  | { type: 'end' }
  | { type: 'snapTo'; id: string }
  | { type: 'openCentred' }

export function createBus(): ShelfBus {
  return {
    enters: 0,
    visible: false,
    drag: { active: false, dxPx: 0, vxPxMs: 0, released: false, cancelled: false, id: 0 },
    wheelDx: 0,
    commands: [],
    index: 0,
    count: 0,
    wpp: 0.01,
    focusShiftPx: 0,
  }
}
