/**
 * The look: flat toon shading in two and a half tones with a tinted shade, a soft outline in a darker tone of
 * each colour (an inverted hull, so it costs one extra draw), and a soft contact shadow. No post-processing.
 */
import * as THREE from 'three'

let ramp: THREE.DataTexture | null = null
/** Light → shade steps. The shade is slightly violet, so skin and cloth stay warm in the light. */
function toonRamp() {
  if (ramp) return ramp
  const n = 16
  const data = new Uint8Array(n * 4)
  for (let i = 0; i < n; i++) {
    const dot = ((i + 0.5) / n) * 2 - 1
    const c = dot < -0.12 ? [0.76, 0.72, 0.82] : dot < 0.22 ? [0.9, 0.875, 0.915] : [1, 1, 1]
    data.set([c[0] * 255, c[1] * 255, c[2] * 255, 255], i * 4)
  }
  ramp = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat)
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter
  ramp.generateMipmaps = false
  ramp.needsUpdate = true
  return ramp
}

/** Toon material that takes its colours from the vertices. One instance serves a whole figure. */
export function toonMaterial() {
  const m = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp() })
  m.name = 'toon'
  // three reads only the red channel of the ramp; read all three so the shade can be tinted
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <gradientmap_pars_fragment>',
      `uniform sampler2D gradientMap;
       vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
         float dotNL = dot( normal, lightDirection );
         return texture2D( gradientMap, vec2( dotNL * 0.5 + 0.5, 0.5 ) ).rgb;
       }`,
    )
  }
  m.customProgramCacheKey = () => 'hero3d-toon'
  return m
}

/** Outline: the same mesh drawn again, back faces only, pushed out along its normals, in a deep tone of its colours. */
export function outlineMaterial(thickness: number) {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, color: new THREE.Color(0.36, 0.27, 0.33) })
  m.name = 'outline'
  const uniform = { value: thickness }
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uLine = uniform
    shader.vertexShader = `uniform float uLine;\n${shader.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normalize( normal ) * uLine;')}`
  }
  m.customProgramCacheKey = () => 'hero3d-outline'
  m.userData.line = uniform
  return m
}

/** Soft round shadow on the ground under the figure. */
export function contactShadow(radius: number) {
  const seg = 28
  const rings = [0, 0.55, 1]
  const alpha = [0.3, 0.2, 0]
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (let r = 0; r < rings.length; r++) {
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2
      pos.push(Math.cos(a) * rings[r], 0, Math.sin(a) * rings[r] * 0.62)
      col.push(0.16, 0.1, 0.2, alpha[r])
    }
  }
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg
      idx.push(r * seg + i, r * seg + j, (r + 1) * seg + i, r * seg + j, (r + 1) * seg + j, (r + 1) * seg + i)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }))
  mesh.name = 'contactShadow'
  mesh.scale.setScalar(radius)
  mesh.position.y = 0.002
  mesh.renderOrder = -1
  return mesh
}

/** The light the figures are designed under: one key from the upper front, viewer's left. Strength π shows colours as designed. */
export function addStageLight(scene: THREE.Object3D) {
  const key = new THREE.DirectionalLight(0xffffff, Math.PI)
  key.position.set(-1.4, 2.6, 3)
  scene.add(key)
  return key
}
