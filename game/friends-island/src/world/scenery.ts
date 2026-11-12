// Trees, bushes, rocks and flowers. Trees: tapered bent trunks with puffy canopies (blob normals for soft
// toon shading) swaying in the wind. Rocks: faceted, mossy on top, real ground for feet (ray-tested triangles).
// Flowers: instanced, coloured per instance, swaying.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toonMaterial } from '../look/materials';
import { noise2, Rand } from './noise';
import { courseDist } from './course';
import { POND, type Terrain } from './terrain';

export interface Obstacle {
	x: number;
	z: number;
	r: number;
	/** top height above the ground: low rocks can be climbed */
	top: number;
	kind: 'tree' | 'rock' | 'bush';
}

const SWAY_PARS = /* glsl */ `
attribute float aSway;
`;
const SWAY_BODY = /* glsl */ `
	{
		vec3 ip = vec3(0.0);
		#ifdef USE_INSTANCING
			ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
		#endif
		float ph = ip.x * 0.31 + ip.z * 0.23;
		float w = sin(uTime * 1.3 + ph) * 0.6 + sin(uTime * 2.3 + ph * 1.7) * 0.25;
		float k = aSway * aSway;
		transformed.x += (uWind.x * (0.6 + 0.4 * w)) * k * 0.35;
		transformed.z += (uWind.y * (0.6 + 0.4 * w)) * k * 0.35;
		transformed.y -= k * 0.04 * abs(w);
	}
`;

function colorize(g: THREE.BufferGeometry, fn: (p: THREE.Vector3, n: THREE.Vector3) => THREE.Color) {
	const p = g.attributes.position as THREE.BufferAttribute;
	const n = g.attributes.normal as THREE.BufferAttribute;
	const col = new Float32Array(p.count * 3);
	const v = new THREE.Vector3(),
		nn = new THREE.Vector3();
	for (let i = 0; i < p.count; i++) {
		v.fromBufferAttribute(p, i);
		nn.fromBufferAttribute(n, i);
		const c = fn(v, nn);
		col.set([c.r, c.g, c.b], i * 3);
	}
	g.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

function sway(g: THREE.BufferGeometry, fn: (p: THREE.Vector3) => number) {
	const p = g.attributes.position as THREE.BufferAttribute;
	const a = new Float32Array(p.count);
	const v = new THREE.Vector3();
	for (let i = 0; i < p.count; i++) a[i] = fn(v.fromBufferAttribute(p, i));
	g.setAttribute('aSway', new THREE.BufferAttribute(a, 1));
}

function blobCanopy(rand: Rand, radius: number, puffs: number, palette: THREE.Color[], center: THREE.Vector3): THREE.BufferGeometry {
	const parts: THREE.BufferGeometry[] = [];
	for (let i = 0; i < puffs; i++) {
		const r = radius * rand.range(0.5, 0.78);
		const g = new THREE.IcosahedronGeometry(r, 3);
		const a = rand.range(0, Math.PI * 2);
		const d = i === 0 ? 0 : radius * rand.range(0.35, 0.6);
		const off = new THREE.Vector3(Math.cos(a) * d, (i === 0 ? 0.15 : rand.range(-0.35, 0.3)) * radius, Math.sin(a) * d);
		// lumpy
		const p = g.attributes.position as THREE.BufferAttribute;
		const v = new THREE.Vector3();
		for (let k = 0; k < p.count; k++) {
			v.fromBufferAttribute(p, k);
			const n = v.clone().normalize();
			const bump = 1 + 0.09 * Math.sin(n.x * 9 + i) * Math.sin(n.y * 7) * Math.sin(n.z * 8 + i * 2);
			v.multiplyScalar(bump).add(off);
			p.setXYZ(k, v.x, v.y, v.z);
		}
		g.translate(center.x, center.y, center.z);
		parts.push(g);
	}
	const m = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
	// blob normals: from the canopy centre (soft, cloud-like toon shading)
	const p = m.attributes.position as THREE.BufferAttribute;
	const n = m.attributes.normal as THREE.BufferAttribute;
	const v = new THREE.Vector3();
	for (let k = 0; k < p.count; k++) {
		v.fromBufferAttribute(p, k).sub(center);
		v.y *= 0.8;
		const fn = v.normalize();
		const on = new THREE.Vector3().fromBufferAttribute(n, k);
		fn.lerp(on, 0.35).normalize();
		n.setXYZ(k, fn.x, fn.y, fn.z);
	}
	colorize(m, (pp, nn) => {
		const t = Math.min(1, Math.max(0, (nn.y + 1) / 2));
		const c = palette[0].clone().lerp(palette[1], t);
		const spec = noise2(pp.x * 2.3, pp.z * 2.3 + pp.y, 5);
		c.lerp(palette[2], Math.max(0, spec - 0.55) * 1.4 * t);
		return c;
	});
	return m;
}

function trunk(height: number, r0: number, bend: number, color: THREE.Color): THREE.BufferGeometry {
	const g = new THREE.CylinderGeometry(r0 * 0.6, r0, height, 9, 6, true);
	g.translate(0, height / 2, 0);
	const p = g.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < p.count; i++) {
		const y = p.getY(i);
		const t = y / height;
		p.setX(i, p.getX(i) + Math.sin(t * Math.PI * 0.9) * bend);
		// flare at the base
		const fl = 1 + Math.max(0, 0.25 - t) * 2.2;
		p.setX(i, p.getX(i) * fl);
		p.setZ(i, p.getZ(i) * fl);
	}
	g.computeVertexNormals();
	colorize(g, (pp) => color.clone().multiplyScalar(0.8 + 0.25 * (pp.y / height)));
	return g.toNonIndexed();
}

