// Saying hello: walk up to a creature and greet it. It shows a short string of moves (sing, dance, smile, pose);
// then it is your turn to show them back, one at a time. The game waits for you: there is no clock to beat, a
// wrong button costs nothing, and the right button glows when a child needs the hint. Pressing on the beat (as the
// ring closes) is "great" and fills the hearts faster, which is the part an older child can get good at.
// Every hello ends in friendship; the only other way out is to walk away.
import { fill, t } from '../i18n';
import type { SocialId } from './abilities';
import type { Actor } from './actors';
import type { Play } from './play';

export type Phase = 'intro' | 'show' | 'ready' | 'play' | 'react' | 'won';
export type Mark = 'great' | 'good' | null;

export class EncounterRun {
	phase: Phase = 'intro';
	round = 0;
	seq: SocialId[] = [];
	marks: Mark[] = [];
	/** right answers so far, and how many make a friend */
	hearts = 0;
	readonly need: number;
	t = 0;
	/** seconds per beat */
	readonly beat: number;
	shown = -1;
	idx = 0;
	/** seconds the current move has been waiting for the child */
	wait = 0;
	/** show which button to press (always the first time, later after a wrong press or a long wait) */
	hint = false;
	message = '';
	/** the very first hello: shorter, slower, and the right button always glows */
	readonly first: boolean;
	private lastTick = -1;

	constructor(
		readonly pl: Play,
		readonly partner: Actor,
		readonly name: string,
	) {
		const sp = partner.sp!;
		this.first = pl.allied.size === 0;
		this.need = this.first ? 3 : sp.hearts;
		this.beat = sp.temper === 'giant' ? 1.15 : this.first ? 1.0 : 0.85;
		this.message = fill(t.enc.intro, { name });
	}

	get meter() {
		return Math.min(100, Math.round((this.hearts / this.need) * 100));
	}

	private newRound() {
		const sp = this.partner.sp!;
		const left = Math.max(1, Math.ceil(this.need - this.hearts));
		const n = Math.min(left, this.first || this.round === 0 ? 2 : 3);
		this.seq = [];
		for (let i = 0; i < n; i++) {
			// its favourite moves, never three of the same in a row
			let m = sp.moves[Math.floor(Math.random() * sp.moves.length)];
			if (i >= 2 && this.seq[i - 1] === m && this.seq[i - 2] === m) m = sp.moves.find((x) => x !== m) ?? m;
			this.seq.push(m);
		}
		this.marks = this.seq.map(() => null);
		this.idx = 0;
		this.shown = -1;
		this.wait = 0;
		this.hint = this.first;
	}

	private go(p: Phase) {
		this.phase = p;
		this.t = 0;
		this.lastTick = -1;
	}

	update(dt: number) {
		this.t += dt;
		const pl = this.pl;
		const B = this.beat;
		const pc = this.partner.c;
		const me = pl.player.c;
		pc.faceTarget = me.pos;
		pc.lookTarget = me.headPos;
		pc.intentSpeed = 0;
		me.faceTarget = pc.pos;
		me.lookTarget = pc.headPos;
		switch (this.phase) {
			case 'intro':
				if (this.t > 1.4) {
					this.newRound();
					this.go('show');
					this.message = t.enc.watch;
				}
				break;
			case 'show': {
				const k = Math.floor(this.t / B);
				if (k !== this.shown && k < this.seq.length) {
					this.shown = k;
					pc.act(this.seq[k], B * 0.95);
					pl.moveSound(this.seq[k], this.partner, k);
				}
				if (this.t > this.seq.length * B + B * 0.3) {
					this.go('ready');
					this.message = t.enc.turn;
				}
				break;
			}
			case 'ready': {
				// one count-in tick, then it is the child's turn
				if (this.lastTick < 0) {
					this.lastTick = 0;
					pl.sound('tick', null, 0.6, 1.3);
				}
				if (this.t >= B) {
					this.go('play');
					this.wait = 0;
				}
				break;
			}
			case 'play': {
				this.wait += dt;
				// a soft tick each time the ring closes, so the beat can be heard as well as seen
				const k = Math.floor(this.wait / B + 0.1);
				if (k !== this.lastTick) {
					this.lastTick = k;
					if (k > 0) pl.sound('tick', null, 0.3, 1.3);
				}
				// a child who is waiting gets the hint
				if (this.wait > B * 2.5 && !this.hint) {
					this.hint = true;
					this.message = t.enc.hint;
				}
				break;
			}
			case 'react':
				if (this.t > 1.3) {
					if (this.hearts >= this.need) {
						this.go('won');
						this.message = fill(t.enc.won, { name: this.name });
						pl.befriend(this.partner);
					} else {
						this.round++;
						this.newRound();
						this.go('show');
						this.message = t.enc.watch;
					}
				}
				break;
			case 'won':
				if (this.t > 2.4) pl.endEncounter(true);
				break;
		}
	}

	/** how close to the beat the current move is: 0 right on it, 1 half a beat away */
	offBeat() {
		const B = this.beat;
		const x = (this.wait % B) / B;
		return Math.min(x, 1 - x) * 2;
	}

	/** the child pressed a move */
	input(m: SocialId) {
		if (this.phase !== 'play' || this.idx >= this.seq.length) return;
		const pl = this.pl;
		const want = this.seq[this.idx];
		pl.player.c.act(m, this.beat * 0.9);
		pl.moveSound(m, pl.player, this.idx);
		if (m !== want) {
			// nothing is lost: the right button lights up and the move waits
			this.hint = true;
			this.message = t.enc.hint;
			pl.hud.nudge();
			return;
		}
		// on the beat (as the ring closes) is "great"; any other moment is still right
		const great = this.wait > this.beat * 0.4 && this.offBeat() < 0.36;
		this.marks[this.idx] = great ? 'great' : 'good';
		this.hearts += great ? 1.5 : 1;
		this.message = great ? t.enc.great : t.enc.good;
		pl.sound(great ? 'great' : 'good', null, 0.55, 1 + this.idx * 0.06);
		pl.game.fx.sparkle(pl.player.c.headPos, pl.player.size * 0.6, '#ffd23f');
		// the friends walking with you join in
		for (const a of pl.pack) if (!a.c.action) a.c.act(m, this.beat * 0.9);
		this.idx++;
		this.wait = 0;
		this.lastTick = 0;
		this.hint = this.first;
		if (this.idx >= this.seq.length) {
			this.go('react');
			const pc = this.partner.c;
			// a happy hop (a small one for the giant, so the ground stays calm)
			pc.jump(Math.min(0.3, Math.max(0.08, (pc.plan.legLength || pc.plan.R) * 0.3)));
			pl.game.fx.love(pc.headPos, pc.plan.size);
			pl.sound('voice', this.partner, 0.8);
			if (this.hearts < this.need) this.message = t.enc.liked;
		}
	}
}
