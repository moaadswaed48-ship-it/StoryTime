// A live creature: procedural locomotion, IK, body pose and secondary motion. No bones authored, no clips.
//
// Locomotion (after Hecker et al.'s SIGGRAPH 2008 motion retargeting and the usual procedural-walk recipe):
//  - one gait phase per creature, advanced at a frequency picked from speed and leg length (Froude scaling);
//  - each leg has a phase offset from the body plan (walk, trot, tripod, wave...), and lifts when its phase wraps;
//  - a swing re-targets every frame to where the hip will be at mid-stance (velocity and turn prediction) and
//    lands on the ground by a ray test; a planted foot never moves, so feet cannot slide;
//  - a foot about to be over-stretched steps early; the body's height, pitch and roll come from the feet;
//  - springs (t3ssel8r-style second-order damping) smooth everything the eye follows.
import * as THREE from 'three';
import { type Plan, weightsAt } from './build';
import type { Batches } from './batches';
import { solveTwoBone } from './ik';

export interface WorldQuery {
	/** ground height (terrain and rocks) at x,z; writes the normal when given */
	ground(x: number, z: number, n?: THREE.Vector3): number;
	/** water depth at x,z (<= 0 on land) */
	water(x: number, z: number): number;
}

const TAU = Math.PI * 2;
const frac = (x: number) => x - Math.floor(x);
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const smooth01 = (t: number) => t * t * (3 - 2 * t);
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const damp = (x: number, t: number, k: number, dt: number) => x + (t - x) * (1 - Math.exp(-k * dt));

/** Critically-damped-ish second-order follower (frequency f Hz, damping z). */
class Follow {
	v = 0;
	constructor(
		public x: number,
		public f: number,
		public z = 0.9,
	) {}
	update(target: number, dt: number) {
		const w = TAU * this.f;
		// semi-implicit Euler, sub-stepped for stability
		const n = Math.max(1, Math.ceil(dt / (0.4 / w)));
		const h = dt / n;
		for (let i = 0; i < n; i++) {
			this.v += (w * w * (target - this.x) - 2 * this.z * w * this.v) * h;
			this.x += this.v * h;
		}
		return this.x;
	}
	reset(x: number) {
		this.x = x;
		this.v = 0;
	}
}

export interface LegRT {
	planted: boolean;
	foot: THREE.Vector3;
	footN: THREE.Vector3;
	start: THREE.Vector3;
	target: THREE.Vector3;
	t: number;
	dur: number;
	cycle: number;
	reachPrev: number;
	poleS: THREE.Vector3;
	kneeLift: number;
	kneeClear: number;
	poleUsed: THREE.Vector3;
	sinceLand: number;
	/** tucked under the body during a jump */
	air: boolean;
	/** support height at lift-off (the ground, even for a foot tucked up in the air) */
	startG: number;
	fromAir: boolean;
	early: number;
	// solved joints (world)
	hip: THREE.Vector3;
	knee: THREE.Vector3;
	hock: THREE.Vector3;
	end: THREE.Vector3;
	reach: number;
	clamped: boolean;
	steps: number;
	emergency: number;
	/** foot position when this stance began (slide metric) */
	stanceAt: THREE.Vector3;
	lift: number;
}

interface ChainRT {
	p: THREE.Vector3[];
	prev: THREE.Vector3[];
	seg: number;
}

interface EyeRT {
	q: THREE.Vector2;
	qv: THREE.Vector2;
	world: THREE.Vector3;
	n: THREE.Vector3;
	prevWorld: THREE.Vector3;
	prevVel: THREE.Vector3;
}

export type Mood = 'calm' | 'happy' | 'scared' | 'curious' | 'sleepy';
export type Action = 'jump' | 'eat' | 'dance' | 'sing' | 'charm' | 'pose' | 'hop';


let NEXT_ID = 1;

export class Creature {
	/** where the viewer is (set before drawing): catchlights face it */
	static view = new THREE.Vector3(0, 2, 10);
	static sun = new THREE.Vector3(0.48, 0.72, 0.5).normalize();
	readonly id = NEXT_ID++;
	mesh: THREE.SkinnedMesh | null = null;
	readonly bones: THREE.Bone[];
	private boneInv: THREE.Matrix4[];
	/** world transforms of bones this frame */
	readonly M: THREE.Matrix4[];

	// root
	readonly pos = new THREE.Vector3();
	yaw = 0;
	yawRate = 0;
	speed = 0;
	accel = 0;
	maxSpeed = 1;
	strideMax = 1;
	private bellyPts: Array<[number, number, number]> = [];
	private kTmp = new THREE.Vector3();
	private kTmp2 = new THREE.Vector3();
	private minBodyY = -Infinity;
	readonly vel = new THREE.Vector3();
	// intent (set by the brain or the player)
	intentDir = new THREE.Vector2(0, 1);
	intentSpeed = 0;
	/** face this world point when standing still (look-at turn), or null */
	faceTarget: THREE.Vector3 | null = null;
	lookTarget: THREE.Vector3 | null = null;

	// pose springs
	private bodyY: Follow;
	private pitch: Follow;
	private roll: Follow;
	private squash: Follow;
	private actHeadS = new Follow(0, 5, 0.55);
	/** song sac swell (0 = rest) */
	inflate = 0;
	/** 0 closed .. 1 wide open (eating, singing) */
	mouthOpen = 0;
	private mouthT = 0;
	private headYaw: Follow;
	private headPitch: Follow;
	private earSpring: Follow[] = [];
	private hornSpring: Follow;
	phase = 0;
	freq = 0;
	gaitMix = 0;
	duty = 0.6;
	readonly legs: LegRT[];
	private chains: ChainRT[] = [];
	private eyes: EyeRT[] = [];
	blink = 0;
	private blinkTimer = 2;
	lidOpen = 1;
	mood: Mood = 'calm';
	sit = 0;
	sitTarget = 0;
	sniff = 0;
	wag = 0;
	time = Math.random() * 100;
	hatch = 1;
	/** 0 = invisible egg, 1 = full size */
	scaleIn = 1;
	visible = true;
	selected = false;
	private hopY = 0;
	private hopV = 0;
	private onGround = true;
	readonly bodyPos = new THREE.Vector3();
	readonly bodyQuat = new THREE.Quaternion();
	readonly headPos = new THREE.Vector3();
	/** world position of the mouth (look-dev cameras), once drawn */
	mouthWorld: THREE.Vector3 | null = null;
	private lastBody = new THREE.Vector3();
	private lastBody2 = new THREE.Vector3();
	private lastAcc = new THREE.Vector3();
	/** body jitter metric: |second difference| of the body position this frame (m) */
	jerk = 0;
	private lastFlip = 0;
	poked = 0;
	stepEvents = 0;
	/** editor: hold the rest pose (no breathing, glancing or bob), so clicks map exactly onto the body */
	editorStill = false;
	/** test-drive actions: a jump (with glide when winged), a munch, a dance */
	action: Action | null = null;
	actionT = 0;
	actionDur = 0;
	private jumpH = 0;
	airborne = false;
	// ---- play: nudge, crouch, glide, glow, turn speed ----
	/** a nudge velocity (m/s): moves the body, decays; the legs step to keep up (never slide) */
	readonly push = new THREE.Vector3();
	private pushV = new THREE.Vector3();
	/** extra turn rate for the player (1 = natural) */
	turnBoost = 1;
	/** quicker starts for the player (1 = natural) */
	accelBoost = 1;
	/** 0..1 lowered stance (sneaking) */
	crouch = 0;
	private crouchS = 0;
	/** hold to glide on the way down (wings) */
	glideHeld = false;
	gliding = false;
	private jumpY = 0;
	private jumpVy = 0;
	private launched = false;
	private landed = false;
	private landV = 0;
	/** a soft glow (0..1), read by the per-creature material: a friendly sparkle when something nice happens */
	flash = 0;
	onAction: ((c: Creature, what: string) => void) | null = null;
	/** callbacks for footsteps (sound, dust) */
	onStep: ((c: Creature, at: THREE.Vector3, strength: number) => void) | null = null;
	readonly tmpN = new THREE.Vector3();

	constructor(
		readonly plan: Plan,
		readonly world: WorldQuery,
		x: number,
		z: number,
		yaw: number,
	) {
		this.bones = plan.bones.map((b) => {
			const bone = new THREE.Bone();
			bone.name = b.name;
			bone.matrixAutoUpdate = false;
			bone.matrixWorldAutoUpdate = false;
			return bone;
		});
		this.boneInv = plan.bones.map((b) => new THREE.Matrix4().makeTranslation(-b.rest[0], -b.rest[1], -b.rest[2]));
		this.M = plan.bones.map(() => new THREE.Matrix4());
		this.yaw = yaw;
		const gy = world.ground(x, z);
		this.pos.set(x, gy, z);
		const S = plan.size;
		const fBody = clamp(3.2 / Math.sqrt(S), 1.8, 6);
		this.bodyY = new Follow(gy + plan.height, fBody, 0.85);
		this.pitch = new Follow(0, fBody * 0.8, 0.9);
		this.roll = new Follow(0, fBody * 0.8, 0.8);
		this.squash = new Follow(0, 4.5, 0.35);
		this.headYaw = new Follow(0, 2.2, 0.75);
		this.headPitch = new Follow(0, 2.2, 0.75);
		this.hornSpring = new Follow(0, 5.5, 0.18);
		this.earSpring = plan.earBones.map(() => new Follow(0, 3.2 + plan.genes.earLen * -1.2, 0.16));
		const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
		this.legs = plan.legs.map((l) => {
			const f = this.restFootWorld(l.foot[0], l.foot[2], this.pos, yaw, new THREE.Vector3());
			f.y = world.ground(f.x, f.z) + l.footR * 0.62;
			return {
				planted: true,
				foot: f.clone(),
				footN: new THREE.Vector3(0, 1, 0),
				start: f.clone(),
				startG: f.y,
				fromAir: false,
				target: f.clone(),
				t: 1,
				dur: 0.2,
				cycle: -1,
				reachPrev: 0.8,
				poleS: new THREE.Vector3(),
				kneeLift: 0,
				kneeClear: 1,
				poleUsed: new THREE.Vector3(),
				sinceLand: 1,
				air: false,
				early: 0,
				hip: new THREE.Vector3(),
				knee: new THREE.Vector3(),
				hock: new THREE.Vector3(),
				end: f.clone(),
				reach: 0.8,
				clamped: false,
				steps: 0,
				emergency: 0,
				stanceAt: f.clone(),
				lift: 0,
			};
		});
		void fwd;
		this.lastBody.set(x, gy + plan.height, z);
		this.lastBody2.copy(this.lastBody);
		// longest stance stride every leg can cover without straightening (rest geometry, small bob margin)
		this.strideMax = plan.legLength || plan.R;
		for (const l of plan.legs) {
			const lim = (l.upper + l.lower + l.meta * 0.85) * 0.92;
			const hipH = l.hip[1] - l.footR * 0.62 + plan.legLength * 0.03 - (l.meta ? l.meta * 0.6 : 0);
			const lat = Math.abs(l.foot[0] - l.hip[0]);
			const half = Math.sqrt(Math.max(0.0001, lim * lim - hipH * hipH - lat * lat));
			this.strideMax = Math.min(this.strideMax, 2 * half * 0.92);
		}
		// many legs packed along a short body: keep strides shorter than the gap to the next pair
		const pairZ = new Map<number, number>();
		for (const l of plan.legs) pairZ.set(l.pair, l.hip[2]);
		const zs = [...pairZ.values()].sort((a, b) => a - b);
		if (zs.length >= 3) {
			let gap = Infinity;
			for (let i = 1; i < zs.length; i++) gap = Math.min(gap, zs[i] - zs[i - 1]);
			if (gap > 1e-3) this.strideMax = Math.min(this.strideMax, Math.max(gap * 1.8, (plan.legLength || plan.R) * 0.25));
		}
		// sample points around the bottom of every torso segment (belly clearance)
		for (const part of plan.parts) {
			if (part.kind !== 'ell' || !part.tag.startsWith('seg')) continue;
			const c = part.c!,
				r = part.r!;
			this.bellyPts.push([c[0], c[1] - r[1] * 0.95, c[2]], [c[0], c[1] - r[1] * 0.7, c[2] + r[2] * 0.6], [c[0], c[1] - r[1] * 0.7, c[2] - r[2] * 0.6], [c[0] + r[0] * 0.6, c[1] - r[1] * 0.7, c[2]], [c[0] - r[0] * 0.6, c[1] - r[1] * 0.7, c[2]]);
		}
		this.initChains();
		this.eyes = plan.eyes.map(() => ({ q: new THREE.Vector2(), qv: new THREE.Vector2(), world: new THREE.Vector3(), n: new THREE.Vector3(0, 0, 1), prevWorld: new THREE.Vector3(), prevVel: new THREE.Vector3() }));
		this.blinkTimer = 1 + Math.random() * 4;
	}

