import * as THREE from 'three'
import type { Film, Stage } from '../engine/stage'
import { makeGoboTexture, makeLeafTexture, makeStonesTexture, blurredCopy, loadImage } from '../kit/textures'

/** Scratch composition: timing of the set-up steps. */
export default {
  W: 1920,
  H: 1080,
  fps: 24,
  async build(stage: Stage): Promise<Film> {
    const time = async (name: string, fn: () => unknown) => {
      const t = performance.now()
      await fn()
      console.log(name, Math.round(performance.now() - t), 'ms')
    }
    await time('leaf', () => makeLeafTexture(0))
    await time('gobo', () => makeGoboTexture())
    await time('stones', () => makeStonesTexture())
    const img = await loadImage('/site/story/k08.webp')
    await time('blurredCopy', () => blurredCopy(img, 9, 720))
    await time('rt', () => new THREE.WebGLRenderTarget(960, 540, { samples: 4, type: THREE.HalfFloatType }))
    void stage
    return { duration: 1, clips: [] }
  },
}
