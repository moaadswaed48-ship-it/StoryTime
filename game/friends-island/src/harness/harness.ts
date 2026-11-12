// A small hook for tests and screenshots: window.__game gives the state, steps frames by hand and starts play.
import { time } from '../core/time';
import type { Game } from '../game';

export interface GameHook {
	ready: boolean;
	/** true while a test is stepping frames itself */
	manual: boolean;
	state(): ReturnType<Game['state']>;
	step(n?: number): ReturnType<Game['state']>;
	play(): void;
	start(): void;
	events(n?: number): Game['events'];
	errors: string[];
	game: Game;
}

export function installErrorCapture(): string[] {
	const errors: string[] = [];
	addEventListener('error', (e) => errors.push(`error: ${e.message}`));
	addEventListener('unhandledrejection', (e) => errors.push(`unhandledrejection: ${String((e as PromiseRejectionEvent).reason)}`));
	const orig = console.error.bind(console);
	console.error = (...args: unknown[]) => {
		errors.push(args.map(String).join(' ').slice(0, 300));
		orig(...args);
	};
	return errors;
}

export function installHarness(game: Game): GameHook {
	const hook: GameHook = {
		ready: false,
		manual: false,
		state: () => game.state(),
		step(n = 1) {
			hook.manual = true;
			const wasFixed = time.fixed;
			time.fixed = true;
			for (let i = 0; i < n; i++) game.frame();
			time.fixed = wasFixed;
			return game.state();
		},
		play() {
			hook.manual = false;
			time.resync();
		},
		start: () => game.start(),
		events: (n = 50) => game.events.slice(-n),
		errors: game.errors,
		game,
	};
	(window as unknown as { __game: GameHook }).__game = hook;
	return hook;
}
