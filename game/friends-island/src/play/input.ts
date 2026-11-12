// Play input: touch, keyboard, mouse and gamepads, merged into one set of intents each frame.
//
//   Touch                       Keyboard / mouse        Gamepad               Action
//   left thumb: a stick that    WASD / arrows           left stick            walk (camera-relative)
//     appears where you press
//   drag anywhere else          drag with the mouse     right stick           look around
//   tap the ground or a         click                                         walk there (a creature: go and say hi)
//     creature
//   the round buttons           Space                   A / Cross             jump (hold to glide with wings)
//                               Enter, E or F           Y / Triangle          say hi, come along, wait here
//                               1 2 3 4                 D-pad                 sing, dance, smile, pose
//                               M                       View / Share          missions
//                               Esc                     Menu / Options        the menu
// There is nothing to attack with: a tap or a click only ever means "go there".

export type Button = 'jump' | 'interact' | 'sing' | 'dance' | 'charm' | 'pose' | 'missions' | 'menu';

const KEYMAP: Record<string, Button> = {
	Space: 'jump',
	KeyE: 'interact',
	KeyF: 'interact',
	Enter: 'interact',
	NumpadEnter: 'interact',
	Digit1: 'sing',
	Digit2: 'dance',
	Digit3: 'charm',
	Digit4: 'pose',
	Numpad1: 'sing',
	Numpad2: 'dance',
	Numpad3: 'charm',
	Numpad4: 'pose',
	KeyM: 'missions',
	Escape: 'menu',
};
const PADMAP: Record<number, Button> = { 0: 'jump', 3: 'interact', 2: 'interact', 12: 'sing', 15: 'dance', 13: 'charm', 14: 'pose', 8: 'missions', 9: 'menu' };

/** The pad to read: the first with the standard layout, which PADMAP assumes, else the first connected. */
export function pickPad(): Gamepad | null {
	const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
	let g: Gamepad | null = null;
	for (const p of pads) {
		if (!p || !p.connected) continue;
		if (p.mapping === 'standard') {
			g = p;
			break;
		}
		g ??= p;
	}
	return g;
}

interface Finger {
	id: number;
	role: 'stick' | 'look';
	x0: number;
	y0: number;
	x: number;
	y: number;
	t0: number;
	moved: boolean;
}

const STICK_R = 54;

export class PlayInput {
	/** -1..1 strafe, forward */
	move = { x: 0, y: 0 };
	/** look delta this frame (radians) */
	look = { yaw: 0, pitch: 0 };
	run = false;
	/** the last thing used was a touch screen (the HUD shows its round buttons and hides key hints) */
	touch = false;
	/** a key was pressed at some point (a tablet with a keyboard shows key hints) */
	everKeyboard = false;
	private keys = new Set<string>();
	private held = new Set<Button>();
	private pressedQ = new Set<Button>();
	private padPrev: boolean[] = [];
	private lookDX = 0;
	private lookDY = 0;
	private fingers = new Map<number, Finger>();
	/** taps on the world this frame (screen points) */
	readonly taps: Array<{ x: number; y: number }> = [];
	/** the on-screen stick, for the HUD to draw: where it was pressed and where the thumb is (CSS pixels) */
	stick: { x0: number; y0: number; x: number; y: number } | null = null;
	enabled = false;
	/** tests can push the stick */
	forceMove: { x: number; y: number } | null = null;
	/** when the view was last turned by hand (pauses the camera's drift behind the creature) */
	lookedAt = 0;

	constructor(readonly canvas: HTMLCanvasElement) {
		addEventListener('keydown', (e) => {
			if (!this.enabled || (e.target as HTMLElement)?.tagName === 'INPUT') return;
			this.touch = false;
			this.everKeyboard = true;
			if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
			this.keys.add(e.code);
			const b = KEYMAP[e.code];
			if (b && !e.repeat) {
				this.pressedQ.add(b);
				this.held.add(b);
			}
		});
		addEventListener('keyup', (e) => {
			this.keys.delete(e.code);
			const b = KEYMAP[e.code];
			if (b) this.held.delete(b);
		});
		addEventListener('blur', () => this.clear());
		canvas.addEventListener('contextmenu', (e) => e.preventDefault());
		canvas.addEventListener('pointerdown', (e) => this.down(e));
		canvas.addEventListener('pointermove', (e) => this.moveTo(e));
		const up = (e: PointerEvent) => this.up(e);
		canvas.addEventListener('pointerup', up);
		canvas.addEventListener('pointercancel', up);
		canvas.addEventListener('lostpointercapture', up);
	}

