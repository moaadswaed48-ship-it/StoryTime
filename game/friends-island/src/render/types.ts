// The contract both render paths implement. Game code only talks to this, never to a renderer directly,
// so the same scene, materials and particles run on WebGLRenderer+pmndrs and WebGPURenderer+TSL.
import type { Camera, Material, Scene, Texture } from 'three';
import type { QualityName } from '../config';
type RendererKind = 'webgl';

/** The graded post chain's live values. Both paths copy these into their uniforms every frame. */
export interface Grade {
	exposure: number;
	whiteBalance: [number, number, number];
	saturation: number;
	splitHighlights: [number, number, number];
	splitShadows: [number, number, number];
	/** 0..1 mix toward a smoothstep S-curve (applied in display space). */
	curve: number;
	vignette: number;
	bloom: { enabled: boolean; strength: number; radius: number; threshold: number; tint: [number, number, number] };
	/** Radial chromatic aberration, UV units at the frame edge. `aberrationPulse` is added by juice. */
	aberration: number;
	aberrationPulse: number;
	/** Full-screen flash: colour and amount 0..1 (juice). */
	flash: [number, number, number];
	flashAmount: number;
}

export interface ParticleMaterialOptions {
	map: Texture;
	blending: 'additive' | 'alpha';
	/** Soft depth write off etc. are always set; this toggles depthTest (off for muzzle flash on top). */
	depthTest?: boolean;
}

export interface RenderPath {
	kind: RendererKind;
	/** What actually runs, e.g. "WebGPU", "WebGL2 (WebGPURenderer fallback)", "WebGL2 (WebGLRenderer)". */
	backend: string;
	canvas: HTMLCanvasElement;
	// biome-ignore lint: the concrete renderer type differs per path
	renderer: any;
	grade: Grade;
	setSize(width: number, height: number, pixelRatio: number): void;
	setQuality(q: QualityName): void;
	setCamera(camera: Camera): void;
	setScene(scene: Scene): void;
	render(dt: number): void;
	/** Compile every pipeline in the scene (call behind the title veil). */
	compile(scene: Scene, camera: Camera): Promise<void>;
	/** Unlit, per-instance alpha (`aAlpha` InstancedBufferAttribute) + instanceColor particle material. */
	particleMaterial(opts: ParticleMaterialOptions): Material;
	/** Prefiltered environment from a scene (the env probe). */
	envFromScene(scene: Scene, position?: [number, number, number], size?: number): Texture;
	stats(): { calls: number; triangles: number };
	/** Draw the current frame into a small 2D canvas and report whether it is one flat colour. */
	isFlat(): Promise<{ flat: boolean; spread: number }>;
}

export function defaultGrade(): Grade {
	return {
		exposure: 0.88,
		whiteBalance: [1.17, 0.93, 0.8],
		saturation: 1.25,
		splitHighlights: [0.06, 0.028, -0.035],
		splitShadows: [-0.03, 0.012, 0.045],
		curve: 0.38,
		vignette: 0.2,
		bloom: { enabled: true, strength: 0.16, radius: 0.6, threshold: 0.85, tint: [1, 0.82, 0.6] },
		aberration: 0.0016,
		aberrationPulse: 0,
		flash: [1, 1, 1],
		flashAmount: 0,
	};
}
