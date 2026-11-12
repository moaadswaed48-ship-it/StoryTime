// Stylised water for the pond and the sea: colour by depth (read from the terrain height texture), an animated
// foam line at the shore, sky fresnel and toon sun glints. Opaque, so there is no sorting, and it meets the
// terrain at an angle (the shore), so it can never z-fight.
import * as THREE from 'three';
import { U } from '../look/materials';

export function makeWater(level: number, shape: 'disc' | 'sea', radius: number): THREE.Mesh {
	const geo = shape === 'disc' ? new THREE.CircleGeometry(radius, 64) : new THREE.RingGeometry(0.01, radius, 96, 12);
	geo.rotateX(-Math.PI / 2);
	const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: true });
	const uLevel = { value: level };
	mat.onBeforeCompile = (s) => {
		Object.assign(s.uniforms, U, { uLevel });
		s.vertexShader = s.vertexShader
			.replace('#include <common>', '#include <common>\nvarying vec3 vW;')
			.replace('#include <project_vertex>', '#include <project_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
		s.fragmentShader = s.fragmentShader
			.replace(
				'#include <common>',
				`#include <common>
varying vec3 vW;
uniform sampler2D uHeight;
uniform vec2 uHeightOrigin;
uniform float uHeightSize;
uniform float uLevel;
uniform float uTime;
uniform vec3 uSunColor;
uniform vec3 uSkyColor;
uniform sampler2D uContact;
uniform vec2 uContactCenter;
uniform float uContactSize;`,
			)
			.replace(
				'vec4 diffuseColor = vec4( diffuse, opacity );',
				`vec4 diffuseColor = vec4( diffuse, opacity );
	{
		vec2 huv = (vW.xz - uHeightOrigin) / uHeightSize;
		float ground = (huv.x < 0.0 || huv.y < 0.0 || huv.x > 1.0 || huv.y > 1.0) ? -3.5 : texture2D(uHeight, huv).r;
		float depth = max(0.0, uLevel - ground);
		vec3 shallow = vec3(0.30, 0.78, 0.74);
		vec3 mid = vec3(0.08, 0.48, 0.62);
		vec3 deep = vec3(0.03, 0.22, 0.42);
		vec3 col = mix(shallow, mid, smoothstep(0.0, 0.6, depth));
		col = mix(col, deep, smoothstep(0.8, 3.0, depth));
		// ripples
		float r1 = sin(vW.x * 1.7 + uTime * 1.3 + sin(vW.z * 1.3 + uTime) * 1.5);
		float r2 = sin(vW.z * 2.1 - uTime * 1.1 + sin(vW.x * 0.9) * 2.0);
		float rip = r1 * r2;
		// fresnel to the sky
		vec3 V = normalize(cameraPosition - vW);
		float fr = pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
		col = mix(col, uSkyColor * 1.05, fr * 0.65);
		// sun glints (toon)
		vec3 Hh = normalize(normalize(vec3(0.45, 0.7, 0.55)) + V);
		float g = smoothstep(0.72, 0.8, rip * 0.5 + 0.5) * smoothstep(0.85, 0.99, Hh.y);
		col += uSunColor * g * 0.55;
		col += vec3(1.0) * smoothstep(0.6, 0.95, rip) * 0.06;
		// shore foam: animated bands where the water is shallow
		float f = smoothstep(0.22, 0.0, depth + 0.04 * sin(uTime * 2.0 + vW.x * 3.0 + vW.z * 2.0));
		float band = smoothstep(0.5, 0.9, sin(depth * 40.0 - uTime * 2.4) * 0.5 + 0.5) * smoothstep(0.35, 0.05, depth);
		col = mix(col, vec3(0.97, 1.0, 0.98), clamp(f + band * 0.6, 0.0, 1.0));
		// creature ripples: contact map
		vec2 cuv = (vW.xz - uContactCenter) / uContactSize + 0.5;
		if (cuv.x > 0.0 && cuv.y > 0.0 && cuv.x < 1.0 && cuv.y < 1.0) {
			float occ = texture2D(uContact, cuv).r;
			col = mix(col, vec3(0.95, 1.0, 1.0), smoothstep(0.05, 0.25, occ) * (1.0 - smoothstep(0.3, 0.6, occ)) * 0.6);
		}
		diffuseColor.rgb = col;
	}`,
			);
	};
	mat.customProgramCacheKey = () => 'water';
	const m = new THREE.Mesh(geo, mat);
	m.position.y = level;
	m.name = `water-${shape}`;
	return m;
}
