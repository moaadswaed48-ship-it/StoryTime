// Instanced CPU particles that run unchanged on both render paths: one InstancedMesh per system, per-instance
// colour (instanceColor) and alpha (`aAlpha`, read by the path's particle material). Billboards face the camera;
// `stretch` aligns a quad with its velocity (sparks, tracers). Debris are lit instanced boxes that bounce.
import * as THREE from 'three';
import { rng } from '../core/rng';
import type { RenderPath } from '../render/types';

export interface EmitOptions {
	count: number;
	at: THREE.Vector3;
	/** Main direction (normalised) and cone half-angle (radians). */
	dir?: THREE.Vector3;
	cone?: number;
	speed: [number, number];
	life: [number, number];
	size: [number, number];
	/** End size multiplier. */
	grow?: number;
	color: THREE.ColorRepresentation;
	colorEnd?: THREE.ColorRepresentation;
	/** HDR multiplier for additive glow (pushes into bloom). */
	intensity?: number;
	gravity?: number;
	drag?: number;
	/** Velocity stretch, 0 = round billboard. */
	stretch?: number;
	/** Spawn jitter radius. */
	jitter?: number;
	/** Fade in over this fraction of life (smoke). */
	fadeIn?: number;
	spin?: number;
	alpha?: number;
	/** Inherit some velocity (e.g. from the muzzle). */
	inherit?: THREE.Vector3;
}

export class ParticleSystem {
	readonly mesh: THREE.InstancedMesh;
	alive = 0;
	spawned = 0;
	private pos: Float32Array;
	private vel: Float32Array;
	private age: Float32Array;
	private life: Float32Array;
	private size: Float32Array;
	private grow: Float32Array;
	private c0: Float32Array;
	private c1: Float32Array;
	private params: Float32Array; // gravity, drag, stretch, fadeIn
	private rot: Float32Array;
	private spin: Float32Array;
	private a0: Float32Array;
	private alpha: THREE.InstancedBufferAttribute;
	private m = new THREE.Matrix4();
	private col = new THREE.Color();

	constructor(
		path: RenderPath,
		readonly max: number,
		blending: 'additive' | 'alpha',
		map: THREE.Texture,
		name: string,
	) {
		const geo = new THREE.PlaneGeometry(1, 1);
		this.alpha = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
		this.alpha.setUsage(THREE.DynamicDrawUsage);
		geo.setAttribute('aAlpha', this.alpha);
		this.mesh = new THREE.InstancedMesh(geo, path.particleMaterial({ map, blending }), max);
		this.mesh.name = name;
		this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
		this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
		this.mesh.frustumCulled = false;
		this.mesh.count = 0;
		this.mesh.renderOrder = blending === 'additive' ? 3 : 2;
		this.pos = new Float32Array(max * 3);
		this.vel = new Float32Array(max * 3);
		this.age = new Float32Array(max);
		this.life = new Float32Array(max);
		this.size = new Float32Array(max);
		this.grow = new Float32Array(max);
		this.c0 = new Float32Array(max * 3);
		this.c1 = new Float32Array(max * 3);
		this.params = new Float32Array(max * 4);
		this.rot = new Float32Array(max);
		this.spin = new Float32Array(max);
		this.a0 = new Float32Array(max);
	}