export class Scenery {
	readonly root = new THREE.Group();
	readonly obstacles: Obstacle[] = [];
	readonly rocks: Array<{ x: number; z: number; r: number; tris: Float32Array; top: number }> = [];

	constructor(private terrain: Terrain) {
		const rand = new Rand(20261027);
		const T = terrain;
		const okLand = (x: number, z: number, minGrass = 0.6) => T.grassAt(x, z) > minGrass && T.waterDepth(x, z) < -0.3 && Math.hypot(x, z) < T.islandRadius * 0.86;
		const farFrom = (x: number, z: number, d: number) => this.obstacles.every((o) => Math.hypot(o.x - x, o.z - z) > d + o.r);

		// ---- rocks (placed first: real walkable ground) ----
		const rockMat = toonMaterial({ vertexColors: true, flatShading: true }, { key: 'rock', contact: true, edge: [-0.2, 0.3] });
		const rockGeos: THREE.BufferGeometry[] = [];
		const rockSpots: Array<[number, number, number]> = [
			[-4, 17, 1.6],
			[9, 9, 0.9],
			[-14, -4, 2.4],
			[24, 6, 1.2],
			[-30, 28, 3.2],
			[-20, 2, 1.1],
			[-13.5, 15.5, 0.45],
			[4, -22, 1.8],
			[31, -24, 2.6],
			[-38, -10, 2.0],
			[14, 24, 1.4],
			[-8, -14, 0.8],
			[26, -8, 1.0],
			[POND.x + 8, POND.z + 6, 1.3],
			[POND.x - 9, POND.z - 4, 0.9],
			[-24, 30, 1.6],
			[38, 14, 2.2],
			[-2, 30, 1.2],
			[0, -36, 2.8],
		];
		for (const [x, z, r] of rockSpots) {
			const g = new THREE.IcosahedronGeometry(1, 1);
			const p = g.attributes.position as THREE.BufferAttribute;
			const v = new THREE.Vector3();
			const flat = rand.range(0.7, 1.0);
			const rot = rand.range(0, Math.PI * 2);
			for (let i = 0; i < p.count; i++) {
				v.fromBufferAttribute(p, i);
				const k = 1 + 0.22 * (noise2(v.x * 1.7 + x, v.z * 1.7 + z, 7) - 0.5) + 0.1 * (noise2(v.y * 3 + x, v.x * 3, 8) - 0.5);
				v.multiplyScalar(k);
				v.y = v.y * flat;
				if (v.y < 0) v.y *= 0.4;
				v.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
				v.multiplyScalar(r);
				p.setXYZ(i, v.x, v.y, v.z);
			}
			let gy = Infinity;
			for (let i = 0; i < p.count; i++) gy = Math.min(gy, T.heightAt(x + p.getX(i), z + p.getZ(i)));
			g.translate(x, gy - r * 0.08, z);
			const ng = g.index ? g.toNonIndexed() : g;
			ng.computeVertexNormals();
			colorize(ng, (pp, nn) => {
				const base = new THREE.Color('#857f86').lerp(new THREE.Color('#a59d9a'), noise2(pp.x * 1.3, pp.z * 1.3, 11));
				return base.lerp(new THREE.Color('#6fae3c'), Math.min(1, Math.max(0, nn.y - 0.45) * 2.2 * (0.45 + noise2(pp.x * 2, pp.z * 2, 12))));
			});
			rockGeos.push(ng);
			const tris = (ng.attributes.position as THREE.BufferAttribute).array as Float32Array;
			let top = -Infinity;
			for (let i = 1; i < tris.length; i += 3) top = Math.max(top, tris[i]);
			this.rocks.push({ x, z, r: r * 1.35, tris: new Float32Array(tris), top });
			this.obstacles.push({ x, z, r: r * 1.05, top: top - T.heightAt(x, z), kind: 'rock' });
			T.clearGrass(x, z, r * 1.05);
		}
		const rocks = new THREE.Mesh(mergeGeometries(rockGeos), rockMat);
		rocks.castShadow = true;
		rocks.receiveShadow = true;
		rocks.name = 'rocks';
		this.root.add(rocks);

		// ---- trees ----
		const leafPalettes = [
			[new THREE.Color('#2f7a2c'), new THREE.Color('#6cc23c'), new THREE.Color('#b6e05a')],
			[new THREE.Color('#2e6e3a'), new THREE.Color('#58b04a'), new THREE.Color('#a2d870')],
			[new THREE.Color('#3f7f22'), new THREE.Color('#8cc93a'), new THREE.Color('#d8e86a')],
		];
		const bark = new THREE.Color('#7a5236');
		const variants: THREE.BufferGeometry[] = [];
		for (let k = 0; k < 4; k++) {
			const h = rand.range(4.2, 6.5);
			const tr = trunk(h, rand.range(0.22, 0.32), rand.range(-0.5, 0.5), bark);
			const can = blobCanopy(rand, rand.range(2.0, 2.8), 5 + (k % 3), leafPalettes[k % 3], new THREE.Vector3(Math.sin(k) * 0.4, h + 0.6, 0));
			const merged = mergeGeometries([tr, can]);
			sway(merged, (p) => Math.max(0, p.y - 1.2) / 6);
			variants.push(merged);
		}
		const treeMat = toonMaterial({ vertexColors: true }, { key: 'tree', contact: true, gloss: 0, rim: 0.25, sss: 0.25, edge: [-0.25, 0.35], vertexPars: SWAY_PARS, vertexBody: SWAY_BODY });
		const placements: THREE.Matrix4[][] = variants.map(() => []);
		let placed = 0;
		for (let tries = 0; tries < 4000 && placed < 46; tries++) {
			const a = rand.range(0, Math.PI * 2);
			const d = Math.sqrt(rand.next()) * T.islandRadius * 0.82;
			const x = Math.cos(a) * d,
				z = Math.sin(a) * d;
			// keep the central meadow and the pond shore open; groves by noise
			if (Math.hypot(x - 2, z - 4) < 11) continue;
			if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 4) continue;
			if (noise2(x * 0.05, z * 0.05, 77) < 0.42) continue;
			if (!okLand(x, z, 0.7) || !farFrom(x, z, 3.2) || courseDist(x, z) < 6) continue;
			const s = rand.range(0.8, 1.25);
			const v = placed % variants.length;
			const m = new THREE.Matrix4().compose(new THREE.Vector3(x, T.heightAt(x, z) - 0.1, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand.range(0, 6.28)), new THREE.Vector3(s, s * rand.range(0.9, 1.15), s));
			placements[v].push(m);
			this.obstacles.push({ x, z, r: 0.55 * s, top: 99, kind: 'tree' });
			placed++;
		}
		variants.forEach((g, v) => {
			const im = new THREE.InstancedMesh(g, treeMat, Math.max(1, placements[v].length));
			placements[v].forEach((m, i) => im.setMatrixAt(i, m));
			im.count = placements[v].length;
			im.castShadow = true;
			im.receiveShadow = true;
			im.name = `trees-${v}`;
			im.computeBoundingSphere();
			this.root.add(im);
		});

