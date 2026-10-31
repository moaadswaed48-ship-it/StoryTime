import * as THREE from 'three'

export const BOOK = { W: 0.7, H: 0.95, T: 0.08, BOARD: 0.012, PITCH: 0.82 }

/** Atlas regions in normalized canvas coordinates (y down). */
export const ATLAS = {
  front: { x: 0, y: 0, w: 0.4375, h: 0.625 },
  back: { x: 0.4375, y: 0, w: 0.4375, h: 0.625 },
  spine: { x: 0.875, y: 0, w: 0.09375, h: 0.625 },
  cloth: { x: 0.875, y: 0.64, w: 0.1, h: 0.1 }, // plain cover cloth (board edges)
  paper: { x: 0.875, y: 0.78, w: 0.1, h: 0.2 }, // page edges (fore-edge, top, bottom)
  page: { x: 0.02, y: 0.64, w: 0.26, h: 0.35 }, // first page, drawn lazily when the cover opens
}

type Region = { x: number; y: number; w: number; h: number }

function remapFace(g: THREE.BoxGeometry, face: number, r: Region, mirror = false) {
  const uv = g.attributes.uv as THREE.BufferAttribute
  for (let k = 0; k < 4; k++) {
    const i = face * 4 + k
    const u = uv.getX(i)
    const v = uv.getY(i)
    const uu = mirror ? 1 - u : u
    uv.setXY(i, r.x + uu * r.w, 1 - r.y - r.h + v * r.h) // canvas y-down → texture v (flipY)
  }
  uv.needsUpdate = true
}

function setGroups(g: THREE.BoxGeometry, materialIndexByFace: number[]) {
  g.clearGroups()
  // face order in three's BoxGeometry: 0 +x, 1 −x, 2 +y, 3 −y, 4 +z, 5 −z (6 indices / 4 vertices each)
  for (let f = 0; f < 6; f++) g.addGroup(f * 6, 6, materialIndexByFace[f])
}

/**
 * Page block (everything except the front board) — ONE material (the atlas):
 *  spine −x, back −z, paper edges +x/±y, first page +z (revealed when the cover opens). 1 draw call.
 */
export function makeBlockGeometry(): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(BOOK.W, BOOK.H, BOOK.T - BOOK.BOARD)
  setGroups(g, [0, 0, 0, 0, 0, 0])
  remapFace(g, 0, ATLAS.paper)
  remapFace(g, 2, ATLAS.paper)
  remapFace(g, 3, ATLAS.paper)
  remapFace(g, 4, ATLAS.page)
  remapFace(g, 5, ATLAS.back)
  remapFace(g, 1, ATLAS.spine, true) // the −x face reads mirrored from outside; flip u so the spine text reads correctly
  return g
}

/** Front board — ONE material: +z face = atlas front region, every other face = plain cloth region. 1 draw call. */
export function makeBoardGeometry(): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(BOOK.W, BOOK.H, BOOK.BOARD)
  setGroups(g, [0, 0, 0, 0, 0, 0])
  for (const f of [0, 1, 2, 3, 5]) remapFace(g, f, ATLAS.cloth)
  remapFace(g, 4, ATLAS.front)
  return g
}
