// Everything on top of the 3D view while playing, kept to a few big things: the mission chip (top), the menu
// button, the pin that points at the mission, the round move buttons and the one big action button (bottom right),
// the left thumb's stick, the "say hello" card, short cheers, and the panels (menu, missions, friends book, about,
// make your creature). Every word comes from src/i18n.ts.
import * as THREE from 'three';
import { config } from '../config';
import { linearToHex } from '../creature/color';
import { baseColor } from '../creature/design';
import { esc, fill, num, t } from '../i18n';
import { LOCKED, MISSION_ICON, type MissionId, missions, PLAYABLE } from '../missions';
import { save, store, thumbs } from '../save';
import { MOVE, SOCIAL } from './abilities';
import type { Button } from './input';
import type { Play } from './play';
import { ALL_SPECIES, BODIES, COLOURS, TAILS } from './species';

const icon = (body: string, size = 24) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="#23263a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const I = {
	menu: icon('<path d="M4 7h16M4 12h16M4 17h16"/>'),
	close: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
	check: icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 20),
	lock: icon('<rect x="5" y="11" width="14" height="9" rx="2.5" fill="#d8d2c2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 20),
	heart: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" fill="#ff6fa8" stroke="#23263a" stroke-width="2"/></svg>',
	star: (size: number) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="M12 2.5l2.9 6.2 6.7.8-5 4.6 1.4 6.7L12 17.4l-6 3.4 1.4-6.7-5-4.6 6.7-.8z" fill="#fff" stroke="#23263a" stroke-width="2" stroke-linejoin="round"/></svg>`,
	wave: icon('<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V10M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 11V8a1.5 1.5 0 0 1 3 0v6c0 4-3 7-7 7-3 0-5-1.5-6.5-4L4 14.5c-.8-1.4 1-2.6 2-1.4L7 14.5V11" fill="#ffe1b8"/>', 28),
	come: icon('<circle cx="9" cy="8" r="3" fill="#9be15d"/><path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6"/><path d="M18 8v6M15 11h6"/>', 28),
	play: icon('<path d="M8 5l11 7-11 7z" fill="#23263a"/>'),
	list: icon('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3" fill="#23263a"/><circle cx="4.5" cy="12" r="1.3" fill="#23263a"/><circle cx="4.5" cy="18" r="1.3" fill="#23263a"/>'),
	book: icon('<path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1z" fill="#cfe3ff"/><path d="M12 6v14"/>'),
	brush: icon('<path d="M14 4l6 6-8 8H6v-6z" fill="#ffb3d1"/><path d="M4 20h16"/>'),
	sound: icon('<path d="M4 9v6h4l5 4V5L8 9z" fill="#ffe6a8"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>'),
	mute: icon('<path d="M4 9v6h4l5 4V5L8 9z" fill="#ddd"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>'),
	info: icon('<circle cx="12" cy="12" r="9" fill="#fff"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".6" fill="#23263a"/>'),
	door: icon('<path d="M13 4h6v16h-6"/><path d="M4 12h11M11 8l4 4-4 4"/>'),
	stick: icon('<path d="M12 4v16M4 12h16M12 4l-2.5 2.5M12 4l2.5 2.5M12 20l-2.5-2.5M12 20l2.5-2.5M4 12l2.5-2.5M4 12l2.5 2.5M20 12l-2.5-2.5M20 12l-2.5 2.5"/>', 40),
	pin: '<svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path d="M12 22 4 8a8 8 0 1 1 16 0z" fill="#ffd23f" stroke="#23263a" stroke-width="2"/><circle cx="12" cy="8" r="3" fill="#23263a"/></svg>',
};
const SHAPES = [
	'<ellipse cx="22" cy="18" rx="13" ry="12" fill="#fff"/><path d="M16 29v5M28 29v5"/>',
	'<ellipse cx="22" cy="18" rx="18" ry="8" fill="#fff"/><path d="M10 25v8M17 26v7M27 26v7M34 25v8"/>',
	'<ellipse cx="22" cy="24" rx="10" ry="7" fill="#fff"/><path d="M24 18V7"/><circle cx="24" cy="6" r="4.5" fill="#fff"/><path d="M17 30v4M27 30v4"/>',
	'<ellipse cx="22" cy="20" rx="17" ry="10" fill="#fff"/><path d="M8 26l-4 6M14 29l-2 5M30 29l2 5M36 26l4 6"/>',
].map((b) => `<svg viewBox="0 0 44 36" fill="none" stroke="#23263a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`);

type Panel = 'menu' | 'missions' | 'book' | 'about' | null;

export class Hud {
	readonly root: HTMLDivElement;
	private modal: HTMLDivElement;
	private maker: HTMLDivElement;
	private el: Record<string, HTMLElement> = {};
	private v = new THREE.Vector3();
	private encShown = '';
	private actShown = '';
	private missionShown = '';
	private glowing: string | null = null;
	panel: Panel = null;
	makerOpen = false;
	cheering = false;
	private cheerQ: MissionId[] = [];
	private cheerTimer = 0;
	private makerDone: (() => void) | null = null;
	private coachText = '';

	constructor(readonly pl: Play) {
		const r = document.createElement('div');
		r.id = 'hud';
		r.className = 'layer';
		const mv = (m: (typeof SOCIAL)[number] | 'jump', key: string) =>
			`<button class="mv sticker" data-m="${m}" style="--c:${MOVE[m].color}" aria-label="${esc(t.move[m])}"><span class="dot">${MOVE[m].icon}</span><span class="lb">${esc(t.move[m])}</span><kbd>${key}</kbd></button>`;
		r.innerHTML = `
			<div id="h-top">
				<button id="h-mission" class="sticker" aria-label="${esc(t.mission.title)}"><span class="ic"></span><span class="tx"><b></b><i></i></span><span class="pg"></span></button>
				<span class="grow"></span>
				<button id="h-menu" class="rbtn sticker" aria-label="${esc(t.menu.open)}">${I.menu}</button>
			</div>
			<div id="h-marker" class="gone">${I.pin}<span></span></div>
			<div id="h-say" aria-live="polite"></div>
			<div id="h-enc" class="sticker gone"></div>
			<div id="h-coach" class="sticker gone"></div>
			<div id="h-stickhint">${I.stick}</div>
			<div id="h-stick" class="gone"><i></i></div>
			<div id="h-pad">
				<button id="h-act" class="sticker gone"><span class="ic"></span><span class="lb"></span><kbd>Enter</kbd></button>
				<div id="h-moves">${mv('sing', '1')}${mv('dance', '2')}${mv('charm', '3')}${mv('pose', '4')}${mv('jump', 'Space')}</div>
			</div>
			<div id="h-cheer" class="layer gone"></div>`;
		document.body.appendChild(r);
		this.root = r;
		this.modal = document.createElement('div');
		this.modal.id = 'h-modal';
		this.modal.className = 'layer modal';
		document.body.appendChild(this.modal);
		this.maker = document.createElement('div');
		this.maker.id = 'h-maker';
		document.body.appendChild(this.maker);
		for (const n of r.querySelectorAll<HTMLElement>('[id]')) this.el[n.id.replace('h-', '')] = n;
		document.body.classList.toggle('embed', config.embed);
		document.body.classList.toggle('touch', config.touch);

		// the round buttons answer on the way down (no waiting for the finger to lift)
		this.el.moves.addEventListener('pointerdown', (e) => {
			const b = (e.target as HTMLElement).closest<HTMLElement>('[data-m]');
			if (!b) return;
			e.preventDefault();
			const m = b.dataset.m as Button;
			this.pl.input.press(m);
			if (m === 'jump') {
				this.pl.input.hold('jump', true);
				const up = () => {
					this.pl.input.hold('jump', false);
					removeEventListener('pointerup', up);
					removeEventListener('pointercancel', up);
				};
				addEventListener('pointerup', up);
				addEventListener('pointercancel', up);
			}
		});
		this.el.act.addEventListener('pointerdown', (e) => {
			e.preventDefault();
			this.pl.input.press('interact');
		});
		this.el.mission.addEventListener('click', () => this.open('missions'));
		this.el.menu.addEventListener('click', () => this.open('menu'));
		this.el.cheer.addEventListener('click', () => this.dismissCheer());
		this.modal.addEventListener('click', (e) => this.modalClick(e));
		this.maker.addEventListener('click', (e) => this.makerClick(e));
		addEventListener('resize', () => this.makerOpen && this.frameMaker());
	}

	show(on: boolean) {
		this.root.classList.toggle('on', on);
		this.mission(false);
	}

	/** any panel, sheet or cheer is in front: the creature holds still */
	get busy() {
		return this.panel !== null || this.makerOpen || this.cheering;
	}

	// ------------------------------------------------------------------ small things

	say(text: string, color = 'var(--paper)', ms = 2600) {
		const box = this.el.say;
		while (box.children.length > 1) box.firstElementChild?.remove();
		if ([...box.children].some((c) => (c as HTMLElement).dataset.h === text)) return;
		const d = document.createElement('div');
		d.className = 'sticker say';
		d.dataset.h = text;
		d.style.background = color;
		d.textContent = text;
		box.appendChild(d);
		setTimeout(() => d.classList.add('out'), ms);
		setTimeout(() => d.remove(), ms + 400);
	}

	/** a one-line pointer for the very first steps (null hides it) */
	coach(text: string | null) {
		if ((text ?? '') === this.coachText) return;
		this.coachText = text ?? '';
		this.el.coach.textContent = text ?? '';
		this.el.coach.classList.toggle('gone', !text);
	}

	/** a wrong button while saying hello: a little shake, nothing lost */
	nudge() {
		for (const b of this.el.moves.querySelectorAll('.mv')) {
			b.classList.remove('no');
			void (b as HTMLElement).offsetWidth;
		}
		this.el.moves.querySelector('.mv.glow')?.classList.add('no');
	}

	/** the mission chip at the top */
	mission(flash = true) {
		const id = missions.current();
		const [n, goal] = id ? missions.progress(id) : [0, 0];
		const key = `${id}|${n}|${save.name}`;
		if (key === this.missionShown) return;
		this.missionShown = key;
		const m = this.el.mission;
		m.querySelector('.ic')!.innerHTML = id ? MISSION_ICON[id] : I.star(26);
		m.querySelector('b')!.textContent = id ? t.mission[id].t : t.mission.title;
		m.querySelector('i')!.textContent = id ? t.mission[id].h : t.mission.all;
		m.querySelector('.pg')!.textContent = id && goal > 1 ? `${num(n)}/${num(goal)}` : '';
		if (flash) {
			m.classList.remove('pop');
			void m.offsetWidth;
			m.classList.add('pop');
		}
	}

	/** missions that were just finished: one cheer card each, then the next mission */
	celebrate(ids: MissionId[]) {
		this.cheerQ.push(...ids);
		if (!this.cheering) this.nextCheer();
	}

	/** Enter, Space or a pad button closes a cheer too */
	dismissCheer() {
		if (this.cheering && this.cheerTimer < 6.1) this.nextCheer();
	}

	private nextCheer() {
		const id = this.cheerQ.shift();
		const c = this.el.cheer;
		if (!id) {
			this.cheering = false;
			c.classList.add('gone');
			this.mission();
			return;
		}
		this.cheering = true;
		this.cheerTimer = 7;
		const next = this.cheerQ.length ? null : missions.current();
		c.innerHTML = `<div class="card sticker" role="dialog" aria-label="${esc(t.mission.done)}">
			<div class="big">${I.star(56)}</div>
			<h2>${esc(t.mission.done)}</h2>
			<div class="what">${esc(t.mission[id].t)}</div>
			${next ? `<div class="next"><span class="ic">${MISSION_ICON[next]}</span><span><small>${esc(t.mission.next)}</small><b>${esc(t.mission[next].t)}</b></span></div>` : missions.allDone() ? `<div class="what">${esc(t.mission.all)}</div>` : ''}
			<button class="btn primary">${esc(t.mission.go)}</button>
		</div>`;
		c.classList.remove('gone');
		this.pl.sound('friend', null, 0.7);
	}

	// ------------------------------------------------------------------ panels

	open(p: Panel) {
		if (p && (this.makerOpen || this.cheering)) return;
		this.panel = p;
		this.modal.classList.toggle('on', !!p);
		this.pl.paused = !!p;
		if (!p) {
			this.modal.innerHTML = '';
			this.pl.input.clear();
			return;
		}
		this.pl.sound('uiSoft', null, 0.5);
		const head = (title: string, extra = '') => `<div class="head"><h2>${esc(title)}</h2>${extra}<button class="rbtn sticker x" data-p="close" aria-label="${esc(t.menu.close)}">${I.close}</button></div>`;
		let html = '';
		if (p === 'menu') {
			html = `${head(t.menu.title)}
				<div class="pmenu">
					<button class="btn primary" data-p="close">${I.play}<span>${esc(t.menu.resume)}</span></button>
					<button class="btn flip" data-p="missions">${I.list}<span>${esc(t.menu.missions)}</span></button>
					<button class="btn" data-p="book">${I.book}<span>${esc(t.menu.book)}</span></button>
					<button class="btn" data-p="maker">${I.brush}<span>${esc(t.menu.creature)}</span></button>
					<button class="btn" data-p="sound">${save.sound ? I.sound : I.mute}<span>${esc(save.sound ? t.menu.soundOn : t.menu.soundOff)}</span></button>
					<button class="btn" data-p="about">${I.info}<span>${esc(t.menu.about)}</span></button>
					${config.embed ? `<button class="btn flip" data-p="leave">${I.door}<span>${esc(t.menu.leave)}</span></button>` : ''}
				</div>
				<p class="fine" dir="auto">${esc(t.credit)}</p>`;
		} else if (p === 'missions') {
			const cur = missions.current();
			const rows = PLAYABLE.map((id) => {
				const done = missions.done(id);
				const open = missions.open(id);
				const [n, goal] = missions.progress(id);
				const st = done ? `<span class="st">${I.check}</span>` : open ? (goal > 1 ? `<span class="st num">${num(n)}/${num(goal)}</span>` : '') : `<span class="st">${I.lock}</span>`;
				const cls = done ? 'done' : !open ? 'shut' : id === cur ? 'cur' : '';
				const inner = `<span class="ic">${MISSION_ICON[id]}</span><span class="tx"><b>${esc(t.mission[id].t)}</b>${open && !done ? `<i>${esc(t.mission[id].h)}</i>` : ''}</span>${st}`;
				return open && !done ? `<button class="ms ${cls}" data-track="${id}">${inner}</button>` : `<div class="ms ${cls}">${inner}</div>`;
			}).join('');
			const locked = LOCKED.map((id) => `<div class="ms lock"><span class="ic">${MISSION_ICON[id]}</span><span class="tx"><b>${esc(t.mission[id].t)}</b></span><span class="st">${I.lock}<span>${esc(t.mission.soon)}</span></span></div>`).join('');
			html = `${head(t.mission.title, `<span class="count">${esc(fill(t.mission.count, { done: num(missions.count()), total: num(PLAYABLE.length) }))}</span>`)}<div class="scroll">${rows}${locked}</div>`;
		} else if (p === 'book') {
			const cards = ALL_SPECIES.map((sp) => {
				const friend = save.friends.includes(sp.id);
				const met = friend || save.met.includes(sp.id);
				const th = thumbs[sp.id];
				return `<div class="fr${met ? '' : ' unknown'}"><div class="pic"${met && th ? ` style="background-image:url(${th})"` : ''}>${met && th ? '' : '?'}</div><b>${met ? esc(t.species[sp.id].n) : '?'}</b><i>${esc(friend ? t.species[sp.id].b : met ? t.book.met : t.book.unknown)}</i>${friend ? `<span class="badge" title="${esc(t.book.friend)}">${I.heart}</span>` : ''}</div>`;
			}).join('');
			html = `${head(t.book.title, `<span class="count">${num(save.friends.length)}/${num(ALL_SPECIES.length)}</span>`)}<div class="scroll book">${cards}</div>`;
		} else if (p === 'about') {
			html = `${head(t.about.title)}<div class="scroll about">${t.about.lines.map((l) => `<p dir="auto">${esc(l)}</p>`).join('')}</div>`;
		}
		this.modal.innerHTML = `<div class="panel sticker" role="dialog" aria-modal="true">${html}</div>`;
		this.modal.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
	}

	private modalClick(e: MouseEvent) {
		const tEl = e.target as HTMLElement;
		if (tEl === this.modal) return this.open(null);
		const track = tEl.closest<HTMLElement>('[data-track]')?.dataset.track as MissionId | undefined;
		if (track) {
			missions.track(track);
			this.open(null);
			this.mission();
			return;
		}
		const p = tEl.closest<HTMLElement>('[data-p]')?.dataset.p;
		if (!p) return;
		if (p === 'close') this.open(null);
		else if (p === 'missions' || p === 'book' || p === 'about') this.open(p);
		else if (p === 'maker') {
			this.open(null);
			this.openMaker(false);
		} else if (p === 'sound') {
			save.sound = !save.sound;
			store();
			this.pl.game.applySound();
			this.open('menu');
		} else if (p === 'leave') this.pl.game.leave();
	}

	// ------------------------------------------------------------------ make your creature

	/** the sheet for naming and shaping your creature; `first` is the moment after hatching (a name is asked for) */
	openMaker(first: boolean, done?: () => void) {
		this.makerOpen = true;
		this.makerDone = done ?? null;
		this.maker.classList.add('on');
		this.drawMaker(first);
		this.pl.input.clear();
		this.pl.faceCamera();
	}

	private drawMaker(first: boolean) {
		const L = save.look;
		const name = save.name;
		const sw = COLOURS.map((c, i) => `<button class="sw${i === L.colour ? ' on' : ''}" data-colour="${i}" style="background:${linearToHex(baseColor(c.base))}" aria-label="${esc(t.make.colour)} ${num(i + 1)}"></button>`).join('');
		const shapes = Array.from({ length: BODIES }, (_, i) => `<button class="shape${i === L.body ? ' on' : ''}" data-body="${i}" aria-label="${esc(t.make.shape)} ${num(i + 1)}">${SHAPES[i]}</button>`).join('');
		const pill = (key: 'horns' | 'wings' | 'frill', on: boolean) => `<button class="pill${on ? ' on' : ''}" data-x="${key}" aria-pressed="${on}">${esc(t.make[key])}</button>`;
		const keep = this.maker.querySelector('.body')?.scrollTop ?? 0;
		this.maker.innerHTML = `<div class="sheet sticker" role="dialog" aria-label="${esc(t.make.title)}">
			<h2>${esc(first ? t.name.ask : t.make.title)}</h2>
			<div class="body">
			<div class="row"><input id="h-name" maxlength="12" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done" dir="auto" placeholder="${esc(t.name.placeholder)}" value="${esc(name)}" aria-label="${esc(t.name.ask)}"/></div>
			<div class="row names">${t.name.ideas.map((n) => `<button class="pill${n === name ? ' on' : ''}" data-name="${esc(n)}">${esc(n)}</button>`).join('')}</div>
			<div class="lbl">${esc(t.make.colour)}</div>
			<div class="row swatches">${sw}</div>
			<div class="lbl">${esc(t.make.shape)}</div>
			<div class="row">${shapes}</div>
			<div class="lbl">${esc(t.make.extras)}</div>
			<div class="row">${pill('horns', L.horns)}${pill('wings', L.wings)}${pill('frill', L.frill)}<button class="pill" data-x="tail">${esc(t.make.tail)} ${num((L.tail % TAILS.length) + 1)}</button></div>
			</div>
			<div class="row foot"><button class="btn primary" data-done="${first ? 1 : 0}">${esc(first ? t.name.ok : t.make.done)}</button></div>
		</div>`;
		this.maker.querySelector('.body')!.scrollTop = keep;
		this.frameMaker();
		const input = this.maker.querySelector<HTMLInputElement>('#h-name')!;
		input.addEventListener('input', () => {
			for (const b of this.maker.querySelectorAll('[data-name]')) b.classList.toggle('on', (b as HTMLElement).dataset.name === input.value.trim());
		});
		input.addEventListener('keydown', (e) => {
			e.stopPropagation();
			if (e.key === 'Enter') this.maker.querySelector<HTMLElement>('[data-done]')?.click();
		});
	}

	/** slide the 3D picture so the creature stands in the part of the screen the sheet leaves free */
	private frameMaker() {
		const sheet = this.maker.querySelector<HTMLElement>('.sheet');
		if (!sheet || !this.makerOpen) return this.pl.game.viewShift(0, 0);
		const r = sheet.getBoundingClientRect();
		const side = r.height > innerHeight * 0.7 && r.left > innerWidth * 0.35;
		if (side) this.pl.game.viewShift(Math.round((innerWidth - r.left) / 2), 0);
		else this.pl.game.viewShift(0, Math.round((innerHeight - r.top) / 2));
	}

	private makerClick(e: MouseEvent) {
		const b = (e.target as HTMLElement).closest<HTMLElement>('button');
		if (!b) return;
		const L = save.look;
		const input = this.maker.querySelector<HTMLInputElement>('#h-name')!;
		const first = this.maker.querySelector<HTMLElement>('[data-done]')?.dataset.done === '1';
		if (b.dataset.name) {
			input.value = b.dataset.name;
			for (const x of this.maker.querySelectorAll('[data-name]')) x.classList.toggle('on', x === b);
			this.pl.sound('uiSoft', null, 0.5);
			return;
		}
		if (b.dataset.done !== undefined) {
			save.name = (input.value.trim() || save.name || t.name.fallback).slice(0, 12);
			store();
			this.makerOpen = false;
			this.maker.classList.remove('on');
			this.maker.innerHTML = '';
			this.frameMaker();
			this.pl.cam.zoom = 1;
			this.pl.sound('confirm', null, 0.6);
			if (first) this.say(fill(t.say.hello, { name: save.name }), 'var(--yellow)', 3200);
			const cb = this.makerDone;
			this.makerDone = null;
			cb?.();
			return;
		}
		// keep what was typed while the sheet is redrawn
		const typed = input.value.trim();
		if (typed) save.name = typed.slice(0, 12);
		if (b.dataset.colour) L.colour = Number(b.dataset.colour);
		else if (b.dataset.body) L.body = Number(b.dataset.body);
		else if (b.dataset.x === 'tail') L.tail = (L.tail + 1) % TAILS.length;
		else if (b.dataset.x === 'horns' || b.dataset.x === 'wings' || b.dataset.x === 'frill') L[b.dataset.x] = !L[b.dataset.x];
		else return;
		store();
		this.pl.relook();
		this.drawMaker(first);
	}

	// ------------------------------------------------------------------ the frame

	encounter(on: boolean) {
		this.el.enc.classList.toggle('gone', !on);
		this.el.pad.classList.toggle('enc', on);
		this.root.classList.toggle('in-enc', on);
		this.encShown = '';
		if (!on) this.glow(null);
	}

	private glow(m: string | null) {
		if (m === this.glowing) return;
		this.glowing = m;
		for (const b of this.el.moves.querySelectorAll<HTMLElement>('.mv')) b.classList.toggle('glow', b.dataset.m === m);
	}

	update(dt: number) {
		const pl = this.pl;
		document.body.classList.toggle('touch', pl.input.touch || (config.touch && !pl.input.everKeyboard));
		this.el.pad.classList.toggle('gone', !pl.ready || this.busy);
		this.el.stickhint.classList.toggle('gone', !pl.ready || this.busy || !!pl.encounter.active);
		// the big action button
		const p = this.busy ? null : pl.prompt();
		const key = p ? `${p.what}|${p.text}` : '';
		if (key !== this.actShown) {
			this.actShown = key;
			this.el.act.classList.toggle('gone', !p);
			if (p) {
				this.el.act.querySelector('.ic')!.innerHTML = p.what === 'greet' ? I.wave : I.come;
				this.el.act.querySelector('.lb')!.textContent = p.text;
			}
		}
		// the stick under the left thumb
		const s = pl.input.stick;
		this.el.stick.classList.toggle('gone', !s);
		this.el.stickhint.style.opacity = s ? '0' : '';
		if (s) {
			this.el.stick.style.transform = `translate(${s.x0}px, ${s.y0}px)`;
			(this.el.stick.firstElementChild as HTMLElement).style.transform = `translate(${s.x - s.x0}px, ${s.y - s.y0}px)`;
		}
		if (this.cheering) {
			this.cheerTimer -= dt;
			if (this.cheerTimer <= 0) this.nextCheer();
		}
		this.marker();
		this.encounterPanel();
	}

	private project(p: THREE.Vector3) {
		const cam = this.pl.game.camera;
		this.v.copy(p).project(cam);
		const r = this.pl.game.canvas.getBoundingClientRect();
		return { x: r.left + ((this.v.x + 1) / 2) * r.width, y: r.top + ((1 - this.v.y) / 2) * r.height, behind: this.v.z > 1, w: r.width, h: r.height };
	}

	/** the mission pin: above the target, or pinned to the screen edge pointing at it */
	private marker() {
		const pl = this.pl;
		const tgt = this.busy || pl.encounter.active ? null : pl.objectivePos();
		const m = this.el.marker;
		if (!tgt) {
			m.classList.add('gone');
			return;
		}
		m.classList.remove('gone');
		const p = this.project(this.v.copy(tgt).setY(tgt.y + 0.5));
		let { x, y } = p;
		const pad = 44;
		// keep clear of the mission chip (top) and the buttons (bottom)
		const top = 96,
			bottom = Math.min(190, p.h * 0.32);
		const inside = !p.behind && x > pad && x < p.w - pad && y > top && y < p.h - bottom;
		if (!inside) {
			let dx = x - p.w / 2,
				dy = y - p.h / 2;
			if (p.behind) {
				dx = -dx;
				dy = Math.abs(dy) + 1;
			}
			const sc = Math.min((p.w / 2 - pad) / Math.max(1e-3, Math.abs(dx)), (dy < 0 ? p.h / 2 - top : p.h / 2 - bottom) / Math.max(1e-3, Math.abs(dy)));
			x = p.w / 2 + dx * sc;
			y = p.h / 2 + dy * sc;
		}
		m.style.transform = `translate(${x - 19}px, ${y - 40}px)`;
		const d = Math.hypot(tgt.x - pl.player.c.pos.x, tgt.z - pl.player.c.pos.z);
		this.el['marker'].querySelector('span')!.textContent = d > 6 ? num(d) : '';
	}

	private encounterPanel() {
		const run = this.pl.encounter.active;
		if (!run) return;
		const full = Math.ceil(run.need);
		const key = `${run.phase}|${run.round}|${run.idx}|${run.shown}|${run.marks.join()}|${run.hearts}|${run.message}`;
		if (key !== this.encShown) {
			this.encShown = key;
			const hearts = Array.from({ length: full }, (_, i) => I.heart.replace('<svg ', `<svg class="${i < Math.floor(run.hearts + 0.01) ? 'on' : ''}" `)).join('');
			const seq = run.seq
				.map((m, i) => {
					const lit = run.phase === 'show' && run.shown === i;
					const now = run.phase === 'play' && run.idx === i;
					const mark = run.marks[i];
					return `<div class="em${lit ? ' lit' : ''}${now ? ' now' : ''}${mark ? ` ${mark}` : ''}" style="--c:${MOVE[m].color}">${MOVE[m].icon}</div>`;
				})
				.join('');
			this.el.enc.innerHTML = `<div class="who"><span>${esc(run.name)}</span><span class="hearts">${hearts}</span></div><div class="msg">${esc(run.message)}</div><div class="seq">${seq}</div>`;
		}
		// the beat: a ring that closes on the move that is waiting for you
		const now = this.el.enc.querySelector<HTMLElement>('.em.now');
		if (now) now.style.setProperty('--ring', String(1 + 0.22 * run.offBeat()));
		this.glow(run.phase === 'play' && run.hint ? run.seq[run.idx] : null);
	}
}
