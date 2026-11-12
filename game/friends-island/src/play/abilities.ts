// What a body can do comes from its parts. Only friendly things are left: four ways to say hello (sing, dance,
// smile, pose) and three ways to move (speed, jump, glide).
//   throat  sing            feet, plain tail  dance        frills, fluffy tail, big eyes  smile (charm)
//   horns   pose            legs  speed and jump           wings  glide
// Bigger parts and mirrored pairs give more levels; several parts add up, capped at 5. The player's creature can
// always do all four hellos (level 1 at least), so no child is ever locked out of making a friend.
import type { Plan } from '../creature/build';
import { designFromPlan } from '../creature/codes';
import { decodeDesign, type DPart, isDesignCode } from '../creature/design';

export type SocialId = 'sing' | 'dance' | 'charm' | 'pose';
export type AbilityId = SocialId | 'speed' | 'jump' | 'glide';
export const SOCIAL: SocialId[] = ['sing', 'dance', 'charm', 'pose'];

const svg = (body: string) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#23263a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const MOVE: Record<SocialId | 'jump', { color: string; icon: string }> = {
	sing: { color: '#4d8bff', icon: svg('<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5" fill="#4d8bff"/><circle cx="16.5" cy="16" r="2.5" fill="#4d8bff"/>') },
	dance: { color: '#b48cff', icon: svg('<circle cx="12" cy="5" r="2.5" fill="#b48cff"/><path d="M12 8v6l-4 6M12 14l4 6M6 10l6-1 6 3"/>') },
	charm: { color: '#ff6fa8', icon: svg('<circle cx="12" cy="12" r="9" fill="#ffd0e2"/><path d="M8 14c1.2 1.8 2.6 2.6 4 2.6s2.8-.8 4-2.6"/><circle cx="9" cy="10" r=".8" fill="#23263a"/><circle cx="15" cy="10" r=".8" fill="#23263a"/>') },
	pose: { color: '#ffd23f', icon: svg('<path d="M12 21v-7M12 14l-5 6M12 14l5 6M5 8l7 3 7-3"/><circle cx="12" cy="5" r="2.5" fill="#ffd23f"/>') },
	jump: { color: '#31cbb9', icon: svg('<path d="M12 20V6M7 11l5-5 5 5"/><path d="M6 21h12"/>') },
};

export interface Abilities {
	level: Record<AbilityId, number>;
}

const cache = new Map<string, Abilities>();

/** How much one part gives: size 0.7 -> 1 level, 1 -> 1.7, 1.5 -> 2.8; a mirrored pair a quarter more. */
const partLevel = (p: DPart) => Math.max(1, Math.min(3.5, 1 + (p.k - 0.7) * 2.2)) * (p.m ? 1.25 : 1);

export function abilitiesOf(plan: Plan): Abilities {
	const hit = cache.get(plan.code);
	if (hit) return hit;
	const d = isDesignCode(plan.code) ? decodeDesign(plan.code) : designFromPlan(plan);
	const raw: Partial<Record<AbilityId, number>> = {};
	const give = (id: AbilityId, v: number) => {
		raw[id] = (raw[id] ?? 0) + v;
	};
	for (const p of d.parts) {
		const L = partLevel(p);
		switch (p.t) {
			case 'leg':
				if (p.v === 'digi') {
					give('jump', L);
					give('speed', L * 0.6);
				} else {
					give('speed', L * (p.v === 'insect' ? 0.9 : 1));
					give('jump', L * 0.35);
				}
				break;
			case 'wing':
				give('glide', L + 0.3);
				break;
			case 'frill':
				give('charm', L + 0.5);
				break;
			case 'horn':
				give('pose', L + 0.3);
				break;
			case 'throat':
				give('sing', L + 0.5);
				break;
			case 'foot':
				give('dance', L + 0.5);
				break;
			case 'tail':
				if (p.v === 'fluff') give('charm', L * 0.8);
				else give('dance', L * 0.8);
				break;
			case 'eye':
				if (p.k > 1.2) give('charm', 0.5);
				break;
			case 'stalk':
				give('charm', 0.5);
				break;
		}
	}
	const level = {} as Record<AbilityId, number>;
	for (const id of ['sing', 'dance', 'charm', 'pose', 'speed', 'jump', 'glide'] as AbilityId[]) level[id] = Math.max(0, Math.min(5, Math.round(raw[id] ?? 0)));
	const a: Abilities = { level };
	cache.set(plan.code, a);
	return a;
}
