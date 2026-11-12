// Real stats: measured by running the creature's own locomotion on flat ground, plus its measured body.
//   speed    top speed reached in a 4 s run (m/s)
//   agility  turning speed from a standing 180° turn (deg/s)
//   jump     hop apex for hoppers (measured), otherwise the step height the herd AI lets it climb (0.75 leg)
//   stamina  share of feet on the ground while trotting along (support: more legs and longer stances tire less)
//   size     height, length and mass (body mesh volume x a squishy 600 kg/m3)
import * as THREE from 'three';
import type { Plan } from './build';
import { Creature, type WorldQuery } from './creature';

const FLAT: WorldQuery = {
	ground(_x: number, _z: number, n?: THREE.Vector3) {
		n?.set(0, 1, 0);
		return 0;
	},
	water() {
		return -1;
	},
};

export interface Stats {
	speed: number;
	agility: number;
	jump: number;
	stamina: number;
	height: number;
	length: number;
	width: number;
	legSpan: number;
	mass: number;
	volume: number;
}

/** Signed-tetrahedron volume of a closed mesh (m^3). */
export function meshVolume(g: THREE.BufferGeometry): number {
	const p = g.attributes.position as THREE.BufferAttribute;
	const idx = g.index!;
	let v = 0;
	const a = new THREE.Vector3(),
		b = new THREE.Vector3(),
		c = new THREE.Vector3();
	for (let i = 0; i < idx.count; i += 3) {
		a.fromBufferAttribute(p, idx.getX(i));
		b.fromBufferAttribute(p, idx.getX(i + 1));
		c.fromBufferAttribute(p, idx.getX(i + 2));
		v += a.dot(b.clone().cross(c)) / 6;
	}
	return Math.abs(v);
}

export function measureStats(plan: Plan, geo: THREE.BufferGeometry | null): Stats {
	const dt = 1 / 60;
	// speed: run straight for 4 s, measure the last 2 s
	const c = new Creature(plan, FLAT, 0, 0, 0);
	c.intentDir.set(0, 1);
	c.intentSpeed = plan.runSpeed * 2;
	let z0 = 0;
	let hopApex = 0;
	let planted = 0,
		samples = 0;
	for (let f = 0; f < 240; f++) {
		c.update(dt);
		if (f === 120) z0 = c.pos.z;
		if (f > 120) hopApex = Math.max(hopApex, c.bodyPos.y - plan.height);
	}
	const speed = (c.pos.z - z0) / 2;
	// stamina: trot at walking speed
	const w = new Creature(plan, FLAT, 0, 0, 0);
	w.intentDir.set(0, 1);
	w.intentSpeed = plan.walkSpeed * 1.2;
	for (let f = 0; f < 240; f++) {
		w.update(dt);
		if (f > 60 && w.legs.length) {
			planted += w.legs.filter((l) => l.planted).length / w.legs.length;
			samples++;
		}
	}
	const support = samples ? planted / samples : 0.5;
	const stamina = Math.min(1, support * (0.75 + 0.25 * Math.min(1, w.legs.length / 6)) * 1.15);
	// agility: standing 180° turn
	const t = new Creature(plan, FLAT, 0, 0, 0);
	t.faceTarget = new THREE.Vector3(0.0001, 0, -5);
	let turnT = 4;
	for (let f = 0; f < 240; f++) {
		t.update(dt);
		if (Math.abs(Math.abs(t.yaw) - Math.PI) < 0.12) {
			turnT = (f + 1) * dt;
			break;
		}
	}
	const agility = 180 / turnT;
	// body measurements from the rest mesh and the leg plan
	let height = plan.top,
		length = plan.footprint[1] * 2,
		width = plan.footprint[0] * 2;
	let volume = (4 / 3) * Math.PI * plan.R ** 3;
	if (geo) {
		geo.computeBoundingBox();
		const bb = geo.boundingBox!;
		height = bb.max.y;
		length = bb.max.z - bb.min.z;
		width = bb.max.x - bb.min.x;
		volume = meshVolume(geo);
	}
	for (const ch of plan.chains) if (ch.kind === 'tail') length += ch.length * Math.max(0, -ch.dir[2]) * 0.8;
	let legSpan = 0;
	for (const l of plan.legs) legSpan = Math.max(legSpan, Math.abs(l.foot[0]) * 2 + l.footR * 2);
	const jump = plan.gait.hop ? Math.max(hopApex, 0.02) : (plan.legLength || plan.R) * 0.75;
	return { speed, agility, jump, stamina, height, length, width, legSpan, mass: volume * 600, volume };
}

/** Ability scores from the parts (0..1), shown as live stats in the editor and the Lab. */
export function abilityStats(plan: Plan, s: Stats) {
	const t = plan.traits.join(' ');
	const head = plan.parts.find((p) => p.tag === 'head' || p.tag === 'seg0');
	const headR = head?.r ? Math.max(...head.r) : plan.R;
	const mouthK = t.includes('carnivore') || t.includes('tusks') ? 1 : t.includes('omnivore') || t.includes('open') ? 0.7 : 0.45;
	const fangs = plan.parts.filter((p) => p.tag === 'fang' || p.tag === 'tusk').length;
	const bite = Math.min(1, mouthK * (0.35 + Math.min(1, headR / 0.5) * 0.45) + fangs * 0.05);
	const eyes = plan.eyes.length;
	const eyeScore = eyes === 0 ? 0 : Math.min(1, (Math.min(eyes, 2) * 0.3 + Math.min(1, plan.eyes.reduce((m, e) => m + e.r, 0) / Math.max(0.05, headR)) * 0.3));
	const flair = Math.min(0.35, plan.parts.filter((p) => ['frill', 'horn', 'spike', 'wing'].includes(p.tag)).length * 0.03);
	const charm = Math.min(1, eyeScore + flair + plan.personality.social * 0.2 + (plan.pattern.kind !== 'none' ? 0.08 : 0));
	const wingArea = plan.parts.filter((p) => p.tag === 'wing').reduce((m, p) => m + Math.PI * p.r![0] * p.r![2], 0);
	const glide = Math.min(1, wingArea / Math.max(0.02, Math.pow(s.volume, 2 / 3) * 1.2));
	return { bite, charm, glide };
}
