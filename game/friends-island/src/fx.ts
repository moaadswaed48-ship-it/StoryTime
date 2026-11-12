// Cute effects: hatch poofs and shell bits, hearts for breeding, sparkles for mutations, dust for hops and big steps.
import * as THREE from 'three';
import type { RenderPath } from './render/types';
import { ParticleSystem, radialTexture } from './vfx/particles';

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
	const c = document.createElement('canvas');
	c.width = c.height = size;
	const g = c.getContext('2d')!;
	draw(g, size);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.NoColorSpace;
	t.magFilter = THREE.LinearFilter;
	t.minFilter = THREE.LinearFilter;
	return t;
}

export class FX {
	readonly root = new THREE.Group();
	readonly hearts: ParticleSystem;
	readonly stars: ParticleSystem;
	readonly puffs: ParticleSystem;
	readonly bits: ParticleSystem;
	constructor(path: RenderPath) {
		const heart = canvasTexture(64, (g, s) => {
			g.fillStyle = '#fff';
			g.beginPath();
			const x = s / 2,
				y = s * 0.3;
			g.moveTo(x, s * 0.85);
			g.bezierCurveTo(s * 0.05, s * 0.55, s * 0.08, y - s * 0.22, x, y);
			g.bezierCurveTo(s * 0.92, y - s * 0.22, s * 0.95, s * 0.55, x, s * 0.85);
			g.fill();
		});
		const star = canvasTexture(64, (g, s) => {
			g.fillStyle = '#fff';
			g.beginPath();
			for (let i = 0; i < 8; i++) {
				const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
				const r = i % 2 === 0 ? s * 0.48 : s * 0.15;
				g.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r);
			}
			g.fill();
		});
		this.hearts = new ParticleSystem(path, 256, 'alpha', heart, 'hearts');
		this.stars = new ParticleSystem(path, 512, 'additive', star, 'stars');
		this.puffs = new ParticleSystem(path, 512, 'alpha', radialTexture(64, 1.6), 'puffs');
		this.bits = new ParticleSystem(path, 256, 'alpha', radialTexture(32, 0.4), 'bits');
		this.root.add(this.puffs.mesh, this.bits.mesh, this.hearts.mesh, this.stars.mesh);
	}

	hatch(at: THREE.Vector3, size: number, color: THREE.ColorRepresentation) {
		const s = Math.max(0.4, size);
		this.puffs.emit({ count: 14, at, cone: Math.PI, speed: [0.6 * s, 1.8 * s], life: [0.5, 0.9], size: [0.18 * s, 0.32 * s], grow: 2.2, color: '#ffffff', alpha: 0.85, drag: 4, gravity: -0.3, jitter: 0.1 * s, spin: 1 });
		this.bits.emit({ count: 16, at, cone: 1.0, dir: new THREE.Vector3(0, 1, 0), speed: [1.5 * s, 3.5 * s], life: [0.6, 1.0], size: [0.04 * s, 0.07 * s], color: '#fff6e6', alpha: 1, gravity: 9, drag: 0.6 });
		this.stars.emit({ count: 10, at, cone: Math.PI, speed: [1, 3 * s], life: [0.4, 0.8], size: [0.08 * s, 0.14 * s], color, intensity: 1.6, drag: 2, spin: 3 });
	}

	love(at: THREE.Vector3, size = 1) {
		const s = Math.max(0.5, size);
		this.hearts.emit({ count: 9, at, cone: 0.7, dir: new THREE.Vector3(0, 1, 0), speed: [0.6, 1.4], life: [1.1, 1.8], size: [0.16 * s, 0.26 * s], grow: 1.2, color: '#ff5d8f', colorEnd: '#ff9ec2', alpha: 1, drag: 1.2, gravity: -0.4, jitter: 0.25 * s, spin: 0.6, fadeIn: 0.1 });
	}

	sparkle(at: THREE.Vector3, size = 1, color: THREE.ColorRepresentation = '#ffe27a') {
		const s = Math.max(0.5, size);
		this.stars.emit({ count: 22, at, cone: Math.PI, speed: [0.5, 2.2 * s], life: [0.5, 1.0], size: [0.07 * s, 0.13 * s], color, colorEnd: '#9ff2ff', intensity: 1.8, drag: 2.5, gravity: -0.3, jitter: 0.3 * s, spin: 4 });
	}

	dust(at: THREE.Vector3, strength: number, size: number) {
		const s = Math.max(0.3, size);
		this.puffs.emit({ count: Math.round(2 + strength * 4), at, cone: 1.3, dir: new THREE.Vector3(0, 1, 0), speed: [0.3 * s, 0.9 * s], life: [0.4, 0.7], size: [0.08 * s, 0.15 * s], grow: 2, color: '#e9e2c8', alpha: 0.4 * strength, drag: 4, gravity: 0.2, jitter: 0.06 * s, spin: 1 });
	}

	note(at: THREE.Vector3) {
		this.stars.emit({ count: 4, at, cone: 0.5, dir: new THREE.Vector3(0, 1, 0), speed: [0.5, 1], life: [0.6, 0.9], size: [0.06, 0.1], color: '#ffffff', intensity: 1.4, drag: 1, gravity: -0.5, spin: 2 });
	}

	update(dt: number, cam: THREE.Camera) {
		this.hearts.update(dt, cam);
		this.stars.update(dt, cam);
		this.puffs.update(dt, cam);
		this.bits.update(dt, cam);
	}

	get alive() {
		return this.hearts.alive + this.stars.alive + this.puffs.alive + this.bits.alive;
	}
}
