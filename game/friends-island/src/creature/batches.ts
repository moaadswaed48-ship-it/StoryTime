// Shared per-frame geometry for every creature: one dynamic tube mesh (legs, arms, tails, antennae, eye stalks)
// and instanced blobs (feet, hands, tail tips, eye whites, pupils, lids). A few draw calls for the whole herd.
import * as THREE from 'three';
import { CREATURE_FINISH, toonMaterial } from '../look/materials';

const SIDES = 9;

/** Tubes along smooth curves with per-point radius and colour, rebuilt each frame (parallel-transport frames). */
export class TubeBatch {
	readonly mesh: THREE.Mesh;
	private pos: Float32Array;
	private nor: Float32Array;
	private col: Float32Array;
	private idx: Uint32Array;
	private v = 0;
	private i = 0;
	private geo: THREE.BufferGeometry;
	private maxV: number;
	private maxI: number;
	private t = new THREE.Vector3();
	private n = new THREE.Vector3();
	private b = new THREE.Vector3();
	private tmp = new THREE.Vector3();

	constructor(maxVerts = 200000) {
		this.maxV = maxVerts;
		this.maxI = maxVerts * 6;
		this.pos = new Float32Array(maxVerts * 3);
		this.nor = new Float32Array(maxVerts * 3);
		this.col = new Float32Array(maxVerts * 3);
		this.idx = new Uint32Array(this.maxI);
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
		g.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage));
		g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
		g.setIndex(new THREE.BufferAttribute(this.idx, 1).setUsage(THREE.DynamicDrawUsage));
		g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
		this.geo = g;
		const mat = toonMaterial({ vertexColors: true }, { key: 'tube', ...CREATURE_FINISH });
		this.mesh = new THREE.Mesh(g, mat);
		this.mesh.frustumCulled = false;
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		this.mesh.name = 'tubes';
	}

	begin() {
		this.v = 0;
		this.i = 0;
	}

	/**
	 * pts: centreline (>= 2 points), r: radius per point, c: colour per point (linear RGB).
	 * capEnd closes the last ring with a rounded point.
	 */
	tube(pts: THREE.Vector3[], r: number[], c: Array<[number, number, number]>, capEnd = true) {
		const n = pts.length;
		if (n < 2) return;
		const ringCount = n + (capEnd ? 2 : 0);
		if (this.v + ringCount * SIDES + 1 > this.maxV || this.i + ringCount * SIDES * 6 > this.maxI) return;
		const T = this.t,
			Nn = this.n,
			B = this.b;
		// initial frame
		T.subVectors(pts[1], pts[0]).normalize();
		Nn.set(0, 1, 0);
		if (Math.abs(T.y) > 0.9) Nn.set(1, 0, 0);
		B.crossVectors(T, Nn).normalize();
		Nn.crossVectors(B, T).normalize();
		const v0 = this.v;
		const writeRing = (p: THREE.Vector3, rad: number, col: [number, number, number], tangent: THREE.Vector3, shrinkNormal = 0) => {
			for (let s = 0; s < SIDES; s++) {
				const a = (s / SIDES) * Math.PI * 2;
				const ca = Math.cos(a),
					sa = Math.sin(a);
				const nx = Nn.x * ca + B.x * sa,
					ny = Nn.y * ca + B.y * sa,
					nz = Nn.z * ca + B.z * sa;
				const k = this.v * 3;
				this.pos[k] = p.x + nx * rad;
				this.pos[k + 1] = p.y + ny * rad;
				this.pos[k + 2] = p.z + nz * rad;
				// tilt the normal toward the tangent at the cap so it shades round
				const nnx = nx * (1 - shrinkNormal) + tangent.x * shrinkNormal,
					nny = ny * (1 - shrinkNormal) + tangent.y * shrinkNormal,
					nnz = nz * (1 - shrinkNormal) + tangent.z * shrinkNormal;
				const l = Math.hypot(nnx, nny, nnz) || 1;
				this.nor[k] = nnx / l;
				this.nor[k + 1] = nny / l;
				this.nor[k + 2] = nnz / l;
				this.col[k] = col[0];
				this.col[k + 1] = col[1];
				this.col[k + 2] = col[2];
				this.v++;
			}
		};
		for (let j = 0; j < n; j++) {
			if (j > 0) {
				// parallel transport: rotate the frame by the change in tangent
				const prevT = this.tmp.copy(T);
				if (j < n - 1) T.subVectors(pts[j + 1], pts[j - 1]).normalize();
				else T.subVectors(pts[j], pts[j - 1]).normalize();
				const axis = prevT.cross(T);
				const sinA = axis.length();
				if (sinA > 1e-5) {
					axis.divideScalar(sinA);
					const ang = Math.asin(Math.min(1, sinA));
					Nn.applyAxisAngle(axis, ang);
					B.applyAxisAngle(axis, ang);
				}
			}
			writeRing(pts[j], r[j], c[j], T);
		}
		if (capEnd) {
			const last = pts[n - 1];
			const rr = r[n - 1];
			const p1 = this.tmp.copy(last).addScaledVector(T, rr * 0.55);
			writeRing(p1.clone(), rr * 0.82, c[n - 1], T, 0.55);
			const p2 = last.clone().addScaledVector(T, rr * 0.92);
			writeRing(p2, rr * 0.38, c[n - 1], T, 0.85);
		}
		for (let j = 0; j < ringCount - 1; j++) {
			for (let s = 0; s < SIDES; s++) {
				const a = v0 + j * SIDES + s;
				const b = v0 + j * SIDES + ((s + 1) % SIDES);
				const c2 = a + SIDES;
				const d = b + SIDES;
				this.idx[this.i++] = a;
				this.idx[this.i++] = c2;
				this.idx[this.i++] = b;
				this.idx[this.i++] = b;
				this.idx[this.i++] = c2;
				this.idx[this.i++] = d;
			}
		}
		if (capEnd) {
			// tip vertex
			const k = this.v * 3;
			const last = pts[n - 1];
			const tip = last.clone().addScaledVector(T, r[n - 1] * 1.0);
			this.pos[k] = tip.x;
			this.pos[k + 1] = tip.y;
			this.pos[k + 2] = tip.z;
			this.nor[k] = T.x;
			this.nor[k + 1] = T.y;
			this.nor[k + 2] = T.z;
			const cc = c[n - 1];
			this.col[k] = cc[0];
			this.col[k + 1] = cc[1];
			this.col[k + 2] = cc[2];
			const tipI = this.v++;
			const lastRing = v0 + (ringCount - 1) * SIDES;
			for (let s = 0; s < SIDES; s++) {
				this.idx[this.i++] = lastRing + s;
				this.idx[this.i++] = tipI;
				this.idx[this.i++] = lastRing + ((s + 1) % SIDES);
			}
		}
	}

	end() {
		const g = this.geo;
		g.setDrawRange(0, this.i);
		for (const name of ['position', 'normal', 'color'] as const) {
			const a = g.getAttribute(name) as THREE.BufferAttribute;
			a.clearUpdateRanges();
			a.addUpdateRange(0, this.v * 3);
			a.needsUpdate = true;
		}
		const ix = g.getIndex()!;
		ix.clearUpdateRanges();
		ix.addUpdateRange(0, this.i);
		ix.needsUpdate = true;
	}

	get vertexCount() {
		return this.v;
	}
}