	emit(o: EmitOptions) {
		const c0 = new THREE.Color(o.color).multiplyScalar(o.intensity ?? 1);
		const c1 = new THREE.Color(o.colorEnd ?? o.color).multiplyScalar(o.intensity ?? 1);
		const dir = o.dir ?? new THREE.Vector3(0, 1, 0);
		const cone = o.cone ?? Math.PI;
		const tmp = new THREE.Vector3();
		const basis = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
		for (let n = 0; n < o.count; n++) {
			let i = this.alive;
			if (i >= this.max) i = rng.int(0, this.max - 1); // recycle a random one when full
			else this.alive++;
			this.spawned++;
			// random direction inside the cone around +Y, rotated onto dir
			const cosT = 1 - rng.next() * (1 - Math.cos(cone));
			const sinT = Math.sqrt(1 - cosT * cosT);
			const phi = rng.next() * Math.PI * 2;
			tmp.set(Math.cos(phi) * sinT, cosT, Math.sin(phi) * sinT).applyQuaternion(basis);
			const sp = rng.range(o.speed[0], o.speed[1]);
			const j = o.jitter ?? 0;
			this.pos[i * 3] = o.at.x + rng.spread(j);
			this.pos[i * 3 + 1] = o.at.y + rng.spread(j);
			this.pos[i * 3 + 2] = o.at.z + rng.spread(j);
			this.vel[i * 3] = tmp.x * sp + (o.inherit?.x ?? 0);
			this.vel[i * 3 + 1] = tmp.y * sp + (o.inherit?.y ?? 0);
			this.vel[i * 3 + 2] = tmp.z * sp + (o.inherit?.z ?? 0);
			this.age[i] = 0;
			this.life[i] = rng.range(o.life[0], o.life[1]);
			this.size[i] = rng.range(o.size[0], o.size[1]);
			this.grow[i] = o.grow ?? 1;
			this.c0.set([c0.r, c0.g, c0.b], i * 3);
			this.c1.set([c1.r, c1.g, c1.b], i * 3);
			this.params.set([o.gravity ?? 0, o.drag ?? 0, o.stretch ?? 0, o.fadeIn ?? 0], i * 4);
			this.rot[i] = rng.next() * Math.PI * 2;
			this.spin[i] = rng.spread(o.spin ?? 0);
			this.a0[i] = o.alpha ?? 1;
		}
	}

	private swap(a: number, b: number) {
		const s3 = (arr: Float32Array, k: number) => {
			for (let q = 0; q < k; q++) arr[a * k + q] = arr[b * k + q];
		};
		s3(this.pos, 3);
		s3(this.vel, 3);
		s3(this.c0, 3);
		s3(this.c1, 3);
		s3(this.params, 4);
		this.age[a] = this.age[b];
		this.life[a] = this.life[b];
		this.size[a] = this.size[b];
		this.grow[a] = this.grow[b];
		this.rot[a] = this.rot[b];
		this.spin[a] = this.spin[b];
		this.a0[a] = this.a0[b];
	}

	private x = new THREE.Vector3();
	private y = new THREE.Vector3();
	private z = new THREE.Vector3();
	private v = new THREE.Vector3();
	private toCam = new THREE.Vector3();

	update(dt: number, camera: THREE.Camera) {
		const camQ = camera.quaternion;
		const camPos = camera.getWorldPosition(this.toCam.set(0, 0, 0)).clone();
		const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camQ);
		const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camQ);
		const camFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(camQ);
		let i = 0;
		while (i < this.alive) {
			this.age[i] += dt;
			if (this.age[i] >= this.life[i]) {
				this.alive--;
				if (i !== this.alive) this.swap(i, this.alive);
				continue;
			}
			const g = this.params[i * 4],
				drag = this.params[i * 4 + 1],
				stretch = this.params[i * 4 + 2],
				fadeIn = this.params[i * 4 + 3];
			const k = Math.exp(-drag * dt);
			this.vel[i * 3] *= k;
			this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * k - g * dt;
			this.vel[i * 3 + 2] *= k;
			this.pos[i * 3] += this.vel[i * 3] * dt;
			this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
			this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
			if (this.pos[i * 3 + 1] < 0.02 && this.vel[i * 3 + 1] < 0) {
				// cheap ground bounce at y=0 (sparks skitter)
				this.pos[i * 3 + 1] = 0.02;
				this.vel[i * 3 + 1] *= -0.35;
				this.vel[i * 3] *= 0.6;
				this.vel[i * 3 + 2] *= 0.6;
			}
			const t = this.age[i] / this.life[i];
			const s = this.size[i] * (1 + (this.grow[i] - 1) * t);
			this.rot[i] += this.spin[i] * dt;
			const p = this.v.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
			if (stretch > 0) {
				// x along velocity, y perpendicular in the view plane
				this.x.set(this.vel[i * 3], this.vel[i * 3 + 1], this.vel[i * 3 + 2]);
				const speed = this.x.length();
				if (speed > 1e-4) this.x.divideScalar(speed);
				else this.x.copy(camRight);
				this.z.subVectors(camPos, p).normalize();
				this.y.crossVectors(this.z, this.x).normalize();
				this.z.crossVectors(this.x, this.y);
				const len = s * (1 + stretch * speed);
				this.m.set(this.x.x * len, this.y.x * s, this.z.x, p.x, this.x.y * len, this.y.y * s, this.z.y, p.y, this.x.z * len, this.y.z * s, this.z.z, p.z, 0, 0, 0, 1);
			} else {
				const c = Math.cos(this.rot[i]) * s,
					sn = Math.sin(this.rot[i]) * s;
				this.x.copy(camRight).multiplyScalar(c).addScaledVector(camUp, sn);
				this.y.copy(camUp).multiplyScalar(c).addScaledVector(camRight, -sn);
				this.m.set(this.x.x, this.y.x, camFwd.x, p.x, this.x.y, this.y.y, camFwd.y, p.y, this.x.z, this.y.z, camFwd.z, p.z, 0, 0, 0, 1);
			}
			this.mesh.setMatrixAt(i, this.m);
			this.col.setRGB(
				this.c0[i * 3] + (this.c1[i * 3] - this.c0[i * 3]) * t,
				this.c0[i * 3 + 1] + (this.c1[i * 3 + 1] - this.c0[i * 3 + 1]) * t,
				this.c0[i * 3 + 2] + (this.c1[i * 3 + 2] - this.c0[i * 3 + 2]) * t,
			);
			this.mesh.setColorAt(i, this.col);
			const fin = fadeIn > 0 ? Math.min(1, t / fadeIn) : 1;
			this.alpha.array[i] = this.a0[i] * fin * (1 - t) * (1 - t);
			i++;
		}
		this.mesh.count = this.alive;
		this.mesh.instanceMatrix.needsUpdate = true;
		if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
		this.alpha.needsUpdate = true;
	}
}

