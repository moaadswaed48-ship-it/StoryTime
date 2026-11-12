// The meadow island: a height grid (also a float texture for the grass and water shaders), exact triangle
// queries for foot placement, vertex colours (grass shades, sand, earthy banks), a pond and the sea.
import * as THREE from 'three';
import { toonMaterial, U } from '../look/materials';
import { fbm, noise2 } from './noise';

export const SIZE = 220;
export const RES = 0.5;
export const N = Math.round(SIZE / RES) + 1;
export const ORIGIN = -SIZE / 2;
export const POND = { x: 17, z: -15, r: 9.5 };
export const HILL = { x: -26, z: 18, r: 19, h: 6.5 };

export class Terrain {
	readonly h = new Float32Array(N * N);
	readonly grass = new Float32Array(N * N);
	pondLevel = 0;
	readonly seaLevel = 0;
	readonly mesh: THREE.Mesh;
	readonly heightTex: THREE.DataTexture;
	readonly islandRadius = 60;

	constructor() {
		// base heights
		const h = this.h;
		const rawAt = (x: number, z: number) => {
			const ang = Math.atan2(z, x);
			const R = this.islandRadius + 9 * (noise2(Math.cos(ang) * 1.6 + 5, Math.sin(ang) * 1.6 + 5, 3) - 0.5) * 2 + 4 * (noise2(Math.cos(ang) * 4 + 9, Math.sin(ang) * 4, 4) - 0.5);
			const r = Math.hypot(x, z) / R;
			const land = 1 - smooth(0.82, 1.06, r);
			let y = 1.6 + (fbm(x * 0.022 + 3, z * 0.022 - 7, 4) - 0.45) * 7.5 + (fbm(x * 0.07, z * 0.07, 3, 9) - 0.5) * 1.0;
			// the big hill with a steep side
			const dh = Math.hypot(x - HILL.x, z - HILL.z) / HILL.r;
			y += HILL.h * Math.exp(-dh * dh * 2.2) * (1 + 0.22 * Math.sin(Math.atan2(z - HILL.z, x - HILL.x) * 2) * smooth(0.15, 0.7, dh));
			// a gentle central meadow for spawning
			const dc = Math.hypot(x - 2, z - 4) / 16;
			y = y * (1 - 0.55 * Math.exp(-dc * dc)) + 2.2 * 0.55 * Math.exp(-dc * dc);
			y = Math.max(y, 0.9 + 0.4 * land);
			return y * land + (1 - land) * -3.5 + land * 0.0;
		};
		// pond: flatten a ring, carve a bowl
		const pondRim = rawAt(POND.x, POND.z);
		this.pondLevel = pondRim - 0.35;
		for (let j = 0; j < N; j++)
			for (let i = 0; i < N; i++) {
				const x = ORIGIN + i * RES,
					z = ORIGIN + j * RES;
				let y = rawAt(x, z);
				const dp = Math.hypot(x - POND.x, z - POND.z) / POND.r;
				const wob = 1 + 0.12 * (noise2(x * 0.3, z * 0.3, 21) - 0.5);
				const d = dp * wob;
				const ring = 1 - smooth(1.0, 1.7, d);
				y = y + (pondRim - y) * ring * 0.85;
				if (d < 1.05) {
					const bowl = this.pondLevel - 1.4 * Math.max(0, 1 - d * d) + 0.25 * smooth(0.75, 1.05, d);
					y = y + (bowl - y) * smooth(1.05, 0.8, d);
				}
				h[i + j * N] = y;
			}
		// grass mask and colours
		const geo = new THREE.PlaneGeometry(SIZE, SIZE, N - 1, N - 1);
		geo.rotateX(-Math.PI / 2);
		const pos = geo.attributes.position as THREE.BufferAttribute;
		// PlaneGeometry rows run +z..-z after rotation; rebuild positions directly from the grid
		for (let j = 0; j < N; j++)
			for (let i = 0; i < N; i++) {
				const v = i + j * N;
				pos.setXYZ(v, ORIGIN + i * RES, h[v], ORIGIN + j * RES);
			}
		// index: rebuild so triangles split the same way as heightAt()
		const idx: number[] = [];
		for (let j = 0; j < N - 1; j++)
			for (let i = 0; i < N - 1; i++) {
				const a = i + j * N,
					b = a + 1,
					c = a + N,
					d = c + 1;
				// triangles (a, c, b) and (b, c, d): split along the a-d? no: along b-c diagonal
				idx.push(a, c, b, b, c, d);
			}
		geo.setIndex(idx);
		geo.computeVertexNormals();
		const nrm = geo.attributes.normal as THREE.BufferAttribute;
		const col = new Float32Array(N * N * 3);
		const cA = new THREE.Color('#7ec94f'),
			cB = new THREE.Color('#4fae3c'),
			cC = new THREE.Color('#b8d65a'),
			sand = new THREE.Color('#e9d39a'),
			wetSand = new THREE.Color('#bfa877'),
			bank = new THREE.Color('#8f9a4a'),
			c = new THREE.Color();
		for (let j = 0; j < N; j++)
			for (let i = 0; i < N; i++) {
				const v = i + j * N;
				const x = ORIGIN + i * RES,
					z = ORIGIN + j * RES;
				const y = h[v];
				const ny = nrm.getY(v);
				const n1 = fbm(x * 0.045, z * 0.045, 3, 31);
				const n2 = noise2(x * 0.18, z * 0.18, 41);
				c.copy(cB).lerp(cA, smooth(0.35, 0.65, n1));
				c.lerp(cC, smooth(0.62, 0.85, n2 * 0.5 + n1 * 0.5) * 0.55 + smooth(5, 11, y) * 0.35);
				const steep = smooth(0.86, 0.72, ny);
				c.lerp(bank, steep * 0.75);
				const dp = Math.hypot(x - POND.x, z - POND.z);
				const beach = Math.max(smooth(1.25, 0.75, y), smooth(POND.r * 1.15, POND.r * 0.95, dp) * (y < this.pondLevel + 0.35 ? 1 : 0.4));
				c.lerp(sand, beach);
				if (y < 0.05 || (dp < POND.r * 1.05 && y < this.pondLevel)) c.lerp(wetSand, 0.7);
				col.set([c.r, c.g, c.b], v * 3);
				this.grass[v] = (1 - beach) * (1 - steep * 0.85) * (y > 0.6 ? 1 : 0);
			}
		geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
		this.colors = col;
		const mat = toonMaterial({ vertexColors: true }, { key: 'terrain', contact: true, edge: [-0.25, 0.35] });
		this.mesh = new THREE.Mesh(geo, mat);
		this.mesh.receiveShadow = true;
		this.mesh.name = 'terrain';
		// height + grass texture (RG float, linear filtered)
		const data = new Float32Array(N * N * 4);
		for (let v = 0; v < N * N; v++) {
			data[v * 4] = h[v];
			data[v * 4 + 1] = this.grass[v];
			data[v * 4 + 2] = col[v * 3 + 1];
			data[v * 4 + 3] = 1;
		}
		this.heightTex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.FloatType);
		this.heightTex.magFilter = THREE.LinearFilter;
		this.heightTex.minFilter = THREE.LinearFilter;
		this.heightTex.needsUpdate = true;
		U.uHeight.value = this.heightTex;
		U.uHeightOrigin.value.set(ORIGIN - RES * 0.5, ORIGIN - RES * 0.5);
		U.uHeightSize.value = N * RES;
	}
	readonly colors: Float32Array;

	/** Exact height of the rendered triangles at x,z (same split as the mesh index). */
	heightAt(x: number, z: number, n?: THREE.Vector3): number {
		const fx = (x - ORIGIN) / RES,
			fz = (z - ORIGIN) / RES;
		let i = Math.floor(fx),
			j = Math.floor(fz);
		if (i < 0 || j < 0 || i >= N - 1 || j >= N - 1) {
			n?.set(0, 1, 0);
			return -3.5;
		}
		const u = fx - i,
			v = fz - j;
		const h = this.h;
		const a = h[i + j * N],
			b = h[i + 1 + j * N],
			c = h[i + (j + 1) * N],
			d = h[i + 1 + (j + 1) * N];
		// triangles (a,c,b) when u+v<=1, else (b,c,d)
		let y: number;
		if (u + v <= 1) {
			y = a + (b - a) * u + (c - a) * v;
			n?.set(-(b - a) / RES, 1, -(c - a) / RES).normalize();
		} else {
			y = d + (c - d) * (1 - u) + (b - d) * (1 - v);
			n?.set(-(d - c) / RES, 1, -(d - b) / RES).normalize();
		}
		void i;
		void j;
		return y;
	}

	/** no grass under rocks (call before the height texture is uploaded again) */
	clearGrass(x: number, z: number, r: number) {
		const i0 = Math.floor((x - r - ORIGIN) / RES),
			i1 = Math.ceil((x + r - ORIGIN) / RES);
		const j0 = Math.floor((z - r - ORIGIN) / RES),
			j1 = Math.ceil((z + r - ORIGIN) / RES);
		const data = this.heightTex.image.data as Float32Array;
		for (let j = Math.max(0, j0); j <= Math.min(N - 1, j1); j++)
			for (let i = Math.max(0, i0); i <= Math.min(N - 1, i1); i++) {
				const d = Math.hypot(ORIGIN + i * RES - x, ORIGIN + j * RES - z) / r;
				if (d < 1) {
					const v = i + j * N;
					this.grass[v] *= smooth(0.75, 1.0, d);
					data[v * 4 + 1] = this.grass[v];
				}
			}
		this.heightTex.needsUpdate = true;
	}

	/** grass colour at x,z (for flowers and bounce) */
	colorAt(x: number, z: number, out: THREE.Color) {
		const i = Math.max(0, Math.min(N - 1, Math.round((x - ORIGIN) / RES)));
		const j = Math.max(0, Math.min(N - 1, Math.round((z - ORIGIN) / RES)));
		const v = (i + j * N) * 3;
		return out.setRGB(this.colors[v], this.colors[v + 1], this.colors[v + 2]);
	}

	grassAt(x: number, z: number) {
		const i = Math.max(0, Math.min(N - 1, Math.round((x - ORIGIN) / RES)));
		const j = Math.max(0, Math.min(N - 1, Math.round((z - ORIGIN) / RES)));
		return this.grass[i + j * N];
	}

	waterDepth(x: number, z: number) {
		const y = this.heightAt(x, z);
		const dp = Math.hypot(x - POND.x, z - POND.z);
		const level = dp < POND.r * 1.3 ? this.pondLevel : this.seaLevel;
		return level - y;
	}
}

export function smooth(a: number, b: number, x: number) {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
}
