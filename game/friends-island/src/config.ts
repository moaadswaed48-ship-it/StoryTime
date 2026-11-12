// Runtime flags, read once from the URL.
//   ?lang=ar|en                     language (Arabic by default; the StoryTime site passes its own)
//   ?embed=1                        running inside the StoryTime site: leaves room for its close button, offers "leave"
//   ?p=<id>                         whose progress this is (one save per child profile)
//   ?quality=low|medium|high|auto   quality tier (default auto: phones start low)
//   ?seed=123                       world seed (and Math.random)
//   ?clock=fixed                    every frame advances exactly 1/60 s (deterministic captures)
//   ?debug=1                        perf overlay
//   ?autostart=1                    skip the title (tests)
//   ?fresh=1                        ignore the saved progress for this visit (tests)
export type QualityName = 'low' | 'medium' | 'high';

const q = new URLSearchParams(location.search);
const pick = <T extends string>(v: string | null, allowed: readonly T[], fallback: T): T =>
	v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

function storedLang(): string | null {
	try {
		return localStorage.getItem('st:lang');
	} catch {
		return null;
	}
}

export const config = {
	lang: pick(q.get('lang') ?? storedLang(), ['ar', 'en'] as const, 'ar'),
	embed: q.has('embed'),
	profile: (q.get('p') ?? 'me').replace(/[^\w-]/g, '').slice(0, 40) || 'me',
	quality: pick(q.get('quality'), ['low', 'medium', 'high', 'auto'] as const, 'auto'),
	seed: Number.parseInt(q.get('seed') ?? '', 10) || Math.floor(Math.random() * 1e6),
	seeded: q.has('seed'),
	fixedClock: q.get('clock') === 'fixed',
	debug: q.has('debug'),
	autostart: q.has('autostart'),
	fresh: q.has('fresh'),
	/** a phone or tablet: start on the light tier, show the touch controls */
	touch: typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
	reduceMotion: q.has('reduce-motion') || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches),
};
