// Everyone on the island is an Actor: the child's creature, the friends walking with it, and the wild ones.
// An actor has a body, a brain state and what its parts let it do. Nobody has health: nothing here can be hurt.
import type { Creature } from '../creature/creature';
import type { Entry } from '../creature/herd';
import * as THREE from 'three';
import { type Abilities, abilitiesOf, type SocialId } from './abilities';
import type { Nest } from './island';
import type { Species } from './species';

export type AIState = 'idle' | 'wander' | 'graze' | 'greet' | 'follow' | 'encounter' | 'home' | 'player' | 'roam' | 'nap';

let NEXT = 1;

export class Actor {
	readonly id = NEXT++;
	readonly abil: Abilities;
	state: AIState = 'idle';
	timer = 1 + Math.random() * 2;
	readonly target = new THREE.Vector3();
	/** 0..1 how aware it is of the child's creature */
	aware = 0;
	greetCd = 0;
	/** walking with the child's creature */
	ally = false;
	young = false;
	/** which side it walks on */
	slot = 0;

	constructor(
		readonly e: Entry,
		readonly sp: Species | null,
		public home: Nest | null,
		readonly team: 'player' | 'wild',
	) {
		this.abil = abilitiesOf(e.c.plan);
	}

	get c(): Creature {
		return this.e.c;
	}
	get size() {
		return this.e.c.plan.size;
	}
	/** reach of the body, for "close enough" tests */
	get bodyR() {
		const P = this.e.c.plan;
		return Math.max(P.R * 1.15, Math.max(P.footprint[0], P.footprint[1]) * 0.9);
	}
	/** hatched and out of its egg */
	get alive() {
		return this.e.egg <= 0;
	}
	/** how good it is at a move; the child's creature can always do every move a little */
	social(m: SocialId) {
		return Math.max(this.team === 'player' ? 1 : 0, this.abil.level[m]);
	}
}
