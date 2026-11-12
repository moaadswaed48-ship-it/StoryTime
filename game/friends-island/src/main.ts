// Entry: error capture first, then seed + clock, boot behind the title card, then the loop.
import { config } from './config';
import { seedAll } from './core/rng';
import { time } from './core/time';
import { Game } from './game';
import { GAME } from './game.config';
import { installErrorCapture, installHarness } from './harness/harness';
import { t } from './i18n';

const errors = installErrorCapture();
seedAll(config.seed, config.seeded);
time.fixed = config.fixedClock;
document.title = GAME.title;
for (const [id, text] of [
	['veil-title', t.title],
	['veil-tag', t.tag],
	['veil-status', t.loading],
	['veil-play-label', t.play],
	['veil-credit', t.credit],
] as const) {
	const el = document.getElementById(id);
	if (el) el.textContent = text;
}

const canvas = document.getElementById('view') as HTMLCanvasElement;
const game = new Game(canvas);
game.errors = errors;
const hook = installHarness(game);

game
	.boot()
	.then(() => {
		game.path.renderer.setAnimationLoop(() => {
			if (!hook.manual) game.frame();
		});
		hook.ready = true;
		game.mark('ready');
		if (config.autostart) game.start();
	})
	.catch((e: Error) => {
		// no WebGL (or it was lost while loading): say so plainly instead of an endless loading bar
		game.progress(0, t.noWebgl);
		document.getElementById('veil')?.classList.add('failed');
		console.error('boot failed', e);
	});