/** Instanced spheres/ellipsoids with per-instance colour, refilled each frame. */
export class BlobBatch {
	readonly mesh: THREE.InstancedMesh;
	private n = 0;
	private m = new THREE.Matrix4();
	private c = new THREE.Color();
	constructor(name: string, geo: THREE.BufferGeometry, mat: THREE.Material, readonly max: number, shadow = true) {
		this.mesh = new THREE.InstancedMesh(geo, mat, max);
		this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		this.mesh.setColorAt(0, new THREE.Color(1, 1, 1));
		this.mesh.instanceColor!.setUsage(THREE.DynamicDrawUsage);
		this.mesh.frustumCulled = false;
		this.mesh.castShadow = shadow;
		this.mesh.receiveShadow = true;
		this.mesh.name = name;
		this.mesh.count = 0;
	}
	begin() {
		this.n = 0;
	}
	/** position, quaternion, scale (x,y,z), colour */
	add(p: THREE.Vector3, q: THREE.Quaternion, s: THREE.Vector3, col: [number, number, number]) {
		if (this.n >= this.max) return;
		this.m.compose(p, q, s);
		this.mesh.setMatrixAt(this.n, this.m);
		this.c.setRGB(col[0], col[1], col[2]);
		this.mesh.setColorAt(this.n, this.c);
		this.n++;
	}
	end() {
		this.mesh.count = this.n;
		this.mesh.instanceMatrix.clearUpdateRanges();
		this.mesh.instanceMatrix.addUpdateRange(0, this.n * 16);
		this.mesh.instanceMatrix.needsUpdate = true;
		if (this.mesh.instanceColor) {
			this.mesh.instanceColor.clearUpdateRanges();
			this.mesh.instanceColor.addUpdateRange(0, this.n * 3);
			this.mesh.instanceColor.needsUpdate = true;
		}
	}
	get count() {
		return this.n;
	}
}

