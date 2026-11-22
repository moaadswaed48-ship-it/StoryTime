/** Every scene the Studio can draw, by id. The export script and the lab pages both read this. */
import type { Scene } from '../scene'
import { devTurn } from './dev'
import { loopClap } from './loop'
import { places } from './places'
import { shotTower } from './shot'
import { spreadOranges } from './spread'
import { castSheet, faceSheet, gestureSheet } from './sheets'
import { viewsSheet } from './views'

export const SCENES: Record<string, Scene> = Object.fromEntries([spreadOranges, shotTower, castSheet, gestureSheet, faceSheet, places, loopClap, viewsSheet, devTurn].map((s) => [s.id, s]))
