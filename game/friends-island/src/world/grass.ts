// Grass: one triangle per blade, a tile of blades that wraps around the camera focus, heights and
// colours read from the terrain texture so it matches the ground exactly. Blades sway in the wind and bend away
// from creatures using the contact map (top-down occupancy rendered each frame).
import * as THREE from 'three';
import { toonMaterial } from '../look/materials';

export class Grass {
	readonly mesh: THREE.Mesh;
	readonly tile: number;
	readonly uTile: { value: number };
	constructor(count = 160000, tile = 54) {
		this.tile = tile;
		this.uTile = { value: tile };
		const pos = new Float32Array(count * 9);
		const blade = new Float32Array(count * 3 * 4);
		const shape = new Float32Array(count * 3 * 2);
		let s = 1234567;
		const rnd = () => {
			s = (s * 1664525 + 1013904223) >>> 0;
			return s / 4294967296;
		};
		const side = Math.ceil(Math.sqrt(count));
		const cell = tile / side;
		for (let k = 0; k < count; k++) {
			const gx = (k % side) + rnd(),
				gz = Math.floor(k / side) + rnd();
			const x = gx * cell - tile / 2,
				z = gz * cell - tile / 2;
			const r1 = rnd(),
				r2 = rnd(),
				r3 = rnd();
			for (let v = 0; v < 3; v++) {
				const i = k * 3 + v;
				pos.set([x, 0, z], i * 3);
				blade.set([x, z, r1, r2], i * 4);
				shape.set(v === 0 ? [0, 1] : v === 1 ? [1, 0] : [-1, 0], i * 2);
			}
			void r3;
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 9).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
		g.setAttribute('aBlade', new THREE.BufferAttribute(blade, 4));
		g.setAttribute('aShape', new THREE.BufferAttribute(shape, 2));
		g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
		const mat = toonMaterial(
			{ side: THREE.DoubleSide },
			{
				key: 'grass',
				contact: true,
				flatUp: true,
				edge: [-0.25, 0.35],
				uniforms: { uTile: this.uTile, uGroundCol: this.uGroundCol },
				vertexPars: /* glsl */ `
attribute vec4 aBlade;
attribute vec2 aShape;
uniform float uTile;
varying float vTip;
varying vec3 vGroundCol;
uniform sampler2D uGroundCol;
vec4 hSample(vec2 xz) { return texture2D(uHeight, (xz - uHeightOrigin) / uHeightSize); }
`,
				vertexBody: /* glsl */ `
	{
		// wrap the blade around the focus (seamless tile)
		vec2 rel = aBlade.xy - uFocus;
		rel = mod(rel + uTile * 0.5, uTile) - uTile * 0.5;
		vec2 xz = uFocus + rel;
		vec4 hs = hSample(xz);
		float edge = 1.0 - smoothstep(uTile * 0.32, uTile * 0.5, length(rel));
		float mask = smoothstep(0.35, 0.8, hs.g) * edge;
		float hNoise = 0.75 + 0.25 * sin(xz.x * 0.21 + sin(xz.y * 0.17) * 2.0) + 0.35 * aBlade.z;
		float height = 0.26 * hNoise * mask;
		float width = 0.055 * (0.7 + 0.6 * aBlade.w) * mask;
		// contact map: occupancy (r) and the ground height it was drawn at (g)
		vec2 cuv = (xz - uContactCenter) / uContactSize + 0.5;
		float px = 1.0 / 512.0;
		float occ = texture2D(uContact, cuv).r;
		float ox = texture2D(uContact, cuv + vec2(px * 2.0, 0.0)).r - texture2D(uContact, cuv - vec2(px * 2.0, 0.0)).r;
		float oz = texture2D(uContact, cuv + vec2(0.0, px * 2.0)).r - texture2D(uContact, cuv - vec2(0.0, px * 2.0)).r;
		vec2 push = -vec2(ox, oz);
		float pl = length(push);
		push = pl > 1e-4 ? push / pl : vec2(0.0);
		float flat_ = clamp(occ * 1.6, 0.0, 0.85);
		// wind: two travelling waves plus per-blade flutter
		float w1 = sin(uTime * 1.6 + dot(xz, uWind) * 0.35 + aBlade.z * 2.0);
		float w2 = sin(uTime * 2.9 + xz.x * 0.9 + xz.y * 0.6);
		vec2 wind = uWind * (0.08 + 0.06 * w1 + 0.025 * w2);
		float tip = aShape.y;
		vec2 dir = normalize(vec2(cos(aBlade.z * 6.283), sin(aBlade.z * 6.283)));
		vec2 sideV = vec2(-dir.y, dir.x);
		vec2 bend = (wind + push * flat_ * 0.9) * height * 3.0;
		transformed = vec3(xz.x, hs.r, xz.y);
		transformed.xz += sideV * aShape.x * width;
		transformed.xz += bend * tip;
		transformed.y += height * tip * (1.0 - flat_ * 0.75);
		vTip = tip;
		vec3 gc = texture2D(uGroundCol, (xz - uHeightOrigin) / uHeightSize).rgb;
		vGroundCol = gc * gc;
	}
`,
				fragmentPars: /* glsl */ `
varying float vTip;
varying vec3 vGroundCol;
uniform sampler2D uHeight;
uniform vec2 uHeightOrigin;
uniform float uHeightSize;
`,
				fragmentBody: /* glsl */ `
	{
		// colour from the ground under the blade, darker at the root, sunlit tips
		diffuseColor.rgb = vGroundCol * mix(0.62, 1.12, vTip) + vec3(0.06, 0.07, 0.0) * vTip * vTip;
	}
`,
			},
		);
		this.mesh = new THREE.Mesh(g, mat);
		this.mesh.frustumCulled = false;
		this.mesh.receiveShadow = true;
		this.mesh.name = 'grass';
	}
	readonly uGroundCol = { value: null as THREE.Texture | null };

	/** ground colour texture (from the terrain vertex colours) */
	setGroundColors(colors: Float32Array, n: number) {
		const data = new Uint8Array(n * n * 4);
		for (let v = 0; v < n * n; v++) {
			// store sRGB-ish (sqrt) for precision, decode in shader? keep linear*255 (fine for greens)
			data[v * 4] = Math.round(Math.sqrt(colors[v * 3]) * 255);
			data[v * 4 + 1] = Math.round(Math.sqrt(colors[v * 3 + 1]) * 255);
			data[v * 4 + 2] = Math.round(Math.sqrt(colors[v * 3 + 2]) * 255);
			data[v * 4 + 3] = 255;
		}
		const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
		t.magFilter = THREE.LinearFilter;
		t.minFilter = THREE.LinearFilter;
		t.needsUpdate = true;
		this.uGroundCol.value = t;
	}
}
