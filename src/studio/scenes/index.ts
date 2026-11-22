/** Every scene the Studio can draw, by id. The export script and the lab pages both read this. */
import type { Scene } from '../scene'
import { devTurn } from './dev'
import { lightScene, lightSheet } from './light'
import { loopClap } from './loop'
import { places } from './places'
import { shotTower } from './shot'
import { spreadOranges } from './spread'
import { animalsSheet } from './animals'
import { castSheet, faceSheet, gestureSheet } from './sheets'
import { viewsSheet } from './views'

export const SCENES: Record<string, Scene> = Object.fromEntries([spreadOranges, shotTower, castSheet, gestureSheet, faceSheet, places, loopClap, viewsSheet, animalsSheet, lightSheet, lightScene, devTurn].map((s) => [s.id, s]))