/** Lit debris chunks: instanced boxes with gravity, ground bounce and spin. They stay a while (permanence). */
export class Debris {
	readonly mesh: THREE.InstancedMesh;
	alive = 0;
	private pos: Float32Array;
	private vel: Float32Array;
	private ang: Float32Array;
	private q: Float32Array;
	private age: Float32Array;
	private life: Float32Array;
	private size: Float32Array;
	private m = new THREE.Matrix4();
	private qq = new THREE.Quaternion();
	private dq = new THREE.Quaternion();
	private e = new THREE.Euler();
	private s = new THREE.Vector3();
	private p = new THREE.Vector3();

	constructor(
		readonly max = 256,
		color: THREE.ColorRepresentation = '#d9cbb5',
	) {
		const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
		this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, max);
		this.mesh.name = 'debris';
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		this.mesh.frustumCulled = false;
		this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3);
		this.mesh.count = 0;
		this.pos = new Float32Array(max * 3);
		this.vel = new Float32Array(max * 3);
		this.ang = new Float32Array(max * 3);
		this.q = new Float32Array(max * 4);
		this.age = new Float32Array(max);
		this.life = new Float32Array(max);
		this.size = new Float32Array(max);
	}

	emit(count: number, at: THREE.Vector3, normal: THREE.Vector3, color: THREE.ColorRepresentation, speed = 3, size = 0.05) {
		const c = new THREE.Color(color);
		for (let n = 0; n < count; n++) {
			let i = this.alive;
			if (i >= this.max) i = rng.int(0, this.max - 1);
			else this.alive++;
			const d = new THREE.Vector3(rng.spread(1), rng.spread(1), rng.spread(1)).normalize().add(normal).normalize();
			const sp = speed * rng.range(0.4, 1);
			this.pos.set([at.x, at.y, at.z], i * 3);
			this.vel.set([d.x * sp, d.y * sp + 1.5, d.z * sp], i * 3);
			this.ang.set([rng.spread(15), rng.spread(15), rng.spread(15)], i * 3);
			this.q.set([0, 0, 0, 1], i * 4);
			this.age[i] = 0;
			this.life[i] = rng.range(5, 8);
			this.size[i] = size * rng.range(0.5, 1.4);
			this.mesh.setColorAt(i, c.clone().multiplyScalar(rng.range(0.75, 1.1)));
		}
		if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
	}

	update(dt: number) {
		let i = 0;
		while (i < this.alive) {
			this.age[i] += dt;
			if (this.age[i] >= this.life[i]) {
				this.alive--;
				if (i !== this.alive) {
					const a = i,
						b = this.alive;
					for (let k = 0; k < 3; k++) {
						this.pos[a * 3 + k] = this.pos[b * 3 + k];
						this.vel[a * 3 + k] = this.vel[b * 3 + k];
						this.ang[a * 3 + k] = this.ang[b * 3 + k];
					}
					for (let k = 0; k < 4; k++) this.q[a * 4 + k] = this.q[b * 4 + k];
					this.age[a] = this.age[b];
					this.life[a] = this.life[b];
					this.size[a] = this.size[b];
					const c = new THREE.Color();
					this.mesh.getColorAt(b, c);
					this.mesh.setColorAt(a, c);
				}
				continue;
			}
			const i3 = i * 3;
			this.vel[i3 + 1] -= 18 * dt;
			this.pos[i3] += this.vel[i3] * dt;
			this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
			this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
			const half = this.size[i] * 0.5;
			if (this.pos[i3 + 1] < half) {
				this.pos[i3 + 1] = half;
				this.vel[i3 + 1] *= -0.3;
				this.vel[i3] *= 0.55;
				this.vel[i3 + 2] *= 0.55;
				this.ang[i3] *= 0.5;
				this.ang[i3 + 1] *= 0.5;
				this.ang[i3 + 2] *= 0.5;
			}
			this.e.set(this.ang[i3] * dt, this.ang[i3 + 1] * dt, this.ang[i3 + 2] * dt);
			this.dq.setFromEuler(this.e);
			this.qq.fromArray(this.q, i * 4).multiply(this.dq).toArray(this.q, i * 4);
			const fade = Math.min(1, (this.life[i] - this.age[i]) / 0.6);
			this.s.setScalar(this.size[i] * fade);
			this.m.compose(this.p.fromArray(this.pos, i3), this.qq, this.s);
			this.mesh.setMatrixAt(i, this.m);
			i++;
		}
		this.mesh.count = this.alive;
		this.mesh.instanceMatrix.needsUpdate = true;
		if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
	}
}

