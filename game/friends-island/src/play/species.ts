// The island's creatures, built in the design format (a spine and parts), each with a gentle temperament, and the
// bodies a child can pick for their own creature. Nobody on the island bites, hunts or chases.
import { type Design, type DPart, encodeDesign, normalise, type PartType } from '../creature/design';
import type { SpeciesKey } from '../i18n';
import type { Look } from '../save';
import type { SocialId } from './abilities';

export type Temper = 'shy' | 'curious' | 'proud' | 'zippy' | 'sleepy' | 'giant';

export interface Species {
	id: SpeciesKey;
	temper: Temper;
	/** members around the nest */
	count: number;
	/** preferred nest spot (searched for open, gentle ground nearby) */
	nest: [number, number];
	/** how far they roam from the nest */
	range: number;
	/** how close you can get before they look up */
	notice: number;
	/** the moves it shows when you say hello */
	moves: SocialId[];
	/** right answers it takes to become friends */
	hearts: number;
	design: Design;
}

const P = (t: PartType, s: number, a: number, b: number, k: number, m: boolean, v = '', r = 0): DPart => ({ t, s, a, b, k, m, v, r });
const D = (name: string, size: number, fat: number, spine: Array<[number, number, number]>, parts: DPart[], paint: Design['paint'], pers: Partial<Design['personality']> = {}): Design =>
	normalise({
		v: 1,
		name,
		size,
		fat,
		spine: spine.map(([z, y, r]) => ({ z, y, r })),
		parts,
		paint,
		personality: { speed: 1, bounce: 1, googly: 0.5, shy: 0.4, social: 0.6, curious: 0.5, ...pers },
	});

export const SPECIES: Species[] = [
	{
		id: 'puff',
		temper: 'shy',
		count: 5,
		nest: [20, 16],
		range: 12,
		notice: 7,
		moves: ['sing', 'charm'],
		hearts: 4,
		design: D(
			'Puff',
			0.55,
			1.2,
			[
				[-0.45, 0, 1.15],
				[0.7, 0.35, 0.95],
			],
			[
				P('eye', 1, 0.42, 0.3, 1.45, true),
				P('mouth', 1, 0, -0.45, 0.9, false, 'herb'),
				P('throat', 1, 0, -1.0, 0.85, false, 'song'),
				P('leg', 0, 0.75, -1.0, 0.75, true, 'straight'),
				P('leg', 0, 2.3, -1.0, 0.75, true, 'straight'),
				P('tail', 0, Math.PI, 0.35, 1.25, false, 'fluff'),
			],
			{ base: 3, accent: 2, pattern: 11, kind: 'patches', scale: 0.5 },
			{ shy: 0.95, social: 0.9, bounce: 1.2, googly: 0.8, curious: 0.2 },
		),
	},
	{
		id: 'bobble',
		temper: 'curious',
		count: 4,
		nest: [-8, -14],
		range: 14,
		notice: 12,
		moves: ['dance', 'sing'],
		hearts: 5,
		design: D(
			'Bobble',
			0.7,
			0.95,
			[
				[-0.2, 0, 1.0],
				[0.15, 1.15, 0.85],
			],
			[
				P('stalk', 1, 0.35, 1.1, 1.1, true),
				P('mouth', 1, 0, -0.3, 1.0, false, 'herb'),
				P('throat', 1, 0, -0.9, 0.8, false, 'song'),
				P('leg', 0, 1.4, -1.0, 1.15, true, 'digi'),
				P('foot', 0, 0, 0, 1.25, false, 'paw'),
				P('tail', 0, Math.PI, 0.1, 1.2, false, 'plain'),
			],
			{ base: 8, accent: 10, pattern: 11, kind: 'stripes', scale: 0.45 },
			{ bounce: 1.5, curious: 1, shy: 0.1, social: 0.9, googly: 0.9 },
		),
	},
	{
		id: 'ram',
		temper: 'proud',
		count: 4,
		nest: [-24, 14],
		range: 11,
		notice: 9,
		moves: ['pose', 'dance'],
		hearts: 5,
		design: D(
			'Curly',
			1.25,
			1.05,
			[
				[-1.0, 0, 1.0],
				[0.1, 0.12, 1.1],
				[1.1, 0.35, 0.8],
			],
			[
				P('eye', 2, 0.6, 0.35, 0.95, true),
				P('mouth', 2, 0, -0.4, 1.05, false, 'herb'),
				P('horn', 2, 0.5, 0.9, 1.3, true, 'curl', 0.2),
				P('leg', 0, 1.0, -1.0, 1.0, true, 'straight'),
				P('leg', 1, 1.0, -1.0, 1.0, true, 'straight'),
				P('foot', 0, 0, 0, 1.1, false, 'hoof'),
				P('tail', 0, Math.PI, 0.3, 0.8, false, 'fluff'),
			],
			{ base: 11, accent: 1, pattern: 1, kind: 'gradient', scale: 0.6 },
			{ shy: 0.1, social: 0.8, bounce: 0.7, googly: 0.4, curious: 0.4 },
		),
	},
	{
		id: 'zippy',
		temper: 'zippy',
		count: 3,
		nest: [-30, -22],
		range: 22,
		notice: 11,
		moves: ['dance', 'pose'],
		hearts: 5,
		design: D(
			'Zippy',
			0.8,
			0.9,
			[
				[-1.0, -0.1, 0.85],
				[0.05, 0.25, 1.0],
				[1.15, 0.7, 0.9],
			],
			[
				P('eye', 2, 0.55, 0.45, 1.1, true),
				P('mouth', 2, 0, -0.3, 1.0, false, 'herb'),
				P('horn', 2, 0.35, 1.1, 0.7, true, 'straight', -0.3),
				P('leg', 1, 1.3, -0.95, 1.15, true, 'digi'),
				P('foot', 0, 0, 0, 1.0, false, 'paw'),
				P('tail', 0, Math.PI, 0.15, 1.35, false, 'plain'),
			],
			{ base: 1, accent: 7, pattern: 11, kind: 'stripes', scale: 0.4 },
			{ shy: 0.05, social: 0.8, bounce: 1.1, googly: 0.6, curious: 0.7, speed: 1.2 },
		),
	},
	{
		id: 'croaky',
		temper: 'sleepy',
		count: 3,
		nest: [28, -22],
		range: 7,
		notice: 6,
		moves: ['sing', 'charm'],
		hearts: 5,
		design: D(
			'Croaky',
			0.95,
			1.35,
			[
				[-0.3, 0, 1.2],
				[0.75, 0.15, 1.0],
			],
			[
				P('eye', 1, 0.55, 0.75, 1.3, true),
				P('mouth', 1, 0, -0.2, 1.3, false, 'herb'),
				P('throat', 1, 0, -0.85, 1.1, false, 'song'),
				P('frill', 1, 0, 0.7, 0.8, false),
				P('leg', 0, 1.0, -1.0, 0.8, true, 'insect'),
				P('leg', 0, 2.1, -1.0, 0.8, true, 'insect'),
				P('tail', 0, Math.PI, -0.1, 0.7, false, 'plain'),
			],
			{ base: 4, accent: 2, pattern: 5, kind: 'spots', scale: 0.7 },
			{ shy: 0.3, social: 0.5, bounce: 0.6, googly: 0.7, curious: 0.2, speed: 0.8 },
		),
	},
];