		// ---- bushes ----
		const bushGeo = blobCanopy(rand, 0.9, 4, leafPalettes[1], new THREE.Vector3(0, 0.55, 0));
		sway(bushGeo, (p) => Math.max(0, p.y) / 3);
		const bushM: THREE.Matrix4[] = [];
		for (let tries = 0; tries < 3000 && bushM.length < 60; tries++) {
			const a = rand.range(0, Math.PI * 2);
			const d = Math.sqrt(rand.next()) * T.islandRadius * 0.85;
			const x = Math.cos(a) * d,
				z = Math.sin(a) * d;
			if (Math.hypot(x - 2, z - 4) < 8) continue;
			if (!okLand(x, z, 0.5) || !farFrom(x, z, 1.4) || courseDist(x, z) < 4) continue;
			const s = rand.range(0.6, 1.3);
			bushM.push(new THREE.Matrix4().compose(new THREE.Vector3(x, T.heightAt(x, z) - 0.15, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand.range(0, 6.28)), new THREE.Vector3(s, s * 0.85, s)));
			this.obstacles.push({ x, z, r: 0.75 * s, top: 1.2 * s, kind: 'bush' });
		}
		const bushes = new THREE.InstancedMesh(bushGeo, treeMat, bushM.length);
		bushM.forEach((m, i) => bushes.setMatrixAt(i, m));
		bushes.castShadow = true;
		bushes.receiveShadow = true;
		bushes.name = 'bushes';
		bushes.computeBoundingSphere();
		this.root.add(bushes);

