/** The code-built 3D characters: build one from a sheet, play the shared gestures, show them on the hero stage. */
export { buildFigure, Figure, type Look } from './figure.ts'
export { GESTURE_DEFS, ACTS, gesturePose, idlePose, type Act, type GestureDef } from './gestures.ts'
export { bakeClips, bakeClip } from './bake.ts'
export { StageRuntime } from './stage.ts'
export { HeroStage, type HeroStageProps, type HeroMode, type HeroLabels } from './HeroStage.tsx'
