// Worker: genome code -> plan -> surface-net mesh, and visible mutations (they decode and compare bodies, ~100 ms).
// Runs off the main thread so hatching and mutating never hitch.
import { mutateVisible, type Strength } from './evolve.ts';
import { planFromCode } from './codes.ts';
import { decode, encode } from './genome.ts';
import { meshPlan } from './mesher.ts';

type Job = { id: number; code: string; type?: 'mesh' } | { id: number; type: 'mutate'; code: string; seed: number; strength: Strength };

self.onmessage = (e: MessageEvent<Job>) => {
	const job = e.data;
	try {
		if (job.type === 'mutate') {
			const r = mutateVisible(decode(job.code), job.seed, job.strength);
			(self as unknown as Worker).postMessage({ id: job.id, mutation: { code: encode(r.genes), changes: r.changes, touched: r.touched } });
			return;
		}
		const plan = planFromCode(job.code);
		const m = meshPlan(plan);
		(self as unknown as Worker).postMessage({ id: job.id, mesh: m }, [m.positions.buffer, m.normals.buffer, m.colors.buffer, m.skinIndex.buffer, m.skinWeight.buffer, m.pat.buffer, m.patColor.buffer, m.index.buffer]);
	} catch (err) {
		(self as unknown as Worker).postMessage({ id: job.id, error: String(err) });
	}
};
