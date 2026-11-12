// Palette system. Colours are picked in OKLCH (perceptual lightness, chroma, hue), so every creature's body,
// belly, accent and horn colours sit at controlled lightness and chroma steps and never go muddy or neon.
// Pure functions, no three.js: the mesher worker and Node tests use them too.

export type RGB = [number, number, number];

/** OKLab -> linear sRGB (Björn Ottosson's matrices). */
function oklabToLinear(L: number, a: number, b: number): RGB {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;
	const l = l_ * l_ * l_,
		m = m_ * m_ * m_,
		s = s_ * s_ * s_;
	return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

/** OKLCH -> linear sRGB, reducing chroma until the colour is inside the sRGB gamut. h in degrees. */
export function oklch(L: number, C: number, h: number): RGB {
	const hr = (h * Math.PI) / 180;
	for (let c = C; c >= 0; c -= 0.005) {
		const rgb = oklabToLinear(L, c * Math.cos(hr), c * Math.sin(hr));
		if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) return rgb.map((v) => Math.min(1, Math.max(0, v))) as RGB;
	}
	const g = oklabToLinear(L, 0, 0);
	return g.map((v) => Math.min(1, Math.max(0, v))) as RGB;
}

export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const linearToHex = (c: RGB) => {
	const s = (v: number) => {
		const x = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
		return Math.round(Math.min(1, Math.max(0, x)) * 255)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${s(c[0])}${s(c[1])}${s(c[2])}`;
};

export interface Palette {
	body: RGB;
	belly: RGB;
	accent: RGB;
	pattern: RGB;
	horn: RGB;
	foot: RGB;
	mouth: RGB;
	tongue: RGB;
	blush: RGB;
	beak: RGB;
	nose: RGB;
	/** Hue in degrees, for naming ("Teal", "Coral"...). */
	hue: number;
}

/**
 * Builds a palette from genes in 0..1. Schemes: analogous, complementary, split, triad, tonal.
 * Body lightness 0.62-0.78 and chroma 0.11-0.17 keep every creature in the bright, glossy toy range.
 */
export function makePalette(hueG: number, schemeG: number, chromaG: number, lightG: number): Palette {
	// Hues spread over the wheel but sample less of the muddy olive band (85-105) by remapping.
	let hue = hueG * 360;
	if (hue > 80 && hue < 110) hue = 80 + (hue - 80) * 0.35 + (hue > 95 ? 20 : 0);
	// richer, more saturated bodies (clean colour fields read better than pastels under the satin finish)
	const L = 0.6 + lightG * 0.13;
	const C = 0.13 + chromaG * 0.07;
	const schemes = [30, 180, 150, 120, 0];
	const scheme = schemes[Math.min(schemes.length - 1, Math.floor(schemeG * schemes.length))];
	const accentHue = (hue + (scheme === 0 ? 0 : scheme) + 360) % 360;
	const body = oklch(L, C, hue);
	const belly = oklch(Math.min(0.9, L + 0.13), C * 0.6, hue + 8);
	const accent = scheme === 0 ? oklch(L - 0.2, C * 1.1, hue - 6) : oklch(Math.max(0.55, L - 0.04), C * 1.15, accentHue);
	const pattern = scheme === 0 ? oklch(L - 0.16, C * 1.05, hue + 4) : oklch(L - 0.1, C * 1.1, (hue + scheme * 0.5 + 360) % 360);
	const horn = chromaG > 0.55 ? oklch(0.93, 0.035, 85) : oklch(Math.max(0.5, L - 0.22), C * 0.6, accentHue);
	const foot = oklch(Math.max(0.5, L - 0.13), C * 0.95, hue - 4);
	return {
		body,
		belly,
		accent,
		pattern,
		horn,
		foot,
		mouth: oklch(0.24, 0.075, 15),
		tongue: oklch(0.7, 0.14, 8),
		blush: oklch(Math.min(0.85, L + 0.06), 0.13, 5),
		beak: oklch(0.8, 0.15, 75),
		nose: oklch(0.32, 0.04, hue),
		hue,
	};
}

const HUE_NAMES: Array<[number, string]> = [
	[15, 'Coral'],
	[40, 'Tangerine'],
	[70, 'Honey'],
	[100, 'Moss'],
	[135, 'Mint'],
	[165, 'Jade'],
	[195, 'Teal'],
	[225, 'Sky'],
	[255, 'Cobalt'],
	[285, 'Grape'],
	[315, 'Orchid'],
	[345, 'Rose'],
	[361, 'Coral'],
];
export const hueName = (h: number) => HUE_NAMES.find(([lim]) => h < lim)?.[1] ?? 'Coral';