/** The game's effects library: call these from gameplay events. */
export class VFX {
	readonly sparks: ParticleSystem;
	readonly glow: ParticleSystem;
	readonly smoke: ParticleSystem;
	readonly dust: ParticleSystem;
	readonly debris: Debris;
	readonly root = new THREE.Group();

	constructor(path: RenderPath) {
		const soft = radialTexture(64, 2.2);
		const hard = radialTexture(32, 0.8);
		this.sparks = new ParticleSystem(path, 1024, 'additive', hard, 'sparks');
		this.glow = new ParticleSystem(path, 128, 'additive', soft, 'glow');
		this.smoke = new ParticleSystem(path, 384, 'alpha', soft, 'smoke');
		this.dust = new ParticleSystem(path, 384, 'alpha', soft, 'dust');
		this.debris = new Debris(256);
		this.root.add(this.smoke.mesh, this.dust.mesh, this.sparks.mesh, this.glow.mesh, this.debris.mesh);
		this.root.name = 'vfx';
	}

	get alive() {
		return this.sparks.alive + this.glow.alive + this.smoke.alive + this.dust.alive + this.debris.alive;
	}
	get spawned() {
		return this.sparks.spawned + this.glow.spawned + this.smoke.spawned + this.dust.spawned;
	}

	muzzle(at: THREE.Vector3, dir: THREE.Vector3) {
		this.sparks.emit({ count: 5, at, dir, cone: 0.35, speed: [6, 14], life: [0.05, 0.12], size: [0.012, 0.022], stretch: 0.05, color: '#ffd59a', intensity: 6, drag: 4 });
		this.smoke.emit({ count: 2, at, dir, cone: 0.5, speed: [0.4, 1.2], life: [0.5, 0.9], size: [0.06, 0.1], grow: 4, color: '#d8d2c8', alpha: 0.18, drag: 3, gravity: -0.4, fadeIn: 0.1, spin: 1 });
	}

