// Small helpers shared by both render paths.
import type { QualityName } from '../config';

export interface Tier {
	pixelRatio: number;
	shadowMapSize: number;
	msaa: number;
	bloom: boolean;
	aberration: boolean;
}

export const TIERS: Record<QualityName, Tier> = {
	low: { pixelRatio: 1, shadowMapSize: 1024, msaa: 0, bloom: false, aberration: false },
	medium: { pixelRatio: 1.25, shadowMapSize: 2048, msaa: 0, bloom: true, aberration: true },
	high: { pixelRatio: 1.5, shadowMapSize: 4096, msaa: 4, bloom: true, aberration: true },
};

/**
 * Samples the canvas right after a render (same task, so it works without preserveDrawingBuffer and
 * with WebGPU's current texture). Returns the luminance spread of a 32x18 thumbnail.
 */
export function sampleCanvas(canvas: HTMLCanvasElement): { flat: boolean; spread: number } {
	const c = document.createElement('canvas');
	c.width = 32;
	c.height = 18;
	const g = c.getContext('2d', { willReadFrequently: true });
	if (!g) return { flat: true, spread: 0 };
	g.drawImage(canvas, 0, 0, 32, 18);
	const px = g.getImageData(0, 0, 32, 18).data;
	let lo = 255,
		hi = 0;
	for (let i = 0; i < px.length; i += 4) {
		const l = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
		if (l < lo) lo = l;
		if (l > hi) hi = l;
	}
	return { flat: hi - lo < 6, spread: Math.round(hi - lo) };
}

/** A one-shot request resolved by the path right after its next render. */
export class FlatProbe {
	private waiters: Array<(r: { flat: boolean; spread: number }) => void> = [];
	request(): Promise<{ flat: boolean; spread: number }> {
		return new Promise((r) => this.waiters.push(r));
	}
	afterRender(canvas: HTMLCanvasElement) {
		if (!this.waiters.length) return;
		const r = sampleCanvas(canvas);
		for (const w of this.waiters.splice(0)) w(r);
	}
}