		// ---- flowers ----
		const petals: THREE.BufferGeometry[] = [];
		const stem = new THREE.CylinderGeometry(0.008, 0.01, 0.22, 4, 1, true).translate(0, 0.11, 0).toNonIndexed();
		colorize(stem, () => new THREE.Color('#3f8f2a'));
		stem.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(stem.attributes.position.count).fill(0), 1));
		for (let i = 0; i < 5; i++) {
			const pg = new THREE.CircleGeometry(0.035, 6).scale(1, 1.6, 1).translate(0, 0.045, 0).rotateX(-Math.PI / 2 + 0.35).rotateY((i / 5) * Math.PI * 2).translate(0, 0.22, 0).toNonIndexed();
			colorize(pg, () => new THREE.Color(1, 1, 1));
			pg.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(pg.attributes.position.count).fill(1), 1));
			petals.push(pg);
		}
		const center = new THREE.SphereGeometry(0.025, 6, 4).translate(0, 0.23, 0).toNonIndexed();
		colorize(center, () => new THREE.Color('#ffd23f'));
		center.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(center.attributes.position.count).fill(2), 1));
		const flowerGeo = mergeGeometries([stem, ...petals, center]);
		sway(flowerGeo, (p) => p.y / 0.23);
		const flowerMat = toonMaterial(
			{ vertexColors: true, side: THREE.DoubleSide },
			{
				key: 'flower',
				contact: true,
				gloss: 0,
				edge: [-0.3, 0.3],
				flatUp: true,
				vertexPars: `${SWAY_PARS}\nattribute float aKind;\nvarying float vKind;`,
				vertexBody: `${SWAY_BODY}\nvKind = aKind;\n{ vec3 ip2 = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]); vec2 cuv = (ip2.xz - uContactCenter) / uContactSize + 0.5; float occ = texture2D(uContact, cuv).r; transformed.y *= 1.0 - clamp(occ * 1.4, 0.0, 0.8); }`,
				fragmentPars: 'varying float vKind;',
				fragmentBody: '#ifdef USE_INSTANCING_COLOR\n if (vKind < 0.5) diffuseColor.rgb = vec3(0.16, 0.45, 0.1); else if (vKind > 1.5) diffuseColor.rgb = vec3(1.0, 0.72, 0.12);\n#endif',
			},
		);
		const flowerCols = ['#ffffff', '#fff3a6', '#ff9ec7', '#c9a7ff', '#ff7a6b', '#9fd8ff', '#ffd166'].map((c) => new THREE.Color(c));
		const fl: Array<{ m: THREE.Matrix4; c: THREE.Color }> = [];
		for (let patch = 0; patch < 70; patch++) {
			const a = rand.range(0, Math.PI * 2);
			const d = Math.sqrt(rand.next()) * T.islandRadius * 0.85;
			const cx = Math.cos(a) * d,
				cz = Math.sin(a) * d;
			if (!okLand(cx, cz, 0.7)) continue;
			const col = flowerCols[Math.floor(rand.next() * flowerCols.length)];
			const n = 10 + Math.floor(rand.next() * 22);
			for (let i = 0; i < n; i++) {
				const x = cx + rand.range(-2.2, 2.2),
					z = cz + rand.range(-2.2, 2.2);
				if (!okLand(x, z, 0.7) || !farFrom(x, z, 0.2)) continue;
				const s = rand.range(0.8, 1.5);
				fl.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(x, T.heightAt(x, z) - 0.01, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand.range(0, 6.28)), new THREE.Vector3(s, s, s)), c: col });
			}
		}
		const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, fl.length);
		fl.forEach((f, i) => {
			flowers.setMatrixAt(i, f.m);
			flowers.setColorAt(i, f.c);
		});
		flowers.name = 'flowers';
		flowers.receiveShadow = true;
		flowers.computeBoundingSphere();
		this.root.add(flowers);
	}

	/** Highest rock surface under x,z (vertical ray against rock triangles), or -Infinity. */
	rockHeight(x: number, z: number, n?: THREE.Vector3): number {
		let best = -Infinity;
		for (const r of this.rocks) {
			if (Math.abs(x - r.x) > r.r || Math.abs(z - r.z) > r.r) continue;
			const t = r.tris;
			for (let i = 0; i < t.length; i += 9) {
				const ax = t[i],
					ay = t[i + 1],
					az = t[i + 2],
					bx = t[i + 3],
					by = t[i + 4],
					bz = t[i + 5],
					cx = t[i + 6],
					cy = t[i + 7],
					cz = t[i + 8];
				// barycentric in xz
				const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
				if (Math.abs(d) < 1e-9) continue;
				const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d;
				const l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d;
				const l3 = 1 - l1 - l2;
				if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
				const y = l1 * ay + l2 * by + l3 * cy;
				if (y > best) {
					// upward-facing triangles only
					const ux = bx - ax,
						uy = by - ay,
						uz = bz - az,
						vx = cx - ax,
						vy = cy - ay,
						vz = cz - az;
					let nx = uy * vz - uz * vy,
						ny = uz * vx - ux * vz,
						nz = ux * vy - uy * vx;
					if (ny < 0) {
						nx = -nx;
						ny = -ny;
						nz = -nz;
					}
					best = y;
					if (n) n.set(nx, ny, nz).normalize();
				}
			}
		}
		return best;
	}
}