	jump(height?: number) {
		if (this.action === 'jump') return;
		const L = this.plan.legLength || this.plan.R * 1.6;
		this.jumpH = height ?? L * 0.45 * this.plan.personality.bounce;
		this.action = 'jump';
		this.actionT = 0;
		this.launched = false;
		this.landed = false;
		this.jumpY = 0;
		this.jumpVy = 0;
		// nominal duration (the real flight ends when the body comes back down; gliding stretches it)
		this.actionDur = 0.12 + 2 * Math.sqrt((2 * this.jumpH) / this.gravity());
		this.onAction?.(this, 'jump');
	}
	private gravity() {
		return 9.81 * (this.plan.wings ? 0.6 : 1) * Math.max(0.7, Math.min(1.3, 1 / Math.sqrt(this.plan.size)));
	}
	/** A timed body action (the social moves). Interrupts anything but a jump in the air. */
	act(what: Action, seconds?: number) {
		if (this.action === 'jump' && this.airborne) return false;
		const D: Partial<Record<Action, number>> = { sing: 1.1, charm: 1.0, pose: 1.1, hop: 0.45 };
		this.action = what;
		this.actionT = 0;
		this.actionDur = seconds ?? D[what] ?? 1;
		if (what === 'charm' || what === 'sing' || what === 'pose') this.mood = 'happy';
		this.onAction?.(this, what);
		return true;
	}
	eat() {
		this.action = 'eat';
		this.actionT = 0;
		this.actionDur = 1.6;
		this.onAction?.(this, 'eat');
	}
	dance(seconds = 3) {
		this.action = 'dance';
		this.actionT = 0;
		this.actionDur = seconds;
		this.mood = 'happy';
		this.onAction?.(this, 'dance');
	}

	/** Attach the meshed body (from the worker). */
	setMesh(geo: THREE.BufferGeometry, material: THREE.Material) {
		const mesh = new THREE.SkinnedMesh(geo, material);
		mesh.frustumCulled = false;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		const skeleton = new THREE.Skeleton(this.bones, this.boneInv);
		mesh.bind(skeleton, new THREE.Matrix4());
		mesh.matrixAutoUpdate = false;
		mesh.name = `creature-${this.id}`;
		mesh.userData.creature = this;
		this.mesh = mesh;
		this.writeBones();
	}

	get L() {
		return this.plan.legLength;
	}

	private restFootWorld(lx: number, lz: number, origin: THREE.Vector3, yaw: number, out: THREE.Vector3) {
		const c = Math.cos(yaw),
			s = Math.sin(yaw);
		return out.set(origin.x + lx * c + lz * s, origin.y, origin.z - lx * s + lz * c);
	}

	private initChains() {
		this.chains = this.plan.chains.map((c) => {
			const p: THREE.Vector3[] = [];
			for (let i = 0; i <= c.segments; i++) p.push(new THREE.Vector3());
			return { p, prev: p.map((v) => v.clone()), seg: c.length / c.segments };
		});
		this.chainsInit = false;
	}
	private chainsInit = false;

	/** Teleport (spawn, reset): plants feet and settles springs. */
	place(x: number, z: number, yaw: number) {
		this.yaw = yaw;
		this.speed = 0;
		this.yawRate = 0;
		const gy = this.world.ground(x, z);
		this.pos.set(x, gy, z);
		this.bodyY.reset(gy + this.plan.height);
		this.pitch.reset(0);
		this.roll.reset(0);
		this.plan.legs.forEach((l, i) => {
			const leg = this.legs[i];
			this.restFootWorld(l.foot[0], l.foot[2], this.pos, yaw, leg.foot);
			leg.foot.y = this.world.ground(leg.foot.x, leg.foot.z, leg.footN) + l.footR * 0.62;
			leg.planted = true;
			leg.air = false;
			leg.t = 1;
			leg.stanceAt.copy(leg.foot);
		});
		this.action = null;
		this.push.set(0, 0, 0);
		this.pushV.set(0, 0, 0);
		this.chainsInit = false;
		this.lastBody.set(x, gy + this.plan.height, z);
		this.lastBody2.copy(this.lastBody);
	}

	// ------------------------------------------------------------------ update

	private q = new THREE.Quaternion();
	private e = new THREE.Euler(0, 0, 0, 'YXZ');
	private v1 = new THREE.Vector3();
	private v2 = new THREE.Vector3();
	private v3 = new THREE.Vector3();
	private m1 = new THREE.Matrix4();
	private m2 = new THREE.Matrix4();
	private root = new THREE.Matrix4();
	private poleW = new THREE.Vector3();
	private gN = new THREE.Vector3();

