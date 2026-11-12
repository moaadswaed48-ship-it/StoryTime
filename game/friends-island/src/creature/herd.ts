// The herd: spawning (egg -> hatch), brains (wander, idle, follow, flock, flee, play, come when called),
// separation, drawing into the shared batches, contact blobs, and the animation-quality metrics.
import * as THREE from 'three';
import type { World } from '../world/world';
import type { Batches } from './batches';
import { buildPlan, type Plan } from './build';
import { Creature } from './creature';
import { encode, type Genes, kinship } from './genome';
import { type MeshPool, toGeometry } from './mesh-pool';
import { meshPlan } from './mesher';

type Behaviour = 'idle' | 'wander' | 'follow' | 'flee' | 'play' | 'called' | 'flock' | 'driven' | 'scripted';

export interface Brain {
	state: Behaviour;
	timer: number;
	target: THREE.Vector3;
	other: Creature | null;
	speedMul: number;
	idleKind: 'look' | 'sniff' | 'sit';
}

export interface Metrics {
	frames: number;
	stanceFrames: number;
	slideMax: number;
	slideSum: number;
	penetrationMax: number;
	kneeBelow: number;
	bodyBelow: number;
	overExtFrames: number;
	legFrames: number;
	emergencySteps: number;
	earlySteps: number;
	steps: number;
	pops: number;
	popMax: number;
	jitterP99: number;
	jitterSamples: number[];
	floatMax: number;
	floatWhat: string;
	popAt?: string;
	airborneFootMax: number;
	distance: number;
}

const newMetrics = (): Metrics => ({ frames: 0, stanceFrames: 0, slideMax: 0, slideSum: 0, penetrationMax: 0, kneeBelow: 0, bodyBelow: 0, overExtFrames: 0, legFrames: 0, emergencySteps: 0, earlySteps: 0, steps: 0, pops: 0, popMax: 0, jitterP99: 0, jitterSamples: [], floatMax: 0, floatWhat: '', airborneFootMax: 0, distance: 0 });

export interface Entry {
	c: Creature;
	brain: Brain;
	egg: number;
	eggPos: THREE.Vector3;
	born: number;
	metrics: Metrics;
	prevKnees: THREE.Vector3[][];
	anchors: Array<{ what: string; vert: number; bone: number; local: THREE.Vector3; rest: number; key: readonly number[] }>;
	parentIds: number[];
	discovered: boolean;
}

export class Herd {
	readonly entries: Entry[] = [];
	readonly root = new THREE.Group();
	material: THREE.Material;
	driven: Creature | null = null;
	callPoint: THREE.Vector3 | null = null;
	callTimer = 0;
	measuring = false;
	/** measure just this one (the player in Play) */
	measureOnly: Entry | null = null;
	onHatch: ((e: Entry) => void) | null = null;
	onEvent: ((type: string, e: Entry, at: THREE.Vector3) => void) | null = null;
	private rand: () => number;
	private tmp = new THREE.Vector3();
	private tmp2 = new THREE.Vector3();