	/** Bullet hitting a surface. */
	impact(at: THREE.Vector3, normal: THREE.Vector3, surface: THREE.ColorRepresentation = '#cfc3b0') {
		this.sparks.emit({ count: 14, at, dir: normal, cone: 1.0, speed: [3, 9], life: [0.15, 0.4], size: [0.012, 0.025], stretch: 0.045, color: '#ffe0a8', colorEnd: '#ff7a2a', intensity: 5, gravity: 9, drag: 1.5 });
		this.glow.emit({ count: 1, at, speed: [0, 0], life: [0.06, 0.08], size: [0.35, 0.45], color: '#ffb36b', intensity: 3, alpha: 0.9 });
		this.dust.emit({ count: 5, at, dir: normal, cone: 0.8, speed: [0.5, 1.8], life: [0.6, 1.2], size: [0.08, 0.16], grow: 3, color: surface, alpha: 0.5, drag: 3.5, gravity: 0.6, fadeIn: 0.05, spin: 1.5 });
		this.debris.emit(3, at.clone().addScaledVector(normal, 0.03), normal, surface, 2.5, 0.035);
	}

	/** Hitting a creature/target: brighter, more sparks, no dust. */
	hitSparks(at: THREE.Vector3, normal: THREE.Vector3, color: THREE.ColorRepresentation = '#ffcf7a', big = false) {
		this.sparks.emit({ count: big ? 60 : 22, at, dir: normal, cone: big ? Math.PI : 1.2, speed: [3, big ? 14 : 10], life: [0.15, 0.5], size: [0.015, 0.03], stretch: 0.05, color, colorEnd: '#ff5a2a', intensity: 7, gravity: 8, drag: 1.2 });
		this.glow.emit({ count: 1, at, speed: [0, 0], life: [0.07, 0.1], size: [big ? 1.6 : 0.6, big ? 2 : 0.7], color, intensity: 4, alpha: 1 });
		if (big) this.smoke.emit({ count: 14, at, cone: Math.PI, speed: [0.5, 2.5], life: [0.8, 1.6], size: [0.25, 0.4], grow: 3, color: '#cbbfae', alpha: 0.35, drag: 2.5, gravity: -0.5, fadeIn: 0.1, spin: 1 });
	}

	/** Dust puff where feet land. */
	land(at: THREE.Vector3, strength: number) {
		const n = Math.round(4 + strength * 10);
		this.dust.emit({ count: n, at, cone: 1.45, dir: new THREE.Vector3(0, 1, 0), speed: [0.8, 1.6 + strength * 2], life: [0.5, 0.9], size: [0.12, 0.22], grow: 2.5, color: '#d6c7ad', alpha: 0.45, drag: 4, gravity: 0.3, jitter: 0.25, spin: 1 });
	}

	explosion(at: THREE.Vector3) {
		this.glow.emit({ count: 2, at, speed: [0, 0.2], life: [0.1, 0.16], size: [3, 4], color: '#ffd08a', intensity: 5 });
		this.sparks.emit({ count: 120, at, cone: Math.PI, speed: [5, 18], life: [0.3, 0.9], size: [0.02, 0.04], stretch: 0.05, color: '#ffe0a8', colorEnd: '#ff5a2a', intensity: 6, gravity: 9, drag: 1 });
		this.smoke.emit({ count: 40, at, cone: Math.PI, speed: [1, 4], life: [1.5, 3], size: [0.5, 0.9], grow: 3, color: '#8f8579', alpha: 0.5, drag: 1.8, gravity: -0.8, fadeIn: 0.08, spin: 0.8, jitter: 0.3 });
		this.debris.emit(30, at, new THREE.Vector3(0, 1, 0), '#9c8f7e', 8, 0.08);
	}

	update(dt: number, camera: THREE.Camera) {
		this.sparks.update(dt, camera);
		this.glow.update(dt, camera);
		this.smoke.update(dt, camera);
		this.dust.update(dt, camera);
		this.debris.update(dt);
	}
}

export function radialTexture(size = 64, power = 2): THREE.DataTexture {
	const data = new Uint8Array(size * size * 4);
	for (let y = 0; y < size; y++)
		for (let x = 0; x < size; x++) {
			const dx = (x + 0.5) / size - 0.5,
				dy = (y + 0.5) / size - 0.5;
			const r = Math.min(1, Math.hypot(dx, dy) * 2);
			const a = Math.pow(1 - r, power);
			const i = (y * size + x) * 4;
			data[i] = data[i + 1] = data[i + 2] = 255;
			data[i + 3] = Math.round(a * 255);
		}
	const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
	t.needsUpdate = true;
	t.magFilter = THREE.LinearFilter;
	t.minFilter = THREE.LinearFilter;
	t.colorSpace = THREE.NoColorSpace;
	return t;
}

