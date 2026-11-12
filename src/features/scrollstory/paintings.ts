import * as THREE from 'three'
import { story } from '@/content/story'
import { asset } from '@/lib/asset'
import { CARDS } from './layout'

/** Full-size paintings are kept for the cards around the one in front; further away the light copy is enough. */
const KEEP = 2
const DROP = 3
const PARALLEL = 2

const full = (i: number) => asset(story.scenes[i].img)
const small = (i: number) => asset(story.scenes[i].img.replace(/\.webp$/, '-sm.webp'))

interface Job {
  i: number
  big: boolean
  score: number
}

/**
 * The paintings as textures, loaded in the order the visitor will meet them: the light copies (640 px, ~40 KB)
 * of the first two at once, then the full painting (1344 px) of the card in front and its neighbours, then the rest.
 * At most five full paintings are held at a time (~27 MB of texture memory with mipmaps); the others are released.
 */
export class Paintings {
  private lo: (THREE.Texture | null)[] = new Array(CARDS).fill(null)
  private hi: (THREE.Texture | null)[] = new Array(CARDS).fill(null)
  private busy = new Set<string>()
  private failed = new Set<string>()
  private flying = 0
  private card = 0
  private dead = false
  private aniso: number
  /** Called when a painting becomes drawable. */
  onLoad: ((i: number) => void) | null = null

  constructor(private gl: THREE.WebGLRenderer) {
    this.aniso = Math.min(4, gl.capabilities.getMaxAnisotropy())
    this.pump()
  }

  /** The best picture there is for card `i` right now (null while even the light copy is on its way). */
  get(i: number): THREE.Texture | null {
    return this.hi[i] ?? this.lo[i]
  }

  sharp(i: number) {
    return !!this.hi[i]
  }

  count() {
    return { small: this.lo.filter(Boolean).length, full: this.hi.filter(Boolean).length }
  }

  /** Tell the loader which card is in front: it fetches around it and lets go of what is far behind. */
  focus(card: number) {
    if (card === this.card) return
    this.card = card
    for (let i = 0; i < CARDS; i++) {
      const tex = this.hi[i]
      if (tex && this.lo[i] && Math.abs(i - card) > DROP) {
        tex.dispose()
        this.hi[i] = null
      }
    }
    this.pump()
  }

  private next(): Job | null {
    let best: Job | null = null
    const offer = (job: Job) => {
      const key = (job.big ? 'h' : 'l') + job.i
      if (this.busy.has(key) || this.failed.has(key)) return
      if (!best || job.score < best.score) best = job
    }
    for (let i = 0; i < CARDS; i++) {
      // Cards ahead matter a little more than the ones already passed.
      const dist = i >= this.card ? i - this.card : this.card - i + 0.5
      if (!this.lo[i]) offer({ i, big: false, score: dist <= 1 ? dist : 10 + dist })
      if (!this.hi[i] && dist <= KEEP + 0.5) offer({ i, big: true, score: 2 + dist * 2 })
    }
    return best
  }

  private pump() {
    while (!this.dead && this.flying < PARALLEL) {
      const job = this.next()
      if (!job) return
      const key = (job.big ? 'h' : 'l') + job.i
      this.busy.add(key)
      this.flying++
      const img = new Image()
      img.decoding = 'async'
      img.src = job.big ? full(job.i) : small(job.i)
      const done = (ok: boolean) => {
        this.flying--
        this.busy.delete(key)
        if (this.dead) return
        if (!ok || !img.naturalWidth) this.failed.add(key)
        else {
          const tex = new THREE.Texture(img)
          tex.colorSpace = THREE.SRGBColorSpace
          tex.generateMipmaps = true
          tex.minFilter = THREE.LinearMipmapLinearFilter
          tex.magFilter = THREE.LinearFilter
          tex.anisotropy = this.aniso
          tex.needsUpdate = true
          // Upload now, between frames, rather than in the middle of the frame that first shows it.
          this.gl.initTexture(tex)
          if (job.big) this.hi[job.i] = tex
          else this.lo[job.i] = tex
          this.onLoad?.(job.i)
        }
        this.pump()
      }
      // decode() resolves once the pixels are ready, so the upload does not stall a frame.
      img.decode().then(
        () => done(true),
        () => done(false),
      )
    }
  }

  dispose() {
    this.dead = true
    this.onLoad = null
    for (const list of [this.lo, this.hi]) {
      for (let i = 0; i < list.length; i++) {
        list[i]?.dispose()
        list[i] = null
      }
    }
  }
}
