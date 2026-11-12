// Mutation visibility test: 100 mutations (50 subtle, 50 wild) of random parents. For each, rasterise the rest-pose
// silhouette of parent and child (side and front views: body SDF, legs as thick lines, tails, horns are in the SDF)
// and measure 1 - IoU. Every mutation must clear a minimum visible change.
//   node --experimental-strip-types tests/mutation-test.ts [count]
import { buildPlan, type Plan } from '../src/creature/build.ts';
import { mutateVisible, silhouetteDiff } from '../src/creature/evolve.ts';
import { fromSeed } from '../src/creature/genome.ts';

const N = Number(process.argv[2] ?? 100);
const MIN = 0.05;
const G = 72;

const diff = (a: Plan, b: Plan) => silhouetteDiff(a, b, G);

const rows: Array<{ seed: number; strength: string; diff: number; changes: string[] }> = [];
for (let i = 0; i < N; i++) {
	const strength = i % 2 === 0 ? 'subtle' : 'wild';
	const parent = fromSeed(1000 + i);
	const m = mutateVisible(parent, 77 + i * 13, strength);
	const d = diff(buildPlan(parent), buildPlan(m.genes));
	rows.push({ seed: 1000 + i, strength, diff: +d.toFixed(3), changes: m.changes });
}
const bad = rows.filter((r) => r.diff < MIN);
const by = (s: string) => rows.filter((r) => r.strength === s).map((r) => r.diff).sort((a, b) => a - b);
const med = (a: number[]) => a[Math.floor(a.length / 2)];
for (const r of rows.slice(0, 10)) console.log(r.seed, r.strength.padEnd(6), r.diff.toFixed(3), r.changes.join(', '));
console.log(`\n${N} mutations: silhouette change (1 - IoU) subtle median ${med(by('subtle'))} min ${by('subtle')[0]}, wild median ${med(by('wild'))} min ${by('wild')[0]}`);
console.log(`below the visible minimum ${MIN}: ${bad.length}`, bad.slice(0, 5).map((r) => `${r.seed} ${r.strength} ${r.diff} [${r.changes.join(', ')}]`));
console.log(`empty diffs: ${rows.filter((r) => !r.changes.length).length}; mean changes subtle ${(rows.filter((r) => r.strength === 'subtle').reduce((s, r) => s + r.changes.length, 0) / (N / 2)).toFixed(2)}, wild ${(rows.filter((r) => r.strength === 'wild').reduce((s, r) => s + r.changes.length, 0) / (N / 2)).toFixed(2)}`);
process.exit(bad.length ? 1 : 0);
