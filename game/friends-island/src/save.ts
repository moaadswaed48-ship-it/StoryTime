// What a child has done, kept in this browser only (localStorage, one save per profile). Nothing is sent anywhere.
import { config } from './config';

/** The creature a child made: a body shape, a colour and a few extras. */
export interface Look {
	body: number;
	colour: number;
	horns: boolean;
	wings: boolean;
	frill: boolean;
	tail: number;
}

export interface Save {
	v: 1;
	/** the creature's name, as the child typed or picked it ('' until it has one) */
	name: string;
	look: Look;
	hatched: boolean;
	fruit: number;
	/** species ids that are friends (the giant included) */
	friends: string[];
	/** species ids met at least once */
	met: string[];
	/** which hidden stars were found */
	stars: number[];
	/** missions finished */
	done: string[];
	/** the mission the marker points at, when the child picked one */
	track: string | null;
	sound: boolean;
}

export const PREFIX = 'friends-island';
const KEY = `${PREFIX}:save:${config.profile}:v1`;
const blank = (): Save => ({ v: 1, name: '', look: { body: 0, colour: 0, horns: false, wings: false, frill: true, tail: 0 }, hatched: false, fruit: 0, friends: [], met: [], stars: [], done: [], track: null, sound: true });

function load(): Save {
	if (config.fresh) return blank();
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) {
			const s = JSON.parse(raw) as Partial<Save>;
			const b = blank();
			const list = (x: unknown) => (Array.isArray(x) ? x : []);
			return {
				v: 1,
				name: typeof s.name === 'string' ? s.name.slice(0, 16) : '',
				look: { ...b.look, ...(s.look ?? {}) },
				hatched: !!s.hatched,
				fruit: Number(s.fruit) || 0,
				friends: list(s.friends).map(String),
				met: list(s.met).map(String),
				stars: list(s.stars).map(Number),
				done: list(s.done).map(String),
				track: typeof s.track === 'string' ? s.track : null,
				sound: s.sound !== false,
			};
		}
	} catch {
		/* private mode or blocked storage: play without saving */
	}
	return blank();
}

export const save: Save = load();

export function store() {
	if (config.fresh) return;
	try {
		localStorage.setItem(KEY, JSON.stringify(save));
	} catch {
		/* ignore */
	}
}

/** Small pictures for the friends book, shared by every profile on this device. */
const THUMBS = `${PREFIX}:thumbs:v1`;
export const thumbs: Record<string, string> = (() => {
	try {
		return JSON.parse(localStorage.getItem(THUMBS) ?? '{}') as Record<string, string>;
	} catch {
		return {};
	}
})();
export function storeThumb(id: string, data: string) {
	thumbs[id] = data;
	try {
		localStorage.setItem(THUMBS, JSON.stringify(thumbs));
	} catch {
		/* ignore */
	}
}
