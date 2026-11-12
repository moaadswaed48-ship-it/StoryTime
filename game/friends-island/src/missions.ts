// Missions: three in a row that teach the game (hatch and name, eat, a first friend), then three open at once
// (hidden stars, a friend of every kind, the gentle giant), and four that are shown locked as "coming soon".
// Progress is read from the save, so a mission is done the moment what it asks for is true. Nothing can be failed.
import type { MissionKey } from './i18n';
import { save, store } from './save';

export type MissionId = 'hatch' | 'fruit' | 'friend' | 'stars' | 'kinds' | 'giant';
export const PLAYABLE: MissionId[] = ['hatch', 'fruit', 'friend', 'stars', 'kinds', 'giant'];
export const LOCKED: MissionKey[] = ['home', 'fireflies', 'race', 'workshop'];
/** the first three come one after another; the rest open together once a first friend is made */
const INTRO: MissionId[] = ['hatch', 'fruit', 'friend'];
export const KINDS = ['puff', 'bobble', 'ram', 'zippy', 'croaky'];
export const STAR_COUNT = 3;
export const FRUIT_GOAL = 3;

const s = (body: string) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#23263a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
export const MISSION_ICON: Record<MissionKey, string> = {
	hatch: s('<path d="M12 3C8 3 5 9 5 13a7 7 0 0 0 14 0c0-4-3-10-7-10z" fill="#fff6e0"/><path d="M6 12l3 2 3-2.5 3 2.5 3-2"/>'),
	fruit: s('<path d="M12 8c-4-2.5-8 .5-7 5 .8 5 4.5 7.5 7 6 2.5 1.5 6.2-1 7-6 1-4.5-3-7.5-7-5z" fill="#ff7a6b"/><path d="M12 8c0-2 1-4 3-4.5"/>'),
	friend: s('<path d="M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5c0 5-7 9.5-7 9.5z" fill="#ff8fbf"/>'),
	stars: s('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L3.4 9.3l6-.7z" fill="#ffd23f"/>'),
	kinds: s('<circle cx="7" cy="9" r="3" fill="#9be15d"/><circle cx="17" cy="9" r="3" fill="#8fb8ff"/><circle cx="12" cy="16" r="3" fill="#ffb26b"/>'),
	giant: s('<path d="M4 18c0-6 3-11 8-11s8 5 8 11z" fill="#9fe3d6"/><path d="M8 7C7 5 5.5 4.5 4.5 5.5M16 7c1-2 2.5-2.5 3.5-1.5"/><circle cx="9.5" cy="12.5" r="1" fill="#23263a"/><circle cx="14.5" cy="12.5" r="1" fill="#23263a"/>'),
	home: s('<path d="M4 12l8-7 8 7v8H4z" fill="#ffe6a8"/><path d="M10 20v-5h4v5"/>'),
	fireflies: s('<path d="M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4z" fill="#c9b8ff"/><circle cx="18" cy="6" r="1" fill="#ffd23f"/>'),
	race: s('<path d="M5 21V4"/><path d="M5 5h13l-3 4 3 4H5z" fill="#7bd88f"/>'),
	workshop: s('<path d="M4 20l9-9"/><path d="M14 4l6 6-3 3-6-6z" fill="#ffb3d1"/><path d="M4 20l1-4 3 3z" fill="#23263a"/>'),
};

const has = (id: string) => save.done.includes(id);

export const missions = {
	done: has,
	/** how far a mission is, as [now, goal] */
	progress(id: MissionId): [number, number] {
		switch (id) {
			case 'hatch':
				return [save.hatched && save.name ? 1 : 0, 1];
			case 'fruit':
				return [Math.min(FRUIT_GOAL, save.fruit), FRUIT_GOAL];
			case 'friend':
				return [save.friends.length ? 1 : 0, 1];
			case 'stars':
				return [Math.min(STAR_COUNT, save.stars.length), STAR_COUNT];
			case 'kinds':
				return [KINDS.filter((k) => save.friends.includes(k)).length, KINDS.length];
			case 'giant':
				return [save.friends.includes('giant') ? 1 : 0, 1];
		}
	},
	/** can it be worked on now? */
	open(id: MissionId) {
		const i = INTRO.indexOf(id);
		if (i >= 0) return INTRO.slice(0, i).every(has);
		return INTRO.every(has);
	},
	/** the mission the marker and the top chip show: the one the child picked, or the first open one not done */
	current(): MissionId | null {
		const t = save.track as MissionId | null;
		if (t && PLAYABLE.includes(t) && !has(t) && this.open(t)) return t;
		return PLAYABLE.find((m) => !has(m) && this.open(m)) ?? null;
	},
	track(id: MissionId) {
		if (has(id) || !this.open(id)) return;
		save.track = id;
		store();
	},
	/** marks every mission whose goal is now met as done; returns the ones that just finished (in order) */
	settle(): MissionId[] {
		const out: MissionId[] = [];
		for (const id of PLAYABLE) {
			if (has(id) || !this.open(id)) continue;
			const [n, goal] = this.progress(id);
			if (n >= goal) {
				save.done.push(id);
				out.push(id);
			}
		}
		if (out.length) {
			if (save.track && has(save.track)) save.track = null;
			store();
		}
		return out;
	},
	count: () => PLAYABLE.filter(has).length,
	allDone: () => PLAYABLE.every(has),
};
