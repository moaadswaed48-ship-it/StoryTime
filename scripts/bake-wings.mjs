// Procedural monarch wing atlas (licence-free): draws a dorsal monarch wing pair as SVG
// and rasterises it to a 1024x512 RGBA PNG with two colour variants side by side.
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const out = fileURLToPath(new URL('../public/textures/wings-atlas-1024x512.png', import.meta.url))

function wingPair(ox, orange, dark) {
  // One wing drawn in a 512x512 cell, body at x=256, forewing up-right / hindwing down-right, mirrored for the left.
  const cells = (side) => {
    const s = side // 1 = right, -1 = left
    const m = (x) => 256 + s * x
    // Forewing outline (cx relative to body), hindwing outline
    const fore = `M ${m(8)} 250 C ${m(60)} 150, ${m(150)} 60, ${m(236)} 70 C ${m(252)} 74, ${m(250)} 110, ${m(238)} 150 C ${m(224)} 200, ${m(190)} 238, ${m(140)} 252 C ${m(100)} 262, ${m(50)} 262, ${m(8)} 250 Z`
    const hind = `M ${m(10)} 258 C ${m(60)} 256, ${m(120)} 262, ${m(170)} 290 C ${m(212)} 318, ${m(220)} 370, ${m(200)} 410 C ${m(180)} 444, ${m(130)} 460, ${m(90)} 440 C ${m(50)} 420, ${m(20)} 360, ${m(10)} 300 Z`
    // Veins
    const veins = [
      `M ${m(14)} 250 C ${m(80)} 200, ${m(150)} 140, ${m(225)} 90`,
      `M ${m(14)} 250 C ${m(90)} 215, ${m(170)} 180, ${m(236)} 135`,
      `M ${m(14)} 250 C ${m(90)} 236, ${m(160)} 225, ${m(212)} 205`,
      `M ${m(14)} 251 C ${m(70)} 250, ${m(120)} 252, ${m(150)} 250`,
      `M ${m(14)} 262 C ${m(70)} 270, ${m(130)} 290, ${m(190)} 330`,
      `M ${m(14)} 266 C ${m(60)} 290, ${m(120)} 340, ${m(170)} 410`,
      `M ${m(14)} 270 C ${m(40)} 320, ${m(70)} 380, ${m(110)} 440`,
      `M ${m(14)} 266 C ${m(30)} 300, ${m(40)} 340, ${m(45)} 400`,
    ].map((d) => `<path d="${d}" fill="none" stroke="${dark}" stroke-width="5" stroke-linecap="round" opacity="0.95"/>`).join('')
    // White spots on the dark margin (fore + hind)
    const spots = []
    for (let i = 0; i < 9; i++) {
      const t = i / 8
      const x = m(236 - 150 * t * 0.0 + (1 - t) * 0 + 236 * 0) // placeholder, replaced below
      spots.push({ x, t })
    }
    const foreEdge = (t) => {
      // param along the outer forewing edge from tip (t=0) to lower corner (t=1)
      const x = m(238 - 100 * t)
      const y = 100 + 150 * t
      return { x, y }
    }
    const hindEdge = (t) => ({ x: m(205 - 80 * t), y: 320 + 110 * t })
    let dots = ''
    for (let i = 0; i < 7; i++) {
      const p = foreEdge(i / 6)
      dots += `<circle cx="${p.x}" cy="${p.y}" r="${4 + (i % 2) * 2}" fill="#fbf7ef" opacity="0.95"/>`
    }
    for (let i = 0; i < 5; i++) {
      const p = hindEdge(i / 4)
      dots += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#fbf7ef" opacity="0.95"/>`
    }
    return `
      <path d="${fore}" fill="${dark}"/>
      <path d="${hind}" fill="${dark}"/>
      <path d="${fore}" fill="${orange}" transform="translate(${s * -4} 0) scale(1)" stroke="${dark}" stroke-width="22" stroke-linejoin="round" paint-order="stroke" clip-path="url(#clip${side})"/>
      <path d="${hind}" fill="${orange}" stroke="${dark}" stroke-width="18" stroke-linejoin="round" paint-order="stroke"/>
      ${veins}
      ${dots}`
  }
  return `<g transform="translate(${ox} 0)">
    <defs>
      <clipPath id="clip1"><rect x="256" y="0" width="256" height="512"/></clipPath>
      <clipPath id="clip-1"><rect x="0" y="0" width="256" height="512"/></clipPath>
    </defs>
    ${cells(1)}${cells(-1)}
    <ellipse cx="256" cy="268" rx="10" ry="80" fill="${dark}"/>
    <circle cx="256" cy="186" r="12" fill="${dark}"/>
    <path d="M 250 176 C 236 150, 230 140, 226 128" stroke="${dark}" stroke-width="3" fill="none"/>
    <path d="M 262 176 C 276 150, 282 140, 286 128" stroke="${dark}" stroke-width="3" fill="none"/>
  </g>`
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 1024 512">
  ${wingPair(0, '#f28c28', '#1a1410')}
  ${wingPair(512, '#e8771f', '#221a12')}
</svg>`

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out)
console.log('wrote', out)
