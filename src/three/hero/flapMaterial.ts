import * as THREE from 'three'

/**
 * Unlit, alpha-tested butterfly material with a vertex-shader wing flap.
 * Per-instance attributes: aPhase, aSpeed, aAmp, aVariant, aFade.
 * Wings lie in the instance's XZ plane (hinge along z); the tip lags the root (ykob / threejs-toys formula).
 */
export function makeFlapMaterial(map: THREE.Texture) {
  const mat = new THREE.MeshBasicMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, transparent: false, toneMapped: false })
  const uniforms = { uTime: { value: 0 } }
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float aPhase; attribute float aSpeed; attribute float aAmp; attribute float aVariant; attribute float aFade;
        uniform float uTime; varying float vFade;`,
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        vMapUv = vec2((aVariant + uv.x) * 0.5, uv.y);
        vFade = aFade;`,
      )
      .replace(
        '#include <begin_vertex>',
        `float dx = abs(position.x);
        float sdx = smoothstep(0.0, 1.0, dx);
        float t = uTime * aSpeed + aPhase;
        float ang = radians(sin(t - sdx * 0.9) * 42.0 + 18.0) * aAmp;
        vec3 transformed = vec3(cos(ang) * position.x, sin(ang) * dx, position.z);`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n varying float vFade;')
      .replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\n diffuseColor.rgb = mix(vec3(0.86, 0.90, 0.93), diffuseColor.rgb, 0.3 + 0.7 * vFade);')
  }
  mat.customProgramCacheKey = () => 'storytime-flap'
  return { mat, uniforms }
}