export class Batches {
	readonly tubes = new TubeBatch();
	readonly blobs: BlobBatch;
	readonly eyeWhites: BlobBatch;
	readonly pupils: BlobBatch;
	readonly lids: BlobBatch;
	readonly irises: BlobBatch;
	readonly glints: BlobBatch;
	readonly mouths: BlobBatch;
	readonly root = new THREE.Group();
	constructor() {
		const sphere = new THREE.SphereGeometry(1, 20, 14);
		const blobMat = toonMaterial({ vertexColors: false }, { key: 'blob', ...CREATURE_FINISH });
		this.blobs = new BlobBatch('blobs', sphere, blobMat, 4000);
		// clean matte-satin whites, flat dark pupils, and a single crisp catchlight (unlit) per eye
		const eyeMat = toonMaterial({}, { key: 'eye', gloss: 0.35, rim: 0.08, sss: 0.0, edge: [-0.75, 0.25], satin: true });
		this.eyeWhites = new BlobBatch('eyes', new THREE.SphereGeometry(1, 24, 16), eyeMat, 2000, false);
		const pupilMat = toonMaterial({}, { key: 'pupil', gloss: 0, rim: 0.0, edge: [-0.6, 0.2] });
		this.pupils = new BlobBatch('pupils', new THREE.SphereGeometry(1, 16, 10), pupilMat, 2000, false);
		// lids: a hemisphere (open = rotated back into the head; closing = rotating over the eye)
		const lidGeo = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
		lidGeo.rotateX(Math.PI / 2); // dome faces +Z... rotated so the cap is the -Y..+Y front half
		const lidMat = toonMaterial({ side: THREE.DoubleSide }, { key: 'lid', ...CREATURE_FINISH });
		this.lids = new BlobBatch('lids', lidGeo, lidMat, 2000, false);
		const irisMat = toonMaterial({}, { key: 'iris', gloss: 0.2, rim: 0.0, edge: [-0.6, 0.3], satin: true });
		this.irises = new BlobBatch('irises', new THREE.SphereGeometry(1, 20, 12), irisMat, 2000, false);
		// one tidy catchlight per eye: unlit, so it stays a crisp white dot in any light
		const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
		this.glints = new BlobBatch('glints', new THREE.SphereGeometry(1, 10, 6), glintMat, 2000, false);
		// mouth interiors: deep, matte, never shiny (a crisp dark shape with no murky reflections)
		// flat (unlit), so the overlapping pieces of a grin read as one clean dark shape
		const mouthMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
		this.mouths = new BlobBatch('mouths', new THREE.SphereGeometry(1, 24, 14), mouthMat, 3000, false);
		this.root.add(this.tubes.mesh, this.blobs.mesh, this.eyeWhites.mesh, this.irises.mesh, this.pupils.mesh, this.glints.mesh, this.lids.mesh, this.mouths.mesh);
	}
	begin() {
		this.tubes.begin();
		this.blobs.begin();
		this.eyeWhites.begin();
		this.pupils.begin();
		this.lids.begin();
		this.irises.begin();
		this.glints.begin();
		this.mouths.begin();
	}
	end() {
		this.tubes.end();
		this.blobs.end();
		this.eyeWhites.end();
		this.pupils.end();
		this.lids.end();
		this.irises.end();
		this.glints.end();
		this.mouths.end();
	}
}
