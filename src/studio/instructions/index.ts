/**
 * The three candidate directions for instruction pictures, side by side. Each is one file here plus one entry in
 * `../style/instruction-profiles.ts`; to keep the chosen one, delete the other two files, their lines here and
 * their profile entries. Nothing else refers to a direction by name.
 */
import type { DirectionId } from '../style/instruction-profiles'
import { above } from './above'
import { hands } from './hands'
import { stage } from './stage'
import type { Direction } from './types'

export const DIRECTIONS: Record<DirectionId, Direction> = { above, hands, stage }
export const DIRECTION_IDS = Object.keys(DIRECTIONS) as DirectionId[]

export { ACTIVITIES, ACTIVITY_LIST } from './activities'
export type { Activity, ActivityId, Card, CardKey, Direction } from './types'
