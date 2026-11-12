// A small pool of mesher workers with a cache (the same genome always meshes the same way).
import * as THREE from 'three';
import type { MeshData } from './mesher';

export class MeshPool {
	private workers: Worker[] = [];
	private busy: number[] = [];
	private queue: Array<Record<string, unknown> & { id: number }> = [];
	// biome-ignore lint: results are mesh data or mutation results
	private pending = new Map<number, { resolve: (m: any) => void; reject: (e: Error) => void; code: string; worker: number }>();
	private cache = new Map<string, THREE.BufferGeometry>();
	private nextId = 1;
	stats = { meshed: 0, totalMs: 0, maxMs: 0 };

	constructor(n = Math.max(2, Math.min(4, (navigator.hardwareConcurrency || 4) - 1))) {
		for (let i = 0; i < n; i++) {
			const w = new Worker(new URL('./mesh.worker.ts', import.meta.url), { type: 'module' });
			w.onmessage = (e) => this.done(i, e.data);
			w.onerror = (e) => {
				e.preventDefault();
				for (const [id, p] of this.pending) if (p.worker === i) {
					this.pending.delete(id);
					p.reject(new Error(e.message));
				}
				this.busy[i] = 0;
				this.pump();
			};
			this.workers.push(w);
			this.busy.push(0);
		}
	}

	geometry(code: string): Promise<THREE.BufferGeometry> {
		const hit = this.cache.get(code);
		if (hit) return Promise.resolve(hit);
		return new Promise<MeshData>((resolve, reject) => {
			const id = this.nextId++;
			this.pending.set(id, { resolve, reject, code, worker: -1 });
			this.queue.push({ id, code });
			this.pump();
		}).then((m) => {
			const g = toGeometry(m);
			this.cache.set(code, g);
			this.stats.meshed++;
			this.stats.totalMs += m.stats.ms;
			this.stats.maxMs = Math.max(this.stats.maxMs, m.stats.ms);
			g.userData.stats = m.stats;
			return g;
		});
	}

	/** A visible mutation, computed in a worker. */
	mutate(code: string, seed: number, strength: 'subtle' | 'wild'): Promise<{ code: string; changes: string[]; touched: string[] }> {
		return new Promise((resolve, reject) => {
			const id = this.nextId++;
			this.pending.set(id, { resolve, reject, code, worker: -1 });
			this.queue.unshift({ id, code, type: 'mutate', seed, strength });
			this.pump();
		});
	}

	private pump() {
		for (let i = 0; i < this.workers.length && this.queue.length; i++) {
			if (this.busy[i]) continue;
			const job = this.queue.shift()!;
			const p = this.pending.get(job.id);
			if (!p) continue;
			p.worker = i;
			this.busy[i] = job.id;
			this.workers[i].postMessage(job);
		}
	}

	private done(i: number, data: { id: number; mesh?: MeshData; mutation?: unknown; error?: string }) {
		this.busy[i] = 0;
		const p = this.pending.get(data.id);
		this.pending.delete(data.id);
		if (p) {
			if (data.mesh) p.resolve(data.mesh);
			else if (data.mutation) p.resolve(data.mutation);
			else p.reject(new Error(data.error ?? 'mesh failed'));
		}
		this.pump();
	}

	get queued() {
		return this.queue.length + this.pending.size;
	}
}

export function toGeometry(m: MeshData): THREE.BufferGeometry {
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
	g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
	g.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
	g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(m.skinIndex, 4));
	g.setAttribute('skinWeight', new THREE.BufferAttribute(m.skinWeight, 4));
	g.setAttribute('aPat', new THREE.BufferAttribute(m.pat, 4));
	g.setAttribute('aPatC', new THREE.BufferAttribute(m.patColor, 4));
	g.setIndex(new THREE.BufferAttribute(m.index, 1));
	g.computeBoundingSphere();
	return g;
}
