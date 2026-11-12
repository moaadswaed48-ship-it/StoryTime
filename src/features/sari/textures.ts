import * as THREE from 'three'

/** Small canvas-painted textures for the stage floor and the leaves: no image files, a few kilobytes of GPU memory. */
function paint(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d')!, size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** White disc that falls off smoothly to nothing: tinted by the material (pool of light, soft shadows). */
export function softDisc(falloff: Array<[number, number]>): THREE.CanvasTexture {
  return paint(256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    for (const [stop, alpha] of falloff) g.addColorStop(stop, `rgba(255,255,255,${alpha})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })
}

/** The turntable: one fine ring with a tick every 5° (longer every 30°) and a fainter inner ring. */
export function ringTexture(): THREE.CanvasTexture {
  return paint(1024, (ctx, s) => {
    const c = s / 2
    ctx.strokeStyle = '#fff'
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.9
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(c, c, c * 0.8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 0.35
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(c, c, c * 0.56, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2
      const long = i % 6 === 0
      ctx.globalAlpha = long ? 0.95 : 0.5
      ctx.lineWidth = long ? 3.5 : 2
      const r0 = c * 0.84
      const r1 = c * (long ? 0.93 : 0.885)
      ctx.beginPath()
      ctx.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0)
      ctx.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1)
      ctx.stroke()
    }
  })
}

/** One autumn leaf, drawn light so each instance can be tinted. `soft` = out of focus (for the leaves close to the lens). */
export function leafTexture(soft = false): THREE.CanvasTexture {
  return paint(256, (ctx, s) => {
    const leaf = () => {
      ctx.beginPath()
      ctx.moveTo(s * 0.5, s * 0.07)
      ctx.bezierCurveTo(s * 0.86, s * 0.24, s * 0.8, s * 0.68, s * 0.5, s * 0.84)
      ctx.bezierCurveTo(s * 0.2, s * 0.68, s * 0.14, s * 0.24, s * 0.5, s * 0.07)
      ctx.closePath()
    }
    if (soft) {
      // cross-browser blur: paint the shape off-canvas and keep only its blurred shadow
      ctx.shadowColor = 'rgba(255,255,255,0.9)'
      ctx.shadowBlur = s * 0.075
      ctx.shadowOffsetX = s * 2
      ctx.translate(-s * 2, 0)
      ctx.fillStyle = '#fff'
      ctx.save()
      ctx.translate(s * 0.5, s * 0.5)
      ctx.scale(0.84, 0.84)
      ctx.translate(-s * 0.5, -s * 0.5)
      leaf()
      ctx.fill()
      ctx.restore()
      return
    }
    const g = ctx.createLinearGradient(s * 0.2, 0, s * 0.8, s)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, '#d9d9d9')
    ctx.fillStyle = g
    leaf()
    ctx.fill()
    ctx.strokeStyle = 'rgba(96,96,96,0.55)'
    ctx.lineCap = 'round'
    ctx.lineWidth = s * 0.022
    ctx.beginPath()
    ctx.moveTo(s * 0.5, s * 0.12)
    ctx.lineTo(s * 0.5, s * 0.97)
    for (const y of [0.3, 0.44, 0.58]) {
      ctx.moveTo(s * 0.5, s * (y + 0.08))
      ctx.lineTo(s * 0.68, s * y)
      ctx.moveTo(s * 0.5, s * (y + 0.08))
      ctx.lineTo(s * 0.32, s * y)
    }
    ctx.stroke()
  })
}

/** The film's autumn palette (same family as the 2D leaves elsewhere on the site). */
export const LEAF_COLORS = ['#e2711d', '#f4a72c', '#c8421f', '#f2c14e', '#b3521c', '#d9902f']