	private down(e: PointerEvent) {
		if (!this.enabled) return;
		const touch = e.pointerType !== 'mouse';
		this.touch = touch;
		const r = this.canvas.getBoundingClientRect();
		// a thumb in the lower left corner drives the stick (one at a time); anything else looks around
		const inCorner = e.clientX - r.left < r.width * 0.45 && e.clientY - r.top > r.height * 0.4;
		const stickFree = ![...this.fingers.values()].some((f) => f.role === 'stick');
		const role: Finger['role'] = touch && inCorner && stickFree ? 'stick' : 'look';
		this.fingers.set(e.pointerId, { id: e.pointerId, role, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: false });
		try {
			this.canvas.setPointerCapture(e.pointerId);
		} catch {}
	}

	private moveTo(e: PointerEvent) {
		const f = this.fingers.get(e.pointerId);
		if (!f) return;
		const dx = e.clientX - f.x,
			dy = e.clientY - f.y;
		f.x = e.clientX;
		f.y = e.clientY;
		if (Math.hypot(f.x - f.x0, f.y - f.y0) > 10) f.moved = true;
		if (f.role === 'look' && f.moved) {
			this.lookDX += dx;
			this.lookDY += dy;
		}
	}

	private up(e: PointerEvent) {
		const f = this.fingers.get(e.pointerId);
		if (!f) return;
		this.fingers.delete(e.pointerId);
		// a quick press that did not travel is a tap: "go there"
		if (e.type === 'pointerup' && !f.moved && performance.now() - f.t0 < 450 && this.enabled) this.taps.push({ x: f.x, y: f.y });
	}

	pressed(b: Button) {
		return this.pressedQ.has(b);
	}
	isHeld(b: Button) {
		return this.held.has(b);
	}
	/** a press from an on-screen button (or a test) */
	press(b: Button) {
		this.pressedQ.add(b);
	}
	/** an on-screen button held down (jump: hold to glide) */
	hold(b: Button, on: boolean) {
		if (on) this.held.add(b);
		else this.held.delete(b);
	}

	/** Read devices for this frame. Call once per frame before using the intents; call endFrame() after. */
	poll(dt: number) {
		const k = this.keys;
		let x = 0,
			y = 0;
		if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
		if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
		if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
		if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
		const kl = Math.hypot(x, y);
		if (kl > 1) {
			x /= kl;
			y /= kl;
		}
		this.run = k.has('ShiftLeft') || k.has('ShiftRight');
		// the on-screen stick
		this.stick = null;
		for (const f of this.fingers.values()) {
			if (f.role !== 'stick') continue;
			let sx = (f.x - f.x0) / STICK_R,
				sy = (f.y - f.y0) / STICK_R;
			const m = Math.hypot(sx, sy);
			if (m > 1) {
				sx /= m;
				sy /= m;
			}
			this.stick = { x0: f.x0, y0: f.y0, x: f.x0 + sx * STICK_R, y: f.y0 + sy * STICK_R };
			if (m > 0.18) {
				x = sx;
				y = -sy;
				f.moved = true;
				if (m > 0.92) this.run = true;
			}
		}
		const sens = this.touch ? 0.0058 : 0.0042;
		this.look.yaw = -this.lookDX * sens;
		this.look.pitch = this.lookDY * sens * 0.7;
		if (this.lookDX || this.lookDY) this.lookedAt = performance.now();
		this.lookDX = this.lookDY = 0;
		// gamepads
		const p = pickPad();
		if (p) {
			const dz = (ax: number, ay: number, d = 0.16) => {
				const m = Math.hypot(ax, ay);
				if (m < d) return [0, 0];
				const s = Math.min(1, (m - d) / (1 - d)) / m;
				return [ax * s, ay * s];
			};
			const [lx, ly] = dz(p.axes[0] ?? 0, p.axes[1] ?? 0);
			const [rx, ry] = dz(p.axes[2] ?? 0, p.axes[3] ?? 0, 0.12);
			if (Math.hypot(lx, ly) > Math.hypot(x, y)) {
				x = lx;
				y = -ly;
				if (Math.hypot(lx, ly) > 0.92) this.run = true;
			}
			if (rx || ry) {
				this.look.yaw -= Math.sign(rx) * rx * rx * 3.0 * dt;
				this.look.pitch += Math.sign(ry) * ry * ry * 1.8 * dt;
				this.lookedAt = performance.now();
			}
			for (const [i, b] of Object.entries(PADMAP)) {
				const n = Number(i);
				const down = !!p.buttons[n]?.pressed;
				if (down && !this.padPrev[n]) this.pressedQ.add(b);
				if (down) this.held.add(b);
				else if (this.padPrev[n]) this.held.delete(b);
				this.padPrev[n] = down;
			}
		}
		if (this.forceMove) {
			x = this.forceMove.x;
			y = this.forceMove.y;
		}
		this.move.x = x;
		this.move.y = y;
	}

	endFrame() {
		this.pressedQ.clear();
		this.taps.length = 0;
	}

	clear() {
		this.keys.clear();
		this.held.clear();
		this.pressedQ.clear();
		this.fingers.clear();
		this.taps.length = 0;
		this.stick = null;
		this.move.x = this.move.y = 0;
	}
}
