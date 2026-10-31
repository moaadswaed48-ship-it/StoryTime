import * as THREE from 'three'

export const BOOK = { W: 0.7, H: 0.95, T: 0.08, PITCH: 0.82 }

/** Atlas regions in normalized canvas coordinates (y down). */
export const ATLAS = {
  front: { x: 0, y: 0, w: 0.4375, h: 0.625 },
  back: { x: 0.4375, y: 0, w: 0.4375, h: 0.625 },
  spine: { x: 0.875, y: 0, w: 0.09375, h: 0.625 },
}

/**
 * A hardcover book as one BoxGeometry with two material groups:
 *  0 → atlas (spine −x, front +z, back −z)   1 → paper edges (+x fore-edge, ±y)
 * UVs of the atlas faces are rewritten to their atlas regions. Shared by every book (2 draw calls each).
 */
export function makeBookGeometry(): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(BOOK.W, BOOK.H, BOOK.T)
  // face order in three's BoxGeometry: 0 +x, 1 −x, 2 +y, 3 −y, 4 +z, 5 −z (6 indices / 4 vertices each)
  g.clearGroups()
  const atlasFaces = new Set([1, 4, 5])
  for (let f = 0; f < 6; f++) g.addGroup(f * 6, 6, atlasFaces.has(f) ? 0 : 1)
  const uv = g.attributes.uv as THREE.BufferAttribute
  const map = (face: number, r: { x: number; y: number; w: number; h: number }, mirror = false) => {
    for (let k = 0; k < 4; k++) {
      const i = face * 4 + k
      const u = uv.getX(i)
      const v = uv.getY(i)
      const uu = mirror ? 1 - u : u
      // canvas y-down → texture v (flipY): region top edge y maps to v = 1 - y
      uv.setXY(i, r.x + uu * r.w, 1 - r.y - r.h + v * r.h)
    }
  }
  map(4, ATLAS.front)
  map(5, ATLAS.back)
  map(1, ATLAS.spine, true) // the −x face reads mirrored from outside; flip u so the spine text reads correctly
  uv.needsUpdate = true
  return g
}
