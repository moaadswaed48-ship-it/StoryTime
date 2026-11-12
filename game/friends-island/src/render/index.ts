// This game runs on the classic WebGLRenderer + pmndrs path (its stylised materials patch three's GLSL chunks).
import type { Camera, Scene } from 'three';
import type { RenderPath } from './types';

export async function createRenderPath(canvas: HTMLCanvasElement, scene: Scene, camera: Camera): Promise<RenderPath> {
	const { createWebGLPath } = await import('./webgl');
	return createWebGLPath(canvas, scene, camera);
}

export type { Grade, RenderPath } from './types';