/** The giant: huge, slow and gentle. It walks a quiet circuit of the island and stops to look at you. */
export const GIANT: Species = {
	id: 'giant',
	temper: 'giant',
	count: 1,
	nest: [0, 32],
	range: 40,
	notice: 14,
	moves: ['pose', 'sing'],
	hearts: 6,
	design: D(
		'Bombo',
		2.6,
		1.15,
		[
			[-1.6, 0, 0.95],
			[-0.5, 0.15, 1.1],
			[0.6, 0.25, 1.05],
			[1.6, 0.4, 0.8],
		],
		[
			P('eye', 3, 0.6, 0.4, 1.05, true),
			P('mouth', 3, 0, -0.35, 1.1, false, 'herb'),
			P('throat', 3, 0, -0.9, 0.8, false, 'song'),
			P('horn', 3, 0.55, 0.8, 1.2, true, 'curl', 0.1),
			P('frill', 2, 0, 1.2, 1.0, false),
			P('leg', 0, 1.0, -1.0, 1.1, true, 'straight'),
			P('leg', 1, 1.1, -1.0, 1.1, true, 'straight'),
			P('leg', 2, 1.0, -1.0, 1.1, true, 'straight'),
			P('tail', 0, Math.PI, 0.25, 1.3, false, 'fluff'),
		],
		{ base: 5, accent: 2, pattern: 11, kind: 'patches', scale: 0.6 },
		{ shy: 0, social: 0.6, bounce: 0.5, googly: 0.5, curious: 0.4, speed: 0.8 },
	),
};

export const ALL_SPECIES = [...SPECIES, GIANT];

/** A member's code: the species body at a slightly different size (young ones are smaller). */
export function memberCode(sp: Species, scale = 1): string {
	// (a JSON copy: structuredClone is missing on older iPhones)
	const d = JSON.parse(JSON.stringify(sp.design)) as Design;
	d.size = Math.max(0.3, Math.min(2.6, d.size * scale));
	return encodeDesign(d);
}

