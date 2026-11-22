/**
 * Export for the game: one figure with its skeleton, face and every gesture clip as a standard binary glTF (GLB).
 * Runs in the browser (lab button) and in Node (script and test).
 */
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BONES, type Sheet } from '../cast/sheet.ts'
import { bakeClips } from './bake.ts'
import { buildFigure, type Figure } from './figure.ts'

/** three's exporter reads blobs through FileReader, which Node does not have: a minimal stand-in. */
function ensureFileReader() {
  const g = globalThis as { FileReader?: unknown }
  if (g.FileReader) return
  g.FileReader = class {
    result: ArrayBuffer | string | null = null
    onloadend: (() => void) | null = null
    readAsArrayBuffer(blob: Blob) {
      void blob.arrayBuffer().then((b) => {
        this.result = b
        this.onloadend?.()
      })
    }
    readAsDataURL(blob: Blob) {
      void blob.arrayBuffer().then((b) => {
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(b).toString('base64')}`
        this.onloadend?.()
      })
    }
  }
}

/** The figure in its bind pose (T-pose) with all clips, as GLB bytes. Outline and shadow are left out: a game adds its own. */
export async function exportGLB(figure: Figure): Promise<ArrayBuffer> {
  ensureFileReader()
  const clips = bakeClips(figure)
  // bind pose
  for (const name of BONES) {
    figure.bones[name].quaternion.identity()
    figure.bones[name].scale.setScalar(1)
    figure.bones[name].position.copy(figure.rig.offset[name])
  }
  figure.cane?.quaternion.identity()
  figure.face.apply({ blink: 0, happy: 0, smile: 0, open: 0, round: 0, browL: 0, browR: 0, lookX: 0, lookY: 0 })
  // plain materials travel best; the toon look is the engine's job
  const lit = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, name: 'figure' })
  const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = []
  const hidden: THREE.Object3D[] = []
  const rot = figure.root.rotation.y
  const scale = figure.root.scale.clone()
  figure.root.rotation.y = 0
  figure.root.scale.setScalar(1)
  figure.root.traverse((o) => {
    if (o.userData.helper) {
      if (o.visible) hidden.push(o)
      o.visible = false
      return
    }
    const m = o as THREE.Mesh
    if (m.isMesh && (m.material as THREE.Material).type === 'MeshToonMaterial') {
      swapped.push([m, m.material])
      m.material = lit
    }
  })
  figure.root.updateMatrixWorld(true)
  try {
    const out = await new GLTFExporter().parseAsync(figure.root, { binary: true, animations: clips, onlyVisible: true })
    return out as ArrayBuffer
  } finally {
    for (const [m, mat] of swapped) m.material = mat
    for (const o of hidden) o.visible = true
    figure.root.rotation.y = rot
    figure.root.scale.copy(scale)
    lit.dispose()
    figure.still('idle', 0)
  }
}

export type GlbSummary = { bones: string[]; clips: string[]; meshes: string[]; morphs: Record<string, string[]>; durations: Record<string, number>; vertices: number }

/** Loads GLB bytes back with three's loader and reports what is inside. */
export async function inspectGLB(bytes: ArrayBuffer): Promise<GlbSummary> {
  const gltf = await new GLTFLoader().parseAsync(bytes, '')
  const bones: string[] = []
  const meshes: string[] = []
  const morphs: Record<string, string[]> = {}
  let vertices = 0
  gltf.scene.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.push(o.name)
    const m = o as THREE.Mesh
    if (m.isMesh) {
      meshes.push(m.name)
      vertices += m.geometry.getAttribute('position').count
      if (m.morphTargetDictionary) morphs[m.name] = Object.keys(m.morphTargetDictionary)
    }
  })
  return { bones, clips: gltf.animations.map((c) => c.name), meshes, morphs, durations: Object.fromEntries(gltf.animations.map((c) => [c.name, c.duration])), vertices }
}

/** Builds a figure from a sheet, exports it and reads the file back. */
export async function roundTrip(sheet: Sheet): Promise<{ bytes: ArrayBuffer; summary: GlbSummary }> {
  const figure = buildFigure(sheet)
  try {
    const bytes = await exportGLB(figure)
    return { bytes, summary: await inspectGLB(bytes) }
  } finally {
    figure.dispose()
  }
}