	update(dt: number) {
		if (dt <= 0) return;
		this.time += dt;
		const P = this.plan;
		const S = P.size;
		const hasLegs = P.legs.length > 0;
		const L = hasLegs ? P.legLength : P.R * 1.6;

		// ---- steering: turn toward the intent, speed along the facing ----
		// top speed: the stride can't exceed what the legs reach at the highest natural cadence (Froude-ish)
		const fNat0 = Math.sqrt(9.81 / Math.max(0.05, L)) / TAU;
		const maxV = hasLegs ? (fNat0 * (P.gait.hop ? 1.6 : 2.3) * this.strideMax) / P.gait.dutyFast : P.runSpeed;
		this.maxSpeed = Math.min(P.runSpeed, maxV);
		const wantSpeed = Math.min(this.intentSpeed, this.maxSpeed);
		let dYaw = 0;
		if (this.intentSpeed > 0.01) dYaw = wrapAngle(Math.atan2(this.intentDir.x, this.intentDir.y) - this.yaw);
		else if (this.faceTarget) dYaw = wrapAngle(Math.atan2(this.faceTarget.x - this.pos.x, this.faceTarget.z - this.pos.z) - this.yaw);
		if (this.faceTarget && this.intentSpeed <= 0.01 && Math.abs(dYaw) < 0.25) dYaw = 0;
		const maxTurn = clamp(2.6 / Math.sqrt(S), 1.1, 4.5) * (P.gait.hop ? 0.8 : 1) * this.turnBoost;
		const targetRate = clamp(dYaw * 3.2 * Math.sqrt(this.turnBoost), -maxTurn, maxTurn);
		this.yawRate = damp(this.yawRate, targetRate, 7 * Math.sqrt(this.turnBoost), dt);
		this.yaw = wrapAngle(this.yaw + this.yawRate * dt);
		const align = Math.max(0, Math.cos(dYaw));
		// steep uphill slows everyone down (short legs most): strides stay short where the ground rises to meet them
		const grade = this.gN.y > 0.2 ? -(this.gN.x * Math.sin(this.yaw) + this.gN.z * Math.cos(this.yaw)) / this.gN.y : 0;
		// (and a steep downhill run is reined in a little, so a reaching foot never snaps the knee straight)
		const uphill = clamp(1 - Math.max(0, grade - 0.08) * (1.6 + 0.25 / Math.max(0.15, L)), 0.45, 1) * clamp(1 - Math.max(0, -grade - 0.12) * 1.2, 0.6, 1);
		const targetSpeed = wantSpeed * align * align * uphill * (this.sit > 0.3 ? 0 : 1);
		const acc = this.maxSpeed * 1.6 * this.accelBoost;
		const prevSpeed = this.speed;
		this.speed = targetSpeed > this.speed ? Math.min(targetSpeed, this.speed + acc * dt) : Math.max(targetSpeed, this.speed - acc * 1.8 * dt);
		this.accel = damp(this.accel, (this.speed - prevSpeed) / dt, 6, dt);
		const fx = Math.sin(this.yaw),
			fz = Math.cos(this.yaw);
		this.vel.set(fx * this.speed, 0, fz * this.speed);
		// knockback rides on top (decays fast); the legs see it through vel, so they step to keep up
		if (this.push.lengthSq() > 1e-6 || this.pushV.lengthSq() > 1e-6) {
			const pl = this.push.length();
			const cap = Math.max(0.5, this.maxSpeed * 1.4);
			if (pl > cap) this.push.multiplyScalar(cap / pl);
			// the shove ramps in over a few frames (no one-frame jolt) and dies away
			const k = 1 - Math.exp(-22 * dt);
			this.pushV.x += (this.push.x - this.pushV.x) * k;
			this.pushV.z += (this.push.z - this.pushV.z) * k;
			this.vel.x += this.pushV.x;
			this.vel.z += this.pushV.z;
			this.push.multiplyScalar(Math.exp(-5 * dt));
			if (this.push.lengthSq() < 1e-4) this.push.set(0, 0, 0);
			if (this.pushV.lengthSq() < 1e-5 && this.push.lengthSq() === 0) this.pushV.set(0, 0, 0);
		}
		this.pos.x += this.vel.x * dt;
		this.pos.z += this.vel.z * dt;
		this.flash = Math.max(0, this.flash - dt * 5);
		this.crouchS = damp(this.crouchS, this.crouch, 6, dt);
		const centerGround = this.world.ground(this.pos.x, this.pos.z, this.gN);
		this.pos.y = centerGround;
		this.sit = damp(this.sit, this.sitTarget * (this.speed < 0.05 ? 1 : 0), 3, dt);

		// ---- gait frequency ----
		const v = this.pushV.lengthSq() > 0 ? Math.hypot(this.vel.x, this.vel.z) : this.speed;
		const turnTravel = Math.abs(this.yawRate) * Math.max(P.footprint[0], P.footprint[1]) * 0.8;
		const fCap = (Math.sqrt(9.81 / Math.max(0.05, L)) / TAU) * (P.gait.hop ? 1.6 : 2.3);
		const dutyMaxOk = v > 0.01 ? (this.strideMax * fCap) / v : 1;
		const mixMin = P.gait.dutySlow > P.gait.dutyFast ? clamp((P.gait.dutySlow - dutyMaxOk) / (P.gait.dutySlow - P.gait.dutyFast), 0, 1) : 0;
		this.gaitMix = Math.max(mixMin, this.gaitMix);
		this.gaitMix = damp(this.gaitMix, smooth01(clamp((v - P.walkSpeed * 0.85) / Math.max(0.05, this.maxSpeed * 0.8 - P.walkSpeed * 0.85), 0, 1)) * (1 - mixMin) + mixMin, 4, dt);
		const g = P.gait;
		this.duty = g.dutySlow + (g.dutyFast - g.dutySlow) * this.gaitMix;
		const insect = P.legs[0]?.style === 'insect';
		const Dpref = Math.min(L * (0.5 + 0.32 * this.gaitMix) * (insect ? 0.8 : 1), this.strideMax);
		const fNat = Math.sqrt(9.81 / Math.max(0.05, L)) / TAU;
		const fMin = fNat * 0.75;
		const fMax = fNat * (g.hop ? 1.6 : 2.3);
		let f = Math.max((v * this.duty) / Dpref, (turnTravel * this.duty) / Dpref);
		if (f > 0.02) f = Math.max(f, fMin);
		let settling = false;
		if (f <= 0.02 && hasLegs) {
			// standing: step only if a foot is out of place or still in the air
			for (let i = 0; i < P.legs.length; i++) {
				const leg = this.legs[i];
				if (!leg.planted) settling = true;
				else {
					this.restFootWorld(P.legs[i].foot[0], P.legs[i].foot[2], this.pos, this.yaw, this.v1);
					if (Math.hypot(this.v1.x - leg.foot.x, this.v1.z - leg.foot.z) > L * 0.16) settling = true;
				}
			}
			if (settling) f = fMin;
		}
		f = Math.min(f, fMax);
		this.freq = damp(this.freq, f, 10, dt);
		if (f === 0 && this.freq < 0.05) this.freq = 0;
		const prevPhase = this.phase;
		this.phase += this.freq * dt;

		// ---- legs: lift on phase wrap, swing to the predicted landing, plant ----
		const stanceDur = this.freq > 0 ? this.duty / this.freq : 0.5;
		const swingDur = this.freq > 0 ? clamp((1 - this.duty) / this.freq, 0.07, 0.42 * Math.sqrt(Math.max(0.15, L) / 0.5)) : 0.25;
		let plantedCount = 0;
		let swinging = this.legs.reduce((n, l) => n + (l.planted ? 0 : 1), 0);
		for (let i = 0; i < P.legs.length; i++) {
			const lp = P.legs[i];
			const leg = this.legs[i];
			const off = g.slow[i] + (g.fast[i] - g.slow[i]) * this.gaitMix;
			const lpNow = frac(this.phase + off);
			const cyc = Math.floor(this.phase + off);
			const legLen = lp.upper + lp.lower + lp.meta;
			if (leg.planted) {
				leg.sinceLand += dt;
				// lift once per cycle inside the swing window (robust to a missed wrap while still swinging)
				let go = this.freq > 0 && cyc !== leg.cycle && lpNow < (1 - this.duty) * 0.7 && leg.sinceLand > stanceDur * 0.3;
				// distance trigger: a foot left behind its stride (start-up, gait changes, turns) steps early,
				// as long as most legs stay on the ground
				if (!go && this.freq > 0 && !g.hop) {
					this.restFootWorld(lp.foot[0], lp.foot[2], this.pos, this.yaw, this.v1);
					const behind = (this.v1.x - leg.foot.x) * Math.sin(this.yaw) + (this.v1.z - leg.foot.z) * Math.cos(this.yaw);
					const off2 = Math.hypot(this.v1.x - leg.foot.x, this.v1.z - leg.foot.z);
					if ((behind > this.strideMax * 0.5 || off2 > this.strideMax * 0.62) && swinging < Math.max(1, Math.floor(P.legs.length / 2)) && leg.sinceLand > 0.08) {
						go = true;
						leg.early++;
					}
				}
				// over-stretch guard: step before the leg would have to straighten fully
				// (predicted one frame ahead, so the leg never shows a fully straight frame)
				const reachNext = leg.reach + Math.max(0, leg.reach - leg.reachPrev);
				if (!go && reachNext > 0.96) {
					go = true;
					leg.emergency++;
				}
				if (go && settling) {
					this.restFootWorld(lp.foot[0], lp.foot[2], this.pos, this.yaw, this.v1);
					if (Math.hypot(this.v1.x - leg.foot.x, this.v1.z - leg.foot.z) < L * 0.05) {
						go = false;
						leg.cycle = cyc;
					}
				}
				if (go) {
					swinging++;
					leg.planted = false;
					leg.t = 0;
					// an early (guard) lift late in the cycle counts as next cycle's step
					leg.cycle = lpNow > 0.5 ? cyc + 1 : cyc;
					leg.dur = swingDur;
					leg.start.copy(leg.foot);
					leg.startG = leg.foot.y;
					leg.steps++;
				}
			}
			if (!leg.planted && leg.air) {
				// in the air: the foot hangs under its hip and reaches down as the ground comes up
				this.restFootWorld(lp.foot[0], lp.foot[2], this.pos, this.yaw, this.v1);
				const full = (lp.upper + lp.lower + lp.meta * 0.85) * this.scaleIn;
				const gy = this.world.ground(this.v1.x, this.v1.z, leg.footN) + lp.footR * 0.62;
				const hipY = leg.hip.lengthSq() > 0 ? leg.hip.y : this.pos.y + P.height;
				this.v1.y = Math.max(gy, hipY - full * 0.82);
				this.v1.x += this.vel.x * 0.05;
				this.v1.z += this.vel.z * 0.05;
				leg.foot.lerp(this.v1, 1 - Math.exp(-14 * dt));
				if (leg.foot.y < gy) leg.foot.y = gy;
				leg.lift = leg.foot.y - gy;
				// coming down: reach for the ground so the foot lands as the body does
				const tLand = this.action === 'jump' && this.launched && this.jumpVy < 0 ? Math.max(0, this.jumpY) / -this.jumpVy : 0;
				if (this.action !== 'jump' || this.landed || (this.launched && this.jumpVy < 0 && tLand < 0.14 && !(this.glideHeld && P.wings))) {
					leg.air = false;
					leg.t = 0;
					leg.dur = Math.max(0.06, tLand + 0.03);
					leg.start.copy(leg.foot);
					// the body's support counts from the ground below, not from the tucked foot
					leg.startG = gy;
					leg.fromAir = true;
				}
			} else if (!leg.planted) {
				leg.t = Math.min(1, leg.t + dt / leg.dur);
				const remaining = (1 - leg.t) * leg.dur;
				const lead = remaining + stanceDur * 0.5;
				const yawP = this.yaw + this.yawRate * lead;
				this.v1.set(this.pos.x + this.vel.x * lead, 0, this.pos.z + this.vel.z * lead);
				this.restFootWorld(lp.foot[0], lp.foot[2], this.v1, yawP, leg.target);
				let gy = this.world.ground(leg.target.x, leg.target.z, leg.footN);
				leg.target.y = gy + lp.footR * 0.62;
				// never land where the leg can't reach (steep downhill, ledges): shorten the step toward the hip
				const reachMax = (lp.upper + lp.lower + lp.meta * 0.85) * this.scaleIn * 0.9;
				if (leg.hip.lengthSq() > 0 && leg.target.distanceTo(leg.hip) > reachMax) {
					// bisect the largest reachable fraction of the step (continuous, so the target never jumps)
					const ox = leg.target.x - leg.hip.x,
						oz = leg.target.z - leg.hip.z;
					let lo = 0,
						hi = 1;
					for (let k = 0; k < 8; k++) {
						const mid = (lo + hi) / 2;
						const tx = leg.hip.x + ox * mid,
							tz = leg.hip.z + oz * mid;
						const ty = this.world.ground(tx, tz) + lp.footR * 0.62;
						if (Math.hypot(tx - leg.hip.x, ty - leg.hip.y, tz - leg.hip.z) > reachMax) hi = mid;
						else lo = mid;
					}
					leg.target.x = leg.hip.x + ox * lo;
					leg.target.z = leg.hip.z + oz * lo;
					gy = this.world.ground(leg.target.x, leg.target.z, leg.footN);
					leg.target.y = gy + lp.footR * 0.62;
				}
				const s = smooth01(leg.t);
				leg.foot.lerpVectors(leg.start, leg.target, s);
				// a foot coming down from a jump goes straight to the ground (no step arc that would fold the leg)
				// stepping up a slope already lifts the foot: the arc shrinks so the leg never folds hard into the hip
				const climbUp = Math.max(0, leg.target.y - leg.startG);
				const arcH = leg.fromAir ? 0 : legLen * (0.12 + 0.07 * this.gaitMix) * (g.hop ? 0.6 : 1) * clamp(1 - climbUp / (legLen * 0.3), 0.35, 1);
				const arc = arcH * Math.sin(Math.PI * leg.t);
				leg.foot.y += arc;
				// clear bumps between start and target: keep a little air under the foot along the way
				const under = this.world.ground(leg.foot.x, leg.foot.z) + lp.footR * 0.62 + arcH * 0.35 * Math.sin(Math.PI * leg.t);
				if (leg.foot.y < under) leg.foot.y = under;
				leg.lift = arc;
				if (leg.t >= 1) {
					leg.planted = true;
					leg.fromAir = false;
					leg.foot.copy(leg.target);
					leg.stanceAt.copy(leg.foot);
					leg.lift = 0;
					leg.sinceLand = 0;
					this.stepEvents++;
					this.onStep?.(this, leg.foot, Math.min(1, v / Math.max(0.1, P.walkSpeed)));
				}
			}
			if (leg.planted) plantedCount++;
		}

		// ---- body height, pitch, roll from the feet ----
		let groundAvg = centerGround;
		let pitchT = 0,
			rollT = 0;
		if (hasLegs) {
			let sum = 0,
				fSum = 0,
				fN = 0,
				bSum = 0,
				bN = 0,
				lSum = 0,
				lN = 0,
				rSum = 0,
				rN = 0;
			let zf = 0,
				zb = 0,
				xl = 0,
				xr = 0;
			const midZ = P.legs.reduce((m, l) => m + l.hip[2], 0) / P.legs.length;
			for (let i = 0; i < P.legs.length; i++) {
				const lp = P.legs[i];
				const leg = this.legs[i];
				// continuous support height: a swinging foot counts at its lerp base between lift-off and landing
				const gy = (leg.planted ? leg.foot.y : leg.startG + (leg.target.y - leg.startG) * smooth01(leg.t)) - lp.footR * 0.62;
				sum += gy;
				if (lp.hip[2] > midZ + 1e-3) {
					fSum += gy;
					fN++;
					zf += lp.foot[2];
				} else if (lp.hip[2] < midZ - 1e-3) {
					bSum += gy;
					bN++;
					zb += lp.foot[2];
				}
				if (lp.side > 0) {
					lSum += gy;
					lN++;
					xl += lp.foot[0];
				} else {
					rSum += gy;
					rN++;
					xr += lp.foot[0];
				}
			}
			groundAvg = centerGround * 0.35 + (sum / P.legs.length) * 0.65;
			if (fN && bN) pitchT = Math.atan2(fSum / fN - bSum / bN, Math.max(0.05, zf / fN - zb / bN));
			else pitchT = -Math.atan2(this.gN.z * fz + this.gN.x * fx, this.gN.y) * 0.4;
			if (lN && rN && P.kind !== 'mono') rollT = Math.atan2(lSum / lN - rSum / rN, Math.max(0.05, xl / lN - xr / rN)) * 0.6;
		} else {
			pitchT = -Math.atan2(this.gN.z * fz + this.gN.x * fx, this.gN.y) * 0.8;
			rollT = Math.atan2(this.gN.x * fz - this.gN.z * fx, this.gN.y) * 0.8;
		}
		pitchT = clamp(pitchT, -0.6, 0.6);
		rollT = clamp(rollT, -0.35, 0.35);

		// bob: low at weight acceptance, high mid-stance; hoppers fly between stances
		const pers = P.personality;
		let bob = 0;
		let waddle = 0;
		const moving = this.freq > 0.05 && v > 0.02;
		const mv = clamp(v / Math.max(0.1, P.walkSpeed), 0, 1.6);
		if (g.hop) {
			// ballistic hop driven by the phase: flight while the feet swing
			// the body takes off a moment after the feet start to lift, so planted legs never get yanked straight
			const hp = frac(this.phase - 0.07);
			const flight = 1 - this.duty;
			const H = (hasLegs ? L * 0.22 : P.R * 0.55) * pers.bounce * clamp(mv, 0, 1.2);
			if (moving && hp < flight) {
				bob = H * Math.sin((Math.PI * hp) / flight);
				this.onGround = false;
			} else {
				if (!this.onGround && moving) this.squash.v -= 3.5 * pers.bounce;
				this.onGround = true;
				// crouch during stance (anticipation)
				const st = moving ? (hp - flight) / this.duty : 0;
				bob = -(hasLegs ? L * 0.05 : P.R * 0.12) * Math.sin(Math.PI * st) * clamp(mv, 0, 1);
			}
		} else if (hasLegs) {
			const beats = P.kind === 'biped' || (this.gaitMix > 0.5 && P.legs.length >= 4) ? 2 : P.legs.length >= 6 ? 2 : 4;
			const p0 = 1 - this.duty + 0.06;
			// a bob faster than ~4 Hz reads as vibration, so it fades out for quick little steppers
			const bobHz = beats * this.freq;
			const fade = 1 - smooth01(clamp((bobHz - 3.2) / 2.5, 0, 1));
			bob = -Math.cos(TAU * beats * (this.phase - p0)) * L * 0.028 * pers.bounce * clamp(mv, 0, 1.3) * (moving ? 1 : 0) * fade;
			if (P.kind === 'biped') {
				// waddle: lean over the stance foot; fat short-legged ones waddle more
				const wAmp = 0.07 * clamp((P.R * 1.4) / L, 0.4, 1.6) * clamp(mv, 0, 1.2);
				waddle = Math.sin(TAU * (this.phase - 0.25)) * wAmp * (moving ? 1 : 0);
			}
		}
		// legless shuffle when not hopping: tiny wiggle
		const breathe = this.editorStill ? 0 : Math.sin(this.time * TAU * 0.28) * 0.012;
		// actions: a ballistic jump (gliding on wings), social moves, attacks and reactions
		let actY = 0;
		let actRoll = 0;
		let actPitch = 0;
		let actHead = 0;
		let actStretch = 0;
		let inflateT = 0;
		// at rest the mouth keeps its expression (genes and mood); actions below take over
		this.mouthT = this.mood === 'scared' ? 0.3 : this.restingFace(dt);
		this.airborne = false;
		this.gliding = false;
		if (this.action) {
			this.actionT += dt;
			const t = this.actionT;
			const u = clamp(t / this.actionDur, 0, 1);
			const Ls = hasLegs ? L : P.R * 1.6;
			// soft in and out over the action
			const env = smooth01(clamp(u * 5, 0, 1)) * smooth01(clamp((1 - u) * 5, 0, 1));
			const a = this.action;
			if (a === 'jump') {
				const crouch = 0.12;
				const depth = hasLegs ? L * 0.12 : P.R * 0.2;
				if (t < crouch) actY = -Math.sin((t / crouch) * Math.PI * 0.5) * depth;
				else {
					if (!this.launched) {
						this.launched = true;
						this.jumpY = -depth;
						this.jumpVy = Math.sqrt(2 * this.gravity() * (this.jumpH + depth));
						// feet leave the ground at take-off and tuck under the body until it comes down
						for (const leg of this.legs) {
							leg.planted = false;
							leg.air = true;
							leg.t = 0;
							leg.dur = 9;
							leg.start.copy(leg.foot);
							leg.startG = leg.foot.y;
						}
					}
					const glide = this.glideHeld && P.wings && this.jumpVy < 0;
					this.jumpVy -= this.gravity() * (glide ? 0.14 : 1) * dt;
					if (glide) this.jumpVy = Math.max(this.jumpVy, -0.8 * Math.sqrt(S));
					this.jumpY += this.jumpVy * dt;
					this.gliding = glide;
					this.airborne = true;
					actY = this.jumpY;
					if (this.jumpY <= 0 && this.jumpVy < 0) {
						// touchdown: squash, a thump, and the feet reach for the ground
						actY = 0;
						this.airborne = false;
						this.gliding = false;
						this.landed = true;
						this.squash.v -= 3.5 * Math.min(1.6, 0.6 + Math.abs(this.jumpVy) * 0.25);
						// the fall carries into the legs: the body sinks and springs back instead of stopping dead
						this.landV = this.jumpVy * 0.55;
						this.onStep?.(this, this.pos, 1);
						this.action = null;
					}
				}
			} else if (a === 'eat') {
				this.mouthT = 0.15 + 0.5 * Math.abs(Math.sin(t * 9));
				this.sniff = 1;
				actY = -Math.abs(Math.sin(t * 9)) * P.R * 0.05;
			} else if (a === 'dance') {
				actRoll = Math.sin(t * 9) * 0.22;
				actY = Math.abs(Math.sin(t * 6)) * Ls * 0.08;
				this.mouthT = 0.2 + 0.15 * Math.abs(Math.sin(t * 6));
				this.wag = 1;
				this.faceTarget = this.v3.set(this.pos.x + Math.sin(this.yaw + 1.2), 0, this.pos.z + Math.cos(this.yaw + 1.2)).clone();
			} else if (a === 'sing') {
				inflateT = 0.45 * Math.abs(Math.sin(t * 7)) * env;
				this.mouthT = (0.35 + 0.5 * Math.abs(Math.sin(t * 7))) * env;
				actHead = -0.5 * env;
				actRoll = Math.sin(t * 6) * 0.07 * env;
				actY = Math.sin(t * 12) * Ls * 0.012 * env;
				actStretch = 0.04 * env;
				this.wag = 1;
			} else if (a === 'charm') {
				this.mouthT = 0.22 * env;
				actRoll = Math.sin(u * TAU) * 0.22 * env;
				actHead = 0.12 * env;
				actY = Math.abs(Math.sin(t * 8)) * Ls * 0.035 * env;
				if (u > 0.45 && u < 0.5) this.blink = 1;
				this.wag = 1;
			} else if (a === 'pose') {
				actPitch = 0.16 * env;
				actStretch = 0.08 * env;
				actY = Ls * 0.06 * env;
				actHead = -0.3 * env;
			}
			if (this.action && a !== 'jump' && t >= this.actionDur) {
				this.action = null;
				if (this.mood === 'happy') this.mood = 'calm';
			}
		}
		const aH = this.actHeadS.update(actHead, dt);
		this.inflate = damp(this.inflate, inflateT, 18, dt);
		this.mouthOpen = damp(this.mouthOpen, this.mouthT, this.mouthT < this.mouthOpen ? 30 : 18, dt);
		const sitDrop = this.sit * (hasLegs ? Math.min(P.height * 0.32, L * 0.3) : 0);
		// sneaking: lower, but never so low the knees fold into the dirt (splayed and many legs sink less)
		const crouchDrop = this.crouchS * (hasLegs ? L * 0.16 * (P.legs.length > 4 ? 0.45 : 1) * (P.legs[0]?.style === 'insect' ? 0.55 : 1) : P.R * 0.15);
		const baseY = groundAvg + P.height + bob - sitDrop - crouchDrop;
		let targetY = baseY + actY;
		// belly clearance: lift the body if any point under the torso would dip into the ground (slopes, bumps)
		{
			this.e.set(-this.pitch.x, this.yaw, this.roll.x, 'YXZ');
			this.q.setFromEuler(this.e);
			let minY = -Infinity;
			for (const bp of this.bellyPts) {
				this.v1.set(bp[0], bp[1] - P.height, bp[2]).applyQuaternion(this.q);
				const gy = this.world.ground(this.pos.x + this.v1.x, this.pos.z + this.v1.z);
				minY = Math.max(minY, gy + 0.01 - this.v1.y);
			}
			this.minBodyY = minY;
			targetY = Math.max(targetY, minY);
		}
		const ballistic = this.action === 'jump';
		if (this.landV) {
			this.bodyY.v += this.landV;
			this.landV = 0;
		}
		// in a jump the spring follows the standing height and the arc rides on top of it
		let bodyY = this.bodyY.update(ballistic ? Math.max(baseY, this.minBodyY) : targetY, dt) + (ballistic ? actY : 0);
		if (bodyY < this.minBodyY - 0.004) {
			// hard floor (with a few mm of give, so it never kinks the bob): the belly never sinks into the ground
			bodyY = this.minBodyY - 0.004;
			this.bodyY.x = bodyY;
			this.bodyY.v = Math.max(0, this.bodyY.v);
		}
		// lean into acceleration (forward) and into turns
		const lean = clamp(-this.accel * 0.035, -0.18, 0.18);
		const turnLean = clamp(-this.yawRate * v * 0.12, -0.22, 0.22);
		const pitch = this.pitch.update(pitchT + lean + actPitch + this.sit * (P.kind === 'quad' ? 0.22 : 0.05) + (P.kind === 'biped' ? -0.04 * this.gaitMix : 0), dt);
		const roll = this.roll.update(rollT + turnLean + waddle + actRoll, dt);
		const sq = this.squash.update(0, dt);

		// ---- root transform (squash pivots at the ground) ----
		this.e.set(-pitch, this.yaw, roll, 'YXZ');
		this.q.setFromEuler(this.e);
		this.bodyQuat.copy(this.q);
		this.bodyPos.set(this.pos.x, bodyY, this.pos.z);
		// jitter metric (second difference of the body position)
		// jitter metric: a vibration shows as second differences that flip direction frame to frame
		this.v1.copy(this.bodyPos).sub(this.lastBody).sub(this.v2.copy(this.lastBody).sub(this.lastBody2));
		// vibration means flipping back and forth: a single flip (a landing, a launch) is an impact, not jitter
		const flip = this.v1.dot(this.lastAcc) < 0 ? Math.min(this.v1.length(), this.lastAcc.length()) : 0;
		this.jerk = flip > 0 && this.lastFlip > 0 ? Math.min(flip, this.lastFlip) : 0;
		this.lastFlip = flip;
		this.lastAcc.copy(this.v1);
		this.lastBody2.copy(this.lastBody);
		this.lastBody.copy(this.bodyPos);

		const sY = 1 + clamp(sq, -0.35, 0.35) + breathe + actStretch;
		const sXZ = 1 / Math.sqrt(sY);
		const k = this.scaleIn;
		// root = T(bodyPos) * R * T(0,-h,0) * pivot-scale(at y=0) * scaleIn
		this.root.compose(this.bodyPos, this.q, this.v3.set(1, 1, 1));
		this.m1.makeTranslation(0, -P.height, 0);
		this.root.multiply(this.m1);
		this.m2.makeScale(sXZ * k, sY * k, sXZ * k);
		this.root.multiply(this.m2);

		// ---- spine: segments bend along the path curvature ----
		const curv = this.plan.kind === 'biped' || this.plan.kind === 'mono' ? 0 : clamp(this.yawRate / Math.max(0.35, v), -1.2 / Math.max(0.2, P.footprint[1]), 1.2 / Math.max(0.2, P.footprint[1]));
		for (let s = 0; s < P.segBones.length; s++) {
			const b = P.segBones[s];
			const r = P.bones[b].rest;
			const z = r[2];
			const off = 0.5 * curv * z * z;
			this.m1.makeRotationY(curv * z);
			this.m1.setPosition(r[0] + off, r[1], r[2]);
			this.M[b].multiplyMatrices(this.root, this.m1);
		}
		// head: follows the front segment, turns to look, sniffs
		const front = P.segBones[P.segBones.length - 1];
		const fr = P.bones[front].rest;
		const hr = P.bones[P.headBone].rest;
		this.updateLook(dt);
		const nod = this.sniff * (0.25 + 0.08 * Math.sin(this.time * 22)) + (this.action === 'eat' ? Math.sin(this.actionT * 18) * 0.18 : 0);
		const counter = (P.kind === 'biped' ? -bob * 0.6 : 0) / Math.max(0.05, L);
		this.e.set(this.headPitch.x + nod + counter * 0.3 + aH, this.headYaw.x, -roll * 0.4, 'YXZ');
		this.q.setFromEuler(this.e);
		this.m1.makeRotationFromQuaternion(this.q);
		this.m1.setPosition(hr[0] - fr[0], hr[1] - fr[1], hr[2] - fr[2]);
		// remove the segment's scale influence on the head offset? keep: squash carries the head too
		this.M[P.headBone].multiplyMatrices(this.M[front], this.m1);
		// horns and ears wobble from head motion
		const headAcc = this.headYaw.v * 0.6 + this.headPitch.v * 0.4 + this.roll.v * 0.8 + this.bodyY.v * 3 / Math.max(0.2, S);
		const hornA = this.hornSpring.update(-headAcc * 0.012, dt);
		const hrn = P.bones[P.hornBone].rest;
		this.m1.makeRotationX(hornA);
		this.m1.setPosition(hrn[0] - hr[0], hrn[1] - hr[1], hrn[2] - hr[2]);
		this.M[P.hornBone].multiplyMatrices(this.M[P.headBone], this.m1);
		P.earBones.forEach((eb, i) => {
			const bone = P.bones[eb];
			const parent = bone.parent >= 0 ? bone.parent : P.headBone;
			const er = bone.rest;
			const pr = P.bones[parent].rest;
			const side = er[0] > pr[0] + 1e-4 ? 1 : er[0] < pr[0] - 1e-4 ? -1 : 0;
			const a = this.earSpring[i].update(-headAcc * 0.05 + Math.sin(this.time * 1.7 + i) * 0.03 - this.sit * 0.1 + (this.mood === 'scared' ? -0.5 : 0), dt);
			if (bone.name === 'throat') {
				// the song sac swells with each note
				const k = 1 + this.inflate;
				this.m1.makeScale(k, k, k);
				this.m1.setPosition(er[0] - pr[0], er[1] - pr[1], er[2] - pr[2]);
				this.M[eb].multiplyMatrices(this.M[parent], this.m1);
				return;
			}
			if (bone.name.startsWith('wing')) {
				// wings: a lazy idle flutter, full flapping while airborne or running
				const flap = this.gliding ? 0.08 : this.airborne ? 1 : clamp(this.speed / Math.max(0.1, P.runSpeed), 0, 1) * 0.5 + 0.08;
				// gliding: held out flat with a slow flutter
				const f = Math.sin(this.time * (this.gliding ? 4 : this.airborne ? 15 : 6)) * 0.75 * flap + (this.gliding ? 0.55 : 0);
				this.e.set(a * 0.3, 0, side * (f - 0.1) + a * side * 0.3, 'YXZ');
			} else this.e.set(a * 0.8, 0, -a * side * 0.6, 'YXZ');
			this.q.setFromEuler(this.e);
			this.m1.makeRotationFromQuaternion(this.q);
			this.m1.setPosition(er[0] - pr[0], er[1] - pr[1], er[2] - pr[2]);
			this.M[eb].multiplyMatrices(this.M[parent], this.m1);
		});
		this.headPos.set(0, 0, 0).applyMatrix4(this.M[P.headBone]);

		// ---- leg IK ----
		for (let i = 0; i < P.legs.length; i++) this.solveLeg(i, dt);
		void plantedCount;

		this.writeBones();
		this.updateChains(dt);
		this.updateEyes(dt);
		this.poked = Math.max(0, this.poked - dt);
		const mat = this.mesh?.material as THREE.MeshLambertMaterial | undefined;
		if (mat?.userData.own && mat.emissive) mat.emissive.setRGB(this.flash * 0.75, this.flash * 0.62, this.flash * 0.55);
	}

