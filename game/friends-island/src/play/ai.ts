// Wild brains, one per temperament, plus the friends walking with you. Every brain only sets intents (direction,
// speed, where to look, which move to play); the procedural gait does the walking, so feet never slide.
//   shy      grazes near its nest; stops and watches you, a little bashful, and lets you come close
//   curious  trots over to look at you, keeps a polite distance, copies your moves
//   proud    stands tall on its hill and strikes a pose when you visit
//   zippy    a little gang that zooms around the island together and hops when it sees you
//   sleepy   sits by the pond, croaks a tune now and then
//   giant    walks a slow circuit of the island; stops and looks down kindly when you come near
// Nobody chases, threatens or runs away in fright.
import * as THREE from 'three';
import type { Actor } from './actors';
import type { Play } from './play';

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const flat = (a: THREE.Vector3, b: THREE.Vector3) => Math.hypot(a.x - b.x, a.z - b.z);

export function go(pl: Play, a: Actor, dx: number, dz: number, speed: number) {
	const c = a.c;
	const d = tmp.set(dx, 0, dz);
	if (d.lengthSq() < 1e-8 || speed <= 0) {
		c.intentSpeed = 0;
		return;
	}
	d.normalize();
	pl.herd.avoid(c, d);
	c.intentDir.set(d.x, d.z).normalize();
	c.intentSpeed = speed;
}

export function goTo(pl: Play, a: Actor, p: THREE.Vector3, speed: number, stop: number) {
	const d = flat(a.c.pos, p);
	if (d < stop) {
		a.c.intentSpeed = 0;
		return true;
	}
	go(pl, a, p.x - a.c.pos.x, p.z - a.c.pos.z, d < stop * 2 ? speed * 0.6 : speed);
	return false;
}

function pickWander(pl: Play, a: Actor, range: number) {
	const h = a.home ?? { x: a.c.pos.x, z: a.c.pos.z };
	for (let k = 0; k < 16; k++) {
		const ang = Math.random() * Math.PI * 2;
		const r = Math.sqrt(Math.random()) * range;
		const x = h.x + Math.cos(ang) * r,
			z = h.z + Math.sin(ang) * r;
		if (pl.world.isOpen(x, z, a.c.plan.R + 0.4)) {
			a.target.set(x, 0, z);
			return;
		}
	}
	a.target.set(h.x, 0, h.z);
}

