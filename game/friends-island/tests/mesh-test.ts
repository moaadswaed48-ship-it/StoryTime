// Node test: build + mesh many seeds, report timing, components, winding and attachment checks.
//   node --experimental-strip-types tests/mesh-test.ts [count]
import { fromSeed } from '../src/creature/genome.ts';
import { buildPlan } from '../src/creature/build.ts';
import { meshPlan } from '../src/creature/mesher.ts';
import { field } from '../src/creature/sdf.ts';

const count = Number(process.argv[2] ?? 40);
let worst = { ms: 0 };
const kinds: Record<string, number> = {};
let bad = 0;
const times: number[] = [];
for (let s = 1; s <= count; s++) {
	const plan = buildPlan(fromSeed(s));
	kinds[plan.kind] = (kinds[plan.kind] ?? 0) + 1;
	const m = meshPlan(plan);
	times.push(m.stats.ms);
	// winding: geometric normal vs vertex normal
	let agree = 0;
	const P = m.positions, N = m.normals, I = m.index;
	for (let t = 0; t < I.length; t += 3) {
		const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
		const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
		const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
		const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
		if (nx * N[a] + ny * N[a + 1] + nz * N[a + 2] > 0) agree++;
	}
	const wind = agree / (I.length / 3);
	// attachments: eyes sit on the skin, hips/anchors inside
	const solid = plan.parts.filter((p) => p.op !== 'paint');
	let eyeBad = 0, hipBad = 0, anchorBad = 0;
	for (const e of plan.eyes) if (e.stalk < 0) { const d = field(solid, ...e.pos); if (d > e.r * 0.6 || d < -e.r * 0.2) eyeBad++; }
	for (const l of plan.legs) if (field(solid, ...l.hip) > 0) hipBad++;
	for (const c of plan.chains) if (field(solid, ...c.anchor) > 0) anchorBad++;
	for (const a of plan.arms) if (field(solid, ...a.shoulder) > 0) anchorBad++;
	const lowest = Math.min(...solid.filter((p) => p.op === 'add').map((p) => p.bc![1] - p.br!));
	const flag = m.stats.components !== 1 || wind < 0.98 || eyeBad || hipBad || anchorBad;
	if (flag) bad++;
	if (flag || s <= 12) console.log(`seed ${s} ${plan.name} (${plan.species}) kind ${plan.kind} S ${plan.size.toFixed(2)} L ${plan.legLength.toFixed(2)} h ${plan.height.toFixed(2)} grid ${m.stats.nx}x${m.stats.ny}x${m.stats.nz} cell ${(m.stats.cell*100).toFixed(1)}cm ${m.stats.ms}ms v${m.stats.verts} comp ${m.stats.components} wind ${wind.toFixed(3)} eyesBad ${eyeBad}/${plan.eyes.length} hipBad ${hipBad} anchorBad ${anchorBad} lowestPartBound ${lowest.toFixed(2)} traits ${plan.traits.join(', ')}`);
}
times.sort((a, b) => a - b);
console.log('kinds', kinds, 'bad', bad, 'mesh ms p50', times[times.length >> 1], 'p95', times[Math.floor(times.length * 0.95)], 'max', times[times.length - 1]);