	private attach(bone: number, p: readonly number[], out: THREE.Vector3) {
		const r = this.plan.bones[bone].rest;
		return out.set(p[0] - r[0], p[1] - r[1], p[2] - r[2]).applyMatrix4(this.M[bone]);
	}

	/** An anchor carried by the same blended bone weights as the skin around it (never drifts off the body). */
	private wcache = new Map<readonly number[], Array<[number, number]>>();
	private aTmp = new THREE.Vector3();
	attachSkin(p: readonly number[], out: THREE.Vector3) {
		let w = this.wcache.get(p);
		if (!w) {
			w = weightsAt(this.plan, p);
			this.wcache.set(p, w);
		}
		out.set(0, 0, 0);
		for (const [b, k] of w) {
			const r = this.plan.bones[b].rest;
			this.aTmp.set(p[0] - r[0], p[1] - r[1], p[2] - r[2]).applyMatrix4(this.M[b]);
			out.addScaledVector(this.aTmp, k);
		}
		return out;
	}

	private solveLeg(i: number, dt: number) {
		const lp = this.plan.legs[i];
		const leg = this.legs[i];
		this.attachSkin(lp.hip, leg.hip);
		this.poleW.set(lp.pole[0], lp.pole[1], lp.pole[2]).applyQuaternion(this.bodyQuat);
		const s = this.scaleIn;
		if (!leg.planted) {
			// a swinging foot dangles: never further from the hip than the leg reaches, never folded into it
			const full = (lp.upper + lp.lower + lp.meta * 0.9) * s;
			const maxR = full * 0.985;
			let d = leg.foot.distanceTo(leg.hip);
			if (d > maxR) {
				leg.foot.lerp(leg.hip, 1 - maxR / d);
				d = maxR;
			}
			const minR = full * 0.55;
			if (d < minR) {
				const h = Math.hypot(leg.foot.x - leg.hip.x, leg.foot.z - leg.hip.z);
				const dy = Math.sqrt(Math.max(0, minR * minR - h * h));
				const floor = this.world.ground(leg.foot.x, leg.foot.z) + lp.footR * 0.62;
				leg.foot.y = Math.max(floor, Math.min(leg.foot.y, leg.hip.y - dy));
			}
		}
		const L = lp.upper + lp.lower + lp.meta;
		const fx = Math.sin(this.yaw),
			fz = Math.cos(this.yaw);
		if (lp.meta > 0) {
			// digitigrade: the metatarsal points up and back at rest and swings toward the hip as the foot trails
			this.v3.set(-fx * 0.42, 0.88, -fz * 0.42);
			this.v2.subVectors(leg.hip, leg.foot).normalize();
			this.v3.lerp(this.v2, 0.45).normalize().multiplyScalar(lp.meta * s);
			leg.hock.copy(leg.foot).add(this.v3);
		}
		if (lp.meta > 0 && !leg.planted) {
			// a swinging digitigrade leg dangles too: keep the hock within reach
			const lim = (lp.upper + lp.lower) * s * 0.985;
			const dd = leg.hock.distanceTo(leg.hip);
			if (dd > lim) {
				const sh = this.v1.subVectors(leg.hock, leg.hip).multiplyScalar(1 - lim / dd);
				leg.hock.sub(sh);
				leg.foot.sub(sh);
			}
		}
		const goal = lp.meta > 0 ? leg.hock : leg.foot;
		// knee direction: the plan's pole, lifted (or swung out) smoothly when the knee nears the ground
		const d = this.v2.subVectors(goal, leg.hip).normalize();
		const pp = this.v3.copy(this.poleW).addScaledVector(d, -this.poleW.dot(d));
		if (pp.lengthSq() < 1e-6) pp.copy(leg.poleS);
		pp.normalize();
		const want = L * 0.08;
		const wT = Math.min(1, Math.max(0, (want - leg.kneeClear) / (L * 0.12))) * Math.min(1, Math.max(0, (leg.reach - 0.22) / 0.2));
		leg.kneeLift = damp(leg.kneeLift, wT, wT > leg.kneeLift ? 13 : 4, dt);
		if (leg.kneeLift > 1e-3) {
			const upP = this.v1.set(0, 1, 0).addScaledVector(d, -d.y);
			const upLen = upP.length();
			const sx = Math.cos(this.yaw) * lp.side,
				sz = -Math.sin(this.yaw) * lp.side;
			const outP = this.aTmp.set(sx, 0, sz).addScaledVector(d, -(sx * d.x + sz * d.z)).normalize();
			upP.normalize().lerp(outP, 1 - Math.min(1, Math.max(0, (upLen - 0.2) / 0.4))).normalize();
			pp.lerp(upP, leg.kneeLift).normalize();
		}
		// temporal smoothing of the knee direction (never snaps, even when the body turns fast)
		if (leg.poleS.lengthSq() < 0.5) leg.poleS.copy(pp);
		else leg.poleS.lerp(pp, 1 - Math.exp(-28 * dt)).normalize();
		leg.poleUsed.copy(leg.poleS);
		let r = solveTwoBone(leg.hip, goal, lp.upper * s, lp.lower * s, leg.poleS, leg.knee, this.aTmp);
		if (leg.planted && r.reach > 0.985 && this.scaleIn >= 1) {
			// out of reach while planted (a sudden lift of the body): step now rather than let the foot slide
			leg.planted = false;
			leg.t = 0;
			leg.dur = Math.max(0.12, leg.dur);
			leg.start.copy(leg.foot);
			leg.startG = leg.foot.y;
			leg.steps++;
			leg.emergency++;
			const full = (lp.upper + lp.lower + lp.meta * 0.9) * s * 0.985;
			const dd = leg.foot.distanceTo(leg.hip);
			if (dd > full && lp.meta === 0) leg.foot.lerp(leg.hip, 1 - full / dd);
			r = solveTwoBone(leg.hip, goal, lp.upper * s, lp.lower * s, leg.poleS, leg.knee, this.aTmp);
		}
		leg.reachPrev = leg.reach;
		leg.reach = r.reach;
		leg.clamped = r.clamped;
		if (lp.meta > 0) {
			// if the hock couldn't be reached, carry the miss to the foot (the metric sees it)
			this.aTmp.sub(leg.hock);
			leg.end.copy(leg.foot).add(this.aTmp);
			leg.hock.add(this.aTmp);
		} else {
			leg.end.copy(this.aTmp);
			leg.hock.copy(leg.end);
		}
		leg.kneeClear = leg.knee.y - lp.thick * 0.8 * s - this.world.ground(leg.knee.x, leg.knee.z);
	}

