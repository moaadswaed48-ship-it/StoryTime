import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend, type ThreeElement } from '@react-three/fiber'

/**
 * akella/fake3d "depth parallax": offsets the colour UV by (depth − 0.5) · mouse / threshold.
 * uThreshold [35, 15] keeps the shift ≤ 1.4 % UV so silhouettes stay clean; mirrored() wraps the borders.
 */
export const DepthParallaxMaterial = shaderMaterial(
  {
    uMap: null as THREE.Texture | null,
    uDepth: null as THREE.Texture | null,
    uMouse: new THREE.Vector2(0, 0),
    uScroll: 0,
    uThreshold: new THREE.Vector2(35, 15),
    uOpacity: 0,
    uCover: new THREE.Vector4(1, 1, 0, 0), // scale.xy, offset.xy for object-fit: cover
  },
  /* glsl */ `
  uniform sampler2D uDepth;
  uniform vec4 uCover;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec2 cuv = uv * uCover.xy + uCover.zw;
    float d = texture2D(uDepth, cuv).r;
    vec3 p = position;
    p.z += (d - 0.5) * 0.06;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`,
  /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uDepth;
  uniform vec2 uMouse;
  uniform vec2 uThreshold;
  uniform float uScroll;
  uniform float uOpacity;
  uniform vec4 uCover;
  varying vec2 vUv;
  vec2 mirrored(vec2 v) { vec2 m = mod(v, 2.0); return mix(m, 2.0 - m, step(1.0, m)); }
  void main() {
    vec2 cuv = vUv * uCover.xy + uCover.zw;
    float d = texture2D(uDepth, mirrored(cuv)).r;
    vec2 off = (d - 0.5) * (uMouse / uThreshold);
    vec2 uv = cuv + off + vec2(0.0, uScroll * 0.02);
    vec4 c = texture2D(uMap, mirrored(uv));
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
    #include <colorspace_fragment>
  }`,
)
extend({ DepthParallaxMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    depthParallaxMaterial: ThreeElement<typeof DepthParallaxMaterial>
  }
}
