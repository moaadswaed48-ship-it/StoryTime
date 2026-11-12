// A painted sky dome: gradient, sun glow and soft toon clouds drifting slowly (procedural, in the fragment shader).
import * as THREE from 'three';
import { U } from '../look/materials';

export function makeSky(sunDir: THREE.Vector3): THREE.Mesh {
	const geo = new THREE.SphereGeometry(700, 48, 24);
	const mat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
	const uSun = { value: sunDir.clone() };
	mat.onBeforeCompile = (s) => {
		Object.assign(s.uniforms, { uTime: U.uTime, uSun, uNight: U.uNight });
		s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vDir;').replace('#include <project_vertex>', '#include <project_vertex>\nvDir = normalize(position);');
		s.fragmentShader = s.fragmentShader
			.replace(
				'#include <common>',
				`#include <common>
varying vec3 vDir;
uniform float uTime;
uniform vec3 uSun;
uniform float uNight;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
	return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbmS(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.07; a *= 0.5; } return s; }`,
			)
			.replace(
				'vec4 diffuseColor = vec4( diffuse, opacity );',
				`vec4 diffuseColor = vec4( diffuse, opacity );
	{
		vec3 d = normalize(vDir);
		float h = d.y;
		vec3 top = vec3(0.16, 0.42, 0.86);
		vec3 hor = vec3(0.70, 0.86, 0.98);
		vec3 low = vec3(0.62, 0.80, 0.90);
		vec3 col = h > 0.0 ? mix(hor, top, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(hor, low, clamp(-h * 4.0, 0.0, 1.0));
		float sd = max(dot(d, normalize(uSun)), 0.0);
		col += vec3(1.0, 0.86, 0.6) * pow(sd, 10.0) * 0.45 + vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9997, sd) * 2.5;
		// clouds on a flat layer projected on the dome
		if (h > 0.02) {
			vec2 uv = d.xz / (h + 0.12) * 1.6 + vec2(uTime * 0.006, uTime * 0.002);
			float n = fbmS(uv * 1.1);
			float c = smoothstep(0.52, 0.62, n);
			float shade = smoothstep(0.52, 0.8, fbmS(uv * 1.1 + vec2(0.04, 0.05)));
			vec3 cloud = mix(vec3(1.0, 0.99, 0.96), vec3(0.78, 0.84, 0.95), shade * 0.8);
			float fade = smoothstep(0.02, 0.22, h);
			col = mix(col, cloud, c * fade * 0.95);
		}
		// night: deep blue dome, a low moon glow opposite the sun, twinkling stars; dusk warms the horizon
		if (uNight > 0.001) {
			float dusk = uNight * (1.0 - uNight) * 4.0;
			col = mix(col, col * vec3(1.15, 0.72, 0.55) + vec3(0.18, 0.05, 0.0) * (1.0 - clamp(h * 3.0, 0.0, 1.0)), dusk * 0.6);
			vec3 nTop = vec3(0.02, 0.04, 0.12), nHor = vec3(0.09, 0.13, 0.28);
			vec3 ncol = h > 0.0 ? mix(nHor, nTop, pow(clamp(h, 0.0, 1.0), 0.5)) : nHor * 0.8;
			float md = max(dot(d, normalize(vec3(-uSun.x, uSun.y * 0.8, -uSun.z))), 0.0);
			ncol += vec3(0.55, 0.65, 0.9) * pow(md, 24.0) * 0.25 + vec3(0.9, 0.95, 1.0) * smoothstep(0.9990, 0.9994, md) * 1.6;
			if (h > 0.0) {
				vec2 sp = d.xz / (h + 0.25) * 90.0;
				vec2 cell = floor(sp);
				float star = step(0.985, h21(cell)) * smoothstep(0.45, 0.0, length(fract(sp) - 0.5));
				star *= 0.6 + 0.4 * sin(uTime * 2.0 + h21(cell + 7.0) * 40.0);
				ncol += vec3(0.95, 0.97, 1.0) * star * smoothstep(0.02, 0.25, h);
			}
			col = mix(col, ncol, smoothstep(0.35, 1.0, uNight));
		}
		diffuseColor.rgb = col;
	}`,
			);
	};
	mat.customProgramCacheKey = () => 'sky';
	const m = new THREE.Mesh(geo, mat);
	m.frustumCulled = false;
	m.renderOrder = -10;
	m.name = 'sky';
	return m;
}