// ------------------------------------------------------------------ the child's own creature

/** Base colours a child can pick (indices into the design palette), each with an accent that goes with it. */
export const COLOURS: Array<{ base: number; accent: number }> = [
	{ base: 1, accent: 9 },
	{ base: 0, accent: 2 },
	{ base: 2, accent: 0 },
	{ base: 3, accent: 1 },
	{ base: 5, accent: 9 },
	{ base: 6, accent: 2 },
	{ base: 8, accent: 1 },
	{ base: 10, accent: 5 },
];
export const BODIES = 4;
export const TAILS: string[] = ['fluff', 'plain', 'ball'];

/** The body for a child's choices: one of four shapes, a colour, and horns, wings, a crest and a tail on top. */
export function designFor(look: Look): Design {
	const c = COLOURS[((look.colour % COLOURS.length) + COLOURS.length) % COLOURS.length];
	const tail = TAILS[((look.tail % TAILS.length) + TAILS.length) % TAILS.length];
	const body = ((look.body % BODIES) + BODIES) % BODIES;
	let spine: Array<[number, number, number]>;
	let parts: DPart[];
	let size = 0.8;
	let fat = 1.15;
	let kind: Design['paint']['kind'] = 'spots';
	// the head is always the last spine segment
	let head = 1;
	if (body === 0) {
		// round and springy, on two legs
		spine = [
			[-0.55, 0, 1.15],
			[0.7, 0.6, 1.02],
		];
		parts = [P('stalk', 1, 0.38, 1.05, 0.95, true), P('mouth', 1, 0, -0.5, 1.1, false, 'herb'), P('throat', 1, 0, -1.3, 0.7, false, 'song'), P('leg', 0, 1.35, -0.95, 1.05, true, 'digi'), P('foot', 0, 0, 0, 1.0, false, 'paw')];
	} else if (body === 1) {
		// long, on four legs
		size = 0.9;
		fat = 1.05;
		kind = 'patches';
		head = 2;
		spine = [
			[-0.95, 0, 0.95],
			[0.05, 0.1, 1.05],
			[1.0, 0.45, 0.85],
		];
		parts = [P('eye', 2, 0.55, 0.4, 1.25, true), P('mouth', 2, 0, -0.35, 1.0, false, 'herb'), P('throat', 2, 0, -1.0, 0.7, false, 'song'), P('leg', 0, 1.0, -1.0, 0.95, true, 'straight'), P('leg', 1, 1.0, -1.0, 0.95, true, 'straight'), P('foot', 0, 0, 0, 1.0, false, 'paw')];
	} else if (body === 2) {
		// tall, with a long neck
		size = 0.85;
		fat = 0.95;
		kind = 'stripes';
		spine = [
			[-0.2, 0, 1.0],
			[0.15, 1.15, 0.85],
		];
		parts = [P('eye', 1, 0.5, 0.35, 1.3, true), P('mouth', 1, 0, -0.3, 1.0, false, 'herb'), P('throat', 1, 0, -0.9, 0.75, false, 'song'), P('leg', 0, 1.4, -1.0, 1.15, true, 'digi'), P('foot', 0, 0, 0, 1.2, false, 'paw')];
	} else {
		// a wide little one on four short legs
		size = 0.75;
		fat = 1.35;
		kind = 'gradient';
		spine = [
			[-0.3, 0, 1.2],
			[0.75, 0.15, 1.0],
		];
		parts = [P('eye', 1, 0.55, 0.75, 1.3, true), P('mouth', 1, 0, -0.2, 1.2, false, 'herb'), P('throat', 1, 0, -0.85, 0.9, false, 'song'), P('leg', 0, 1.0, -1.0, 0.8, true, 'insect'), P('leg', 0, 2.1, -1.0, 0.8, true, 'insect'), P('foot', 0, 0, 0, 1.0, false, 'paw')];
	}
	parts.push(P('tail', 0, Math.PI, 0.3, tail === 'fluff' ? 0.85 : 1.0, false, tail));
	if (look.frill) parts.push(P('frill', head, 0, 0.6, 1.0, false));
	if (look.horns) parts.push(P('horn', head, 0.45, 0.95, 0.85, true, 'curl', 0.15));
	if (look.wings) parts.push(P('wing', 0, 1.4, 0.65, 1.15, true));
	return D('Friend', size, fat, spine, parts, { base: c.base, accent: c.accent, pattern: 11, kind, scale: 0.55 }, { bounce: 1.15, googly: 0.7, shy: 0.2, social: 0.8, curious: 0.8 });
}

export const lookCode = (look: Look) => encodeDesign(designFor(look));