export function think(pl: Play, a: Actor, dt: number) {
	const c = a.c;
	const sp = a.sp;
	if (!sp) return;
	a.timer -= dt;
	a.greetCd -= dt;
	c.sitTarget = 0;
	c.faceTarget = null;
	c.crouch = 0;
	if (a.state === 'encounter') return;
	if (a.ally) return thinkAlly(pl, a);
	const P = c.plan;
	const me = pl.player;
	const dP = me.alive ? flat(c.pos, me.c.pos) : 1e9;
	const friendly = pl.allied.has(sp.id);
	a.aware = Math.max(0, Math.min(1, a.aware + (dP < sp.notice ? dt * 2.2 : -dt * 0.4)));

	if (a.state === 'home') {
		// sent to wait: back to its own nest, then life as usual
		const h = a.home;
		if (!h || goTo(pl, a, tmp2.set(h.x + Math.cos(a.id * 2.4) * (h.r + 0.6 + P.R), 0, h.z + Math.sin(a.id * 2.4) * (h.r + 0.6 + P.R)), P.walkSpeed * 1.2, 0.6 + P.R) || a.timer <= 0) {
			a.state = 'idle';
			a.timer = 1;
		}
		return;
	}

	// friends come over to say hello now and then
	if (friendly && sp.temper !== 'giant') {
		if (a.state === 'greet') {
			c.mood = 'happy';
			c.wag = 1;
			c.lookTarget = me.c.headPos;
			if (goTo(pl, a, me.c.pos, P.walkSpeed * 1.5, 1.2 + a.bodyR + me.bodyR) || a.timer <= 0) {
				if (a.timer > 0) {
					c.jump(Math.max(0.06, (P.legLength || P.R) * 0.25));
					pl.sound('voice', a, 0.6);
					pl.game.fx.love(c.headPos, P.size);
				}
				a.state = 'idle';
				a.timer = 2;
				a.greetCd = 45 + Math.random() * 30;
			}
			return;
		}
		if (dP < 8 && a.greetCd <= 0 && pl.encounter.active === null) {
			a.state = 'greet';
			a.timer = 6;
			return;
		}
	}

	switch (sp.temper) {
		case 'shy': {
			if (!friendly && a.aware > 0.5 && dP < sp.notice) {
				// stands still and watches, peeking; it never runs away
				c.intentSpeed = 0;
				c.lookTarget = me.c.headPos;
				c.faceTarget = dP < 5 ? me.c.pos : null;
				c.mood = 'curious';
				return;
			}
			break;
		}
		case 'curious': {
			if (!friendly && a.aware > 0.4 && dP < sp.notice * 1.4 && dP > 1) {
				c.lookTarget = me.c.headPos;
				c.mood = 'curious';
				const keep = 2.6 + a.bodyR + me.bodyR;
				if (dP > keep + 1.5) go(pl, a, me.c.pos.x - c.pos.x, me.c.pos.z - c.pos.z, Math.min(P.runSpeed * 0.7, P.walkSpeed * 1.6));
				else {
					c.intentSpeed = 0;
					c.faceTarget = me.c.pos;
				}
				// copy the moves the child shows
				if (pl.lastMove && performance.now() - pl.lastMove.at < 900 && performance.now() - pl.lastMove.at > 400 && !c.action && a.timer < 0) {
					c.act(pl.lastMove.move);
					a.timer = 2;
				}
				return;
			}
			break;
		}
		case 'proud': {
			if (a.aware > 0.5 && dP < sp.notice) {
				// shows off: stands tall and poses for the visitor
				c.intentSpeed = 0;
				c.faceTarget = me.c.pos;
				c.lookTarget = me.c.headPos;
				c.mood = 'happy';
				if (!c.action && a.timer <= 0) {
					c.act('pose');
					a.timer = 2.5 + Math.random() * 2;
				}
				return;
			}
			break;
		}
		case 'zippy': {
			if (a.aware > 0.6 && dP < sp.notice * 0.7) {
				// stops for a visitor, bouncing on the spot
				c.intentSpeed = 0;
				c.faceTarget = me.c.pos;
				c.lookTarget = me.c.headPos;
				c.mood = 'happy';
				if (!c.action && !c.airborne && a.timer <= 0) {
					c.jump(Math.max(0.08, (P.legLength || P.R) * 0.3));
					a.timer = 1.2 + Math.random() * 1.5;
				}
				return;
			}
			// zoom about with the gang: the first one leads, the others trail it
			const lead = pl.actors.find((m) => m.sp === sp && !m.ally && m.state !== 'encounter' && m.state !== 'home');
			if (lead && lead !== a) {
				const keep = 1.8 + a.bodyR * 2;
				const d = flat(c.pos, lead.c.pos);
				if (d > keep) go(pl, a, lead.c.pos.x - c.pos.x + Math.cos(a.id) * 1.2, lead.c.pos.z - c.pos.z + Math.sin(a.id) * 1.2, d > keep * 3 ? P.runSpeed * 0.8 : P.walkSpeed * 1.2);
				else c.intentSpeed = 0;
				c.mood = 'calm';
				return;
			}
			if (a.state !== 'roam' || a.timer <= 0 || flat(c.pos, a.target) < 1 + P.R) {
				a.state = 'roam';
				a.timer = 12;
				pickWander(pl, a, sp.range);
			}
			go(pl, a, a.target.x - c.pos.x, a.target.z - c.pos.z, P.walkSpeed * 1.5);
			return;
		}
		case 'sleepy': {
			if (a.state === 'nap') {
				c.intentSpeed = 0;
				c.sitTarget = 1;
				c.mood = dP < sp.notice ? 'curious' : 'sleepy';
				c.lookTarget = dP < sp.notice ? me.c.headPos : null;
				// a croaky little tune from the pond
				if (!c.action && Math.random() < dt * 0.12) {
					c.act('sing', 1.2);
					if (dP < 22) pl.sound('croak', a, 0.35);
				}
				if (a.timer <= 0) {
					a.state = 'idle';
					a.timer = 1;
					c.mood = 'calm';
				}
				return;
			}
			if (a.state === 'idle' && a.timer <= 0 && Math.random() < 0.6) {
				a.state = 'nap';
				a.timer = 8 + Math.random() * 10;
				return;
			}
			break;
		}
		case 'giant':
			return thinkGiant(pl, a, dP);
	}

	// grazing life: wander near home, stop to nibble, idle and look around
	switch (a.state) {
		case 'wander': {
			if (goTo(pl, a, a.target, P.walkSpeed * 0.9, 0.6 + P.R) || a.timer <= 0) {
				a.state = Math.random() < 0.5 ? 'graze' : 'idle';
				a.timer = 2 + Math.random() * 4;
			}
			c.mood = 'calm';
			return;
		}
		case 'graze': {
			c.intentSpeed = 0;
			if (!c.action && Math.random() < dt * 0.5) c.act('eat', 1.6);
			if (a.timer <= 0) {
				a.state = 'idle';
				a.timer = 1 + Math.random() * 2;
			}
			return;
		}
		default: {
			c.intentSpeed = 0;
			if (a.state !== 'idle') {
				a.state = 'idle';
				a.timer = 1 + Math.random() * 2;
			}
			if (dP < 6) c.lookTarget = me.c.headPos;
			if (a.timer <= 0) {
				a.state = 'wander';
				a.timer = 12;
				pickWander(pl, a, sp.range);
				// stay with the group
				const mates = pl.actors.filter((m) => m.sp === sp && m !== a && !m.ally);
				if (mates.length && Math.random() < 0.6) {
					const cx = mates.reduce((s, m) => s + m.c.pos.x, 0) / mates.length,
						cz = mates.reduce((s, m) => s + m.c.pos.z, 0) / mates.length;
					a.target.x = a.target.x * 0.5 + cx * 0.5;
					a.target.z = a.target.z * 0.5 + cz * 0.5;
				}
			}
		}
	}
}

