/** Every scene the Studio can draw, by id. The export script and the lab pages both read this. */
import type { Scene } from '../scene'
import { loopClap } from './loop'
import { places } from './places'
import { shotTower } from './shot'
import { spreadOranges } from './spread'
import { castSheet, faceSheet, gestureSheet } from './sheets'

export const SCENES: Record<string, Scene> = Object.fromEntries([spreadOranges, shotTower, castSheet, gestureSheet, faceSheet, places, loopClap].map((s) => [s.id, s]))
