// Injectable clock with time scale (hitstop / slow-mo).
// `realDt` drives input, camera look and UI; `dt` (scaled) drives the world: physics, particles, AI.

export type Now = () => number;

export class Time {
	/** Milliseconds. Swap for a fake clock in tests: time.now = () => fakeMs */
	now: Now = () => performance.now();
	/** When true each tick advances exactly `fixedStep` (deterministic captures, ?clock=fixed, __game.step). */
	fixed = false;
	fixedStep = 1 / 60;

	realDt = 0;
	dt = 0;
	elapsed = 0;
	realElapsed = 0;
	frame = 0;
	/** Base scale (slow-mo); hitstop multiplies it to ~0 for a few ms. */
	scale = 1;

	private last = -1;
	private hitstopLeft = 0;
	private hitstopScale = 0;
	private slowLeft = 0;
	private slowScale = 1;

	tick(): void {
		if (this.fixed) this.realDt = this.fixedStep;
		else {
			const t = this.now();
			this.realDt = this.last < 0 ? this.fixedStep : Math.min(0.1, Math.max(0, (t - this.last) / 1000));
			this.last = t;
		}
		this.realElapsed += this.realDt;
		let s = this.scale;
		if (this.slowLeft > 0) {
			this.slowLeft -= this.realDt;
			// ease back to 1 over the last 30% of the slow-mo
			s *= this.slowScale;
		}
		if (this.hitstopLeft > 0) {
			this.hitstopLeft -= this.realDt;
			s *= this.hitstopScale;
		}
		this.dt = this.realDt * s;
		this.elapsed += this.dt;
		this.frame++;
	}

	/** Resync after a pause so the next real dt isn't huge. */
	resync(): void {
		this.last = -1;
	}

	/** Freeze (or nearly freeze) the world for `ms` real milliseconds. Longest request wins. */
	hitstop(ms: number, scale = 0.02): void {
		this.hitstopLeft = Math.max(this.hitstopLeft, ms / 1000);
		this.hitstopScale = scale;
	}

	slowmo(scale: number, seconds: number): void {
		this.slowScale = scale;
		this.slowLeft = Math.max(this.slowLeft, seconds);
	}

	get stopped(): boolean {
		return this.hitstopLeft > 0;
	}
}

export const time = new Time();