function thinkGiant(pl: Play, a: Actor, dP: number) {
	const c = a.c;
	const P = c.plan;
	const me = pl.player;
	// a visitor: stop, lower the head and look at them kindly (so a small creature can walk right up)
	if (me.alive && dP < a.sp!.notice + a.bodyR) {
		c.intentSpeed = 0;
		c.faceTarget = dP > a.bodyR + 1 ? me.c.pos : null;
		c.lookTarget = me.c.headPos;
		c.mood = 'happy';
		c.wag = 1;
		return;
	}
	c.mood = 'calm';
	// a slow circuit around the island
	if (a.state !== 'roam' || flat(c.pos, a.target) < 2 + P.R || a.timer <= 0) {
		a.state = 'roam';
		a.timer = 30;
		const ang = Math.atan2(c.pos.z, c.pos.x) + 0.55;
		const r = 34 + Math.sin(ang * 3) * 6;
		const x = Math.cos(ang) * r,
			z = Math.sin(ang) * r;
		a.target.set(x, 0, z);
		if (!pl.world.isOpen(x, z, 2)) a.target.set(x * 0.8, 0, z * 0.8);
	}
	go(pl, a, a.target.x - c.pos.x, a.target.z - c.pos.z, P.walkSpeed * 0.7);
	c.lookTarget = dP < 24 ? me.c.headPos : null;
}

function thinkAlly(pl: Play, a: Actor) {
	const c = a.c;
	const P = c.plan;
	const me = pl.player;
	c.mood = 'happy';
	if (!me.alive) {
		c.intentSpeed = 0;
		return;
	}
	const side = a.slot === 0 ? 1 : -1;
	const fx = Math.sin(me.c.yaw),
		fz = Math.cos(me.c.yaw);
	if (pl.encounter.active) {
		// stand beside you and watch the show
		const spot = tmp2.set(me.c.pos.x - fx * 1.2 + fz * side * (1.4 + a.bodyR * 2), 0, me.c.pos.z - fz * 1.2 - fx * side * (1.4 + a.bodyR * 2));
		if (goTo(pl, a, spot, P.walkSpeed * 1.4, 0.5)) {
			c.faceTarget = pl.encounter.active.partner.c.pos;
			c.lookTarget = pl.encounter.active.partner.c.headPos;
		}
		return;
	}
	// follow: a little behind and to the side, matching your pace
	const back = 1.4 + a.bodyR + me.bodyR + a.slot * 0.8;
	const spot = tmp2.set(me.c.pos.x - fx * back + fz * side * (1 + a.bodyR), 0, me.c.pos.z - fz * back - fx * side * (1 + a.bodyR));
	const d = flat(c.pos, spot);
	// fallen far behind and out of sight: it catches up from just off-screen and runs back into view
	if (d > 40 || (d > 9 && !c.visible)) {
		pl.catchUp(a);
		return;
	}
	const speed = d > 6 ? P.runSpeed : d > 2 ? Math.max(P.walkSpeed * 1.2, me.c.speed * 1.05) : me.c.speed > 0.1 ? me.c.speed : 0;
	if (d > 0.7) go(pl, a, spot.x - c.pos.x, spot.z - c.pos.z, speed);
	else {
		c.intentSpeed = 0;
		c.lookTarget = me.c.headPos;
	}
	if (me.c.action === 'jump' && !c.action && Math.random() < 0.02) c.jump();
}