	private writeBones() {
		for (let b = 0; b < this.bones.length; b++) this.bones[b].matrixWorld.copy(this.M[b]);
	}

	// ------------------------------------------------------------------ head look

	private updateLook(dt: number) {
		const P = this.plan;
		let yawT = 0,
			pitchT = 0;
		const t = this.lookTarget;
		if (t) {
			const hr = P.bones[P.headBone].rest;
			const hx = this.pos.x + Math.sin(this.yaw) * hr[2],
				hz = this.pos.z + Math.cos(this.yaw) * hr[2];
			const dx = t.x - hx,
				dz = t.z - hz;
			const dy = t.y - (this.bodyPos.y + hr[1] - P.height);
			yawT = clamp(wrapAngle(Math.atan2(dx, dz) - this.yaw), -1.0, 1.0);
			pitchT = clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.5, 0.45);
		} else {
			// idle glance around
			yawT = this.editorStill ? 0 : Math.sin(this.time * 0.37 + this.id) * 0.45 * (this.speed < 0.05 ? 1 : 0.3);
			pitchT = this.editorStill ? 0 : Math.sin(this.time * 0.23 + this.id * 2) * 0.12;
		}
		pitchT += this.sniff * 0.35 + this.sit * -0.1;
		this.headYaw.update(yawT, dt);
		this.headPitch.update(pitchT, dt);
	}

	// ------------------------------------------------------------------ chains (verlet)

	private updateChains(dt: number) {
		const P = this.plan;
		const steps = Math.max(1, Math.ceil(dt / (1 / 60)));
		const h = dt / steps;
		const gvec = -9.81;
		const wagA = (0.25 + this.wag * 0.6) * (this.mood === 'happy' ? 1.4 : 1);
		for (let ci = 0; ci < P.chains.length; ci++) {
			const c = P.chains[ci];
			const rt = this.chains[ci];
			const anchor = this.attachSkin(c.anchor, this.v1);
			// rest direction in world, wagging around the body's up axis for tails
			const dir = this.v2.set(c.dir[0], c.dir[1], c.dir[2]);
			if (c.kind === 'tail') dir.applyAxisAngle(this.v3.set(0, 1, 0), Math.sin(this.time * (4 + this.wag * 6)) * wagA * 0.5);
			dir.applyQuaternion(this.boneQuat(c.bone)).normalize();
			const side = this.v3.set(1, 0, 0).applyQuaternion(this.bodyQuat);
			const seg = rt.seg * this.scaleIn;
			if (!this.chainsInit) {
				const d = dir.clone();
				for (let i = 0; i <= c.segments; i++) {
					rt.p[i].copy(anchor).addScaledVector(d, seg * i);
					rt.prev[i].copy(rt.p[i]);
					d.applyAxisAngle(side, c.curl);
				}
			}
			for (let it = 0; it < steps; it++) {
				rt.p[0].copy(anchor);
				rt.prev[0].copy(anchor);
				// rest shape targets
				const d = dir.clone();
				const tgt = anchor.clone();
				for (let i = 1; i <= c.segments; i++) {
					tgt.addScaledVector(d, seg);
					d.applyAxisAngle(side, c.curl);
					const p = rt.p[i];
					const vx = (p.x - rt.prev[i].x) * 0.94,
						vy = (p.y - rt.prev[i].y) * 0.94,
						vz = (p.z - rt.prev[i].z) * 0.94;
					rt.prev[i].copy(p);
					p.x += vx;
					p.y += vy + gvec * h * h * (1 - c.stiffness) * 0.6;
					p.z += vz;
					const k = c.stiffness * 0.35 * (1 - (i / (c.segments + 1)) * 0.6);
					p.lerp(tgt, k);
				}
				// distance constraints
				for (let rep = 0; rep < 3; rep++) {
					for (let i = 1; i <= c.segments; i++) {
						const a = rt.p[i - 1],
							b = rt.p[i];
						const dx = b.x - a.x,
							dy = b.y - a.y,
							dz = b.z - a.z;
						const l = Math.hypot(dx, dy, dz) || 1e-6;
						const diff = (l - seg) / l;
						if (i === 1) b.set(b.x - dx * diff, b.y - dy * diff, b.z - dz * diff);
						else {
							a.set(a.x + dx * diff * 0.5, a.y + dy * diff * 0.5, a.z + dz * diff * 0.5);
							b.set(b.x - dx * diff * 0.5, b.y - dy * diff * 0.5, b.z - dz * diff * 0.5);
						}
					}
					rt.p[0].copy(anchor);
				}
				// ground
				for (let i = 1; i <= c.segments; i++) {
					const p = rt.p[i];
					const r = c.r0 + (c.r1 - c.r0) * (i / c.segments);
					const gy = this.world.ground(p.x, p.z) + r;
					if (p.y < gy) p.y = gy;
				}
			}
			this.chainsInit = true;
		}
		if (!P.chains.length) this.chainsInit = true;
	}

	private bq = new THREE.Quaternion();
	private bs = new THREE.Vector3();
	private bp = new THREE.Vector3();
	private boneQuat(b: number) {
		this.M[b].decompose(this.bp, this.bq, this.bs);
		return this.bq;
	}

	// ------------------------------------------------------------------ eyes

	private ev = new THREE.Vector3();
	private updateEyes(dt: number) {
		const P = this.plan;
		// blink
		this.blinkTimer -= dt;
		if (this.blinkTimer <= 0) {
			this.blink = 1;
			this.blinkTimer = 1.6 + Math.random() * 4.5;
			if (Math.random() < 0.15) this.blinkTimer = 0.25; // double blink
		}
		this.blink = Math.max(0, this.blink - dt * 7);
		const sleepy = this.mood === 'sleepy' ? 0.45 : 0;
		const scared = this.mood === 'scared' ? 1 : 0;
		const closed = Math.max(this.blink > 0.5 ? (1 - this.blink) * 2 : this.blink * 2, sleepy, this.sit * 0.25);
		this.lidOpen = 1 - closed * (1 - scared * 0.6);
		const headQ = this.boneQuat(P.headBone).clone();
		for (let i = 0; i < P.eyes.length; i++) {
			const ep = P.eyes[i];
			const rt = this.eyes[i];
			if (ep.stalk >= 0) {
				const ch = this.chains[ep.stalk];
				const tip = ch.p[ch.p.length - 1];
				rt.world.copy(tip);
				rt.n.subVectors(tip, ch.p[ch.p.length - 2]).normalize();
			} else {
				this.attachSkin(ep.pos, rt.world);
				rt.n.set(ep.n[0], ep.n[1], ep.n[2]).applyQuaternion(headQ).normalize();
			}
			// googly pupil: a particle in the eye's tangent plane pushed by gravity, head acceleration and the gaze
			const vel = this.ev.subVectors(rt.world, rt.prevWorld).divideScalar(Math.max(1e-4, dt));
			const acc = this.v3.subVectors(vel, rt.prevVel).divideScalar(Math.max(1e-4, dt));
			if (rt.prevWorld.lengthSq() === 0) acc.set(0, 0, 0);
			rt.prevVel.copy(vel);
			rt.prevWorld.copy(rt.world);
			// eye frame
			const n = rt.n;
			const right = this.v1.set(0, 1, 0).cross(n);
			if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
			right.normalize();
			const up = this.v2.crossVectors(n, right).normalize();
			const googly = 0.35 + P.personality.googly * 0.65;
			const grav = -9.81 * googly * 0.5;
			let fx = -acc.dot(right) * 0.05 * googly;
			let fy = (grav - acc.dot(up)) * 0.05 * googly;
			// gaze: pupils drift toward the look target (or forward)
			const gazeK = 26 * (1 - googly * 0.5);
			let gx = 0,
				gy = 0;
			if (this.lookTarget) {
				const d = this.ev.subVectors(this.lookTarget, rt.world).normalize();
				gx = clamp(d.dot(right) * 1.4, -1, 1);
				gy = clamp(d.dot(up) * 1.4, -1, 1);
			} else {
				gx = Math.sin(this.time * 0.6 + i) * 0.15;
			}
			fx += (gx - rt.q.x) * gazeK;
			fy += (gy - rt.q.y) * gazeK;
			rt.qv.x += fx * dt;
			rt.qv.y += fy * dt;
			rt.qv.multiplyScalar(Math.exp(-dt * 7));
			rt.q.addScaledVector(rt.qv, dt);
			const len = rt.q.length();
			if (len > 1) {
				rt.q.divideScalar(len);
				// bounce off the rim
				const nx = rt.q.x,
					ny = rt.q.y;
				const vn = rt.qv.x * nx + rt.qv.y * ny;
				if (vn > 0) {
					rt.qv.x -= 1.5 * vn * nx;
					rt.qv.y -= 1.5 * vn * ny;
				}
			}
		}
	}

	// ------------------------------------------------------------------ draw (batches)

	private tubePts: THREE.Vector3[] = [];
	private tubeR: number[] = [];
	private tubeC: Array<[number, number, number]> = [];
	private qa = new THREE.Quaternion();
	private sc = new THREE.Vector3();
	private mtx = new THREE.Matrix4();

	draw(B: Batches) {
		if (!this.visible) return;
		const P = this.plan;
		const pal = P.palette;
		const s = this.scaleIn;
		if (s <= 0.01) return;
		// legs: rounded noodle through hip, knee (rounded corner), hock, foot
		for (let i = 0; i < P.legs.length; i++) {
			const lp = P.legs[i];
			const leg = this.legs[i];
			const pts = this.tubePts;
			pts.length = 0;
			const R0 = lp.thick * s;
			const joints = lp.meta > 0 ? [leg.hip, leg.knee, leg.hock, leg.end] : [leg.hip, leg.knee, leg.end];
			const radii = lp.meta > 0 ? [R0, R0 * 0.82, R0 * 0.62, R0 * 0.55] : [R0, R0 * 0.8, R0 * 0.62];
			this.roundedPolyline(joints, radii, 0.28, pts, this.tubeR);
			this.tubeC.length = 0;
			for (let k = 0; k < pts.length; k++) this.tubeC.push(lerpCol(pal.body, pal.foot, k / (pts.length - 1)));
			B.tubes.tube(pts, this.tubeR, this.tubeC, false);
			// foot: an ellipsoid shoe along the heading, on the ground normal, toe tipping during the swing
			const up = leg.planted ? leg.footN : this.v1.set(0, 1, 0);
			const fwd = this.v2.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
			const right = this.v3.crossVectors(up, fwd).normalize();
			fwd.crossVectors(right, up).normalize();
			this.mtx.makeBasis(right, up, fwd);
			this.qa.setFromRotationMatrix(this.mtx);
			if (!leg.planted) {
				const tip = Math.sin(leg.t * Math.PI) * (leg.t < 0.5 ? -0.5 : 0.35);
				this.qa.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tip));
			}
			const fr = lp.footR * s;
			const c = this.v1.copy(leg.end).addScaledVector(fwd, fr * 0.25);
			B.blobs.add(c, this.qa, this.sc.set(fr * 0.92, fr * 0.62, fr * 1.25), pal.foot);
		}
		// arms: hang and swing against the legs
		for (const a of P.arms) {
			const sh = this.attachSkin(a.shoulder, new THREE.Vector3());
			const swing = Math.sin(TAU * (this.phase + (a.side > 0 ? 0.5 : 0))) * clamp(this.speed / Math.max(0.1, P.walkSpeed), 0, 1.3);
			const wave = this.selected && this.speed < 0.05 && a.side > 0 ? Math.max(0, Math.sin(this.time * 1.3)) : 0;
			const fwd = this.v1.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
			const side = this.v2.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(a.side);
			const len = (a.upper + a.lower) * s;
			const hand = sh.clone().addScaledVector(fwd, swing * len * 0.35 + wave * len * 0.2).addScaledVector(side, len * 0.25 + wave * len * 0.3);
			hand.y += -len * 0.78 * (1 - wave) + wave * len * 0.75;
			const elbow = new THREE.Vector3();
			const end = new THREE.Vector3();
			const pole = this.v3.copy(fwd).multiplyScalar(-1).addScaledVector(side, 0.3);
			solveTwoBone(sh, hand, a.upper * s, a.lower * s, pole, elbow, end);
			const pts = this.tubePts;
			pts.length = 0;
			this.roundedPolyline([sh, elbow, end], [a.thick * s, a.thick * 0.85 * s, a.thick * 0.75 * s], 0.3, pts, this.tubeR);
			this.tubeC.length = 0;
			for (let k = 0; k < pts.length; k++) this.tubeC.push(pal.body);
			B.tubes.tube(pts, this.tubeR, this.tubeC, false);
			this.qa.copy(this.bodyQuat);
			B.blobs.add(end, this.qa, this.sc.setScalar(a.handR * s), pal.foot);
		}
		// chains: tails, antennae, stalks
		for (let ci = 0; ci < P.chains.length; ci++) {
			const c = P.chains[ci];
			const rt = this.chains[ci];
			this.tubeR.length = 0;
			this.tubeC.length = 0;
			const n = rt.p.length;
			for (let k = 0; k < n; k++) {
				const t = k / (n - 1);
				this.tubeR.push((c.r0 + (c.r1 - c.r0) * t) * s);
				this.tubeC.push(c.kind === 'tail' && P.pattern.kind === 'stripes' && k % 3 === 1 ? pal.pattern : c.color);
			}
			B.tubes.tube(rt.p, this.tubeR, this.tubeC, c.tip === 'none');
			if (c.tip === 'ball' || c.tip === 'fluff' || c.tip === 'spade') {
				const tip = rt.p[n - 1];
				const dirv = this.v1.subVectors(tip, rt.p[n - 2]).normalize();
				this.qa.setFromUnitVectors(this.v2.set(0, 0, 1), dirv);
				const r = c.tipR * s;
				const sc = c.tip === 'spade' ? this.sc.set(r * 0.35, r, r * 1.2) : c.tip === 'fluff' ? this.sc.set(r, r, r * 1.15) : this.sc.setScalar(r);
				B.blobs.add(this.v3.copy(tip).addScaledVector(dirv, r * 0.5), this.qa, sc, c.tipColor);
			}
		}
		// eyes: white, googly pupil, lid
		for (let i = 0; i < P.eyes.length; i++) {
			const ep = P.eyes[i];
			const rt = this.eyes[i];
			const r = ep.r * s;
			const n = rt.n;
			const right = this.v1.set(0, 1, 0).cross(n);
			if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
			right.normalize();
			const up = this.v2.crossVectors(n, right).normalize();
			this.mtx.makeBasis(right, up, n);
			this.qa.setFromRotationMatrix(this.mtx);
			const scared = this.mood === 'scared' ? 1.12 : 1;
			B.eyeWhites.add(rt.world, this.qa, this.sc.setScalar(r * scared), [0.95, 0.95, 0.93]);
			// pupil on the sphere, displaced by the googly offset
			const maxA = 0.62;
			const ax = rt.q.x * maxA,
				ay = rt.q.y * maxA;
			const dir = this.v3.copy(n).multiplyScalar(Math.cos(Math.hypot(ax, ay))).addScaledVector(right, Math.sin(ax)).addScaledVector(up, Math.sin(ay)).normalize();
			const pr = r * ep.pupil * (this.mood === 'scared' ? 0.7 : 1);
			const pq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
			// a coloured iris ring around a clean dark pupil
			const ic = rt.world.clone().addScaledVector(dir, r * scared * 0.9);
			B.irises.add(ic, pq, this.sc.set(pr * 1.02, pr * 1.02, pr * 0.3), this.irisColor);
			// the pupil sits just proud of the iris (so it always shows)
			const pc = rt.world.clone().addScaledVector(dir, r * scared * 0.9 + pr * 0.22);
			B.pupils.add(pc, pq, this.sc.set(pr * 0.58, pr * 0.58, pr * 0.16), [0.02, 0.018, 0.025]);
			// one tidy catchlight, fixed up and to the side on the eye (a reflection of the sky)
			// toward the viewer, nudged toward the sun and the sky, and never off the side of the eye
			const gd = this.v3.subVectors(Creature.view, rt.world).normalize().addScaledVector(Creature.sun, 0.35).add(this.glUp).normalize();
			if (gd.dot(n) < 0.35) gd.lerp(n, 0.6).normalize();
			const gq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), gd);
			B.glints.add(rt.world.clone().addScaledVector(gd, r * scared * 0.9 + pr * 0.4), gq, this.sc.set(r * 0.12, r * 0.12, r * 0.03), [1, 1, 1]);
			// lid: a hemisphere hinged on the eye's side axis (open = rolled back over the top)
			const ang = -Math.PI * (0.12 + 0.86 * this.lidOpen);
			const lq = this.qa.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ang));
			B.lids.add(rt.world, lq, this.sc.setScalar(r * scared * 1.07), lerpCol(P.palette.body, P.palette.foot, 0.15));
		}
		this.drawMouth(B);
	}

	/** The resting face: a grin (or a frown) and a slightly open mouth that follow the genes and the mood, with idle
	 * moments: a bigger grin, a tongue peek, a little chew. Actions (eat, sing) drive the mouth instead. */
	private grinS = 0.3;
	private restS = 0.15;
	private faceT = 0;
	private faceEvent: 'none' | 'grin' | 'tongue' | 'chew' = 'none';
	private faceEventT = 0;
	tongueOut = 0;
	private restingFace(dt: number) {
		const P = this.plan.personality;
		const M = this.plan.mouth;
		// grumpy (unsociable) ones frown, sociable ones grin, shy ones keep a small smile
		let grin = P.social < 0.35 ? -0.45 : 0.2 + P.social * 0.55 - P.shy * 0.25;
		let open = 0.17 + P.social * 0.09 + (P.bounce - 1) * 0.05 - P.shy * 0.07;
		if (M?.teeth === 'fangs' || M?.teeth === 'tusks') open += 0.05; // a toothy grin
		if (this.mood === 'happy') {
			grin += 0.3;
			open += 0.06;
		} else if (this.mood === 'sleepy') {
			grin *= 0.4;
			open *= 0.4;
		} else if (this.mood === 'curious') open += 0.04;
		// idle moments
		this.faceT -= dt;
		if (this.faceT <= 0) {
			const r = Math.random();
			this.faceEvent = r < 0.35 ? 'grin' : r < 0.6 ? 'tongue' : r < 0.78 ? 'chew' : 'none';
			this.faceEventT = 0;
			this.faceT = 2.2 + Math.random() * 3.5;
		}
		this.faceEventT += dt;
		const e = this.faceEventT;
		const pulse = Math.max(0, Math.sin(Math.min(1, e / 1.1) * Math.PI));
		let tongue = 0;
		if (this.faceEvent === 'grin') {
			grin += 0.3 * pulse * Math.sign(grin + 0.01);
			open += 0.07 * pulse;
		} else if (this.faceEvent === 'tongue') {
			tongue = pulse;
			open += 0.08 * pulse;
		} else if (this.faceEvent === 'chew' && e < 1) open += 0.07 * Math.abs(Math.sin(e * 14));
		this.grinS = damp(this.grinS, Math.max(-0.6, Math.min(1, grin)), 4, dt);
		this.restS = damp(this.restS, Math.max(0.05, Math.min(0.4, open)), 6, dt);
		this.tongueOut = damp(this.tongueOut, tongue, 8, dt);
		return this.restS;
	}
	/** iris: a deeper, slightly cooler take on the accent colour */
	private get irisColor(): [number, number, number] {
		const a = this.plan.palette.accent;
		return [a[0] * 0.55 + 0.03, a[1] * 0.6 + 0.05, a[2] * 0.62 + 0.08];
	}
	private glUp = new THREE.Vector3(0, 0.25, 0);
	private mw = new THREE.Vector3();
	private mq = new THREE.Quaternion();
	private mn = new THREE.Vector3();
	private mu = new THREE.Vector3();
	private mt = new THREE.Vector3();
	private mp = new THREE.Vector3();
	private mr = new THREE.Quaternion();
	private readonly mz = new THREE.Vector3(0, 0, 1);
	/**
	 * The mouth: a crisp dark interior inside a defined lip edge, curved into a grin (or a frown), with buck teeth,
	 * fangs or tusks and a tongue. At rest it's slightly open and expressive; actions open it wide.
	 */
	private drawMouth(B: Batches) {
		const M = this.plan.mouth;
		if (!M) return;
		const s = this.scaleIn;
		const w = M.w * s;
		const d = w * 0.36;
		const o = this.mouthOpen;
		const q = this.boneQuat(M.bone);
		this.attachSkin(M.p, this.mw);
		this.mn.set(M.n[0], M.n[1], M.n[2]).applyQuaternion(q).normalize();
		this.mu.set(M.up[0], M.up[1], M.up[2]).applyQuaternion(q);
		this.mu.addScaledVector(this.mn, -this.mu.dot(this.mn)).normalize();
		this.mt.crossVectors(this.mu, this.mn).normalize();
		this.mtx.makeBasis(this.mt, this.mu, this.mn);
		this.mq.setFromRotationMatrix(this.mtx);
		this.mouthWorld = (this.mouthWorld ?? new THREE.Vector3()).copy(this.mw);
		// the head curves away from the mouth's centre: pieces off-centre sink with it, so nothing floats off the cheek
		const curve = 1 / (3.6 * w);
		const at = (x: number, y: number, z: number) => this.mp.copy(this.mw).addScaledVector(this.mt, x).addScaledVector(this.mu, y).addScaledVector(this.mn, z - (x * x + y * y * 0.6) * curve);
		const piece = (batch: Batches['blobs'], x: number, y: number, z: number, rx: number, ry: number, rz: number, roll: number, col: [number, number, number]) => {
			this.mr.setFromAxisAngle(this.mz, roll);
			const qq = this.qa.copy(this.mq).multiply(this.mr);
			batch.add(at(x, y, z), qq, this.sc.set(rx, ry, rz), col);
		};
		const lipC = M.lip;
		const inC = M.inside;
		const lipPad = w * 0.045;
		const zIn = M.style === 'beak' ? w * 0.05 : -d * 0.32;
		if (M.style === 'beak') {
			// a beak only shows its mouth when it opens (a dark wedge under the upper bill)
			if (o < 0.08) return;
			const rx = w * 0.85,
				ry = w * (0.05 + 0.4 * o);
			piece(B.blobs, 0, -ry, zIn - d * 0.2, rx + lipPad, ry + lipPad, d * 0.95, 0, lipC);
			piece(B.mouths, 0, -ry, zIn, rx, ry, d, 0, inC);
			if (o > 0.15) piece(B.blobs, 0, -ry * 1.35, zIn + d * 0.25, rx * 0.55, ry * 0.45, d * 0.7, 0, M.tongueColor);
			return;
		}
		// the grin: an upper lip curving up toward the corners (down, for a frown), and an opening that is deepest in
		// the middle and tapers to the corners: a row of overlapping lobes along that curve, so the shape is one smooth crescent
		const g = this.grinS * (1 - Math.min(1, Math.max(0, o - 0.45) * 1.6));
		const wide = M.style === 'open' ? 0.72 : 0.82;
		const rx = w * (wide - 0.08 * o);
		const h0 = w * (0.13 + 1.1 * o);
		const top = w * 0.06;
		const bend = (g * w * 0.32) / (rx * rx);
		const upper = (x: number) => top + bend * x * x - g * w * 0.03;
		const depthAt = (x: number) => h0 * Math.pow(Math.max(0, 1 - (x / (rx * 1.02)) ** 2), 0.65) + w * 0.03;
		const N = 11;
		const step = (2 * rx) / (N - 1);
		const lobes: Array<[number, number, number, number, number]> = [];
		for (let i = 0; i < N; i++) {
			const x = -rx + i * step;
			const hgt = depthAt(x);
			const slope = 2 * bend * x;
			// narrower toward the corners, so the ends are rounded dimples rather than spikes
			lobes.push([x, upper(x) - hgt / 2, step * (1.9 - 1.1 * (x / rx) ** 2), hgt / 2, Math.atan(slope) * 0.8]);
		}
		for (const [x, y, lx, ly, roll] of lobes) piece(B.blobs, x, y, zIn - d * 0.2, lx + lipPad, ly + lipPad, d * 0.9, roll, lipC);
		for (const [x, y, lx, ly, roll] of lobes) piece(B.mouths, x, y, zIn, lx, ly, d, roll, inC);
		const cy = upper(0) - h0 / 2;
		const ry = h0 / 2;
		// the tongue rests low in the opening; now and then it peeks out
		if (M.tongue && o > 0.06) {
			const tr = Math.min(1, (o - 0.06) * 3);
			const peek = this.tongueOut;
			piece(B.blobs, 0, cy - ry * (0.3 + 0.35 * peek), zIn + d * (0.5 * tr + 0.45 * peek), rx * (0.45 + 0.08 * peek), ry * 0.48 + w * 0.05 * peek, d * 0.6, 0, M.tongueColor);
		}
		// teeth
		if (M.teeth === 'buck') {
			for (const sd of [-1, 1]) piece(B.blobs, sd * w * 0.2, upper(sd * w * 0.2) - w * 0.17, zIn + d * 0.62, w * 0.18, w * 0.24, d * 0.34, Math.atan(2 * bend * sd * w * 0.2), M.tooth);
		} else if (M.teeth === 'fangs' || M.teeth === 'tusks') {
			const tusk = M.teeth === 'tusks';
			for (const sd of [-1, 1]) {
				const pts = this.tubePts;
				pts.length = 0;
				this.tubeR.length = 0;
				this.tubeC.length = 0;
				const x0 = sd * rx * (tusk ? 0.85 : 0.6);
				const y0 = upper(x0);
				const L = w * (tusk ? 1.5 : 0.36);
				const n = 6;
				for (let k = 0; k <= n; k++) {
					const t = k / n;
					// fangs hang straight down from the upper lip; tusks sweep out, forward and up
					const x = tusk ? x0 + sd * L * 0.35 * t : x0;
					const y = tusk ? y0 - w * 0.05 - L * 0.25 * Math.sin(t * Math.PI * 0.9) + L * 0.55 * t * t : y0 + w * 0.02 - L * t;
					const z = tusk ? zIn + d * 0.7 + L * 0.6 * t : zIn + d * 0.75;
					pts.push(at(x, y, z).clone());
					this.tubeR.push(w * (tusk ? 0.19 : 0.09) * (1 - t * 0.85) * (k === n ? 0.6 : 1));
					this.tubeC.push(M.tooth);
				}
				B.tubes.tube(pts, this.tubeR, this.tubeC, true);
			}
			// a toothy grin also shows a row of small upper teeth between the fangs
			if (!tusk && o > 0.12)
				for (let i = -1; i <= 1; i++) piece(B.blobs, i * w * 0.2, upper(i * w * 0.2) - w * 0.06, zIn + d * 0.55, w * 0.075, w * 0.08, d * 0.3, 0, M.tooth);
		}
	}

	/** Polyline through joints with rounded corners (quadratic corners), output points and radii. */
	private roundedPolyline(j: THREE.Vector3[], r: number[], round: number, pts: THREE.Vector3[], rad: number[]) {
		pts.length = 0;
		rad.length = 0;
		const push = (p: THREE.Vector3, rr: number) => {
			pts.push(p);
			rad.push(rr);
		};
		push(j[0].clone(), r[0]);
		for (let k = 1; k < j.length - 1; k++) {
			const a = j[k - 1],
				b = j[k],
				c = j[k + 1];
			const p0 = new THREE.Vector3().lerpVectors(b, a, round);
			const p2 = new THREE.Vector3().lerpVectors(b, c, round);
			const r0 = r[k] + (r[k - 1] - r[k]) * round,
				r2 = r[k] + (r[k + 1] - r[k]) * round;
			// straight part then the rounded corner
			const n = 4;
			for (let s = 0; s <= n; s++) {
				const t = s / n;
				const u = 1 - t;
				const p = new THREE.Vector3()
					.addScaledVector(p0, u * u)
					.addScaledVector(b, 2 * u * t)
					.addScaledVector(p2, t * t);
				push(p, r0 * u * u + r[k] * 2 * u * t + r2 * t * t);
			}
		}
		push(j[j.length - 1].clone(), r[r.length - 1]);
	}

	/** World position of a chain's tip (tails, antennae, stalks), or null. */
	chainTip(kind: 'tail' | 'antenna' | 'stalk'): THREE.Vector3 | null {
		const i = this.plan.chains.findIndex((c) => c.kind === kind);
		if (i < 0 || !this.chains[i]) return null;
		const p = this.chains[i].p;
		return p[p.length - 1];
	}

	/** Bounding sphere centre (world) for culling and picking. */
	center(out: THREE.Vector3) {
		return out.copy(this.bodyPos);
	}
}

export function lerpCol(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