	constructor(
		readonly world: World,
		readonly pool: MeshPool,
		readonly batches: Batches,
		material: THREE.Material,
		seed = 1,
	) {
		this.material = material;
		let s = seed >>> 0;
		this.rand = () => {
			s = (s + 0x6d2b79f5) >>> 0;
			let t = s;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	get creatures() {
		return this.entries.map((e) => e.c);
	}

	/** Lay an egg at x,z; the creature hatches when its mesh is ready and the egg has wobbled. */
	spawn(input: Genes | Plan, x: number, z: number, opts: { yaw?: number; instant?: boolean; parents?: number[] } = {}): Entry {
		const plan = 'parts' in input ? (input as Plan) : buildPlan(input as Genes);
		const yaw = opts.yaw ?? this.rand() * Math.PI * 2;
		const c = new Creature(plan, this.world, x, z, yaw);
		c.scaleIn = opts.instant ? 1 : 0;
		const e: Entry = {
			c,
			brain: { state: 'idle', timer: 0.5 + this.rand() * 2, target: new THREE.Vector3(x, 0, z), other: null, speedMul: 1, idleKind: 'look' },
			egg: opts.instant ? 0 : 1.6,
			eggPos: new THREE.Vector3(x, this.world.ground(x, z), z),
			born: performance.now(),
			metrics: newMetrics(),
			prevKnees: plan.legs.map(() => [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3())),
			anchors: [],
			parentIds: opts.parents ?? [],
			discovered: false,
		};
		this.entries.push(e);
		this.pool
			.geometry(plan.code)
			.then((g) => {
				if (!this.entries.includes(e)) return;
				c.setMesh(g, this.matFor());
				this.root.add(c.mesh!);
				this.buildAnchors(e, g);
			})
			.catch((err) => {
				// the worker failed (or workers are blocked): mesh on the main thread so the creature is never bodiless
				console.warn('worker mesh failed, meshing on the main thread', err);
				if (!this.entries.includes(e)) return;
				const g = toGeometry(meshPlan(plan));
				c.setMesh(g, this.matFor());
				this.root.add(c.mesh!);
				this.buildAnchors(e, g);
			});
		return e;
	}

	/** each creature gets its own copy of the body material (same shader program) so it can flash when hit */
	ownMaterials = false;
	private matFor(): THREE.Material {
		if (!this.ownMaterials) return this.material;
		const src = this.material as THREE.MeshLambertMaterial;
		const m = src.clone();
		m.onBeforeCompile = src.onBeforeCompile;
		m.customProgramCacheKey = src.customProgramCacheKey;
		m.userData.own = true;
		return m;
	}

	remove(c: Creature) {
		const i = this.entries.findIndex((e) => e.c === c);
		if (i < 0) return;
		const e = this.entries[i];
		if (e.c.mesh) {
			this.root.remove(e.c.mesh);
			const m = e.c.mesh.material as THREE.Material;
			if (m.userData.own) m.dispose();
		}
		this.entries.splice(i, 1);
		if (this.driven === c) this.driven = null;
	}

	clear() {
		for (const e of [...this.entries]) this.remove(e.c);
	}

	entryOf(c: Creature) {
		return this.entries.find((e) => e.c === c);
	}

	// ------------------------------------------------------------------ update

	update(dt: number, focus: THREE.Vector3, camPos: THREE.Vector3) {
		if (this.callTimer > 0) {
			this.callTimer -= dt;
			if (this.callTimer <= 0) this.callPoint = null;
		}
		for (const e of this.entries) {
			const c = e.c;
			// egg and hatching
			if (e.egg > 0) {
				e.egg -= dt;
				const ready = !!c.mesh;
				if (e.egg <= 0 && !ready) e.egg = 0.05;
				if (e.egg <= 0) {
					e.egg = 0;
					c.scaleIn = 0.001;
					this.onEvent?.('hatch', e, e.eggPos);
					this.onHatch?.(e);
				}
				continue;
			}
			if (c.scaleIn < 1) {
				// springy pop-in with a little overshoot
				const t = Math.min(1, c.scaleIn + dt * 2.2);
				c.scaleIn = t >= 1 ? 1 : t;
			}
			if (e.brain.state !== 'scripted') this.think(e, dt, camPos);
		}
		this.separate(dt);
		for (const e of this.entries) {
			if (e.egg > 0) continue;
			const c = e.c;
			const sIn = c.scaleIn;
			// ease-out-back on the visible scale
			const k = sIn >= 1 ? 1 : easeOutBack(sIn);
			c.scaleIn = k;
			c.update(dt);
			c.scaleIn = sIn;
			if (this.measuring && (!this.measureOnly || this.measureOnly === e)) this.measure(e, dt);
		}
		void focus;
	}

	// ------------------------------------------------------------------ brains

	private think(e: Entry, dt: number, camPos: THREE.Vector3) {
		const c = e.c;
		const b = e.brain;
		const P = c.plan;
		const pers = P.personality;
		b.timer -= dt;
		if (c === this.driven) {
			b.state = 'driven';
			c.lookTarget = null;
			return;
		}
		if (b.state === 'driven') b.state = 'idle';
		// threats: a much bigger creature close by (or one that's poked us)
		let threat: Creature | null = null;
		let threatD = Infinity;
		for (const o of this.entries) {
			if (o.c === c || o.egg > 0) continue;
			const ratio = o.c.plan.size / P.size;
			const d = o.c.pos.distanceTo(c.pos);
			const fear = (1.5 + pers.shy * 4) * Math.sqrt(P.size) + o.c.plan.R * 2;
			if (ratio > 1.7 && d < fear && d < threatD && o.c.speed > 0.1) {
				threat = o.c;
				threatD = d;
			}
		}
		if (threat && b.state !== 'flee' && pers.shy > 0.25) {
			b.state = 'flee';
			b.other = threat;
			b.timer = 1.8 + this.rand() * 1.5;
			c.mood = 'scared';
			this.onEvent?.('flee', e, c.pos);
		}
		if (this.callPoint && b.state !== 'flee' && c.pos.distanceTo(this.callPoint) < 40 && b.state !== 'called') {
			b.state = 'called';
			b.target.copy(this.callPoint);
			b.timer = 10;
		}
		let speed = 0;
		const dir = this.tmp.set(0, 0, 0);
		c.sitTarget = 0;
		c.sniff = Math.max(0, c.sniff - dt * 2);
		switch (b.state) {
			case 'flee': {
				if (b.other) dir.subVectors(c.pos, b.other.pos).setY(0).normalize();
				speed = P.runSpeed * 0.95;
				c.lookTarget = b.other ? b.other.headPos : null;
				if (b.timer <= 0) {
					b.state = 'idle';
					b.timer = 1 + this.rand() * 2;
					c.mood = 'calm';
				}
				break;
			}
			case 'called': {
				dir.subVectors(b.target, c.pos).setY(0);
				const d = dir.length();
				dir.normalize();
				speed = d > 2.5 + P.R * 2 ? Math.min(P.runSpeed * 0.8, P.walkSpeed * 1.8) : 0;
				c.lookTarget = this.tmp2.copy(camPos);
				c.mood = 'happy';
				c.wag = 1;
				if (speed === 0 || b.timer <= 0) {
					b.state = 'idle';
					b.timer = 2 + this.rand() * 3;
					b.idleKind = 'look';
				}
				break;
			}
			case 'follow': {
				const t = b.other;
				if (!t || !this.entries.some((x) => x.c === t)) {
					b.state = 'idle';
					break;
				}
				dir.subVectors(t.pos, c.pos).setY(0);
				const d = dir.length();
				dir.normalize();
				const keep = 1.5 + P.R * 2 + t.plan.R * 2;
				speed = d > keep * 1.6 ? Math.min(P.runSpeed * 0.85, Math.max(P.walkSpeed, t.speed * 1.1)) : d > keep ? P.walkSpeed * 0.8 : 0;
				c.lookTarget = t.headPos;
				c.wag = 0.8;
				if (b.timer <= 0 && t !== this.driven) {
					b.state = 'idle';
					b.timer = 1 + this.rand() * 2;
				}
				break;
			}
			case 'play': {
				const t = b.other;
				if (!t || b.timer <= 0) {
					b.state = 'idle';
					b.timer = 1.5;
					c.mood = 'calm';
					break;
				}
				// circle around the friend, bouncy
				const off = this.tmp2.subVectors(c.pos, t.pos).setY(0);
				const d = off.length() || 1;
				off.divideScalar(d);
				const tangent = new THREE.Vector3(-off.z, 0, off.x);
				dir.copy(tangent).addScaledVector(off, (2.2 + P.R * 3 - d) * 0.8).normalize();
				speed = P.walkSpeed * 1.6;
				c.lookTarget = t.headPos;
				c.mood = 'happy';
				c.wag = 1;
				break;
			}
			case 'wander': {
				dir.subVectors(b.target, c.pos).setY(0);
				const d = dir.length();
				dir.normalize();
				speed = d > 0.6 + P.R ? P.walkSpeed * b.speedMul : 0;
				c.lookTarget = null;
				c.mood = 'calm';
				// flock: drift with similar creatures nearby
				let n = 0;
				const coh = new THREE.Vector3(),
					ali = new THREE.Vector3();
				for (const o of this.entries) {
					if (o === e || o.egg > 0) continue;
					const dd = o.c.pos.distanceTo(c.pos);
					if (dd < 9 && kinship(o.c.plan.genes, P.genes) < 0.22) {
						coh.add(o.c.pos);
						ali.add(o.c.vel);
						n++;
					}
				}
				if (n > 0 && pers.social > 0.3) {
					coh.divideScalar(n).sub(c.pos).setY(0);
					const cl = coh.length();
					if (cl > 2) dir.addScaledVector(coh.normalize(), 0.35 * pers.social);
					if (ali.lengthSq() > 0.01) dir.addScaledVector(ali.setY(0).normalize(), 0.3 * pers.social);
					dir.normalize();
				}
				if (speed === 0 || b.timer <= 0) this.toIdle(e);
				break;
			}
			case 'idle': {
				speed = 0;
				if (b.idleKind === 'sit') c.sitTarget = 1;
				if (b.idleKind === 'sniff') c.sniff = Math.min(1, c.sniff + dt * 4);
				// curious creatures glance at the camera, or at a friend
				if (pers.curious > 0.55 && camPos.distanceTo(c.pos) < 14) c.lookTarget = this.tmp2.copy(camPos);
				else if (b.other && this.entries.some((x) => x.c === b.other)) c.lookTarget = b.other.headPos;
				else c.lookTarget = null;
				c.mood = b.idleKind === 'sit' && P.genes.bounce < 0.3 ? 'sleepy' : 'calm';
				if (b.timer <= 0) this.choose(e);
				break;
			}
		}
		c.wag = Math.max(0, c.wag - dt * 0.3);
		if (speed > 0) {
			this.avoid(c, dir);
			c.intentDir.set(dir.x, dir.z);
			if (c.intentDir.lengthSq() < 1e-6) c.intentDir.set(Math.sin(c.yaw), Math.cos(c.yaw));
			c.intentDir.normalize();
		}
		c.intentSpeed = speed;
		c.faceTarget = speed === 0 && c.lookTarget && b.state !== 'idle' ? c.lookTarget : null;
	}

	private toIdle(e: Entry) {
		const b = e.brain;
		b.state = 'idle';
		const r = this.rand();
		b.idleKind = r < 0.45 ? 'look' : r < 0.75 ? 'sniff' : 'sit';
		b.timer = 1.5 + this.rand() * (b.idleKind === 'sit' ? 6 : 3);
		b.other = null;
		for (const o of this.entries) if (o !== e && o.c.pos.distanceTo(e.c.pos) < 6 && this.rand() < 0.5) b.other = o.c;
	}

	private choose(e: Entry) {
		const c = e.c;
		const b = e.brain;
		const P = c.plan;
		const r = this.rand();
		// follow the driven creature if it's near and we like it
		if (this.driven && this.driven !== c && this.driven.pos.distanceTo(c.pos) < 16 && (P.personality.social > 0.45 || kinship(this.driven.plan.genes, P.genes) < 0.3) && r < 0.7) {
			b.state = 'follow';
			b.other = this.driven;
			b.timer = 8 + this.rand() * 6;
			return;
		}
		// play with a small friend
		if (r < 0.15 && P.size < 1.2) {
			const friend = this.entries.find((o) => o !== e && o.egg === 0 && o.c.plan.size < 1.4 && o.c.pos.distanceTo(c.pos) < 8 && o.brain.state === 'idle');
			if (friend) {
				b.state = 'play';
				b.other = friend.c;
				b.timer = 3 + this.rand() * 3;
				friend.brain.state = 'play';
				friend.brain.other = c;
				friend.brain.timer = b.timer;
				this.onEvent?.('play', e, c.pos);
				return;
			}
		}
		if (r < 0.3) {
			const leader = this.entries.find((o) => o !== e && o.egg === 0 && o.brain.state === 'wander' && o.c.pos.distanceTo(c.pos) < 10 && kinship(o.c.plan.genes, P.genes) < 0.25);
			if (leader) {
				b.state = 'follow';
				b.other = leader.c;
				b.timer = 4 + this.rand() * 5;
				return;
			}
		}
		b.state = 'wander';
		b.speedMul = 0.7 + this.rand() * 0.5;
		b.timer = 12;
		const dist = 4 + this.rand() * 10 * Math.sqrt(P.size);
		for (let k = 0; k < 20; k++) {
			const a = this.rand() * Math.PI * 2;
			const x = c.pos.x + Math.cos(a) * dist,
				z = c.pos.z + Math.sin(a) * dist;
			if (this.world.isOpen(x, z, P.R + 0.5) && this.slopeOk(c, x, z)) {
				b.target.set(x, 0, z);
				return;
			}
		}
		b.target.set(c.pos.x * 0.7, 0, c.pos.z * 0.7);
	}

	private slopeOk(c: Creature, x: number, z: number) {
		const n = this.tmp2;
		this.world.ground(x, z, n);
		return n.y > (c.plan.legs.length ? 0.7 : 0.85);
	}

	/** Steer away from water, the coast, steep ground and obstacles (probe ahead). */
	avoid(c: Creature, dir: THREE.Vector3) {
		const P = c.plan;
		const look = 1.2 + P.R * 3 + c.speed * 0.8;
		const probe = (ang: number) => {
			const cs = Math.cos(ang),
				sn = Math.sin(ang);
			const dx = dir.x * cs + dir.z * sn,
				dz = -dir.x * sn + dir.z * cs;
			const x = c.pos.x + dx * look,
				z = c.pos.z + dz * look;
			let bad = 0;
			if (this.world.water(x, z) > -0.1) bad += 2;
			if (Math.hypot(x, z) > this.world.terrain.islandRadius * 0.85) bad += 2;
			const gy = this.world.ground(x, z, this.tmp2);
			const climb = gy - c.pos.y;
			if (this.tmp2.y < 0.62 || climb > Math.max(0.3, (P.legLength || P.R) * 0.75)) bad += 1.5;
			for (const o of this.world.scenery.obstacles) {
				if (o.kind === 'rock' && o.top < (P.legLength || P.R) * 0.6) continue;
				if (Math.hypot(o.x - x, o.z - z) < o.r + P.R) bad += 1.5;
			}
			return bad;
		};
		if (probe(0) === 0) return;
		for (const a of [0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.4, -2.4, Math.PI]) {
			if (probe(a) === 0) {
				dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
				return;
			}
		}
	}

	/** Soft separation between creatures and hard push out of trees and water. */
	private separate(dt: number) {
		const E = this.entries;
		for (let i = 0; i < E.length; i++) {
			const a = E[i].c;
			if (E[i].egg > 0) continue;
			for (let j = i + 1; j < E.length; j++) {
				const b = E[j].c;
				if (E[j].egg > 0) continue;
				const ra = Math.max(a.plan.footprint[0], a.plan.R) * 0.9,
					rb = Math.max(b.plan.footprint[0], b.plan.R) * 0.9;
				const dx = b.pos.x - a.pos.x,
					dz = b.pos.z - a.pos.z;
				const d = Math.hypot(dx, dz);
				const min = ra + rb;
				if (d < min && d > 1e-4) {
					const push = ((min - d) / d) * Math.min(1, dt * 4);
					const wa = b.plan.size / (a.plan.size + b.plan.size);
					a.pos.x -= dx * push * wa;
					a.pos.z -= dz * push * wa;
					b.pos.x += dx * push * (1 - wa);
					b.pos.z += dz * push * (1 - wa);
				}
			}
			for (const o of this.world.scenery.obstacles) {
				// trees always block; rocks block creatures too small to climb them
				if (o.kind === 'bush') continue;
				if (o.kind === 'rock' && o.top < Math.max(a.plan.legLength, a.plan.R) * 0.7) continue;
				const dx = a.pos.x - o.x,
					dz = a.pos.z - o.z;
				const d = Math.hypot(dx, dz);
				const min = o.r + Math.max(a.plan.R * 0.8, Math.max(a.plan.footprint[0], a.plan.footprint[1]) * 0.75);
				if (d < min && d > 1e-4) {
					const k = Math.min(1, dt * 10);
					a.pos.x += (dx / d) * (min - d) * k;
					a.pos.z += (dz / d) * (min - d) * k;
				}
			}
		}
	}

	// ------------------------------------------------------------------ drawing

	draw(cam: THREE.Camera) {
		const B = this.batches;
		Creature.view.setFromMatrixPosition(cam.matrixWorld);
		const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
		const sphere = new THREE.Sphere();
		const eggQ = new THREE.Quaternion();
		for (const e of this.entries) {
			const c = e.c;
			if (e.egg > 0) {
				// wobbling egg in the creature's palette (cream with coloured spots: the spots are the blob batch's colour)
				const t = 1.6 - e.egg;
				const pop = Math.min(1, t * 4);
				const wob = Math.sin(t * 18) * 0.18 * Math.min(1, t) + Math.sin(t * 31) * 0.05;
				eggQ.setFromEuler(new THREE.Euler(wob, 0, wob * 0.7));
				const r = Math.max(0.12, c.plan.R * 0.9) * easeOutBack(pop);
				const g = this.world.ground(e.eggPos.x, e.eggPos.z);
				B.blobs.add(this.tmp.set(e.eggPos.x, g + r * 1.15, e.eggPos.z), eggQ, this.tmp2.set(r * 0.85, r * 1.15, r * 0.85), lerp3(c.plan.palette.belly, [1, 0.97, 0.9], 0.6));
				continue;
			}
			sphere.center.copy(c.bodyPos);
			sphere.radius = c.plan.radius * 1.6 + 1;
			const vis = frustum.intersectsSphere(sphere) || c.selected;
			c.visible = vis;
			if (c.mesh) c.mesh.visible = vis && c.scaleIn > 0.01;
			if (vis) c.draw(B);
			if (c.selected && vis) {
				// a bobbing sticker-yellow marker above the selected creature
				const y = c.plan.top - c.plan.height + c.bodyPos.y + 0.25 + Math.max(0.15, c.plan.R) * 0.8 + Math.sin(performance.now() / 260) * 0.06;
				const r = 0.09 + c.plan.R * 0.15;
				eggQ.setFromAxisAngle(this.tmp2.set(0, 1, 0), performance.now() / 600);
				B.blobs.add(this.tmp.set(c.bodyPos.x, y, c.bodyPos.z), eggQ, this.tmp2.set(r, r * 1.25, r), [1.0, 0.68, 0.05]);
			}
		}
	}

	/** Contact blobs (shadows, grass parting, water rings) into the world's contact map. */
	contacts() {
		const W = this.world;
		for (const e of this.entries) {
			const c = e.c;
			// only what is actually drawn may part the grass or cast a contact shadow
			if (e.egg <= 0 && !(c.mesh && c.mesh.visible && c.scaleIn > 0.01)) continue;
			if (e.egg > 0) {
				W.contact(e.eggPos.x, e.eggPos.y, e.eggPos.z, Math.max(0.2, c.plan.R * 1.2), 0.6);
				continue;
			}
			const P = c.plan;
			const s = c.scaleIn;
			const gy = c.pos.y;
			const lift = Math.max(0, c.bodyPos.y - P.height - gy);
			W.contact(c.pos.x, gy, c.pos.z, Math.max(0.15, Math.max(P.footprint[0], P.footprint[1]) * 1.1) * s, 0.55 * Math.max(0.2, 1 - lift / (P.R * 2 + 0.2)) * s);
			for (let i = 0; i < c.legs.length; i++) {
				const leg = c.legs[i];
				const fr = P.legs[i].footR;
				const air = leg.planted ? 0 : leg.lift;
				W.contact(leg.end.x, leg.end.y - fr * 0.62, leg.end.z, Math.max(0.08, fr * 2.6) * s, 0.75 * Math.max(0, 1 - air / (fr * 4 + 0.05)) * s);
			}
		}
	}

	// ------------------------------------------------------------------ picking

	pick(ray: THREE.Ray): Creature | null {
		let best: Creature | null = null;
		let bestT = Infinity;
		const s = new THREE.Sphere();
		const hit = new THREE.Vector3();
		for (const e of this.entries) {
			if (e.egg > 0) continue;
			const c = e.c;
			s.center.copy(c.bodyPos);
			s.radius = Math.max(0.25, c.plan.R * 1.4);
			if (ray.intersectSphere(s, hit)) {
				const t = hit.distanceTo(ray.origin);
				if (t < bestT) {
					bestT = t;
					best = c;
				}
			}
			s.center.copy(c.headPos);
			s.radius = Math.max(0.2, c.plan.R);
			if (ray.intersectSphere(s, hit)) {
				const t = hit.distanceTo(ray.origin);
				if (t < bestT) {
					bestT = t;
					best = c;
				}
			}
		}
		return best;
	}

	poke(c: Creature) {
		c.poked = 1;
		// squash spring kick through a fake landing
		(c as unknown as { squash: { v: number } }).squash.v -= 4;
		c.blink = 1;
		const e = this.entryOf(c);
		if (!e) return;
		if (c.plan.personality.shy > 0.55) {
			e.brain.state = 'flee';
			e.brain.other = null;
			e.brain.timer = 1.2;
			c.mood = 'scared';
			c.intentDir.set(-Math.sin(c.yaw), -Math.cos(c.yaw));
		} else {
			c.mood = 'happy';
			c.wag = 1;
			e.brain.state = 'idle';
			e.brain.idleKind = 'look';
			e.brain.timer = 2;
		}
		this.onEvent?.('poke', e, c.headPos);
	}

	call(at: THREE.Vector3) {
		this.callPoint = at.clone();
		this.callTimer = 8;
		for (const e of this.entries) if (e.brain.state !== 'driven' && e.brain.state !== 'scripted') e.brain.state = 'idle';
	}

	// ------------------------------------------------------------------ metrics

	/** nearest mesh vertex for each attachment, for the floating-part check */
	private buildAnchors(e: Entry, g: THREE.BufferGeometry) {
		const P = e.c.plan;
		const pos = g.attributes.position as THREE.BufferAttribute;
		const nearest = (p: readonly number[]) => {
			let best = 0,
				bd = Infinity;
			for (let i = 0; i < pos.count; i++) {
				const d = (pos.getX(i) - p[0]) ** 2 + (pos.getY(i) - p[1]) ** 2 + (pos.getZ(i) - p[2]) ** 2;
				if (d < bd) {
					bd = d;
					best = i;
				}
			}
			return { vert: best, rest: Math.sqrt(bd) };
		};
		P.eyes.forEach((ey, i) => {
			if (ey.stalk >= 0) return;
			const n = nearest(ey.pos);
			e.anchors.push({ what: `eye${i}`, vert: n.vert, bone: ey.bone, local: new THREE.Vector3(...ey.pos), rest: n.rest, key: ey.pos });
		});
		P.legs.forEach((l, i) => {
			const n = nearest(l.hip);
			e.anchors.push({ what: `hip${i}`, vert: n.vert, bone: l.bone, local: new THREE.Vector3(...l.hip), rest: n.rest, key: l.hip });
		});
		P.chains.forEach((ch, i) => {
			const n = nearest(ch.anchor);
			e.anchors.push({ what: `${ch.kind}${i}`, vert: n.vert, bone: ch.bone, local: new THREE.Vector3(...ch.anchor), rest: n.rest, key: ch.anchor });
		});
	}

	private v = new THREE.Vector3();
	private w = new THREE.Vector3();
	private measure(e: Entry, dt: number) {
		const c = e.c;
		const P = c.plan;
		const M = e.metrics;
		if (c.scaleIn < 1) return;
		M.frames++;
		M.distance += c.speed * dt;
		const L = P.legLength || P.R;
		for (let i = 0; i < c.legs.length; i++) {
			const leg = c.legs[i];
			const lp = P.legs[i];
			M.legFrames++;
			if (leg.planted) {
				M.stanceFrames++;
				const slide = Math.hypot(leg.end.x - leg.stanceAt.x, leg.end.y - leg.stanceAt.y, leg.end.z - leg.stanceAt.z);
				M.slideMax = Math.max(M.slideMax, slide);
				M.slideSum += slide;
				const gy = this.world.ground(leg.end.x, leg.end.z);
				M.airborneFootMax = Math.max(M.airborneFootMax, leg.end.y - lp.footR * 0.62 - gy);
			}
			const gy = this.world.ground(leg.end.x, leg.end.z);
			M.penetrationMax = Math.max(M.penetrationMax, gy - (leg.end.y - lp.footR * 0.62));
			const gk = this.world.ground(leg.knee.x, leg.knee.z);
			M.kneeBelow = Math.max(M.kneeBelow, gk - (leg.knee.y - lp.thick * 0.8));
			if (leg.reach > 1.0) M.overExtFrames++;
			// knee pops: second difference of the knee path, relative to leg length
			// knee pops: the knee jerking much harder than the hip and foot that drive it (a flip or snap)
			const [k1, k2, h1, h2, f1, f2] = e.prevKnees[i];
			if (M.frames > 3) {
				const acc = (p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) => this.v.copy(p).sub(a).sub(this.w.copy(a).sub(b)).length();
				const excess = (acc(leg.knee, k1, k2) - 1.5 * (acc(leg.hip, h1, h2) + acc(leg.end, f1, f2))) / L;
				if (excess > M.popMax) M.popAt = `f${M.frames} leg${i} v${c.speed.toFixed(2)} yr${c.yawRate.toFixed(2)} ${c.action ?? ''}${leg.planted ? ' planted' : ' swing'} reach${leg.reach.toFixed(2)}`;
				M.popMax = Math.max(M.popMax, excess);
				if (excess > 0.05) M.pops++;
			}
			k2.copy(k1);
			k1.copy(leg.knee);
			h2.copy(h1);
			h1.copy(leg.hip);
			f2.copy(f1);
			f1.copy(leg.end);
		}
		M.emergencySteps = c.legs.reduce((s, l) => s + l.emergency, 0);
		M.earlySteps = c.legs.reduce((s, l) => s + l.early, 0);
		M.steps = c.legs.reduce((s, l) => s + l.steps, 0);
		// body below ground: bottom of each torso segment
		for (const b of P.segBones) {
			const part = P.parts.find((p) => p.bone === b && p.kind === 'ell' && p.tag.startsWith('seg'));
			if (!part) continue;
			const r = P.bones[b].rest;
			this.v.set(part.c![0] - r[0], part.c![1] - part.r![1] * 0.92 - r[1], part.c![2] - r[2]).applyMatrix4(c.M[b]);
			const gy = this.world.ground(this.v.x, this.v.z);
			M.bodyBelow = Math.max(M.bodyBelow, gy - this.v.y);
		}
		// jitter: third difference of the body position (mm), sampled
		M.jitterSamples.push(c.jerk);
		// floating parts: attachments vs their nearest skinned vertex
		if (c.mesh && M.frames % 6 === 0) {
			c.mesh.skeleton.update();
			for (const a of e.anchors) {
				c.attachSkin(a.key, this.v);
				c.mesh.getVertexPosition(a.vert, this.w);
				const d = this.v.distanceTo(this.w) - a.rest * c.scaleIn;
				if (d > M.floatMax) {
					M.floatMax = d;
					M.floatWhat = a.what;
				}
			}
		}
	}

	report(e: Entry) {
		const M = e.metrics;
		// jitter: size of direction-flipping body accelerations (vibration), 99th percentile
		const js = [...M.jitterSamples].sort((a, b) => a - b);
		const p99 = js.length ? js[Math.floor(js.length * 0.99)] : 0;
		const c = e.c;
		return {
			id: c.id,
			name: c.plan.name,
			code: c.plan.code,
			kind: c.plan.kind,
			legs: c.plan.legs.length,
			size: +c.plan.size.toFixed(2),
			frames: M.frames,
			distance: +M.distance.toFixed(2),
			steps: M.steps,
			slideMaxCm: +(M.slideMax * 100).toFixed(3),
			slideMeanCm: +((M.slideSum / Math.max(1, M.stanceFrames)) * 100).toFixed(4),
			penetrationCm: +(Math.max(0, M.penetrationMax) * 100).toFixed(2),
			kneeBelowCm: +(Math.max(0, M.kneeBelow) * 100).toFixed(2),
			bodyBelowCm: +(Math.max(0, M.bodyBelow) * 100).toFixed(2),
			footHoverCm: +(Math.max(0, M.airborneFootMax) * 100).toFixed(2),
			overExtPct: +((M.overExtFrames / Math.max(1, M.legFrames)) * 100).toFixed(3),
			emergencySteps: M.emergencySteps,
			earlySteps: M.earlySteps,
			pops: M.pops,
			popMax: +M.popMax.toFixed(4),
			popAt: M.popAt ?? '',
			jitterP99mm: +(p99 * 1000).toFixed(3),
			floatMaxMm: +(M.floatMax * 1000).toFixed(2),
			floatWhat: M.floatWhat,
		};
	}

	resetMetrics() {
		for (const e of this.entries) e.metrics = newMetrics();
	}

	codeOf(c: Creature) {
		return encode(c.plan.genes);
	}

	planOf(c: Creature): Plan {
		return c.plan;
	}
}

export function easeOutBack(t: number) {
	const c1 = 1.70158,
		c3 = c1 + 1;
	return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}
const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
